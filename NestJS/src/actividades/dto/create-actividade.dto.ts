import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActividadDto {
  @ApiProperty({ description: 'Fecha de ejecución o reporte (obsoleta, prefiera fecha_inicio/fecha_fin)', required: false, example: '2026-07-01' })
  @IsDateString()
  @IsOptional()
  fecha?: string;

  @ApiProperty({ description: 'Nombre de la competencia', example: 'Diseño de APIs' })
  @IsString()
  @MaxLength(100)
  competencia!: string;

  @ApiProperty({ description: 'Estado de la actividad (e.g. ACT, INA)', default: 'ACT', example: 'ACT' })
  @IsString()
  @MaxLength(3)
  estado!: string;

  @ApiProperty({ description: 'Fecha de fin de la actividad', example: '2026-07-31' })
  @IsDateString()
  fecha_fin!: string;

  @ApiProperty({ description: 'Fecha de inicio de la actividad', example: '2026-07-01' })
  @IsDateString()
  fecha_inicio!: string;

  @ApiProperty({ description: 'Resultado obtenido o descripción de lo realizado', example: 'Se completaron los endpoints de seguridad y auth' })
  @IsString()
  resultado!: string;

  @ApiProperty({ description: 'ID del informe de ejecución contractual (InformeGc) asociado', example: 1 })
  @IsInt()
  @IsOptional()
  fk_gc?: number;
}