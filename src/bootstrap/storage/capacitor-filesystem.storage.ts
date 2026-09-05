/**
 * Xandeflix Prebuilt — Capacitor Filesystem Catalog Storage
 *
 * Implementação de LocalCatalogStorage persistida em Directory.Data (app private storage).
 *
 * Princípios:
 * - APP_PRIVATE_STORAGE = SIM (Directory.Data privado do aplicativo)
 * - LOCAL_STORAGE_STRATEGY = CAPACITOR_FILESYSTEM_CANONICAL_JSON
 * - STAGING_GENERATION = prebuilt/staging/<snapshotId>/
 * - SNAPSHOT_GENERATION = prebuilt/snapshots/<snapshotId>/
 * - ACTIVE_POINTER = prebuilt/active.json
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { PrebuiltCatalog } from '../../contracts/catalog.ts';
import type { ProvisioningManifest } from '../../provisioning/types.ts';
import type { PrebuiltSearchIndex } from '../../search/search-index.types.ts';
import type { ActivePointer } from '../types.ts';
import type { LocalCatalogStorage } from './storage.interface.ts';
import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';

const PREBUILT_DIR = 'prebuilt';
const ACTIVE_POINTER_FILE = `${PREBUILT_DIR}/active.json`;
const RECOVERY_JOURNAL_FILE = `${PREBUILT_DIR}/recovery.json`;
const STAGING_DIR = `${PREBUILT_DIR}/staging`;
const SNAPSHOTS_DIR = `${PREBUILT_DIR}/snapshots`;

export class CapacitorFilesystemStorage implements LocalCatalogStorage {
  private baseDir = Directory.Data;

  private async ensureDir(path: string): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory: this.baseDir,
        recursive: true,
      });
    } catch {
      // Diretório já existente, ignorar erro
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

  async writeActivePointer(pointer: ActivePointer): Promise<void> {
    await this.ensureDir(PREBUILT_DIR);
    await Filesystem.writeFile({
      path: ACTIVE_POINTER_FILE,
      data: JSON.stringify(pointer, null, 2),
      directory: this.baseDir,
      encoding: Encoding.UTF8,
    });
  }

  async writeStaging(
    snapshotId: string,
    manifest: ProvisioningManifest,
    catalog: PrebuiltCatalog,
    searchIndex?: PrebuiltSearchIndex | null
  ): Promise<void> {
    const stagingSnapDir = `${STAGING_DIR}/${snapshotId}`;
    await this.ensureDir(stagingSnapDir);

    await Filesystem.writeFile({
      path: `${stagingSnapDir}/manifest.json`,
      data: JSON.stringify(manifest, null, 2),
      directory: this.baseDir,
      encoding: Encoding.UTF8,
    });

    await Filesystem.writeFile({
      path: `${stagingSnapDir}/catalog.json`,
      data: JSON.stringify(catalog, null, 2),
      directory: this.baseDir,
      encoding: Encoding.UTF8,
    });

    if (searchIndex) {
      await Filesystem.writeFile({
        path: `${stagingSnapDir}/search-index.json`,
        data: JSON.stringify(searchIndex, null, 2),
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
    }
  }

  async readStaging(
    snapshotId: string
  ): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    searchIndex?: PrebuiltSearchIndex | null;
  } | null> {
    const stagingSnapDir = `${STAGING_DIR}/${snapshotId}`;
    try {
      const manifestFile = await Filesystem.readFile({
        path: `${stagingSnapDir}/manifest.json`,
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
      const catalogFile = await Filesystem.readFile({
        path: `${stagingSnapDir}/catalog.json`,
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
          path: `${stagingSnapDir}/search-index.json`,
          directory: this.baseDir,
          encoding: Encoding.UTF8,
        });
        if (typeof indexFile.data === 'string') {
          searchIndex = JSON.parse(indexFile.data) as PrebuiltSearchIndex;
        }
      } catch {
        // search-index opcional para pacotes v1
      }

      return { manifest, catalog, searchIndex };
    } catch {
      return null;
    }
  }

  async promoteStaging(snapshotId: string): Promise<void> {
    const targetSnapDir = `${SNAPSHOTS_DIR}/${snapshotId}`;

    const stagingData = await this.readStaging(snapshotId);
    if (!stagingData) {
      throw new Error(`[STORAGE_PROMOTION_ERROR] Conteúdo de staging não encontrado para ${snapshotId}`);
    }

    await this.ensureDir(targetSnapDir);

    await Filesystem.writeFile({
      path: `${targetSnapDir}/manifest.json`,
      data: JSON.stringify(stagingData.manifest, null, 2),
      directory: this.baseDir,
      encoding: Encoding.UTF8,
    });

    await Filesystem.writeFile({
      path: `${targetSnapDir}/catalog.json`,
      data: JSON.stringify(stagingData.catalog, null, 2),
      directory: this.baseDir,
      encoding: Encoding.UTF8,
    });

    if (stagingData.searchIndex) {
      await Filesystem.writeFile({
        path: `${targetSnapDir}/search-index.json`,
        data: JSON.stringify(stagingData.searchIndex, null, 2),
        directory: this.baseDir,
        encoding: Encoding.UTF8,
      });
    }
  }

  async readActiveCatalog(): Promise<PrebuiltCatalog | null> {
    const pointer = await this.readActivePointer();
    if (!pointer) return null;

    try {
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

  async readActiveManifest(): Promise<ProvisioningManifest | null> {
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

  async readActiveSearchIndex(): Promise<PrebuiltSearchIndex | null> {
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
      // Ignorar se já não existia
    }
  }

  async hasActiveCatalog(): Promise<boolean> {
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
      const pointerStat = await Filesystem.stat({
        path: ACTIVE_POINTER_FILE,
        directory: this.baseDir,
      });
      const manifestStat = await Filesystem.stat({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/manifest.json`,
        directory: this.baseDir,
      });
      const catalogStat = await Filesystem.stat({
        path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/catalog.json`,
        directory: this.baseDir,
      });
      let indexSize = 0;
      try {
        const indexStat = await Filesystem.stat({
          path: `${SNAPSHOTS_DIR}/${pointer.snapshotId}/search-index.json`,
          directory: this.baseDir,
        });
        indexSize = indexStat.size || 0;
      } catch {
        // Sem índice no snapshot
      }

      return (pointerStat.size || 0) + (manifestStat.size || 0) + (catalogStat.size || 0) + indexSize;
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

  async writeRecoveryJournal(journal: RecoveryJournalData): Promise<void> {
    await this.ensureDir(PREBUILT_DIR);
    await Filesystem.writeFile({
      path: RECOVERY_JOURNAL_FILE,
      data: JSON.stringify(journal, null, 2),
      directory: this.baseDir,
      encoding: Encoding.UTF8,
    });
  }

  async readSnapshot(snapshotId: string): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    searchIndex?: PrebuiltSearchIndex | null;
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

      return { manifest, catalog, searchIndex };
    } catch {
      return null;
    }
  }
}
