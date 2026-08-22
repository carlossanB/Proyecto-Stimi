import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InformeGc } from './entities/informe-gc.entity';
import { CreateInformeGcDto } from './dto/create-informe-gc.dto';
import { UpdateInformeGcDto } from './dto/update-informe-gc.dto';

@Injectable()
export class InformeGcService {
  constructor(
    @InjectRepository(InformeGc)
    private readonly informeGcRepository: Repository<InformeGc>,
  ) {}

  create(createInformeGcDto: CreateInformeGcDto) {
    const informe = this.informeGcRepository.create({
      version_formato: createInformeGcDto.version_formato,
      informe: { id_informe: createInformeGcDto.id_informe } as any,
      contrato: { id_contrato: createInformeGcDto.id_contrato } as any,
    });
    return this.informeGcRepository.save(informe);
  }

  findAll() {
    return this.informeGcRepository.find({ relations: { informe: { usuario: true }, contrato: true } });
  }

  findByUserId(userId: number) {
    return this.informeGcRepository.find({
      where: { informe: { usuario: { id_usuario: userId } } },
      relations: { informe: true, contrato: true },
    });
  }

  async findOne(id: number) {
    const informe = await this.informeGcRepository.findOne({
      where: { id_informe_gc: id },
      relations: { informe: { usuario: true }, contrato: true },
    });
    if (!informe) throw new NotFoundException(`InformeGc #${id} no encontrado`);
    return informe;
  }

  async update(id: number, updateInformeGcDto: UpdateInformeGcDto, userId: number, userRol: string) {
    await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);

    await this.informeGcRepository.update(id, {
      version_formato: updateInformeGcDto.version_formato,
      informe: updateInformeGcDto.id_informe ? ({ id_informe: updateInformeGcDto.id_informe } as any) : undefined,
      contrato: updateInformeGcDto.id_contrato ? ({ id_contrato: updateInformeGcDto.id_contrato } as any) : undefined,
    });
    return this.findOne(id);
  }

  async remove(id: number, userId: number, userRol: string) {
    await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);
    return this.informeGcRepository.softDelete(id);
  }

  async checkOwnership(idGc: number, userId: number, userRol: string) {
    if (userRol === 'coordinador') return;
    const gc = await this.findOne(idGc);
    if (gc.informe?.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para acceder a este informe GC');
    }
  }
}