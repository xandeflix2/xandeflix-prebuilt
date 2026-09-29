/**
 * Xandeflix Prebuilt — Provisioning Package Builder
 *
 * Constrói artefatos de provisionamento ZIP a partir de um PrebuiltCatalog v1 válido.
 *
 * Princípios:
 * - FAIL_CLOSED=SIM (rejeita catálogo inválido antes do empacotamento)
 * - IMMUTABILITY=SIM (pacote autocontido e verificável)
 * - OUTPUT_FORMAT=ZIP contendo manifest.json + catalog.json
 */

import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import { validateLiveCatalog } from '../catalog/live/live-catalog-validation.ts';
import { validateNormalizedCatalog } from '../ingestion/validate.ts';
import {
  MANIFEST_FILENAME,
  CATALOG_FILENAME,
  SEARCH_INDEX_FILENAME,
  COMPACT_SEARCH_INDEX_FILENAME,
  LIVE_CATALOG_FILENAME,
  PACKAGE_FORMAT_VERSION_V2,
  type BuildPackageOptions,
  type BuildPackageResult,
} from './types.ts';
import { createManifest, serializeManifest } from './manifest.ts';
import { calculateSha256, calculateSha256Async } from './integrity.ts';
import { SearchIndexBuilder } from '../search/search-index-builder.ts';
import { SearchIndexValidator } from '../search/search-index-validator.ts';
import type { PrebuiltSearchIndex } from '../search/search-index.types.ts';
import { COMPACT_SEARCH_INDEX_V2_MAGIC } from '../experiments/search-compact-v2/compact-search-v2.types.ts';
import { deserializeCompactIndexV2 } from '../experiments/search-compact-v2/compact-search-v2-serializer.ts';

export class PackageBuilder {
  private searchIndexValidator = new SearchIndexValidator();
  private searchIndexBuilder = new SearchIndexBuilder();

  async build(
    catalog: PrebuiltCatalog,
    options?: BuildPackageOptions
  ): Promise<BuildPackageResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    const containsSensitiveRuntimeLocator = catalog.streams.some(
      (stream) => typeof stream.directStreamUrl === 'string' && stream.directStreamUrl.trim().length > 0,
    );
    if (containsSensitiveRuntimeLocator && options?.allowSensitiveRuntimeLocators !== true) {
      return {
        success: false,
        catalogSizeBytes: 0,
        packageSizeBytes: 0,
        compressionRatio: 0,
        packageContentHash: '',
        catalogSha256: '',
        snapshotId: catalog.metadata?.snapshotId || '',
        catalogVersion: catalog.metadata?.catalogVersion || '',
        durationMs: Date.now() - startTime,
        errors: ['[PRIVATE_RUNTIME_LOCATOR_EXPORT_FORBIDDEN] Locators diretos exigem staging privado autorizado.'],
      };
    }

    // 1. Validação estrita pré-build contra contrato de dados v1
    const validation = validateNormalizedCatalog(catalog);
    if (!validation.valid) {
      for (const err of validation.errors) {
        errors.push(`[CATALOG_PRE_BUILD_VALIDATION_ERROR] ${err}`);
      }
      return {
        success: false,
        catalogSizeBytes: 0,
        packageSizeBytes: 0,
        compressionRatio: 0,
        packageContentHash: '',
        catalogSha256: '',
        snapshotId: catalog.metadata?.snapshotId || '',
        catalogVersion: catalog.metadata?.catalogVersion || '',
        durationMs: Date.now() - startTime,
        errors,
      };
    }

    // 2. Serialização determinística de catalog.json
    const catalogJsonString = JSON.stringify(catalog, null, 2);
    const u8Catalog = new TextEncoder().encode(catalogJsonString);
    const catalogBuffer = Buffer.from(u8Catalog.buffer, u8Catalog.byteOffset, u8Catalog.byteLength);

    // 3. Processamento de SearchIndex se pacote v2
    const isV2 =
      options?.packageFormatVersion === PACKAGE_FORMAT_VERSION_V2 ||
      Boolean(options?.searchIndex || options?.searchIndexBuffer);

    let liveCatalogBuffer: Buffer | undefined;
    if (options?.liveCatalog) {
      if (!isV2) {
        errors.push('[LIVE_CATALOG_REQUIRES_PACKAGE_V2] liveCatalog exige packageFormatVersion v2');
        return {
          success: false,
          catalogSizeBytes: catalogBuffer.length,
          packageSizeBytes: 0,
          compressionRatio: 0,
          packageContentHash: '',
          catalogSha256: calculateSha256(catalogBuffer),
          snapshotId: catalog.metadata?.snapshotId || '',
          catalogVersion: catalog.metadata?.catalogVersion || '',
          durationMs: Date.now() - startTime,
          errors,
        };
      }

      const liveValidation = validateLiveCatalog(options.liveCatalog, {
        expectedSnapshotId: catalog.metadata.snapshotId,
      });
      if (!liveValidation.valid) {
        for (const err of liveValidation.errors) {
          errors.push(`[LIVE_CATALOG_PRE_BUILD_VALIDATION_ERROR] ${err}`);
        }
        return {
          success: false,
          catalogSizeBytes: catalogBuffer.length,
          packageSizeBytes: 0,
          compressionRatio: 0,
          packageContentHash: '',
          catalogSha256: calculateSha256(catalogBuffer),
          snapshotId: catalog.metadata?.snapshotId || '',
          catalogVersion: catalog.metadata?.catalogVersion || '',
          durationMs: Date.now() - startTime,
          errors,
        };
      }
      const u8Live = new TextEncoder().encode(JSON.stringify(options.liveCatalog, null, 2));
      liveCatalogBuffer = Buffer.from(u8Live.buffer, u8Live.byteOffset, u8Live.byteLength);
    }

    let searchIndex: PrebuiltSearchIndex | undefined = options?.searchIndex;
    let searchIndexBuffer: Buffer | undefined = options?.searchIndexBuffer
      ? Buffer.isBuffer(options.searchIndexBuffer)
        ? options.searchIndexBuffer
        : Buffer.from(options.searchIndexBuffer)
      : undefined;

    if (isV2) {
      const isCompactV2 = Boolean(
        searchIndexBuffer &&
        searchIndexBuffer.length >= 4 &&
        searchIndexBuffer.readUInt32LE(0) === COMPACT_SEARCH_INDEX_V2_MAGIC
      );

      if (!searchIndex && !searchIndexBuffer) {
        // Constrói automaticamente o índice caso não tenha sido passado explicitamente
        searchIndex = this.searchIndexBuilder.build(catalog, {
          generator: options?.generator,
          deterministicGeneratedAt: options?.deterministicCreatedAt,
        });
      }

      if (isCompactV2 && searchIndexBuffer) {
        let compact;
        try {
          compact = deserializeCompactIndexV2(searchIndexBuffer);
        } catch (err) {
          errors.push(`[COMPACT_SEARCH_INDEX_PARSE_ERROR] Falha ao desserializar compact search index v2: ${(err as Error).message}`);
          return {
            success: false,
            catalogSizeBytes: catalogBuffer.length,
            packageSizeBytes: 0,
            compressionRatio: 0,
            packageContentHash: '',
            catalogSha256: calculateSha256(catalogBuffer),
            snapshotId: catalog.metadata?.snapshotId || '',
            catalogVersion: catalog.metadata?.catalogVersion || '',
            durationMs: Date.now() - startTime,
            errors,
          };
        }
        if (compact.metadata.catalogSnapshotId !== catalog.metadata.snapshotId) {
          errors.push(
            `[SEARCH_INDEX_SNAPSHOT_MISMATCH] SnapshotId no compact search index V2 (${compact.metadata.catalogSnapshotId}) diverge do catálogo (${catalog.metadata.snapshotId})`
          );
          return {
            success: false,
            catalogSizeBytes: catalogBuffer.length,
            packageSizeBytes: 0,
            compressionRatio: 0,
            packageContentHash: '',
            catalogSha256: calculateSha256(catalogBuffer),
            snapshotId: catalog.metadata?.snapshotId || '',
            catalogVersion: catalog.metadata?.catalogVersion || '',
            durationMs: Date.now() - startTime,
            errors,
          };
        }
      } else {
        if (searchIndex && !searchIndexBuffer) {
          const searchIndexJsonString = JSON.stringify(searchIndex, null, 2);
          const u8Index = new TextEncoder().encode(searchIndexJsonString);
          searchIndexBuffer = Buffer.from(u8Index.buffer, u8Index.byteOffset, u8Index.byteLength);
        } else if (searchIndexBuffer && !searchIndex) {
          try {
            searchIndex = JSON.parse(searchIndexBuffer.toString('utf8')) as PrebuiltSearchIndex;
          } catch (err) {
            errors.push(`[SEARCH_INDEX_PARSE_ERROR] Falha ao parsear searchIndexBuffer: ${(err as Error).message}`);
            return {
              success: false,
              catalogSizeBytes: catalogBuffer.length,
              packageSizeBytes: 0,
              compressionRatio: 0,
              packageContentHash: '',
              catalogSha256: calculateSha256(catalogBuffer),
              snapshotId: catalog.metadata?.snapshotId || '',
              catalogVersion: catalog.metadata?.catalogVersion || '',
              durationMs: Date.now() - startTime,
              errors,
            };
          }
        }

        // Validação estrita do search-index antes do empacotamento
        if (searchIndex) {
          const indexValidation = this.searchIndexValidator.validate(searchIndex, {
            expectedSnapshotId: catalog.metadata.snapshotId,
            expectedCatalogVersion: catalog.metadata.catalogVersion,
          });
          if (!indexValidation.valid) {
            for (const err of indexValidation.errors) {
              errors.push(`[SEARCH_INDEX_PRE_BUILD_VALIDATION_ERROR] ${err}`);
            }
            return {
              success: false,
              catalogSizeBytes: catalogBuffer.length,
              packageSizeBytes: 0,
              compressionRatio: 0,
              packageContentHash: '',
              catalogSha256: calculateSha256(catalogBuffer),
              snapshotId: catalog.metadata?.snapshotId || '',
              catalogVersion: catalog.metadata?.catalogVersion || '',
              durationMs: Date.now() - startTime,
              errors,
            };
          }
        }
      }
    }

    // 4. Geração do manifest.json canônico
    const catalogSha256 = await calculateSha256Async(catalogBuffer);
    const manifest = createManifest(catalog, catalogBuffer, {
      ...options,
      catalogSha256,
      packageFormatVersion: isV2 ? PACKAGE_FORMAT_VERSION_V2 : 1,
      searchIndex,
      searchIndexBuffer,
    });
    const manifestJsonString = serializeManifest(manifest);

    // 5. Empacotamento em ZIP
    // @ts-expect-error JSZip default export interoperability
    const ZipClass = JSZip.default || JSZip;
    const zip = new ZipClass();

    zip.file(MANIFEST_FILENAME, manifestJsonString);
    zip.file(CATALOG_FILENAME, catalogBuffer);

    const isCompactV2Package = Boolean(
      searchIndexBuffer &&
      searchIndexBuffer.length >= 4 &&
      searchIndexBuffer.readUInt32LE(0) === COMPACT_SEARCH_INDEX_V2_MAGIC
    );
    const searchFileName = isCompactV2Package
      ? COMPACT_SEARCH_INDEX_FILENAME
      : SEARCH_INDEX_FILENAME;

    if (isV2 && searchIndexBuffer) {
      zip.file(searchFileName, searchIndexBuffer);
    }

    if (liveCatalogBuffer) {
      zip.file(LIVE_CATALOG_FILENAME, liveCatalogBuffer);
    }

    const compressionType = options?.compression === 'STORE' ? 'STORE' : 'DEFLATE';
    let packageBuffer: Buffer;
    try {
      packageBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: compressionType,
        compressionOptions: { level: 9 },
      });
    } catch {
      const u8: Uint8Array = await zip.generateAsync({
        type: 'uint8array',
        compression: compressionType,
        compressionOptions: { level: 9 },
      });
      packageBuffer = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
    }

    // 6. Gravação opcional em disco temporário
    let packagePath: string | undefined;
    if (options?.outputPath) {
      try {
        packagePath = path.resolve(options.outputPath);
        const dir = path.dirname(packagePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(packagePath, packageBuffer);
      } catch (err) {
        errors.push(`[PACKAGE_WRITE_ERROR] Falha ao persistir pacote ZIP: ${(err as Error).message}`);
        return {
          success: false,
          catalogSizeBytes: catalogBuffer.length,
          packageSizeBytes: packageBuffer.length,
          compressionRatio: 0,
          packageContentHash: manifest.packageContentHash,
          catalogSha256: manifest.catalogSha256,
          snapshotId: manifest.snapshotId,
          catalogVersion: manifest.catalogVersion,
          durationMs: Date.now() - startTime,
          errors,
        };
      }
    }

    const catalogSizeBytes = catalogBuffer.length;
    const packageSizeBytes = packageBuffer.length;
    const compressionRatio =
      catalogSizeBytes > 0 ? Number((packageSizeBytes / catalogSizeBytes).toFixed(4)) : 1;

    return {
      success: true,
      packagePath,
      packageBuffer,
      manifest,
      catalog,
      searchIndex,
      liveCatalog: options?.liveCatalog,
      catalogSizeBytes,
      searchIndexSizeBytes: searchIndexBuffer ? searchIndexBuffer.length : undefined,
      packageSizeBytes,
      compressionRatio,
      packageContentHash: manifest.packageContentHash,
      catalogSha256: manifest.catalogSha256,
      searchIndexSha256: 'searchIndexSha256' in manifest ? manifest.searchIndexSha256 : undefined,
      snapshotId: manifest.snapshotId,
      catalogVersion: manifest.catalogVersion,
      durationMs: Date.now() - startTime,
      errors: [],
    };
  }
}
