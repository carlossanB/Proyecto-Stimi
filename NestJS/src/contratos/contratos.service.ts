import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrato } from './entities/contrato.entity';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';

@Injectable()
export class ContratosService {
  constructor(
    @InjectRepository(Contrato)
    private contratosRepository: Repository<Contrato>,
  ) {}

  create(createContratoDto: CreateContratoDto) {
    const contrato = this.contratosRepository.create({
      fecha_inicio: createContratoDto.fecha_inicio,
      fecha_fin: createContratoDto.fecha_fin,
      estado: createContratoDto.estado || 'activo',
      usuario: { id_usuario: createContratoDto.fk_persona } as any,
    });
    return this.contratosRepository.save(contrato);
  }

  findAll() {
    return this.contratosRepository.find({ relations: { usuario: true, obligaciones: true } });
  }

  findByUserId(userId: number) {
    return this.contratosRepository.find({
      where: { usuario: { id_usuario: userId } },
      relations: { usuario: true, obligaciones: true },
    });
  }

  async findOne(id: number) {
    const contrato = await this.contratosRepository.findOne({
      where: { id_contrato: id },
      relations: { usuario: true, obligaciones: true },
    });
    if (!contrato) {
      throw new NotFoundException(`Contrato #${id} no encontrado`);
    }
    return contrato;
  }

  async update(id: number, updateContratoDto: UpdateContratoDto) {
    const contrato = await this.findOne(id);
    if (updateContratoDto.fecha_inicio !== undefined) {
      contrato.fecha_inicio = updateContratoDto.fecha_inicio;
    }
    if (updateContratoDto.fecha_fin !== undefined) {
      contrato.fecha_fin = updateContratoDto.fecha_fin;
    }
    if (updateContratoDto.estado !== undefined) {
      contrato.estado = updateContratoDto.estado;
    }
    if (updateContratoDto.fk_persona !== undefined) {
      contrato.usuario = { id_usuario: updateContratoDto.fk_persona } as any;
    }
    return this.contratosRepository.save(contrato);
  }

  async remove(id: number) {
    const contrato = await this.findOne(id);
    return this.contratosRepository.softDelete(id);
  }

  async checkOwnership(idContrato: number, userId: number, userRol: string) {
    if (userRol === 'coordinador') return;
    const contrato = await this.findOne(idContrato);
    if (contrato.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para acceder a este contrato');
    }
  }
}
