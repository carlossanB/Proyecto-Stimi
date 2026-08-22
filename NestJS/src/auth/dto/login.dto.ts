import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Correo electrónico o número de documento', example: 'juan.perez@sena.edu.co' })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({ description: 'Contraseña de la cuenta', example: 'instructor123' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
