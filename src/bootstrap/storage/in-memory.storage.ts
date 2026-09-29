/**
 * Xandeflix Prebuilt � In-Memory Catalog Storage
 *
 * Implementa��o em mem�ria de LocalCatalogStorage para testes e desenvolvimento.
 * Isola a l�gica de neg�cio de depend�ncias de filesystem nativo.
 */

import type { PrebuiltCatalog } from '../../contracts/catalog.ts';
import type { ProvisioningManifest } from '../../provisioning/types.ts';
import type { ActivePointer } from '../types.ts';
import type { PrebuiltSearchIndex } from '../../search/search-index.types.ts';
import type { LiveCatalog } from '../../catalog/live/live-tv.types.ts';
import type { LocalCatalogStorage, CatalogSegmentEntry } from './storage.interface.ts';
import { calculateSha256 } from '../../provisioning/integrity.ts';
import { resolveSegmentRelativePath } from './segment-path-resolver.ts';

interface StoredSnapshot {
  manifestJson: string;
  catalogJson: string;
  searchIndexJson?: string;
  searchIndexBuffer?: Buffer | Uint8Array;
  liveCatalogJson?: string;
}

export class InMemoryCatalogStorage implements LocalCatalogStorage {
  private activePointer: ActivePointer | null = null;
  private staging = new Map<string, StoredSnapshot>();
  private snapshots = new Map<string, StoredSnapshot>();
  private stagingSegments = new Map<string, string>();
  private snapshotSegments = new Map<string, string>();

  // Flag para simula��o de falha controlada em testes de resili�ncia
  public simulatePointerWriteFailure = false;
  public simulateSegmentCopyFailureFileName: string | null = null;
  public simulateSegmentTargetAbsentFileName: string | null = null;
  public simulateSegmentTargetCountMismatch = false;

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
    catalog: PrebuiltCatalog | string,
    searchIndex?: PrebuiltSearchIndex | Buffer | Uint8Array | null,
    liveCatalog?: LiveCatalog | null
  ): Promise<void> {
    const isBuffer =
      (typeof Buffer !== 'undefined' && Buffer.isBuffer(searchIndex)) ||
      searchIndex instanceof Uint8Array;
    this.staging.set(snapshotId, {
      manifestJson: JSON.stringify(manifest),
      catalogJson: typeof catalog === 'string' ? catalog : JSON.stringify(catalog, null, 2),
      searchIndexJson: !isBuffer && searchIndex ? JSON.stringify(searchIndex) : undefined,
      searchIndexBuffer: isBuffer ? (searchIndex as Buffer | Uint8Array) : undefined,
      liveCatalogJson: liveCatalog ? JSON.stringify(liveCatalog) : undefined,
    });
  }

  async readStaging(
    snapshotId: string
  ): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    rawCatalogJson?: string;
    searchIndex?: PrebuiltSearchIndex | null;
    searchIndexBuffer?: Buffer | Uint8Array | null;
    liveCatalog?: LiveCatalog | null;
  } | null> {
    const entry = this.staging.get(snapshotId);
    if (!entry) return null;
    try {
      const manifest = JSON.parse(entry.manifestJson) as ProvisioningManifest;
      const catalog = JSON.parse(entry.catalogJson) as PrebuiltCatalog;
      const searchIndex = entry.searchIndexJson
        ? (JSON.parse(entry.searchIndexJson) as PrebuiltSearchIndex)
        : null;
      const liveCatalog = entry.liveCatalogJson
        ? (JSON.parse(entry.liveCatalogJson) as LiveCatalog)
        : null;
      return {
        manifest,
        catalog,
        rawCatalogJson: entry.catalogJson,
        searchIndex,
        searchIndexBuffer: entry.searchIndexBuffer || null,
        liveCatalog,
      };
    } catch {
      return null;
    }
  }

    async promoteStaging(snapshotId: string): Promise<void> {
    const entry = this.staging.get(snapshotId);
    if (!entry) {
      throw new Error(`[STORAGE_PROMOTION_ERROR] Snapshot '${snapshotId}' não encontrado em staging para promoção`);
    }

    const manifest = JSON.parse(entry.manifestJson) as ProvisioningManifest;
    const declaredSegments: CatalogSegmentEntry[] = Array.isArray((manifest as any).segments)
      ? (manifest as any).segments
      : [];

    if (declaredSegments.length > 0) {
      const expectedCount = declaredSegments.length;
      let copiedCount = 0;

      for (const seg of declaredSegments) {
        const rel = resolveSegmentRelativePath(seg.fileName);
        const fileName = rel.replace(/^segments\//, '');
        const segKeyWithPrefix = `${snapshotId}/${rel}`;
        const segKeyWithoutPrefix = `${snapshotId}/${fileName}`;
        const data = this.stagingSegments.get(segKeyWithPrefix) ?? this.stagingSegments.get(segKeyWithoutPrefix);

        if (data === undefined) {
          throw new Error(`[PROMOTION_SEGMENT_MISSING_IN_STAGING] Segmento obrigatório '${fileName}' ausente em staging`);
        }

        if (this.simulateSegmentCopyFailureFileName === fileName) {
          throw new Error(`[PROMOTION_SEGMENT_COPY_FAILED] Falha simulada ao copiar segmento '${fileName}'`);
        }

        if (this.simulateSegmentTargetAbsentFileName !== fileName) {
          this.snapshotSegments.set(segKeyWithPrefix, data);
          this.snapshotSegments.set(segKeyWithoutPrefix, data);
        }

        const targetData = this.snapshotSegments.get(segKeyWithPrefix);
        if (targetData === undefined) {
          throw new Error(`[PROMOTION_SEGMENT_ABSENT_IN_TARGET] Segmento '${fileName}' ausente no diretório target após cópia`);
        }

        if (typeof seg.byteSize === 'number' && seg.byteSize > 0) {
          const targetByteLength = Buffer.byteLength(targetData, 'utf8');
          if (targetByteLength !== seg.byteSize) {
            throw new Error(`[PROMOTION_SEGMENT_SIZE_MISMATCH] Tamanho divergente no segmento '${fileName}': esperado=${seg.byteSize}, real=${targetByteLength}`);
          }
        }

        if (typeof seg.sha256 === 'string' && seg.sha256.trim() !== '') {
          const targetHash = calculateSha256(targetData);
          if (targetHash !== seg.sha256) {
            throw new Error(`[PROMOTION_SEGMENT_HASH_MISMATCH] Hash divergente no segmento '${fileName}': esperado=${seg.sha256}, real=${targetHash}`);
          }
        }

        copiedCount++;
      }

      if (this.simulateSegmentTargetCountMismatch) {
        copiedCount--;
      }

      if (copiedCount !== expectedCount) {
        throw new Error(`[PROMOTION_SEGMENT_COUNT_MISMATCH] Contagem de segmentos copiados divergente do manifest: esperado=${expectedCount}, copiado=${copiedCount}`);
      }
    }

    this.snapshots.set(snapshotId, { ...entry });

    // Promove quaisquer outros segmentos com prefixo
    const prefix = `${snapshotId}/`;
    for (const [key, data] of this.stagingSegments.entries()) {
      if (key.startsWith(prefix) && !this.snapshotSegments.has(key)) {
        this.snapshotSegments.set(key, data);
      }
    }
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

  async readActiveSearchIndexBuffer(): Promise<Buffer | Uint8Array | null> {
    if (!this.activePointer) return null;
    const entry = this.snapshots.get(this.activePointer.snapshotId);
    return entry?.searchIndexBuffer || null;
  }

  async writeActiveSearchIndex(snapshotId: string, index: Buffer | Uint8Array): Promise<void> {
    const entry = this.snapshots.get(snapshotId);
    if (!entry) {
      throw new Error(`[SEARCH_INDEX_SNAPSHOT_NOT_FOUND] Snapshot '${snapshotId}' não encontrado`);
    }
    entry.searchIndexBuffer = index;
  }

  async cleanupStaging(snapshotId?: string): Promise<void> {
    if (snapshotId) {
      this.staging.delete(snapshotId);
      const prefix = `${snapshotId}/`;
      for (const key of Array.from(this.stagingSegments.keys())) {
        if (key.startsWith(prefix)) {
          this.stagingSegments.delete(key);
        }
      }
    } else {
      this.staging.clear();
      this.stagingSegments.clear();
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
    const liveSize = entry.liveCatalogJson
      ? Buffer.byteLength(entry.liveCatalogJson, 'utf8')
      : 0;
    let segmentsSize = 0;
    const prefix = `${this.activePointer.snapshotId}/`;
    for (const [key, data] of this.snapshotSegments.entries()) {
      if (key.startsWith(prefix)) {
        segmentsSize += Buffer.byteLength(data, 'utf8');
      }
    }
    return pointerSize + manifestSize + catalogSize + indexSize + liveSize + segmentsSize;
  }

  async writeStagingSegment(snapshotId: string, segmentPath: string, data: string): Promise<void> {
    const rel = resolveSegmentRelativePath(segmentPath);
    this.stagingSegments.set(`${snapshotId}/${rel}`, data);
  }

  async readStagingSegment(snapshotId: string, segmentPath: string): Promise<string | null> {
    const direct = this.stagingSegments.get(`${snapshotId}/${segmentPath}`);
    if (direct !== undefined) return direct;
    const rel = resolveSegmentRelativePath(segmentPath);
    return this.stagingSegments.get(`${snapshotId}/${rel}`) ?? null;
  }

  async readActiveSegment(segmentPath: string): Promise<string | null> {
    if (!this.activePointer) return null;
    const direct = this.snapshotSegments.get(`${this.activePointer.snapshotId}/${segmentPath}`);
    if (direct !== undefined) return direct;
    const rel = resolveSegmentRelativePath(segmentPath);
    return this.snapshotSegments.get(`${this.activePointer.snapshotId}/${rel}`) ?? null;
  }

  async listActiveSegments(): Promise<string[]> {
    if (!this.activePointer) return [];
    const prefix = `${this.activePointer.snapshotId}/`;
    return Array.from(this.snapshotSegments.keys())
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.substring(prefix.length));
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
    searchIndexBuffer?: Buffer | Uint8Array | null;
    liveCatalog?: LiveCatalog | null;
  } | null> {
    const entry = this.snapshots.get(snapshotId);
    if (!entry) return null;
    try {
      const manifest = JSON.parse(entry.manifestJson) as ProvisioningManifest;
      const catalog = JSON.parse(entry.catalogJson) as PrebuiltCatalog;
      const searchIndex = entry.searchIndexJson
        ? (JSON.parse(entry.searchIndexJson) as PrebuiltSearchIndex)
        : null;
      const liveCatalog = entry.liveCatalogJson
        ? (JSON.parse(entry.liveCatalogJson) as LiveCatalog)
        : null;
      return {
        manifest,
        catalog,
        searchIndex,
        searchIndexBuffer: entry.searchIndexBuffer || null,
        liveCatalog,
      };
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
    const prefix = `${snapshotId}/`;
    for (const key of Array.from(this.snapshotSegments.keys())) {
      if (key.startsWith(prefix)) {
        this.snapshotSegments.delete(key);
      }
    }
  }

  corruptActivePointerRaw(corruptedPointer: unknown): void {
    this.activePointer = corruptedPointer as ActivePointer;
  }
}


