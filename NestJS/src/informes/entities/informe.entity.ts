import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Persona } from '../../personas/entities/persona.entity';
import { InformeGc } from '../../informe-gc/entities/informe-gc.entity';
import { InformeGf } from '../../informe-gf/entities/informe-gf.entity';
import { PeriodoCarga } from '../../periodos-carga/entities/periodo-carga.entity';
import { Version } from '../../versiones/entities/version.entity';

@Entity('informes')
export class Informe {
  @PrimaryGeneratedColumn({ name: 'id_informe' })
  id_informe!: number;

  @ManyToOne(() => Persona, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Persona;

  @ManyToOne(() => PeriodoCarga, { nullable: false })
  @JoinColumn({ name: 'id_periodo' })
  periodo!: PeriodoCarga;

  @Column({ name: 'tipo_informe', type: 'varchar', length: 2 })
  tipo_informe!: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'borrador' })
  estado!: string;

  @Column({ name: 'firmado', type: 'boolean', default: false })
  firmado!: boolean;

  @Column({ name: 'pendiente_sincronizacion', type: 'boolean', default: false })
  pendiente_sincronizacion!: boolean;

  @Column({ name: 'fecha_envio', type: 'timestamp', nullable: true })
  fecha_envio?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;

  @OneToOne(() => InformeGc, (informeGc) => informeGc.informe, { cascade: true })
  informeGc?: InformeGc;

  @OneToOne(() => InformeGf, (informeGf) => informeGf.informe, { cascade: true })
  informeGf?: InformeGf;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion?: string;

  @OneToMany(() => Version, (version) => version.informe, { cascade: true })
  versiones!: Version[];
}
