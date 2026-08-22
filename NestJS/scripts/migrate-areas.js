const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://stimi:stimi123@localhost:5432/proyecto_formativo'
  });
  await client.connect();

  console.log('--- INICIANDO ACTUALIZACIÓN Y AJUSTE DE ÁREAS ---');

  // 1. Agregar columnas id_regional y tipo a la tabla areas si no existen
  await client.query(`
    ALTER TABLE "areas" 
    ADD COLUMN IF NOT EXISTS "id_regional" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "tipo" VARCHAR(50) NOT NULL DEFAULT 'REGULAR';
  `);
  console.log('1. Columnas id_regional y tipo verificadas/agregadas.');

  // 2. Ajustar constraint unique: remover unique simple y crear unique compuesto (nombre_area, id_regional)
  await client.query(`
    ALTER TABLE "areas" DROP CONSTRAINT IF EXISTS "areas_nombre_area_key";
    ALTER TABLE "areas" DROP CONSTRAINT IF EXISTS "UQ_areas_nombre_regional";
    ALTER TABLE "areas" ADD CONSTRAINT "UQ_areas_nombre_regional" UNIQUE ("nombre_area", "id_regional");
  `);
  console.log('2. Constraint único compuesto (nombre_area, id_regional) configurado.');

  // 3. Unificar "Tecnologias de la Informacion" e "Informática" en "TIC"
  // Primero actualizar cualquier usuario que apunte a id_area = 2 o similar hacia id_area = 1
  await client.query(`
    UPDATE "usuarios" 
    SET "id_area" = 1 
    WHERE "id_area" IN (
      SELECT "id_area" FROM "areas" 
      WHERE LOWER("nombre_area") LIKE '%tecnolog%' 
         OR LOWER("nombre_area") LIKE '%inform%' 
         OR LOWER("nombre_area") = 'tic'
    );
  `);

  // Eliminar registros duplicados de tecnologías/informática excepto id_area 1
  await client.query(`
    DELETE FROM "areas" 
    WHERE "id_area" != 1 
      AND (
        LOWER("nombre_area") LIKE '%tecnolog%' 
        OR LOWER("nombre_area") LIKE '%inform%'
        OR LOWER("nombre_area") = 'tic'
      );
  `);

  // Asegurar que id_area = 1 quede como 'TIC', id_regional = 1, tipo = 'REGULAR'
  await client.query(`
    UPDATE "areas" 
    SET "nombre_area" = 'TIC', 
        "id_regional" = 1, 
        "tipo" = 'REGULAR',
        "updated_at" = NOW()
    WHERE "id_area" = 1;
  `);
  console.log('3. TIC unificado exitosamente en id_area = 1.');

  // 4. Lista completa de áreas REGULAR (id_regional = 1)
  const regularAreas = [
    'TIC',
    'Agricola',
    'Agropecuaria',
    'Ambiental',
    'Cocina',
    'Deportes',
    'Etica',
    'Comunicación',
    'Seguridad Y Salud En El Trabajo',
    'Emprendimiento',
    'Bilinguismo'
  ];

  // 5. Lista completa de áreas CAMPESENA (id_regional = 2)
  const campesenaAreas = [
    'Produccion Pecuaria',
    'Agricola',
    'Operaciones Forestales',
    'Comunicación',
    'Idiomas'
  ];

  for (const nombre of regularAreas) {
    if (nombre === 'TIC') continue; // Ya configurado en id_area = 1
    await client.query(`
      INSERT INTO "areas" ("nombre_area", "id_regional", "tipo", "created_at", "updated_at")
      VALUES ($1, 1, 'REGULAR', NOW(), NOW())
      ON CONFLICT ("nombre_area", "id_regional") 
      DO UPDATE SET "tipo" = 'REGULAR', "updated_at" = NOW();
    `, [nombre]);
  }
  console.log('4. Áreas REGULAR sincronizadas.');

  for (const nombre of campesenaAreas) {
    await client.query(`
      INSERT INTO "areas" ("nombre_area", "id_regional", "tipo", "created_at", "updated_at")
      VALUES ($1, 2, 'CAMPESENA', NOW(), NOW())
      ON CONFLICT ("nombre_area", "id_regional") 
      DO UPDATE SET "tipo" = 'CAMPESENA', "updated_at" = NOW();
    `, [nombre]);
  }
  console.log('5. Áreas CAMPESENA sincronizadas.');

  // 6. Consultar estado final de la tabla areas
  const finalRows = await client.query(`
    SELECT "id_area", "nombre_area", "id_regional", "tipo" 
    FROM "areas" 
    ORDER BY "id_regional" ASC, "id_area" ASC;
  `);

  console.log('\n=== LISTA FINAL DE ÁREAS EN BD ===');
  console.table(finalRows.rows);

  await client.end();
}

main().catch(console.error);
