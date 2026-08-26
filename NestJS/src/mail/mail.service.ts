import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false, // TLS — port 587
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Stimi');
    const fromUser = this.configService.get<string>('MAIL_USER');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
          .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
          .header { background: #39A900; padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px; }
          .body { padding: 32px 28px; color: #333; }
          .body p { font-size: 15px; line-height: 1.6; }
          .token-box { background: #f0f7ee; border: 1.5px dashed #39A900; border-radius: 8px; padding: 16px 20px; margin: 24px 0; text-align: center; }
          .token-box code { font-size: 13px; font-family: monospace; word-break: break-all; color: #1a5c00; }
          .footer { background: #f4f4f7; padding: 16px 24px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña — Stimi</h1>
          </div>
          <div class="body">
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Stimi (SENA)</strong>.</p>
            <p>Copia y pega el siguiente token de recuperación en la aplicación:</p>
            <div class="token-box">
              <code>${token}</code>
            </div>
            <p><strong>⚠️ Este token expira en 1 hora.</strong> Si no solicitaste este cambio, ignora este correo — tu contraseña no será modificada.</p>
            <p>Saludos,<br/>El equipo de Stimi SENA</p>
          </div>
          <div class="footer">
            Este es un correo automático, por favor no respondas a este mensaje.
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to,
      subject: '🔐 Recuperación de contraseña — Stimi',
      html,
    });

    this.logger.log(`Password reset email sent to ${to}`);
  }

  async sendNotificationEmail(to: string, subject: string, message: string, type: string = 'info'): Promise<void> {
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Stimi');
    const fromUser = this.configService.get<string>('MAIL_USER');

    const typeIcons: Record<string, string> = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
    };
    const icon = typeIcons[type] || '🔔';

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
          .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
          .header { background: #39A900; padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px; }
          .body { padding: 32px 28px; color: #333; }
          .body p { font-size: 15px; line-height: 1.6; }
          .msg-box { background: #f9f9fb; border-left: 4px solid #39A900; padding: 16px; margin: 24px 0; border-radius: 4px; }
          .msg-box p { margin: 0; font-size: 14px; color: #444; }
          .footer { background: #f4f4f7; padding: 16px 24px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>${icon} Nueva Notificación — Stimi</h1>
          </div>
          <div class="body">
            <p>Hola,</p>
            <p>Tienes una nueva notificación en la plataforma <strong>Stimi (SENA)</strong>:</p>
            <div class="msg-box">
              <p>${message}</p>
            </div>
            <p>Puedes acceder a la plataforma para ver más detalles.</p>
            <p>Saludos,<br/>El equipo de Stimi SENA</p>
          </div>
          <div class="footer">
            Este es un correo automático, por favor no respondas a este mensaje. Si no deseas recibir estos correos, puedes desactivar la opción en la configuración de tu perfil.
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to,
      subject: subject || `${icon} Notificación de Stimi`,
      html,
    });

    this.logger.log(`Notification email sent to ${to}`);
  }

  async sendReportStatusEmail(
    to: string,
    instructorName: string,
    tipoInforme: string,
    periodo: string,
    estado: string,
    observacion?: string,
  ): Promise<void> {
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Stimi');
    const fromUser = this.configService.get<string>('MAIL_USER');

    const isApproved = estado.toLowerCase() === 'validado' || estado.toLowerCase() === 'aprobado';
    const estadoTexto = isApproved ? 'APROBADO' : 'DEVUELTO';
    const icon = isApproved ? '✅' : '❌';
    const headerBg = isApproved ? '#39A900' : '#D9381E';
    const subject = `${icon} [Stimi SENA] Informe ${tipoInforme} (${periodo}) — ${isApproved ? 'Aprobado' : 'Devuelto'}`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
          .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
          .header { background: ${headerBg}; padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px; }
          .body { padding: 32px 28px; color: #333; }
          .body p { font-size: 15px; line-height: 1.6; }
          .details-box { background: #f9f9fb; border-left: 4px solid ${headerBg}; padding: 16px; margin: 24px 0; border-radius: 4px; }
          .details-box p { margin: 6px 0; font-size: 14px; color: #444; }
          .obs-box { background: #fff8f8; border: 1px solid #f5c6cb; padding: 12px 16px; border-radius: 6px; margin-top: 12px; color: #721c24; }
          .footer { background: #f4f4f7; padding: 16px 24px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>${icon} Informe ${estadoTexto}</h1>
          </div>
          <div class="body">
            <p>Hola <strong>${instructorName || 'Instructor'}</strong>,</p>
            <p>Se ha actualizado el estado de tu informe en la plataforma <strong>Stimi (SENA)</strong>:</p>
            <div class="details-box">
              <p><strong>Tipo de Informe:</strong> ${tipoInforme}</p>
              <p><strong>Período:</strong> ${periodo}</p>
              <p><strong>Estado:</strong> <span style="color: ${headerBg}; font-weight: bold;">${estadoTexto}</span></p>
              ${observacion ? `<div class="obs-box"><strong>Motivo / Observación:</strong><br/>${observacion}</div>` : ''}
            </div>
            <p>Puedes acceder a la plataforma para ver más detalles.</p>
            <p>Saludos,<br/>El equipo de Stimi SENA</p>
          </div>
          <div class="footer">
            Este es un correo automático, por favor no respondas a este mensaje.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromUser}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Report status email (${estadoTexto}) sent successfully to ${to}`);
    } catch (error: any) {
      this.logger.error(
        `Error sending report status email to ${to}: ${error?.message || error}`,
        error?.stack,
      );
      throw error;
    }
  }

  async sendAccountApprovedEmail(to: string, userName: string): Promise<void> {
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Stimi');
    const fromUser = this.configService.get<string>('MAIL_USER');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
          .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
          .header { background: #39A900; padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px; }
          .body { padding: 32px 28px; color: #333; }
          .body p { font-size: 15px; line-height: 1.6; }
          .highlight-box { background: #f0fdf4; border-left: 4px solid #39A900; padding: 16px; margin: 24px 0; border-radius: 4px; }
          .highlight-box p { margin: 0; font-size: 14px; color: #166534; font-weight: bold; }
          .footer { background: #f4f4f7; padding: 16px 24px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>✅ ¡Cuenta Aprobada! — Stimi</h1>
          </div>
          <div class="body">
            <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
            <p>Te informamos que tu solicitud de registro en la plataforma <strong>Stimi (SENA)</strong> ha sido <strong>aprobada exitosamente</strong> por la Coordinación Académica.</p>
            <div class="highlight-box">
              <p>Tu cuenta ya se encuentra activa y tienes acceso completo al sistema.</p>
            </div>
            <p>Ya puedes iniciar sesión con tu correo electrónico o documento y tu contraseña registrada para comenzar a gestionar tus informes.</p>
            <p>Saludos cordiales,<br/>Equipo de Coordinación — Stimi SENA</p>
          </div>
          <div class="footer">
            Este es un correo automático, por favor no respondas a este mensaje.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromUser}>`,
        to,
        subject: '✅ ¡Tu cuenta ha sido aprobada! — Stimi SENA',
        html,
      });
      this.logger.log(`Account approval email sent successfully to ${to}`);
    } catch (error: any) {
      this.logger.error(
        `Error sending account approval email to ${to}: ${error?.message || error}`,
        error?.stack,
      );
      // No relanzamos para evitar que falle la transacción principal si falla el servidor de correo
    }
  }

  async sendAccountRejectedEmail(to: string, userName: string, reason?: string): Promise<void> {
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Stimi');
    const fromUser = this.configService.get<string>('MAIL_USER');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
          .wrapper { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
          .header { background: #D9381E; padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px; }
          .body { padding: 32px 28px; color: #333; }
          .body p { font-size: 15px; line-height: 1.6; }
          .obs-box { background: #fff5f5; border-left: 4px solid #D9381E; padding: 16px; margin: 24px 0; border-radius: 4px; color: #991b1b; }
          .obs-box p { margin: 0; font-size: 14px; }
          .footer { background: #f4f4f7; padding: 16px 24px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>❌ Solicitud Rechazada — Stimi</h1>
          </div>
          <div class="body">
            <p>Hola <strong>${userName || 'Usuario'}</strong>,</p>
            <p>Te informamos que tu solicitud de registro en la plataforma <strong>Stimi (SENA)</strong> no ha sido aprobada por la Coordinación Académica.</p>
            <div class="obs-box">
              <p><strong>Motivo / Observación de rechazo:</strong></p>
              <p style="margin-top: 8px;">${reason || 'No se especificó un motivo.'}</p>
            </div>
            <p>Si consideras que se trata de un error o deseas subsanar los datos, por favor comunícate con tu Coordinador Académico o realiza nuevamente tu registro con la información correcta.</p>
            <p>Saludos cordiales,<br/>Equipo de Coordinación — Stimi SENA</p>
          </div>
          <div class="footer">
            Este es un correo automático, por favor no respondas a este mensaje.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromUser}>`,
        to,
        subject: '❌ Solicitud de cuenta no aprobada — Stimi SENA',
        html,
      });
      this.logger.log(`Account rejection email sent successfully to ${to}`);
    } catch (error: any) {
      this.logger.error(
        `Error sending account rejection email to ${to}: ${error?.message || error}`,
        error?.stack,
      );
      // No relanzamos para evitar que falle la transacción principal si falla el servidor de correo
    }
  }
}

