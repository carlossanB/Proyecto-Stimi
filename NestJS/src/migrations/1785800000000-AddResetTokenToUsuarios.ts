import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResetTokenToUsuarios1785800000000 implements MigrationInterface {
    name = 'AddResetTokenToUsuarios1785800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "reset_token" character varying(255) NULL`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "reset_token_expiry" TIMESTAMP NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "reset_token_expiry"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "reset_token"`);
    }
}
