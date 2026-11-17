# 🚌 PasaYa - Sistema de Pago Electrónico y Gestión de Transporte Urbano

> **TECSUP - Laboratorio 13:** Diseño del Modelo de Datos y Comunicación Frontend-Backend  
> **Metodología:** Vibe Coding  
> **Ciudad de Implementación:** Arequipa, Perú (Sistema Integrado de Transporte - SIT)

---

## ⚡ Guía Rápida de Ejecución (En 3 Pasos)

Cualquier persona (profesor, evaluador o compañero) puede ejecutar este proyecto en su propia computadora siguiendo únicamente estos 3 pasos:

### 1️⃣ Paso 1: Requisito Único
Tener instalado **Node.js** en tu equipo (versión 18 o superior / LTS recomendada).
* Si no lo tienes instalado, descárgalo gratis en: [https://nodejs.org/](https://nodejs.org/)

### 2️⃣ Paso 2: Descomprimir el Proyecto
Descarga y descomprime la carpeta del proyecto `pasaya` en cualquier ubicación de tu computadora (Escritorio, Descargas, Disco D, etc.). No importa la ruta, el proyecto utiliza rutas estrictamente relativas.

### 3️⃣ Paso 3: Ejecutar el Proyecto
Haz doble clic sobre el archivo ejecutable **`iniciar.bat`**:

```bash
iniciar.bat
```

*(Si utilizas **macOS** o **Linux**, abre una terminal en la carpeta y ejecuta: `chmod +x iniciar.sh && ./iniciar.sh`)*

**¿Qué hace automáticamente este archivo?**
1. Valida que tengas Node.js instalado.
2. Levanta en una ventana secundaria el servidor API REST Mock (`json-server`) apuntando a `mock-api/db.json` en el puerto **3000** (`http://localhost:3000`).
3. Abre automáticamente tu navegador web predeterminado en la interfaz gráfica del sistema (`frontend/index.html`).

---

## 🧪 Demostración de Escenarios de Evaluación (Rúbrica)

Una vez abierta la aplicación web en tu navegador, dirígete al menú lateral y haz clic en **"P5: Abordaje (Cobro)"** para evaluar las reglas de negocio y respuestas HTTP:

### ✅ Escenario 1: Abordaje Exitoso (Respuesta HTTP 201 Created)
1. En el campo **Código de Tarjeta**, utiliza la tarjeta precargada: `TARJ-1001` (o `TARJ-1002` para universitario).
2. Selecciona la unidad `V6A-720 (CN-01)` y la ruta `R-101 (Troncal Cono Norte - Terminal Terrestre)`.
3. Haz clic en **"Simular Abordaje"**.
4. **Resultado esperado:**
   - La pantalla del validador cambia a color verde con la señal **PAGO ACEPTADO**.
   - Se debita la tarifa correspondiente de Arequipa (S/ 1.50 para general o S/ 0.70 para universitario).
   - Se muestra el saldo restante en tiempo real y se emite la notificación Toast.
   - En la consola del servidor API Mock se registra la petición `POST /viajes` con código `201 Created` y `PATCH /tarjetas/tar-1` con código `200 OK`.

### ❌ Escenario 2: Cobro Denegado / Reglas de Conflicto (Respuesta HTTP 409 Conflict)
* **Caso A: Tarjeta Bloqueada**
  1. Haz clic en el botón de atajo **"Probar error 409 (Tarjeta Bloqueada / Sin Saldo)"** o ingresa manualmente `TARJ-1004`.
  2. Haz clic en **"Simular Abordaje"**.
  3. **Resultado:** La pantalla cambia a color rojo emitiendo **COBRO RECHAZADO: Tarjeta bloqueada o anulada (Código HTTP: 409 CONFLICT)**.
* **Caso B: Saldo Insuficiente**
  1. Ingresa el código de tarjeta: `TARJ-1006` (cuenta únicamente con S/ 0.40 de saldo).
  2. Haz clic en **"Simular Abordaje"**.
  3. **Resultado:** Cobro rechazado por saldo insuficiente para cubrir la tarifa de S/ 1.50.

---

## 🛠️ Ejecución Manual Alternativa (Por Terminal)

Si prefieres ejecutar los comandos manualmente desde tu terminal o VS Code:

```bash
# 1. En la raíz del proyecto, iniciar la API simulada en el puerto 3000:
npx json-server --watch mock-api/db.json --port 3000

# 2. Abrir en tu navegador el archivo:
# frontend/index.html (o mediante la extensión Live Server de VS Code)
```

Para probar los endpoints REST directamente desde VS Code, puedes abrir el archivo [`mock-api/pruebas.http`](mock-api/pruebas.http) utilizando la extensión **REST Client**.

---

## 📁 Estructura del Repositorio

```text
pasaya/
├── iniciar.bat             # 🚀 Ejecutable Windows de inicio automático (1 solo clic)
├── iniciar.sh              # 🚀 Script de inicio automático para macOS / Linux
├── package.json            # Configuración de dependencias y scripts npm
├── README.md               # Guía rápida de usuario y documentación del proyecto
├── frontend/               # Interfaz Gráfica de Usuario (Vanilla JS + Tailwind CSS)
│   ├── index.html          # Vista principal (Dashboard y navegación SPA)
│   └── app.js              # Controlador, estado de sesión, servicios Fetch y vistas
├── mock-api/               # Simulación de Backend REST API
│   ├── db.json             # Base de datos JSON con 17 colecciones contextualizadas a Arequipa
│   └── pruebas.http        # Suite de pruebas HTTP automatizadas para REST Client
├── database/               # Persistencia Físico-Relacional (PostgreSQL)
│   ├── schema.sql          # DDL físico con 18 tablas, restricciones CHECK, UNIQUE e índices
│   └── seed.sql            # Datos iniciales reales de Arequipa (concesionarias, paraderos, tarifas)
└── docs/                   # Documentación Técnica de Arquitectura
    ├── MODELO_DATOS.md     # Diccionario de datos, ERD Mermaid y matriz CRUD transaccional
    ├── API_CONTRATO.md     # Especificación del contrato REST, errores 409/400 y auditoría
    ├── MAPA_NAVEGACION.md  # Diagrama de flujo de pantallas y matriz de roles
    ├── openapi.yaml        # Especificación estándar OpenAPI 3.0 para Swagger
    ├── ANALISIS_PROYECTO.md
    ├── REQUISITOS_FUNCIONALES.md
    ├── REQUISITOS_NO_FUNCIONALES.md
    ├── INFRAESTRUCTURA.md
    └── DISENO_FRONTEND.md
```

---

## 💳 Tarjetas de Prueba Disponibles

| Código Tarjeta | Tipo Tarifa | Saldo Inicial | Estado | Escenario de Uso |
| :--- | :--- | :---: | :---: | :--- |
| **`TARJ-1001`** | General | S/ 17.00 | Activa | **Escenario 1:** Cobro aprobado exitoso (Tarifa S/ 1.50) |
| **`TARJ-1002`** | Estudiante | S/ 29.30 | Activa | **Escenario 1:** Tarifa preferencial aprobada (Tarifa S/ 0.70) |
| **`TARJ-1003`** | Estudiante | S/ 9.30 | Activa | Cobro aprobado con tarifa de ruta alimentadora |
| **`TARJ-1004`** | General | S/ 0.00 | **Bloqueada** | **Escenario 2:** Rechazo 409 por tarjeta inmovilizada |
| **`TARJ-1005`** | General | S/ 31.50 | Activa | Tarjeta activa de pasajero frecuente |
| **`TARJ-1006`** | General | S/ 0.40 | Activa | **Escenario 2:** Rechazo 409 por saldo insuficiente |

---
**TECSUP 2026** - Desarrollo de Software | Metodología *Vibe Coding*
