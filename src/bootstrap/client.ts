/**
 * Xandeflix Prebuilt — Client Bootstrap Service Singleton (Gate G6)
 *
 * Provê a instância padrão do BootstrapService para a camada de apresentação.
 */

import { BootstrapService } from './bootstrap.service.ts';
import { CapacitorFilesystemStorage } from './storage/capacitor-filesystem.storage.ts';
import type { LocalCatalogStorage } from './storage/storage.interface.ts';

let defaultServiceInstance: BootstrapService | null = null;

export function getClientBootstrapService(overrideStorage?: LocalCatalogStorage): BootstrapService {
  if (overrideStorage) {
    return new BootstrapService(overrideStorage);
  }

  if (!defaultServiceInstance) {
    const storage = new CapacitorFilesystemStorage();
    defaultServiceInstance = new BootstrapService(storage);
  }

  return defaultServiceInstance;
}
