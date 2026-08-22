import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVersionDto {
  @IsInt()
  numero_version!: number;

  @IsDateString()
  fecha_version!: string;

  @IsString()
  @MaxLength(255)
  descripcion!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  estado?: string;
}