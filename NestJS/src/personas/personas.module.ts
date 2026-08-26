import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
import { Persona } from './entities/persona.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona]),
    MailModule,
  ],
  controllers: [PersonasController],
  providers: [PersonasService],
  exports: [TypeOrmModule, PersonasService],
})
export class PersonasModule {}