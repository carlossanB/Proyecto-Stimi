import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformeGfService } from './informe-gf.service';
import { InformeGfController } from './informe-gf.controller';
import { InformeGf } from './entities/informe-gf.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InformeGf])],
  controllers: [InformeGfController],
  providers: [InformeGfService],
  exports: [InformeGfService],
})
export class InformeGfModule {}