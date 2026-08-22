const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query('SELECT * FROM "periodos_carga"');
  console.table(res.rows);
  await client.end();
}

main().catch(console.error);
