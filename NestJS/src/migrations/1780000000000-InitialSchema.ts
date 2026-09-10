import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780000000000 implements MigrationInterface {
  name = 'InitialSchema1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Roles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id_rol" SERIAL PRIMARY KEY,
        "nombre_rol" VARCHAR(30) NOT NULL UNIQUE,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP
      );
    `);

    // 2. Areas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "areas" (
        "id_area" SERIAL PRIMARY KEY,
        "nombre_area" VARCHAR(100) NOT NULL,
        "id_regional" INTEGER NOT NULL DEFAULT 1,
        "tipo" VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP
      );
    `);

    // 3. Periodos de Carga
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "periodos_carga" (
        "id_periodo" SERIAL PRIMARY KEY,
        "anio" SMALLINT NOT NULL,
        "mes" SMALLINT NOT NULL,
        "fecha_limite" DATE NOT NULL,
        "habilitado" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP
      );
    `);

    // 4. Usuarios (Personas)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usuarios" (
        "id_usuario" SERIAL PRIMARY KEY,
        "nombre_completo" VARCHAR(150) NOT NULL,
        "tipo_documento" VARCHAR(2) NOT NULL,
        "numero_documento" VARCHAR(20) NOT NULL UNIQUE,
        "correo" VARCHAR(150) NOT NULL UNIQUE,
        "contrasena_hash" VARCHAR(255) NOT NULL,
        "estado_cuenta" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
        "carpeta_drive_url" VARCHAR(255),
        "firma_digital_ruta" VARCHAR(255),
        "foto_perfil_ruta" VARCHAR(255),
        "firma_digital_actualizada_at" TIMESTAMP,
        "preferencias_notificaciones" TEXT NOT NULL DEFAULT '{}',
        "aprobado_por_id" INTEGER,
        "fecha_aprobacion" TIMESTAMP,
        "motivo_rechazo" VARCHAR(255),
        "regional" VARCHAR(150),
        "sede_centro" VARCHAR(255),
        "reset_token" VARCHAR(255),
        "reset_token_expiry" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "id_rol" INTEGER REFERENCES "roles" ("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION,
        "id_area" INTEGER REFERENCES "areas" ("id_area") ON DELETE NO ACTION ON UPDATE NO ACTION
      );
    `);

    // 5. Contratos
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contratos" (
        "id_contrato" SERIAL PRIMARY KEY,
        "fecha_inicio" DATE NOT NULL,
        "fecha_fin" DATE NOT NULL,
        "estado" VARCHAR(50) NOT NULL DEFAULT 'activo',
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "id_usuario" INTEGER NOT NULL REFERENCES "usuarios" ("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION
      );
    `);

    // 6. Obligaciones
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "obligaciones" (
        "id_obligacion" SERIAL PRIMARY KEY,
        "descripcion" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "id_contrato" INTEGER NOT NULL REFERENCES "contratos" ("id_contrato") ON DELETE NO ACTION ON UPDATE NO ACTION
      );
    `);

    // 7. Informes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "informes" (
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
    `);

    // 8. Informe GC
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "informe_gc" (
        "id_informe_gc" SERIAL PRIMARY KEY,
        "version_formato" VARCHAR(20) NOT NULL DEFAULT 'GTH-F-062 V10',
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "id_informe" INTEGER NOT NULL UNIQUE REFERENCES "informes" ("id_informe") ON DELETE NO ACTION ON UPDATE NO ACTION,
        "id_contrato" INTEGER NOT NULL REFERENCES "contratos" ("id_contrato") ON DELETE NO ACTION ON UPDATE NO ACTION
      );
    `);

    // 9. Actividades
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "actividades" (
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
    `);

    // 10. Evidencias
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "evidencias" (
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
    `);

    // 11. Informe GF
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "informe_gf" (
        "id_informe_gf" SERIAL PRIMARY KEY,
        "version_formato" VARCHAR(50) NOT NULL,
        "valor_total" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "observaciones" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "id_informe" INTEGER NOT NULL UNIQUE REFERENCES "informes" ("id_informe") ON DELETE NO ACTION ON UPDATE NO ACTION
      );
    `);

    // 12. Versiones
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "versiones" (
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
    `);

    // 13. Novedades
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "novedades" (
        "id_novedad" SERIAL PRIMARY KEY,
        "descripcion" VARCHAR(255) NOT NULL,
        "fecha_novedad" DATE NOT NULL,
        "estado" VARCHAR(50) NOT NULL DEFAULT 'activo',
        "fk_version" INTEGER REFERENCES "versiones" ("id_version") ON DELETE NO ACTION ON UPDATE NO ACTION
      );
    `);

    // 14. Notificaciones
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notificaciones" (
        "id_notificacion" SERIAL PRIMARY KEY,
        "tipo" VARCHAR(20) NOT NULL DEFAULT 'info',
        "mensaje" TEXT NOT NULL,
        "leida" BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "id_usuario" INTEGER NOT NULL REFERENCES "usuarios" ("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // 15. Historial Conversacion (Chat / Bot)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historial_conversacion" (
        "id" SERIAL PRIMARY KEY,
        "remoteJid" VARCHAR(100) NOT NULL,
        "telefono" VARCHAR(30) NOT NULL,
        "rol" VARCHAR(20) NOT NULL,
        "contenido" TEXT NOT NULL,
        "tipo_mensaje" VARCHAR(20) NOT NULL DEFAULT 'texto',
        "cedula" VARCHAR(30),
        "origen" VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
        "creado_en" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Índices base
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_usuarios_rol" ON "usuarios" ("id_rol");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_usuarios_area" ON "usuarios" ("id_area");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_contratos_usuario" ON "contratos" ("id_usuario");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_obligaciones_contrato" ON "obligaciones" ("id_contrato");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_informes_usuario" ON "informes" ("id_usuario");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_informes_periodo" ON "informes" ("id_periodo");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_informe_gc_contrato" ON "informe_gc" ("id_contrato");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_actividades_informe_gc" ON "actividades" ("id_informe_gc");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_evidencias_actividad" ON "evidencias" ("id_actividad");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_novedades_version" ON "novedades" ("fk_version");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir de forma segura solo si es necesario
    await queryRunner.query(`DROP TABLE IF EXISTS "historial_conversacion" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notificaciones" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "novedades" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "versiones" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "informe_gf" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "evidencias" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "actividades" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "informe_gc" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "informes" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "obligaciones" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contratos" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuarios" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "periodos_carga" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "areas" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE;`);
  }
}
