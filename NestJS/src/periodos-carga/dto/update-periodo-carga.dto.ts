import { PartialType } from '@nestjs/mapped-types';
import { CreatePeriodoCargaDto } from './create-periodo-carga.dto';

export class UpdatePeriodoCargaDto extends PartialType(CreatePeriodoCargaDto) {}
