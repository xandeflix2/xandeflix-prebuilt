/**
 * Xandeflix Prebuilt — Artifact Signer (Gate G10)
 *
 * Assinador criptográfico de artefatos de provisionamento e atualização (G4/G7/G9).
 *
 * Princípios:
 * - ARTIFACT_SIGNATURE_ALGORITHM = ECDSA_P256_SHA256
 * - PRIVATE_SIGNING_KEY_IN_REPO = PROHIBITED
 * - PRIVATE_SIGNING_KEY_EXTERNAL_ONLY = PASS
 * - Assinatura gerada sobre o payload canônico determinístico.
 */

import { sign, type KeyObject } from 'node:crypto';
import type {
  ArtifactType,
  CanonicalSigningPayloadInput,
  SigningResult,
} from './security.types.ts';
import { calculateArtifactDigest } from './artifact-hash.ts';
import {
  buildCanonicalSigningPayloadBytes,
  buildCanonicalSigningPayloadString,
} from './canonical-signing-payload.ts';

export interface SignArtifactOptions {
  artifactBytes: Buffer | Uint8Array;
  artifactType: ArtifactType;
  keyId: string;
  privateKeyPem: string | KeyObject;
  issuedAt?: string;
  artifactIdentity?: string;
  snapshotId?: string;
  baseSnapshotId?: string;
  targetSnapshotId?: string;
}

export function signArtifact(options: SignArtifactOptions): SigningResult {
  const start = Date.now();
  const digest = calculateArtifactDigest(options.artifactBytes);

  const payloadInput: CanonicalSigningPayloadInput = {
    securityFormatVersion: 1,
    artifactType: options.artifactType,
    artifactSha256: digest.sha256,
    artifactSizeBytes: digest.sizeBytes,
    keyId: options.keyId,
    algorithm: 'ECDSA_P256_SHA256',
    issuedAt: options.issuedAt || new Date().toISOString(),
    artifactIdentity: options.artifactIdentity,
    snapshotId: options.snapshotId,
    baseSnapshotId: options.baseSnapshotId,
    targetSnapshotId: options.targetSnapshotId,
  };

  const payloadBytes = buildCanonicalSigningPayloadBytes(payloadInput);
  const canonicalString = buildCanonicalSigningPayloadString(payloadInput);

  // Assinatura ECDSA P-256 com codificação DER padrão
  const signatureBuffer = sign('sha256', payloadBytes, {
    key: options.privateKeyPem as any,
    dsaEncoding: 'der',
  });

  const envelope = {
    securityFormatVersion: 1 as const,
    artifactType: options.artifactType,
    artifactSha256: digest.sha256,
    artifactSizeBytes: digest.sizeBytes,
    keyId: options.keyId,
    algorithm: 'ECDSA_P256_SHA256' as const,
    issuedAt: payloadInput.issuedAt,
    signature: signatureBuffer.toString('base64'),
    artifactIdentity: options.artifactIdentity,
    snapshotId: options.snapshotId,
    baseSnapshotId: options.baseSnapshotId,
    targetSnapshotId: options.targetSnapshotId,
  };

  return {
    envelope,
    canonicalPayloadString: canonicalString,
    durationMs: Date.now() - start,
  };
}
