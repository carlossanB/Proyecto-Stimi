import {
  Body,
  Controller,
  Post,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── POST /auth/login ────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa y retorno del JWT token.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta pendiente de aprobación.' })
  async login(@Body() body: LoginDto) {
    const identifier = body.username;
    const password = body.password;
    return this.authService.login(identifier, password);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente.' })
  @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta.' })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: any,
  ) {
    return this.authService.changePassword(user.sub, body.currentPassword, body.newPassword);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada.' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token de recuperación' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida.' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado.' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
