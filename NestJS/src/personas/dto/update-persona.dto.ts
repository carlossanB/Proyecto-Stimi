import { IsEmail, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePersonaDto {
  @ApiProperty({ description: 'Nombre completo del usuario', required: false, example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreCompleto?: string;

  @ApiProperty({ description: 'Correo electrónico', required: false, example: 'juan.perez@sena.edu.co' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiProperty({ description: 'Tipo de documento', enum: ['CC', 'CE'], required: false, example: 'CC' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  tipoDocumento?: string;

  @ApiProperty({ description: 'Número de documento', required: false, example: '123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  numeroDocumento?: string;

  @ApiProperty({ description: 'Contraseña para la cuenta', minLength: 8, required: false, example: 'Instructor123*' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.',
  })
  contrasena?: string;

  @ApiProperty({ description: 'Estado de la cuenta (Solo Coordinador)', enum: ['pendiente', 'aprobado', 'rechazado'], required: false, example: 'aprobado' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado_cuenta?: string;

  @ApiProperty({ description: 'ID del Rol asignado (Solo Coordinador)', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  id_rol?: number;

  @ApiProperty({ description: 'ID del Área asignada (Solo Coordinador)', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  id_area?: number;

  @ApiProperty({ description: 'Motivo de rechazo de la cuenta (Solo Coordinador)', required: false, example: 'Documentación incompleta' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo_rechazo?: string;

  @ApiProperty({ description: 'URL de la carpeta de Google Drive del instructor', required: false, example: 'https://drive.google.com/drive/folders/1abc...' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  carpeta_drive_url?: string;
}
