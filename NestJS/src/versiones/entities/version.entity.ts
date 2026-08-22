import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Informe } from '../../informes/entities/informe.entity';

@Entity('versiones')
export class Version {
  @PrimaryGeneratedColumn({ name: 'id_version' })
  id_version!: number;

  @ManyToOne(() => Informe, (informe) => informe.versiones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_informe' })
  informe!: Informe;

  @Column({ name: 'numero_version', type: 'int' })
  numero_version!: number;

  @Column({ name: 'fecha_version', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_version!: Date;

  @Column({ name: 'descripcion', type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ name: 'archivo_ruta', type: 'varchar', length: 255 })
  archivo_ruta!: string;

  @Column({ name: 'archivo_nombre_original', type: 'varchar', length: 255 })
  archivo_nombre_original!: string;

  @Column({ name: 'archivo_tamano_bytes', type: 'int', nullable: true })
  archivo_tamano_bytes?: number;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion?: string;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'pendiente' })
  estado!: string;
}
