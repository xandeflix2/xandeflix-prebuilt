/**
 * Xandeflix Prebuilt — Artifact Verifier (Gate G10)
 *
 * Verificador criptográfico fail-closed para artefatos antes de qualquer ingestão ou parse.
 *
 * Princípios:
 * - SECURE_IMPORT_FAIL_CLOSED = REQUIRED
 * - HASH FIRST: Validação de tamanho e SHA-256 antes da criptografia.
 * - ALGORITHM CONFUSION REJECTED: Allowlist estrita (apenas ECDSA_P256_SHA256).
 * - UNKNOWN & REVOKED KEY REJECTION: Falha explícita.
 * - TAMPERED ARTIFACT / SIGNATURE REJECTION: Falha explícita.
 */

import { verify } from 'node:crypto';
import type {
  ArtifactSecurityEnvelope,
  CanonicalSigningPayloadInput,
  VerificationMetrics,
  VerificationResult,
} from './security.types.ts';
import { SecurityErrorCodes } from './security-errors.ts';
import { calculateArtifactDigest } from './artifact-hash.ts';
import { buildCanonicalSigningPayloadBytes } from './canonical-signing-payload.ts';
import { TrustedPublicKeyStore } from './trusted-public-key-store.ts';

export class ArtifactVerifier {
  private keyStore: TrustedPublicKeyStore;

  constructor(keyStore: TrustedPublicKeyStore) {
    this.keyStore = keyStore;
  }

  verify(
    artifactBytes: Buffer | Uint8Array,
    rawEnvelope: ArtifactSecurityEnvelope | string
  ): VerificationResult {
    const totalStart = Date.now();
    const metrics: VerificationMetrics = {
      sha256Ms: 0,
      verifyMs: 0,
      totalVerifyMs: 0,
      artifactSizeBytes: artifactBytes.length,
    };

    // 1. Parsing do envelope
    let envelope: ArtifactSecurityEnvelope;
    if (typeof rawEnvelope === 'string') {
      try {
        envelope = JSON.parse(rawEnvelope) as ArtifactSecurityEnvelope;
      } catch {
        metrics.totalVerifyMs = Date.now() - totalStart;
        return {
          valid: false,
          errorCode: SecurityErrorCodes.SECURITY_ENVELOPE_INVALID,
          errorMessage: 'Envelope de segurança não é um JSON válido',
          metrics,
        };
      }
    } else {
      envelope = rawEnvelope;
    }

    // 2. Validação estrutural do envelope
    if (!envelope || typeof envelope !== 'object') {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.SECURITY_ENVELOPE_INVALID,
        errorMessage: 'Envelope de segurança ausente ou malformado',
        metrics,
      };
    }

    if (envelope.securityFormatVersion !== 1) {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.SECURITY_ENVELOPE_INVALID,
        errorMessage: `Versão do formato de segurança não suportada: ${envelope.securityFormatVersion}`,
        metrics,
      };
    }

    const validTypes = ['FULL_PACKAGE_V1', 'FULL_PACKAGE_V2', 'DELTA_PACKAGE_V1'];
    if (!validTypes.includes(envelope.artifactType)) {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.WRONG_ARTIFACT_TYPE,
        errorMessage: `Tipo de artefato desconhecido ou inválido: ${envelope.artifactType}`,
        metrics,
      };
    }

    // 3. Proteção contra Confusão de Algoritmo
    if (envelope.algorithm !== 'ECDSA_P256_SHA256') {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.UNSUPPORTED_SIGNATURE_ALGORITHM,
        errorMessage: `Algoritmo rejeitado pela allowlist estrita: ${envelope.algorithm}`,
        metrics,
      };
    }

    if (!envelope.keyId || typeof envelope.keyId !== 'string') {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.SECURITY_ENVELOPE_INVALID,
        errorMessage: 'Identificador de chave (keyId) ausente ou inválido',
        metrics,
      };
    }

    if (!envelope.signature || typeof envelope.signature !== 'string') {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.SECURITY_ENVELOPE_INVALID,
        errorMessage: 'Assinatura ausente ou inválida no envelope',
        metrics,
      };
    }

    // 4. Localização e validação da chave pública confiável
    const trustedKey = this.keyStore.getKey(envelope.keyId);
    if (!trustedKey) {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.UNKNOWN_SIGNING_KEY,
        errorMessage: `Chave com identificador '${envelope.keyId}' não encontrada no conjunto de chaves confiáveis (pinned keys)`,
        keyId: envelope.keyId,
        envelope,
        metrics,
      };
    }

    if (trustedKey.status === 'REVOKED') {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.REVOKED_SIGNING_KEY,
        errorMessage: `Chave com identificador '${envelope.keyId}' foi explicitamente revogada`,
        keyId: envelope.keyId,
        envelope,
        metrics,
      };
    }

    if (trustedKey.notBefore && new Date(envelope.issuedAt) < new Date(trustedKey.notBefore)) {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.KEY_NOT_YET_VALID,
        errorMessage: `Envelope emitido antes do período de validade da chave '${envelope.keyId}'`,
        keyId: envelope.keyId,
        envelope,
        metrics,
      };
    }

    if (trustedKey.notAfter && new Date(envelope.issuedAt) > new Date(trustedKey.notAfter)) {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.KEY_EXPIRED,
        errorMessage: `Envelope emitido após a expiração da chave '${envelope.keyId}'`,
        keyId: envelope.keyId,
        envelope,
        metrics,
      };
    }

    // 5. Verificação de Tamanho
    if (artifactBytes.length !== envelope.artifactSizeBytes) {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.ARTIFACT_SIZE_MISMATCH,
        errorMessage: `Tamanho do artefato (${artifactBytes.length} bytes) diverge do envelope (${envelope.artifactSizeBytes} bytes)`,
        keyId: envelope.keyId,
        envelope,
        metrics,
      };
    }

    // 6. Recálculo e Comparação do Hash SHA-256
    const hashStart = Date.now();
    const digest = calculateArtifactDigest(artifactBytes);
    metrics.sha256Ms = Date.now() - hashStart;

    if (digest.sha256 !== envelope.artifactSha256.toLowerCase().trim()) {
      metrics.totalVerifyMs = Date.now() - totalStart;
      return {
        valid: false,
        errorCode: SecurityErrorCodes.ARTIFACT_HASH_MISMATCH,
        errorMessage: `Hash SHA-256 do artefato ('${digest.sha256}') diverge do hash assinado no envelope ('${envelope.artifactSha256}')`,
        keyId: envelope.keyId,
        envelope,
        metrics,
      };
    }

    // 7. Verificação Criptográfica da Assinatura
    const verifyStart = Date.now();
    const payloadInput: CanonicalSigningPayloadInput = {
      securityFormatVersion: envelope.securityFormatVersion,
      artifactType: envelope.artifactType,
      artifactSha256: envelope.artifactSha256,
      artifactSizeBytes: envelope.artifactSizeBytes,
      keyId: envelope.keyId,
      algorithm: envelope.algorithm,
      issuedAt: envelope.issuedAt,
      artifactIdentity: envelope.artifactIdentity,
      snapshotId: envelope.snapshotId,
      baseSnapshotId: envelope.baseSnapshotId,
      targetSnapshotId: envelope.targetSnapshotId,
    };

    const payloadBytes = buildCanonicalSigningPayloadBytes(payloadInput);

    let isSignatureValid = false;
    try {
      const signatureBuffer = Buffer.from(envelope.signature, 'base64');
      isSignatureValid = verify('sha256', payloadBytes, {
        key: trustedKey.publicKeyPem,
        dsaEncoding: 'der',
      }, signatureBuffer);
    } catch {
      isSignatureValid = false;
    }
    metrics.verifyMs = Date.now() - verifyStart;
    metrics.totalVerifyMs = Date.now() - totalStart;

    if (!isSignatureValid) {
      return {
        valid: false,
        errorCode: SecurityErrorCodes.SIGNATURE_INVALID,
        errorMessage: 'Assinatura criptográfica inválida ou não corresponde aos dados/chave',
        keyId: envelope.keyId,
        envelope,
        metrics,
      };
    }

    return {
      valid: true,
      envelope,
      keyId: envelope.keyId,
      metrics,
    };
  }
}
