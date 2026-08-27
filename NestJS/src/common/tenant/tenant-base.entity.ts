import { Column, Index } from 'typeorm';

export abstract class TenantBaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'varchar', length: 50, default: 'default' })
  tenant_id!: string;
}
