import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Informe } from '../../informes/entities/informe.entity';

@Entity('informe_gf')
export class InformeGf {
  @PrimaryGeneratedColumn({ name: 'id_informe_gf' })
  id_informe_gf!: number;

  @OneToOne(() => Informe, (informe) => informe.informeGf, { nullable: false })
  @JoinColumn({ name: 'id_informe' })
  informe!: Informe;

  @Column({ name: 'version_formato', type: 'varchar', length: 50 })
  version_formato!: string;

  @Column({ name: 'valor_total', type: 'numeric', precision: 14, scale: 2, default: 0 })
  valor_total!: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;
}