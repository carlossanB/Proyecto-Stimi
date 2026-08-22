import { PartialType } from '@nestjs/mapped-types';
import { CreateNovedadDto } from './create-novedade.dto';

export class UpdateNovedadDto extends PartialType(CreateNovedadDto) {}