import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  create(createRolDto: CreateRolDto) {
    const rol = this.rolRepository.create({ nombre_rol: createRolDto.nombre_rol });
    return this.rolRepository.save(rol);
  }

  findAll() {
    return this.rolRepository.find();
  }

  findOne(id: number) {
    return this.rolRepository.findOneBy({ id_rol: id });
  }

  update(id: number, updateRolDto: UpdateRolDto) {
    return this.rolRepository.update(id, { nombre_rol: updateRolDto.nombre_rol });
  }

  remove(id: number) {
    return this.rolRepository.softDelete(id);
  }
}