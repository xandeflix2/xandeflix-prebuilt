/**
 * Xandeflix Prebuilt — Provisioning Package Validator
 *
 * Validador estrito e auditável de pacotes de provisionamento (G4).
 *
 * Princípios de aceitação:
 * - FAIL_CLOSED=SIM (qualquer divergência gera erro fatal)
 * - UNKNOWN_PACKAGE_FILES=REJECT (somente manifest.json e catalog.json permitidos)
 * - ZIP_PATH_TRAVERSAL_PROTECTION=PASS (rejeita .., \, caminhos absolutos, drive letters)
 * - INTEGRIDADE: catalogSha256, catalogSizeBytes, packageContentHash
 * - CONSISTÊNCIA DE SNAPSHOT: snapshotId, catalogVersion, schemaVersion
 * - CONFORMIDADE G2: validação do catalog.json via validateNormalizedCatalog
 * - AUDITORIA DE SEGURANÇA: ausência de segredos no pacote
 */

import fs from 'node:fs';
import JSZip from 'jszip';
import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import { validateNormalizedCatalog } from '../ingestion/validate.ts';
import {
  PACKAGE_FORMAT_VERSION,
  SCHEMA_VERSION,
  MANIFEST_FILENAME,
  CATALOG_FILENAME,
  type ProvisioningManifest,
  type PackageValidationResult,
} from './types.ts';
import { calculateSha256, calculatePackageContentHash, verifyChecksum } from './integrity.ts';

export interface ValidatePackageDetailedResult extends PackageValidationResult {
  catalog?: PrebuiltCatalog;
  catalogSha256?: string;
  packageContentHash?: string;
  extractedFiles: string[];
}

export class PackageValidator {
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
      if (rawName !== MANIFEST_FILENAME && rawName !== CATALOG_FILENAME) {
        errors.push(`[EXTRA_FILE_REJECTED] Arquivo não autorizado no pacote de provisionamento: '${rawName}'`);
      }
    }

    // 3. Confirmar presença exata dos arquivos esperados
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
    if (manifest.packageFormatVersion !== PACKAGE_FORMAT_VERSION) {
      errors.push(
        `[PACKAGE_VERSION_MISMATCH] packageFormatVersion incompatível. Esperado: ${PACKAGE_FORMAT_VERSION}, recebido: ${manifest.packageFormatVersion}`
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

    // 8. Validar hash de conteúdo lógico do pacote (packageContentHash)
    const expectedPackageContentHash = calculatePackageContentHash({
      packageFormatVersion: manifest.packageFormatVersion,
      schemaVersion: manifest.schemaVersion,
      catalogVersion: manifest.catalogVersion,
      snapshotId: manifest.snapshotId,
      catalogFile: manifest.catalogFile,
      catalogSha256: manifest.catalogSha256,
      catalogSizeBytes: manifest.catalogSizeBytes,
      compression: manifest.compression,
    });

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
      catalogSha256: actualCatalogSha256,
      packageContentHash: expectedPackageContentHash,
      errors,
      warnings,
      extractedFiles,
    };
  }
}
