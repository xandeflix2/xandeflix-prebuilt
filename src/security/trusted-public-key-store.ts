/**
 * Xandeflix Prebuilt — Trusted Public Key Store (Gate G10)
 *
 * Gerenciador de âncoras de confiança (Pinned Public Key Set).
 *
 * Princípios:
 * - TRUST_ANCHOR_MODEL = PINNED_PUBLIC_KEY_SET
 * - Chaves públicas apenas; NUNCA armazena chaves privadas.
 * - Suporta status ACTIVE e REVOKED.
 */

import type { TrustedPublicKey, TrustedKeyStatus } from './security.types.ts';

export class TrustedPublicKeyStore {
  private keys = new Map<string, TrustedPublicKey>();

  constructor(initialKeys: TrustedPublicKey[] = []) {
    for (const key of initialKeys) {
      this.addKey(key);
    }
  }

  addKey(key: TrustedPublicKey): void {
    if (key.algorithm !== 'ECDSA_P256_SHA256') {
      throw new Error(`[UNSUPPORTED_SIGNATURE_ALGORITHM] Algoritmo não suportado para chave: ${key.algorithm}`);
    }
    this.keys.set(key.keyId, { ...key });
  }

  getKey(keyId: string): TrustedPublicKey | null {
    const key = this.keys.get(keyId);
    return key ? { ...key } : null;
  }

  setKeyStatus(keyId: string, status: TrustedKeyStatus): boolean {
    const key = this.keys.get(keyId);
    if (!key) return false;
    key.status = status;
    return true;
  }

  revokeKey(keyId: string): boolean {
    return this.setKeyStatus(keyId, 'REVOKED');
  }

  listKeys(): TrustedPublicKey[] {
    return Array.from(this.keys.values()).map((k) => ({ ...k }));
  }

  hasKey(keyId: string): boolean {
    return this.keys.has(keyId);
  }

  clear(): void {
    this.keys.clear();
  }
}
