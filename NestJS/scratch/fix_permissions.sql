-- Cambiar dueño de las tablas a stimi
ALTER TABLE "roles" OWNER TO stimi;
ALTER TABLE "areas" OWNER TO stimi;
ALTER TABLE "periodos_carga" OWNER TO stimi;
ALTER TABLE "usuarios" OWNER TO stimi;
ALTER TABLE "contratos" OWNER TO stimi;
ALTER TABLE "obligaciones" OWNER TO stimi;
ALTER TABLE "informes" OWNER TO stimi;
ALTER TABLE "informe_gc" OWNER TO stimi;
ALTER TABLE "actividades" OWNER TO stimi;
ALTER TABLE "evidencias" OWNER TO stimi;
ALTER TABLE "informe_gf" OWNER TO stimi;
ALTER TABLE "versiones" OWNER TO stimi;
ALTER TABLE "novedades" OWNER TO stimi;

-- Cambiar dueño de las secuencias a stimi (para los campos SERIAL autoincrementables)
ALTER SEQUENCE IF EXISTS roles_id_rol_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS areas_id_area_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS periodos_carga_id_periodo_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS usuarios_id_usuario_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS contratos_id_contrato_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS obligaciones_id_obligacion_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS informes_id_informe_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS informe_gc_id_informe_gc_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS actividades_id_actividad_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS evidencias_id_evidencia_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS informe_gf_id_informe_gf_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS versiones_id_version_seq OWNER TO stimi;
ALTER SEQUENCE IF EXISTS novedades_id_novedad_seq OWNER TO stimi;

-- Conceder privilegios adicionales por seguridad
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stimi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stimi;
