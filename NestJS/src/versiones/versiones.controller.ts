import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
} from '@nestjs/common';
import * as express from 'express';
import { VersionesService } from './versiones.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('versiones')
@ApiBearerAuth()
@Controller('versiones')
@UseGuards(JwtGuard)
export class VersionesController {
  constructor(private readonly versionesService: VersionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una versión de informe manualmente' })
  @ApiResponse({ status: 201, description: 'Versión creada exitosamente.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido para este informe.' })
  create(@Body() createVersionDto: CreateVersionDto, @CurrentUser() user: any) {
    return this.versionesService.create(createVersionDto, user.sub, user.rol);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener la lista de versiones del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de versiones.' })
  findAll(@CurrentUser() user: any) {
    if (user.rol === 'coordinador') {
      return this.versionesService.findAll();
    }
    return this.versionesService.findByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una versión' })
  @ApiResponse({ status: 200, description: 'Datos de la versión.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  @ApiResponse({ status: 404, description: 'Versión no encontrada.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.versionesService.checkOwnership(+id, user.sub, user.rol);
    return this.versionesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar detalles de una versión' })
  @ApiResponse({ status: 200, description: 'Versión actualizada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  update(
    @Param('id') id: string,
    @Body() updateVersionDto: UpdateVersionDto,
    @CurrentUser() user: any,
  ) {
    return this.versionesService.update(+id, updateVersionDto, user.sub, user.rol);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una versión' })
  @ApiResponse({ status: 200, description: 'Versión eliminada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.versionesService.remove(+id, user.sub, user.rol);
  }

  @Get(':id/view')
  @ApiOperation({ summary: 'Ver el PDF de una versión específica de un informe' })
  @ApiResponse({ status: 200, description: 'Archivo PDF de la versión.' })
  @ApiResponse({ status: 404, description: 'Versión o archivo no encontrado.' })
  async viewVersion(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: express.Response,
  ) {
    await this.versionesService.checkOwnership(+id, user.sub, user.rol);
    const fileData = await this.versionesService.getVersionFile(+id);
    res.setHeader('Content-Disposition', `inline; filename="${fileData.name}"`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.sendFile(fileData.path, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: 'Error al enviar el archivo', error: err.message });
      }
    });
  }
}