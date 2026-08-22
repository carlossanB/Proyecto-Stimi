import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BotHenryWebhookDto {
  @ApiProperty({ description: 'Número de documento / Cédula del instructor', example: '1098765432' })
  @IsString()
  @IsNotEmpty()
  cedula!: string;

  @ApiProperty({ description: 'Tipo de informe', example: 'GC', enum: ['GC', 'GF'] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['GC', 'GF', 'gc', 'gf'], { message: 'El tipo de informe debe ser GC o GF' })
  tipo_informe!: string;

  @ApiProperty({ description: 'Período correspondiente', example: 'Julio 2026' })
  @IsString()
  @IsNotEmpty()
  periodo!: string;

  @ApiProperty({ description: 'Estado resultante de la revisión', example: 'devuelto', enum: ['validado', 'devuelto', 'pendiente'] })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['validado', 'devuelto', 'aprobado', 'rechazado', 'pendiente'], {
    message: 'El estado debe ser validado, devuelto o pendiente',
  })
  estado!: string;

  @ApiProperty({ description: 'Observaciones de la revisión realizada por la IA', example: 'Falta la firma en la página 3' })
  @IsString()
  @IsOptional()
  observacion?: string;
}
