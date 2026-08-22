import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './auth/auth.module';
import { ContratosModule } from './contratos/contratos.module';
import { InformesModule } from './informes/informes.module';
import { NovedadesModule } from './novedades/novedades.module';
import { ObligacionesModule } from './obligaciones/obligaciones.module';
import { PersonasModule } from './personas/personas.module';
import { RolModule } from './rol/rol.module';
import { VersionesModule } from './versiones/versiones.module';
import { InformeGcModule } from './informe-gc/informe-gc.module';
import { InformeGfModule } from './informe-gf/informe-gf.module';
import { ActividadesModule } from './actividades/actividades.module';
import { EvidenciasModule } from './evidencias/evidencias.module';
import { PeriodosCargaModule } from './periodos-carga/periodos-carga.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { TenantModule } from './common/tenant/tenant.module';
import { TenantMiddleware } from './common/tenant/tenant.middleware';
import { WebhooksModule } from './webhooks/webhooks.module';
import { N8nModule } from './n8n/n8n.module';
import { CoordinadorModule } from './coordinador/coordinador.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE', 'sqlite');
        const sync = config.get<string>('DB_SYNCHRONIZE') === 'true';

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: config.get<string>('DB_HOST', 'localhost'),
            port: config.get<number>('DB_PORT', 5432),
            username: config.get<string>('DB_USERNAME', 'postgres'),
            password: config.get<string>('DB_PASSWORD', 'postgres'),
            database: config.get<string>('DB_NAME', 'sena'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            synchronize: sync,
          };
        }

        return {
          type: 'sqljs' as const,
          autoSave: true,
          location: config.get<string>('DB_NAME', 'sena.db'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: sync,
        };
      },
      inject: [ConfigService],
    }),
    // ── Módulo Multitenant (Global) ──────────────────────────────────────────
    TenantModule,
    // ────────────────────────────────────────────────────────────────────────
    AreasModule,
    AuthModule,
    ContratosModule,
    InformesModule,
    NovedadesModule,
    ObligacionesModule,
    PersonasModule,
    RolModule,
    VersionesModule,
    InformeGcModule,
    InformeGfModule,
    ActividadesModule,
    EvidenciasModule,
    PeriodosCargaModule,
    NotificacionesModule,
    WebhooksModule,
    N8nModule,
    CoordinadorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // Aplicar TenantMiddleware globalmente para TODAS las rutas de la API
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
