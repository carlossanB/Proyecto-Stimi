import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInformeGcDto {
  @IsInt()
  id_informe!: number;

  @IsInt()
  id_contrato!: number;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  version_formato?: string;
}