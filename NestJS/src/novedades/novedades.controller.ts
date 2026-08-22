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
import { NovedadesService } from './novedades.service';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { UpdateNovedadDto } from './dto/update-novedad.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('novedades')
@ApiBearerAuth()
@Controller('novedades')
@UseGuards(JwtGuard)
export class NovedadesController {
  constructor(private readonly novedadesService: NovedadesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Crear una novedad en un reporte (Solo Coordinadores)' })
  @ApiResponse({ status: 201, description: 'Novedad registrada exitosamente.' })
  create(@Body() createNovedadDto: CreateNovedadDto) {
    return this.novedadesService.create(createNovedadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las novedades registradas' })
  @ApiResponse({ status: 200, description: 'Lista de novedades.' })
  findAll() {
    return this.novedadesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una novedad específica' })
  @ApiResponse({ status: 200, description: 'Datos de la novedad.' })
  @ApiResponse({ status: 404, description: 'Novedad no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.novedadesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Actualizar una novedad (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Novedad actualizada.' })
  update(@Param('id') id: string, @Body() updateNovedadDto: UpdateNovedadDto) {
    return this.novedadesService.update(+id, updateNovedadDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Eliminar una novedad (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Novedad eliminada.' })
  remove(@Param('id') id: string) {
    return this.novedadesService.remove(+id);
  }
}