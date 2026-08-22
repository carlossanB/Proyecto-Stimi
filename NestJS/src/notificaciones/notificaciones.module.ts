import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { MailModule } from '../mail/mail.module';
import { Persona } from '../personas/entities/persona.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notificacion, Persona]),
    MailModule,
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
