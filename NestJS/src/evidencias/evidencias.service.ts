import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evidencia } from './entities/evidencia.entity';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto';
import { Actividad } from '../actividades/entities/actividade.entity';

@Injectable()
export class EvidenciasService {
  constructor(
    @InjectRepository(Evidencia)
    private readonly evidenciaRepository: Repository<Evidencia>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
  ) {}

  async create(createEvidenciaDto: CreateEvidenciaDto, userId: number, userRol: string) {
    const actividad = await this.actividadRepository.findOne({
      where: { id_actividad: createEvidenciaDto.fk_actividades },
      relations: { informeGc: { informe: { usuario: true } } },
    });

    if (!actividad) {
      throw new NotFoundException(`Actividad #${createEvidenciaDto.fk_actividades} no encontrada`);
    }

    if (userRol !== 'coordinador' && actividad.informeGc?.informe?.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para agregar evidencias a esta actividad');
    }

    const evidencia = this.evidenciaRepository.create({
      descripcion: createEvidenciaDto.descripcion,
      carpeta_obligacion: createEvidenciaDto.carpeta_obligacion,
      ruta_archivo: createEvidenciaDto.ruta_archivo,
      tipo_archivo: createEvidenciaDto.tipo_archivo,
      tamano_bytes: createEvidenciaDto.tamano_bytes,
      actividad,
    });

    return this.evidenciaRepository.save(evidencia);
  }

  findAll() {
    return this.evidenciaRepository.find({ relations: { actividad: { informeGc: { informe: { usuario: true } } } } });
  }

  findByUserId(userId: number) {
    return this.evidenciaRepository.find({
      where: { actividad: { informeGc: { informe: { usuario: { id_usuario: userId } } } } },
      relations: { actividad: { informeGc: { informe: true } } },
    });
  }

  async findOne(id: number) {
    const evidencia = await this.evidenciaRepository.findOne({
      where: { id_evidencia: id },
      relations: { actividad: { informeGc: { informe: { usuario: true } } } },
    });
    if (!evidencia) throw new NotFoundException(`Evidencia #${id} no encontrada`);
    return evidencia;
  }

  async update(id: number, updateEvidenciaDto: UpdateEvidenciaDto, userId: number, userRol: string) {
    const evidencia = await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);

    if (updateEvidenciaDto.descripcion !== undefined) {
      evidencia.descripcion = updateEvidenciaDto.descripcion;
    }
    if (updateEvidenciaDto.carpeta_obligacion !== undefined) {
      evidencia.carpeta_obligacion = updateEvidenciaDto.carpeta_obligacion;
    }
    if (updateEvidenciaDto.ruta_archivo !== undefined) {
      evidencia.ruta_archivo = updateEvidenciaDto.ruta_archivo;
    }
    if (updateEvidenciaDto.tipo_archivo !== undefined) {
      evidencia.tipo_archivo = updateEvidenciaDto.tipo_archivo;
    }
    if (updateEvidenciaDto.tamano_bytes !== undefined) {
      evidencia.tamano_bytes = updateEvidenciaDto.tamano_bytes;
    }
    if (updateEvidenciaDto.fk_actividades !== undefined) {
      const actividad = await this.actividadRepository.findOne({
        where: { id_actividad: updateEvidenciaDto.fk_actividades },
        relations: { informeGc: { informe: { usuario: true } } },
      });
      if (!actividad) {
        throw new NotFoundException(`Actividad #${updateEvidenciaDto.fk_actividades} no encontrada`);
      }
      if (userRol !== 'coordinador' && actividad.informeGc?.informe?.usuario?.id_usuario !== userId) {
        throw new ForbiddenException('No tiene permisos para mover la evidencia a esta actividad');
      }
      evidencia.actividad = actividad;
    }

    return this.evidenciaRepository.save(evidencia);
  }

  async remove(id: number, userId: number, userRol: string) {
    await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);
    return this.evidenciaRepository.softDelete(id);
  }

  async checkOwnership(idEvidencia: number, userId: number, userRol: string) {
    if (userRol === 'coordinador') return;
    const evidencia = await this.findOne(idEvidencia);
    if (evidencia.actividad?.informeGc?.informe?.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para acceder a esta evidencia');
    }
  }
}