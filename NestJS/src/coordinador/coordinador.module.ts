import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoordinadorController } from './coordinador.controller';
import { CoordinadorService } from './coordinador.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [CoordinadorController],
  providers: [CoordinadorService],
})
export class CoordinadorModule {}
