import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Rol } from './rol/entities/rol.entity';
import { Area } from './areas/entities/area.entity';
import { Persona } from './personas/entities/persona.entity';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    // Create folders
    const uploadDir = path.join(process.cwd(), 'uploads', 'informes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    try {
      const rolRepo = this.dataSource.getRepository(Rol);
      const areaRepo = this.dataSource.getRepository(Area);
      const personaRepo = this.dataSource.getRepository(Persona);

      let instructorRol = await rolRepo.findOneBy({ nombre_rol: 'instructor' });
      if (!instructorRol) {
        instructorRol = rolRepo.create({ nombre_rol: 'instructor' });
        await rolRepo.save(instructorRol);
      }

      let coordinadorRol = await rolRepo.findOneBy({ nombre_rol: 'coordinador' });
      if (!coordinadorRol) {
        coordinadorRol = rolRepo.create({ nombre_rol: 'coordinador' });
        await rolRepo.save(coordinadorRol);
      }

      let tiArea = await areaRepo.findOneBy({ nombre_area: 'TIC' });
      if (!tiArea) {
        tiArea = areaRepo.create({ nombre_area: 'TIC', id_regional: 1, tipo: 'REGULAR' });
        await areaRepo.save(tiArea);
      }

      // Check if default instructor exists
      const instructorUser = await personaRepo.findOne({
        where: [
          { numero_documento: '123456' },
          { correo: 'juan.perez@sena.edu.co' }
        ],
      });
      if (!instructorUser) {
        const contrasenaHash = await bcrypt.hash('instructor123', 10);
        const newInstructor = personaRepo.create({
          nombre_completo: 'Juan Pérez',
          tipo_documento: 'CC',
          numero_documento: '123456',
          correo: 'juan.perez@sena.edu.co',
          contrasena_hash: contrasenaHash,
          rol: instructorRol,
          area: tiArea,
          estado_cuenta: 'aprobado',
        });
        await personaRepo.save(newInstructor);
        console.log('Seeded instructor user (Juan Pérez)');
      }

      // Check if default coordinator exists
      const coordinatorUser = await personaRepo.findOne({
        where: [
          { numero_documento: '654321' },
          { correo: 'maria.garcia@sena.edu.co' }
        ],
      });
      if (!coordinatorUser) {
        const contrasenaHash = await bcrypt.hash('coordinador123', 10);
        const newCoordinator = personaRepo.create({
          nombre_completo: 'María García',
          tipo_documento: 'CC',
          numero_documento: '654321',
          correo: 'maria.garcia@sena.edu.co',
          contrasena_hash: contrasenaHash,
          rol: coordinadorRol,
          area: tiArea,
          estado_cuenta: 'aprobado',
        });
        await personaRepo.save(newCoordinator);
        console.log('Seeded coordinator user (María García)');
      }
    } catch (error) {
      console.error('Error during database seeding:', error);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
