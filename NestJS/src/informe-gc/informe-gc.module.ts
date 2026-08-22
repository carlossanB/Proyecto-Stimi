import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformeGcService } from './informe-gc.service';
import { InformeGcController } from './informe-gc.controller';
import { InformeGc } from './entities/informe-gc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InformeGc])],
  controllers: [InformeGcController],
  providers: [InformeGcService],
  exports: [InformeGcService],
})
export class InformeGcModule {}