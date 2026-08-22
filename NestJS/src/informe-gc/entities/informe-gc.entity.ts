import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Actividad } from '../../actividades/entities/actividade.entity';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { Informe } from '../../informes/entities/informe.entity';

@Entity('informe_gc')
export class InformeGc {
  @PrimaryGeneratedColumn({ name: 'id_informe_gc' })
  id_informe_gc!: number;

  @OneToOne(() => Informe, (informe) => informe.informeGc, { nullable: false })
  @JoinColumn({ name: 'id_informe' })
  informe!: Informe;

  @ManyToOne(() => Contrato, { nullable: false })
  @JoinColumn({ name: 'id_contrato' })
  contrato!: Contrato;

  @Column({ name: 'version_formato', type: 'varchar', length: 20, default: 'GTH-F-062 V10' })
  version_formato!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;

  @OneToMany(() => Actividad, (actividad) => actividad.informeGc)
  actividades!: Actividad[];
}