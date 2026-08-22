import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObligacionesService } from './obligaciones.service';
import { ObligacionesController } from './obligaciones.controller';
import { Obligacione } from './entities/obligacione.entity';
import { Contrato } from '../contratos/entities/contrato.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Obligacione, Contrato])],
  controllers: [ObligacionesController],
  providers: [ObligacionesService],
  exports: [ObligacionesService],
})
export class ObligacionesModule {}
