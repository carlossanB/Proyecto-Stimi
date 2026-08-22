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
import { PeriodosCargaService } from './periodos-carga.service';
import { CreatePeriodoCargaDto } from './dto/create-periodo-carga.dto';
import { UpdatePeriodoCargaDto } from './dto/update-periodo-carga.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('periodos-carga')
@ApiBearerAuth()
@Controller('periodos-carga')
@UseGuards(JwtGuard)
export class PeriodosCargaController {
  constructor(private readonly periodosCargaService: PeriodosCargaService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Crear un nuevo periodo de carga de informes (Solo Coordinadores)' })
  @ApiResponse({ status: 201, description: 'Periodo de carga creado exitosamente.' })
  create(@Body() createPeriodoCargaDto: CreatePeriodoCargaDto) {
    return this.periodosCargaService.create(createPeriodoCargaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener la lista de todos los periodos de carga' })
  @ApiResponse({ status: 200, description: 'Lista de periodos.' })
  findAll() {
    return this.periodosCargaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un periodo de carga específico' })
  @ApiResponse({ status: 200, description: 'Datos del periodo.' })
  @ApiResponse({ status: 404, description: 'Periodo no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.periodosCargaService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Actualizar un periodo de carga (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Periodo actualizado.' })
  update(
    @Param('id') id: string,
    @Body() updatePeriodoCargaDto: UpdatePeriodoCargaDto,
  ) {
    return this.periodosCargaService.update(+id, updatePeriodoCargaDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Eliminar un periodo de carga (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Periodo eliminado.' })
  remove(@Param('id') id: string) {
    return this.periodosCargaService.remove(+id);
  }
}
