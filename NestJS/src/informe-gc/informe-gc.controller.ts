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
import { InformeGcService } from './informe-gc.service';
import { CreateInformeGcDto } from './dto/create-informe-gc.dto';
import { UpdateInformeGcDto } from './dto/update-informe-gc.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('informe-gc')
@UseGuards(JwtGuard)
export class InformeGcController {
  constructor(private readonly informeGcService: InformeGcService) {}

  @Post()
  create(@Body() createInformeGcDto: CreateInformeGcDto) {
    return this.informeGcService.create(createInformeGcDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    if (user.rol === 'coordinador') {
      return this.informeGcService.findAll();
    }
    return this.informeGcService.findByUserId(user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.informeGcService.checkOwnership(+id, user.sub, user.rol);
    return this.informeGcService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInformeGcDto: UpdateInformeGcDto,
    @CurrentUser() user: any,
  ) {
    return this.informeGcService.update(+id, updateInformeGcDto, user.sub, user.rol);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.informeGcService.remove(+id, user.sub, user.rol);
  }
}