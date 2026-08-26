-- ============================================================
-- Migración: Agregar columnas regional y sede_centro a la tabla usuarios
-- Fecha: 2026-08-25
-- Sistema: STIMI SENA - Punto 7
-- ============================================================

-- Agregar columna regional (nullable, máximo 150 chars)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS regional VARCHAR(150) NULL AFTER motivo_rechazo;

-- Agregar columna sede_centro (nullable, máximo 255 chars)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS sede_centro VARCHAR(255) NULL AFTER regional;

-- ============================================================
-- Verificar que las columnas se crearon correctamente:
-- DESCRIBE usuarios;
-- ============================================================
