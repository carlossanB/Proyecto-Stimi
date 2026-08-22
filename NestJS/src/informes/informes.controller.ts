import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Query,
} from '@nestjs/common';
import * as express from 'express';
import { InformesService } from './informes.service';
import { CreateInformeDto } from './dto/create-informe.dto';
import { UpdateInformeDto } from './dto/update-informe.dto';
import { InformeGcValidationService } from './informe-gc-validation.service';
import type { ValidarInformeGcDto } from './dto/informe-gc-validation-result.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from './multer-config';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('informes')
@ApiBearerAuth()
@Controller('informes')
@UseGuards(JwtGuard)
export class InformesController {
  constructor(
    private readonly informesService: InformesService,
    private readonly informeGcValidationService: InformeGcValidationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener informes (Instructores ven sus propios informes, Coordinadores ven los de su área)' })
  @ApiResponse({ status: 200, description: 'Lista de informes devuelta.' })
  async getInformes(@CurrentUser() user: any) {
    if (user.rol === 'coordinador') {
      const fullUser = await this.informesService.getUserWithArea(user.sub);
      return this.informesService.findCoordinatorReports(fullUser.area?.id_area);
    }
    return this.informesService.findInstructorReports(user.sub);
  }

  @Get('historial')
  @ApiOperation({ summary: 'Obtener historial de informes (Excluyendo el periodo de carga actual)' })
  @ApiResponse({ status: 200, description: 'Lista de historial de informes.' })
  async getHistorial(@CurrentUser() user: any) {
    const isCoordinator = user.rol === 'coordinador';
    let areaId = undefined;
    if (isCoordinator) {
      const fullUser = await this.informesService.getUserWithArea(user.sub);
      areaId = fullUser.area?.id_area;
    }
    return this.informesService.findHistorial(user.sub, isCoordinator, areaId);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener métricas y estadísticas de los informes' })
  @ApiQuery({ name: 'instructorId', required: false })
  @ApiQuery({ name: 'mes', required: false, description: 'Ejemplo: Julio 2026' })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiResponse({ status: 200, description: 'Estadísticas calculadas en base a filtros.' })
  async getEstadisticas(
    @Query() queryParams: any,
    @CurrentUser() user?: any,
  ) {
    const isCoordinator = user.rol === 'coordinador';
    
    // Support both 'instructorId' and 'instructor' from frontend
    const paramInstructor = queryParams.instructorId || queryParams.instructor;
    const paramArea = queryParams.areaId || queryParams.area;
    const paramMes = queryParams.mes || queryParams.fecha;

    let filterAreaId = paramArea ? parseInt(paramArea, 10) : undefined;
    let filterInstructorId = paramInstructor ? parseInt(paramInstructor, 10) : undefined;
    
    if (isCoordinator && !filterAreaId) {
      const fullUser = await this.informesService.getUserWithArea(user.sub);
      filterAreaId = fullUser.area?.id_area;
    }

    if (!isCoordinator) {
      filterInstructorId = user.sub;
    }

    return this.informesService.getEstadisticas({
      instructorId: filterInstructorId,
      mes: paramMes,
      areaId: filterAreaId,
    });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('archivo', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir un nuevo informe de tipo GC o GF' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF del informe',
        },
        periodo: {
          type: 'string',
          description: 'Periodo al que corresponde (e.g. "Julio 2026")',
        },
        tipo: {
          type: 'string',
          enum: ['GC', 'GF'],
          description: 'Tipo de informe (GC o GF)',
        },
      },
      required: ['archivo', 'periodo', 'tipo'],
    },
  })
  @ApiResponse({ status: 201, description: 'Informe cargado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Archivo requerido o formato inválido.' })
  async uploadInforme(
    @UploadedFile() file: any,
    @Body('periodo') periodo: string,
    @Body('tipo') tipo: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo PDF requerido');
    }
    if (!periodo || !tipo) {
      throw new BadRequestException('Los campos "periodo" y "tipo" (GC o GF) son obligatorios');
    }
    return this.informesService.uploadReport(user.sub, file, periodo, tipo);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar el archivo PDF de la última versión de un informe' })
  @ApiResponse({ status: 200, description: 'Envío del archivo PDF.' })
  @ApiResponse({ status: 404, description: 'Informe o archivo físico no encontrado.' })
  async downloadReport(
    @Param('id') id: number,
    @Res() res: express.Response,
  ) {
    const fileData = await this.informesService.getReportFile(id);
    return res.download(fileData.path, fileData.name);
  }

  @Get(':id/view')
  @ApiOperation({ summary: 'Ver el archivo PDF de la última versión de un informe' })
  @ApiResponse({ status: 200, description: 'Envío del archivo PDF para visualización.' })
  @ApiResponse({ status: 404, description: 'Informe o archivo físico no encontrado.' })
  async viewReport(
    @Param('id') id: number,
    @Res() res: express.Response,
  ) {
    const fileData = await this.informesService.getReportFile(id);
    res.setHeader('Content-Disposition', `inline; filename="${fileData.name}"`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.sendFile(fileData.path, (err) => {
      if (err) {
        console.error('[BACKEND] Error al enviar el archivo PDF:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error al enviar el archivo', error: err.message });
        }
      }
    });
  }

  @Get(':periodo/:tipo')
  @ApiOperation({ summary: 'Obtener los detalles de un informe por periodo y tipo' })
  @ApiResponse({ status: 200, description: 'Detalles del informe o estructura vacía si no existe.' })
  async getDetalle(
    @Param('periodo') periodo: string,
    @Param('tipo') tipo: string,
    @CurrentUser() user: any,
  ) {
    console.log(`\n>>> [DEBUG-BACKEND] EJECUTANDO getDetalle | Periodo recibido: ${periodo}, Tipo recibido: ${tipo}`);
    const isCoordinator = user.rol === 'coordinador';
    return this.informesService.getDetalleReporte(user.sub, periodo, tipo, isCoordinator);
  }

  @Post(':periodo/:tipo/version')
  @UseInterceptors(FileInterceptor('archivo', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir una nueva versión de un informe existente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Nuevo archivo PDF del informe',
        },
      },
      required: ['archivo'],
    },
  })
  @ApiResponse({ status: 201, description: 'Nueva versión cargada exitosamente.' })
  async uploadNuevaVersion(
    @Param('periodo') periodo: string,
    @Param('tipo') tipo: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo PDF requerido');
    }
    return this.informesService.uploadNuevaVersion(user.sub, file, periodo, tipo);
  }

  @Patch(':periodo/:tipo/estado')
  @Roles('coordinador', 'instructor')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cambiar el estado de un informe (Solo Coordinadores e Instructores)' })
  @ApiResponse({ status: 200, description: 'Estado del informe actualizado.' })
  async cambiarEstado(
    @Param('periodo') periodo: string,
    @Param('tipo') tipo: string,
    @Body() body: any,
  ) {
    const estado = body.estado;
    const observacion = body.observacion;
    const idUsuario = body.id_usuario || body.usuarioId || body.instructorId || body.userId;

    if (!estado) {
      throw new BadRequestException('El campo "estado" es obligatorio');
    }
    return this.informesService.cambiarEstadoReporte(periodo, tipo, estado, observacion, idUsuario);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un registro de informe básico' })
  create(@Body() createInformeDto: CreateInformeDto) {
    return this.informesService.create(createInformeDto);
  }

  @Get(':id/buscar')
  @ApiOperation({ summary: 'Buscar un informe básico por ID' })
  findOne(@Param('id') id: string) {
    return this.informesService.findOne(+id);
  }

  @Get(':id/pdf-gc')
  @ApiOperation({ summary: 'Obtener toda la información estructurada de un informe GC para renderizar PDF/Vista de impresión' })
  @ApiResponse({ status: 200, description: 'Objeto de respuesta estructurada.' })
  getPdfGc(@Param('id') id: string) {
    return this.informesService.getDatosPdfGc(+id);
  }

  @Post(':id/validar')
  @ApiOperation({ summary: 'Validar la consistencia y estructura de un informe GC con un motor inteligente' })
  @ApiResponse({ status: 200, description: 'Resultados de validación de 3 niveles.' })
  validar(@Param('id') id: string, @Body() payload: ValidarInformeGcDto) {
    return this.informeGcValidationService.validar(+id, payload);
  }

  @Patch(':id/actualizar')
  @ApiOperation({ summary: 'Actualizar un registro de informe básico' })
  update(@Param('id') id: string, @Body() updateInformeDto: UpdateInformeDto) {
    return this.informesService.update(+id, updateInformeDto);
  }

  @Delete(':id/version/last')
  @ApiOperation({ summary: 'Eliminar la última versión de un informe' })
  @ApiResponse({ status: 200, description: 'Última versión eliminada.' })
  async deleteLastVersion(@Param('id') id: string) {
    return this.informesService.deleteLastVersion(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un informe por ID' })
  remove(@Param('id') id: string) {
    return this.informesService.remove(+id);
  }
}