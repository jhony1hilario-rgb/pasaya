-- =============================================================================
-- SISTEMA PASAYA - BASE DE DATOS TRANSACCIONAL DE TRANSPORTE URBANO
-- Motor: PostgreSQL 17
-- Archivo: database/schema.sql
-- Descripción: Creación de tablas, restricciones, claves foráneas e índices.
-- =============================================================================

-- Limpieza previa en orden inverso de dependencias para permitir ejecuciones idempotentes
DROP TABLE IF EXISTS liquidacion CASCADE;
DROP TABLE IF EXISTS reposicion_tarjeta CASCADE;
DROP TABLE IF EXISTS cierre_recaudacion CASCADE;
DROP TABLE IF EXISTS viaje CASCADE;
DROP TABLE IF EXISTS tarifa CASCADE;
DROP TABLE IF EXISTS ruta_paradero CASCADE;
DROP TABLE IF EXISTS paradero CASCADE;
DROP TABLE IF EXISTS ruta CASCADE;
DROP TABLE IF EXISTS unidad CASCADE;
DROP TABLE IF EXISTS conductor CASCADE;
DROP TABLE IF EXISTS empresa CASCADE;
DROP TABLE IF EXISTS recarga CASCADE;
DROP TABLE IF EXISTS punto_recarga CASCADE;
DROP TABLE IF EXISTS tarjeta CASCADE;
DROP TABLE IF EXISTS pasajero CASCADE;
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol CASCADE;

-- -----------------------------------------------------------------------------
-- 1. SEGURIDAD Y CONTROL DE ACCESOS
-- -----------------------------------------------------------------------------

CREATE TABLE rol (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE rol IS 'Roles de seguridad para control de acceso RBAC';

CREATE TABLE usuario (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_id INTEGER NOT NULL REFERENCES rol(id) ON DELETE RESTRICT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Almacena hash bcrypt / Argon2id, nunca texto plano
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE usuario IS 'Cuentas de usuario autorizadas para operar la plataforma';

CREATE TABLE auditoria (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id VARCHAR(50),
    detalles JSONB,
    ip_origen VARCHAR(45),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE auditoria IS 'Registro inmutable de eventos críticos para trazabilidad y seguridad';

-- -----------------------------------------------------------------------------
-- 2. PASAJEROS, TARJETAS Y RECARGAS (PROCESOS 1, 2 Y 7)
-- -----------------------------------------------------------------------------

CREATE TABLE pasajero (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_documento VARCHAR(20) DEFAULT 'DNI' NOT NULL CHECK (tipo_documento IN ('DNI', 'CE', 'PASAPORTE')),
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(120) UNIQUE,
    tipo_tarifa VARCHAR(20) DEFAULT 'general' NOT NULL CHECK (tipo_tarifa IN ('general', 'estudiante')),
    fecha_vencimiento_estudiante DATE,
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE tarjeta (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_tarjeta VARCHAR(30) NOT NULL UNIQUE,
    pasajero_id INTEGER NOT NULL REFERENCES pasajero(id) ON DELETE RESTRICT,
    tipo_tarifa VARCHAR(20) DEFAULT 'general' NOT NULL CHECK (tipo_tarifa IN ('general', 'estudiante')),
    saldo NUMERIC(10,2) DEFAULT 0.00 NOT NULL CHECK (saldo >= 0.00 AND saldo <= 300.00),
    estado VARCHAR(20) DEFAULT 'activa' NOT NULL CHECK (estado IN ('activa', 'bloqueada', 'reemplazada')),
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE tarjeta IS 'Dispositivo prepago con saldo monetario para el pago de pasajes';

CREATE TABLE punto_recarga (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL CHECK (estado IN ('activo', 'inactivo'))
);

CREATE TABLE recarga (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tarjeta_id INTEGER NOT NULL REFERENCES tarjeta(id) ON DELETE RESTRICT,
    punto_recarga_id INTEGER NOT NULL REFERENCES punto_recarga(id) ON DELETE RESTRICT,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    monto NUMERIC(10,2) NOT NULL CHECK (monto > 0.00 AND monto <= 100.00),
    saldo_anterior NUMERIC(10,2) NOT NULL CHECK (saldo_anterior >= 0.00),
    saldo_posterior NUMERIC(10,2) NOT NULL CHECK (saldo_posterior >= saldo_anterior),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE recarga IS 'Transacción financiera que abona saldo a la tarjeta del usuario';

CREATE TABLE reposicion_tarjeta (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tarjeta_origen_id INTEGER NOT NULL REFERENCES tarjeta(id) ON DELETE RESTRICT,
    tarjeta_destino_id INTEGER NOT NULL REFERENCES tarjeta(id) ON DELETE RESTRICT,
    motivo VARCHAR(30) NOT NULL CHECK (motivo IN ('perdida', 'robo', 'deterioro')),
    saldo_transferido NUMERIC(10,2) NOT NULL CHECK (saldo_transferido >= 0.00),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 3. EMPRESAS, CONDUCTORES Y FLOTA DE UNIDADES (PROCESO 3)
-- -----------------------------------------------------------------------------

CREATE TABLE empresa (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ruc VARCHAR(11) NOT NULL UNIQUE CHECK (length(ruc) = 11),
    razon_social VARCHAR(150) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activa' NOT NULL CHECK (estado IN ('activa', 'inactiva'))
);

CREATE TABLE conductor (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dni VARCHAR(8) NOT NULL UNIQUE CHECK (length(dni) = 8),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    licencia VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activo' NOT NULL CHECK (estado IN ('activo', 'inactivo'))
);

CREATE TABLE unidad (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresa(id) ON DELETE RESTRICT,
    conductor_id INTEGER REFERENCES conductor(id) ON DELETE SET NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    padron VARCHAR(20) NOT NULL,
    capacidad_pasajeros INTEGER NOT NULL CHECK (capacidad_pasajeros > 0),
    estado VARCHAR(20) DEFAULT 'operativo' NOT NULL CHECK (estado IN ('operativo', 'en_mantenimiento', 'baja'))
);

-- -----------------------------------------------------------------------------
-- 4. RUTAS, PARADEROS Y TARIFAS (PROCESO 4)
-- -----------------------------------------------------------------------------

CREATE TABLE ruta (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_ruta VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    paradero_inicio VARCHAR(100) NOT NULL,
    paradero_fin VARCHAR(100) NOT NULL,
    distancia_km NUMERIC(6,2) NOT NULL CHECK (distancia_km > 0.00),
    estado VARCHAR(20) DEFAULT 'activa' NOT NULL CHECK (estado IN ('activa', 'inactiva'))
);

CREATE TABLE paradero (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200) NOT NULL
);

-- Entidad intermedia para la relación N:M entre ruta y paradero
CREATE TABLE ruta_paradero (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ruta_id INTEGER NOT NULL REFERENCES ruta(id) ON DELETE CASCADE,
    paradero_id INTEGER NOT NULL REFERENCES paradero(id) ON DELETE RESTRICT,
    orden_parada INTEGER NOT NULL CHECK (orden_parada > 0),
    CONSTRAINT uq_ruta_orden UNIQUE (ruta_id, orden_parada),
    CONSTRAINT uq_ruta_paradero UNIQUE (ruta_id, paradero_id)
);

CREATE TABLE tarifa (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ruta_id INTEGER NOT NULL REFERENCES ruta(id) ON DELETE CASCADE,
    tipo_pasajero VARCHAR(20) NOT NULL CHECK (tipo_pasajero IN ('general', 'estudiante')),
    monto NUMERIC(10,2) NOT NULL CHECK (monto > 0.00),
    estado VARCHAR(20) DEFAULT 'vigente' NOT NULL CHECK (estado IN ('vigente', 'historica')),
    CONSTRAINT uq_ruta_tipo_vigente UNIQUE (ruta_id, tipo_pasajero, estado)
);

-- -----------------------------------------------------------------------------
-- 5. VIAJES, RECAUDACIÓN Y LIQUIDACIONES (PROCESOS 5, 6 Y 8)
-- -----------------------------------------------------------------------------

CREATE TABLE viaje (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tarjeta_id INTEGER NOT NULL REFERENCES tarjeta(id) ON DELETE RESTRICT,
    unidad_id INTEGER NOT NULL REFERENCES unidad(id) ON DELETE RESTRICT,
    ruta_id INTEGER NOT NULL REFERENCES ruta(id) ON DELETE RESTRICT,
    tarifa_monto NUMERIC(10,2) NOT NULL CHECK (tarifa_monto > 0.00),
    saldo_anterior NUMERIC(10,2) NOT NULL CHECK (saldo_anterior >= 0.00),
    saldo_posterior NUMERIC(10,2) NOT NULL CHECK (saldo_posterior >= 0.00),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado VARCHAR(30) DEFAULT 'exitoso' NOT NULL CHECK (estado IN ('exitoso', 'rechazado_saldo_insuficiente', 'rechazado_bloqueada'))
);

COMMENT ON TABLE viaje IS 'Transacción de cobro automático por abordaje a la unidad';

CREATE TABLE cierre_recaudacion (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    unidad_id INTEGER NOT NULL REFERENCES unidad(id) ON DELETE RESTRICT,
    ruta_id INTEGER NOT NULL REFERENCES ruta(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    total_viajes INTEGER NOT NULL CHECK (total_viajes >= 0),
    monto_total NUMERIC(10,2) NOT NULL CHECK (monto_total >= 0.00),
    estado VARCHAR(20) DEFAULT 'cerrado' NOT NULL CHECK (estado IN ('pendiente', 'cerrado', 'liquidado')),
    fecha_cierre TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_unidad_ruta_fecha UNIQUE (unidad_id, ruta_id, fecha)
);

CREATE TABLE liquidacion (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresa(id) ON DELETE RESTRICT,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    total_viajes INTEGER NOT NULL CHECK (total_viajes >= 0),
    monto_bruto NUMERIC(10,2) NOT NULL CHECK (monto_bruto >= 0.00),
    porcentaje_comision NUMERIC(5,2) DEFAULT 5.00 NOT NULL CHECK (porcentaje_comision >= 0.00),
    monto_comision NUMERIC(10,2) NOT NULL CHECK (monto_comision >= 0.00),
    monto_neto NUMERIC(10,2) NOT NULL CHECK (monto_neto >= 0.00),
    estado VARCHAR(20) DEFAULT 'calculada' NOT NULL CHECK (estado IN ('calculada', 'pagada', 'anulada')),
    fecha_liquidacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    CONSTRAINT chk_periodo CHECK (periodo_fin >= periodo_inicio),
    CONSTRAINT chk_balance_neto CHECK (monto_neto = (monto_bruto - monto_comision))
);

-- -----------------------------------------------------------------------------
-- 6. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
-- -----------------------------------------------------------------------------

CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_tarjeta_codigo ON tarjeta(codigo_tarjeta);
CREATE INDEX idx_tarjeta_pasajero ON tarjeta(pasajero_id);
CREATE INDEX idx_viaje_tarjeta ON viaje(tarjeta_id, fecha_hora DESC);
CREATE INDEX idx_viaje_unidad_fecha ON viaje(unidad_id, fecha_hora DESC);
CREATE INDEX idx_recarga_tarjeta ON recarga(tarjeta_id, fecha_hora DESC);
CREATE INDEX idx_cierre_fecha ON cierre_recaudacion(fecha, unidad_id);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id, fecha_hora DESC);
