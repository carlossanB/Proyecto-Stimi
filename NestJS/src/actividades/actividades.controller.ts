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
import { ActividadesService } from './actividades.service';
import { CreateActividadDto } from './dto/create-actividade.dto';
import { UpdateActividadDto } from './dto/update-actividade.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('actividades')
@ApiBearerAuth()
@Controller('actividades')
@UseGuards(JwtGuard)
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una actividad mensual asociada a un informe GC' })
  @ApiResponse({ status: 201, description: 'Actividad creada exitosamente.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido para este informe.' })
  create(
    @Body() createActividadDto: CreateActividadDto,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.create(createActividadDto, user.sub, user.rol);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener actividades del usuario actual' })
  @ApiResponse({ status: 200, description: 'Lista de actividades.' })
  findAll(@CurrentUser() user: any) {
    if (user.rol === 'coordinador') {
      return this.actividadesService.findAll();
    }
    return this.actividadesService.findByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una actividad específica' })
  @ApiResponse({ status: 200, description: 'Datos de la actividad.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.actividadesService.checkOwnership(+id, user.sub, user.rol);
    return this.actividadesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una actividad' })
  @ApiResponse({ status: 200, description: 'Actividad actualizada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  update(
    @Param('id') id: string,
    @Body() updateActividadDto: UpdateActividadDto,
    @CurrentUser() user: any,
  ) {
    return this.actividadesService.update(+id, updateActividadDto, user.sub, user.rol);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una actividad' })
  @ApiResponse({ status: 200, description: 'Actividad eliminada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.actividadesService.remove(+id, user.sub, user.rol);
  }
}