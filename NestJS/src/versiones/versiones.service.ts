import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Version } from './entities/version.entity';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { Informe } from '../informes/entities/informe.entity';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class VersionesService {
  constructor(
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
    @InjectRepository(Informe)
    private readonly informeRepository: Repository<Informe>,
  ) {}

  async create(createVersionDto: CreateVersionDto, userId: number, userRol: string) {
    if (!createVersionDto.id_informe) {
      throw new NotFoundException('Debe asociar la versión a un informe');
    }

    const informe = await this.informeRepository.findOne({
      where: { id_informe: createVersionDto.id_informe },
      relations: { usuario: true },
    });

    if (!informe) {
      throw new NotFoundException(`Informe #${createVersionDto.id_informe} no encontrado`);
    }

    if (userRol !== 'coordinador' && informe.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para agregar versiones a este informe');
    }

    const version = this.versionRepository.create({
      numero_version: createVersionDto.numero_version,
      fecha_version: createVersionDto.fecha_version ? new Date(createVersionDto.fecha_version) : new Date(),
      descripcion: createVersionDto.descripcion,
      estado: createVersionDto.estado || 'pendiente',
      archivo_ruta: createVersionDto.archivo_ruta || '',
      archivo_nombre_original: createVersionDto.archivo_nombre_original || '',
      archivo_tamano_bytes: createVersionDto.archivo_tamano_bytes,
      informe,
    });

    return this.versionRepository.save(version);
  }

  findAll() {
    return this.versionRepository.find({ relations: { informe: { usuario: true } } });
  }

  findByUserId(userId: number) {
    return this.versionRepository.find({
      where: { informe: { usuario: { id_usuario: userId } } },
      relations: { informe: true },
    });
  }

  async findOne(id: number) {
    const version = await this.versionRepository.findOne({
      where: { id_version: id },
      relations: { informe: { usuario: true } },
    });
    if (!version) throw new NotFoundException(`Versión #${id} no encontrada`);
    return version;
  }

  async update(id: number, updateVersionDto: UpdateVersionDto, userId: number, userRol: string) {
    const version = await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);

    if (updateVersionDto.numero_version !== undefined) {
      version.numero_version = updateVersionDto.numero_version;
    }
    if (updateVersionDto.fecha_version !== undefined) {
      version.fecha_version = new Date(updateVersionDto.fecha_version);
    }
    if (updateVersionDto.descripcion !== undefined) {
      version.descripcion = updateVersionDto.descripcion;
    }
    if (updateVersionDto.estado !== undefined) {
      version.estado = updateVersionDto.estado;
    }
    if (updateVersionDto.archivo_ruta !== undefined) {
      version.archivo_ruta = updateVersionDto.archivo_ruta;
    }
    if (updateVersionDto.archivo_nombre_original !== undefined) {
      version.archivo_nombre_original = updateVersionDto.archivo_nombre_original;
    }
    if (updateVersionDto.archivo_tamano_bytes !== undefined) {
      version.archivo_tamano_bytes = updateVersionDto.archivo_tamano_bytes;
    }
    if (updateVersionDto.id_informe !== undefined) {
      const informe = await this.informeRepository.findOne({
        where: { id_informe: updateVersionDto.id_informe },
        relations: { usuario: true },
      });
      if (!informe) {
        throw new NotFoundException(`Informe #${updateVersionDto.id_informe} no encontrado`);
      }
      if (userRol !== 'coordinador' && informe.usuario?.id_usuario !== userId) {
        throw new ForbiddenException('No tiene permisos para mover la versión a este informe');
      }
      version.informe = informe;
    }

    return this.versionRepository.save(version);
  }

  async remove(id: number, userId: number, userRol: string) {
    await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);
    return this.versionRepository.delete(id);
  }

  async checkOwnership(idVersion: number, userId: number, userRol: string) {
    if (userRol === 'coordinador') return;
    const version = await this.findOne(idVersion);
    if (version.informe?.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para acceder a esta versión');
    }
  }

  /** Retorna la ruta absoluta y el nombre original de una versión específica para servir el PDF */
  async getVersionFile(id: number): Promise<{ path: string; name: string }> {
    const version = await this.versionRepository.findOne({
      where: { id_version: id },
    });
    if (!version) {
      throw new NotFoundException(`Versión #${id} no encontrada`);
    }
    const filePath = join(process.cwd(), version.archivo_ruta);
    if (!existsSync(filePath)) {
      throw new NotFoundException('El archivo físico de esta versión no existe en el servidor');
    }
    return {
      path: filePath,
      name: version.archivo_nombre_original || `version-${id}.pdf`,
    };
  }
}