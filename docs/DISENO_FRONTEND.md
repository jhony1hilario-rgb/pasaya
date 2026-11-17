# Diseño Frontend y Sistema Visual: PasaYa

## 1. Identidad Visual y Concepto de Diseño
**PasaYa** representa agilidad, seguridad y modernidad en el transporte público urbano. La interfaz adopta un enfoque limpio, accesible y funcional inspirado en sistemas de movilidad inteligente.

### Paleta de Colores
- **Color Primario (Esmeralda Tránsito):** `#059669` (Tailwind Emerald-600) — Transmite seguridad, validación de pago aprobado y fluidez.
- **Color Secundario (Azul Marino Urbano):** `#1E293B` (Tailwind Slate-800) — Usado en encabezados, barras de navegación y textos de alto contraste.
- **Color de Acento (Cian Tecnológico):** `#06B6D4` (Tailwind Cyan-500) — Enlaces interactivos, tarjetas prepago activas y estados informativos.
- **Color de Alerta / Error:** `#DC2626` (Tailwind Red-600) — Cobro rechazado, saldo insuficiente, tarjetas bloqueadas.
- **Fondo General:** `#F8FAFC` (Slate-50) — Fondo neutro de bajo cansancio visual.
- **Superficie de Tarjetas y Formularios:** `#FFFFFF` — Elevación suave con sombras sutiles (`shadow-sm`, `shadow-md`).

### Tipografía
- **Familia Primaria:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Pesos y Jerarquías:** Regular (400) para textos y formularios, Medium (500) para etiquetas y botones, Bold (700) para títulos y métricas financieras.

### Iconografía y Componentes
- **Iconos:** Lucide Icons (autobús, tarjeta, billetera, check, alert-triangle, refresh-cw, lock, log-out).
- **Componentes Base:** Tarjetas con métricas KPI, tablas de datos con paginación y búsqueda, formularios modulares con validación visual en línea y alertas *toast* de retroalimentación.

---

## 2. Mapa de Pantallas del Prototipo
1. **Login (`/login`):** Acceso seguro con selector rápido de usuarios de prueba para simulación por rol.
2. **Dashboard Principal (`/dashboard`):** Resumen global con KPIs de recaudación, accesos rápidos a los 8 procesos y bitácora reciente.
3. **P1 - Pasajeros y Tarjetas (`/pasajeros`):** Listado y formulario de registro de usuario y emisión de tarjeta.
4. **P2 - Recarga de Saldo (`/recargas`):** Formulario de abono de efectivo en puntos autorizados y cálculo de nuevo saldo.
5. **P3 - Empresas y Unidades (`/empresas`):** Administración de concesionarias, flotas de buses y asignación de choferes.
6. **P4 - Rutas y Tarifas (`/rutas`):** Definición de trayectos, paraderos principales y configuración tarifaria.
7. **P5 - Registro de Viajes (`/abordaje`):** Simulador de cobro al abordar con lector virtual de tarjeta, validación sonora/visual y débito inmediato.
8. **P6 - Control de Recaudación (`/recaudacion`):** Cuadre de caja por bus, ruta y fecha con consolidación de transacciones.
9. **P7 - Bloqueo y Reposición (`/reposicion`):** Panel de reporte de robo/pérdida, anulación y migración de fondos a nuevo plástico.
10. **P8 - Liquidación (`/liquidaciones`):** Generador de liquidación para empresas con deducción de comisión de plataforma.
11. **Auditoría (`/auditoria`):** Visor administrativo de registros de eventos inmutables.
