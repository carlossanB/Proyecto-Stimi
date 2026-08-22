import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obligacione } from './entities/obligacione.entity';
import { CreateObligacioneDto } from './dto/create-obligacione.dto';
import { UpdateObligacioneDto } from './dto/update-obligacione.dto';
import { Contrato } from '../contratos/entities/contrato.entity';

@Injectable()
export class ObligacionesService {
  constructor(
    @InjectRepository(Obligacione)
    private obligacionesRepository: Repository<Obligacione>,
    @InjectRepository(Contrato)
    private contratosRepository: Repository<Contrato>,
  ) {}

  async create(createObligacioneDto: CreateObligacioneDto, userId: number, userRol: string) {
    // Verify contract exists and user owns it (if instructor)
    const contrato = await this.contratosRepository.findOne({
      where: { id_contrato: createObligacioneDto.id_contrato },
      relations: { usuario: true },
    });
    if (!contrato) {
      throw new NotFoundException(`Contrato #${createObligacioneDto.id_contrato} no encontrado`);
    }
    if (userRol !== 'coordinador' && contrato.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para agregar obligaciones a este contrato');
    }

    const obligacion = this.obligacionesRepository.create({
      descripcion: createObligacioneDto.descripcion,
      contrato,
    });
    return this.obligacionesRepository.save(obligacion);
  }

  findAll() {
    return this.obligacionesRepository.find({ relations: { contrato: { usuario: true } } });
  }

  findByUserId(userId: number) {
    return this.obligacionesRepository.find({
      where: { contrato: { usuario: { id_usuario: userId } } },
      relations: { contrato: true },
    });
  }

  async findOne(id: number) {
    const obligacion = await this.obligacionesRepository.findOne({
      where: { id_obligacion: id },
      relations: { contrato: { usuario: true } },
    });
    if (!obligacion) {
      throw new NotFoundException(`Obligación #${id} no encontrada`);
    }
    return obligacion;
  }

  async update(id: number, updateObligacioneDto: UpdateObligacioneDto, userId: number, userRol: string) {
    const obligacion = await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);

    if (updateObligacioneDto.descripcion !== undefined) {
      obligacion.descripcion = updateObligacioneDto.descripcion;
    }
    if (updateObligacioneDto.id_contrato !== undefined) {
      const contrato = await this.contratosRepository.findOne({
        where: { id_contrato: updateObligacioneDto.id_contrato },
        relations: { usuario: true },
      });
      if (!contrato) {
        throw new NotFoundException(`Contrato #${updateObligacioneDto.id_contrato} no encontrado`);
      }
      if (userRol !== 'coordinador' && contrato.usuario?.id_usuario !== userId) {
        throw new ForbiddenException('No tiene permisos para mover la obligación a este contrato');
      }
      obligacion.contrato = contrato;
    }

    return this.obligacionesRepository.save(obligacion);
  }

  async remove(id: number, userId: number, userRol: string) {
    await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);
    return this.obligacionesRepository.softDelete(id);
  }

  async checkOwnership(idObligacion: number, userId: number, userRol: string) {
    if (userRol === 'coordinador') return;
    const obligacion = await this.findOne(idObligacion);
    if (obligacion.contrato?.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para acceder a esta obligación');
    }
  }
}
