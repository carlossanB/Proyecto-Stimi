import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InformeGf } from './entities/informe-gf.entity';
import { CreateInformeGfDto } from './dto/create-informe-gf.dto';
import { UpdateInformeGfDto } from './dto/update-informe-gf.dto';

@Injectable()
export class InformeGfService {
  constructor(
    @InjectRepository(InformeGf)
    private readonly informeGfRepository: Repository<InformeGf>,
  ) {}

  create(createInformeGfDto: CreateInformeGfDto) {
    const informe = this.informeGfRepository.create({
      version_formato: createInformeGfDto.version_formato,
      valor_total: createInformeGfDto.valor_total,
      observaciones: createInformeGfDto.observaciones,
      informe: { id_informe: createInformeGfDto.id_informe } as any,
    });
    return this.informeGfRepository.save(informe);
  }

  findAll() {
    return this.informeGfRepository.find({ relations: { informe: { usuario: true } } });
  }

  findByUserId(userId: number) {
    return this.informeGfRepository.find({
      where: { informe: { usuario: { id_usuario: userId } } },
      relations: { informe: true },
    });
  }

  async findOne(id: number) {
    const informe = await this.informeGfRepository.findOne({
      where: { id_informe_gf: id },
      relations: { informe: { usuario: true } },
    });
    if (!informe) throw new NotFoundException(`InformeGf #${id} no encontrado`);
    return informe;
  }

  async update(id: number, updateInformeGfDto: UpdateInformeGfDto, userId: number, userRol: string) {
    await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);

    await this.informeGfRepository.update(id, {
      version_formato: updateInformeGfDto.version_formato,
      valor_total: updateInformeGfDto.valor_total,
      observaciones: updateInformeGfDto.observaciones,
      informe: updateInformeGfDto.id_informe ? ({ id_informe: updateInformeGfDto.id_informe } as any) : undefined,
    });
    return this.findOne(id);
  }

  async remove(id: number, userId: number, userRol: string) {
    await this.findOne(id);
    await this.checkOwnership(id, userId, userRol);
    return this.informeGfRepository.softDelete(id);
  }

  async checkOwnership(idGf: number, userId: number, userRol: string) {
    if (userRol === 'coordinador') return;
    const gf = await this.findOne(idGf);
    if (gf.informe?.usuario?.id_usuario !== userId) {
      throw new ForbiddenException('No tiene permisos para acceder a este informe GF');
    }
  }
}