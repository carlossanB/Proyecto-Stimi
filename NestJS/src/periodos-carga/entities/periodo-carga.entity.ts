import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('periodos_carga')
export class PeriodoCarga {
  @PrimaryGeneratedColumn({ name: 'id_periodo' })
  id_periodo!: number;

  @Column({ name: 'anio', type: 'smallint' })
  anio!: number;

  @Column({ name: 'mes', type: 'smallint' })
  mes!: number;

  @Column({ name: 'fecha_limite', type: 'date' })
  fecha_limite!: Date;

  @Column({ name: 'habilitado', type: 'boolean', default: true })
  habilitado!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;
}
