/**
 * Xandeflix Prebuilt ï¿½ Capacitor Filesystem Catalog Storage
 *
 * Implementaï¿½ï¿½o de LocalCatalogStorage persistida em Directory.Data (app private storage).
 *
 * Princï¿½pios:
 * - APP_PRIVATE_STORAGE = SIM (Directory.Data privado do aplicativo)
 * - LOCAL_STORAGE_STRATEGY = CAPACITOR_FILESYSTEM_CANONICAL_JSON
 * - STAGING_GENERATION = prebuilt/staging/<snapshotId>/
 * - SNAPSHOT_GENERATION = prebuilt/snapshots/<snapshotId>/
 * - ACTIVE_POINTER = prebuilt/active.json
 * - MAX_SINGLE_STORAGE_WRITE_ESTIMATE = 256_KB
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { PrebuiltCatalog } from '../../contracts/catalog.ts';
import type { ProvisioningManifest } from '../../provisioning/types.ts';
import type { PrebuiltSearchIndex } from '../../search/search-index.types.ts';
import type { LiveCatalog } from '../../catalog/live/live-tv.types.ts';
import type { ActivePointer } from '../types.ts';
import type { LocalCatalogStorage, CatalogSegmentEntry } from './storage.interface.ts';
import { createActivePointer } from '../active-snapshot.ts';
import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';
import { resolveSegmentRelativePath } from './segment-path-resolver.ts';
import { collectObsoleteSnapshots, isSafeSnapshotId, snapshotOperations, type SnapshotRetentionResult } from './snapshot-retention.ts';
import { calculateSha256, calculateSha256Async } from '../../provisioning/integrity.ts';

let retentionTask: Promise<SnapshotRetentionResult> | undefined;

const PREBUILT_DIR = 'prebuilt';
const ACTIVE_POINTER_FILE = `${PREBUILT_DIR}/active.json`;
const RECOVERY_JOURNAL_FILE = `${PREBUILT_DIR}/recovery.json`;
const STAGING_DIR = `${PREBUILT_DIR}/staging`;
const SNAPSHOTS_DIR = `${PREBUILT_DIR}/snapshots`;

export class CapacitorFilesystemStorage implements LocalCatalogStorage {
  private baseDir = Directory.Data;

  // Keep permanent-generation reads, promotion/recovery writes and collection
  // in one queue across storage instances. Staging remains independent.
  writeActivePointer(pointer: ActivePointer) { return snapshotOperations.run(() => this.writeActivePointerUnlocked(pointer)); }
  promoteStaging(id: string) { return snapshotOperations.run(() => this.promoteStagingUnlocked(id)); }
  writeRecoveryJournal(journal: RecoveryJournalData) { return snapshotOperations.run(() => this.writeRecoveryJournalUnlocked(journal)); }
  readActiveCatalog() { return snapshotOperations.run(() => this.readActiveCatalogUnlocked()); }
  readActiveManifest() { return snapshotOperations.run(() => this.readActiveManifestUnlocked()); }
  readActiveSearchIndex() { return snapshotOperations.run(() => this.readActiveSearchIndexUnlocked()); }
  readActiveSearchIndexBuffer() { return snapshotOperations.run(() => this.readActiveSearchIndexBufferUnlocked()); }
  readActiveSegment(path: string) { return snapshotOperations.run(() => this.readActiveSegmentUnlocked(path)); }
  listActiveSegments() { return snapshotOperations.run(() => this.listActiveSegmentsUnlocked()); }
  hasActiveCatalog() { return snapshotOperations.run(() => this.hasActiveCatalogUnlocked()); }
  readSnapshot(id: string) { return snapshotOperations.run(() => this.readSnapshotUnlocked(id)); }
  writeActiveSearchIndex(id: string, index: Buffer | Uint8Array) { return snapshotOperations.run(() => this.writeActiveSearchIndexUnlocked(id, index)); }

  maintainCatalogSnapshots(): Promise<SnapshotRetentionResult> {
    if (!retentionTask) {
      retentionTask = collectObsoleteSnapshots({
        exclusive: work => snapshotOperations.run(work),
        state: async () => ({ pointer: await this.readActivePointer(), journal: await this.readRecoveryJournal() }),
        list: async () => {
          const entries = await Filesystem.readdir({ path: SNAPSHOTS_DIR, directory: this.baseDir });
          return entries.files.map(entry => typeof entry === 'string'
            ? { name: entry, type: 'unknown' } : { name: entry.name, type: entry.type });
        },
        validateKept: id => this.validateRetainedSnapshot(id),
        remove: async id => {
          if (!isSafeSnapshotId(id)) throw new Error('RETENTION_UNSAFE_ID');
          const path = `${SNAPSHOTS_DIR}/${id}`;
          const entry = await Filesystem.stat({ path, directory: this.baseDir });
          if (entry.type !== 'directory') throw new Error('RETENTION_NOT_DIRECTORY');
          await Filesystem.rmdir({ path, directory: this.baseDir, recursive: true });
        },
      }).finally(() => { retentionTask = undefined; });
    }
    return retentionTask;
  }

  private async validateRetainedSnapshot(id: string): Promise<boolean> {
    try {
      if (!isSafeSnapshotId(id)) return false;
      const prefix = `${SNAPSHOTS_DIR}/${id}`;
      for (const [file, limit] of [['manifest.json', 2 * 1024 * 1024], ['catalog.json', 8 * 1024 * 1024]] as const) {
        const info = await snapshotOperations.run(() => Filesystem.stat({ path: `${prefix}/${file}`, directory: this.baseDir }));
        if (info.type !== 'file' || info.size <= 0 || info.size > limit) return false;
      }
      const manifestText = await snapshotOperations.run(() => this.readTextFileSafely(`${prefix}/manifest.json`));
      const catalogText = await snapshotOperations.run(() => this.readTextFileSafely(`${prefix}/catalog.json`));
      if (!manifestText || !catalogText) return false;
      const manifest = JSON.parse(manifestText), catalog = JSON.parse(catalogText);
      if (manifest.snapshotId !== id || catalog.metadata?.snapshotId !== id ||
          typeof manifest.catalogVersion !== 'string' || catalog.metadata?.catalogVersion !== manifest.catalogVersion ||
          !/^[a-f0-9]{64}$/i.test(manifest.catalogSha256 || '')) return false;
      const pointer = await this.readActivePointer();
      if (pointer?.snapshotId === id && (manifest.catalogVersion !== pointer.catalogVersion ||
          manifest.schemaVersion !== pointer.schemaVersion || manifest.packageContentHash !== pointer.packageContentHash)) return false;
      const segments = manifest.segments;
      if (segments !== undefined && !Array.isArray(segments)) return false;
      if (!segments?.length) return calculateSha256(JSON.stringify(catalog, null, 2)) === manifest.catalogSha256;
      if (segments.length > 4096 || manifest.packageContentHash !== manifest.catalogSha256) return false;
      const paths = segments.map((segment: CatalogSegmentEntry) => resolveSegmentRelativePath(segment.fileName));
      if (new Set(paths).size !== paths.length) return false;
      // Read/hash one segment at a time per worker, not a whole catalog in RAM.
      // Each read releases the shared queue before yielding to UI/readers.
      let cursor = 0, valid = true;
      await Promise.all(Array.from({ length: 2 }, async () => {
        while (valid && cursor < segments.length) {
          const index = cursor++, segment = segments[index];
          if (!Number.isSafeInteger(segment.byteSize) || segment.byteSize < 0 || segment.byteSize > 16 * 1024 * 1024 ||
              !/^[a-f0-9]{64}$/i.test(segment.sha256 || '')) { valid = false; continue; }
          let checked = false;
          try { checked = await snapshotOperations.run(async () => {
            const path = `${prefix}/${paths[index]}`;
            const info = await Filesystem.stat({ path, directory: this.baseDir });
            if (info.type !== 'file' || info.size !== segment.byteSize) return false;
            const text = await this.readTextFileSafely(path);
            return text !== null && await calculateSha256Async(text) === segment.sha256;
          }); } catch { valid = false; return; }
          if (!checked) valid = false;
          await new Promise<void>(resolve => setTimeout(resolve, 0));
        }
      }));
      return valid;
    } catch { return false; }
  }

  private async ensureDir(path: string): Promise<void> {
    try {
      await Filesystem.mkdir({ path, directory: this.baseDir, recursive: true });
    } catch (error) {
      const filesystemError = error as { code?: string; message?: string } | null;
      const alreadyExists = filesystemError?.code === 'OS-PLUG-FILE-0010'
        || filesystemError?.code === 'EEXIST'
        || filesystemError?.message === 'Current directory does already exist.';
      if (!alreadyExists) throw error;

      // Accept an existing directory, never a file or an unrelated I/O failure.
      const existing = await Filesystem.stat({ path, directory: this.baseDir });
      if (existing.type !== 'directory') throw error;
    }
  }

  async readActivePointer(): Promise<ActivePointer | null> {
    try {
      const result = await Filesystem.readFile({
        path: ACTIVE_POINTER_FILE,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
      if (!result.data || typeof result.data !== 'string') return null;
      return JSON.parse(result.data) as ActivePointer;
    } catch {
      return null;
    }
  }

  private async writeActivePointerUnlocked(pointer: ActivePointer): Promise<void> {
    await Filesystem.writeFile({
      path: ACTIVE_POINTER_FILE,
      data: JSON.stringify(pointer, null, 2),
      directory: this.baseDir,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }

  private async writeLargeFile(
    path: string,
    content: string,
    chunkSize = 256 * 1024
  ): Promise<void> {
    if (content.length <= chunkSize) {
      await Filesystem.writeFile({
        path,
        data: content,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      return;
    }

    const firstChunk = content.slice(0, chunkSize);
    await Filesystem.writeFile({
      path,
      data: firstChunk,
      directory: this.baseDir,
      encoding: Encoding.UTF8,
      recursive: true,
    });

    for (let offset = chunkSize; offset < content.length; offset += chunkSize) {
      const chunk = content.slice(offset, offset + chunkSize);
      await Filesystem.appendFile({
        path,
        data: chunk,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
    }
  }

  private async readTextFileSafely(path: string): Promise<string | null> {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.convertFileSrc) {
      try {
        const stat = await Filesystem.getUri({
          path,
          directory: this.baseDir,
        });
        const webUri = (window as any).Capacitor.convertFileSrc(stat.uri);
        const res = await fetch(webUri);
        if (res.ok) {
          return await res.text();
        }
      } catch {
        // Fallback para readFile tradicional
      }
    }

    try {
      const file = await Filesystem.readFile({
        path,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
      return typeof file.data === 'string' ? file.data : null;
    } catch {
      return null;
    }
  }

  private async writeBinaryFile(
    path: string,
    buffer: Buffer | Uint8Array,
  ): Promise<void> {
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) {
      await Filesystem.writeFile({
        path,
        data: buffer.toString('base64'),
        directory: this.baseDir,
      });
      return;
    }
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    const len = uint8.byteLength;
    const chunkSize = 32768;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = uint8.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, chunk as any);
    }
    const base64Data = btoa(binary);
    await Filesystem.writeFile({
      path,
      data: base64Data,
      directory: this.baseDir,
      recursive: true,
    });
  }

  private async readBinaryFileSafely(path: string): Promise<Uint8Array | null> {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.convertFileSrc) {
      try {
        const stat = await Filesystem.getUri({
          path,
          directory: this.baseDir,
        });
        const webUri = (window as any).Capacitor.convertFileSrc(stat.uri);
        const res = await fetch(webUri);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          return new Uint8Array(buf);
        }
      } catch {
        // Fallback para readFile tradicional
      }
    }

    try {
      const file = await Filesystem.readFile({
        path,
        directory: this.baseDir,
      });
      if (typeof file.data === 'string') {
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(file.data, 'base64');
        }
        const binaryString = atob(file.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      return null;
    } catch {
      return null;
    }
  }

  async writeStaging(
    snapshotId: string,
    manifest: ProvisioningManifest,
    catalog: PrebuiltCatalog | string,
    searchIndex?: PrebuiltSearchIndex | Buffer | Uint8Array | null,
    liveCatalog?: LiveCatalog | null
  ): Promise<void> {
    const stagingSnapDir = `${STAGING_DIR}/${snapshotId}`;
    await this.ensureDir(stagingSnapDir);

    await this.writeLargeFile(
      `${stagingSnapDir}/manifest.json`,
      JSON.stringify(manifest, null, 2)
    );

    await this.writeLargeFile(
      `${stagingSnapDir}/catalog.json`,
      typeof catalog === 'string' ? catalog : JSON.stringify(catalog, null, 2)
    );

    const isBuffer =
      (typeof Buffer !== 'undefined' && Buffer.isBuffer(searchIndex)) ||
      searchIndex instanceof Uint8Array;

    if (isBuffer) {
      await this.writeBinaryFile(
        `${stagingSnapDir}/compact-search-index-v2.bin`,
        searchIndex as Buffer | Uint8Array
      );
    } else if (searchIndex) {
      await this.writeLargeFile(
        `${stagingSnapDir}/search-index.json`,
        JSON.stringify(searchIndex, null, 2)
      );
    }

    try {
      await Filesystem.deleteFile({
        path: `${stagingSnapDir}/live_catalog.json`,
        directory: this.baseDir,
      });
    } catch {
      // Arquivo opcional inexistente.
    }
    if (liveCatalog) {
      await this.writeLargeFile(
        `${stagingSnapDir}/live_catalog.json`,
        JSON.stringify(liveCatalog, null, 2)
      );
    }
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
    const stagingSnapDir = `${STAGING_DIR}/${snapshotId}`;
    try {
      const manifestData = await this.readTextFileSafely(`${stagingSnapDir}/manifest.json`);
      const catalogData = await this.readTextFileSafely(`${stagingSnapDir}/catalog.json`);

      if (!manifestData || !catalogData) {
        return null;
      }

      const manifest = JSON.parse(manifestData) as ProvisioningManifest;
      const catalog = JSON.parse(catalogData) as PrebuiltCatalog;

      let searchIndex: PrebuiltSearchIndex | null = null;
      let searchIndexBuffer: Uint8Array | Buffer | null = null;

      const indexData = await this.readTextFileSafely(`${stagingSnapDir}/search-index.json`);
      if (indexData) {
        try {
          searchIndex = JSON.parse(indexData) as PrebuiltSearchIndex;
        } catch {
          // search-index opcional para pacotes v1
        }
      }

      searchIndexBuffer = await this.readBinaryFileSafely(`${stagingSnapDir}/compact-search-index-v2.bin`);

      let liveCatalog: LiveCatalog | null = null;
      const liveData = await this.readTextFileSafely(`${stagingSnapDir}/live_catalog.json`);
      if (liveData) {
        try {
          liveCatalog = JSON.parse(liveData) as LiveCatalog;
        } catch {
          // live_catalog opcional para pacotes sem Live.
        }
      }

      return {
        manifest,
        catalog,
        rawCatalogJson: catalogData,
        searchIndex,
        searchIndexBuffer,
        liveCatalog,
      };
    } catch {
      return null;
    }
  }

  async writeStagingSegment(snapshotId: string, segmentPath: string, data: string): Promise<void> {
    const rel = resolveSegmentRelativePath(segmentPath);
    const fullPath = `${STAGING_DIR}/${snapshotId}/${rel}`;
    console.log(`[FILESYSTEM] writeFile: ${fullPath}`);
    await Filesystem.writeFile({
      path: fullPath,
      data,
      directory: this.baseDir,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }

  async readStagingSegment(snapshotId: string, segmentPath: string): Promise<string | null> {
    const rel = resolveSegmentRelativePath(segmentPath);
    return this.readTextFileSafely(`${STAGING_DIR}/${snapshotId}/${rel}`);
  }

  private async readActiveSegmentUnlocked(segmentPath: string): Promise<string | null> {
    const pointer = await this.readActivePointer();
    if (!pointer) return null;
    const rel = resolveSegmentRelativePath(segmentPath);
    return this.readTextFileSafely(`${SNAPSHOTS_DIR}/${pointer.snapshotId}/${rel}`);
  }

  private async listActiveSegmentsUnlocked(): Promise<string[]> {
    const pointer = await this.readActivePointer();
    if (!pointer) return [];
    try {
      const res = await Filesystem.readdir({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/segments`,
        directory: this.baseDir,
      });
      return (res.files || []).map((f) => `segments/${typeof f === 'string' ? f : f.name}`);
    } catch {
      return [];
    }
  }

  private async promoteStagingUnlocked(snapshotId: string): Promise<void> {
    const stagingSnapDir = `${STAGING_DIR}/${snapshotId}`;
    const targetSnapDir = `${SNAPSHOTS_DIR}/${snapshotId}`;

    const manifestData = await this.readTextFileSafely(`${stagingSnapDir}/manifest.json`);
    if (!manifestData) {
      throw new Error(`[STORAGE_PROMOTION_ERROR] manifest.json nÃ£o encontrado em staging para ${snapshotId}`);
    }
    const manifest = JSON.parse(manifestData) as ProvisioningManifest;

    // Never remove/overwrite the generation currently referenced by active.json.
    const currentPointer = await this.readActivePointer();
    if (currentPointer?.snapshotId === snapshotId) {
      throw new Error('[STORAGE_PROMOTION_ACTIVE_CONFLICT] Snapshot is already active; preserving its files.');
    }

    await this.ensureDir(SNAPSHOTS_DIR);

    // Tentativa 1: PromoÃ§Ã£o instantÃ¢nea via renomeaÃ§Ã£o atÃ´mica do diretÃ³rio (< 5ms)
    let renameSucceeded = false;
    try {
      try {
        await Filesystem.rmdir({
          path: targetSnapDir,
          directory: this.baseDir,
          recursive: true,
        });
      } catch {
        // Alvo ainda nÃ£o existia
      }

      await Filesystem.rename({
        from: stagingSnapDir,
        to: targetSnapDir,
        directory: this.baseDir,
        toDirectory: this.baseDir,
      });
      renameSucceeded = true;
    } catch (renameErr) {
      console.warn('[STORAGE_PROMOTION] Directory rename not available, falling back to copy:', renameErr);
    }

    if (renameSucceeded) {
      // CÃ³pia opcional do Ã­ndice compactado para raiz se gerado
      try {
        await Filesystem.copy({
          from: `${targetSnapDir}/compact-search-index-v2.bin`,
          to: `compact-search-index-v2.bin`,
          directory: this.baseDir,
          toDirectory: this.baseDir,
        });
      } catch {
        // opcional
      }

      // Atualização atômica do ponteiro para o snapshot promovido
      await this.writeActivePointerUnlocked(createActivePointer(manifest));
      console.log(`[STORAGE] staging_promoted: ${snapshotId}`);

      return;
    }

    // Tentativa 2 (Fallback): CÃ³pia pura de arquivos sem stat nem rehash
    await this.ensureDir(targetSnapDir);

    try {
      // 1. CÃ³pia do manifest e catalog.json
      await Filesystem.copy({
        from: `${stagingSnapDir}/manifest.json`,
        to: `${targetSnapDir}/manifest.json`,
        directory: this.baseDir,
        toDirectory: this.baseDir,
      });

      await Filesystem.copy({
        from: `${stagingSnapDir}/catalog.json`,
        to: `${targetSnapDir}/catalog.json`,
        directory: this.baseDir,
        toDirectory: this.baseDir,
      });

      // 2. Arquivos opcionais
      for (const optFile of ['search-index.json', 'compact-search-index-v2.bin', 'live_catalog.json']) {
        try {
          await Filesystem.copy({
            from: `${stagingSnapDir}/${optFile}`,
            to: `${targetSnapDir}/${optFile}`,
            directory: this.baseDir,
            toDirectory: this.baseDir,
          });
        } catch {
          // opcional
        }
      }
      try {
        await Filesystem.copy({
          from: `${stagingSnapDir}/compact-search-index-v2.bin`,
          to: `compact-search-index-v2.bin`,
          directory: this.baseDir,
          toDirectory: this.baseDir,
        });
      } catch {
        // opcional
      }

      // 3. CÃ³pia pura de segmentos sem stat redundante nem releitura/rehash
      const declaredSegments: CatalogSegmentEntry[] = Array.isArray((manifest as any).segments)
        ? (manifest as any).segments
        : [];

      if (declaredSegments.length > 0) {
        await this.ensureDir(`${targetSnapDir}/segments`);
        for (const seg of declaredSegments) {
          const rel = resolveSegmentRelativePath(seg.fileName);
          await Filesystem.copy({
            from: `${stagingSnapDir}/${rel}`,
            to: `${targetSnapDir}/${rel}`,
            directory: this.baseDir,
            toDirectory: this.baseDir,
          });
        }
      }

      // Atualização atômica do ponteiro
      await this.writeActivePointerUnlocked(createActivePointer(manifest));
      console.log(`[STORAGE] staging_promoted: ${snapshotId}`);
    } catch (err) {
      try {
        await Filesystem.rmdir({
          path: targetSnapDir,
          directory: this.baseDir,
          recursive: true,
        });
      } catch {
        // Ignora falha secundÃ¡ria de limpeza do target
      }
      throw err;
    }
  }

  private async readActiveCatalogUnlocked(): Promise<PrebuiltCatalog | null> {
    const pointer = await this.readActivePointer();
    if (!pointer) return null;

    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.convertFileSrc) {
        try {
          const stat = await Filesystem.getUri({
            path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/catalog.json`,
            directory: this.baseDir,
          });
          if (stat?.uri) {
            const webUrl = (window as any).Capacitor.convertFileSrc(stat.uri);
            const res = await fetch(webUrl);
            if (res.ok) {
              return (await res.json()) as PrebuiltCatalog;
            }
          }
        } catch {
          // Fallback para Filesystem.readFile
        }
      }

      const catalogFile = await Filesystem.readFile({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/catalog.json`,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
      if (typeof catalogFile.data !== 'string') return null;
      return JSON.parse(catalogFile.data) as PrebuiltCatalog;
    } catch {
      return null;
    }
  }

  private async readActiveManifestUnlocked(): Promise<ProvisioningManifest | null> {
    const pointer = await this.readActivePointer();
    if (!pointer) return null;

    try {
      const manifestFile = await Filesystem.readFile({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/manifest.json`,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
      if (typeof manifestFile.data !== 'string') return null;
      return JSON.parse(manifestFile.data) as ProvisioningManifest;
    } catch {
      return null;
    }
  }

  private async readActiveSearchIndexUnlocked(): Promise<PrebuiltSearchIndex | null> {
    const pointer = await this.readActivePointer();
    if (!pointer) return null;

    try {
      const indexFile = await Filesystem.readFile({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/search-index.json`,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
      if (typeof indexFile.data !== 'string') return null;
      return JSON.parse(indexFile.data) as PrebuiltSearchIndex;
    } catch {
      return null;
    }
  }

  private async readActiveSearchIndexBufferUnlocked(): Promise<Buffer | Uint8Array | null> {
    const pointer = await this.readActivePointer();
    if (!pointer) return null;
    return this.readBinaryFileSafely(
      `${SNAPSHOTS_DIR}/${pointer.snapshotId}/compact-search-index-v2.bin`
    );
  }

  private async writeActiveSearchIndexUnlocked(snapshotId: string, index: Buffer | Uint8Array): Promise<void> {
    await this.ensureDir(`${SNAPSHOTS_DIR}/${snapshotId}`);
    await this.writeBinaryFile(`${SNAPSHOTS_DIR}/${snapshotId}/compact-search-index-v2.bin`, index);
  }

  async cleanupStaging(snapshotId?: string): Promise<void> {
    try {
      if (snapshotId) {
        await Filesystem.rmdir({
          path: `${STAGING_DIR}/${snapshotId}`,
          directory: this.baseDir,
          recursive: true,
        });
      } else {
        await Filesystem.rmdir({
          path: STAGING_DIR,
          directory: this.baseDir,
          recursive: true,
        });
      }
    } catch {
      // Ignorar se jï¿½ nï¿½o existia
    }
  }

  private async hasActiveCatalogUnlocked(): Promise<boolean> {
    const pointer = await this.readActivePointer();
    if (!pointer) return false;
    try {
      const stat = await Filesystem.stat({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/catalog.json`,
        directory: this.baseDir,
      });
      return stat.size > 0;
    } catch {
      return false;
    }
  }

  async calculateActiveStorageSize(): Promise<number> {
    const pointer = await this.readActivePointer();
    if (!pointer) return 0;
    try {
      const manifest = await this.readActiveManifest();
      if (manifest?.catalogSizeBytes && manifest.catalogSizeBytes > 0) {
        return manifest.catalogSizeBytes;
      }
      if (Array.isArray((manifest as any)?.segments) && (manifest as any).segments.length > 0) {
        const segTotal = (manifest as any).segments.reduce((acc: number, s: any) => acc + (s.byteSize || 0), 0);
        if (segTotal > 0) return segTotal;
      }
      const catalogStat = await Filesystem.stat({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/catalog.json`,
        directory: this.baseDir,
      });
      return catalogStat.size || 0;
    } catch {
      return 0;
    }
  }
  async readRecoveryJournal(): Promise<RecoveryJournalData | null> {
    try {
      const result = await Filesystem.readFile({
        path: RECOVERY_JOURNAL_FILE,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
      if (!result.data || typeof result.data !== 'string') return null;
      return JSON.parse(result.data) as RecoveryJournalData;
    } catch {
      return null;
    }
  }

  private async writeRecoveryJournalUnlocked(journal: RecoveryJournalData): Promise<void> {
    await Filesystem.writeFile({
      path: RECOVERY_JOURNAL_FILE,
      data: JSON.stringify(journal, null, 2),
      directory: this.baseDir,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }

  private async readSnapshotUnlocked(snapshotId: string): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    searchIndex?: PrebuiltSearchIndex | null;
    searchIndexBuffer?: Buffer | Uint8Array | null;
    liveCatalog?: LiveCatalog | null;
  } | null> {
    const targetSnapDir = `${SNAPSHOTS_DIR}/${snapshotId}`;
    try {
      const manifestFile = await Filesystem.readFile({
        path: `${targetSnapDir}/manifest.json`,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
      const catalogFile = await Filesystem.readFile({
        path: `${targetSnapDir}/catalog.json`,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });

      if (typeof manifestFile.data !== 'string' || typeof catalogFile.data !== 'string') {
        return null;
      }

      const manifest = JSON.parse(manifestFile.data) as ProvisioningManifest;
      const catalog = JSON.parse(catalogFile.data) as PrebuiltCatalog;

      let searchIndex: PrebuiltSearchIndex | null = null;
      try {
        const indexFile = await Filesystem.readFile({
          path: `${targetSnapDir}/search-index.json`,
          directory: this.baseDir,
          encoding: Encoding.UTF8,
        });
        if (typeof indexFile.data === 'string') {
          searchIndex = JSON.parse(indexFile.data) as PrebuiltSearchIndex;
        }
      } catch {
        // search-index opcional para pacotes v1
      }

      const searchIndexBuffer = await this.readBinaryFileSafely(`${targetSnapDir}/compact-search-index-v2.bin`);

      let liveCatalog: LiveCatalog | null = null;
      try {
        const liveFile = await Filesystem.readFile({
          path: `${targetSnapDir}/live_catalog.json`,
          directory: this.baseDir,
          encoding: Encoding.UTF8,
        });
        if (typeof liveFile.data === 'string') {
          liveCatalog = JSON.parse(liveFile.data) as LiveCatalog;
        }
      } catch {
        // live_catalog opcional para snapshots sem Live.
      }

      return { manifest, catalog, searchIndex, searchIndexBuffer, liveCatalog };
    } catch {
      return null;
    }
  }
}

