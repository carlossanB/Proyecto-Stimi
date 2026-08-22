const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://stimi:stimi123@localhost:5432/proyecto_formativo'
  });
  await client.connect();

  const tablesRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log('TABLES:', tablesRes.rows.map(r => r.table_name));

  const cols = await client.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'areas'`);
  console.log('AREAS COLUMNS:', cols.rows);

  const rows = await client.query('SELECT * FROM areas');
  console.log('AREAS ROWS:', rows.rows);

  await client.end();
}

main().catch(console.error);
