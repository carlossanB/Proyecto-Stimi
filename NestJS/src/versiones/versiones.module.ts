import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionesService } from './versiones.service';
import { VersionesController } from './versiones.controller';
import { Version } from './entities/version.entity';
import { Informe } from '../informes/entities/informe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Version, Informe])],
  controllers: [VersionesController],
  providers: [VersionesService],
  exports: [VersionesService],
})
export class VersionesModule {}