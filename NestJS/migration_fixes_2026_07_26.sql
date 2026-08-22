-- ============================================================
-- STIMI — Migraciones para los fixes del 2026-07-26
-- Ejecutar manualmente en la base de datos PostgreSQL
-- Base de datos: proyecto_formativo
-- ============================================================

-- 1. Agregar campos de recuperación de contraseña a la tabla usuarios
-- (La entidad Persona mapea la tabla 'usuarios')
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP NULL;

-- 2. Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id_notificacion SERIAL PRIMARY KEY,
  id_usuario      INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  tipo            VARCHAR(20) NOT NULL DEFAULT 'info',
  mensaje         TEXT NOT NULL,
  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida   ON notificaciones(id_usuario, leida);

-- ============================================================
-- Verificación (opcional — ejecutar después de las migraciones)
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'usuarios' AND column_name IN ('reset_token', 'reset_token_expiry');
--
-- SELECT table_name FROM information_schema.tables
--   WHERE table_name = 'notificaciones';
