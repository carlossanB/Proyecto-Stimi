import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * AddTenantId1787792351470
 *
 * Añade la columna tenant_id a todas las tablas tenant-aware.
 * Cada bloque usa DO $$ BEGIN … EXCEPTION WHEN … END $$ para que:
 *  - Si la tabla no existe en el entorno destino → se omite silenciosamente.
 *  - Si la columna ya fue añadida en una ejecución previa → se omite.
 *  - Si el índice ya existe → se omite.
 * De esta forma la migración es idempotente y segura en prod y dev.
 */
export class AddTenantId1787792351470 implements MigrationInterface {
    name = 'AddTenantId1787792351470';

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ── 0. Eliminar constraint que puede ya no existir ───────────────────
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "areas" DROP CONSTRAINT "UQ_areas_nombre_regional";
            EXCEPTION WHEN undefined_object OR undefined_table THEN NULL;
            END $$;
        `);

        // ── helper: lista de tablas que deben recibir tenant_id ──────────────
        // Para cada una: ADD COLUMN si no existe + CREATE INDEX si no existe.
        const tables: Array<{ table: string; indexName: string }> = [
            { table: 'areas',                  indexName: 'IDX_4799912b058701d9bb23541c17' },
            { table: 'evidencias',             indexName: 'IDX_ae7df422f4a0d8f686d3b55f21' },
            { table: 'usuarios',               indexName: 'IDX_7b664ae6b7cda3df230794ff6c' },
            { table: 'obligaciones',           indexName: 'IDX_d90731fa9f6fdede14e1fa723f' },
            { table: 'contratos',              indexName: 'IDX_a0906d94882b0177428dfe3b67' },
            { table: 'informe_gf',             indexName: 'IDX_a2d6c9b1e8e82a8187ecffc376' },
            { table: 'periodos_carga',         indexName: 'IDX_6f1b57184cb89b58b4c23dc925' },
            { table: 'informes',               indexName: 'IDX_c60831dacbd1dad39cb06d7b41' },
            { table: 'informe_gc',             indexName: 'IDX_46c58d4d1d82a18cb055f68c1f' },
            { table: 'actividades',            indexName: 'IDX_894e5692ae2460215cc3c6c17e' },
            { table: 'notificaciones',         indexName: 'IDX_00cc52d244d8f3108bb28ce251' },
            { table: 'novedades',              indexName: 'IDX_beaf1705d0c7f3cfb1790150ff' },
            { table: 'historial_conversacion', indexName: 'IDX_e299fc0ac0c3cdc02f4edb5f7f' },
        ];

        // ── 1. Crear historial_conversacion si no existe en prod ─────────────
        // Esta tabla se crea con TypeORM synchronize en dev pero puede faltar
        // en producción si aún no se desplegó el módulo de webhooks.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "historial_conversacion" (
                "id"          SERIAL PRIMARY KEY,
                "created_at"  TIMESTAMP DEFAULT now() NOT NULL,
                "updated_at"  TIMESTAMP DEFAULT now() NOT NULL,
                "deleted_at"  TIMESTAMP,
                "tenant_id"   character varying(50) NOT NULL DEFAULT 'default'
            );
        `);

        // ── 2. ADD COLUMN tenant_id en cada tabla (idempotente) ──────────────
        for (const { table, indexName } of tables) {
            // ADD COLUMN — omitir si la tabla no existe o la columna ya existe
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "${table}"
                        ADD COLUMN "tenant_id" character varying(50) NOT NULL DEFAULT 'default';
                EXCEPTION
                    WHEN undefined_table      THEN NULL;   -- tabla no existe en este entorno
                    WHEN duplicate_column     THEN NULL;   -- columna ya fue añadida
                END $$;
            `);

            // CREATE INDEX — omitir si ya existe
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE INDEX "${indexName}" ON "${table}" ("tenant_id");
                EXCEPTION
                    WHEN undefined_table      THEN NULL;   -- tabla no existe
                    WHEN duplicate_table      THEN NULL;   -- índice ya existe (nombre duplicado)
                END $$;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables: Array<{ table: string; indexName: string }> = [
            { table: 'historial_conversacion', indexName: 'IDX_e299fc0ac0c3cdc02f4edb5f7f' },
            { table: 'novedades',              indexName: 'IDX_beaf1705d0c7f3cfb1790150ff' },
            { table: 'notificaciones',         indexName: 'IDX_00cc52d244d8f3108bb28ce251' },
            { table: 'actividades',            indexName: 'IDX_894e5692ae2460215cc3c6c17e' },
            { table: 'informe_gc',             indexName: 'IDX_46c58d4d1d82a18cb055f68c1f' },
            { table: 'informes',               indexName: 'IDX_c60831dacbd1dad39cb06d7b41' },
            { table: 'periodos_carga',         indexName: 'IDX_6f1b57184cb89b58b4c23dc925' },
            { table: 'informe_gf',             indexName: 'IDX_a2d6c9b1e8e82a8187ecffc376' },
            { table: 'contratos',              indexName: 'IDX_a0906d94882b0177428dfe3b67' },
            { table: 'obligaciones',           indexName: 'IDX_d90731fa9f6fdede14e1fa723f' },
            { table: 'usuarios',               indexName: 'IDX_7b664ae6b7cda3df230794ff6c' },
            { table: 'evidencias',             indexName: 'IDX_ae7df422f4a0d8f686d3b55f21' },
            { table: 'areas',                  indexName: 'IDX_4799912b058701d9bb23541c17' },
        ];

        for (const { table, indexName } of tables) {
            await queryRunner.query(`
                DO $$ BEGIN
                    DROP INDEX IF EXISTS "public"."${indexName}";
                EXCEPTION WHEN undefined_object THEN NULL;
                END $$;
            `);
            await queryRunner.query(`
                DO $$ BEGIN
                    ALTER TABLE "${table}" DROP COLUMN IF EXISTS "tenant_id";
                EXCEPTION WHEN undefined_table THEN NULL;
                END $$;
            `);
        }

        // Restaurar constraint original en areas
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "areas"
                    ADD CONSTRAINT "UQ_areas_nombre_regional" UNIQUE ("nombre_area", "id_regional");
            EXCEPTION WHEN undefined_table OR duplicate_object THEN NULL;
            END $$;
        `);
    }
}
