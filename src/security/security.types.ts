/**
 * Xandeflix Prebuilt — Artifact Security Types (Gate G10)
 *
 * Definições canônicas de tipos para o envelope de segurança, verificação criptográfica
 * e gerenciamento de chaves confiáveis.
 */

export type ArtifactType = 'FULL_PACKAGE_V1' | 'FULL_PACKAGE_V2' | 'DELTA_PACKAGE_V1';

export type SignatureAlgorithm = 'ECDSA_P256_SHA256';

export type TrustedKeyStatus = 'ACTIVE' | 'REVOKED';

export interface ArtifactSecurityEnvelope {
  securityFormatVersion: 1;
  artifactType: ArtifactType;
  artifactSha256: string;
  artifactSizeBytes: number;
  keyId: string;
  algorithm: SignatureAlgorithm;
  issuedAt: string;
  signature: string;
  artifactIdentity?: string;
  snapshotId?: string;
  baseSnapshotId?: string;
  targetSnapshotId?: string;
}

export interface CanonicalSigningPayloadInput {
  securityFormatVersion: 1;
  artifactType: ArtifactType;
  artifactSha256: string;
  artifactSizeBytes: number;
  keyId: string;
  algorithm: SignatureAlgorithm;
  issuedAt: string;
  artifactIdentity?: string;
  snapshotId?: string;
  baseSnapshotId?: string;
  targetSnapshotId?: string;
}

export interface TrustedPublicKey {
  keyId: string;
  algorithm: SignatureAlgorithm;
  publicKeyPem: string;
  status: TrustedKeyStatus;
  notBefore?: string;
  notAfter?: string;
}

export interface VerificationMetrics {
  sha256Ms: number;
  verifyMs: number;
  totalVerifyMs: number;
  artifactSizeBytes: number;
}

export interface VerificationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
  envelope?: ArtifactSecurityEnvelope;
  keyId?: string;
  metrics: VerificationMetrics;
}

export interface SigningResult {
  envelope: ArtifactSecurityEnvelope;
  canonicalPayloadString: string;
  durationMs: number;
}

export interface SecureImportOptions {
  forceReimport?: boolean;
}

export interface SecureImportMetrics {
  sha256Ms: number;
  verifyMs: number;
  totalSecurityMs: number;
  importMs: number;
  totalMs: number;
}

export interface SecureImportResult {
  success: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'ALREADY_ACTIVE';
  errorCode?: string;
  errorMessage?: string;
  securityMetrics: SecureImportMetrics;
  innerResult?: unknown;
}
