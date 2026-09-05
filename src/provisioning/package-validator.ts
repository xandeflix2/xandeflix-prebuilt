/**
 * Xandeflix Prebuilt — Provisioning Package Validator
 *
 * Validador estrito e auditável de pacotes de provisionamento (G4 / G7).
 *
 * Princípios de aceitação:
 * - FAIL_CLOSED=SIM (qualquer divergência gera erro fatal)
 * - UNKNOWN_PACKAGE_FILES=REJECT (v1: manifest + catalog; v2: manifest + catalog + search-index)
 * - ZIP_PATH_TRAVERSAL_PROTECTION=PASS (rejeita .., \, caminhos absolutos, drive letters)
 * - INTEGRIDADE: catalogSha256, searchIndexSha256, packageContentHash
 * - CONSISTÊNCIA DE SNAPSHOT: snapshotId, catalogVersion, schemaVersion
 * - CONFORMIDADE G2: validação do catalog.json via validateNormalizedCatalog
 * - AUDITORIA DE SEGURANÇA: ausência de segredos no pacote
 */

import fs from 'node:fs';
import JSZip from 'jszip';
import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import { validateNormalizedCatalog } from '../ingestion/validate.ts';
import {
  PACKAGE_FORMAT_VERSION_V1,
  PACKAGE_FORMAT_VERSION_V2,
  SCHEMA_VERSION,
  MANIFEST_FILENAME,
  CATALOG_FILENAME,
  SEARCH_INDEX_FILENAME,
  type ProvisioningManifest,
  type ProvisioningManifestV2,
  type PackageValidationResult,
} from './types.ts';
import { calculateSha256, calculatePackageContentHash, verifyChecksum } from './integrity.ts';
import { SearchIndexValidator } from '../search/search-index-validator.ts';
import type { PrebuiltSearchIndex } from '../search/search-index.types.ts';

export interface ValidatePackageDetailedResult extends PackageValidationResult {
  catalog?: PrebuiltCatalog;
  searchIndex?: PrebuiltSearchIndex;
  catalogSha256?: string;
  searchIndexSha256?: string;
  packageContentHash?: string;
  extractedFiles: string[];
}

export class PackageValidator {
  private searchIndexValidator = new SearchIndexValidator();

  /**
   * Valida um pacote de provisionamento a partir de um arquivo em disco ou Buffer em memória.
   */
  async validate(packageSource: string | Buffer): Promise<ValidatePackageDetailedResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const extractedFiles: string[] = [];

    let zipBuffer: Buffer;
    if (typeof packageSource === 'string') {
      if (!fs.existsSync(packageSource)) {
        return {
          valid: false,
          errors: [`[FILE_NOT_FOUND] Pacote ZIP não encontrado no caminho: ${packageSource}`],
          warnings,
          extractedFiles,
        };
      }
      try {
        zipBuffer = fs.readFileSync(packageSource);
      } catch (err) {
        return {
          valid: false,
          errors: [`[FILE_READ_ERROR] Falha ao ler arquivo ZIP: ${(err as Error).message}`],
          warnings,
          extractedFiles,
        };
      }
    } else {
      zipBuffer = packageSource;
    }

    // 1. Carregar arquivo ZIP
    // @ts-expect-error JSZip default export interoperability
    const ZipClass = JSZip.default || JSZip;
    let zip: JSZip;
    try {
      zip = await ZipClass.loadAsync(zipBuffer);
    } catch (err) {
      return {
        valid: false,
        errors: [`[ZIP_CORRUPT] Falha ao descomprimir arquivo ZIP: ${(err as Error).message}`],
        warnings,
        extractedFiles,
      };
    }

    // 2. Coletar arquivos presentes e auditar Path Traversal e arquivos inesperados
    const fileEntries = Object.keys(zip.files);

    for (const rawName of fileEntries) {
      extractedFiles.push(rawName);

      // Proteção estrita contra Path Traversal
      if (
        rawName.includes('..') ||
        rawName.includes('\\') ||
        rawName.startsWith('/') ||
        /^[a-zA-Z]:/.test(rawName) ||
        rawName.includes('\0')
      ) {
        errors.push(`[PATH_TRAVERSAL_DETECTED] Entrada ZIP insegura detectada: '${rawName}'`);
      }

      // Política de arquivos desconhecidos: UNKNOWN_PACKAGE_FILES=REJECT
      if (
        rawName !== MANIFEST_FILENAME &&
        rawName !== CATALOG_FILENAME &&
        rawName !== SEARCH_INDEX_FILENAME
      ) {
        errors.push(`[EXTRA_FILE_REJECTED] Arquivo não autorizado no pacote de provisionamento: '${rawName}'`);
      }
    }

    // 3. Confirmar presença exata dos arquivos obrigatórios base
    if (!zip.file(MANIFEST_FILENAME)) {
      errors.push(`[MISSING_MANIFEST] Arquivo obrigatório '${MANIFEST_FILENAME}' ausente no pacote ZIP`);
    }
    if (!zip.file(CATALOG_FILENAME)) {
      errors.push(`[MISSING_CATALOG] Arquivo obrigatório '${CATALOG_FILENAME}' ausente no pacote ZIP`);
    }

    // Se houve erros estruturais preliminares, falhar fechado
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
        extractedFiles,
      };
    }

    // 4. Carregar e validar manifest.json
    let manifest: ProvisioningManifest;
    try {
      const manifestText = await zip.file(MANIFEST_FILENAME)!.async('text');
      manifest = JSON.parse(manifestText) as ProvisioningManifest;
    } catch (err) {
      return {
        valid: false,
        errors: [`[INVALID_MANIFEST_JSON] Falha ao analisar ${MANIFEST_FILENAME}: ${(err as Error).message}`],
        warnings,
        extractedFiles,
      };
    }

    // 5. Validar versões declaradas no manifest
    const rawPackageFormatVersion = (manifest as { packageFormatVersion?: unknown }).packageFormatVersion;
    if (
      rawPackageFormatVersion !== PACKAGE_FORMAT_VERSION_V1 &&
      rawPackageFormatVersion !== PACKAGE_FORMAT_VERSION_V2
    ) {
      errors.push(
        `[PACKAGE_VERSION_MISMATCH] packageFormatVersion incompatível. Esperado: ${PACKAGE_FORMAT_VERSION_V1} ou ${PACKAGE_FORMAT_VERSION_V2}, recebido: ${rawPackageFormatVersion}`
      );
    }
    if (manifest.schemaVersion !== SCHEMA_VERSION) {
      errors.push(
        `[SCHEMA_VERSION_MISMATCH] schemaVersion incompatível. Esperado: ${SCHEMA_VERSION}, recebido: ${manifest.schemaVersion}`
      );
    }
    if (manifest.catalogFile !== CATALOG_FILENAME) {
      errors.push(
        `[INVALID_MANIFEST_CATALOG_FILE] catalogFile incorreto. Esperado: '${CATALOG_FILENAME}', recebido: '${manifest.catalogFile}'`
      );
    }

    const isV2 = rawPackageFormatVersion === PACKAGE_FORMAT_VERSION_V2;

    // Regra v1: se manifest for v1, search-index.json NÃO pode existir
    if (!isV2 && zip.file(SEARCH_INDEX_FILENAME)) {
      errors.push(`[EXTRA_FILE_REJECTED] Arquivo '${SEARCH_INDEX_FILENAME}' não é permitido em pacote v1`);
    }

    // Regra v2: se manifest for v2, search-index.json É OBRIGATÓRIO
    if (isV2 && !zip.file(SEARCH_INDEX_FILENAME)) {
      errors.push(`[MISSING_SEARCH_INDEX] Arquivo obrigatório '${SEARCH_INDEX_FILENAME}' ausente no pacote v2`);
    }

    // 6. Carregar catalog.json em bytes estáveis
    let catalogBuffer: Buffer;
    try {
      catalogBuffer = await zip.file(CATALOG_FILENAME)!.async('nodebuffer');
    } catch (err) {
      return {
        valid: false,
        manifest,
        errors: [`[CATALOG_READ_ERROR] Falha ao extrair ${CATALOG_FILENAME}: ${(err as Error).message}`],
        warnings,
        extractedFiles,
      };
    }

    // 7. Validar integridade física e tamanho do catalog.json
    const actualCatalogSha256 = calculateSha256(catalogBuffer);
    if (!verifyChecksum(actualCatalogSha256, manifest.catalogSha256)) {
      errors.push(
        `[HASH_MISMATCH] Checksum do catálogo divergente. Declarado: ${manifest.catalogSha256}, Recalculado: ${actualCatalogSha256}`
      );
    }

    if (catalogBuffer.length !== manifest.catalogSizeBytes) {
      errors.push(
        `[SIZE_MISMATCH] Tamanho do catálogo divergente. Declarado: ${manifest.catalogSizeBytes} bytes, Real: ${catalogBuffer.length} bytes`
      );
    }

    // 7.1 Processamento e validação de search-index.json se v2
    let searchIndex: PrebuiltSearchIndex | undefined;
    let actualSearchIndexSha256: string | undefined;

    if (isV2) {
      const manifestV2 = manifest as ProvisioningManifestV2;

      if (manifestV2.searchIndexFile !== SEARCH_INDEX_FILENAME) {
        errors.push(
          `[INVALID_MANIFEST_SEARCH_INDEX_FILE] searchIndexFile incorreto no manifest. Esperado: '${SEARCH_INDEX_FILENAME}', recebido: '${manifestV2.searchIndexFile}'`
        );
      }
      if (manifestV2.searchIndexVersion !== 1) {
        errors.push(
          `[SEARCH_INDEX_VERSION_MISMATCH] searchIndexVersion inválido no manifest. Esperado: 1, recebido: ${manifestV2.searchIndexVersion}`
        );
      }

      const indexEntry = zip.file(SEARCH_INDEX_FILENAME);
      if (indexEntry) {
        let indexBuffer: Buffer;
        try {
          indexBuffer = await indexEntry.async('nodebuffer');
          actualSearchIndexSha256 = calculateSha256(indexBuffer);

          if (!verifyChecksum(actualSearchIndexSha256, manifestV2.searchIndexSha256)) {
            errors.push(
              `[SEARCH_INDEX_HASH_MISMATCH] Checksum do search-index divergente. Declarado: ${manifestV2.searchIndexSha256}, Recalculado: ${actualSearchIndexSha256}`
            );
          }

          if (indexBuffer.length !== manifestV2.searchIndexSizeBytes) {
            errors.push(
              `[SEARCH_INDEX_SIZE_MISMATCH] Tamanho do search-index divergente. Declarado: ${manifestV2.searchIndexSizeBytes} bytes, Real: ${indexBuffer.length} bytes`
            );
          }

          searchIndex = JSON.parse(indexBuffer.toString('utf8')) as PrebuiltSearchIndex;

          // Validação fail-closed do searchIndex via SearchIndexValidator
          const indexValidation = this.searchIndexValidator.validate(searchIndex, {
            expectedSnapshotId: manifest.snapshotId,
            expectedCatalogVersion: manifest.catalogVersion,
          });

          if (!indexValidation.valid) {
            for (const err of indexValidation.errors) {
              errors.push(err);
            }
          }

          if (searchIndex.contentHash !== manifestV2.searchIndexContentHash) {
            errors.push(
              `[SEARCH_INDEX_CONTENT_HASH_MISMATCH] searchIndexContentHash divergente entre manifest e searchIndex. Declarado no manifest: ${manifestV2.searchIndexContentHash}, no index: ${searchIndex.contentHash}`
            );
          }
        } catch (err) {
          errors.push(`[SEARCH_INDEX_READ_ERROR] Falha ao extrair ou parsear ${SEARCH_INDEX_FILENAME}: ${(err as Error).message}`);
        }
      }
    }

    // 8. Validar hash de conteúdo lógico do pacote (packageContentHash)
    let expectedPackageContentHash: string;
    if (isV2) {
      const manifestV2 = manifest as ProvisioningManifestV2;
      expectedPackageContentHash = calculatePackageContentHash({
        packageFormatVersion: PACKAGE_FORMAT_VERSION_V2,
        schemaVersion: manifestV2.schemaVersion,
        catalogVersion: manifestV2.catalogVersion,
        snapshotId: manifestV2.snapshotId,
        catalogFile: manifestV2.catalogFile,
        catalogSha256: manifestV2.catalogSha256,
        catalogSizeBytes: manifestV2.catalogSizeBytes,
        compression: manifestV2.compression,
        searchIndexFile: manifestV2.searchIndexFile,
        searchIndexVersion: manifestV2.searchIndexVersion,
        searchIndexSha256: manifestV2.searchIndexSha256,
        searchIndexSizeBytes: manifestV2.searchIndexSizeBytes,
        searchIndexContentHash: manifestV2.searchIndexContentHash,
      });
    } else {
      expectedPackageContentHash = calculatePackageContentHash({
        packageFormatVersion: manifest.packageFormatVersion,
        schemaVersion: manifest.schemaVersion,
        catalogVersion: manifest.catalogVersion,
        snapshotId: manifest.snapshotId,
        catalogFile: manifest.catalogFile,
        catalogSha256: manifest.catalogSha256,
        catalogSizeBytes: manifest.catalogSizeBytes,
        compression: manifest.compression,
      });
    }

    if (!verifyChecksum(expectedPackageContentHash, manifest.packageContentHash)) {
      errors.push(
        `[PACKAGE_CONTENT_HASH_MISMATCH] Hash lógico do pacote divergente. Declarado: ${manifest.packageContentHash}, Recalculado: ${expectedPackageContentHash}`
      );
    }

    // 9. Parse e validação do catalog.json contra o contrato G2
    let catalog: PrebuiltCatalog;
    try {
      const catalogJsonText = catalogBuffer.toString('utf8');
      catalog = JSON.parse(catalogJsonText) as PrebuiltCatalog;
    } catch (err) {
      errors.push(`[INVALID_CATALOG_JSON] Falha ao parsear ${CATALOG_FILENAME}: ${(err as Error).message}`);
      return {
        valid: false,
        manifest,
        errors,
        warnings,
        extractedFiles,
      };
    }

    // 10. Validar consistência de snapshot e versões entre manifest e catalog
    if (catalog.metadata?.snapshotId !== manifest.snapshotId) {
      errors.push(
        `[SNAPSHOT_MISMATCH] snapshotId divergente. Manifest: '${manifest.snapshotId}', Catálogo: '${catalog.metadata?.snapshotId}'`
      );
    }
    if (catalog.metadata?.catalogVersion !== manifest.catalogVersion) {
      errors.push(
        `[CATALOG_VERSION_MISMATCH] catalogVersion divergente. Manifest: '${manifest.catalogVersion}', Catálogo: '${catalog.metadata?.catalogVersion}'`
      );
    }
    if (catalog.metadata?.schemaVersion !== manifest.schemaVersion) {
      errors.push(
        `[SCHEMA_VERSION_MISMATCH] schemaVersion do catálogo divergente. Manifest: '${manifest.schemaVersion}', Catálogo: '${catalog.metadata?.schemaVersion}'`
      );
    }

    // 11. Validação estrita do catálogo contra o contrato de dados v1
    const catalogValidation = validateNormalizedCatalog(catalog);
    if (!catalogValidation.valid) {
      for (const err of catalogValidation.errors) {
        errors.push(`[CATALOG_CONTRACT_ERROR] ${err}`);
      }
    }

    // 11.1 Validação de consistência referencial entre searchIndex e catalog
    if (searchIndex) {
      const validDocIds = new Set<string>();
      for (const m of catalog.movies || []) {
        validDocIds.add(m.id);
      }
      for (const s of catalog.series || []) {
        validDocIds.add(s.id);
      }

      for (const sDoc of searchIndex.documents) {
        if (!validDocIds.has(sDoc.id)) {
          errors.push(
            `[UNKNOWN_DOCUMENT_REF] Documento '${sDoc.id}' presente no índice de busca não existe no catálogo`
          );
        }
      }
    }

    // 12. Auditoria de segurança no payload do pacote
    const rawContent = catalogBuffer.toString('utf8');
    const secretPatterns = [
      /SUPABASE_SERVICE_ROLE/i,
      /service_role/i,
      /eyJh[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // JWT pattern
      /postgres:\/\/[^:]+:[^@]+@/i,
      /https?:\/\/[^:]+:[^@]+@/i,
      /PRIVATE_KEY/i,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(rawContent)) {
        errors.push(`[SECRET_EXPOSURE_DETECTED] Padrão suspeito ou credencial detectada no payload: ${pattern.toString()}`);
      }
    }

    return {
      valid: errors.length === 0,
      manifest,
      catalog,
      searchIndex,
      catalogSha256: actualCatalogSha256,
      searchIndexSha256: actualSearchIndexSha256,
      packageContentHash: expectedPackageContentHash,
      errors,
      warnings,
      extractedFiles,
    };
  }
}
