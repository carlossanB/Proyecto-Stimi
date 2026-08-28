import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
// pdf-parse eliminado, ahora n8n se encarga

import { Persona } from '../personas/entities/persona.entity';
import { Obligacione } from '../obligaciones/entities/obligacione.entity';
import { InformesService } from '../informes/informes.service';
import { BotHenryWebhookDto } from './dto/bot-henry.dto';
import { AsistenteChatDto } from './dto/asistente-chat.dto';
import { GuardarHistorialDto } from './dto/guardar-historial.dto';
import { ChatUploadDto } from './dto/chat-upload.dto';
import { HistorialConversacion } from './entities/historial-conversacion.entity';
import { N8nService } from '../n8n/n8n.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(HistorialConversacion)
    private readonly historialRepository: Repository<HistorialConversacion>,
    @InjectRepository(Obligacione)
    private readonly obligacionesRepository: Repository<Obligacione>,
    private readonly informesService: InformesService,
    private readonly configService: ConfigService,
    private readonly n8nService: N8nService,
  ) {}

  // ── 1. Procesamiento de revisión del bot Stimi (n8n → NestJS) ───────────────
  async processBotReview(dto: BotHenryWebhookDto) {
    const usuario = await this.personaRepository.findOne({
      where: { numero_documento: dto.cedula.trim() },
    });

    if (!usuario) {
      throw new NotFoundException(
        `Usuario con cédula ${dto.cedula} no encontrado en el sistema`,
      );
    }

    const result = await this.informesService.cambiarEstadoReporte(
      dto.periodo,
      dto.tipo_informe.toUpperCase(),
      dto.estado,
      dto.observacion,
      usuario.id_usuario,
    );

    return {
      success: true,
      message: 'Informe actualizado correctamente a través del webhook del bot Stimi',
      data: {
        id_informe: result?.id_informe,
        estado: result?.estado,
        instructor: usuario.nombre_completo,
      },
    };
  }

  // ── 2. Chat del Asistente IA Instructor (Frontend → NestJS → n8n) ─────────
  async procesarChatAsistente(
    dto: AsistenteChatDto,
    usuarioPayload: any,
  ): Promise<{ respuesta: string; mensaje: string; ok: boolean; origen?: string }> {
    const usuarioId =
      usuarioPayload?.id_usuario || usuarioPayload?.id || usuarioPayload?.sub;

    if (!usuarioId) {
      throw new BadRequestException('No se identificó al usuario autenticado.');
    }

    const nombre =
      usuarioPayload?.nombre_completo ||
      usuarioPayload?.nombre ||
      'Instructor';

    const rawWebhookUrl =
      this.configService.get<string>('N8N_WEBHOOK_CHAT_INSTRUCTOR') || '';
    const webhookUrl =
      rawWebhookUrl.trim() ||
      'https://n8n.stimi.online/webhook/chat-instructor-web';

    const rawWebhookKey =
      this.configService.get<string>('N8N_WEBHOOK_CHAT_INSTRUCTOR_KEY') || '';
    const webhookKey = rawWebhookKey.trim();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (webhookKey) {
      headers['x-webhook-key'] = webhookKey;
      headers['Authorization'] = webhookKey;
    }

    const payload = {
      usuarioId: Number(usuarioId),
      mensaje: dto.mensaje,
      nombre,
    };

    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        this.logger.error('[ChatInstructor] Timeout (60s) esperando respuesta de n8n');
        throw new InternalServerErrorException(
          'El asistente está tardando demasiado. Intenta de nuevo.',
        );
      }
      const causeInfo = fetchError.cause ? JSON.stringify(fetchError.cause) : 'N/A';
      const stackSnippet = fetchError.stack ? fetchError.stack.slice(0, 300) : 'N/A';
      this.logger.error(
        `[ChatInstructor] Error de red llamando a n8n: name=${fetchError.name} | message=${fetchError.message} | cause=${causeInfo} | stack=${stackSnippet}`,
      );
      throw new InternalServerErrorException(
        'No se pudo conectar con el asistente. Verifica tu conexión.',
      );
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      this.logger.error(
        `[ChatInstructor] n8n respondió status ${response.status}: ${errText.slice(0, 300)}`,
      );
      throw new InternalServerErrorException(
        'Error en el servicio de chat del instructor. Por favor, intenta de nuevo.',
      );
    }

    let responseText = '';
    try {
      responseText = await response.text();
    } catch (readError: any) {
      this.logger.error(
        `[ChatInstructor] Error leyendo cuerpo de respuesta de n8n: ${readError.message}`,
      );
      throw new InternalServerErrorException(
        'Error al leer la respuesta del servicio de chat.',
      );
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      const preview = responseText.slice(0, 300);
      this.logger.error(
        `[ChatInstructor] Error al parsear JSON de n8n (Status ${response.status}). Preview: "${preview}". Error: ${parseError.message}`,
      );
      throw new InternalServerErrorException(
        'La respuesta del servicio de chat no es un JSON válido.',
      );
    }

    const respuestaExtraida: string = (
      data?.mensaje ??
      data?.respuesta ??
      data?.output ??
      data?.text ??
      ''
    ).toString().trim();

    if (!respuestaExtraida) {
      this.logger.warn(
        `[ChatInstructor] n8n respondió 200 OK pero sin contenido de texto útil. Body: ${JSON.stringify(data).slice(0, 300)}`,
      );
      throw new InternalServerErrorException(
        'El asistente devolvió una respuesta vacía. Por favor, intenta de nuevo.',
      );
    }

    this.logger.log(
      `[ChatInstructor] Respuesta exitosa recibida para usuarioId=${usuarioId}`,
    );

    return {
      ok: true,
      respuesta: respuestaExtraida,
      mensaje: respuestaExtraida,
      origen: data?.origen ?? 'pagina_web_instructor',
    };
  }

  // ── 2.5. Validación de informe PDF desde el chat web (Frontend → OpenAI + DB) ─
  async procesarSubidaChat(
    file: any,
    dto: ChatUploadDto,
    usuarioPayload: any,
  ): Promise<{
    respuesta: string;
    estado: string;
    id_informe?: number;
  }> {
    if (!file) {
      throw new BadRequestException('Archivo PDF requerido.');
    }

    const n8nWebhookUrl = this.configService.get<string>('N8N_WEBHOOK_VALIDAR');
    const n8nWebhookKey = this.configService.get<string>('N8N_WEBHOOK_VALIDAR_KEY');

    if (!n8nWebhookUrl) {
      throw new InternalServerErrorException(
        'El webhook de validación de n8n no está configurado. Contacta al administrador.',
      );
    }

    // 1. Obtener datos del usuario autenticado
    const usuario = await this.personaRepository.findOne({
      where: { id_usuario: usuarioPayload.sub },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado en el sistema.');
    }

    let cedula = usuario.numero_documento;
    let tipoInforme = dto.tipo_informe?.toUpperCase() || 'GC';
    const periodo = dto.periodo || '';

    // Parsear el periodo original como fallback: "Julio 2026" → mes="Julio", anio="2026"
    const partesPeriodo = periodo.trim().split(' ');
    let mes = partesPeriodo[0] ?? 'Desconocido';
    let anio = partesPeriodo[1] ?? String(new Date().getFullYear());

    // Detectar datos desde el nombre del archivo
    if (file && file.originalname) {
      const fileNameUpper = file.originalname.toUpperCase();
      
      if (fileNameUpper.startsWith('GF_')) {
        tipoInforme = 'GF';
      } else if (fileNameUpper.startsWith('GC_')) {
        tipoInforme = 'GC';
      }

      // Intentar extraer cédula, mes y año del nombre (ej: GF_123456_MAYO_2026.pdf)
      const baseName = fileNameUpper.replace(/\.PDF$/, '');
      const parts = baseName.split('_');

      if (parts.length >= 4 && (parts[0] === 'GC' || parts[0] === 'GF')) {
        // Cédula suele ser el segundo elemento
        if (/^\d+$/.test(parts[1])) {
          cedula = parts[1];
        }
        
        // Año y Mes suelen ser los últimos dos elementos
        const possibleAnio = parts[parts.length - 1];
        const possibleMes = parts[parts.length - 2];
        
        if (/^\d{4}$/.test(possibleAnio)) {
          anio = possibleAnio;
          mes = possibleMes;
        }
      }
    }

    // 2. Leer archivo PDF y convertir a Base64
    let pdfBase64: string;
    try {
      const buffer = fs.readFileSync(file.path);
      pdfBase64 = buffer.toString('base64');
    } catch (err: any) {
      this.logger.error(`[SubidaChat] Error leyendo el PDF temporal: ${err.message}`);
      throw new InternalServerErrorException('Error al procesar el archivo subido.');
    }

    // 3. Llamar al webhook de n8n
    let mensajeIA: string;
    let estadoIA: string | undefined;

    try {
      this.logger.log(`[SubidaChat] Enviando informe a n8n para validación: ${file.originalname}`);
      const payload = {
        tipo_informe: tipoInforme,
        cedula,
        mes,
        anio,
        fileName: file.originalname,
        pdfBase64,
        origen: 'pagina_web'
      };

      // Timeout manual de 180 segundos (3 minutos) para procesos pesados de IA en n8n
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(n8nWebhookKey && { 'x-webhook-key': n8nWebhookKey, 'Authorization': n8nWebhookKey }),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        this.logger.error(`[SubidaChat] Error webhook n8n: ${response.status} - ${errText}`);
        throw new InternalServerErrorException(
          'Error en el servicio de validación (n8n). Por favor, intenta de nuevo más tarde.',
        );
      }

      const data = (await response.json()) as any;
      mensajeIA = data?.mensaje ?? data?.respuesta ?? data?.observacion ?? '';
      estadoIA = data?.estado;

      if (!mensajeIA) {
         mensajeIA = typeof data === 'string' ? data : JSON.stringify(data);
      }
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) throw error;
      if (error.name === 'AbortError') {
         this.logger.error(`[SubidaChat] Timeout esperando a n8n`);
         throw new InternalServerErrorException('La validación está tomando demasiado tiempo. Intenta de nuevo.');
      }
      this.logger.error(`[SubidaChat] Error inesperado llamando a n8n: ${error.message}`);
      throw new InternalServerErrorException(
        'No se pudo conectar con el motor de validación. Verifica tu conexión e intenta de nuevo.',
      );
    }

    // 5. Determinar el estado a partir de la respuesta de la IA
    // 4. Determinar el estado a partir de la respuesta de la IA (si no viene explícito)
    let estadoResultante: 'validado' | 'devuelto' | 'pendiente' = 'pendiente';

    if (estadoIA && ['validado', 'devuelto', 'pendiente'].includes(estadoIA.toLowerCase())) {
      estadoResultante = estadoIA.toLowerCase() as 'validado' | 'devuelto' | 'pendiente';
    } else {
      // Fallback a lógica textual en caso de que n8n no devuelva el estado explícitamente
      const textoUpper = mensajeIA.toUpperCase();
      if (
        textoUpper.includes('GC COMPLETO') ||
        textoUpper.includes('GF COMPLETO') ||
        textoUpper.includes('✅ GC') ||
        textoUpper.includes('✅ GF')
      ) {
        estadoResultante = 'validado';
      } else if (
        textoUpper.includes('GC INCOMPLETO') ||
        textoUpper.includes('GF INCOMPLETO') ||
        textoUpper.includes('ACCIONES REQUERIDAS') ||
        textoUpper.includes('❌ GC') ||
        textoUpper.includes('❌ GF')
      ) {
        estadoResultante = 'devuelto';
      }
    }

    // 6. Guardar el informe en la base de datos solo si el resultado NO es 'devuelto'
    // (P1: un informe analizado como devuelto no debe registrarse en el sistema)
    let idInforme: number | undefined;
    if (estadoResultante !== 'devuelto') {
      try {
        const informeGuardado = await this.informesService.uploadReport(
          usuario.id_usuario,
          file,
          periodo,
          tipoInforme,
        );

        if (informeGuardado?.id_informe) {
          idInforme = informeGuardado.id_informe;

          // 7. Actualizar el estado del informe con el resultado de la IA
          await this.informesService.cambiarEstadoReporte(
            periodo,
            tipoInforme,
            estadoResultante,
            mensajeIA.slice(0, 1000),
            usuario.id_usuario,
          );
        }
      } catch (dbErr: any) {
        this.logger.warn(
          `[SubidaChat] El informe se analizó pero no se pudo guardar en DB: ${dbErr.message}`,
        );
      }
    }

    this.logger.log(
      `[SubidaChat] Análisis completado: ${tipoInforme} ${periodo} | Estado: ${estadoResultante} | Usuario: ${cedula}`,
    );

    // Notificar a n8n el resultado de la validación desde la página web
    this.n8nService.notifyAction('informe_validado_web', {
      cedula,
      periodo,
      tipo_informe: tipoInforme,
      estado: estadoResultante,
      observacion: mensajeIA.slice(0, 1000),
      usuarioId: usuario.id_usuario,
      origen: 'pagina_web',
    });

    return {
      respuesta: mensajeIA,
      estado: estadoResultante,
      id_informe: idInforme,
    };
  }

  // ── 3. Guardar historial de WhatsApp (n8n → NestJS) ─────────────────────────
  async guardarHistorialWhatsapp(
    dto: GuardarHistorialDto,
  ): Promise<{ success: boolean; id: number }> {
    const registro = this.historialRepository.create({
      remoteJid: dto.remoteJid,
      telefono: dto.telefono,
      rol: dto.rol,
      contenido: dto.contenido,
      tipo_mensaje: dto.tipo_mensaje ?? 'texto',
      cedula: dto.cedula,
      origen: 'whatsapp',
    });

    const saved = await this.historialRepository.save(registro);

    this.logger.log(
      `[HistorialWA] Guardado mensaje de ${dto.telefono} | rol: ${dto.rol} | tipo: ${dto.tipo_mensaje ?? 'texto'}`,
    );

    return { success: true, id: saved.id };
  }

  // ── 4. Obtener historial de WhatsApp para una cédula ─────────────────────────
  async getHistorialPorCedula(cedula: string): Promise<HistorialConversacion[]> {
    return this.historialRepository.find({
      where: { cedula },
      order: { creado_en: 'DESC' },
      take: 50,
    });
  }
}
