/**
 * Xandeflix Prebuilt — Client Search Service Singleton (Gate G7)
 *
 * Provê a instância padrão do SearchService para a camada de apresentação.
 */

import { SearchService } from './search.service.ts';
import { getClientBootstrapService } from '../bootstrap/client.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';

let defaultSearchService: SearchService | null = null;

export function getClientSearchService(overrideStorage?: LocalCatalogStorage): SearchService {
  if (overrideStorage) {
    return new SearchService(overrideStorage);
  }

  if (!defaultSearchService) {
    const bootstrap = getClientBootstrapService();
    defaultSearchService = new SearchService(bootstrap.getStorage());
  }

  return defaultSearchService;
}
