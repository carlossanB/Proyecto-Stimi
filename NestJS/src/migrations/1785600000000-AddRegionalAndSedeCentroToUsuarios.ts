import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegionalAndSedeCentroToUsuarios1785600000000 implements MigrationInterface {
    name = 'AddRegionalAndSedeCentroToUsuarios1785600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "regional" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "sede_centro" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "regional"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "sede_centro"`);
    }
}
