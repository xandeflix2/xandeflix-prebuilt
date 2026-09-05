/**
 * Xandeflix Prebuilt — Delta Package Validator (Gate G9)
 *
 * Validador estrito, seguro e fail-closed de pacotes delta ZIP.
 *
 * Princípios:
 * - FAIL_CLOSED = SIM
 * - DELTA_UNKNOWN_FILES = REJECT
 * - DELTA_ZIP_PATH_TRAVERSAL_PROTECTION = REQUIRED
 * - DELTA_CONTENT_HASH_MATCH = PASS
 * - DELTA_SECRETS_EXPOSURE = NAO
 */

import fs from 'node:fs';
import JSZip from 'jszip';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import deltaManifestSchema from '../../schemas/prebuilt-delta-manifest.schema.json' with { type: 'json' };
import {
  DELTA_MANIFEST_FILENAME,
  CATALOG_DELTA_FILENAME,
  SEARCH_DELTA_FILENAME,
  type DeltaManifest,
} from './update.types.ts';
import { calculateSha256 } from '../provisioning/integrity.ts';
import { calculateDeltaContentHash } from './delta-manifest.ts';
import { CatalogDeltaValidator } from './catalog-delta-validator.ts';
import { SearchDeltaValidator } from './search-delta-validator.ts';
import type { CatalogDelta } from './catalog-delta.types.ts';
import type { SearchIndexDelta } from './search-delta.types.ts';

// @ts-expect-error Ajv default export interoperability
const AjvClass = Ajv2020.default || Ajv2020;
const ajv = new AjvClass({ allErrors: true, strict: false });
const addFormatsFn =
  (addFormats as unknown as { default?: (a: unknown) => void }).default ||
  addFormats;
addFormatsFn(ajv);

const validateManifestSchema = ajv.compile(deltaManifestSchema);

export interface ValidateDeltaPackageResult {
  valid: boolean;
  manifest?: DeltaManifest;
  catalogDelta?: CatalogDelta;
  searchDelta?: SearchIndexDelta;
  catalogDeltaSha256?: string;
  searchDeltaSha256?: string;
  deltaContentHash?: string;
  extractedFiles: string[];
  errors: string[];
  warnings: string[];
}

export class DeltaPackageValidator {
  private catalogDeltaValidator = new CatalogDeltaValidator();
  private searchDeltaValidator = new SearchDeltaValidator();

  async validate(packageSource: string | Buffer): Promise<ValidateDeltaPackageResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const extractedFiles: string[] = [];

    let zipBuffer: Buffer;
    if (typeof packageSource === 'string') {
      if (!fs.existsSync(packageSource)) {
        return {
          valid: false,
          errors: [`[FILE_NOT_FOUND] Pacote delta ZIP não encontrado: ${packageSource}`],
          warnings,
          extractedFiles,
        };
      }
      try {
        zipBuffer = fs.readFileSync(packageSource);
      } catch (err) {
        return {
          valid: false,
          errors: [`[FILE_READ_ERROR] Falha ao ler arquivo delta ZIP: ${(err as Error).message}`],
          warnings,
          extractedFiles,
        };
      }
    } else {
      zipBuffer = packageSource;
    }

    // 1. Carrega ZIP
    // @ts-expect-error JSZip default export interoperability
    const ZipClass = JSZip.default || JSZip;
    let zip: JSZip;
    try {
      zip = await ZipClass.loadAsync(zipBuffer);
    } catch (err) {
      return {
        valid: false,
        errors: [`[ZIP_CORRUPT] Falha ao descomprimir pacote delta ZIP: ${(err as Error).message}`],
        warnings,
        extractedFiles,
      };
    }

    // 2. Coleta arquivos e valida Path Traversal + Unknown Files
    const fileEntries = Object.keys(zip.files);
    for (const rawName of fileEntries) {
      extractedFiles.push(rawName);

      // Proteção contra Path Traversal
      if (
        rawName.includes('..') ||
        rawName.includes('\\') ||
        rawName.startsWith('/') ||
        /^[a-zA-Z]:/.test(rawName) ||
        rawName.includes('\0')
      ) {
        errors.push(`[PATH_TRAVERSAL_DETECTED] Entrada ZIP insegura detectada no delta: '${rawName}'`);
      }

      // Rejeição de arquivos desconhecidos
      if (
        rawName !== DELTA_MANIFEST_FILENAME &&
        rawName !== CATALOG_DELTA_FILENAME &&
        rawName !== SEARCH_DELTA_FILENAME
      ) {
        errors.push(`[EXTRA_DELTA_FILE_REJECTED] Arquivo não autorizado no pacote delta: '${rawName}'`);
      }
    }

    // 3. Confirmar arquivos obrigatórios mínimos
    if (!zip.file(DELTA_MANIFEST_FILENAME)) {
      errors.push(`[MISSING_DELTA_MANIFEST] Arquivo obrigatório '${DELTA_MANIFEST_FILENAME}' ausente no pacote delta`);
    }
    if (!zip.file(CATALOG_DELTA_FILENAME)) {
      errors.push(`[MISSING_CATALOG_DELTA] Arquivo obrigatório '${CATALOG_DELTA_FILENAME}' ausente no pacote delta`);
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings, extractedFiles };
    }

    // 4. Carregar e validar delta-manifest.json
    let manifest: DeltaManifest;
    try {
      const manifestStr = await zip.file(DELTA_MANIFEST_FILENAME)!.async('string');
      manifest = JSON.parse(manifestStr);
    } catch (err) {
      return {
        valid: false,
        errors: [`[INVALID_DELTA_MANIFEST_JSON] delta-manifest.json malformado: ${(err as Error).message}`],
        warnings,
        extractedFiles,
      };
    }

    const isManifestValid = validateManifestSchema(manifest);
    if (!isManifestValid) {
      for (const err of validateManifestSchema.errors || []) {
        errors.push(
          `[DELTA_MANIFEST_SCHEMA_ERROR] ${err.instancePath || '/'} ${err.message}`
        );
      }
      return { valid: false, errors, warnings, extractedFiles };
    }

    // 5. Validação de perfil SEARCH_ENABLED
    if (manifest.targetPackageProfile === 'SEARCH_ENABLED') {
      if (!zip.file(SEARCH_DELTA_FILENAME)) {
        errors.push(`[MISSING_SEARCH_DELTA] search-index-delta.json ausente no pacote com perfil SEARCH_ENABLED`);
      }
    }

    // 6. Carregar e validar catalog-delta.json
    let catalogDelta: CatalogDelta;
    let catalogDeltaBuffer: Buffer;
    try {
      const cdStr = await zip.file(CATALOG_DELTA_FILENAME)!.async('string');
      catalogDeltaBuffer = Buffer.from(cdStr, 'utf8');
      catalogDelta = JSON.parse(cdStr);
    } catch (err) {
      return {
        valid: false,
        errors: [`[INVALID_CATALOG_DELTA_JSON] catalog-delta.json malformado: ${(err as Error).message}`],
        warnings,
        extractedFiles,
      };
    }

    // Verificação de hash do catalog-delta.json
    const computedCatalogDeltaSha256 = calculateSha256(catalogDeltaBuffer);
    if (computedCatalogDeltaSha256 !== manifest.catalogDeltaSha256) {
      errors.push(
        `[CATALOG_DELTA_HASH_MISMATCH_REJECTED] Hash SHA-256 do catalog-delta.json ('${computedCatalogDeltaSha256}') diverge do manifest ('${manifest.catalogDeltaSha256}')`
      );
    }

    // Validação estrutural do catalog-delta
    const catalogDeltaVal = this.catalogDeltaValidator.validate(catalogDelta, {
      expectedBaseSnapshotId: manifest.baseSnapshotId,
      expectedBaseCatalogVersion: manifest.baseCatalogVersion,
      expectedTargetSnapshotId: manifest.targetSnapshotId,
      expectedTargetCatalogVersion: manifest.targetCatalogVersion,
    });
    if (!catalogDeltaVal.valid) {
      for (const err of catalogDeltaVal.errors) {
        errors.push(`[CATALOG_DELTA_VALIDATION_ERROR] ${err}`);
      }
    }

    // 7. Se SEARCH_ENABLED, carregar e validar search-index-delta.json
    let searchDelta: SearchIndexDelta | undefined;
    let searchDeltaBuffer: Buffer | undefined;
    let computedSearchDeltaSha256: string | undefined;

    if (manifest.targetPackageProfile === 'SEARCH_ENABLED' && zip.file(SEARCH_DELTA_FILENAME)) {
      try {
        const sdStr = await zip.file(SEARCH_DELTA_FILENAME)!.async('string');
        searchDeltaBuffer = Buffer.from(sdStr, 'utf8');
        searchDelta = JSON.parse(sdStr);
      } catch (err) {
        errors.push(`[INVALID_SEARCH_DELTA_JSON] search-index-delta.json malformado: ${(err as Error).message}`);
      }

      if (searchDeltaBuffer && searchDelta) {
        computedSearchDeltaSha256 = calculateSha256(searchDeltaBuffer);
        if (computedSearchDeltaSha256 !== manifest.searchDeltaSha256) {
          errors.push(
            `[SEARCH_DELTA_HASH_MISMATCH_REJECTED] Hash SHA-256 do search-index-delta.json ('${computedSearchDeltaSha256}') diverge do manifest ('${manifest.searchDeltaSha256}')`
          );
        }

        const searchDeltaVal = this.searchDeltaValidator.validate(searchDelta, {
          expectedBaseSnapshotId: manifest.baseSnapshotId,
          expectedBaseCatalogVersion: manifest.baseCatalogVersion,
          expectedTargetSnapshotId: manifest.targetSnapshotId,
          expectedTargetCatalogVersion: manifest.targetCatalogVersion,
        });
        if (!searchDeltaVal.valid) {
          for (const err of searchDeltaVal.errors) {
            errors.push(`[SEARCH_DELTA_VALIDATION_ERROR] ${err}`);
          }
        }
      }
    }

    // 8. Verificação do hash lógico do delta (deltaContentHash)
    const computedDeltaContentHash = calculateDeltaContentHash({
      deltaFormatVersion: manifest.deltaFormatVersion,
      baseSnapshotId: manifest.baseSnapshotId,
      targetSnapshotId: manifest.targetSnapshotId,
      baseCatalogVersion: manifest.baseCatalogVersion,
      targetCatalogVersion: manifest.targetCatalogVersion,
      baseCatalogSha256: manifest.baseCatalogSha256,
      targetCatalogSha256: manifest.targetCatalogSha256,
      catalogDeltaFile: manifest.catalogDeltaFile,
      catalogDeltaSha256: manifest.catalogDeltaSha256,
      catalogDeltaSizeBytes: manifest.catalogDeltaSizeBytes,
      targetPackageProfile: manifest.targetPackageProfile,
      searchDeltaFile: manifest.searchDeltaFile,
      baseSearchIndexContentHash: manifest.baseSearchIndexContentHash,
      targetSearchIndexContentHash: manifest.targetSearchIndexContentHash,
      searchDeltaSha256: manifest.searchDeltaSha256,
      searchDeltaSizeBytes: manifest.searchDeltaSizeBytes,
      targetSearchIndexSha256: manifest.targetSearchIndexSha256,
    });

    if (computedDeltaContentHash !== manifest.deltaContentHash) {
      errors.push(
        `[DELTA_CONTENT_HASH_MISMATCH_REJECTED] deltaContentHash calculado ('${computedDeltaContentHash}') diverge do manifest ('${manifest.deltaContentHash}')`
      );
    }

    // 9. Auditoria de ausência de segredos e credenciais reais (DELTA_SECRETS_EXPOSURE=NAO)
    const serializedForAudit = JSON.stringify({ manifest, catalogDelta, searchDelta });
    const secretPatterns = [
      /service_role/i,
      /password\s*[:=]\s*["'][^"']+["']/i,
      /https?:\/\/[a-zA-Z0-9_-]+:[^/@]+@/, // URL com credenciais embutidas
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(serializedForAudit)) {
        errors.push(`[DELTA_SECRETS_EXPOSURE] Padrão de credencial ou segredo sensível detectado no payload do delta`);
      }
    }

    return {
      valid: errors.length === 0,
      manifest,
      catalogDelta,
      searchDelta,
      catalogDeltaSha256: computedCatalogDeltaSha256,
      searchDeltaSha256: computedSearchDeltaSha256,
      deltaContentHash: computedDeltaContentHash,
      extractedFiles,
      errors,
      warnings,
    };
  }
}
