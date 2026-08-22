import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodoCarga } from './entities/periodo-carga.entity';
import { CreatePeriodoCargaDto } from './dto/create-periodo-carga.dto';
import { UpdatePeriodoCargaDto } from './dto/update-periodo-carga.dto';

@Injectable()
export class PeriodosCargaService {
  constructor(
    @InjectRepository(PeriodoCarga)
    private readonly periodoCargaRepository: Repository<PeriodoCarga>,
  ) {}

  create(createPeriodoCargaDto: CreatePeriodoCargaDto) {
    const periodo = this.periodoCargaRepository.create({
      anio: createPeriodoCargaDto.anio,
      mes: createPeriodoCargaDto.mes,
      fecha_limite: new Date(createPeriodoCargaDto.fecha_limite),
      habilitado: createPeriodoCargaDto.habilitado ?? true,
    });
    return this.periodoCargaRepository.save(periodo);
  }

  findAll() {
    return this.periodoCargaRepository.find();
  }

  async findOne(id: number) {
    const periodo = await this.periodoCargaRepository.findOne({ where: { id_periodo: id } });
    if (!periodo) {
      throw new NotFoundException(`Periodo #${id} no encontrado`);
    }
    return periodo;
  }

  async update(id: number, updatePeriodoCargaDto: UpdatePeriodoCargaDto) {
    const periodo = await this.findOne(id);
    if (updatePeriodoCargaDto.anio !== undefined) {
      periodo.anio = updatePeriodoCargaDto.anio;
    }
    if (updatePeriodoCargaDto.mes !== undefined) {
      periodo.mes = updatePeriodoCargaDto.mes;
    }
    if (updatePeriodoCargaDto.fecha_limite !== undefined) {
      periodo.fecha_limite = new Date(updatePeriodoCargaDto.fecha_limite);
    }
    if (updatePeriodoCargaDto.habilitado !== undefined) {
      periodo.habilitado = updatePeriodoCargaDto.habilitado;
    }
    return this.periodoCargaRepository.save(periodo);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.periodoCargaRepository.softDelete(id);
  }
}
