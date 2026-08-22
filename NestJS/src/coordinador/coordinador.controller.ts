import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CoordinadorService } from './coordinador.service';
import { CoordinadorChatDto } from './dto/coordinador-chat.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('coordinador')
@Controller('coordinador')
export class CoordinadorController {
  constructor(private readonly coordinadorService: CoordinadorService) {}

  // POST /api/coordinador/chat
  @Post('chat')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat del asistente IA del coordinador (vía n8n)' })
  @ApiResponse({ status: 200, description: 'Respuesta del asistente generada.' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o ausente.' })
  @ApiResponse({ status: 500, description: 'Error al conectar con el asistente.' })
  async chat(@Body() dto: CoordinadorChatDto, @Request() req: any) {
    return this.coordinadorService.chatCoordinador(
      dto.mensaje,
      req.user.sub,
      dto.telefono,
    );
  }
}
