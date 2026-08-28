import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFotoPerfilRutaToUsuarios1785700000000 implements MigrationInterface {
    name = 'AddFotoPerfilRutaToUsuarios1785700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "foto_perfil_ruta" character varying(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "foto_perfil_ruta"`);
    }
}
