/**
 * Xandeflix Prebuilt — Bootstrap State Manager
 *
 * Gerencia o estado reativo do bootstrap no dispositivo móvel/web.
 *
 * Princípios:
 * - NO_FALSE_EMPTY_GUARD = PASS
 * - Estados unívocos:
 *   * NO_ACTIVE_CATALOG
 *   * IMPORT_IN_PROGRESS
 *   * ACTIVE_CATALOG_READY
 *   * IMPORT_FAILED_ACTIVE_PRESERVED
 */

import type { BootstrapStatus, ActivePointer, BootstrapSummary } from './types.ts';
import type { LocalCatalogStorage } from './storage/storage.interface.ts';
import { isValidActivePointer } from './active-snapshot.ts';

export type StateChangeListener = (summary: BootstrapSummary) => void;

export class BootstrapStateManager {
  private storage: LocalCatalogStorage;
  private status: BootstrapStatus = 'NO_ACTIVE_CATALOG';
  private activePointer: ActivePointer | null = null;
  private listeners = new Set<StateChangeListener>();

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
  }

  /**
   * Sincroniza o estado em memória com a persistência do storage local.
   */
  async sync(): Promise<BootstrapSummary> {
    const pointer = await this.storage.readActivePointer();
    const hasCatalog = await this.storage.hasActiveCatalog();

    if (isValidActivePointer(pointer) && hasCatalog) {
      this.activePointer = pointer;
      this.status = 'ACTIVE_CATALOG_READY';
    } else {
      // Proteção explícita contra falso vazio:
      // Se não há ponteiro válido ou o catálogo não existe no disco,
      // o estado é rigorosamente NO_ACTIVE_CATALOG, NUNCA "catálogo vazio"
      this.activePointer = null;
      this.status = 'NO_ACTIVE_CATALOG';
    }

    this.notify();
    return this.getSummary();
  }

  setImportInProgress(): void {
    this.status = 'IMPORT_IN_PROGRESS';
    this.notify();
  }

  setImportSuccess(pointer: ActivePointer): void {
    this.activePointer = pointer;
    this.status = 'ACTIVE_CATALOG_READY';
    this.notify();
  }

  setImportFailed(): void {
    if (this.activePointer) {
      this.status = 'IMPORT_FAILED_ACTIVE_PRESERVED';
    } else {
      this.status = 'NO_ACTIVE_CATALOG';
    }
    this.notify();
  }

  getSummary(): BootstrapSummary {
    return {
      status: this.status,
      activePointer: this.activePointer ? { ...this.activePointer } : null,
      hasActiveCatalog: this.status === 'ACTIVE_CATALOG_READY',
      isReady: this.status === 'ACTIVE_CATALOG_READY',
    };
  }

  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const summary = this.getSummary();
    for (const listener of this.listeners) {
      try {
        listener(summary);
      } catch {
        // Ignora erros de listeners
      }
    }
  }
}
