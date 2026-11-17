# Requisitos No Funcionales: Sistema PasaYa

## 1. Seguridad (RNF-SEG)
- **RNF-SEG-01 (Almacenamiento Seguro de Credenciales):** Las contraseñas de los usuarios jamás deben almacenarse en texto plano. Se debe emplear un algoritmo de hashing criptográfico robusto (Argon2id o bcrypt con sal de al menos 10 rondas).
- **RNF-SEG-02 (Autenticación y Autorización Basada en Tokens):** La comunicación frontend-backend para peticiones protegidas debe utilizar tokens Bearer (JWT) transmitidos en las cabeceras HTTP (`Authorization: Bearer <token>`).
- **RNF-SEG-03 (Principio de Menor Privilegio):** Los roles de usuario (`administrador`, `operador`, `cajero`) tienen acceso restringido según una matriz de control de acceso basada en roles (RBAC).
- **RNF-SEG-04 (Trazabilidad y Auditoría):** Todas las transacciones financieras (recargas, viajes, traspasos, liquidaciones) y cambios en catálogos deben persistir un registro de auditoría con sello de tiempo inmutable.

## 2. Rendimiento y Concurrencia (RNF-REN)
- **RNF-REN-01 (Tiempo de Respuesta en Validación de Abordaje):** La simulación de cobro en el proceso de abordaje debe procesarse y responder en menos de 500 ms bajo condiciones normales de red.
- **RNF-REN-02 (Consistencia Transaccional ACID):** Las operaciones de recarga, débito de viaje y reposición de tarjeta deben ejecutarse bajo transacciones atómicas para impedir saldos negativos o duplicación de débitos ante fallas concurrentes.

## 3. Integridad y Disponibilidad de Datos (RNF-INT)
- **RNF-INT-01 (Normalización y Restricciones):** El esquema relacional debe respetar rigurosamente la Tercera Forma Normal (3FN), asegurando integridad referencial mediante claves foráneas y restricciones de verificación (`CHECK`) a nivel de base de datos.
- **RNF-INT-02 (Precisión Numérica Financiera):** Todo importe monetario (saldos, tarifas, comisiones, montos de liquidación) debe almacenarse utilizando tipos de datos decimales exactos (`NUMERIC(10,2)` en PostgreSQL) para evitar anomalías por redondeo en punto flotante.

## 4. Matriz de Autorización por Rol (RBAC)

| Módulo / Proceso | Rol Administrador | Rol Operador | Rol Cajero |
| :--- | :---: | :---: | :---: |
| Inicio de sesión / Perfil | Acceso Total | Acceso Total | Acceso Total |
| Proceso 1: Pasajeros y Tarjetas | Crear, Leer, Editar | Crear, Leer, Editar | Solo Leer |
| Proceso 2: Recarga de Saldo | Crear, Leer | Crear, Leer | Crear, Leer |
| Proceso 3: Empresas y Unidades | Crear, Leer, Editar | Solo Leer | Sin Acceso |
| Proceso 4: Rutas y Tarifas | Crear, Leer, Editar | Solo Leer | Sin Acceso |
| Proceso 5: Registro de Viajes (Abordaje) | Simular, Consultar | Simular, Consultar | Sin Acceso |
| Proceso 6: Control de Recaudación | Consultar, Cuadrar | Consultar | Sin Acceso |
| Proceso 7: Bloqueo y Reposición | Ejecutar, Consultar | Ejecutar, Consultar | Sin Acceso |
| Proceso 8: Liquidación a Empresas | Generar, Pagar, Consultar | Solo Leer | Sin Acceso |
| Auditoría del Sistema | Consultar | Sin Acceso | Sin Acceso |
| Gestión de Usuarios y Roles | Crear, Editar, Consultar | Sin Acceso | Sin Acceso |
