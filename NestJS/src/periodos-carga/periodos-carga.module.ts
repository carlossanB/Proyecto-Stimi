import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodosCargaController } from './periodos-carga.controller';
import { PeriodosCargaService } from './periodos-carga.service';
import { PeriodoCarga } from './entities/periodo-carga.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodoCarga])],
  controllers: [PeriodosCargaController],
  providers: [PeriodosCargaService],
  exports: [TypeOrmModule],
})
export class PeriodosCargaModule {}
