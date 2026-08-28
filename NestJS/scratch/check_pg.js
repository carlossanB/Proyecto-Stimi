const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'stimi',
    password: process.env.DB_PASSWORD || 'stimi123',
    database: process.env.DB_NAME || 'proyecto_formativo',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');
    
    // ALTER TABLE
    await client.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil_ruta VARCHAR(255) NULL;');
    console.log('ALTER TABLE executed successfully (foto_perfil_ruta added if missing).');

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND column_name = 'foto_perfil_ruta';
    `);

    console.log('Column details in PostgreSQL:', res.rows);
  } catch (err) {
    console.error('Error executing query against PostgreSQL:', err.message);
  } finally {
    await client.end();
  }
}

run();
