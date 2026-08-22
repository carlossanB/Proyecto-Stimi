import { PartialType } from '@nestjs/mapped-types';
import { CreateVersionDto } from './create-versione.dto';

export class UpdateVersionDto extends PartialType(CreateVersionDto) {}