import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780515001032 implements MigrationInterface {
    name = 'Migration1780515001032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "obligaciones" DROP COLUMN "descripcion"`);
        await queryRunner.query(`ALTER TABLE "obligaciones" ADD "descripcion" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "obligaciones" ALTER COLUMN "fk_contrato" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN "estado"`);
        await queryRunner.query(`ALTER TABLE "contratos" ADD "estado" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contratos" ALTER COLUMN "fk_persona" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "obligaciones" ADD CONSTRAINT "FK_b7e2852310c3156f3bf12868de6" FOREIGN KEY ("fk_contrato") REFERENCES "contratos"("id_contrato") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contratos" ADD CONSTRAINT "FK_43b597a45a62b55bce44d1cbb1b" FOREIGN KEY ("fk_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contratos" DROP CONSTRAINT "FK_43b597a45a62b55bce44d1cbb1b"`);
        await queryRunner.query(`ALTER TABLE "obligaciones" DROP CONSTRAINT "FK_b7e2852310c3156f3bf12868de6"`);
        await queryRunner.query(`ALTER TABLE "contratos" ALTER COLUMN "fk_persona" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN "estado"`);
        await queryRunner.query(`ALTER TABLE "contratos" ADD "estado" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "obligaciones" ALTER COLUMN "fk_contrato" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "obligaciones" DROP COLUMN "descripcion"`);
        await queryRunner.query(`ALTER TABLE "obligaciones" ADD "descripcion" character varying NOT NULL`);
    }

}
