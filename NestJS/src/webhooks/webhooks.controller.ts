import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { WebhooksService } from './webhooks.service';
import { BotHenryWebhookDto } from './dto/bot-henry.dto';
import { AsistenteChatDto } from './dto/asistente-chat.dto';
import { GuardarHistorialDto } from './dto/guardar-historial.dto';
import { ChatUploadDto } from './dto/chat-upload.dto';
import { WebhookKeyGuard } from './guards/webhook-key.guard';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { multerOptions } from '../informes/multer-config';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  // ── 1. Revisión de informe por el bot Stimi (n8n → NestJS) ──────────────────
  @Post('bot-henry')
  @UseGuards(WebhookKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-webhook-key')
  @ApiOperation({
    summary:
      'Recibir la revisión del PDF de informe realizada por el bot Stimi (n8n)',
  })
  @ApiResponse({ status: 200, description: 'Informe actualizado con éxito.' })
  @ApiResponse({ status: 401, description: 'Clave de webhook inválida o ausente.' })
  async handleBotReview(@Body() dto: BotHenryWebhookDto) {
    return this.webhooksService.processBotReview(dto);
  }

  // ── 2. Chat del Asistente IA (Frontend React → NestJS → OpenAI) ─────────────
  @Post('chat')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar un mensaje al Asistente IA de STIMI (requiere JWT)',
  })
  @ApiResponse({ status: 200, description: 'Respuesta del asistente generada con éxito.' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o ausente.' })
  @ApiResponse({ status: 500, description: 'Error de conexión con el servicio de IA.' })
  async chat(@Body() dto: AsistenteChatDto, @Request() req: any) {
    return this.webhooksService.procesarChatAsistente(dto, req.user);
  }

  // ── 2.5. Cargar un PDF en el chat e iniciar validación con n8n ──────────────
  @Post('chat/upload')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir un informe PDF en el chat e iniciar validación vía n8n (requiere JWT)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF del informe',
        },
        tipo_informe: {
          type: 'string',
          enum: ['GC', 'GF'],
          description: 'Tipo de informe (GC o GF)',
        },
        periodo: {
          type: 'string',
          description: 'Periodo al que corresponde (e.g. "Julio 2026")',
        },
      },
      required: ['archivo', 'tipo_informe', 'periodo'],
    },
  })
  @ApiResponse({ status: 200, description: 'Informe validado e ingresado con éxito.' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos.' })
  @UseInterceptors(FileInterceptor('archivo', multerOptions))
  async uploadChatFile(
    @UploadedFile() file: any,
    @Body() dto: ChatUploadDto,
    @Request() req: any,
  ) {
    return this.webhooksService.procesarSubidaChat(file, dto, req.user);
  }


  // ── 3. Guardar historial de WhatsApp (n8n → NestJS) ─────────────────────────
  @Post('historial-chat')
  @UseGuards(WebhookKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('x-webhook-key')
  @ApiOperation({
    summary: 'Guardar un mensaje del historial de WhatsApp (llamado desde n8n)',
  })
  @ApiResponse({ status: 200, description: 'Mensaje guardado con éxito.' })
  @ApiResponse({ status: 401, description: 'Clave de webhook inválida o ausente.' })
  async guardarHistorial(@Body() dto: GuardarHistorialDto) {
    return this.webhooksService.guardarHistorialWhatsapp(dto);
  }

  // ── 4. Consultar historial de WhatsApp de un instructor (uso interno) ────────
  @Get('historial/:cedula')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener el historial de conversación WhatsApp de un instructor por cédula',
  })
  @ApiResponse({ status: 200, description: 'Historial obtenido correctamente.' })
  async getHistorial(@Param('cedula') cedula: string) {
    return this.webhooksService.getHistorialPorCedula(cedula);
  }
}
