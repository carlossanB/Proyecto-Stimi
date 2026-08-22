import { IsInt, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateObligacioneDto {
  @ApiProperty({ description: 'Descripción de la obligación contractual', example: 'Desarrollar y documentar las APIs del backend' })
  @IsString()
  @MaxLength(255)
  descripcion!: string;

  @ApiProperty({ description: 'ID del contrato asociado', example: 1 })
  @IsInt()
  id_contrato!: number;
}
