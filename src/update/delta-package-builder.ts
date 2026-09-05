/**
 * Xandeflix Prebuilt — Delta Package Builder (Gate G9)
 *
 * Constrói o pacote ZIP delta canônico e determinístico externamente.
 *
 * Estrutura:
 * - delta-manifest.json
 * - catalog-delta.json
 * - search-index-delta.json (quando targetPackageProfile = SEARCH_ENABLED)
 *
 * Princípios:
 * - DELTA_PACKAGE_FORMAT_VERSION = 1
 * - DELTA_GENERATION = EXTERNAL_PREBUILT
 * - DELTA_DETERMINISTIC = SIM
 */

import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import type { PrebuiltSearchIndex } from '../search/search-index.types.ts';
import { CatalogDeltaBuilder } from './catalog-delta-builder.ts';
import { SearchDeltaBuilder } from './search-delta-builder.ts';
import { calculateSha256 } from '../provisioning/integrity.ts';
import {
  DELTA_MANIFEST_FILENAME,
  CATALOG_DELTA_FILENAME,
  SEARCH_DELTA_FILENAME,
  type DeltaManifest,
  type TargetPackageProfile,
} from './update.types.ts';
import { createDeltaManifest, serializeDeltaManifest } from './delta-manifest.ts';
import type { CatalogDelta } from './catalog-delta.types.ts';
import type { SearchIndexDelta } from './search-delta.types.ts';

export interface BuildDeltaPackageOptions {
  generator?: string;
  deterministicGeneratedAt?: string;
  outputPath?: string;
}

export interface BuildDeltaPackageResult {
  success: boolean;
  zipBuffer: Buffer;
  manifest: DeltaManifest;
  catalogDelta: CatalogDelta;
  searchDelta?: SearchIndexDelta;
  deltaContentHash: string;
  packageSizeBytes: number;
  catalogDeltaSizeBytes: number;
  searchDeltaSizeBytes?: number;
  durationMs: number;
  errors: string[];
}

export class DeltaPackageBuilder {
  private catalogDeltaBuilder = new CatalogDeltaBuilder();
  private searchDeltaBuilder = new SearchDeltaBuilder();

  async build(
    baseCatalog: PrebuiltCatalog,
    targetCatalog: PrebuiltCatalog,
    baseSearchIndex?: PrebuiltSearchIndex | null,
    targetSearchIndex?: PrebuiltSearchIndex | null,
    options?: BuildDeltaPackageOptions
  ): Promise<BuildDeltaPackageResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    // 1. Gera CatalogDelta
    const catalogDelta = this.catalogDeltaBuilder.build(baseCatalog, targetCatalog);
    const serializedCatalogDelta = JSON.stringify(catalogDelta, null, 2);
    const catalogDeltaBuffer = Buffer.from(serializedCatalogDelta, 'utf8');
    const catalogDeltaSha256 = calculateSha256(catalogDeltaBuffer);
    const catalogDeltaSizeBytes = catalogDeltaBuffer.length;

    // 2. Calcula SHA-256 dos catálogos base e target
    const baseCatalogBuffer = Buffer.from(JSON.stringify(baseCatalog, null, 2), 'utf8');
    const baseCatalogSha256 = calculateSha256(baseCatalogBuffer);

    const targetCatalogBuffer = Buffer.from(JSON.stringify(targetCatalog, null, 2), 'utf8');
    const targetCatalogSha256 = calculateSha256(targetCatalogBuffer);

    // 3. Determina perfil (CATALOG_ONLY vs SEARCH_ENABLED)
    let targetPackageProfile: TargetPackageProfile = 'CATALOG_ONLY';
    let searchDelta: SearchIndexDelta | undefined;
    let serializedSearchDelta: string | undefined;
    let searchDeltaBuffer: Buffer | undefined;
    let searchDeltaSha256: string | undefined;
    let searchDeltaSizeBytes: number | undefined;
    let targetSearchIndexSha256: string | undefined;

    if (baseSearchIndex && targetSearchIndex) {
      targetPackageProfile = 'SEARCH_ENABLED';
      searchDelta = this.searchDeltaBuilder.build(baseSearchIndex, targetSearchIndex);
      serializedSearchDelta = JSON.stringify(searchDelta, null, 2);
      searchDeltaBuffer = Buffer.from(serializedSearchDelta, 'utf8');
      searchDeltaSha256 = calculateSha256(searchDeltaBuffer);
      searchDeltaSizeBytes = searchDeltaBuffer.length;

      const targetIndexBuffer = Buffer.from(JSON.stringify(targetSearchIndex, null, 2), 'utf8');
      targetSearchIndexSha256 = calculateSha256(targetIndexBuffer);
    }

    // 4. Constrói DeltaManifest determinístico
    const manifest = createDeltaManifest({
      baseSnapshotId: baseCatalog.metadata.snapshotId,
      targetSnapshotId: targetCatalog.metadata.snapshotId,
      baseCatalogVersion: baseCatalog.metadata.catalogVersion,
      targetCatalogVersion: targetCatalog.metadata.catalogVersion,
      baseCatalogSha256,
      targetCatalogSha256,
      catalogDeltaSha256,
      catalogDeltaSizeBytes,
      targetPackageProfile,
      searchDeltaFile: targetPackageProfile === 'SEARCH_ENABLED' ? 'search-index-delta.json' : undefined,
      baseSearchIndexContentHash: baseSearchIndex?.contentHash,
      targetSearchIndexContentHash: targetSearchIndex?.contentHash,
      searchDeltaSha256,
      searchDeltaSizeBytes,
      targetSearchIndexSha256,
      generator: options?.generator,
      deterministicGeneratedAt: options?.deterministicGeneratedAt,
    });

    const serializedManifest = serializeDeltaManifest(manifest);

    // 5. Empacotamento ZIP determinístico com JSZip
    // @ts-expect-error JSZip default export interoperability
    const ZipClass = JSZip.default || JSZip;
    const zip = new ZipClass();

    // Data fixa para determinismo do ZIP se especificado
    const zipFileOptions: { date?: Date } = {};
    if (options?.deterministicGeneratedAt) {
      zipFileOptions.date = new Date(options.deterministicGeneratedAt);
    } else {
      // Data padrão fixa 2026-01-01 para garantir determinismo binário
      zipFileOptions.date = new Date('2026-01-01T00:00:00.000Z');
    }

    zip.file(DELTA_MANIFEST_FILENAME, serializedManifest, zipFileOptions);
    zip.file(CATALOG_DELTA_FILENAME, serializedCatalogDelta, zipFileOptions);

    if (targetPackageProfile === 'SEARCH_ENABLED' && serializedSearchDelta) {
      zip.file(SEARCH_DELTA_FILENAME, serializedSearchDelta, zipFileOptions);
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // 6. Persistência em disco se outputPath configurado
    if (options?.outputPath) {
      const dir = path.dirname(options.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(options.outputPath, zipBuffer);
    }

    return {
      success: true,
      zipBuffer,
      manifest,
      catalogDelta,
      searchDelta,
      deltaContentHash: manifest.deltaContentHash,
      packageSizeBytes: zipBuffer.length,
      catalogDeltaSizeBytes,
      searchDeltaSizeBytes,
      durationMs: Date.now() - startTime,
      errors,
    };
  }
}
