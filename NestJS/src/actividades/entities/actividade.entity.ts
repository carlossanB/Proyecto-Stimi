import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Evidencia } from '../../evidencias/entities/evidencia.entity';
import { InformeGc } from '../../informe-gc/entities/informe-gc.entity';

@Entity('actividades')
export class Actividad {
  @PrimaryGeneratedColumn({ name: 'id_actividad' })
  id_actividad!: number;

  @ManyToOne(() => InformeGc, (informeGc) => informeGc.actividades, { nullable: false })
  @JoinColumn({ name: 'id_informe_gc' })
  informeGc!: InformeGc;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fecha_fin!: Date;

  @Column({ name: 'competencia', type: 'varchar', length: 100 })
  competencia!: string;

  @Column({ name: 'resultado', type: 'text' })
  resultado!: string;

  @Column({ name: 'estado', type: 'varchar', length: 3, default: 'ACT' })
  estado!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;

  @OneToMany(() => Evidencia, (evidencia) => evidencia.actividad)
  evidencias!: Evidencia[];
}