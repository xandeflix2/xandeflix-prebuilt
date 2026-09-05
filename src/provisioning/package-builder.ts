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
import { validateNormalizedCatalog } from '../ingestion/validate.ts';
import {
  MANIFEST_FILENAME,
  CATALOG_FILENAME,
  SEARCH_INDEX_FILENAME,
  PACKAGE_FORMAT_VERSION_V2,
  type BuildPackageOptions,
  type BuildPackageResult,
} from './types.ts';
import { createManifest, serializeManifest } from './manifest.ts';
import { calculateSha256 } from './integrity.ts';
import { SearchIndexBuilder } from '../search/search-index-builder.ts';
import { SearchIndexValidator } from '../search/search-index-validator.ts';
import type { PrebuiltSearchIndex } from '../search/search-index.types.ts';

export class PackageBuilder {
  private searchIndexValidator = new SearchIndexValidator();
  private searchIndexBuilder = new SearchIndexBuilder();

  async build(
    catalog: PrebuiltCatalog,
    options?: BuildPackageOptions
  ): Promise<BuildPackageResult> {
    const startTime = Date.now();
    const errors: string[] = [];

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
    const catalogBuffer = Buffer.from(catalogJsonString, 'utf8');

    // 3. Processamento de SearchIndex se pacote v2
    const isV2 =
      options?.packageFormatVersion === PACKAGE_FORMAT_VERSION_V2 ||
      Boolean(options?.searchIndex || options?.searchIndexBuffer);

    let searchIndex: PrebuiltSearchIndex | undefined = options?.searchIndex;
    let searchIndexBuffer: Buffer | undefined = options?.searchIndexBuffer;

    if (isV2) {
      if (!searchIndex && !searchIndexBuffer) {
        // Constrói automaticamente o índice caso não tenha sido passado explicitamente
        searchIndex = this.searchIndexBuilder.build(catalog, {
          generator: options?.generator,
          deterministicGeneratedAt: options?.deterministicCreatedAt,
        });
      }

      if (searchIndex && !searchIndexBuffer) {
        const searchIndexJsonString = JSON.stringify(searchIndex, null, 2);
        searchIndexBuffer = Buffer.from(searchIndexJsonString, 'utf8');
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

    // 4. Geração do manifest.json canônico
    const manifest = createManifest(catalog, catalogBuffer, {
      ...options,
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

    if (isV2 && searchIndexBuffer) {
      zip.file(SEARCH_INDEX_FILENAME, searchIndexBuffer);
    }

    const compressionType = options?.compression === 'STORE' ? 'STORE' : 'DEFLATE';
    const packageBuffer: Buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: compressionType,
      compressionOptions: { level: 9 },
    });

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
