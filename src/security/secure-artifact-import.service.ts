/**
 * Xandeflix Prebuilt — Secure Artifact Import Service (Gate G10)
 *
 * Ponto de entrada de produção para ingestão segura de artefatos externos não confiáveis.
 *
 * Princípios e Garantias:
 * - UNTRUSTED_ARTIFACT → CRYPTOGRAPHIC_VERIFICATION → STRUCTURAL_VALIDATION → STAGING → PROMOTION
 * - SECURE_IMPORT_FAIL_CLOSED = REQUIRED
 * - UNSIGNED_NEW_ARTIFACT_IMPORT = REJECT
 * - PRODUCTION_IMPORT_BYPASS = NAO (A camada de produção exige envelope de segurança válido)
 */

import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { PackageImporter } from '../bootstrap/package-importer.ts';
import { IncrementalUpdateService } from '../update/incremental-update.service.ts';
import { ArtifactVerifier } from './artifact-verifier.ts';
import { SecurityErrorCodes } from './security-errors.ts';
import type {
  ArtifactSecurityEnvelope,
  SecureImportOptions,
  SecureImportResult,
} from './security.types.ts';
import { sanitizeLogText } from './security-redaction.ts';

export class SecureArtifactImportService {
  private verifier: ArtifactVerifier;
  private packageImporter: PackageImporter;
  private updateService: IncrementalUpdateService;

  constructor(
    storage: LocalCatalogStorage,
    verifier: ArtifactVerifier,
    packageImporter?: PackageImporter,
    updateService?: IncrementalUpdateService
  ) {
    this.verifier = verifier;
    this.packageImporter = packageImporter || new PackageImporter(storage);
    this.updateService = updateService || new IncrementalUpdateService(storage);
  }

  /**
   * Importa um pacote completo (Full Package V1 ou V2) precedido de validação criptográfica estrita.
   */
  async importPackage(
    artifactBytes: Buffer | Uint8Array,
    envelope?: ArtifactSecurityEnvelope | string | null,
    options?: SecureImportOptions
  ): Promise<SecureImportResult> {
    const startTime = Date.now();

    // 1. Rejeição fail-closed se não houver envelope de segurança (Unsigned)
    if (!envelope) {
      return {
        success: false,
        status: 'REJECTED',
        errorCode: SecurityErrorCodes.UNSIGNED_ARTIFACT,
        errorMessage: 'Artefato não assinado. Importação de produção exige envelope de segurança criptográfico.',
        securityMetrics: {
          sha256Ms: 0,
          verifyMs: 0,
          totalSecurityMs: Date.now() - startTime,
          importMs: 0,
          totalMs: Date.now() - startTime,
        },
      };
    }

    // 2. Verificação criptográfica completa (Hash + KeyStatus + Signature)
    const verification = await this.verifier.verify(artifactBytes, envelope);
    if (!verification.valid) {
      return {
        success: false,
        status: 'REJECTED',
        errorCode: verification.errorCode || SecurityErrorCodes.SECURE_IMPORT_FAILED,
        errorMessage: sanitizeLogText(verification.errorMessage || 'Falha na verificação de segurança do artefato'),
        securityMetrics: {
          sha256Ms: verification.metrics.sha256Ms,
          verifyMs: verification.metrics.verifyMs,
          totalSecurityMs: verification.metrics.totalVerifyMs,
          importMs: 0,
          totalMs: Date.now() - startTime,
        },
      };
    }

    // 3. Verificação de compatibilidade de tipo
    if (
      verification.envelope?.artifactType !== 'FULL_PACKAGE_V1' &&
      verification.envelope?.artifactType !== 'FULL_PACKAGE_V2'
    ) {
      return {
        success: false,
        status: 'REJECTED',
        errorCode: SecurityErrorCodes.WRONG_ARTIFACT_TYPE,
        errorMessage: `Tipo de artefato '${verification.envelope?.artifactType}' incompatível com importação de pacote completo`,
        securityMetrics: {
          sha256Ms: verification.metrics.sha256Ms,
          verifyMs: verification.metrics.verifyMs,
          totalSecurityMs: verification.metrics.totalVerifyMs,
          importMs: 0,
          totalMs: Date.now() - startTime,
        },
      };
    }

    // 4. Delegação segura para o PackageImporter existente (G4/G5)
    const importStart = Date.now();
    const innerResult = await this.packageImporter.importPackage(
      (typeof Buffer !== 'undefined' && Buffer.isBuffer(artifactBytes))
        ? artifactBytes
        : (typeof Buffer !== 'undefined' ? Buffer.from(artifactBytes) : (artifactBytes as any)),
      options
    );
    const importMs = Date.now() - importStart;

    return {
      success: innerResult.success,
      status: innerResult.status === 'ALREADY_ACTIVE' ? 'ALREADY_ACTIVE' : innerResult.success ? 'ACCEPTED' : 'REJECTED',
      errorCode: innerResult.errors.length > 0 ? innerResult.errors[0] : undefined,
      errorMessage: innerResult.errors.join('; '),
      securityMetrics: {
        sha256Ms: verification.metrics.sha256Ms,
        verifyMs: verification.metrics.verifyMs,
        totalSecurityMs: verification.metrics.totalVerifyMs,
        importMs,
        totalMs: Date.now() - startTime,
      },
      innerResult,
    };
  }

  /**
   * Aplica um pacote delta incremental (Delta Package V1) precedido de validação criptográfica estrita.
   */
  async applyDelta(
    deltaZipBuffer: Buffer | Uint8Array,
    envelope?: ArtifactSecurityEnvelope | string | null
  ): Promise<SecureImportResult> {
    const startTime = Date.now();

    // 1. Rejeição fail-closed se não houver envelope de segurança (Unsigned)
    if (!envelope) {
      return {
        success: false,
        status: 'REJECTED',
        errorCode: SecurityErrorCodes.UNSIGNED_ARTIFACT,
        errorMessage: 'Pacote delta não assinado. Importação de produção exige envelope de segurança criptográfico.',
        securityMetrics: {
          sha256Ms: 0,
          verifyMs: 0,
          totalSecurityMs: Date.now() - startTime,
          importMs: 0,
          totalMs: Date.now() - startTime,
        },
      };
    }

    // 2. Verificação criptográfica completa (Hash + KeyStatus + Signature)
    const verification = await this.verifier.verify(deltaZipBuffer, envelope);
    if (!verification.valid) {
      return {
        success: false,
        status: 'REJECTED',
        errorCode: verification.errorCode || SecurityErrorCodes.SECURE_IMPORT_FAILED,
        errorMessage: sanitizeLogText(verification.errorMessage || 'Falha na verificação de segurança do pacote delta'),
        securityMetrics: {
          sha256Ms: verification.metrics.sha256Ms,
          verifyMs: verification.metrics.verifyMs,
          totalSecurityMs: verification.metrics.totalVerifyMs,
          importMs: 0,
          totalMs: Date.now() - startTime,
        },
      };
    }

    // 3. Verificação de tipo
    if (verification.envelope?.artifactType !== 'DELTA_PACKAGE_V1') {
      return {
        success: false,
        status: 'REJECTED',
        errorCode: SecurityErrorCodes.WRONG_ARTIFACT_TYPE,
        errorMessage: `Tipo de artefato '${verification.envelope?.artifactType}' incompatível com aplicação delta`,
        securityMetrics: {
          sha256Ms: verification.metrics.sha256Ms,
          verifyMs: verification.metrics.verifyMs,
          totalSecurityMs: verification.metrics.totalVerifyMs,
          importMs: 0,
          totalMs: Date.now() - startTime,
        },
      };
    }

    // 4. Delegação segura para o IncrementalUpdateService existente (G9)
    const importStart = Date.now();
    const innerResult = await this.updateService.applyDelta(
      (typeof Buffer !== 'undefined' && Buffer.isBuffer(deltaZipBuffer))
        ? deltaZipBuffer
        : (typeof Buffer !== 'undefined' ? Buffer.from(deltaZipBuffer) : (deltaZipBuffer as any))
    );
    const importMs = Date.now() - importStart;

    return {
      success: innerResult.success,
      status: innerResult.success ? 'ACCEPTED' : 'REJECTED',
      errorCode: innerResult.errors.length > 0 ? innerResult.errors[0] : undefined,
      errorMessage: innerResult.errors.join('; '),
      securityMetrics: {
        sha256Ms: verification.metrics.sha256Ms,
        verifyMs: verification.metrics.verifyMs,
        totalSecurityMs: verification.metrics.totalVerifyMs,
        importMs,
        totalMs: Date.now() - startTime,
      },
      innerResult,
    };
  }
}
