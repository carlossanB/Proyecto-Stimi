import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantId1787792351470 implements MigrationInterface {
    name = 'AddTenantId1787792351470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "areas" DROP CONSTRAINT "UQ_areas_nombre_regional"`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "evidencias" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "obligaciones" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "contratos" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "informe_gf" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "periodos_carga" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "informes" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "informe_gc" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "actividades" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "notificaciones" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "novedades" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`ALTER TABLE "historial_conversacion" ADD "tenant_id" character varying(50) NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`CREATE INDEX "IDX_4799912b058701d9bb23541c17" ON "areas"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ae7df422f4a0d8f686d3b55f21" ON "evidencias"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7b664ae6b7cda3df230794ff6c" ON "usuarios"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d90731fa9f6fdede14e1fa723f" ON "obligaciones"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0906d94882b0177428dfe3b67" ON "contratos"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a2d6c9b1e8e82a8187ecffc376" ON "informe_gf"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6f1b57184cb89b58b4c23dc925" ON "periodos_carga"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c60831dacbd1dad39cb06d7b41" ON "informes"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_46c58d4d1d82a18cb055f68c1f" ON "informe_gc"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_894e5692ae2460215cc3c6c17e" ON "actividades"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_00cc52d244d8f3108bb28ce251" ON "notificaciones"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_beaf1705d0c7f3cfb1790150ff" ON "novedades"  ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e299fc0ac0c3cdc02f4edb5f7f" ON "historial_conversacion"  ("tenant_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_e299fc0ac0c3cdc02f4edb5f7f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_beaf1705d0c7f3cfb1790150ff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_00cc52d244d8f3108bb28ce251"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_894e5692ae2460215cc3c6c17e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46c58d4d1d82a18cb055f68c1f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c60831dacbd1dad39cb06d7b41"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f1b57184cb89b58b4c23dc925"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2d6c9b1e8e82a8187ecffc376"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0906d94882b0177428dfe3b67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d90731fa9f6fdede14e1fa723f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b664ae6b7cda3df230794ff6c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae7df422f4a0d8f686d3b55f21"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4799912b058701d9bb23541c17"`);
        await queryRunner.query(`ALTER TABLE "historial_conversacion" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "novedades" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "notificaciones" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "actividades" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "informe_gc" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "informes" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "periodos_carga" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "informe_gf" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "obligaciones" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "evidencias" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "areas" ADD CONSTRAINT "UQ_areas_nombre_regional" UNIQUE ("nombre_area", "id_regional")`);
    }

}
