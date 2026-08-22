import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncSchemaIndexes1785400000000 implements MigrationInterface {
    name = 'SyncSchemaIndexes1785400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_historial_remotejid"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_historial_cedula"`);
        await queryRunner.query(`ALTER TABLE "historial_conversacion" ALTER COLUMN "creado_en" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cb9b0dcc272d786f5613cdb562" ON "historial_conversacion" ("remoteJid")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_cb9b0dcc272d786f5613cdb562"`);
        await queryRunner.query(`ALTER TABLE "historial_conversacion" ALTER COLUMN "creado_en" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_historial_cedula" ON "historial_conversacion" USING btree ("cedula")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_historial_remotejid" ON "historial_conversacion" USING btree ("remoteJid")`);
    }
}
