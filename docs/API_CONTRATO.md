# Contrato de API REST: Sistema PasaYa

## 1. Convenciones Generales de la API
El presente documento formaliza las reglas de comunicación entre el frontend y el backend para la plataforma de transporte urbano **PasaYa**, conforme a los principios de arquitectura REST:

- **Rutas en Minúsculas y Plural:** Los recursos se identifican mediante sustantivos en plural y en minúsculas (ej. `/pasajeros`, `/tarjetas`, `/recargas`, `/viajes`, `/unidades`). No se utilizan verbos en las rutas (`/crear-viaje` es incorrecto; `POST /viajes` es la convención estándar).
- **Protocolo y Formato de Intercambio:** HTTP/1.1 o HTTP/2 sobre TLS (HTTPS), con serialización estricta en `application/json` con codificación UTF-8.
- **Códigos de Estado HTTP:**
  - `200 OK`: Consulta o actualización parcial procesada con éxito.
  - `201 Created`: Recurso creado exitosamente (retorna cabecera `Location` y el objeto creado).
  - `400 Bad Request`: Parámetros inválidos, tipos de datos incompatibles o campos obligatorios ausentes.
  - `401 Unauthorized`: Token Bearer no provisto o expirado.
  - `403 Forbidden`: El rol del usuario carece de permisos para invocar la operación.
  - `404 Not Found`: El recurso solicitado no existe.
  - `409 Conflict`: Violación de regla de negocio (ej. saldo insuficiente al abordar, tarjeta bloqueada, duplicidad de DNI o placa).
  - `500 Internal Server Error`: Falla no controlada en el servidor.
- **Seguridad en Respuestas:** Bajo ninguna circunstancia los endpoints retornarán el atributo `password_hash` ni credenciales sensibles.

---

## 2. Formato Unificado de Respuestas de Error

Todas las respuestas con código de estado `4xx` o `5xx` devuelven una estructura JSON estándar predecible:

```json
{
  "error": {
    "codigo": 409,
    "estado": "CONFLICT",
    "mensaje": "Saldo insuficiente para abordar la unidad.",
    "detalles": [
      {
        "campo": "saldo",
        "regla": "saldo_minimo_requerido",
        "esperado": 2.50,
        "actual": 1.20
      }
    ],
    "ruta": "/viajes",
    "marca_tiempo": "2026-11-10T12:00:00.000Z"
  }
}
```

---

## 3. Autenticación y Auditoría

### 3.1. Autenticación por Bearer Token
- Los endpoints protegidos requieren la cabecera HTTP:
  ```http
  Authorization: Bearer <token_jwt>
  ```
- El payload del token incluye `{ "sub": usuario_id, "email": "...", "rol": "administrador", "exp": 1794355200 }`.

### 3.2. Acciones de Auditoría Automática
- Cada operación mutativa (`POST`, `PATCH`, `DELETE`) genera de manera automática y atómica un registro en la tabla `auditoria`, capturando el identificador del usuario autenticado, la entidad modificada, la IP de origen y la marca temporal.

---

## 4. Tabla Resumen de Endpoints por Proceso

| Proceso / Formulario | Acción | Método | Endpoint | Datos Enviados (Payload / Query) | Respuesta | Errores Posibles | Roles Autorizados |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **Inicio de Sesión** | Autenticar usuario | `POST` | `/auth/login` | `email`, `password` | `200` + `{ token, usuario }` | `400, 401` | Público |
| **Inicio de Sesión** | Perfil activo | `GET` | `/auth/perfil` | Cabecera `Authorization` | `200` + `{ usuario }` | `401` | Todos |
| **P1: Pasajeros** | Listar pasajeros | `GET` | `/pasajeros` | `?tipo_tarifa=&numero_documento=` | `200` + `[pasajeros]` | `401, 403` | Admin, Operador |
| **P1: Pasajeros** | Registrar pasajero | `POST` | `/pasajeros` | `tipo_documento, numero_documento, nombres, apellidos, telefono, email, tipo_tarifa` | `201` + `{ pasajero }` | `400, 409` | Admin, Operador |
| **P1: Tarjetas** | Listar tarjetas | `GET` | `/tarjetas` | `?pasajero_id=&codigo_tarjeta=&estado=` | `200` + `[tarjetas]` | `401, 403` | Todos los roles |
| **P1: Tarjetas** | Emitir tarjeta | `POST` | `/tarjetas` | `pasajero_id, codigo_tarjeta, tipo_tarifa, saldo_inicial` | `201` + `{ tarjeta }` | `400, 409` | Admin, Operador |
| **P2: Puntos Recarga** | Listar agencias | `GET` | `/puntos-recarga` | `?estado=` | `200` + `[puntos]` | `401` | Todos los roles |
| **P2: Recarga Saldo** | Listar recargas | `GET` | `/recargas` | `?tarjeta_id=&fecha=` | `200` + `[recargas]` | `401, 403` | Todos los roles |
| **P2: Recarga Saldo** | Registrar recarga | `POST` | `/recargas` | `tarjeta_id, punto_recarga_id, monto` | `201` + `{ recarga, nuevo_saldo }` | `400, 404, 409` | Admin, Cajero |
| **P3: Empresas** | Listar empresas | `GET` | `/empresas` | `?estado=` | `200` + `[empresas]` | `401` | Admin, Operador |
| **P3: Empresas** | Crear empresa | `POST` | `/empresas` | `ruc, razon_social, direccion, telefono` | `201` + `{ empresa }` | `400, 409` | Admin |
| **P3: Unidades** | Listar unidades | `GET` | `/unidades` | `?empresa_id=&estado=` | `200` + `[unidades]` | `401` | Admin, Operador |
| **P3: Unidades** | Registrar unidad | `POST` | `/unidades` | `empresa_id, conductor_id, placa, padron, capacidad_pasajeros` | `201` + `{ unidad }` | `400, 409` | Admin |
| **P4: Rutas y Tarifas**| Listar rutas | `GET` | `/rutas` | `?estado=` | `200` + `[rutas_con_tarifas]` | `401` | Todos los roles |
| **P4: Rutas y Tarifas**| Registrar ruta | `POST` | `/rutas` | `codigo_ruta, nombre, paradero_inicio, paradero_fin, distancia_km` | `201` + `{ ruta }` | `400, 409` | Admin |
| **P4: Tarifas** | Asignar tarifa | `POST` | `/tarifas` | `ruta_id, tipo_pasajero, monto` | `201` + `{ tarifa }` | `400, 409` | Admin |
| **P5: Abordaje** | Registrar cobro viaje | `POST` | `/viajes` | `codigo_tarjeta, unidad_id, ruta_id` | `201` + `{ viaje, saldo_restante }`| `400, 404, 409` | Admin, Operador |
| **P5: Abordaje** | Listar viajes | `GET` | `/viajes` | `?unidad_id=&fecha=&tarjeta_id=` | `200` + `[viajes]` | `401, 403` | Admin, Operador |
| **P6: Recaudación** | Consultar balance | `GET` | `/recaudaciones` | `?unidad_id=&fecha=&ruta_id=` | `200` + `[cierres]` | `401, 403` | Admin, Operador |
| **P6: Recaudación** | Efectuar cierre día | `POST` | `/recaudaciones/cierre` | `unidad_id, ruta_id, fecha` | `201` + `{ cierre_recaudacion }` | `400, 409` | Admin, Operador |
| **P7: Reposición** | Bloquear tarjeta | `PATCH`| `/tarjetas/{id}/bloqueo` | `motivo` | `200` + `{ tarjeta_bloqueada }` | `404, 409` | Admin, Operador |
| **P7: Reposición** | Reponer y transferir | `POST` | `/reposiciones` | `tarjeta_origen_id, codigo_nueva_tarjeta, motivo` | `201` + `{ reposicion, nueva_tarjeta }` | `400, 404, 409` | Admin, Operador |
| **P8: Liquidación** | Listar liquidaciones | `GET` | `/liquidaciones` | `?empresa_id=&estado=` | `200` + `[liquidaciones]` | `401, 403` | Admin |
| **P8: Liquidación** | Generar liquidación | `POST` | `/liquidaciones` | `empresa_id, periodo_inicio, periodo_fin` | `201` + `{ liquidacion }` | `400, 409` | Admin |
| **P8: Liquidación** | Pagar liquidación | `PATCH`| `/liquidaciones/{id}/pagar` | `metodo_pago, comprobante_referencia` | `200` + `{ liquidacion }` | `404, 409` | Admin |
| **Auditoría** | Consultar bitácora | `GET` | `/auditoria` | `?entidad=&usuario_id=&fecha=` | `200` + `[auditoria]` | `401, 403` | Admin |

---

## 5. Detalle de Endpoints Principales

### 5.1. `POST /auth/login` (Autenticación)
- **Roles:** Público.
- **Petición (Body JSON):**
  ```json
  {
    "email": "operador@pasaya.pe",
    "password": "Password123*"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": "usr-2",
      "nombres": "Carlos",
      "apellidos": "Ramos Valencia",
      "email": "operador@pasaya.pe",
      "rol": "operador"
    }
  }
  ```

### 5.2. `POST /viajes` (Proceso 5: Cobro al Abordar)
- **Roles:** Administrador, Operador.
- **Petición (Body JSON):**
  ```json
  {
    "codigo_tarjeta": "TARJ-1001",
    "unidad_id": "und-1",
    "ruta_id": "rut-1"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "via-105",
    "codigo_tarjeta": "TARJ-1001",
    "pasajero": "Juan Diego Pérez Morales",
    "tipo_tarifa": "general",
    "tarifa_monto": 2.50,
    "saldo_anterior": 15.00,
    "saldo_posterior": 12.50,
    "fecha_hora": "2026-11-10T12:05:00.000Z",
    "estado": "exitoso"
  }
  ```
- **Respuesta Conflicto (409 Conflict - Saldo Insuficiente):**
  ```json
  {
    "error": {
      "codigo": 409,
      "estado": "CONFLICT",
      "mensaje": "Saldo insuficiente. Tarifa requerida: S/ 2.50, Saldo disponible: S/ 1.00",
      "detalles": [
        { "campo": "saldo", "esperado": 2.50, "actual": 1.00 }
      ],
      "ruta": "/viajes",
      "marca_tiempo": "2026-11-10T12:05:01.000Z"
    }
  }
  ```

### 5.3. `POST /recargas` (Proceso 2: Recarga de Saldo)
- **Roles:** Administrador, Cajero.
- **Petición (Body JSON):**
  ```json
  {
    "tarjeta_id": "tar-1",
    "punto_recarga_id": "pto-1",
    "monto": 20.00
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "rec-55",
    "tarjeta_id": "tar-1",
    "monto": 20.00,
    "saldo_anterior": 12.50,
    "saldo_posterior": 32.50,
    "fecha_hora": "2026-11-10T12:10:00.000Z"
  }
  ```

### 5.4. `POST /reposiciones` (Proceso 7: Bloqueo y Reposición de Tarjeta)
- **Roles:** Administrador, Operador.
- **Petición (Body JSON):**
  ```json
  {
    "tarjeta_origen_id": "tar-4",
    "codigo_nueva_tarjeta": "TARJ-1007",
    "motivo": "robo"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": "rep-10",
    "tarjeta_origen": {
      "id": "tar-4",
      "codigo_tarjeta": "TARJ-1004",
      "estado": "reemplazada"
    },
    "tarjeta_nueva": {
      "id": "tar-7",
      "codigo_tarjeta": "TARJ-1007",
      "saldo": 32.50,
      "estado": "activa"
    },
    "saldo_transferido": 32.50,
    "fecha_hora": "2026-11-10T12:15:00.000Z"
  }
  ```

---

## 6. Diferencias detectadas con MODELO_DATOS.md
- **Identificadores Alfanuméricos en la API Mock:** En la base de datos PostgreSQL los IDs son de tipo `INTEGER GENERATED ALWAYS AS IDENTITY`. En el contrato de la API y en la API mock de JSON Server se utilizan prefijos legibles no numéricos (`usr-1`, `tar-1`, `via-1`) para evitar errores de coerción o filtrado en navegadores durante el desarrollo frontend.
- **Desnormalización Controlada en Respuestas:** Para optimizar el rendimiento del frontend y evitar peticiones en cascada (*waterfall requests*), los endpoints `POST /viajes` y `POST /reposiciones` devuelven en la respuesta objetos compuestos (como el nombre del pasajero y el nuevo saldo) que en el modelo físico relacional requieren un `JOIN` entre `viaje`, `tarjeta` y `pasajero`.
