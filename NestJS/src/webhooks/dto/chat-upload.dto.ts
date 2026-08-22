import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatUploadDto {
  @ApiProperty({ description: 'Tipo de informe', example: 'GC', enum: ['GC', 'GF'] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['GC', 'GF', 'gc', 'gf'], { message: 'El tipo de informe debe ser GC o GF' })
  tipo_informe!: string;

  @ApiProperty({ description: 'Período correspondiente', example: 'Julio 2026' })
  @IsString()
  @IsNotEmpty()
  periodo!: string;
}
