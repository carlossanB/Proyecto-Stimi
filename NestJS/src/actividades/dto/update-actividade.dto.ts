import { PartialType } from '@nestjs/mapped-types';
import { CreateActividadDto } from './create-actividade.dto';

export class UpdateActividadDto extends PartialType(CreateActividadDto) {}