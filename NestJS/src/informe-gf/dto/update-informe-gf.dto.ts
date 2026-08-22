import { PartialType } from '@nestjs/mapped-types';
import { CreateInformeGfDto } from './create-informe-gf.dto';

export class UpdateInformeGfDto extends PartialType(CreateInformeGfDto) {}