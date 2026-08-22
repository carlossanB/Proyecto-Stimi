import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActividadesService } from './actividades.service';
import { ActividadesController } from './actividades.controller';
import { Actividad } from './entities/actividade.entity';
import { InformeGc } from '../informe-gc/entities/informe-gc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Actividad, InformeGc])],
  controllers: [ActividadesController],
  providers: [ActividadesService],
  exports: [ActividadesService],
})
export class ActividadesModule {}