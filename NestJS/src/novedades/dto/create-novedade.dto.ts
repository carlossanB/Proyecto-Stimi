import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNovedadDto {
  @IsString()
  @MaxLength(255)
  descripcion!: string;

  @IsDateString()
  fecha_novedad!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  estado?: string;

  @IsInt()
  fk_version!: number;
}