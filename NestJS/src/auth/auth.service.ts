import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PersonasService } from '../personas/personas.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly personasService: PersonasService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // ─── LOGIN ───────────────────────────────────────────────────────────────────

  async login(identifier: string, contrasena: string) {
    const user = await this.personasService.findByEmailOrDocument(identifier);
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const matches = await bcrypt.compare(contrasena, user.contrasena_hash);
    if (!matches) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (user.estado_cuenta !== 'aprobado') {
      throw new UnauthorizedException(
        'Su cuenta está pendiente de aprobación por el coordinador',
      );
    }

    const payload = {
      sub: user.id_usuario,
      email: user.correo,
      rol: user.rol?.nombre_rol ?? 'instructor',
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        nombreCompleto: user.nombre_completo, // Para compatibilidad directa con frontend
        correo: user.correo,
        email: user.correo, // Para compatibilidad directa con frontend
        tipo_documento: user.tipo_documento,
        numero_documento: user.numero_documento,
        documento: user.numero_documento, // Para compatibilidad directa con frontend
        rol: user.rol?.nombre_rol ?? 'instructor',
        area: user.area?.nombre_area ?? 'Sin Área Asignada',
        firma_digital_ruta: user.firma_digital_ruta || null,
      },
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.personasService.findOne(userId);

    const matches = await bcrypt.compare(currentPassword, user.contrasena_hash);
    if (!matches) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // PersonasService.update() hashes the password internally
    await this.personasService.update(userId, { contrasena: newPassword });

    return { success: true, message: 'Contraseña actualizada correctamente' };
  }

  async forgotPassword(email: string) {
    const user = await this.personasService.findByEmailOrDocument(email);
    if (!user) {
      // Security: don't reveal if the user exists
      return {
        success: true,
        message: 'Si el correo existe en el sistema, recibirás instrucciones.',
      };
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Token valid for 1 hour

    // Save token to the user record
    await this.personasService.saveResetToken(user.id_usuario, resetToken, expiry);

    // Send the email with the reset token
    try {
      await this.mailService.sendPasswordReset(email, resetToken);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending password reset email to ${email}`, error.stack);
      // Even if email fails, we shouldn't throw error to the user if we don't want to expose internal issues
      // But we can just log it.
    }

    // In production, this token would be sent via email.
    // For development: return the token in the response.
    console.log(`[DEV] Reset token for ${email}: ${resetToken}`);

    return {
      success: true,
      message: 'Si el correo existe en el sistema, recibirás instrucciones.',
      // DEV ONLY — remove in production:
      dev_token: resetToken,
      dev_email: email,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.personasService.findByResetToken(token);

    if (!user) {
      throw new BadRequestException('El token de recuperación no es válido o ha expirado');
    }

    if (!user.reset_token_expiry || new Date() > user.reset_token_expiry) {
      throw new BadRequestException('El token de recuperación ha expirado. Solicita uno nuevo.');
    }

    // Update password and clear the token
    await this.personasService.update(user.id_usuario, { contrasena: newPassword });
    await this.personasService.clearResetToken(user.id_usuario);

    return { success: true, message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' };
  }
}
