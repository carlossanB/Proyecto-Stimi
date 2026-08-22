const { Client } = require('pg');
require('dotenv').config();

async function inspectUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://stimi:stimi123@localhost:5432/proyecto_formativo'
  });
  await client.connect();

  const res = await client.query(`SELECT id_usuario, nombre_completo, correo, numero_documento, estado_cuenta, id_rol FROM "usuarios" ORDER BY id_usuario ASC`);
  console.log('=== USUARIOS EXISTENTES ===');
  console.table(res.rows);

  await client.end();
}

inspectUsers().catch(console.error);
