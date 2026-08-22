import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInformeDto {
  @IsInt()
  id_usuario!: number;

  @IsInt()
  id_periodo!: number;

  @IsString()
  @IsIn(['GC', 'GF'])
  tipo_informe!: string;

  @IsOptional()
  @IsString()
  @IsIn(['borrador', 'enviado', 'validado', 'rechazado'])
  estado?: string;

  @IsOptional()
  @IsBoolean()
  firmado?: boolean;

  @IsOptional()
  @IsBoolean()
  pendiente_sincronizacion?: boolean;
}


