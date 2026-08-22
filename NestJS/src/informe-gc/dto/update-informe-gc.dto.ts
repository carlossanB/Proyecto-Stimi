import { PartialType } from '@nestjs/mapped-types';
import { CreateInformeGcDto } from './create-informe-gc.dto';

export class UpdateInformeGcDto extends PartialType(CreateInformeGcDto) {}