import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actividad } from './entities/actividade.entity';
import { CreateActividadDto } from './dto/create-actividade.dto';
import { UpdateActividadDto } from './dto/update-actividade.dto';
import { InformeGc } from '../informe-gc/entities/informe-gc.entity';

@Injectable()
export class ActividadesService {
  constructor(
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(InformeGc)
    private readonly informeGcRepository: Repository<InformeGc>,
  ) {}

  async create(createActividadDto: CreateActividadDto, userId: number, userRol: string) {
    if (!createActividadDto.fk_gc) {
      throw new NotFoundException('Debe asociar la actividad a un Informe GC');
    }

    const informeGc = await this.informeGcRepository.findOne({
      where: { id_informe_gc: createActividadDto.fk_gc },
      relations: { informe: { usuario: true } },
    });

    if (!informeGc) {
      throw new NotFoundException(`InformeGc #${createActividadDto.fk_gc} no encontrado`);
    }

    if (userRol !== 'coordinador' && informeGc.informe?.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para agregar actividades a este informe');
    }

    const actividad = this.actividadRepository.create({
      fecha_inicio: new Date(createActividadDto.fecha_inicio),
      fecha_fin: new Date(createActividadDto.fecha_fin),
      competencia: createActividadDto.competencia,
      resultado: createActividadDto.resultado,
      estado: createActividadDto.estado || 'ACT',
      informeGc,
    });

    return this.actividadRepository.save(actividad);
  }

  findAll() {
    return this.actividadRepository.find({ relations: { informeGc: { informe: { usuario: true } } } });
  }

  findByUserId(userId: number) {
    return this.actividadRepository.find({
      where: { informeGc: { informe: { usuario: { id_usuario: userId } } } },
      relations: { informeGc: { informe: true } },
    });
  }

  async findOne(id: number) {
    const actividad = await this.actividadRepository.findOne({
      where: { id_actividad: id },
      relations: { informeGc: { informe: { usuario: true } }, evidencias: true },
    });
    if (!actividad) throw new NotFoundException(`Actividad #${id} no encontrada`);
    return actividad;
  }

  async update(id: number, updateActividadDto: UpdateActividadDto, userId: number, userRol: string) {
    const actividad = await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);

    if (updateActividadDto.fecha_inicio !== undefined) {
      actividad.fecha_inicio = new Date(updateActividadDto.fecha_inicio);
    }
    if (updateActividadDto.fecha_fin !== undefined) {
      actividad.fecha_fin = new Date(updateActividadDto.fecha_fin);
    }
    if (updateActividadDto.competencia !== undefined) {
      actividad.competencia = updateActividadDto.competencia;
    }
    if (updateActividadDto.resultado !== undefined) {
      actividad.resultado = updateActividadDto.resultado;
    }
    if (updateActividadDto.estado !== undefined) {
      actividad.estado = updateActividadDto.estado;
    }
    if (updateActividadDto.fk_gc !== undefined) {
      const informeGc = await this.informeGcRepository.findOne({
        where: { id_informe_gc: updateActividadDto.fk_gc },
        relations: { informe: { usuario: true } },
      });
      if (!informeGc) {
        throw new NotFoundException(`InformeGc #${updateActividadDto.fk_gc} no encontrado`);
      }
      if (userRol !== 'coordinador' && informeGc.informe?.usuario?.id_usuario !== userId) {
        throw new ForbiddenException('No tiene permisos para mover la actividad a este informe');
      }
      actividad.informeGc = informeGc;
    }

    return this.actividadRepository.save(actividad);
  }

  async remove(id: number, userId: number, userRol: string) {
    await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);
    return this.actividadRepository.softDelete(id);
  }

  async checkOwnership(idActividad: number, userId: number, userRol: string) {
    if (userRol === 'coordinador') return;
    const actividad = await this.findOne(idActividad);
    if (actividad.informeGc?.informe?.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para acceder a esta actividad');
    }
  }
}