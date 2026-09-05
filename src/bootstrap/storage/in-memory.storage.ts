/**
 * Xandeflix Prebuilt — In-Memory Catalog Storage (Test & CLI Adapter)
 *
 * Implementação em memória de LocalCatalogStorage para validação determinística,
 * testes automatizados e execução de suítes sem dependência de dispositivo físico.
 */

import type { PrebuiltCatalog } from '../../contracts/catalog.ts';
import type { ProvisioningManifest } from '../../provisioning/types.ts';
import type { ActivePointer } from '../types.ts';
import type { PrebuiltSearchIndex } from '../../search/search-index.types.ts';
import type { LocalCatalogStorage } from './storage.interface.ts';

interface StoredSnapshot {
  manifestJson: string;
  catalogJson: string;
  searchIndexJson?: string;
}

export class InMemoryCatalogStorage implements LocalCatalogStorage {
  private activePointer: ActivePointer | null = null;
  private staging = new Map<string, StoredSnapshot>();
  private snapshots = new Map<string, StoredSnapshot>();

  // Flag para simulação de falha controlada em testes de resiliência
  public simulatePointerWriteFailure = false;

  async readActivePointer(): Promise<ActivePointer | null> {
    if (!this.activePointer) return null;
    return { ...this.activePointer };
  }

  async writeActivePointer(pointer: ActivePointer): Promise<void> {
    if (this.simulatePointerWriteFailure) {
      throw new Error('[SIMULATED_POINTER_WRITE_FAILURE] Falha simulada ao persistir ponteiro ativo');
    }
    this.activePointer = { ...pointer };
  }

  async writeStaging(
    snapshotId: string,
    manifest: ProvisioningManifest,
    catalog: PrebuiltCatalog,
    searchIndex?: PrebuiltSearchIndex | null
  ): Promise<void> {
    this.staging.set(snapshotId, {
      manifestJson: JSON.stringify(manifest),
      catalogJson: JSON.stringify(catalog),
      searchIndexJson: searchIndex ? JSON.stringify(searchIndex) : undefined,
    });
  }

  async readStaging(
    snapshotId: string
  ): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    searchIndex?: PrebuiltSearchIndex | null;
  } | null> {
    const entry = this.staging.get(snapshotId);
    if (!entry) return null;
    try {
      const manifest = JSON.parse(entry.manifestJson) as ProvisioningManifest;
      const catalog = JSON.parse(entry.catalogJson) as PrebuiltCatalog;
      const searchIndex = entry.searchIndexJson
        ? (JSON.parse(entry.searchIndexJson) as PrebuiltSearchIndex)
        : null;
      return { manifest, catalog, searchIndex };
    } catch {
      return null;
    }
  }

  async promoteStaging(snapshotId: string): Promise<void> {
    const entry = this.staging.get(snapshotId);
    if (!entry) {
      throw new Error(`[STORAGE_PROMOTION_ERROR] Snapshot '${snapshotId}' não encontrado em staging para promoção`);
    }
    this.snapshots.set(snapshotId, { ...entry });
  }

  async readActiveCatalog(): Promise<PrebuiltCatalog | null> {
    if (!this.activePointer) return null;
    const entry = this.snapshots.get(this.activePointer.snapshotId);
    if (!entry) return null;
    try {
      return JSON.parse(entry.catalogJson) as PrebuiltCatalog;
    } catch {
      return null;
    }
  }

  async readActiveManifest(): Promise<ProvisioningManifest | null> {
    if (!this.activePointer) return null;
    const entry = this.snapshots.get(this.activePointer.snapshotId);
    if (!entry) return null;
    try {
      return JSON.parse(entry.manifestJson) as ProvisioningManifest;
    } catch {
      return null;
    }
  }

  async readActiveSearchIndex(): Promise<PrebuiltSearchIndex | null> {
    if (!this.activePointer) return null;
    const entry = this.snapshots.get(this.activePointer.snapshotId);
    if (!entry || !entry.searchIndexJson) return null;
    try {
      return JSON.parse(entry.searchIndexJson) as PrebuiltSearchIndex;
    } catch {
      return null;
    }
  }

  async cleanupStaging(snapshotId?: string): Promise<void> {
    if (snapshotId) {
      this.staging.delete(snapshotId);
    } else {
      this.staging.clear();
    }
  }

  async hasActiveCatalog(): Promise<boolean> {
    if (!this.activePointer) return false;
    return this.snapshots.has(this.activePointer.snapshotId);
  }

  async calculateActiveStorageSize(): Promise<number> {
    if (!this.activePointer) return 0;
    const entry = this.snapshots.get(this.activePointer.snapshotId);
    if (!entry) return 0;
    const pointerSize = Buffer.byteLength(JSON.stringify(this.activePointer), 'utf8');
    const manifestSize = Buffer.byteLength(entry.manifestJson, 'utf8');
    const catalogSize = Buffer.byteLength(entry.catalogJson, 'utf8');
    const indexSize = entry.searchIndexJson
      ? Buffer.byteLength(entry.searchIndexJson, 'utf8')
      : 0;
    return pointerSize + manifestSize + catalogSize + indexSize;
  }

  private recoveryJournal: import('../../recovery/recovery.types.ts').RecoveryJournalData | null = null;

  async readRecoveryJournal(): Promise<import('../../recovery/recovery.types.ts').RecoveryJournalData | null> {
    return this.recoveryJournal ? { ...this.recoveryJournal } : null;
  }

  async writeRecoveryJournal(journal: import('../../recovery/recovery.types.ts').RecoveryJournalData): Promise<void> {
    this.recoveryJournal = { ...journal };
  }

  async readSnapshot(snapshotId: string): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    searchIndex?: PrebuiltSearchIndex | null;
  } | null> {
    const entry = this.snapshots.get(snapshotId);
    if (!entry) return null;
    try {
      const manifest = JSON.parse(entry.manifestJson) as ProvisioningManifest;
      const catalog = JSON.parse(entry.catalogJson) as PrebuiltCatalog;
      const searchIndex = entry.searchIndexJson
        ? (JSON.parse(entry.searchIndexJson) as PrebuiltSearchIndex)
        : null;
      return { manifest, catalog, searchIndex };
    } catch {
      return null;
    }
  }

  corruptSnapshotCatalog(snapshotId: string, corruptedJson = '{ invalid_json'): void {
    const entry = this.snapshots.get(snapshotId);
    if (entry) {
      entry.catalogJson = corruptedJson;
    }
  }

  corruptSnapshotSearchIndex(snapshotId: string, corruptedJson = '{ invalid_json'): void {
    const entry = this.snapshots.get(snapshotId);
    if (entry) {
      entry.searchIndexJson = corruptedJson;
    }
  }

  corruptSnapshotManifest(snapshotId: string, corruptedJson = '{ invalid_json'): void {
    const entry = this.snapshots.get(snapshotId);
    if (entry) {
      entry.manifestJson = corruptedJson;
    }
  }

  deleteSnapshot(snapshotId: string): void {
    this.snapshots.delete(snapshotId);
  }

  corruptActivePointerRaw(corruptedPointer: unknown): void {
    this.activePointer = corruptedPointer as ActivePointer;
  }
}
