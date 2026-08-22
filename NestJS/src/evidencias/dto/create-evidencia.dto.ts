import { IsInt, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEvidenciaDto {
  @ApiProperty({ description: 'Descripción detallada de la evidencia', example: 'Registro de asistencia a clase' })
  @IsString()
  descripcion!: string;

  @ApiProperty({ description: 'Carpeta u obligación a la que pertenece', example: 'Obligación 1' })
  @IsString()
  @MaxLength(255)
  carpeta_obligacion!: string;

  @ApiProperty({ description: 'Ruta física del archivo subido en el servidor', example: 'uploads/informes/evidencia-123.pdf' })
  @IsString()
  @MaxLength(255)
  ruta_archivo!: string;

  @ApiProperty({ description: 'Tipo o extensión del archivo (e.g. pdf, png, xlsx)', example: 'pdf' })
  @IsString()
  @MaxLength(10)
  tipo_archivo!: string;

  @ApiProperty({ description: 'Tamaño en bytes del archivo', example: 1048576 })
  @IsInt()
  tamano_bytes!: number;

  @ApiProperty({ description: 'ID de la actividad a la que se asocia la evidencia', example: 1 })
  @IsInt()
  fk_actividades!: number;
}