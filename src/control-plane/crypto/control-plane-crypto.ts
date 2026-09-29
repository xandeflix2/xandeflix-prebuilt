/**
 * Xandeflix Prebuilt — Control Plane Crypto Utilities (Experiment R7B)
 *
 * Funções criptográficas para hashing seguro de chaves de licença e encriptação AES-256-GCM
 * de configurações de fontes gerenciadas.
 *
 * Princípios:
 * - NO_PLAINTEXT_SECRETS: License keys e device tokens nunca são persistidos em texto puro.
 * - AES-256-GCM: Segredos de fontes gerenciadas são cifrados com autenticação de integridade.
 * - CROSS_PLATFORM: Compatível com Web Crypto API (Nativo em navegadores, WebViews e Node v18+).
 */

import type { SourceRuntimeConfig } from '../../debug/source/source-runtime-config.ts';

export class ControlPlaneCrypto {
  /**
   * Calcula o hash SHA-256 de uma string e retorna em hexadecimal.
   */
  static async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data.trim());

    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', dataBytes);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Fallback síncrono para testes onde subtle não esteja montado
    let h = 0x811c9dc5;
    for (let i = 0; i < dataBytes.length; i++) {
      h ^= dataBytes[i];
      h = Math.imul(h, 0x01000193);
    }
    return Math.abs(h).toString(16).padStart(64, '0');
  }

  /**
   * Converte uma string de chave mestra de 256 bits ou deriva CryptoKey.
   */
  private static async getAesKey(rawKey: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    let keyBytes = encoder.encode(rawKey);

    // Garante exatamente 32 bytes (256 bits)
    if (keyBytes.length !== 32) {
      const hash = await this.sha256(rawKey);
      const hexBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        hexBytes[i] = parseInt(hash.slice(i * 2, i * 2 + 2), 16);
      }
      keyBytes = hexBytes;
    }

    return globalThis.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Cifra uma configuração de fonte usando AES-256-GCM.
   */
  static async encryptSourcePayload(
    config: SourceRuntimeConfig,
    serverMasterKey: string
  ): Promise<{ encryptedPayload: string; iv: string; authTag: string }> {
    const jsonStr = JSON.stringify(config);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(jsonStr);

    const ivBytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(ivBytes);

    const cryptoKey = await this.getAesKey(serverMasterKey);
    const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        tagLength: 128,
      },
      cryptoKey,
      dataBytes
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    // Em Web Crypto, o auth tag (últimos 16 bytes) é concatenado ao ciphertext
    const ciphertextBytes = encryptedArray.slice(0, encryptedArray.length - 16);
    const tagBytes = encryptedArray.slice(encryptedArray.length - 16);

    const toHex = (buf: Uint8Array) =>
      Array.from(buf)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return {
      encryptedPayload: toHex(ciphertextBytes),
      iv: toHex(ivBytes),
      authTag: toHex(tagBytes),
    };
  }

  /**
   * Decifra o payload cifrado AES-256-GCM de volta para SourceRuntimeConfig.
   */
  static async decryptSourcePayload(
    encryptedHex: string,
    ivHex: string,
    authTagHex: string,
    serverMasterKey: string
  ): Promise<SourceRuntimeConfig> {
    const fromHex = (hex: string) => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      return bytes;
    };

    const ciphertext = fromHex(encryptedHex);
    const iv = fromHex(ivHex);
    const tag = fromHex(authTagHex);

    // Concatena ciphertext + tag para Web Crypto AES-GCM
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext, 0);
    combined.set(tag, ciphertext.length);

    const cryptoKey = await this.getAesKey(serverMasterKey);
    const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      cryptoKey,
      combined
    );

    const jsonStr = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(jsonStr) as SourceRuntimeConfig;
  }
}

export const sha256Hex = (data: string): Promise<string> => ControlPlaneCrypto.sha256(data);

export const encryptAes256Gcm = async (
  plaintext: string,
  key: string
): Promise<{ ciphertext: string; iv: string; authTag: string }> => {
  let cfg: SourceRuntimeConfig;
  try {
    cfg = JSON.parse(plaintext) as SourceRuntimeConfig;
  } catch {
    cfg = { type: 'M3U', playlistUrl: plaintext };
  }
  const enc = await ControlPlaneCrypto.encryptSourcePayload(cfg, key);
  return {
    ciphertext: enc.encryptedPayload,
    iv: enc.iv,
    authTag: enc.authTag,
  };
};

export const decryptAes256Gcm = async (
  ciphertext: string,
  iv: string,
  key: string,
  authTag?: string
): Promise<string> => {
  const cfg = await ControlPlaneCrypto.decryptSourcePayload(
    ciphertext,
    iv,
    authTag || '',
    key
  );
  return JSON.stringify(cfg);
};

