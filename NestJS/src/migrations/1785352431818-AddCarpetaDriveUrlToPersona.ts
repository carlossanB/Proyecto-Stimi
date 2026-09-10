import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCarpetaDriveUrlToPersona1785352431818 implements MigrationInterface {
    name = 'AddCarpetaDriveUrlToPersona1785352431818';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "usuarios" 
            ADD COLUMN IF NOT EXISTS "carpeta_drive_url" character varying(255)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "usuarios" 
            DROP COLUMN IF EXISTS "carpeta_drive_url"
        `);
    }
}

