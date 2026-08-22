import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { Persona } from '../personas/entities/persona.entity';
import { HistorialConversacion } from './entities/historial-conversacion.entity';
import { Obligacione } from '../obligaciones/entities/obligacione.entity';
import { InformesModule } from '../informes/informes.module';
import { ObligacionesModule } from '../obligaciones/obligaciones.module';
import { N8nModule } from '../n8n/n8n.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona, HistorialConversacion, Obligacione]),
    InformesModule,
    ObligacionesModule,
    N8nModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'super-secret-key-12345'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
