const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function cleanDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://stimi:stimi123@localhost:5432/proyecto_formativo'
  });

  await client.connect();
  console.log('🔗 Conectado a la base de datos PostgreSQL.');

  try {
    // 1. Limpiar tablas operativas y de prueba
    console.log('🧹 Limpiando datos operativos de prueba...');
    const operationalTables = [
      'evidencias',
      'actividades',
      'informe_gc',
      'informe_gf',
      'versiones',
      'informes',
      'notificaciones',
      'historial_conversacion',
      'novedades'
    ];

    const truncateQuery = `TRUNCATE TABLE ${operationalTables.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
    await client.query(truncateQuery);
    console.log('✅ Tablas operativas limpiadas correctamente (TRUNCATE CASCADE).');

    // 2. Limpieza opcional de usuarios de prueba (conservando los usuarios base de seed)
    // Mantener usuarios base: juan.perez@sena.edu.co, maria.garcia@sena.edu.co
    console.log('👤 Verificando usuarios base...');
    
    // Asegurar roles base
    await client.query(`
      INSERT INTO "roles" ("nombre_rol", "created_at", "updated_at")
      SELECT 'instructor', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "nombre_rol" = 'instructor');
      INSERT INTO "roles" ("nombre_rol", "created_at", "updated_at")
      SELECT 'coordinador', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "nombre_rol" = 'coordinador');
    `);

    // Asegurar area base
    await client.query(`
      INSERT INTO "areas" ("nombre_area", "created_at", "updated_at")
      SELECT 'Tecnologías de la Información', NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM "areas" WHERE "nombre_area" = 'Tecnologías de la Información');
    `);

    // Obtener IDs
    const roleInstructor = (await client.query(`SELECT id_rol FROM "roles" WHERE nombre_rol = 'instructor' LIMIT 1`)).rows[0]?.id_rol;
    const roleCoordinador = (await client.query(`SELECT id_rol FROM "roles" WHERE nombre_rol = 'coordinador' LIMIT 1`)).rows[0]?.id_rol;
    const areaId = (await client.query(`SELECT id_area FROM "areas" LIMIT 1`)).rows[0]?.id_area;

    // Asegurar usuario Instructor base
    const juanPass = await bcrypt.hash('instructor123', 10);
    await client.query(`
      INSERT INTO "usuarios" 
      ("nombre_completo", "tipo_documento", "numero_documento", "correo", "contrasena_hash", "estado_cuenta", "id_rol", "id_area", "preferencias_notificaciones", "created_at", "updated_at")
      VALUES ('Juan Pérez', 'CC', '123456', 'juan.perez@sena.edu.co', '${juanPass}', 'aprobado', ${roleInstructor}, ${areaId}, '{}', NOW(), NOW())
      ON CONFLICT ("correo") DO UPDATE SET "contrasena_hash" = EXCLUDED."contrasena_hash", "estado_cuenta" = 'aprobado';
    `);

    // Asegurar usuario Coordinador base
    const mariaPass = await bcrypt.hash('coordinador123', 10);
    await client.query(`
      INSERT INTO "usuarios" 
      ("nombre_completo", "tipo_documento", "numero_documento", "correo", "contrasena_hash", "estado_cuenta", "id_rol", "id_area", "preferencias_notificaciones", "created_at", "updated_at")
      VALUES ('María García', 'CC', '654321', 'maria.garcia@sena.edu.co', '${mariaPass}', 'aprobado', ${roleCoordinador}, ${areaId}, '{}', NOW(), NOW())
      ON CONFLICT ("correo") DO UPDATE SET "contrasena_hash" = EXCLUDED."contrasena_hash", "estado_cuenta" = 'aprobado';
    `);

    console.log('✅ Usuarios base (Juan Pérez y María García) garantizados.');

    // 3. Limpiar archivos físicos en uploads/informes/
    const uploadsDir = path.join(__dirname, '../uploads/informes');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedFilesCount = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          deletedFilesCount++;
        }
      }
      console.log(`📁 Limpiados ${deletedFilesCount} archivos PDF de prueba en ${uploadsDir}`);
    }

    // 4. Reporte final de tablas
    console.log('\n=== ESTADO FINAL DE LA BASE DE DATOS ===');
    const allTables = [
      'roles',
      'areas',
      'usuarios',
      'periodos_carga',
      'contratos',
      'obligaciones',
      'informes',
      'informe_gc',
      'informe_gf',
      'versiones',
      'actividades',
      'evidencias',
      'notificaciones',
      'historial_conversacion',
      'novedades'
    ];

    for (const t of allTables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM "${t}"`);
        console.log(` • ${t}: ${res.rows[0].count} registros`);
      } catch (err) {
        // Omisión si no existe alguna tabla opcional
      }
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await client.end();
  }
}

cleanDatabase();
