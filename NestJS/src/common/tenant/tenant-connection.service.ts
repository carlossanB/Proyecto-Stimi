import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

export type TenantDbType = 'operative' | 'financial';

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  private readonly connectionPool = new Map<string, DataSource>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Obtiene la conexión de DataSource correspondiente al tenant y al tipo de base de datos (Operativa / Financiera).
   * Si el tenantId es 'default' o no se especifica, reutiliza la conexión predeterminada.
   */
  async getTenantConnection(
    tenantId: string = 'default',
    dbType: TenantDbType = 'operative',
    defaultDataSource?: DataSource,
  ): Promise<DataSource> {
    const sanitizedTenantId = (tenantId || 'default').toLowerCase().trim();

    // Si es el tenant por defecto y contamos con la conexión principal, la devolvemos inmediatamente
    if (sanitizedTenantId === 'default' && defaultDataSource && defaultDataSource.isInitialized) {
      return defaultDataSource;
    }

    const poolKey = `${sanitizedTenantId}_${dbType}`;

    // Si ya tenemos una conexión abierta y activa en la caché del pool, la reutilizamos
    if (this.connectionPool.has(poolKey)) {
      const existingDs = this.connectionPool.get(poolKey)!;
      if (existingDs.isInitialized) {
        return existingDs;
      }
    }

    // De lo contrario, creamos dinámicamente la nueva conexión
    this.logger.log(`Inicializando conexión dinámica para tenant: "${sanitizedTenantId}" (${dbType})`);

    const isPostgres = this.configService.get<string>('DB_TYPE', 'sqlite') === 'postgres';
    const dbFileName = `${dbType}_${sanitizedTenantId}.db`;
    const dbPath = join(process.cwd(), dbFileName);

    let newDs: DataSource;

    if (isPostgres) {
      const baseDbName = this.configService.get<string>('DB_NAME', 'sena');
      const targetDbName = `${baseDbName}_${sanitizedTenantId}_${dbType}`;

      newDs = new DataSource({
        type: 'postgres',
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 5432),
        username: this.configService.get<string>('DB_USERNAME', 'postgres'),
        password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
        database: targetDbName,
        entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
        synchronize: true, // Sincronización automática de tablas para nuevos tenants
      });
    } else {
      newDs = new DataSource({
        type: 'sqljs' as const,
        autoSave: true,
        location: dbPath,
        entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
        synchronize: true,
      });
    }

    await newDs.initialize();
    this.connectionPool.set(poolKey, newDs);
    this.logger.log(`Conexión lista para tenant "${sanitizedTenantId}" (${dbType})`);

    return newDs;
  }

  async onModuleDestroy() {
    this.logger.log('Cerrando pool de conexiones multinquilino...');
    for (const [key, ds] of this.connectionPool.entries()) {
      if (ds.isInitialized) {
        await ds.destroy();
        this.logger.log(`Conexión cerrada: ${key}`);
      }
    }
    this.connectionPool.clear();
  }
}
