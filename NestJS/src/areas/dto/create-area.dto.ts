import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaDto {
  @ApiProperty({ description: 'Nombre del área de formación profesional', example: 'TIC' })
  @IsString()
  @MaxLength(100)
  nombre_area!: string;

  @ApiProperty({ description: 'ID de la regional (1 = REGULAR, 2 = CAMPESENA)', example: 1, required: false })
  @IsOptional()
  @IsInt()
  id_regional?: number;

  @ApiProperty({ description: 'Tipo de área (REGULAR o CAMPESENA)', example: 'REGULAR', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo?: string;
}