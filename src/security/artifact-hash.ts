/**
 * Xandeflix Prebuilt — Artifact Hash (Gate G10)
 *
 * Cálculo de hash SHA-256 e tamanho exato para artefatos brutos.
 */

import { createHash } from 'node:crypto';

export interface ArtifactDigest {
  sha256: string;
  sizeBytes: number;
}

export function calculateArtifactDigest(buffer: Buffer | Uint8Array): ArtifactDigest {
  const hash = createHash('sha256').update(buffer).digest('hex');
  return {
    sha256: hash.toLowerCase(),
    sizeBytes: buffer.length,
  };
}
