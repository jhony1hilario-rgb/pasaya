// ==============================================================================
// SISTEMA PASAYA - CAPA DE SERVICIOS Y CONTROLADOR FRONTEND
// Laboratorio 13: Comunicación Frontend-Backend con API Simulada
// ==============================================================================

// URL Base del servidor de datos
// Detección automática y flexible de la API (100% relativa / sin rutas absolutas):
// - Si se ejecuta desde un servidor HTTP local en el puerto 3000, usa el origen relativo actual.
// - Si se abre directamente como archivo local (file://) o desde otro puerto de desarrollo, apunta a http://localhost:3000
const API_BASE_URL = (typeof window !== 'undefined' && window.location.protocol.startsWith('http'))
  ? window.location.origin
  : 'http://localhost:3000';

let currentUser = {
  id: 'usr-2',
  nombres: 'Carlos',
  apellidos: 'Ramos Valencia',
  rol: 'operador',
  email: 'operador@pasaya.pe'
};

// ------------------------------------------------------------------------------
// 1. CAPA DE SERVICIOS (Llamadas Fetch Centralizadas)
// ------------------------------------------------------------------------------
const ApiService = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn(`Error al conectar con API mock en /${endpoint}:`, err);
      throw err;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error(`Error en POST /${endpoint}:`, err);
      throw err;
    }
  },

  async patch(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error(`Error en PATCH /${endpoint}:`, err);
      throw err;
    }
  }
};

// ------------------------------------------------------------------------------
// 2. SERVICIOS POR DOMINIO
// ------------------------------------------------------------------------------
const ViajeService = {
  async registrarCobroAbordaje({ codigo_tarjeta, unidad_id, ruta_id }) {
    // 1. Buscar tarjeta
    const tarjetas = await ApiService.get(`tarjetas?codigo_tarjeta=${encodeURIComponent(codigo_tarjeta)}`);
    if (!tarjetas || tarjetas.length === 0) {
      throw {
        error: {
          codigo: 404,
          estado: 'NOT_FOUND',
          mensaje: `La tarjeta con código ${codigo_tarjeta} no existe en el sistema.`
        }
      };
    }
    const tarjeta = tarjetas[0];

    // 2. Verificar estado de la tarjeta
    if (tarjeta.estado !== 'activa') {
      throw {
        error: {
          codigo: 409,
          estado: 'CONFLICT',
          mensaje: `Tarjeta bloqueada o anulada. Motivo: estado=${tarjeta.estado}. Abordaje denegado.`
        }
      };
    }

    // 3. Obtener tarifa de la ruta
    const tarifas = await ApiService.get(`tarifas?ruta_id=${ruta_id}&tipo_pasajero=${tarjeta.tipo_tarifa}&estado=vigente`);
    const tarifaMonto = (tarifas && tarifas.length > 0) ? tarifas[0].monto : (tarjeta.tipo_tarifa === 'estudiante' ? 0.70 : 1.50);

    // 4. Regla de negocio crítica: Saldo suficiente (Conflicto 409)
    // SIMULACIÓN: reemplazar en el Laboratorio 5 con validación en base de datos PostgreSQL
    if (tarjeta.saldo < tarifaMonto) {
      throw {
        error: {
          codigo: 409,
          estado: 'CONFLICT',
          mensaje: `Saldo insuficiente. Tarifa requerida: S/ ${tarifaMonto.toFixed(2)}, Saldo disponible: S/ ${tarjeta.saldo.toFixed(2)}`,
          detalles: [{ campo: 'saldo', esperado: tarifaMonto, actual: tarjeta.saldo }]
        }
      };
    }

    // 5. Débito atómico
    const nuevoSaldo = Number((tarjeta.saldo - tarifaMonto).toFixed(2));
    await ApiService.patch(`tarjetas/${tarjeta.id}`, { saldo: nuevoSaldo });

    // 6. Registrar viaje
    const nuevoViaje = {
      tarjeta_id: tarjeta.id,
      codigo_tarjeta: tarjeta.codigo_tarjeta,
      unidad_id,
      ruta_id,
      tarifa_monto: tarifaMonto,
      saldo_anterior: tarjeta.saldo,
      saldo_posterior: nuevoSaldo,
      fecha_hora: new Date().toISOString(),
      estado: 'exitoso'
    };

    const viajeCreado = await ApiService.post('viajes', nuevoViaje);
    return { viaje: viajeCreado, nuevoSaldo };
  }
};

const RecargaService = {
  async abonarSaldo({ tarjeta_id, punto_recarga_id, monto }) {
    if (monto <= 0 || monto > 100) {
      throw {
        error: {
          codigo: 400,
          estado: 'BAD_REQUEST',
          mensaje: 'El monto de recarga debe ser mayor a S/ 0.00 y menor o igual a S/ 100.00.'
        }
      };
    }

    const tarjeta = await ApiService.get(`tarjetas/${tarjeta_id}`);
    const saldoPosterior = Number((tarjeta.saldo + monto).toFixed(2));

    if (saldoPosterior > 300) {
      throw {
        error: {
          codigo: 409,
          estado: 'CONFLICT',
          mensaje: `El saldo acumulado no puede superar el límite legal de S/ 300.00. Saldo resultante sería S/ ${saldoPosterior.toFixed(2)}.`
        }
      };
    }

    // Actualizar tarjeta
    await ApiService.patch(`tarjetas/${tarjeta.id}`, { saldo: saldoPosterior });

    // Registrar recarga
    const registro = await ApiService.post('recargas', {
      tarjeta_id,
      punto_recarga_id,
      usuario_id: currentUser.id,
      monto,
      saldo_anterior: tarjeta.saldo,
      saldo_posterior: saldoPosterior,
      fecha_hora: new Date().toISOString()
    });

    return { registro, saldoPosterior };
  }
};

// ------------------------------------------------------------------------------
// 3. VISTAS DEL FRONTEND Y RENDERIZADO
// ------------------------------------------------------------------------------
const Views = {
  dashboard: async () => {
    try {
      const [viajes, recaudaciones, unidades] = await Promise.all([
        ApiService.get('viajes'),
        ApiService.get('recaudaciones'),
        ApiService.get('unidades')
      ]);

      const totalRecaudado = recaudaciones.reduce((acc, r) => acc + (r.monto_total || 0), 0);
      const totalViajes = viajes.length;
      const busesOperativos = unidades.filter(u => u.estado === 'operativo').length;

      return `
        <div class="grid-dashboard-metrics">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recaudación Total</p>
              <h3 class="text-3xl font-bold text-slate-800 mt-1">S/ ${totalRecaudado.toFixed(2)}</h3>
              <p class="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> +12% vs. jornada previa
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <i data-lucide="dollar-sign" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Abordajes Realizados</p>
              <h3 class="text-3xl font-bold text-slate-800 mt-1">${totalViajes}</h3>
              <p class="text-xs text-cyan-600 mt-1">100% cobro electrónico al subir</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
              <i data-lucide="users" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flota de Buses</p>
              <h3 class="text-3xl font-bold text-slate-800 mt-1">${busesOperativos} Unidades</h3>
              <p class="text-xs text-slate-500 mt-1">Concesionarias vinculadas</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <i data-lucide="bus" class="w-6 h-6"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-bold text-slate-800 text-lg">Últimos Abordajes Registrados en Tiempo Real</h4>
            <span class="text-xs text-slate-400">Transacciones sincronizadas</span>
          </div>
          <div class="overflow-x-auto" style="-webkit-overflow-scrolling: touch;">
            <table class="w-full text-left text-sm whitespace-nowrap min-w-[620px]">
              <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th class="p-3">ID Viaje</th>
                  <th class="p-3">Código Tarjeta</th>
                  <th class="p-3">Unidad</th>
                  <th class="p-3">Tarifa Debitada</th>
                  <th class="p-3">Saldo Posterior</th>
                  <th class="p-3">Fecha y Hora</th>
                  <th class="p-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${viajes.slice(-5).reverse().map(v => `
                  <tr class="hover:bg-slate-50">
                    <td class="p-3 font-mono font-medium">${v.id}</td>
                    <td class="p-3 font-semibold text-emerald-700">${v.codigo_tarjeta || v.tarjeta_id}</td>
                    <td class="p-3">${v.unidad_id}</td>
                    <td class="p-3 font-bold text-slate-800">S/ ${(v.tarifa_monto || 0).toFixed(2)}</td>
                    <td class="p-3 text-slate-600">S/ ${(v.saldo_posterior || 0).toFixed(2)}</td>
                    <td class="p-3 text-xs text-slate-400">${new Date(v.fecha_hora).toLocaleTimeString()}</td>
                    <td class="p-3"><span class="px-2 py-0.5 text-xs font-semibold rounded-full badge-active">Exitoso</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      return renderErrorState('Error al cargar datos del Dashboard desde la API simulada. Asegúrese de que npx json-server mock-api/db.json esté activo.');
    }
  },

  abordaje: async () => {
    try {
      const [unidades, rutas, tarjetas] = await Promise.all([
        ApiService.get('unidades'),
        ApiService.get('rutas'),
        ApiService.get('tarjetas?estado=activa')
      ]);

      return `
        <div class="grid-two-columns">
          <!-- Formulario Simulador de Abordaje -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <i data-lucide="smartphone-charging" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="font-bold text-lg text-slate-800">Simulador de Validador de Bus</h3>
                <p class="text-xs text-slate-500">Proceso 5: Débito automático al momento de abordar</p>
              </div>
            </div>

            <form id="formAbordaje" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">1. Unidad / Bus Operativo:</label>
                <select id="selUnidad" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:border-emerald-500 focus:outline-none min-h-[44px]">
                  ${unidades.map(u => `<option value="${u.id}">${u.padron} - Placa: ${u.placa} (Cap: ${u.capacidad_pasajeros})</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">2. Ruta de Circulación:</label>
                <select id="selRuta" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:border-emerald-500 focus:outline-none min-h-[44px]">
                  ${rutas.map(r => `<option value="${r.id}">${r.codigo_ruta}: ${r.nombre}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">3. Código de Tarjeta del Pasajero:</label>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input type="text" id="txtCodigoTarjeta" value="TARJ-1001" placeholder="Ej. TARJ-1001" class="flex-1 text-sm border border-slate-300 rounded-lg p-2.5 font-mono uppercase focus:border-emerald-500 focus:outline-none min-h-[44px]" required>
                  <button type="button" onclick="probarTarjetaSinSaldo()" class="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium min-h-[44px] flex items-center justify-center shrink-0 transition" title="Cargar tarjeta para simular error 409">
                    Probar Sin Saldo
                  </button>
                </div>
                <p class="text-xs text-slate-400 mt-1">Escriba el código o seleccione una de las tarjetas activas de prueba.</p>
              </div>

              <div class="pt-4">
                <button type="submit" id="btnValidarAbordaje" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 min-h-[48px]">
                  <i data-lucide="check-circle" class="w-5 h-5"></i> Simular Validación de Abordaje
                </button>
              </div>
            </form>
          </div>

          <!-- Monitor de Validación en Cabina -->
          <div class="bg-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                <span class="text-xs text-slate-400 uppercase font-mono tracking-widest">Pantalla del Validador a Bordo</span>
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Listo
                </span>
              </div>

              <div id="pantallaValidador" class="my-6 sm:my-8 text-center p-6 sm:p-8 rounded-xl bg-slate-950/60 border border-slate-800 min-h-[160px] sm:min-h-[180px] flex flex-col items-center justify-center">
                <i data-lucide="wifi" class="w-12 h-12 text-slate-600 mb-3 animate-pulse"></i>
                <p class="text-slate-400 text-sm">Acerque su tarjeta prepago al lector</p>
                <p class="text-xs text-slate-600 mt-1">Tarifa General: S/ 1.50 | Estudiante: S/ 0.70</p>
              </div>
            </div>

            <div class="p-3 bg-slate-800/80 rounded-lg text-xs text-slate-400">
              💡 <strong>Regla de negocio:</strong> Si el saldo es menor a la tarifa, la API devuelve HTTP 409 <em>(Conflict: Saldo insuficiente)</em> y la pantalla cambia a rojo emitiendo señal de cobro denegado.
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      return renderErrorState('Error al cargar datos para el simulador de abordaje.');
    }
  },

  recargas: async () => {
    try {
      const [tarjetas, puntos] = await Promise.all([
        ApiService.get('tarjetas'),
        ApiService.get('puntos-recarga')
      ]);

      return `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 max-w-xl mx-auto">
          <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shrink-0">
              <i data-lucide="plus-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-bold text-base sm:text-lg text-slate-800">P2: Recarga de Saldo en Efectivo</h3>
              <p class="text-xs text-slate-500">Abono instantáneo en puntos y agencias autorizadas</p>
            </div>
          </div>

          <form id="formRecarga" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Punto de Recarga:</label>
              <select id="selPuntoRecarga" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:border-cyan-500 focus:outline-none min-h-[44px]">
                ${puntos.map(p => `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Tarjeta Beneficiaria:</label>
              <select id="selTarjetaRecarga" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono focus:border-cyan-500 focus:outline-none min-h-[44px]">
                ${tarjetas.map(t => `<option value="${t.id}">${t.codigo_tarjeta} (Saldo actual: S/ ${t.saldo.toFixed(2)}) - ${t.tipo_tarifa}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Monto a Recargar (S/):</label>
              <input type="number" id="txtMontoRecarga" min="1" max="100" step="0.5" value="10.00" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800 focus:border-cyan-500 focus:outline-none min-h-[44px]" required>
              <p class="text-xs text-slate-400 mt-1">Mínimo S/ 1.00, máximo S/ 100.00 por operación.</p>
            </div>

            <button type="submit" class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 min-h-[48px]">
              <i data-lucide="check" class="w-4 h-4"></i> Procesar Recarga
            </button>
          </form>
        </div>
      `;
    } catch (err) {
      return renderErrorState('Error al cargar módulo de recargas.');
    }
  },

  pasajeros: async () => {
    try {
      const [pasajeros, tarjetas] = await Promise.all([
        ApiService.get('pasajeros'),
        ApiService.get('tarjetas')
      ]);

      return `
        <div class="space-y-4 sm:space-y-6">
          <div class="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="font-bold text-base sm:text-lg text-slate-800">P1: Padrón de Pasajeros y Tarjetas Emitidas</h3>
              <p class="text-xs text-slate-500">Gestión de usuarios del transporte y tipos de tarifa</p>
            </div>
            <button onclick="abrirModalPasajero()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow hover:shadow-md min-h-[44px] shrink-0">
              <i data-lucide="user-plus" class="w-4 h-4"></i> Nuevo Pasajero
            </button>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto" style="-webkit-overflow-scrolling: touch;">
              <table class="w-full text-left text-sm whitespace-nowrap min-w-[680px]">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th class="p-3.5">ID</th>
                    <th class="p-3.5">Documento</th>
                    <th class="p-3.5">Nombres y Apellidos</th>
                    <th class="p-3.5">Tipo Tarifa</th>
                    <th class="p-3.5">Tarjeta Vinculada</th>
                    <th class="p-3.5">Saldo</th>
                    <th class="p-3.5">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${pasajeros.map(p => {
                    const tarj = tarjetas.find(t => t.pasajero_id === p.id && t.estado === 'activa') || tarjetas.find(t => t.pasajero_id === p.id);
                    return `
                      <tr class="hover:bg-slate-50">
                        <td class="p-3.5 font-mono text-xs text-slate-400">${p.id}</td>
                        <td class="p-3.5 font-medium">${p.tipo_documento}: ${p.numero_documento}</td>
                        <td class="p-3.5 font-bold text-slate-800">${p.nombres} ${p.apellidos}</td>
                        <td class="p-3.5">
                          <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${p.tipo_tarifa === 'estudiante' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}">
                            ${p.tipo_tarifa}
                          </span>
                        </td>
                        <td class="p-3.5 font-mono font-medium text-emerald-700">${tarj ? tarj.codigo_tarjeta : 'Sin tarjeta'}</td>
                        <td class="p-3.5 font-bold">${tarj ? `S/ ${tarj.saldo.toFixed(2)}` : '-'}</td>
                        <td class="p-3.5"><span class="px-2 py-0.5 text-xs font-medium rounded-full badge-active">${p.estado}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      return renderErrorState('Error al cargar lista de pasajeros.');
    }
  },

  recaudacion: async () => {
    try {
      const recaudaciones = await ApiService.get('recaudaciones');
      return `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-base sm:text-lg text-slate-800">P6: Control y Cierres de Recaudación Diaria</h3>
              <p class="text-xs text-slate-500">Liquidación y cuadre transaccional por bus y jornada</p>
            </div>
            <span class="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg shrink-0">Filtro: Jornadas Consolidadas</span>
          </div>

          <div class="overflow-x-auto" style="-webkit-overflow-scrolling: touch;">
            <table class="w-full text-left text-sm whitespace-nowrap min-w-[650px]">
              <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th class="p-3">ID Cierre</th>
                  <th class="p-3">Unidad</th>
                  <th class="p-3">Ruta</th>
                  <th class="p-3">Fecha</th>
                  <th class="p-3">Total Viajes</th>
                  <th class="p-3">Monto Recaudado</th>
                  <th class="p-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${recaudaciones.map(r => `
                  <tr class="hover:bg-slate-50">
                    <td class="p-3 font-mono font-medium text-slate-400">${r.id}</td>
                    <td class="p-3 font-bold text-slate-700">${r.unidad_id}</td>
                    <td class="p-3">${r.ruta_id}</td>
                    <td class="p-3">${r.fecha}</td>
                    <td class="p-3 font-semibold">${r.total_viajes} pax</td>
                    <td class="p-3 font-bold text-emerald-700">S/ ${(r.monto_total || 0).toFixed(2)}</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold badge-active">${r.estado}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      return renderErrorState('Error al cargar reportes de recaudación.');
    }
  },

  reposicion: async () => {
    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 max-w-xl mx-auto">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div class="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0">
            <i data-lucide="shield-alert" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-base sm:text-lg text-slate-800">P7: Bloqueo y Reposición de Tarjeta</h3>
            <p class="text-xs text-slate-500">Inmovilización por robo o pérdida y transferencia del saldo íntegro</p>
          </div>
        </div>

        <form id="formReposicion" class="space-y-4" onsubmit="event.preventDefault(); simularReposicion();">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Tarjeta a Inmovilizar / Bloquear:</label>
            <input type="text" id="txtTarjetaBloquear" value="TARJ-1006" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono focus:border-red-500 focus:outline-none min-h-[44px]" required>
            <p class="text-xs text-slate-400 mt-1">Saldo registrado en sistema: S/ 5.00</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Motivo del Trámite:</label>
            <select class="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:border-red-500 focus:outline-none min-h-[44px]">
              <option value="robo">Robo / Hurto</option>
              <option value="perdida">Extravío / Pérdida</option>
              <option value="deterioro">Deterioro Físico</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Código de la Nueva Tarjeta Entregada:</label>
            <input type="text" id="txtTarjetaNueva" value="TARJ-1008" class="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono focus:border-emerald-500 focus:outline-none min-h-[44px]" required>
          </div>

          <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 min-h-[48px]">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Ejecutar Bloqueo y Migración de Saldo
          </button>
        </form>
      </div>
    `;
  },

  liquidaciones: async () => {
    try {
      const liquidaciones = await ApiService.get('liquidaciones');
      return `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-base sm:text-lg text-slate-800">P8: Órdenes de Liquidación a Empresas</h3>
              <p class="text-xs text-slate-500">Liquidación periódica con retención del 5% de comisión de plataforma</p>
            </div>
          </div>

          <div class="overflow-x-auto" style="-webkit-overflow-scrolling: touch;">
            <table class="w-full text-left text-sm whitespace-nowrap min-w-[750px]">
              <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th class="p-3">ID Liquidación</th>
                  <th class="p-3">Empresa Concesionaria</th>
                  <th class="p-3">Periodo</th>
                  <th class="p-3">Total Viajes</th>
                  <th class="p-3">Monto Bruto</th>
                  <th class="p-3">Comisión (5%)</th>
                  <th class="p-3">Monto Neto a Pagar</th>
                  <th class="p-3">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${liquidaciones.map(l => `
                  <tr class="hover:bg-slate-50">
                    <td class="p-3 font-mono font-medium">${l.id}</td>
                    <td class="p-3 font-bold text-slate-700">${l.empresa_id}</td>
                    <td class="p-3 text-xs text-slate-500">${l.periodo_inicio} al ${l.periodo_fin}</td>
                    <td class="p-3 font-semibold">${l.total_viajes}</td>
                    <td class="p-3">S/ ${(l.monto_bruto || 0).toFixed(2)}</td>
                    <td class="p-3 text-red-600 font-medium">- S/ ${(l.monto_comision || 0).toFixed(2)}</td>
                    <td class="p-3 font-bold text-emerald-700 text-base">S/ ${(l.monto_neto || 0).toFixed(2)}</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold ${l.estado === 'pagada' ? 'badge-active' : 'bg-amber-100 text-amber-800'}">${l.estado}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      return renderErrorState('Error al cargar liquidaciones.');
    }
  },

  flota: async () => {
    try {
      const [empresas, unidades, rutas] = await Promise.all([
        ApiService.get('empresas'),
        ApiService.get('unidades'),
        ApiService.get('rutas')
      ]);

      return `
        <div class="grid-two-columns">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 class="font-bold text-slate-800 text-lg mb-4">P3: Concesionarias y Unidades Registradas</h4>
            <div class="space-y-3">
              ${unidades.map(u => `
                <div class="p-3 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 gap-2">
                  <div class="min-w-0">
                    <span class="font-bold text-slate-800">${u.padron}</span> (Placa: <span class="font-mono text-emerald-700 font-semibold">${u.placa}</span>)
                    <p class="text-xs text-slate-400">Capacidad: ${u.capacidad_pasajeros} pasajeros</p>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-active shrink-0">${u.estado}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 class="font-bold text-slate-800 text-base sm:text-lg mb-4">P4: Rutas y Corredores Autorizados</h4>
            <div class="space-y-3">
              ${rutas.map(r => `
                <div class="p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                  <div class="flex items-center justify-between mb-1 gap-2">
                    <span class="font-bold text-slate-800 font-mono text-emerald-700">${r.codigo_ruta}</span>
                    <span class="text-xs text-slate-500 shrink-0">${r.distancia_km} km</span>
                  </div>
                  <p class="text-sm font-semibold text-slate-700">${r.nombre}</p>
                  <p class="text-xs text-slate-400 mt-1">${r.paradero_inicio} ➔ ${r.paradero_fin}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      return renderErrorState('Error al cargar información de flota.');
    }
  },

  auditoria: async () => {
    try {
      const auditoria = await ApiService.get('auditoria');
      return `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-base sm:text-lg text-slate-800">Bitácora de Eventos de Auditoría (RNF-SEG-04)</h3>
              <p class="text-xs text-slate-500">Registro inmutable de trazabilidad y seguridad</p>
            </div>
          </div>

          <div class="overflow-x-auto" style="-webkit-overflow-scrolling: touch;">
            <table class="w-full text-left text-sm font-mono text-xs whitespace-nowrap min-w-[700px]">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th class="p-3">ID</th>
                  <th class="p-3">Usuario</th>
                  <th class="p-3">Acción</th>
                  <th class="p-3">Entidad</th>
                  <th class="p-3">Detalle / Payload</th>
                  <th class="p-3">Marca de Tiempo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${auditoria.map(a => `
                  <tr class="hover:bg-slate-50">
                    <td class="p-3 text-slate-400">${a.id}</td>
                    <td class="p-3 font-semibold text-indigo-700">${a.usuario_id}</td>
                    <td class="p-3 font-bold text-slate-800">${a.accion}</td>
                    <td class="p-3 text-emerald-700">${a.entidad}</td>
                    <td class="p-3 text-slate-600">${typeof a.detalles === 'object' ? JSON.stringify(a.detalles) : a.detalles}</td>
                    <td class="p-3 text-slate-400">${new Date(a.fecha_hora).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      return renderErrorState('Error al cargar registros de auditoría.');
    }
  }
};

function renderErrorState(msg) {
  return `
    <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 sm:p-6 rounded-2xl text-center">
      <i data-lucide="alert-triangle" class="w-8 h-8 text-amber-600 mx-auto mb-2"></i>
      <h4 class="font-bold text-base">Error de Conexión o Datos</h4>
      <p class="text-xs mt-1">${msg}</p>
      <div class="mt-4">
        <code class="text-xs bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg font-mono inline-block break-all">
          Ejecutar: iniciar.bat (o: npx json-server mock-api/db.json --port 3000)
        </code>
      </div>
    </div>
  `;
}

// ------------------------------------------------------------------------------
// 4. CONTROLADOR DE NAVEGACIÓN Y RESPONSIVIDAD MÓVIL
// ------------------------------------------------------------------------------
function toggleSidebar(forceState) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('sidebar-open');
  const shouldOpen = (forceState !== undefined) ? forceState : !isOpen;

  if (shouldOpen) {
    sidebar.classList.add('sidebar-open');
    if (backdrop) backdrop.classList.add('backdrop-open');
    document.body.classList.add('overflow-hidden');
  } else {
    sidebar.classList.remove('sidebar-open');
    if (backdrop) backdrop.classList.remove('backdrop-open');
    document.body.classList.remove('overflow-hidden');
  }
  if (window.lucide) {
    lucide.createIcons();
  }
}

async function navigate(viewName) {
  // En dispositivos móviles (<= 768px), cerrar automáticamente la barra lateral al seleccionar una opción
  if (typeof toggleSidebar === 'function' && window.innerWidth <= 768) {
    toggleSidebar(false);
  }

  const container = document.getElementById('viewContainer');
  const title = document.getElementById('viewTitle');

  // Actualizar estilos activos de menú
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('text-emerald-400', 'bg-slate-800', 'font-medium');
    el.classList.add('text-slate-300');
  });

  title.innerText = viewName.toUpperCase();
  container.innerHTML = `
    <div class="flex items-center justify-center p-12 sm:p-16 text-slate-400">
      <i data-lucide="loader" class="w-8 h-8 animate-spin text-emerald-600 mr-3"></i>
      <span>Cargando datos desde la API simulada...</span>
    </div>
  `;
  lucide.createIcons();

  if (Views[viewName]) {
    container.innerHTML = await Views[viewName]();
    lucide.createIcons();
    attachViewHandlers(viewName);
  }
}

function attachViewHandlers(viewName) {
  if (viewName === 'abordaje') {
    const form = document.getElementById('formAbordaje');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const codigo = document.getElementById('txtCodigoTarjeta').value.trim();
        const unidad_id = document.getElementById('selUnidad').value;
        const ruta_id = document.getElementById('selRuta').value;
        const pantalla = document.getElementById('pantallaValidador');

        try {
          pantalla.innerHTML = `<i data-lucide="loader" class="w-10 h-10 animate-spin text-cyan-400 my-4"></i><p>Validando tarjeta...</p>`;
          lucide.createIcons();

          const res = await ViajeService.registrarCobroAbordaje({
            codigo_tarjeta: codigo,
            unidad_id,
            ruta_id
          });

          // Éxito: Cobro Aprobado (201 Created)
          pantalla.innerHTML = `
            <div class="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl animate-fade-in">
              <i data-lucide="check-circle-2" class="w-14 h-14 text-emerald-400 mx-auto mb-2"></i>
              <h3 class="text-xl font-black text-emerald-300">PAGO ACEPTADO</h3>
              <p class="text-xs text-slate-300 mt-1 font-mono">${res.viaje.codigo_tarjeta}</p>
              <p class="text-2xl font-black text-white mt-2">Tarifa: S/ ${res.viaje.tarifa_monto.toFixed(2)}</p>
              <p class="text-xs text-emerald-300 mt-1">Saldo Restante: S/ ${res.nuevoSaldo.toFixed(2)}</p>
            </div>
          `;
          showToast(`¡Abordaje Exitoso! Cobrado: S/ ${res.viaje.tarifa_monto.toFixed(2)}`, 'success');
          lucide.createIcons();
        } catch (err) {
          // Conflicto: Saldo insuficiente o tarjeta bloqueada (409 Conflict)
          const errorInfo = err.error || { mensaje: 'Error al procesar abordaje' };
          pantalla.innerHTML = `
            <div class="p-4 bg-red-950/80 border border-red-500 rounded-xl animate-shake">
              <i data-lucide="x-circle" class="w-14 h-14 text-red-500 mx-auto mb-2"></i>
              <h3 class="text-xl font-black text-red-400">COBRO RECHAZADO</h3>
              <p class="text-xs text-slate-200 mt-2 font-semibold">${errorInfo.mensaje}</p>
              <p class="text-xs text-red-300 mt-1 font-mono">Código HTTP: ${errorInfo.codigo || 409} (CONFLICT)</p>
            </div>
          `;
          showToast(errorInfo.mensaje, 'error');
          lucide.createIcons();
        }
      };
    }
  } else if (viewName === 'recargas') {
    const form = document.getElementById('formRecarga');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const tarjeta_id = document.getElementById('selTarjetaRecarga').value;
        const punto_recarga_id = document.getElementById('selPuntoRecarga').value;
        const monto = parseFloat(document.getElementById('txtMontoRecarga').value);

        try {
          const res = await RecargaService.abonarSaldo({ tarjeta_id, punto_recarga_id, monto });
          showToast(`Recarga procesada exitosamente. Nuevo saldo: S/ ${res.saldoPosterior.toFixed(2)}`, 'success');
          navigate('recargas');
        } catch (err) {
          const msg = (err.error && err.error.mensaje) || 'Error en recarga';
          showToast(msg, 'error');
        }
      };
    }
  }
}

// ------------------------------------------------------------------------------
// 5. GESTIÓN DE MODAL Y REGISTRO DE NUEVO PASAJERO (P1)
// ------------------------------------------------------------------------------
async function abrirModalPasajero() {
  const modal = document.getElementById('modalNuevoPasajero');
  if (!modal) return;

  const form = document.getElementById('formNuevoPasajero');
  if (form) form.reset();

  // Sugerir automáticamente el correlativo siguiente para la tarjeta (ej. TARJ-1007)
  try {
    const tarjetas = await ApiService.get('tarjetas');
    let maxNum = 1000;
    if (Array.isArray(tarjetas)) {
      tarjetas.forEach(t => {
        const m = t.codigo_tarjeta && t.codigo_tarjeta.match(/TARJ-(\d+)/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
    }
    const inputCodigo = document.getElementById('txtNuevoCodigoTarjeta');
    if (inputCodigo) inputCodigo.value = `TARJ-${maxNum + 1}`;
  } catch (err) {
    const inputCodigo = document.getElementById('txtNuevoCodigoTarjeta');
    if (inputCodigo && !inputCodigo.value) inputCodigo.value = 'TARJ-1007';
  }

  const inputSaldo = document.getElementById('txtNuevoSaldoInicial');
  if (inputSaldo) inputSaldo.value = '10.00';

  modal.classList.remove('hidden');
  const txtDni = document.getElementById('txtNuevoDni');
  if (txtDni) txtDni.focus();
  lucide.createIcons();
}

function cerrarModalPasajero() {
  const modal = document.getElementById('modalNuevoPasajero');
  if (modal) {
    modal.classList.add('hidden');
  }
}

async function guardarNuevoPasajero(e) {
  if (e) e.preventDefault();

  const dni = document.getElementById('txtNuevoDni').value.trim();
  const nombres = document.getElementById('txtNuevoNombres').value.trim();
  const apellidos = document.getElementById('txtNuevoApellidos').value.trim();
  const tipo_tarifa = document.getElementById('selNuevoTipoTarifa').value;
  const codigo_tarjeta = document.getElementById('txtNuevoCodigoTarjeta').value.trim().toUpperCase();
  const saldoRaw = document.getElementById('txtNuevoSaldoInicial').value;
  const saldo_inicial = parseFloat(saldoRaw);
  const btnGuardar = document.getElementById('btnGuardarPasajero');

  // Validaciones de formulario
  if (!dni || !nombres || !apellidos || !codigo_tarjeta) {
    showToast('Por favor complete todos los campos obligatorios.', 'error');
    return;
  }

  if (!/^\d{8}$/.test(dni)) {
    showToast('El DNI debe contener exactamente 8 dígitos numéricos.', 'error');
    document.getElementById('txtNuevoDni').focus();
    return;
  }

  if (isNaN(saldo_inicial) || saldo_inicial < 0 || saldo_inicial > 300) {
    showToast('El saldo inicial debe ser un monto válido entre S/ 0.00 y S/ 300.00.', 'error');
    document.getElementById('txtNuevoSaldoInicial').focus();
    return;
  }

  // Estado visual de carga
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Guardando...`;
    lucide.createIcons();
  }

  try {
    // 1. Validar si el DNI ya existe en la base de datos
    const existentes = await ApiService.get(`pasajeros?numero_documento=${encodeURIComponent(dni)}`);
    if (existentes && existentes.length > 0) {
      showToast(`El DNI ${dni} ya se encuentra registrado a nombre de ${existentes[0].nombres} ${existentes[0].apellidos}.`, 'error');
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Guardar Pasajero`;
        lucide.createIcons();
      }
      return;
    }

    // 2. Validar si el código de tarjeta ya está en uso
    const tarjetasExistentes = await ApiService.get(`tarjetas?codigo_tarjeta=${encodeURIComponent(codigo_tarjeta)}`);
    if (tarjetasExistentes && tarjetasExistentes.length > 0) {
      showToast(`La tarjeta ${codigo_tarjeta} ya se encuentra asignada a otro pasajero. Ingrese otro código.`, 'error');
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Guardar Pasajero`;
        lucide.createIcons();
      }
      return;
    }

    // 3. Crear Pasajero (HTTP POST /pasajeros)
    const nuevoIdPasajero = `pas-${Date.now()}`;
    const nuevoPasajero = await ApiService.post('pasajeros', {
      id: nuevoIdPasajero,
      tipo_documento: 'DNI',
      numero_documento: dni,
      nombres,
      apellidos,
      telefono: '',
      email: '',
      tipo_tarifa,
      estado: 'activo'
    });

    // 4. Crear Tarjeta Vinculada (HTTP POST /tarjetas)
    const nuevoIdTarjeta = `tar-${Date.now()}`;
    await ApiService.post('tarjetas', {
      id: nuevoIdTarjeta,
      codigo_tarjeta,
      pasajero_id: nuevoPasajero.id,
      tipo_tarifa,
      saldo: Number(saldo_inicial.toFixed(2)),
      estado: 'activa',
      fecha_emision: new Date().toISOString()
    });

    // 5. Registrar Evento en Auditoría
    try {
      await ApiService.post('auditoria', {
        id: `aud-${Date.now()}`,
        usuario_id: currentUser.id || 'usr-1',
        accion: 'REGISTRO_PASAJERO',
        entidad: 'pasajero',
        entidad_id: nuevoPasajero.id,
        detalles: {
          dni,
          nombres: `${nombres} ${apellidos}`,
          tipo_tarifa,
          tarjeta: codigo_tarjeta,
          saldo_inicial
        },
        ip_origen: '127.0.0.1',
        fecha_hora: new Date().toISOString()
      });
    } catch (auditErr) {
      console.warn('Auditoría no registrada:', auditErr);
    }

    // 6. Cerrar modal y notificar éxito
    cerrarModalPasajero();
    showToast(`¡Pasajero ${nombres} ${apellidos} registrado exitosamente con tarjeta ${codigo_tarjeta}!`, 'success');

    // 7. Actualizar dinámicamente la tabla sin recargar la página completa
    await navigate('pasajeros');

  } catch (err) {
    console.error('Error al registrar nuevo pasajero:', err);
    showToast('Error al conectar con la API para registrar el pasajero.', 'error');
  } finally {
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Guardar Pasajero`;
      lucide.createIcons();
    }
  }
}

function probarTarjetaSinSaldo() {
  document.getElementById('txtCodigoTarjeta').value = 'TARJ-1004';
}

function simularReposicion() {
  showToast('Tarjeta TARJ-1006 bloqueada. Saldo transferido a TARJ-1008.', 'success');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = `fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto max-w-md p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all z-50 ${
    type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
  }`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-5 h-5 shrink-0"></i>
    <span class="text-xs font-semibold">${message}</span>
  `;
  toast.classList.remove('hidden');
  lucide.createIcons();
  setTimeout(() => toast.classList.add('hidden'), 4000);
}

function simulateReload() {
  navigate('dashboard');
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Selector de usuario / rol
  const userSelector = document.getElementById('userSelector');
  if (userSelector) {
    userSelector.onchange = (e) => {
      const val = e.target.value;
      if (val === 'usr-1') currentUser = { id: 'usr-1', rol: 'administrador', nombres: 'Andrea Mendoza' };
      if (val === 'usr-2') currentUser = { id: 'usr-2', rol: 'operador', nombres: 'Carlos Ramos' };
      if (val === 'usr-3') currentUser = { id: 'usr-3', rol: 'cajero', nombres: 'Lucía Fernández' };
      document.getElementById('userNameLabel').innerText = `${currentUser.nombres} (${currentUser.rol})`;
      showToast(`Sesión cambiada a ${currentUser.nombres} (${currentUser.rol})`, 'success');
    };
  }

  // Listener para el formulario del modal de nuevo pasajero
  const formModal = document.getElementById('formNuevoPasajero');
  if (formModal) {
    formModal.onsubmit = guardarNuevoPasajero;
  }

  // Cerrar modal al hacer clic en el backdrop
  const modalPasajero = document.getElementById('modalNuevoPasajero');
  if (modalPasajero) {
    modalPasajero.addEventListener('click', (e) => {
      if (e.target === modalPasajero) cerrarModalPasajero();
    });
  }

  // Cerrar modal o sidebar al presionar la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalPasajero();
      toggleSidebar(false);
    }
  });

  navigate('dashboard');
});
