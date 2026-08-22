import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de recuperación recibido', example: 'abc123xyz' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Nueva contraseña', example: 'Nueva456*', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.',
  })
  newPassword: string;
}
