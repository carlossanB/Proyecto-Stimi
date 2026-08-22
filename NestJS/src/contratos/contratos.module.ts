import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratosService } from './contratos.service';
import { ContratosController } from './contratos.controller';
import { Contrato } from './entities/contrato.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contrato])],
  controllers: [ContratosController],
  providers: [ContratosService],
})
export class ContratosModule {}
