import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateEstadoDto {
  @IsEnum(['No cargado', 'Borrador', 'Pendiente', 'Devuelto', 'Validado'])
  estado!: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}
