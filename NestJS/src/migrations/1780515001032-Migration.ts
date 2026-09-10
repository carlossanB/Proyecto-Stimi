import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780515001032 implements MigrationInterface {
    name = 'Migration1780515001032';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Migración legacy protegida para no fallar si las tablas/columnas ya están en el esquema actual
        await queryRunner.query(`
            DO $$ BEGIN
                -- Si existieran columnas legadas fk_contrato o fk_persona, ajustar de forma segura
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'obligaciones' AND column_name = 'fk_contrato') THEN
                    ALTER TABLE "obligaciones" ALTER COLUMN "fk_contrato" DROP NOT NULL;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'fk_persona') THEN
                    ALTER TABLE "contratos" ALTER COLUMN "fk_persona" DROP NOT NULL;
                END IF;
            EXCEPTION WHEN OTHERS THEN NULL;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No-op seguro para revertir
    }
}

