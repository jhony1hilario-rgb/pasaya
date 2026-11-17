# Especificación de Infraestructura y Motor de Base de Datos: PasaYa

## 1. Selección del Proveedor y Entorno de Alojamiento
Tras la evaluación comparativa realizada en el Laboratorio 12 entre proveedores cloud (AWS EC2, DigitalOcean Droplets y VPS alternativos), se determinó la selección de **Amazon Web Services (AWS) con instancia EC2 (Ubuntu Server 24.04 LTS)**:
- **Justificación:** Estabilidad empresarial, compatibilidad nativa con entornos de contenedores, acceso SSH seguro y conectividad directa para bases de datos relacionales.
- **Entorno de Desarrollo Local:** PostgreSQL 17 / pgAdmin 4 y Node.js LTS en máquinas cliente Windows, manteniendo paridad de versiones entre desarrollo y producción.

---

## 2. Selección del Motor de Base de Datos
- **Motor Seleccionado:** **PostgreSQL 17 (Relacional, Código Abierto)**.
- **Justificación Técnica:**
  - **Transaccionalidad ACID Estricta:** Requerida para cobros concurrentes, recargas monetarias y reposiciones sin riesgo de saldos inconsistentes ni condiciones de carrera (*race conditions*).
  - **Soporte de Índices Especializados:** Índices B-Tree, índices parciales y claves compuestas para optimizar consultas de recaudación por unidad y fecha.
  - **Integridad y Restricciones:** Soporte nativo para cláusulas `CHECK`, `GENERATED ALWAYS AS IDENTITY`, tipos de datos de alta precisión `NUMERIC(10,2)` y acciones referenciales `ON DELETE RESTRICT` y `ON DELETE CASCADE`.
  - **Auditoría e Integrabilidad:** Amplio ecosistema de clientes (pgAdmin, DBeaver) y drivers optimizados para Node.js (`pg`, `prisma`, `typeorm`).

---

## 3. Pila Tecnológica de Comunicación
- **Backend:** Node.js (v22+ LTS) con arquitectura de API RESTful, formato de intercambio JSON y autenticación Bearer JWT.
- **Frontend:** SPA web responsive con HTML5 semántico, CSS3 moderno (Tailwind / Flexbox) y JavaScript Vanilla / Vite.
- **API Mock:** JSON Server (puerto 3000) para simulación desacoplada durante la fase de prototipado rápido (*Vibe Coding*).
