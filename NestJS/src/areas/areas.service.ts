import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './entities/area.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
  ) {}

  create(createAreaDto: CreateAreaDto) {
    const regional = createAreaDto.id_regional || 1;
    const tipo = createAreaDto.tipo || (regional === 2 ? 'CAMPESENA' : 'REGULAR');
    const area = this.areaRepository.create({
      nombre_area: createAreaDto.nombre_area,
      id_regional: regional,
      tipo: tipo,
    });
    return this.areaRepository.save(area);
  }

  findAll() {
    return this.areaRepository.find({
      order: {
        id_regional: 'ASC',
        nombre_area: 'ASC',
      },
    });
  }

  findOne(id: number) {
    return this.areaRepository.findOne({ where: { id_area: id } });
  }

  update(id: number, updateAreaDto: UpdateAreaDto) {
    const updateData: Partial<Area> = {};
    if (updateAreaDto.nombre_area !== undefined) updateData.nombre_area = updateAreaDto.nombre_area;
    if (updateAreaDto.id_regional !== undefined) updateData.id_regional = updateAreaDto.id_regional;
    if (updateAreaDto.tipo !== undefined) updateData.tipo = updateAreaDto.tipo;
    return this.areaRepository.update(id, updateData);
  }

  remove(id: number) {
    return this.areaRepository.softDelete(id);
  }
}