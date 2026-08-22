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
import { Persona } from '../../personas/entities/persona.entity';
import { Obligacione } from '../../obligaciones/entities/obligacione.entity';

@Entity('contratos')
export class Contrato {
  @PrimaryGeneratedColumn({ name: 'id_contrato' })
  id_contrato!: number;

  @ManyToOne(() => Persona, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Persona;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fecha_fin!: Date;

  @Column({ name: 'estado', type: 'varchar', length: 30, default: 'activo' })
  estado!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;

  @OneToMany(() => Obligacione, (obligacion) => obligacion.contrato)
  obligaciones!: Obligacione[];
}
