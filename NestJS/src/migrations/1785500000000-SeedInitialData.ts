import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class SeedInitialData1785500000000 implements MigrationInterface {
  name = 'SeedInitialData1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Seed Roles ('instructor', 'coordinador')
    const roles = await queryRunner.query(`SELECT "id_rol", "nombre_rol" FROM "roles"`);
    const roleNames = roles.map((r: any) => r.nombre_rol);

    if (!roleNames.includes('instructor')) {
      await queryRunner.query(
        `INSERT INTO "roles" ("nombre_rol", "created_at", "updated_at") VALUES ('instructor', NOW(), NOW())`,
      );
    }
    if (!roleNames.includes('coordinador')) {
      await queryRunner.query(
        `INSERT INTO "roles" ("nombre_rol", "created_at", "updated_at") VALUES ('coordinador', NOW(), NOW())`,
      );
    }

    // 2. Seed Areas ('TIC')
    const areas = await queryRunner.query(`SELECT "id_area", "nombre_area" FROM "areas"`);
    const areaNames = areas.map((a: any) => a.nombre_area);

    if (!areaNames.includes('TIC')) {
      await queryRunner.query(
        `INSERT INTO "areas" ("nombre_area", "id_regional", "tipo", "created_at", "updated_at") VALUES ('TIC', 1, 'REGULAR', NOW(), NOW())`,
      );
    }

    // Fetch IDs for roles and area
    const instructorRoleRes = await queryRunner.query(
      `SELECT "id_rol" FROM "roles" WHERE "nombre_rol" = 'instructor' LIMIT 1`,
    );
    const coordinadorRoleRes = await queryRunner.query(
      `SELECT "id_rol" FROM "roles" WHERE "nombre_rol" = 'coordinador' LIMIT 1`,
    );
    const areaRes = await queryRunner.query(
      `SELECT "id_area" FROM "areas" WHERE "nombre_area" = 'TIC' LIMIT 1`,
    );

    const instructorRoleId = instructorRoleRes[0]?.id_rol;
    const coordinadorRoleId = coordinadorRoleRes[0]?.id_rol;
    const areaId = areaRes[0]?.id_area;

    // 3. Seed Users (Juan Pérez, María García)
    const existingJuan = await queryRunner.query(
      `SELECT "id_usuario" FROM "usuarios" WHERE "numero_documento" = '123456' OR "correo" = 'juan.perez@sena.edu.co' LIMIT 1`,
    );
    if (existingJuan.length === 0) {
      const passInstructor = await bcrypt.hash('instructor123', 10);
      await queryRunner.query(
        `INSERT INTO "usuarios" 
        ("nombre_completo", "tipo_documento", "numero_documento", "correo", "contrasena_hash", "estado_cuenta", "id_rol", "id_area", "preferencias_notificaciones", "created_at", "updated_at")
        VALUES 
        ('Juan Pérez', 'CC', '123456', 'juan.perez@sena.edu.co', '${passInstructor}', 'aprobado', ${instructorRoleId}, ${areaId}, '{}', NOW(), NOW())`,
      );
    }

    const existingMaria = await queryRunner.query(
      `SELECT "id_usuario" FROM "usuarios" WHERE "numero_documento" = '654321' OR "correo" = 'maria.garcia@sena.edu.co' LIMIT 1`,
    );
    if (existingMaria.length === 0) {
      const passCoordinador = await bcrypt.hash('coordinador123', 10);
      await queryRunner.query(
        `INSERT INTO "usuarios" 
        ("nombre_completo", "tipo_documento", "numero_documento", "correo", "contrasena_hash", "estado_cuenta", "id_rol", "id_area", "preferencias_notificaciones", "created_at", "updated_at")
        VALUES 
        ('María García', 'CC', '654321', 'maria.garcia@sena.edu.co', '${passCoordinador}', 'aprobado', ${coordinadorRoleId}, ${areaId}, '{}', NOW(), NOW())`,
      );
    }

    // 4. Seed Periodos de Carga (Meses 1 a 12 del año 2026)
    const anio = 2026;
    for (let mes = 1; mes <= 12; mes++) {
      const existingPeriodo = await queryRunner.query(
        `SELECT "id_periodo" FROM "periodos_carga" WHERE "anio" = ${anio} AND "mes" = ${mes} LIMIT 1`,
      );
      if (existingPeriodo.length === 0) {
        const lastDay = new Date(anio, mes, 0).getDate();
        const fechaLimite = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;
        await queryRunner.query(
          `INSERT INTO "periodos_carga" ("anio", "mes", "fecha_limite", "habilitado", "created_at", "updated_at")
           VALUES (${anio}, ${mes}, '${fechaLimite}', true, NOW(), NOW())`,
        );
      }
    }

    // 5. Seed Contratos base para usuarios base
    const juanUserRes = await queryRunner.query(
      `SELECT "id_usuario" FROM "usuarios" WHERE "correo" = 'juan.perez@sena.edu.co' LIMIT 1`,
    );
    const mariaUserRes = await queryRunner.query(
      `SELECT "id_usuario" FROM "usuarios" WHERE "correo" = 'maria.garcia@sena.edu.co' LIMIT 1`,
    );

    if (juanUserRes.length > 0) {
      const juanId = juanUserRes[0].id_usuario;
      const existingJuanContrato = await queryRunner.query(
        `SELECT "id_contrato" FROM "contratos" WHERE "id_usuario" = ${juanId} LIMIT 1`,
      );
      if (existingJuanContrato.length === 0) {
        await queryRunner.query(
          `INSERT INTO "contratos" ("id_usuario", "fecha_inicio", "fecha_fin", "estado", "created_at", "updated_at")
           VALUES (${juanId}, '${anio}-01-01', '${anio}-12-31', 'activo', NOW(), NOW())`,
        );
      }
    }

    if (mariaUserRes.length > 0) {
      const mariaId = mariaUserRes[0].id_usuario;
      const existingMariaContrato = await queryRunner.query(
        `SELECT "id_contrato" FROM "contratos" WHERE "id_usuario" = ${mariaId} LIMIT 1`,
      );
      if (existingMariaContrato.length === 0) {
        await queryRunner.query(
          `INSERT INTO "contratos" ("id_usuario", "fecha_inicio", "fecha_fin", "estado", "created_at", "updated_at")
           VALUES (${mariaId}, '${anio}-01-01', '${anio}-12-31', 'activo', NOW(), NOW())`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "contratos" WHERE "id_usuario" IN (SELECT "id_usuario" FROM "usuarios" WHERE "correo" IN ('juan.perez@sena.edu.co', 'maria.garcia@sena.edu.co'))`,
    );
    await queryRunner.query(
      `DELETE FROM "usuarios" WHERE "correo" IN ('juan.perez@sena.edu.co', 'maria.garcia@sena.edu.co')`,
    );
  }
}
