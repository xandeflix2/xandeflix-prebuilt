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
  type BuildPackageOptions,
  type BuildPackageResult,
} from './types.ts';
import { createManifest, serializeManifest } from './manifest.ts';

export class PackageBuilder {
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

    // 3. Geração do manifest.json canônico
    const manifest = createManifest(catalog, catalogBuffer, options);
    const manifestJsonString = serializeManifest(manifest);

    // 4. Empacotamento em ZIP
    // @ts-expect-error JSZip default export interoperability
    const ZipClass = JSZip.default || JSZip;
    const zip = new ZipClass();

    zip.file(MANIFEST_FILENAME, manifestJsonString);
    zip.file(CATALOG_FILENAME, catalogBuffer);

    const compressionType = options?.compression === 'STORE' ? 'STORE' : 'DEFLATE';
    const packageBuffer: Buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: compressionType,
      compressionOptions: { level: 9 },
    });

    // 5. Gravação opcional em disco temporário
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
    const compressionRatio = catalogSizeBytes > 0 ? Number((packageSizeBytes / catalogSizeBytes).toFixed(4)) : 1;

    return {
      success: true,
      packagePath,
      packageBuffer,
      manifest,
      catalog,
      catalogSizeBytes,
      packageSizeBytes,
      compressionRatio,
      packageContentHash: manifest.packageContentHash,
      catalogSha256: manifest.catalogSha256,
      snapshotId: manifest.snapshotId,
      catalogVersion: manifest.catalogVersion,
      durationMs: Date.now() - startTime,
      errors: [],
    };
  }
}
