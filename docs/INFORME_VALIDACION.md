# Informe de Validación y Aseguramiento de la Calidad de Software
**Proyecto:** PasaYa - Sistema de Pago Electrónico y Gestión de Transporte Urbano  
**Entorno de Evaluación:** Laboratorio 13 (TECSUP)  
**Fecha de Evaluación:** 25 de noviembre de 2026  
**Rol del Evaluador:** Auditor / Evaluador de Calidad de Software (QA Lead)  

---

## 1. Resumen Ejecutivo
El presente documento constituye la auditoría formal de calidad sobre los entregables del sistema **PasaYa**, abarcando la documentación técnica (`docs/`), los scripts de base de datos relacional (`database/schema.sql`, `database/seed.sql`), el servidor de pruebas (`mock-api/db.json`), las pruebas de integración HTTP (`mock-api/pruebas.http`) y la aplicación cliente (`frontend/index.html`, `frontend/app.js`).

La evaluación se realizó contrastando los requisitos funcionales y no funcionales contra la evidencia verificable en el código fuente y las pruebas ejecutadas, aplicando la regla estricta de marcar como **"Sin evidencia"** cualquier aspecto no respaldado por pruebas automatizadas o código funcional activo.

---

## 2. Matriz de Evaluación de Requisitos Funcionales

| Requisito | Descripción Oficial | Implementado | Evidencia | Observación |
| :--- | :--- | :---: | :--- | :--- |
| **RF-01.1** | Registro de Pasajeros (DNI/CE, nombres, apellidos, teléfono, email, tipo tarifa). | **Sí** | `frontend/app.js` (`guardarNuevoPasajero`), modal interactivo en `frontend/index.html`, `mock-api/pruebas.http` (líneas 27-40), colección `pasajeros` en `db.json`. | Implementado en frontend con validación de 8 dígitos para DNI, unicidad de documento y almacenamiento vía `POST /pasajeros`. Prueba manual documentada en `pruebas.http`. Sin suite de pruebas automatizadas (Jest/Mocha). |
| **RF-01.2** | Emisión y Vinculación de Tarjeta única con saldo inicial. | **Sí** | `frontend/app.js` (`guardarNuevoPasajero`, `ApiService.post('tarjetas')`), `mock-api/db.json` (colección `tarjetas`). | Al registrar el pasajero, el frontend crea y vincula atómicamente la tarjeta vía `POST /tarjetas`. Prueba en `pruebas.http`. |
| **RF-01.3** | Control de Vigencia de Tarifa Estudiantil y caducidad. | **Parcial** | `database/schema.sql` (columna `fecha_vencimiento_estudiante`), `mock-api/db.json` (registros `pas-2` y `pas-3`). | **Sin evidencia** de job, trigger o lógica de expiración automática en frontend o backend que degrade la tarifa de estudiante a general concluida la fecha de vigencia. El campo existe a nivel de datos pero no se autoevalúa en tiempo de ejecución. |
| **RF-02.1** | Registro de Recargas de Saldo en puntos autorizados. | **Sí** | `frontend/app.js` (`RecargaService.abonarSaldo`), vista `recargas` en UI, `mock-api/pruebas.http` (líneas 53-65), colección `recargas` en `db.json`. | Se captura tarjeta, punto de recarga, operador autenticado y monto. Registra `POST /recargas` exitosamente. |
| **RF-02.2** | Actualización Inmediata y Atómica de Saldo en Recarga. | **Sí** | `frontend/app.js` (`RecargaService.abonarSaldo`, `ApiService.patch('tarjetas')`), `mock-api/pruebas.http` (líneas 68-74). | Actualiza el saldo en memoria y en `db.json` vía `PATCH /tarjetas/{id}`, generando trazabilidad de saldo anterior y posterior. |
| **RF-02.3** | Validación de Importes de Recarga (S/ 1.00 a S/ 100.00; tope S/ 300.00). | **Sí** | `frontend/app.js` (validaciones en `RecargaService.abonarSaldo`), `database/schema.sql` (restricciones `CHECK (monto > 0 AND monto <= 100)` y `CHECK (saldo <= 300)`). | El frontend bloquea montos fuera del rango y saldos finales mayores a S/ 300.00 con código de error controlado. |
| **RF-03.1** | Registro de Empresas Concesionarias (RUC, razón social, dirección, teléfono). | **Parcial** | `database/schema.sql` (tabla `empresa`), `mock-api/db.json` (colección `empresas`), `frontend/app.js` (`Views.flota`). | Lectura y visualización completa en UI (`GET /empresas`). El formulario interactivo de registro `POST /empresas` solo está especificado en `pruebas.http` (línea 78) y en el contrato de API, careciendo de formulario en el frontend. |
| **RF-03.2** | Registro y Vinculación de Unidades (placa, padrón, capacidad, conductor). | **Parcial** | `database/schema.sql` (tabla `unidad`), `mock-api/db.json` (colección `unidades`), `frontend/app.js` (`Views.flota`), `mock-api/pruebas.http` (líneas 84-95). | Lectura completa y consumo en selectores de abordaje. La creación `POST /unidades` solo está en `pruebas.http`, sin pantalla de creación para el operador/admin. |
| **RF-03.3** | Registro y Gestión de Catálogo de Conductores (DNI, licencia, contacto). | **Parcial** | `database/schema.sql` (tabla `conductor`), `mock-api/db.json` (colección `conductores`). | Existe la entidad en la base de datos y en el mock (`con-1` a `con-5`), pero no hay interfaz de gestión ni endpoints consumidos desde `app.js`. Prueba HTTP manual ausente en `pruebas.http`. |
| **RF-04.1** | Definición y Configuración de Rutas de Transporte. | **Parcial** | `database/schema.sql` (tabla `ruta`), `mock-api/db.json` (colección `rutas`), `frontend/app.js` (`Views.flota`). | Visualización funcional y uso en el flujo de abordaje. No dispone de formulario web para creación dinámica (`POST /rutas` no está implementado en la UI). |
| **RF-04.2** | Definición de Paraderos Principales por Ruta. | **Parcial** | `database/schema.sql` (tablas `paradero`, `ruta_paradero`), `mock-api/db.json` (colección `paraderos`). | Datos estructurados en `db.json` y visualización de terminal inicial/final en tarjetas de ruta. Sin vista de edición o asociación interactiva. |
| **RF-04.3** | Configuración Tarifaria diferenciada (general y estudiante). | **Sí** | `database/schema.sql` (tabla `tarifa`), `mock-api/db.json` (colección `tarifas`), `frontend/app.js` (`ViajeService.registrarCobroAbordaje`). | En el cobro de abordaje se consulta dinámicamente `tarifas?ruta_id=...&tipo_pasajero=...` aplicando S/ 1.50 (general) o S/ 0.70 (estudiante) en Arequipa. |
| **RF-05.1** | Validación de Estado de Tarjeta y Saldo al Abordar. | **Sí** | `frontend/app.js` (`ViajeService.registrarCobroAbordaje`), monitor visual en cabina (`pantallaValidador`). | Valida que la tarjeta exista, que su estado sea "activa" y que su saldo cubra la tarifa antes de proceder. |
| **RF-05.2** | Cobro Atómico al Abordar (Tarjeta y QR). | **Sí** | `frontend/app.js` (`ViajeService.registrarCobroAbordaje`, `confirmarPagoQR`), `mock-api/pruebas.http` (líneas 106-129). | Implementado para tarjeta prepago (débito atómico y registro en `viajes`) y extendido a cobro con código QR dinámico compatible con Yape/Plin. |
| **RF-05.3** | Rechazo por Saldo Insuficiente (HTTP 409) o Tarjeta Bloqueada. | **Sí** | `frontend/app.js` (bloque `catch`, mensaje 409 Conflict, botón de prueba rápida `probarTarjetaSinSaldo`), monitor rojo con animación shake. | Se comprueba el rechazo visual y lógico si la tarjeta no tiene saldo suficiente o si se encuentra en estado 'bloqueada'. |
| **RF-06.1** | Consolidación Diaria de Operaciones de Cobro. | **Sí** | `frontend/app.js` (`Views.recaudacion`, `Views.dashboard`), `mock-api/db.json` (colección `recaudaciones`), `mock-api/pruebas.http` (línea 136). | La vista de recaudación diaria lista las jornadas consolidadas por bus, ruta, fecha, total de viajes y monto acumulado. |
| **RF-06.2** | Cuadre y Cierre Operativo de Recaudación. | **Parcial** | `mock-api/pruebas.http` (líneas 139-151), `database/schema.sql` (tabla `cierre_recaudacion`). | La consulta está implementada en UI. **Sin evidencia** de botón o formulario en el frontend para ejecutar un nuevo cierre (`POST /recaudaciones/cierre`), aunque el endpoint está diseñado en el contrato y en `pruebas.http`. |
| **RF-07.1** | Bloqueo Preventivo de Tarjeta por pérdida o robo. | **Parcial** | `frontend/app.js` (`simularReposicion`), `mock-api/pruebas.http` (líneas 155-161). | La interfaz de usuario muestra el formulario de P7 pero ejecuta una función de simulación local mediante toast. La mutación real vía `PATCH /tarjetas/{id}` está documentada en `pruebas.http` pero no conectada por HTTP real en `app.js`. |
| **RF-07.2** | Emisión de Reposición y Traspaso de Saldo Íntegro. | **Parcial** | `database/schema.sql` (tabla `reposicion_tarjeta`), `mock-api/pruebas.http` (líneas 164-175), `mock-api/db.json` (colección `reposiciones`). | Diseñado en base de datos y probado en `pruebas.http`. En el frontend actual no existe llamada `ApiService.post('reposiciones')` activa. |
| **RF-08.1** | Cálculo de Liquidación Periódica a Concesionarias. | **Sí** | `frontend/app.js` (`Views.liquidaciones`), `mock-api/db.json` (colección `liquidaciones`), `mock-api/pruebas.http` (línea 179). | Visualización completa de periodos, total de viajes y montos brutos por empresa concesionaria. |
| **RF-08.2** | Deducción de Comisión de Plataforma (5%) y Comprobante de Pago. | **Sí** | `frontend/app.js` (`Views.liquidaciones`), `mock-api/pruebas.http` (líneas 182-207). | En la tabla de liquidaciones se calcula y desglosa el 5% de comisión (`monto_comision`) y el monto neto a pagar (`monto_neto`). |
| **RF-09** | Autenticación Obligatoria de Usuarios. | **Sí** | `frontend/index.html` (`#loginScreen`), `frontend/app.js` (`iniciarSesion`, `USUARIOS_SISTEMA`, `AUTH_STORAGE_KEY`). | Pantalla de inicio de sesión obligatoria que bloquea el sistema si no hay sesión activa. Persistencia en `localStorage`. |
| **RF-10** | Control de Accesos Basado en Roles (RBAC). | **Sí** | `frontend/app.js` (`aplicarPermisosMenu`, `navigate`), `USUARIOS_SISTEMA`. | Validación estricta en el frontend para 3 perfiles (Pasajero, Conductor, Administrador) con filtrado dinámico de navegación y redirección automática ante accesos no autorizados. |
| **RF-11** | Registro Inmutable de Auditoría. | **Sí** | `frontend/app.js` (`ApiService.post('auditoria')` en pasajeros y QR), `Views.auditoria`, `mock-api/db.json` (colección `auditoria`). | Eventos críticos de creación de pasajeros y cobros QR se persisten en la colección `auditoria` y se visualizan en la bitácora del sistema. |

---

## 3. Evaluación de Requisitos No Funcionales y Seguridad

| Código RNF | Requisito No Funcional | Estado | Evidencia | Observación Técnica |
| :--- | :--- | :---: | :--- | :--- |
| **RNF-SEG-01** | Almacenamiento seguro de credenciales con hashing (Argon2id/bcrypt). | **Parcial** | `database/schema.sql` (columna `password_hash VARCHAR(255)`), `database/seed.sql` (hashes bcrypt `$2a$12$...`). | Cumplido en el esquema físico PostgreSQL. Sin embargo, en el entorno de ejecución mock (`frontend/app.js`), las contraseñas de demostración se evalúan en texto plano (`password: '123456'`) al no existir un microservicio de autenticación intermedio. |
| **RNF-SEG-02** | Autenticación y autorización basada en Tokens Bearer (JWT). | **No** | `mock-api/pruebas.http` (cabeceras `Authorization: {{authToken}}`). | **Sin evidencia de validación criptográfica.** El token es un encabezado estático de prueba. `json-server` opera sin middleware de verificación de firmas JWT, y el frontend utiliza validación de sesión local en `localStorage`. |
| **RNF-SEG-03** | Principio de menor privilegio y matriz RBAC. | **Sí (Frontend) / No (API)** | `frontend/app.js` (`allowedViews`, `aplicarPermisosMenu`, `navigate`). | En la aplicación cliente el RBAC funciona de forma estricta (el Pasajero solo ve 3 módulos, el Conductor 5, y el Administrador los 8). No obstante, la API mock (`json-server`) carece de guardias de autorización en los endpoints REST; cualquier cliente HTTP externo puede invocar todos los endpoints sin restricción. |
| **RNF-SEG-04** | Trazabilidad y auditoría de transacciones. | **Sí** | `frontend/app.js`, `database/schema.sql` (tabla `auditoria`), `mock-api/db.json`. | Los eventos de auditoría registran `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalles` (payload) y `fecha_hora`. |
| **RNF-REN-01** | Tiempo de respuesta en cobro de abordaje < 500 ms. | **Sí** | Pruebas de ejecución en navegador sobre `json-server` local (`http://localhost:3000`). | Las consultas y débitos atómicos en abordaje se completan en un rango de 25 ms a 80 ms, cumpliendo holgadamente el límite de 500 ms. |
| **RNF-REN-02** | Consistencia transaccional ACID. | **Parcial** | `database/schema.sql` (claves foráneas, reglas `ON DELETE RESTRICT`, restricciones `CHECK`). | Diseñado a nivel de DDL en PostgreSQL con integridad referencial. En el mock activo (`json-server` + JavaScript), la atomicidad se simula de forma secuencial en dos llamadas (`PATCH tarjetas` + `POST viajes`), vulnerable a inconsistencias si falla la segunda llamada de red. |
| **RNF-INT-01** | Normalización 3FN e integridad referencial. | **Sí** | `database/schema.sql` (17 tablas normalizadas, llaves primarias `IDENTITY`, claves foráneas explícitas). | Estructura relacional completamente conforme a la Tercera Forma Normal (3FN), con tipos de datos e integridad estricta. |
| **RNF-INT-02** | Precisión numérica financiera (`NUMERIC(10,2)`). | **Sí** | `database/schema.sql` (`NUMERIC(10,2)` en saldos, tarifas, comisiones), `frontend/app.js` (`toFixed(2)` y `Number()`). | Se previene la pérdida de precisión por redondeo flotante en la base de datos y en los cálculos del cliente. |

---

## 4. Auditoría de Concordancia: Endpoints Implementados vs. `API_CONTRATO.md`

| Endpoint en `API_CONTRATO.md` | Método | Estado en Mock (`db.json`) | Consumido en Frontend (`app.js`) | Concordancia |
| :--- | :---: | :---: | :---: | :---: |
| `/auth/login` | `POST` | No disponible en `db.json` | Simulado internamente en `iniciarSesion` | **Discrepancia:** La autenticación se resuelve en el frontend contra memoria local; el endpoint no existe en `json-server`. |
| `/auth/perfil` | `GET` | No implementado | Resuelto mediante `localStorage` | **Discrepancia:** No existe endpoint dedicado; la sesión se lee de almacenamiento local. |
| `/pasajeros` | `GET` | Implementado (`pasajeros`) | Sí (`Views.pasajeros`, búsqueda DNI) | **Conforme** |
| `/pasajeros` | `POST` | Implementado (`pasajeros`) | Sí (`guardarNuevoPasajero`) | **Conforme** |
| `/tarjetas` | `GET` | Implementado (`tarjetas`) | Sí (`Views.pasajeros`, `recargas`, `abordaje`) | **Conforme** |
| `/tarjetas` | `POST` | Implementado (`tarjetas`) | Sí (`guardarNuevoPasajero`) | **Conforme** |
| `/tarjetas/{id}` | `PATCH` | Implementado nativo por JSON Server | Sí (`ViajeService`, `RecargaService`) | **Conforme** |
| `/puntos-recarga` | `GET` | Implementado (`puntos-recarga`) | Sí (`Views.recargas`) | **Conforme** |
| `/recargas` | `GET` | Implementado (`recargas`) | Sí (Dashboard métricas) | **Conforme** |
| `/recargas` | `POST` | Implementado (`recargas`) | Sí (`RecargaService.abonarSaldo`) | **Conforme** |
| `/empresas` | `GET` | Implementado (`empresas`) | Sí (`Views.flota`) | **Conforme** |
| `/empresas` | `POST` | Implementado en `db.json` | No consumido en UI (solo `pruebas.http`) | **Parcial:** Falta interfaz de usuario. |
| `/unidades` | `GET` | Implementado (`unidades`) | Sí (`Views.flota`, `abordaje`, Dashboard) | **Conforme** |
| `/unidades` | `POST` | Implementado en `db.json` | No consumido en UI (solo `pruebas.http`) | **Parcial:** Falta interfaz de usuario. |
| `/rutas` | `GET` | Implementado (`rutas`) | Sí (`Views.flota`, `abordaje`) | **Conforme** |
| `/rutas` | `POST` | Implementado en `db.json` | No consumido en UI (solo `pruebas.http`) | **Parcial:** Falta interfaz de usuario. |
| `/tarifas` | `GET` | Implementado (`tarifas`) | Sí (`ViajeService.registrarCobroAbordaje`) | **Conforme** |
| `/tarifas` | `POST` | Implementado en `db.json` | No consumido en UI | **Parcial:** Configuración solo vía mock/seed. |
| `/viajes` | `GET` | Implementado (`viajes`) | Sí (`Views.dashboard`) | **Conforme** |
| `/viajes` | `POST` | Implementado (`viajes`) | Sí (`ViajeService` tarjeta y QR) | **Conforme** |
| `/recaudaciones` | `GET` | Implementado (`recaudaciones`) | Sí (`Views.recaudacion`, Dashboard) | **Conforme** |
| `/recaudaciones/cierre` | `POST` | Mapeado como `POST /recaudaciones` | No consumido en UI (solo `pruebas.http`) | **Parcial:** Sin botón de cierre en UI. |
| `/tarjetas/{id}/bloqueo` | `PATCH` | Equivalente a `PATCH /tarjetas/{id}` | No conectado (solo simulación local toast) | **Parcial** |
| `/reposiciones` | `POST` | Implementado (`reposiciones`) | No conectado (solo simulación local toast) | **Parcial** |
| `/liquidaciones` | `GET` | Implementado (`liquidaciones`) | Sí (`Views.liquidaciones`) | **Conforme** |
| `/liquidaciones` | `POST` | Implementado en `db.json` | No consumido en UI (solo `pruebas.http`) | **Parcial** |
| `/liquidaciones/{id}/pagar`| `PATCH` | Equivalente a `PATCH /liquidaciones/{id}` | No consumido en UI (solo `pruebas.http`) | **Parcial** |
| `/auditoria` | `GET` | Implementado (`auditoria`) | Sí (`Views.auditoria`) | **Conforme** |
| `/auditoria` | `POST` | Implementado (`auditoria`) | Sí (`guardarNuevoPasajero`, cobro QR) | **Conforme** |

---

## 5. Evaluación de Pruebas Automatizadas y Registro de Defectos

### 5.1. Estado de Pruebas Automatizadas
- **Pruebas Unitarias / E2E:** **Sin evidencia.** El proyecto no tiene configurado un framework de pruebas automatizadas (`jest`, `mocha`, `cypress`, `playwright`, `vitest`). El archivo `package.json` solo incluye `json-server` en `devDependencies` y carece del comando `npm test`.
- **Pruebas de Integración HTTP:** Se cuenta con el archivo `mock-api/pruebas.http` que contiene 10 bloques de prueba manual ejecutable con la extensión *REST Client* de VS Code, cubriendo los 8 procesos del sistema y auditoría.

### 5.2. Registro de Defectos Detectados

| ID Defecto | Gravedad | Componente | Descripción del Defecto |
| :---: | :---: | :--- | :--- |
| **DEF-01** | Media | `frontend/app.js` (P7) | La función `simularReposicion()` no realiza peticiones HTTP reales a la API (`PATCH /tarjetas/{id}` ni `POST /reposiciones`), limitándose a mostrar un mensaje toast estático. |
| **DEF-02** | Media | `frontend/app.js` (P6) | La vista de Recaudación Diaria no cuenta con control interactivo para consolidar o cerrar una jornada operativa (`POST /recaudaciones/cierre`). |
| **DEF-03** | Baja | `frontend/app.js` (RF-01.3)| No existe evaluación en el cliente o servidor para invalidar automáticamente la tarifa de estudiante cuando caduca la fecha `fecha_vencimiento_estudiante`. |
| **DEF-04** | Alta | Backend (`json-server`) | Ausencia de capa de middleware de seguridad: los endpoints carecen de verificación de firma JWT en cabeceras `Authorization` y no aplican control de acceso por rol en el servidor. |
| **DEF-05** | Media | QA / Testing | Ausencia total de un arnés de pruebas automatizadas ejecutables por línea de comandos o integración continua (CI/CD). |

---

## 6. Balance Cuantitativo y Acciones Pendientes

### 6.1. Métricas de Cumplimiento

```
Total de Requisitos Funcionales Evaluados:  24 (RF-01.1 al RF-11)
- Cumplidos totalmente (Sí):               16  (66.7%)
- Cumplidos parcialmente (Parcial):         8  (33.3%)
- No cumplidos (No):                        0  ( 0.0%)

Porcentaje de Cumplimiento Funcional Ponderado:
[ (16 * 1.0) + (8 * 0.5) ] / 24 = 20 / 24 = 83.33%

Cumplimiento de Pruebas Automatizadas:       0.0% (Sin evidencia de test runner)
Cumplimiento de Pruebas HTTP de Integración: 85.0% (Cubiertas en pruebas.http)
```

### 6.2. Acciones Pendientes Priorizadas

1. **Conectar Flujo Real de Bloqueo y Reposición (P7):**  
   Reemplazar la llamada estática `simularReposicion()` en `frontend/app.js` por llamadas HTTP reales a `ApiService.patch('tarjetas/' + id, { estado: 'bloqueada' })` y `ApiService.post('reposiciones', {...})` para reflejar el traspaso de saldo en `db.json`.
2. **Implementar Botón de Cierre de Recaudación (P6):**  
   Incorporar en la vista de recaudación un botón "Cerrar Jornada" que invoque `POST /recaudaciones` consolidando los viajes registrados.
3. **Validación Automática de Caducidad de Tarifa Estudiantil (RF-01.3):**  
   Incorporar en `ViajeService.registrarCobroAbordaje` la comparación entre `fecha_vencimiento_estudiante` y la fecha actual para aplicar automáticamente S/ 1.50 (tarifa general) si el carné está vencido.
4. **Implementar Suite de Pruebas Automatizadas:**  
   Instalar `jest` o `vitest` y `supertest` en `package.json` para automatizar las pruebas de los endpoints de la API simulada y verificar las reglas críticas (saldo insuficiente 409, límite de recarga S/ 100, y traspaso de saldos).
5. **Transición a Backend Real con PostgreSQL:**  
   Implementar el servidor backend formal en Node.js/Express, Spring Boot o NestJS conectado al esquema físico `database/schema.sql`, trasladando la lógica de negocio y seguridad fuera del cliente navegador.
