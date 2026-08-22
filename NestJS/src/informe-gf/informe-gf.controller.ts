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
import { InformeGfService } from './informe-gf.service';
import { CreateInformeGfDto } from './dto/create-informe-gf.dto';
import { UpdateInformeGfDto } from './dto/update-informe-gf.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('informe-gf')
@UseGuards(JwtGuard)
export class InformeGfController {
  constructor(private readonly informeGfService: InformeGfService) {}

  @Post()
  create(@Body() createInformeGfDto: CreateInformeGfDto) {
    return this.informeGfService.create(createInformeGfDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    if (user.rol === 'coordinador') {
      return this.informeGfService.findAll();
    }
    return this.informeGfService.findByUserId(user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    await this.informeGfService.checkOwnership(+id, user.sub, user.rol);
    return this.informeGfService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInformeGfDto: UpdateInformeGfDto,
    @CurrentUser() user: any,
  ) {
    return this.informeGfService.update(+id, updateInformeGfDto, user.sub, user.rol);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.informeGfService.remove(+id, user.sub, user.rol);
  }
}