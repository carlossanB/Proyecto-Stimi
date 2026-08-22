import { IsIn, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty({ description: 'Nombre único del rol', enum: ['instructor', 'coordinador'], example: 'instructor' })
  @IsString()
  @IsIn(['instructor', 'coordinador'])
  @MaxLength(30)
  nombre_rol!: string;
}