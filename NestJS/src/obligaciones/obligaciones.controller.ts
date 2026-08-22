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
import { ObligacionesService } from './obligaciones.service';
import { CreateObligacioneDto } from './dto/create-obligacione.dto';
import { UpdateObligacioneDto } from './dto/update-obligacione.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('obligaciones')
@ApiBearerAuth()
@Controller('obligaciones')
@UseGuards(JwtGuard)
export class ObligacionesController {
  constructor(private readonly obligacionesService: ObligacionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una obligación contractual vinculada a un contrato del usuario' })
  @ApiResponse({ status: 201, description: 'Obligación creada exitosamente.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido para este contrato.' })
  create(
    @Body() createObligacioneDto: CreateObligacioneDto,
    @CurrentUser() user: any,
  ) {
    return this.obligacionesService.create(createObligacioneDto, user.sub, user.rol);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener obligaciones del usuario actual' })
  @ApiResponse({ status: 200, description: 'Lista de obligaciones devuelta.' })
  findAll(@CurrentUser() user: any) {
    if (user.rol === 'coordinador') {
      return this.obligacionesService.findAll();
    }
    return this.obligacionesService.findByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una obligación' })
  @ApiResponse({ status: 200, description: 'Datos de la obligación.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.obligacionesService.checkOwnership(+id, user.sub, user.rol);
    return this.obligacionesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una obligación' })
  @ApiResponse({ status: 200, description: 'Obligación actualizada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  update(
    @Param('id') id: string,
    @Body() updateObligacioneDto: UpdateObligacioneDto,
    @CurrentUser() user: any,
  ) {
    return this.obligacionesService.update(+id, updateObligacioneDto, user.sub, user.rol);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una obligación' })
  @ApiResponse({ status: 200, description: 'Obligación eliminada.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.obligacionesService.remove(+id, user.sub, user.rol);
  }
}
