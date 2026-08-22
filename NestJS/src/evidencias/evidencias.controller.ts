import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EvidenciasService } from './evidencias.service';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('evidencias')
@ApiBearerAuth()
@Controller('evidencias')
@UseGuards(JwtGuard)
export class EvidenciasController {
  constructor(private readonly evidenciasService: EvidenciasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear evidencia asociada a una actividad' })
  @ApiResponse({ status: 201, description: 'Evidencia creada exitosamente.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido para esta actividad.' })
  create(
    @Body() createEvidenciaDto: CreateEvidenciaDto,
    @CurrentUser() user: any,
  ) {
    return this.evidenciasService.create(createEvidenciaDto, user.sub, user.rol);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener evidencias del usuario actual' })
  @ApiResponse({ status: 200, description: 'Lista de evidencias.' })
  findAll(@CurrentUser() user: any) {
    if (user.rol === 'coordinador') {
      return this.evidenciasService.findAll();
    }
    return this.evidenciasService.findByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una evidencia' })
  @ApiResponse({ status: 200, description: 'Datos de la evidencia.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.evidenciasService.checkOwnership(+id, user.sub, user.rol);
    return this.evidenciasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una evidencia' })
  @ApiResponse({ status: 200, description: 'Evidencia actualizada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  update(
    @Param('id') id: string,
    @Body() updateEvidenciaDto: UpdateEvidenciaDto,
    @CurrentUser() user: any,
  ) {
    return this.evidenciasService.update(+id, updateEvidenciaDto, user.sub, user.rol);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una evidencia' })
  @ApiResponse({ status: 200, description: 'Evidencia eliminada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.evidenciasService.remove(+id, user.sub, user.rol);
  }
}