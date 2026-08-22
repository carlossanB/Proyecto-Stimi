const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://stimi:stimi123@localhost:5432/proyecto_formativo'
  });
  await client.connect();

  const tables = [
    'roles',
    'areas',
    'usuarios',
    'obligaciones',
    'periodos_carga',
    'contratos',
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

  console.log('=== CONTEO DE REGISTROS EN LA BASE DE DATOS ===');
  for (const t of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`${t}: ${res.rows[0].count} registros`);
    } catch (e) {
      console.log(`${t}: (No existe o error: ${e.message})`);
    }
  }

  await client.end();
}

main().catch(console.error);
