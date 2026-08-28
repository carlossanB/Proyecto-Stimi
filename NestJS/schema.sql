-- PostgreSQL DDL Schema for Sena Project ("proyecto_formativo")

-- 1. Roles
CREATE TABLE "roles" (
  "id_rol" SERIAL PRIMARY KEY,
  "nombre_rol" VARCHAR(30) NOT NULL UNIQUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP
);

-- 2. Areas
CREATE TABLE "areas" (
  "id_area" SERIAL PRIMARY KEY,
  "nombre_area" VARCHAR(100) NOT NULL,
  "id_regional" INTEGER NOT NULL DEFAULT 1,
  "tipo" VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  CONSTRAINT "UQ_areas_nombre_regional" UNIQUE ("nombre_area", "id_regional")
);

-- 3. Periodos de Carga
CREATE TABLE "periodos_carga" (
  "id_periodo" SERIAL PRIMARY KEY,
  "anio" SMALLINT NOT NULL,
  "mes" SMALLINT NOT NULL,
  "fecha_limite" DATE NOT NULL,
  "habilitado" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP
);

-- 4. Usuarios (Personas)
CREATE TABLE "usuarios" (
  "id_usuario" SERIAL PRIMARY KEY,
  "nombre_completo" VARCHAR(150) NOT NULL,
  "tipo_documento" VARCHAR(2) NOT NULL,
  "numero_documento" VARCHAR(20) NOT NULL UNIQUE,
  "correo" VARCHAR(150) NOT NULL UNIQUE,
  "contrasena_hash" VARCHAR(255) NOT NULL,
  "estado_cuenta" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  "firma_digital_ruta" VARCHAR(255),
  "foto_perfil_ruta" VARCHAR(255),
  "firma_digital_actualizada_at" TIMESTAMP,
  "preferencias_notificaciones" TEXT NOT NULL DEFAULT '{}',
  "aprobado_por_id" INTEGER,
  "fecha_aprobacion" TIMESTAMP,
  "motivo_rechazo" VARCHAR(255),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "id_rol" INTEGER REFERENCES "roles" ("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION,
  "id_area" INTEGER REFERENCES "areas" ("id_area") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- 5. Contratos
CREATE TABLE "contratos" (
  "id_contrato" SERIAL PRIMARY KEY,
  "fecha_inicio" DATE NOT NULL,
  "fecha_fin" DATE NOT NULL,
  "estado" VARCHAR(50) NOT NULL DEFAULT 'activo',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "id_usuario" INTEGER NOT NULL REFERENCES "usuarios" ("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- 6. Obligaciones
CREATE TABLE "obligaciones" (
  "id_obligacion" SERIAL PRIMARY KEY,
  "descripcion" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "id_contrato" INTEGER NOT NULL REFERENCES "contratos" ("id_contrato") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- 7. Informes
CREATE TABLE "informes" (
  "id_informe" SERIAL PRIMARY KEY,
  "tipo_informe" VARCHAR(2) NOT NULL,
  "estado" VARCHAR(20) NOT NULL DEFAULT 'borrador',
  "firmado" BOOLEAN NOT NULL DEFAULT FALSE,
  "pendiente_sincronizacion" BOOLEAN NOT NULL DEFAULT FALSE,
  "fecha_envio" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "observacion" TEXT,
  "id_usuario" INTEGER NOT NULL REFERENCES "usuarios" ("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION,
  "id_periodo" INTEGER NOT NULL REFERENCES "periodos_carga" ("id_periodo") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- 8. Informe de Gestión y Control (Informe GC)
CREATE TABLE "informe_gc" (
  "id_informe_gc" SERIAL PRIMARY KEY,
  "version_formato" VARCHAR(20) NOT NULL DEFAULT 'GTH-F-062 V10',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "id_informe" INTEGER NOT NULL UNIQUE REFERENCES "informes" ("id_informe") ON DELETE NO ACTION ON UPDATE NO ACTION,
  "id_contrato" INTEGER NOT NULL REFERENCES "contratos" ("id_contrato") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- 9. Actividades
CREATE TABLE "actividades" (
  "id_actividad" SERIAL PRIMARY KEY,
  "fecha_inicio" DATE NOT NULL,
  "fecha_fin" DATE NOT NULL,
  "competencia" VARCHAR(100) NOT NULL,
  "resultado" TEXT NOT NULL,
  "estado" VARCHAR(3) NOT NULL DEFAULT 'ACT',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "id_informe_gc" INTEGER NOT NULL REFERENCES "informe_gc" ("id_informe_gc") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- 10. Evidencias
CREATE TABLE "evidencias" (
  "id_evidencia" SERIAL PRIMARY KEY,
  "descripcion" TEXT NOT NULL,
  "carpeta_obligacion" VARCHAR(255) NOT NULL,
  "ruta_archivo" VARCHAR(255) NOT NULL,
  "tipo_archivo" VARCHAR(10) NOT NULL,
  "tamano_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "id_actividad" INTEGER NOT NULL REFERENCES "actividades" ("id_actividad") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- 11. Informe de Gestión Financiera (Informe GF)
CREATE TABLE "informe_gf" (
  "id_informe_gf" SERIAL PRIMARY KEY,
  "version_formato" VARCHAR(50) NOT NULL,
  "valor_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
  "observaciones" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP,
  "id_informe" INTEGER NOT NULL UNIQUE REFERENCES "informes" ("id_informe") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- 12. Versiones de Informes
CREATE TABLE "versiones" (
  "id_version" SERIAL PRIMARY KEY,
  "numero_version" INTEGER NOT NULL,
  "fecha_version" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "descripcion" VARCHAR(255),
  "archivo_ruta" VARCHAR(255) NOT NULL,
  "archivo_nombre_original" VARCHAR(255) NOT NULL,
  "archivo_tamano_bytes" INTEGER,
  "observacion" TEXT,
  "estado" VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  "id_informe" INTEGER REFERENCES "informes" ("id_informe") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- 13. Novedades
CREATE TABLE "novedades" (
  "id_novedad" SERIAL PRIMARY KEY,
  "descripcion" VARCHAR(255) NOT NULL,
  "fecha_novedad" DATE NOT NULL,
  "estado" VARCHAR(50) NOT NULL DEFAULT 'activo',
  "fk_version" INTEGER REFERENCES "versiones" ("id_version") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Performance Indexes
CREATE INDEX idx_usuarios_rol ON "usuarios"("id_rol");
CREATE INDEX idx_usuarios_area ON "usuarios"("id_area");
CREATE INDEX idx_contratos_usuario ON "contratos"("id_usuario");
CREATE INDEX idx_obligaciones_contrato ON "obligaciones"("id_contrato");
CREATE INDEX idx_informes_usuario ON "informes"("id_usuario");
CREATE INDEX idx_informes_periodo ON "informes"("id_periodo");
CREATE INDEX idx_informe_gc_contrato ON "informe_gc"("id_contrato");
CREATE INDEX idx_actividades_informe_gc ON "actividades"("id_informe_gc");
CREATE INDEX idx_evidencias_actividad ON "evidencias"("id_actividad");
CREATE INDEX idx_novedades_version ON "novedades"("fk_version");
