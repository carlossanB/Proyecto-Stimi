import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonaDto {
  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(150)
  nombreCompleto!: string;

  @ApiProperty({ description: 'Correo electrónico institucional o personal', example: 'juan.perez@sena.edu.co' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ description: 'Tipo de documento de identidad', enum: ['CC', 'CE'], example: 'CC' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsIn(['CC', 'CE'])
  tipoDocumento!: string;

  @ApiProperty({ description: 'Número de documento de identidad', example: '123456789' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(20)
  numeroDocumento!: string;

  @ApiProperty({ description: 'Contraseña para la cuenta', minLength: 8, example: 'Instructor123*' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.',
  })
  contrasena!: string;

  @ApiProperty({ description: 'Confirmación de la contraseña', required: false, example: 'instructor123' })
  @IsOptional()
  @IsString()
  confirmarContrasena?: string;

  @ApiProperty({ description: 'Regional SENA a la que pertenece el usuario', required: false, example: 'Huila' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(150)
  regional?: string;

  @ApiProperty({ description: 'Sede o Centro de Formación', required: false, example: 'Centro de Gestión y Desarrollo Sostenible Surcolombiano' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  sedeCentro?: string;
}