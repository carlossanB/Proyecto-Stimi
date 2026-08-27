import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { TenantContext } from './tenant.context';

@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>) {
    if (event.entity && 'tenant_id' in event.entity) {
      const activeTenant = TenantContext.getTenantId();
      if (!event.entity.tenant_id || event.entity.tenant_id === 'default') {
        event.entity.tenant_id = activeTenant;
      }
    }
  }
}
