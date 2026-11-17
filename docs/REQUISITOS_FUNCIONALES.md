# Requisitos Funcionales: Sistema PasaYa

## 1. Introducción
El presente documento define los requisitos funcionales del sistema de pago electrónico y gestión de transporte urbano **PasaYa**, derivados del análisis de problemática y los ocho procesos transaccionales establecidos en la primera etapa.

---

## 2. Requisitos Funcionales por Proceso

### Proceso 1: Registro de pasajeros y emisión de tarjetas
- **RF-01.1 (Registro de Pasajero):** El sistema debe permitir registrar a los pasajeros solicitando sus datos personales (nombres, apellidos, tipo de documento [DNI, CE], número de documento, teléfono, correo electrónico y tipo de tarifa [general, estudiante]).
- **RF-01.2 (Emisión de Tarjeta):** El sistema debe generar y vincular una tarjeta prepago única al pasajero registrado, asignando un código alfanumérico identificador único y saldo inicial de S/ 0.00.
- **RF-01.3 (Vigencia de Tarifa Estudiantil):** Si el pasajero es estudiante, se debe registrar la fecha de caducidad de su carné; concluida esa fecha, el sistema aplicará automáticamente la tarifa general.

### Proceso 2: Recarga de saldo
- **RF-02.1 (Registro de Recarga):** El sistema debe registrar recargas monetarias en efectivo en puntos autorizados, indicando tarjeta destino, punto de recarga, monto recibido y usuario operador.
- **RF-02.2 (Actualización Inmediata de Saldo):** Al confirmar la recarga, el saldo de la tarjeta debe incrementarse de forma atómica e inmediata, generando un registro inmutable con saldo anterior y posterior.
- **RF-02.3 (Validación de Importes):** El monto de recarga debe ser positivo (mínimo S/ 1.00, máximo S/ 100.00 por transacción) y el saldo total de una tarjeta no podrá superar los S/ 300.00.

### Proceso 3: Registro de empresas y unidades
- **RF-03.1 (Registro de Empresa Concesionaria):** El sistema debe permitir registrar empresas de transporte con su RUC, razón social, dirección y teléfono de contacto.
- **RF-03.2 (Registro y Vinculación de Unidades):** El sistema debe permitir registrar las unidades vehiculares (buses) asociándolas a su empresa, con número de placa única, número de padrón, capacidad de pasajeros y conductor asignado.
- **RF-03.3 (Registro de Conductores):** El sistema debe gestionar el catálogo de conductores (DNI, nombres, apellidos, licencia de conducir vigente y teléfono).

### Proceso 4: Registro de rutas y tarifas
- **RF-04.1 (Definición de Rutas):** El sistema debe permitir crear y modificar rutas de transporte, definiendo código de ruta, nombre, paradero inicial y paradero final.
- **RF-04.2 (Definición de Paraderos Principales):** El sistema debe permitir asociar la lista ordenada de paraderos oficiales pertenecientes a cada ruta.
- **RF-04.3 (Configuración Tarifaria):** Cada ruta debe contar con tarifas planas activas diferenciadas por tipo de pasajero (tarifa general y tarifa estudiante), con historial de vigencia.

### Proceso 5: Registro de viajes (cobro al abordar)
- **RF-05.1 (Validación y Débito al Abordar):** Al subir a la unidad, el sistema simula la lectura de la tarjeta, verifica que su estado sea "activa" y que disponga de saldo suficiente para cubrir la tarifa de la ruta.
- **RF-05.2 (Cobro Atómico):** Si el saldo es suficiente, el sistema debita el valor exacto del pasaje, actualiza el saldo de la tarjeta y registra el evento del viaje (tarjeta, unidad, ruta, monto debitado, fecha y hora).
- **RF-05.3 (Rechazo por Saldo Insuficiente o Tarjeta No Válida):** Si la tarjeta no cuenta con saldo suficiente o está bloqueada, el sistema deniega el cobro, registra el intento fallido y emite una alerta visual/sonora de rechazo.

### Proceso 6: Control de recaudación
- **RF-06.1 (Consolidación Diaria):** El sistema debe consolidar las operaciones de cobro realizadas por cada unidad vehicular en una fecha y ruta específica.
- **RF-06.2 (Cuadre y Cierre Operativo):** El sistema debe permitir al supervisor o administrador verificar el total de viajes registrados frente al monto total recaudado por día y emitir el cierre de recaudación correspondiente.

### Proceso 7: Bloqueo y reposición de tarjetas
- **RF-07.1 (Bloqueo Preventivo):** Ante reporte de pérdida, robo o deterioro, el sistema debe cambiar de inmediato el estado de la tarjeta a "bloqueada", impidiendo nuevos viajes o recargas.
- **RF-07.2 (Emisión de Reposición y Traspaso de Saldo):** El sistema debe emitir una nueva tarjeta asignada al mismo pasajero y transferir de forma íntegra e instantánea el saldo remanente que tenía la tarjeta bloqueada, marcando la tarjeta anterior como "reemplazada".

### Proceso 8: Liquidación a empresas de transporte
- **RF-08.1 (Cálculo de Liquidación Periódica):** El sistema debe calcular el monto devengado por cada empresa concesionaria durante un rango de fechas, sumando la recaudación de todas sus unidades operativas.
- **RF-08.2 (Deducción de Comisión y Registro de Pago):** El sistema aplicará la tasa de comisión administrativa de la plataforma PasaYa (ej. 5%), calculando el monto neto a pagar a la empresa y generando el comprobante formal de liquidación.

---

## 3. Requisitos Funcionales de Seguridad y Auditoría
- **RF-09 (Autenticación de Usuarios):** El sistema debe exigir inicio de sesión mediante correo y contraseña cifrada, emitiendo un token de acceso seguro para operaciones protegidas.
- **RF-10 (Control de Accesos por Rol):** El sistema restringirá el acceso a pantallas y endpoints según los privilegios del rol del usuario (Administrador, Operador, Cajero).
- **RF-11 (Registro Inmutable de Auditoría):** Cada operación transaccional o modificación sobre entidades maestras debe quedar registrada con identificador de usuario, acción ejecutada, entidad afectada, detalle de cambios y marca temporal.
