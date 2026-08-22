import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion, NotificacionTipo } from './entities/notificacion.entity';
import { MailService } from '../mail/mail.service';
import { Persona } from '../personas/entities/persona.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notifRepository: Repository<Notificacion>,
    private readonly mailService: MailService,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

  /** Normaliza una entidad Notificacion para que cumpla estrictamente el formato solicitado */
  private formatNotificacion(notif: Notificacion) {
    let title = 'Información';
    if (notif.tipo === 'success') title = 'Éxito';
    else if (notif.tipo === 'warning') title = 'Atención';
    else if (notif.tipo === 'error') title = 'Error';

    return {
      id: notif.id_notificacion,
      userId: notif.usuario ? notif.usuario.id_usuario : null,
      title,
      message: notif.mensaje,
      type: notif.tipo,
      isRead: notif.leida,
      createdAt: notif.created_at,

      // Fallbacks de compatibilidad para evitar roturas
      id_notificacion: notif.id_notificacion,
      mensaje: notif.mensaje,
      tipo: notif.tipo,
      leida: notif.leida,
      created_at: notif.created_at,
    };
  }

  /** Devuelve todas las notificaciones de un usuario. Si no tiene ninguna, auto-genera notificaciones iniciales */
  async findByUsuario(userId: number): Promise<any[]> {
    let list = await this.notifRepository.find({
      where: { usuario: { id_usuario: userId } },
      order: { created_at: 'DESC' },
      relations: { usuario: true },
    });

    if (list.length === 0) {
      const defaultNotifs = [
        {
          mensaje: 'Bienvenido al Sistema STIMI. Su cuenta está activa y validada.',
          tipo: 'success' as NotificacionTipo,
        },
        {
          mensaje: 'Recordatorio: Recuerde cargar sus entregables mensuales GC y GF antes de la fecha límite.',
          tipo: 'warning' as NotificacionTipo,
        },
        {
          mensaje: 'Centro de Notificaciones: Las alertas de entrega y seguimiento se mostrarán en este panel.',
          tipo: 'info' as NotificacionTipo,
        },
      ];

      for (const item of defaultNotifs) {
        await this.crear(userId, item.mensaje, item.tipo, false);
      }

      list = await this.notifRepository.find({
        where: { usuario: { id_usuario: userId } },
        order: { created_at: 'DESC' },
        relations: { usuario: true },
      });
    }

    return list.map((n) => this.formatNotificacion(n));
  }

  /** Cuenta cuántas notificaciones no leídas tiene un usuario */
  async countUnread(userId: number): Promise<number> {
    const list = await this.notifRepository.find({
      where: { usuario: { id_usuario: userId } },
    });

    if (list.length === 0) {
      await this.findByUsuario(userId);
    }

    return this.notifRepository.count({
      where: { usuario: { id_usuario: userId }, leida: false },
    });
  }

  /** Marca una notificación específica como leída */
  async marcarLeida(id: number, userId: number): Promise<any> {
    const notif = await this.notifRepository.findOne({
      where: { id_notificacion: id, usuario: { id_usuario: userId } },
      relations: { usuario: true },
    });
    if (!notif) {
      throw new NotFoundException(`Notificación #${id} no encontrada`);
    }
    notif.leida = true;
    const saved = await this.notifRepository.save(notif);
    return this.formatNotificacion(saved);
  }

  /** Marca todas las notificaciones del usuario como leídas */
  async marcarTodasLeidas(userId: number): Promise<{ updated: number }> {
    const result = await this.notifRepository.update(
      { usuario: { id_usuario: userId }, leida: false },
      { leida: true },
    );
    return { updated: result.affected ?? 0 };
  }

  /** Crea una notificación para un usuario */
  async crear(
    userId: number,
    mensaje: string,
    tipo: NotificacionTipo = 'info',
    enviarCorreo: boolean = true,
  ): Promise<any> {
    const notif = this.notifRepository.create({
      usuario: { id_usuario: userId } as any,
      mensaje,
      tipo,
    });
    const saved = await this.notifRepository.save(notif);
    // Recuperar relaciones para formatNotificacion
    const fullNotif = await this.notifRepository.findOne({
      where: { id_notificacion: saved.id_notificacion },
      relations: { usuario: true },
    });

    // Enviar correo electrónico solo si enviarCorreo es true y está habilitado en las preferencias del usuario
    if (enviarCorreo) {
      try {
        const user = await this.personaRepository.findOne({ where: { id_usuario: userId } });
        if (user && user.correo) {
          const prefs: any = user.preferencias_notificaciones ?? {};
          if (prefs.notif_correo !== false) {
            let title = 'Información';
            if (tipo === 'success') title = 'Éxito';
            else if (tipo === 'warning') title = 'Atención';
            else if (tipo === 'error') title = 'Error';

            const subject = `🔔 [Stimi] Nueva notificación: ${title}`;
            await this.mailService.sendNotificationEmail(user.correo, subject, mensaje, tipo);
          }
        }
      } catch (err: any) {
        console.error('Error al enviar correo de notificación:', err?.message || err);
      }
    }

    return this.formatNotificacion(fullNotif || saved);
  }

  /** Elimina una notificación específica del usuario */
  async eliminar(id: number, userId: number): Promise<{ deleted: boolean }> {
    const notif = await this.notifRepository.findOne({
      where: { id_notificacion: id, usuario: { id_usuario: userId } },
    });
    if (!notif) {
      throw new NotFoundException(`Notificación #${id} no encontrada`);
    }
    await this.notifRepository.remove(notif);
    return { deleted: true };
  }
}
