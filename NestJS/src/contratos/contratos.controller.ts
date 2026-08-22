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
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contratos')
@ApiBearerAuth()
@Controller('contratos')
@UseGuards(JwtGuard)
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Crear un nuevo contrato (Solo Coordinadores)' })
  @ApiResponse({ status: 201, description: 'Contrato creado exitosamente.' })
  create(@Body() createContratoDto: CreateContratoDto) {
    return this.contratosService.create(createContratoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener contratos del usuario actual (Instructores ven sus contratos, Coordinadores ven todos)' })
  @ApiResponse({ status: 200, description: 'Lista de contratos.' })
  findAll(@CurrentUser() user: any) {
    if (user.rol === 'coordinador') {
      return this.contratosService.findAll();
    }
    return this.contratosService.findByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un contrato específico' })
  @ApiResponse({ status: 200, description: 'Datos del contrato.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido para este contrato.' })
  @ApiResponse({ status: 404, description: 'Contrato no encontrado.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.contratosService.checkOwnership(+id, user.sub, user.rol);
    return this.contratosService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Actualizar un contrato (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Contrato actualizado.' })
  update(@Param('id') id: string, @Body() updateContratoDto: UpdateContratoDto) {
    return this.contratosService.update(+id, updateContratoDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('coordinador')
  @ApiOperation({ summary: 'Eliminar un contrato (Solo Coordinadores)' })
  @ApiResponse({ status: 200, description: 'Contrato eliminado.' })
  remove(@Param('id') id: string) {
    return this.contratosService.remove(+id);
  }
}
