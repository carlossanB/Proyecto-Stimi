import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoordinadorService {
  private readonly logger = new Logger(CoordinadorService.name);

  constructor(private readonly configService: ConfigService) {}

  async chatCoordinador(
    mensaje: string,
    usuarioPayload: any,
    telefono?: string,
  ): Promise<{ respuesta: string }> {
    const usuarioId =
      typeof usuarioPayload === 'number'
        ? usuarioPayload
        : usuarioPayload?.id_usuario || usuarioPayload?.id || usuarioPayload?.sub;

    if (!usuarioId) {
      throw new BadRequestException('No se identificó al usuario autenticado.');
    }

    const nombre =
      typeof usuarioPayload === 'object'
        ? usuarioPayload?.nombre_completo || usuarioPayload?.nombre || 'Coordinador'
        : 'Coordinador';

    const webhookUrl =
      this.configService.get<string>('N8N_WEBHOOK_COORDINADOR') ||
      this.configService.get<string>('N8N_WEBHOOK_CHAT_COORDINADOR') ||
      'https://n8n.stimi.online/webhook/chat-coordinador-web';
    const webhookKey = this.configService.get<string>('N8N_WEBHOOK_COORDINADOR_KEY');

    const payload = {
      usuarioId: Number(usuarioId),
      mensaje,
      nombre,
      rol: 'coordinador',
      telefono: telefono ?? '',
    };

    try {
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
          'El servicio de chat del coordinador no respondió correctamente. Por favor, intenta de nuevo.',
        );
      }

      const data = (await response.json()) as any;
      const respuesta: string =
        data?.respuesta ??
        data?.mensaje ??
        data?.output ??
        data?.text ??
        'El asistente de coordinación no pudo generar una respuesta en este momento.';

      this.logger.log(`[ChatCoordinador] Respuesta de n8n recibida para usuarioId=${usuarioId}`);
      return { respuesta };
    } catch (error: any) {
      if (error instanceof InternalServerErrorException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.name === 'AbortError') {
        this.logger.error('[ChatCoordinador] Timeout esperando respuesta de n8n');
        throw new InternalServerErrorException(
          'El asistente del coordinador está tardando demasiado. Intenta de nuevo.',
        );
      }
      this.logger.error(`[ChatCoordinador] Error inesperado: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo conectar con el asistente del coordinador. Verifica tu conexión.',
      );
    }
  }
}
