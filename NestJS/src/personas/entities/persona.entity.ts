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
import { Area } from '../../areas/entities/area.entity';
import { Rol } from '../../rol/entities/rol.entity';

@Entity('usuarios')
export class Persona {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario!: number;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 150 })
  nombre_completo!: string;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 2 })
  tipo_documento!: string;

  @Column({ name: 'numero_documento', type: 'varchar', length: 20, unique: true })
  numero_documento!: string;

  @Column({ name: 'correo', type: 'varchar', length: 150, unique: true })
  correo!: string;

  @Column({ name: 'contrasena_hash', type: 'varchar', length: 255 })
  contrasena_hash!: string;

  @ManyToOne(() => Rol, { nullable: true })
  @JoinColumn({ name: 'id_rol' })
  rol?: Rol;

  @ManyToOne(() => Area, { nullable: true })
  @JoinColumn({ name: 'id_area' })
  area?: Area;

  @Column({ name: 'estado_cuenta', type: 'varchar', length: 20, default: 'pendiente' })
  estado_cuenta!: string;

  @Column({ name: 'carpeta_drive_url', type: 'varchar', length: 255, nullable: true })
  carpeta_drive_url?: string;

  @Column({ name: 'firma_digital_ruta', type: 'varchar', length: 255, nullable: true })
  firma_digital_ruta?: string;

  @Column({ name: 'firma_digital_actualizada_at', type: 'timestamp', nullable: true })
  firma_digital_actualizada_at?: Date;

  @Column({ name: 'preferencias_notificaciones', type: 'simple-json', default: '{}' })
  preferencias_notificaciones!: Record<string, unknown>;

  @Column({ name: 'aprobado_por_id', type: 'int', nullable: true })
  aprobado_por_id?: number;

  @Column({ name: 'fecha_aprobacion', type: 'timestamp', nullable: true })
  fecha_aprobacion?: Date;

  @Column({ name: 'motivo_rechazo', type: 'varchar', length: 255, nullable: true })
  motivo_rechazo?: string;

  @Column({ name: 'reset_token', type: 'varchar', length: 255, nullable: true })
  reset_token?: string;

  @Column({ name: 'reset_token_expiry', type: 'timestamp', nullable: true })
  reset_token_expiry?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date;
}