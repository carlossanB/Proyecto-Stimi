import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoordinadorChatDto {
  @ApiProperty({ description: 'Mensaje del coordinador' })
  @IsString()
  mensaje: string;

  @ApiPropertyOptional({ description: 'Teléfono del coordinador (opcional)' })
  @IsOptional()
  @IsString()
  telefono?: string;
}
