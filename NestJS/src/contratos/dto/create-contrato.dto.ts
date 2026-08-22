import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContratoDto {
  @ApiProperty({ description: 'Fecha de inicio del contrato', example: '2026-01-01' })
  @IsDateString()
  fecha_inicio!: Date;

  @ApiProperty({ description: 'Fecha de finalización del contrato', example: '2026-12-31' })
  @IsDateString()
  fecha_fin!: Date;

  @ApiProperty({ description: 'Estado del contrato', default: 'activo', example: 'activo' })
  @IsString()
  @IsOptional()
  estado!: string;

  @ApiProperty({ description: 'ID de la persona a la que pertenece el contrato', example: 1 })
  @IsInt()
  fk_persona!: number;
}
