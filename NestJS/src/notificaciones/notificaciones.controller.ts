import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('notificaciones')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller(['notificaciones', 'notifications'])
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las notificaciones del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones.' })
  findMine(@CurrentUser() user: any) {
    return this.notificacionesService.findByUsuario(user.sub);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obtener el número de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Contador de no leídas.' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificacionesService.countUnread(user.sub);
    return { count };
  }

  @Patch([':id/leer', ':id/read'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar una notificación específica como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída.' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada.' })
  marcarLeida(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificacionesService.marcarLeida(id, user.sub);
  }

  @Patch(['leer-todas', 'read-all'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas las notificaciones del usuario como leídas' })
  @ApiResponse({ status: 200, description: 'Todas marcadas como leídas.' })
  marcarTodasLeidas(@CurrentUser() user: any) {
    return this.notificacionesService.marcarTodasLeidas(user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una notificación específica del usuario' })
  @ApiResponse({ status: 200, description: 'Notificación eliminada.' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada.' })
  eliminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificacionesService.eliminar(id, user.sub);
  }
}
