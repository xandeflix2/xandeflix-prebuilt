/**
 * Xandeflix Prebuilt — Bootstrap Service
 *
 * Ponto de entrada unificado de bootstrap e persistência local para a aplicação cliente.
 *
 * Princípios:
 * - READ MODEL MÍNIMO: Fornece apenas getActiveCatalog() e getActiveMetadata()
 * - ISOLAÇÃO DE UI: Sem lógica de carrossel, filtros ou busca (G6)
 * - CRASH-SAFETY E FAIL-CLOSED
 */

import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import type { ProvisioningManifest } from '../provisioning/types.ts';
import type { PrebuiltSearchIndex } from '../search/search-index.types.ts';
import type { LocalCatalogStorage } from './storage/storage.interface.ts';
import { PackageImporter } from './package-importer.ts';
import { BootstrapStateManager, type StateChangeListener } from './bootstrap-state.ts';
import type {
  ActivePointer,
  BootstrapSummary,
  ImportPackageOptions,
  ImportResult,
} from './types.ts';

export class BootstrapService {
  private storage: LocalCatalogStorage;
  private importer: PackageImporter;
  private stateManager: BootstrapStateManager;

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
    this.importer = new PackageImporter(storage);
    this.stateManager = new BootstrapStateManager(storage);
  }

  /**
   * Inicializa o serviço verificando se há um catálogo ativo persistido.
   */
  async initialize(): Promise<BootstrapSummary> {
    return this.stateManager.sync();
  }

  /**
   * Executa a importação transacional de um pacote de provisionamento ZIP.
   */
  async importPackage(
    packageSource: string | Buffer,
    options?: ImportPackageOptions
  ): Promise<ImportResult> {
    this.stateManager.setImportInProgress();

    const result = await this.importer.importPackage(packageSource, options);

    if (result.success) {
      const pointer = await this.storage.readActivePointer();
      if (pointer) {
        this.stateManager.setImportSuccess(pointer);
      } else {
        this.stateManager.setImportFailed();
      }
    } else {
      this.stateManager.setImportFailed();
    }

    return result;
  }

  /**
   * Retorna o catálogo completo ativo (read model mínimo).
   */
  async getActiveCatalog(): Promise<PrebuiltCatalog | null> {
    return this.storage.readActiveCatalog();
  }

  /**
   * Retorna o manifesto do pacote atualmente ativo (read model mínimo).
   */
  async getActiveMetadata(): Promise<ProvisioningManifest | null> {
    return this.storage.readActiveManifest();
  }

  /**
   * Retorna o índice de busca pré-construído do snapshot ativo (se disponível).
   */
  async getActiveSearchIndex(): Promise<PrebuiltSearchIndex | null> {
    return this.storage.readActiveSearchIndex();
  }

  /**
   * Retorna a instância de storage subjacente.
   */
  getStorage(): LocalCatalogStorage {
    return this.storage;
  }

  /**
   * Retorna o ponteiro ativo atual.
   */
  async getActivePointer(): Promise<ActivePointer | null> {
    return this.storage.readActivePointer();
  }

  /**
   * Retorna o sumário de estado do bootstrap.
   */
  getSummary(): BootstrapSummary {
    return this.stateManager.getSummary();
  }

  /**
   * Permite que a camada de UI subscreva a alterações de estado do bootstrap.
   */
  subscribe(listener: StateChangeListener): () => void {
    return this.stateManager.subscribe(listener);
  }
}
