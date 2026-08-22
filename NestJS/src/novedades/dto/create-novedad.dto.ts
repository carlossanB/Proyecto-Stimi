import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNovedadDto {
  @ApiProperty({ description: 'Descripción detallada de la novedad', example: 'Entrega extemporánea del informe' })
  @IsString()
  @MaxLength(255)
  descripcion!: string;

  @ApiProperty({ description: 'Fecha en la que ocurre la novedad', example: '2026-07-23' })
  @IsDateString()
  fecha_novedad!: string;

  @ApiProperty({ description: 'Estado de la novedad', default: 'activo', example: 'activo' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  estado?: string;

  @ApiProperty({ description: 'ID de la versión del informe asociada', example: 1 })
  @IsInt()
  fk_version!: number;
}
