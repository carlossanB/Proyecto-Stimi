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

  // ── 2. Chat del Asistente IA (Frontend → NestJS → OpenAI) ───────────────────
  async procesarChatAsistente(
    dto: AsistenteChatDto,
    usuarioPayload: any,
  ): Promise<{ respuesta: string }> {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new InternalServerErrorException(
        'El servicio de IA no está configurado. Contacta al administrador.',
      );
    }

    const systemPrompt = `Eres el Asistente Virtual STIMI, un asistente especializado en apoyar a instructores del SENA en Colombia.
Tu rol es ayudarles con:
- Redactar y estructurar informes de seguimiento de contrato de aprendizaje (GC - Gestión de Compromiso).
- Redactar informes de seguimiento a la formación (GF - Gestión de Formación).
- Sugerir evidencias pedagógicas según el plan de formación.
- Redactar obligaciones, actividades de aprendizaje y compromisos.
- Dar orientaciones sobre el correcto seguimiento de aprendices.
- Resolver dudas sobre los lineamientos institucionales del SENA.

Instrucciones de comportamiento:
- Responde siempre en español colombiano, de manera profesional pero cercana.
- Cuando te pidan redactar texto para un informe, dale formato claro y listo para copiar.
- Sé conciso en tus respuestas: máximo 3 párrafos, a menos que el usuario pida más detalle.
- No inventes datos de aprendices ni cédulas. Usa placeholders como [NOMBRE DEL APRENDIZ] o [NÚMERO DE FICHA].
- No hagas menciones a tecnologías externas ni recomiendes otras herramientas.`;

    const historialMsgs = (dto.historial ?? []).slice(-10).map((m) => ({
      role: m.rol === 'user' ? 'user' : 'assistant',
      content: m.contenido,
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historialMsgs,
      { role: 'user', content: dto.mensaje },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        this.logger.error(`Error de OpenAI: ${response.status} - ${err}`);
        throw new InternalServerErrorException(
          'Error al comunicarse con el servicio de IA. Intenta de nuevo.',
        );
      }

      const data = (await response.json()) as any;
      const respuesta: string =
        data?.choices?.[0]?.message?.content?.trim() ??
        'No pude generar una respuesta. Por favor, intenta de nuevo.';

      return { respuesta };
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(
        'Error interno del asistente. Por favor, intenta más tarde.',
      );
    }
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
