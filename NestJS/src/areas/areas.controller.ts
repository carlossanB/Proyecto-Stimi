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
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('areas')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Crear una nueva área de formación (Solo Coordinadores)' })
  @ApiResponse({ status: 201, description: 'Área creada exitosamente.' })
  create(@Body() createAreaDto: CreateAreaDto) {
    return this.areasService.create(createAreaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener la lista de todas las áreas de formación (Disponible sin autenticación para registro)' })
  @ApiResponse({ status: 200, description: 'Lista de áreas.' })
  findAll() {
    return this.areasService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Obtener detalles de un área específica' })
  @ApiResponse({ status: 200, description: 'Datos del área.' })
  @ApiResponse({ status: 404, description: 'Área no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.areasService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Actualizar un área (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Área actualizada.' })
  update(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto) {
    return this.areasService.update(+id, updateAreaDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Eliminar un área (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Área eliminada.' })
  remove(@Param('id') id: string) {
    return this.areasService.remove(+id);
  }
}