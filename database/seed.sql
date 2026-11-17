-- =============================================================================
-- SISTEMA PASAYA - DATOS DE PRUEBA INICIALES (ADAPTADO A AREQUIPA, PERÚ)
-- Motor: PostgreSQL 17
-- Archivo: database/seed.sql
-- Descripción: Carga de 2 roles, 3 usuarios con hash seguro y entidades principales
--              adaptadas al sistema de transporte urbano de Arequipa (SIT).
-- =============================================================================

-- 1. ROLES
INSERT INTO rol (nombre, descripcion) VALUES
('administrador', 'Acceso total a la configuración del sistema, gestión financiera, usuarios y auditoría'),
('operador', 'Supervisión de flotas, control de abordaje, recaudación y registro de unidades'),
('cajero', 'Atención en puntos autorizados para emisión de tarjetas y recargas de saldo');

-- 2. USUARIOS (Contraseñas con formato hash bcrypt seguro de 60 caracteres)
-- Contraseña simulada de prueba para desarrollo: 'Password123*'
INSERT INTO usuario (rol_id, nombres, apellidos, email, password_hash, estado) VALUES
(1, 'Andrea', 'Mendoza Quispe', 'admin@pasaya.pe', '$2b$12$e8yvW7m9bW3y2A6D3v6jTuY81o4A5E7G9H1J3K5L7M9N1P3Q5R7S', 'activo'),
(2, 'Carlos', 'Ramos Valencia', 'operador@pasaya.pe', '$2b$12$k2Lp9Q4s1A8d5F6g7H9j0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5a', 'activo'),
(3, 'Lucía', 'Fernández Castro', 'cajero@pasaya.pe', '$2b$12$m4N6p8Q0r2T4v6X8z0B2D4F6H8J0L2N4P6R8T0V2X4Z6b8d0f2h4', 'activo');

-- 3. AUDITORÍA INICIAL
INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalles, ip_origen) VALUES
(1, 'CONFIG_INICIAL', 'sistema', '0', '{"evento": "Inicialización del esquema y carga de catálogos base para Arequipa"}', '192.168.1.50'),
(1, 'ALTA_USUARIO', 'usuario', '2', '{"email": "operador@pasaya.pe", "rol": "operador"}', '192.168.1.50'),
(1, 'ALTA_USUARIO', 'usuario', '3', '{"email": "cajero@pasaya.pe", "rol": "cajero"}', '192.168.1.50');

-- 4. PASAJEROS
INSERT INTO pasajero (tipo_documento, numero_documento, nombres, apellidos, telefono, email, tipo_tarifa, fecha_vencimiento_estudiante, estado) VALUES
('DNI', '72345678', 'Juan Diego', 'Pérez Morales', '987112233', 'juan.perez@gmail.com', 'general', NULL, 'activo'),
('DNI', '73456789', 'María Fernanda', 'Gómez Ríos', '987223344', 'maria.gomez@tecsup.edu.pe', 'estudiante', '2027-12-31', 'activo'),
('DNI', '74567890', 'Rodrigo Andrés', 'Torres Soto', '987334455', 'rodrigo.torres@unsa.edu.pe', 'estudiante', '2027-08-31', 'activo'),
('CE',  '00129845', 'Elena Sofía', 'Vásquez Martínez', '987445566', 'elena.vasquez@outlook.com', 'general', NULL, 'activo'),
('DNI', '76789012', 'Mateo Gabriel', 'Flores Cárdenas', '987556677', 'mateo.flores@yahoo.com', 'general', NULL, 'activo');

-- 5. TARJETAS
INSERT INTO tarjeta (codigo_tarjeta, pasajero_id, tipo_tarifa, saldo, estado, fecha_emision) VALUES
('TARJ-1001', 1, 'general', 17.00, 'activa', '2026-10-01 08:00:00+00'),
('TARJ-1002', 2, 'estudiante', 29.30, 'activa', '2026-10-02 09:30:00+00'),
('TARJ-1003', 3, 'estudiante', 9.30, 'activa', '2026-10-03 11:15:00+00'),
('TARJ-1004', 4, 'general', 0.00, 'bloqueada', '2026-10-04 14:00:00+00'),
('TARJ-1005', 4, 'general', 31.50, 'activa', '2026-10-15 16:20:00+00'),
('TARJ-1006', 5, 'general', 0.40, 'activa', '2026-10-18 10:00:00+00');

-- 6. PUNTOS DE RECARGA (Terminales y Óvalos Representativos de Arequipa)
INSERT INTO punto_recarga (codigo, nombre, direccion, estado) VALUES
('PTO-001', 'Terminal Terrestre Arequipa', 'Av. Arturo Ibáñez s/n, J.L. Bustamante y Rivero', 'activo'),
('PTO-002', 'Plaza de Armas de Arequipa', 'Portal de San Agustín 115, Cercado de Arequipa', 'activo'),
('PTO-003', 'Plataforma Andrés Avelino Cáceres', 'Av. Avelino Cáceres s/n, J.L. Bustamante y Rivero', 'activo'),
('PTO-004', 'Óvalo de Cayma', 'Av. Ejército cruce con Av. Cayma, Cayma', 'activo'),
('PTO-005', 'Terminal Pesquero Río Seco (Cono Norte)', 'Av. Vía 54 con Av. Miguel Grau, Cerro Colorado', 'activo');

-- 7. RECARGAS
INSERT INTO recarga (tarjeta_id, punto_recarga_id, usuario_id, monto, saldo_anterior, saldo_posterior, fecha_hora) VALUES
(1, 1, 3, 20.00, 0.00, 20.00, '2026-10-20 08:15:00+00'),
(2, 2, 3, 30.00, 0.00, 30.00, '2026-10-20 09:00:00+00'),
(3, 3, 3, 10.00, 0.00, 10.00, '2026-10-21 07:45:00+00'),
(4, 1, 3, 35.00, 0.00, 35.00, '2026-10-10 12:30:00+00'),
(6, 5, 3, 10.00, 0.00, 10.00, '2026-10-22 17:10:00+00');

-- 8. REPOSICIÓN DE TARJETA (Traspaso de saldo de tarjeta 4 extraviada a tarjeta 5)
INSERT INTO reposicion_tarjeta (tarjeta_origen_id, tarjeta_destino_id, motivo, saldo_transferido, fecha_hora, usuario_id) VALUES
(4, 5, 'robo', 32.50, '2026-10-15 16:20:00+00', 1);

-- 9. EMPRESAS CONCESIONARIAS (Operadores del Sistema Integrado de Transporte - Arequipa)
INSERT INTO empresa (ruc, razon_social, direccion, telefono, estado) VALUES
('20539874101', 'Consorcio Empresarial Cono Norte S.A.C.', 'Av. Aviación 602, Cerro Colorado, Arequipa', '054-254120', 'activa'),
('20455612345', 'TransCayma S.A.', 'Av. Ramón Castilla 820, Cayma, Arequipa', '054-271500', 'activa'),
('20566718290', 'Consorcio Paucarpata S.A.', 'Av. Mariscal Castilla 1120, Paucarpata, Arequipa', '054-428890', 'activa'),
('20601982341', 'Empresa de Transportes Unión Avelino Cáceres S.R.L.', 'Av. Dolores 450, J.L. Bustamante y Rivero, Arequipa', '054-431122', 'activa'),
('20788334411', 'Socabaya Express S.A.C.', 'Av. San Martín 305, Socabaya, Arequipa', '054-442200', 'activa');

-- 10. CONDUCTORES
INSERT INTO conductor (dni, nombres, apellidos, licencia, telefono, estado) VALUES
('40123456', 'Manuel Alberto', 'Reyes Chávez', 'Q40123456', '991223344', 'activo'),
('41234567', 'Víctor Hugo', 'Paredes Mamani', 'Q41234567', '992334455', 'activo'),
('42345678', 'Jorge Luis', 'Campos Navarro', 'Q42345678', '993445566', 'activo'),
('43456789', 'Héctor Rolando', 'Salazar Peña', 'Q43456789', '994556677', 'activo'),
('44567890', 'César Augusto', 'Mendoza Vilca', 'Q44567890', '995667788', 'activo');

-- 11. UNIDADES DE TRANSPORTE (Buses con placa de la Región Arequipa - Serie V)
INSERT INTO unidad (empresa_id, conductor_id, placa, padron, capacidad_pasajeros, estado) VALUES
(1, 1, 'V6A-720', 'CN-01', 50, 'operativo'),
(1, 2, 'V3D-815', 'CN-02', 45, 'operativo'),
(2, 3, 'V9F-640', 'TC-101', 60, 'operativo'),
(2, 4, 'V2K-512', 'TC-102', 55, 'operativo'),
(3, 5, 'V4M-308', 'CP-201', 50, 'operativo');

-- 12. RUTAS URBANAS DE AREQUIPA
INSERT INTO ruta (codigo_ruta, nombre, paradero_inicio, paradero_fin, distancia_km, estado) VALUES
('R-101', 'Troncal Cono Norte - Terminal Terrestre', 'Paradero Río Seco (Cerro Colorado)', 'Terminal Terrestre (JLByR)', 21.50, 'activa'),
('R-102', 'Corredor Cayma - Centro Histórico', 'Bolognesi (Cayma)', 'Puente Grau (Cercado)', 12.00, 'activa'),
('R-201', 'Interconector Socabaya - Avelino Cáceres', 'Ciudad Mi Trabajo (Socabaya)', 'Plataforma Avelino Cáceres (JLByR)', 14.50, 'activa'),
('R-305', 'Ruta Paucarpata - Av. Ejército', 'Miguel Grau (Paucarpata)', 'Mall Plaza / Av. Ejército (Cayma)', 18.20, 'activa'),
('R-408', 'Alimentador Hunter - Terminal Terrestre', 'Terminal Hunter', 'Terminal Terrestre (JLByR)', 9.80, 'activa');

-- 13. PARADEROS PRINCIPALES DE AREQUIPA
INSERT INTO paradero (codigo, nombre, ubicacion) VALUES
('PAR-01', 'Paradero Río Seco', 'Cerro Colorado'),
('PAR-02', 'Óvalo de Cayma', 'Cayma'),
('PAR-03', 'Puente Grau / Santa Catalina', 'Arequipa Cercado'),
('PAR-04', 'Plataforma Andrés Avelino Cáceres', 'J.L. Bustamante y Rivero'),
('PAR-05', 'Terminal Terrestre Arequipa', 'J.L. Bustamante y Rivero');

-- 14. ASIGNACIÓN RUTA-PARADERO
INSERT INTO ruta_paradero (ruta_id, paradero_id, orden_parada) VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
(1, 4, 4),
(1, 5, 5);

-- 15. TARIFAS (Tarifas Reales de Transporte Urbano en Arequipa)
INSERT INTO tarifa (ruta_id, tipo_pasajero, monto, estado) VALUES
(1, 'general', 1.50, 'vigente'),
(1, 'estudiante', 0.70, 'vigente'),
(2, 'general', 1.00, 'vigente'),
(2, 'estudiante', 0.50, 'vigente'),
(3, 'general', 1.00, 'vigente'),
(3, 'estudiante', 0.50, 'vigente');

-- 16. VIAJES (Transacciones de cobro al abordar adaptadas a las tarifas de Arequipa)
INSERT INTO viaje (tarjeta_id, unidad_id, ruta_id, tarifa_monto, saldo_anterior, saldo_posterior, fecha_hora, estado) VALUES
(1, 1, 1, 1.50, 20.00, 18.50, '2026-10-25 07:30:00+00', 'exitoso'),
(2, 1, 1, 0.70, 30.00, 29.30, '2026-10-25 07:35:00+00', 'exitoso'),
(3, 2, 1, 0.70, 10.00, 9.30,  '2026-10-25 08:10:00+00', 'exitoso'),
(5, 3, 2, 1.00, 32.50, 31.50, '2026-10-25 08:45:00+00', 'exitoso'),
(1, 1, 1, 1.50, 18.50, 17.00, '2026-10-25 18:20:00+00', 'exitoso');

-- 17. CIERRES DE RECAUDACIÓN (Consolidados diarios en Arequipa)
INSERT INTO cierre_recaudacion (unidad_id, ruta_id, fecha, total_viajes, monto_total, estado, fecha_cierre) VALUES
(1, 1, '2026-10-25', 280, 385.00, 'cerrado', '2026-10-25 23:30:00+00'),
(2, 1, '2026-10-25', 260, 358.00, 'cerrado', '2026-10-25 23:45:00+00'),
(3, 2, '2026-10-25', 310, 295.00, 'cerrado', '2026-10-25 23:50:00+00'),
(4, 2, '2026-10-25', 290, 276.00, 'cerrado', '2026-10-25 23:55:00+00'),
(5, 3, '2026-10-25', 240, 228.00, 'cerrado', '2026-10-25 23:40:00+00');

-- 18. LIQUIDACIONES A EMPRESAS CONCESIONARIAS
INSERT INTO liquidacion (empresa_id, periodo_inicio, periodo_fin, total_viajes, monto_bruto, porcentaje_comision, monto_comision, monto_neto, estado, fecha_liquidacion, usuario_id) VALUES
(1, '2026-10-19', '2026-10-25', 3850, 5250.00, 5.00, 262.50, 4987.50, 'pagada', '2026-10-26 10:00:00+00', 1),
(2, '2026-10-19', '2026-10-25', 4200, 4000.00, 5.00, 200.00, 3800.00, 'pagada', '2026-10-26 10:30:00+00', 1),
(3, '2026-10-19', '2026-10-25', 1680, 1600.00, 5.00, 80.00,  1520.00, 'calculada', '2026-10-26 11:00:00+00', 1);
