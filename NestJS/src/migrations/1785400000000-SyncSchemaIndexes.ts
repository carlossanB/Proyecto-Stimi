import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncSchemaIndexes1785400000000 implements MigrationInterface {
    name = 'SyncSchemaIndexes1785400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_historial_remotejid"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_historial_cedula"`);
        await queryRunner.query(`
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'historial_conversacion') THEN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'historial_conversacion' AND column_name = 'creado_en') THEN
                        ALTER TABLE "historial_conversacion" ALTER COLUMN "creado_en" SET NOT NULL;
                    END IF;
                    CREATE INDEX IF NOT EXISTS "IDX_cb9b0dcc272d786f5613cdb562" ON "historial_conversacion" ("remoteJid");
                END IF;
            EXCEPTION WHEN OTHERS THEN NULL;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_cb9b0dcc272d786f5613cdb562"`);
        await queryRunner.query(`
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'historial_conversacion') THEN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'historial_conversacion' AND column_name = 'creado_en') THEN
                        ALTER TABLE "historial_conversacion" ALTER COLUMN "creado_en" DROP NOT NULL;
                    END IF;
                    CREATE INDEX IF NOT EXISTS "idx_historial_cedula" ON "historial_conversacion" USING btree ("cedula");
                    CREATE INDEX IF NOT EXISTS "idx_historial_remotejid" ON "historial_conversacion" USING btree ("remoteJid");
                END IF;
            EXCEPTION WHEN OTHERS THEN NULL;
            END $$;
        `);
    }
}

