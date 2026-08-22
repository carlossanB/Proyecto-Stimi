import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Actividad } from '../../actividades/entities/actividade.entity';

@Entity('evidencias')
export class Evidencia {
  @PrimaryGeneratedColumn({ name: 'id_evidencia' })
  id_evidencia!: number;

  @ManyToOne(() => Actividad, (actividad) => actividad.evidencias, { nullable: false })
  @JoinColumn({ name: 'id_actividad' })
  actividad!: Actividad;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion!: string;

  @Column({ name: 'carpeta_obligacion', type: 'varchar', length: 255 })
  carpeta_obligacion!: string;

  @Column({ name: 'ruta_archivo', type: 'varchar', length: 255 })
  ruta_archivo!: string;

  @Column({ name: 'tipo_archivo', type: 'varchar', length: 10 })
  tipo_archivo!: string;

  @Column({ name: 'tamano_bytes', type: 'int' })
  tamano_bytes!: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;
}