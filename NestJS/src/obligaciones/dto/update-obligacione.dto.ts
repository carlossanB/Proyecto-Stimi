import { PartialType } from '@nestjs/mapped-types';
import { CreateObligacioneDto } from './create-obligacione.dto';

export class UpdateObligacioneDto extends PartialType(CreateObligacioneDto) {}
