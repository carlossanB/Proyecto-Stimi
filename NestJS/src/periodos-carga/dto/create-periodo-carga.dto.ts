import { IsBoolean, IsDateString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePeriodoCargaDto {
  @ApiProperty({ description: 'Año del periodo de carga', example: 2026 })
  @IsInt()
  anio!: number;

  @ApiProperty({ description: 'Mes del periodo de carga (1-12)', example: 7 })
  @IsInt()
  mes!: number;

  @ApiProperty({ description: 'Fecha límite de entrega de los informes', example: '2026-07-31' })
  @IsDateString()
  fecha_limite!: string;

  @ApiProperty({ description: 'Indica si el periodo está habilitado para carga', default: true, example: true })
  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}
