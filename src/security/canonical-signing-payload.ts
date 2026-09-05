/**
 * Xandeflix Prebuilt — Canonical Signing Payload (Gate G10)
 *
 * Serialização canônica determinística para assinatura e verificação criptográfica.
 *
 * Princípios:
 * - SIGNING_PAYLOAD_CANONICALIZATION = DETERMINISTIC
 * - Ordenação estrita alfabética de propriedades
 * - Formatação JSON compacta sem espaçamento acidental
 * - Hash hexadecimal normalizado em minúsculas
 */

import type { CanonicalSigningPayloadInput } from './security.types.ts';

export function buildCanonicalSigningPayloadString(input: CanonicalSigningPayloadInput): string {
  const payloadRecord: Record<string, unknown> = {
    algorithm: input.algorithm,
    artifactSha256: input.artifactSha256.toLowerCase().trim(),
    artifactSizeBytes: input.artifactSizeBytes,
    artifactType: input.artifactType,
    issuedAt: input.issuedAt,
    keyId: input.keyId,
    securityFormatVersion: input.securityFormatVersion,
  };

  if (input.artifactIdentity) {
    payloadRecord.artifactIdentity = input.artifactIdentity;
  }
  if (input.snapshotId) {
    payloadRecord.snapshotId = input.snapshotId;
  }
  if (input.baseSnapshotId) {
    payloadRecord.baseSnapshotId = input.baseSnapshotId;
  }
  if (input.targetSnapshotId) {
    payloadRecord.targetSnapshotId = input.targetSnapshotId;
  }

  // Ordenação alfabética estrita de propriedades para garantir determinismo
  const sortedKeys = Object.keys(payloadRecord).sort();
  const sortedRecord: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedRecord[key] = payloadRecord[key];
  }

  return JSON.stringify(sortedRecord);
}

export function buildCanonicalSigningPayloadBytes(input: CanonicalSigningPayloadInput): Buffer {
  return Buffer.from(buildCanonicalSigningPayloadString(input), 'utf8');
}
