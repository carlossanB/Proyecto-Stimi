import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVersionDto {
  @ApiProperty({ description: 'Número secuencial de la versión', example: 1 })
  @IsInt()
  numero_version!: number;

  @ApiProperty({ description: 'Fecha de creación de la versión', required: false, example: '2026-07-23T12:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  fecha_version?: string;

  @ApiProperty({ description: 'Descripción de los cambios de la versión', required: false, example: 'Carga inicial del reporte' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  descripcion?: string;

  @ApiProperty({ description: 'Estado de la versión (e.g. pendiente, validado, devuelto)', default: 'pendiente', example: 'pendiente' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  estado?: string;

  @ApiProperty({ description: 'ID del informe asociado a esta versión', example: 1 })
  @IsInt()
  @IsOptional()
  id_informe?: number;

  @ApiProperty({ description: 'Ruta física del archivo subido en el servidor', required: false, example: 'uploads/informes/informe-123.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  archivo_ruta?: string;

  @ApiProperty({ description: 'Nombre original del archivo cargado', required: false, example: 'reporte_julio.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  archivo_nombre_original?: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes', required: false, example: 524288 })
  @IsInt()
  @IsOptional()
  archivo_tamano_bytes?: number;
}
