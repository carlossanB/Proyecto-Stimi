import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Persona } from '../../personas/entities/persona.entity';

export type NotificacionTipo = 'success' | 'warning' | 'info' | 'error';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  id_notificacion!: number;

  @ManyToOne(() => Persona, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario!: Persona;

  @Column({ name: 'tipo', type: 'varchar', length: 20, default: 'info' })
  tipo!: NotificacionTipo;

  @Column({ name: 'mensaje', type: 'text' })
  mensaje!: string;

  @Column({ name: 'leida', type: 'boolean', default: false })
  leida!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
