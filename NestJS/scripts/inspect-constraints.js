const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://stimi:stimi123@localhost:5432/proyecto_formativo'
  });
  await client.connect();

  const constraints = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'areas'::regclass;
  `);
  console.log('AREAS CONSTRAINTS:', constraints.rows);

  const usersArea = await client.query(`
    SELECT id_usuario, nombre_completo, id_area FROM usuarios;
  `);
  console.log('USUARIOS AND AREAS:', usersArea.rows);

  await client.end();
}

main().catch(console.error);
