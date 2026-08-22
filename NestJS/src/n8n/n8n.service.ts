import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Notifica a n8n de una acción realizada en la plataforma
   * @param tipo El tipo de acción (ej. 'informe_cargado', 'estado_cambiado')
   * @param payload Datos adicionales de la acción
   */
  async notifyAction(tipo: string, payload: any): Promise<void> {
    const webhookUrl = this.configService.get<string>('N8N_WEBHOOK_PAGINA');
    const webhookKey = this.configService.get<string>('N8N_WEBHOOK_KEY');

    if (!webhookUrl) {
      this.logger.warn('N8N_WEBHOOK_PAGINA no está configurado. Se omite la notificación a n8n.');
      return;
    }

    try {
      const body = {
        tipo,
        ...payload,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookKey && { 'Authorization': webhookKey, 'x-webhook-key': webhookKey }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        this.logger.warn(
          `n8n webhook respondió con status ${response.status}: ${response.statusText} | Body: ${errBody.slice(0, 300)}`,
        );
      } else {
        this.logger.log(`Acción '${tipo}' notificada a n8n exitosamente.`);
      }
    } catch (error: any) {
      // Fallo silencioso para no interrumpir el flujo del usuario
      this.logger.error(`Error al enviar notificación a n8n: ${error.message}`);
    }
  }
}
