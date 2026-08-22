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
import { Contrato } from '../../contratos/entities/contrato.entity';

@Entity('obligaciones')
export class Obligacione {
  @PrimaryGeneratedColumn({ name: 'id_obligacion' })
  id_obligacion!: number;

  @ManyToOne(() => Contrato, (contrato) => contrato.obligaciones, { nullable: false })
  @JoinColumn({ name: 'id_contrato' })
  contrato!: Contrato;

  @Column({ name: 'descripcion', type: 'varchar', length: 255 })
  descripcion!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;
}
