const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function keepOnly2Users() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://stimi:stimi123@localhost:5432/proyecto_formativo'
  });

  await client.connect();
  console.log('🔗 Conectado a PostgreSQL.');

  try {
    // 1. Identificar los 2 usuarios base a conservar
    const seedEmails = ['juan.perez@sena.edu.co', 'maria.garcia@sena.edu.co'];

    console.log(`📌 Identificando usuarios a conservar: ${seedEmails.join(', ')}`);

    // Obtener los IDs de los 2 usuarios base
    const baseUsersRes = await client.query(
      `SELECT id_usuario, correo, nombre_completo FROM "usuarios" WHERE correo IN ($1, $2)`,
      seedEmails
    );

    const baseUserIds = baseUsersRes.rows.map(u => u.id_usuario);

    if (baseUserIds.length === 0) {
      console.error('❌ No se encontraron los usuarios base en la base de datos.');
      return;
    }

    console.log(`✅ IDs a conservar: ${baseUserIds.join(', ')}`);

    // 2. Eliminar contratos asociados a usuarios que van a ser eliminados (integridad referencial)
    const delContratosRes = await client.query(
      `DELETE FROM "contratos" WHERE "id_usuario" NOT IN (${baseUserIds.join(', ')})`
    );
    console.log(`🧹 Contratos de usuarios secundarios eliminados: ${delContratosRes.rowCount}`);

    // 3. Eliminar usuarios secundarios (todos excepto los 2 base)
    const delUsuariosRes = await client.query(
      `DELETE FROM "usuarios" WHERE "id_usuario" NOT IN (${baseUserIds.join(', ')})`
    );
    console.log(`🧹 Usuarios de prueba eliminados: ${delUsuariosRes.rowCount}`);

    // 4. Asegurar que las contraseñas de los 2 usuarios conservados estén activas y aprobadas
    const passInstructor = await bcrypt.hash('instructor123', 10);
    const passCoordinador = await bcrypt.hash('coordinador123', 10);

    await client.query(
      `UPDATE "usuarios" SET "contrasena_hash" = $1, "estado_cuenta" = 'aprobado' WHERE "correo" = $2`,
      [passInstructor, 'juan.perez@sena.edu.co']
    );

    await client.query(
      `UPDATE "usuarios" SET "contrasena_hash" = $1, "estado_cuenta" = 'aprobado' WHERE "correo" = $2`,
      [passCoordinador, 'maria.garcia@sena.edu.co']
    );

    console.log('🔒 Contraseñas y estados de los 2 usuarios predeterminados verificados.');

    // 5. Mostrar usuarios restantes en la base de datos
    const finalUsersRes = await client.query(
      `SELECT u.id_usuario, u.nombre_completo, u.correo, u.numero_documento, u.estado_cuenta, r.nombre_rol 
       FROM "usuarios" u 
       LEFT JOIN "roles" r ON u.id_rol = r.id_rol 
       ORDER BY u.id_usuario ASC`
    );

    console.log('\n=== USUARIOS CONSERVADOS EN LA BASE DE DATOS ===');
    console.table(finalUsersRes.rows);

  } catch (err) {
    console.error('❌ Error durante la eliminación de usuarios:', err);
  } finally {
    await client.end();
  }
}

keepOnly2Users();
