import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenciasService } from './evidencias.service';
import { EvidenciasController } from './evidencias.controller';
import { Evidencia } from './entities/evidencia.entity';
import { Actividad } from '../actividades/entities/actividade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evidencia, Actividad])],
  controllers: [EvidenciasController],
  providers: [EvidenciasService],
  exports: [EvidenciasService],
})
export class EvidenciasModule {}