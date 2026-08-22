const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');

const sqliteDb = new sqlite3.Database('sena.db');

const pgClient = new Client({
  host: 'localhost',
  port: 5432,
  database: 'proyecto_formativo',
  user: 'stimi',
  password: 'stimi123',
});

async function migrateTable(sqliteTableName, pgTableName, columns, idColumn) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM "${sqliteTableName}"`, [], async (err, rows) => {
      if (err) {
        return reject(err);
      }
      console.log(`Leídas ${rows.length} filas de la tabla SQLite "${sqliteTableName}"`);
      
      for (const row of rows) {
        const colNames = columns.map(c => `"${c}"`).join(', ');
        const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
        const values = columns.map(c => {
          let val = row[c];
          // Convert SQLite true/false (1/0) for boolean columns
          if (typeof val === 'number' && (c === 'habilitado' || c === 'firmado' || c === 'pendiente_sincronizacion')) {
            val = val === 1;
          }
          return val;
        });

        try {
          await pgClient.query(
            `INSERT INTO "${pgTableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
        } catch (insertErr) {
          console.error(`Error insertando en ${pgTableName}:`, insertErr.message, row);
        }
      }

      // Actualizar la secuencia del autoincrementable si aplica
      if (idColumn) {
        try {
          await pgClient.query(
            `SELECT setval(pg_get_serial_sequence('${pgTableName}', '${idColumn}'), COALESCE(MAX("${idColumn}"), 1)) FROM "${pgTableName}"`
          );
        } catch (seqErr) {
          console.error(`Error actualizando secuencia de ${pgTableName}:`, seqErr.message);
        }
      }

      resolve();
    });
  });
}

async function startMigration() {
  try {
    await pgClient.connect();
    console.log('Conectado a PostgreSQL para la migración.');

    // 1. roles
    await migrateTable('roles', 'roles', ['id_rol', 'nombre_rol', 'created_at', 'updated_at', 'deleted_at'], 'id_rol');

    // 2. areas
    await migrateTable('areas', 'areas', ['id_area', 'nombre_area', 'created_at', 'updated_at', 'deleted_at'], 'id_area');

    // 3. periodos_carga
    await migrateTable('periodos_carga', 'periodos_carga', ['id_periodo', 'anio', 'mes', 'fecha_limite', 'habilitado', 'created_at', 'updated_at', 'deleted_at'], 'id_periodo');

    // 4. usuarios (en SQLite se llama 'usuarios')
    await migrateTable('usuarios', 'usuarios', [
      'id_usuario', 'nombre_completo', 'tipo_documento', 'numero_documento', 'correo', 
      'contrasena_hash', 'estado_cuenta', 'firma_digital_ruta', 'firma_digital_actualizada_at', 
      'preferencias_notificaciones', 'aprobado_por_id', 'fecha_aprobacion', 'motivo_rechazo', 
      'created_at', 'updated_at', 'deleted_at', 'id_rol', 'id_area'
    ], 'id_usuario');

    // 5. contratos
    await migrateTable('contratos', 'contratos', ['id_contrato', 'fecha_inicio', 'fecha_fin', 'estado', 'created_at', 'updated_at', 'deleted_at', 'id_usuario'], 'id_contrato');

    // 6. obligaciones
    await migrateTable('obligaciones', 'obligaciones', ['id_obligacion', 'descripcion', 'created_at', 'updated_at', 'deleted_at', 'id_contrato'], 'id_obligacion');

    // 7. informes
    await migrateTable('informes', 'informes', [
      'id_informe', 'tipo_informe', 'estado', 'firmado', 'pendiente_sincronizacion', 
      'fecha_envio', 'created_at', 'updated_at', 'deleted_at', 'observacion', 'id_usuario', 'id_periodo'
    ], 'id_informe');

    // 8. informe_gc
    await migrateTable('informe_gc', 'informe_gc', ['id_informe_gc', 'version_formato', 'created_at', 'updated_at', 'deleted_at', 'id_informe', 'id_contrato'], 'id_informe_gc');

    // 9. actividades
    await migrateTable('actividades', 'actividades', ['id_actividad', 'fecha_inicio', 'fecha_fin', 'competencia', 'resultado', 'estado', 'created_at', 'updated_at', 'deleted_at', 'id_informe_gc'], 'id_actividad');

    // 10. evidencias
    await migrateTable('evidencias', 'evidencias', ['id_evidencia', 'descripcion', 'carpeta_obligacion', 'ruta_archivo', 'tipo_archivo', 'tamano_bytes', 'created_at', 'updated_at', 'deleted_at', 'id_actividad'], 'id_evidencia');

    // 11. informe_gf
    await migrateTable('informe_gf', 'informe_gf', ['id_informe_gf', 'version_formato', 'valor_total', 'observaciones', 'created_at', 'updated_at', 'deleted_at', 'id_informe'], 'id_informe_gf');

    // 12. versiones
    await migrateTable('versiones', 'versiones', [
      'id_version', 'numero_version', 'fecha_version', 'descripcion', 'archivo_ruta', 
      'archivo_nombre_original', 'archivo_tamano_bytes', 'observacion', 'estado', 'id_informe'
    ], 'id_version');

    // 13. novedades
    await migrateTable('novedades', 'novedades', ['id_novedad', 'descripcion', 'fecha_novedad', 'estado', 'fk_version'], 'id_novedad');

    console.log('Migración de datos completada exitosamente.');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

startMigration();
