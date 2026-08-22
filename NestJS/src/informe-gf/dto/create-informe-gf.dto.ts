import { IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInformeGfDto {
  @IsInt()
  id_informe!: number;

  @IsString()
  @MaxLength(50)
  version_formato!: string;

  @IsNumber()
  valor_total!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}