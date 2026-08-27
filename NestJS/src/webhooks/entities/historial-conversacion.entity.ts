import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { TenantBaseEntity } from '../../common/tenant/tenant-base.entity';

/**
 * Tabla: historial_conversacion
 * Almacena el historial de mensajes del bot Stimi (WhatsApp) por número de teléfono.
 * El nodo "GUARDA el historial" en n8n escribe aquí a través del endpoint POST /webhooks/historial-chat.
 */
@Entity('historial_conversacion')
export class HistorialConversacion extends TenantBaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  remoteJid!: string;

  @Column({ type: 'varchar', length: 30 })
  telefono!: string;

  @Column({ type: 'varchar', length: 20 })
  rol!: string; // 'user' | 'assistant'

  @Column({ type: 'text' })
  contenido!: string;

  @Column({ type: 'varchar', length: 20, default: 'texto' })
  tipo_mensaje!: string; // 'texto' | 'imagen' | 'audio' | 'documento'

  @Column({ type: 'varchar', length: 30, nullable: true })
  cedula?: string;

  @Column({ type: 'varchar', length: 20, default: 'whatsapp' })
  origen!: 'whatsapp' | 'web';

  @CreateDateColumn()
  creado_en!: Date;
}
