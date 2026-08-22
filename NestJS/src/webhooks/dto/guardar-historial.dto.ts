import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GuardarHistorialDto {
  @ApiProperty({ description: 'Número de WhatsApp del usuario (remoteJid)', example: '573001234567@s.whatsapp.net' })
  @IsString()
  @IsNotEmpty()
  remoteJid!: string;

  @ApiProperty({ description: 'Número de teléfono limpio', example: '573001234567' })
  @IsString()
  @IsNotEmpty()
  telefono!: string;

  @ApiProperty({ description: 'Rol del mensaje', enum: ['user', 'assistant'] })
  @IsEnum(['user', 'assistant'])
  rol!: 'user' | 'assistant';

  @ApiProperty({ description: 'Contenido del mensaje', example: 'Hola, necesito ayuda con mi informe' })
  @IsString()
  @IsNotEmpty()
  contenido!: string;

  @ApiProperty({ description: 'Tipo de mensaje', enum: ['texto', 'imagen', 'audio', 'documento'], required: false })
  @IsOptional()
  @IsEnum(['texto', 'imagen', 'audio', 'documento'])
  tipo_mensaje?: string;

  @ApiProperty({ description: 'Cédula del instructor si fue identificado', required: false })
  @IsOptional()
  @IsString()
  cedula?: string;
}
