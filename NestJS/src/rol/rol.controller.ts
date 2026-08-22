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
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('rol')
@Controller('rol')
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Crear un nuevo rol (Solo Coordinadores)' })
  @ApiResponse({ status: 201, description: 'Rol creado exitosamente.' })
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolService.create(createRolDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de todos los roles (Disponible sin autenticación para registro)' })
  @ApiResponse({ status: 200, description: 'Lista de roles devuelta.' })
  findAll() {
    return this.rolService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Obtener un rol específico' })
  @ApiResponse({ status: 200, description: 'Datos del rol.' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.rolService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Actualizar un rol (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Rol actualizado.' })
  update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto) {
    return this.rolService.update(+id, updateRolDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Eliminar un rol (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Rol eliminado.' })
  remove(@Param('id') id: string) {
    return this.rolService.remove(+id);
  }
}