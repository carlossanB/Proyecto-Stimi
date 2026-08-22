import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoordinadorService {
  private readonly logger = new Logger(CoordinadorService.name);

  constructor(private readonly configService: ConfigService) {}

  async chatCoordinador(
    mensaje: string,
    usuarioId: number,
    telefono?: string,
  ): Promise<{ respuesta: string }> {
    const webhookUrl = this.configService.get<string>('N8N_WEBHOOK_COORDINADOR');
    const webhookKey = this.configService.get<string>('N8N_WEBHOOK_COORDINADOR_KEY');

    if (!webhookUrl) {
      throw new InternalServerErrorException(
        'El servicio de chat del coordinador no está configurado. Contacta al administrador.',
      );
    }

    try {
      const payload = {
        mensaje,
        usuarioId: String(usuarioId),
        telefono: telefono ?? '',
        origen: 'pagina_web',
      };

      // Timeout de 60 segundos
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookKey && {
            'x-webhook-key': webhookKey,
            'Authorization': webhookKey,
          }),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        this.logger.error(
          `[ChatCoordinador] n8n respondió con ${response.status}: ${errBody.slice(0, 200)}`,
        );
        throw new InternalServerErrorException(
          'Error en el servicio de chat. Por favor, intenta de nuevo.',
        );
      }

      const data = (await response.json()) as any;
      const respuesta: string =
        data?.mensaje ??
        data?.respuesta ??
        data?.output ??
        data?.text ??
        'El asistente no pudo generar una respuesta. Intenta de nuevo.';

      this.logger.log(`[ChatCoordinador] Respuesta de n8n recibida para usuarioId=${usuarioId}`);
      return { respuesta };
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) throw error;
      if (error.name === 'AbortError') {
        this.logger.error('[ChatCoordinador] Timeout esperando respuesta de n8n');
        throw new InternalServerErrorException(
          'El asistente está tardando demasiado. Intenta de nuevo.',
        );
      }
      this.logger.error(`[ChatCoordinador] Error inesperado: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo conectar con el asistente. Verifica tu conexión.',
      );
    }
  }
}
