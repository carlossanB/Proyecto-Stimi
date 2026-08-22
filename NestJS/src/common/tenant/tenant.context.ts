import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<TenantContextData>();

export class TenantContext {
  static run<T>(data: TenantContextData, callback: () => T): T {
    return asyncLocalStorage.run(data, callback);
  }

  static getTenantId(): string {
    const store = asyncLocalStorage.getStore();
    return store?.tenantId || 'default';
  }
}
