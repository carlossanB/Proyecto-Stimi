import { IsString, IsNotEmpty, IsArray, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ description: 'Rol del mensaje', enum: ['user', 'assistant'] })
  @IsEnum(['user', 'assistant'])
  rol!: 'user' | 'assistant';

  @ApiProperty({ description: 'Contenido del mensaje', example: 'Ayúdame con mi informe GC' })
  @IsString()
  @IsNotEmpty()
  contenido!: string;
}

export class AsistenteChatDto {
  @ApiProperty({ description: 'Mensaje actual del usuario', example: 'Ayúdame a redactar las obligaciones para mi GC de Julio' })
  @IsString()
  @IsNotEmpty()
  mensaje!: string;

  @ApiProperty({
    description: 'Historial de la conversación (últimos mensajes para contexto)',
    type: [ChatMessageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  historial?: ChatMessageDto[];
}
