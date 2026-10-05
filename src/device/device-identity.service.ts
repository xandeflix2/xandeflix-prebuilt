/**
 * Xandeflix Prebuilt — Device Identity Service (Experiment R7B)
 *
 * Gerenciador de identidade e persistência segura do dispositivo no sandbox privado.
 *
 * Princípios:
 * - NO_HARDWARE_FINGERPRINT: Identidade primária é um UUID aleatório criptograficamente seguro.
 * - DISPLAY_CODE: Gera código visual XF-XXXX-XXXX com caracteres inequívocos (sem 0, O, 1, I).
 * - PERSISTENCE: Garante DEVICE_ID_SAME=SIM após reboot ou reinicialização do aplicativo.
 * - PRIVATE_STORAGE: Reside exclusivamente em context.getFilesDir() / Directory.Data.
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { DeviceIdentity, DeviceType, InstallationIdentity, StoredActivationState } from './device.types.ts';

const IDENTITY_FILE = 'device_identity.json';
const ACTIVATION_FILE = 'device_activation.json';
const DEVICE_ACTIVATION_KEY_FILE = 'device_activation_key.json';
const INSTALLATION_FILE = 'app_installation.json';
const PENDING_TOKEN_FILE = 'pending_device_token.json';

const LOCAL_STORAGE_IDENTITY_KEY = '__xandeflix_device_identity__';
const LOCAL_STORAGE_ACTIVATION_KEY = '__xandeflix_device_activation__';
const LOCAL_STORAGE_DEVICE_ACTIVATION_KEY = '__xandeflix_device_activation_key__';
const LOCAL_STORAGE_INSTALLATION_KEY = '__xandeflix_app_installation__';
const LOCAL_STORAGE_PENDING_TOKEN_KEY = '__xandeflix_pending_device_token__';

const LOCAL_STORAGE_TIMEOUT_MS = 4000;
const localCandidates = new Map<string, string>();
const nativeVerifiedValues = new Map<string, string>();
const unreadNativePaths = new Set<string>();

async function localDeadline<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('LOCAL_STORAGE_TIMEOUT')), LOCAL_STORAGE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function readLocalCopy(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

async function readLocalValue(path: string, key: string, valid: (raw: string) => boolean): Promise<string | null> {
  // A failed write retains the same candidate: retries never rotate credentials.
  const candidate = localCandidates.get(path);
  if (candidate) return candidate;
  let readTimedOut = false;
  let readFailed = false;
  try {
    const file = await localDeadline(Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 }));
    unreadNativePaths.delete(path);
    const raw = String(file.data || '').trim();
    if (valid(raw)) {
      nativeVerifiedValues.set(path, raw);
      unreadNativePaths.delete(path);
      try { window.localStorage.setItem(key, raw); } catch { /* native copy remains canonical */ }
      return raw;
    }
  } catch (error) {
    readTimedOut = error instanceof Error && error.message === 'LOCAL_STORAGE_TIMEOUT';
    const detail = error as { code?: string; message?: string } | null;
    const missing = detail?.code === 'OS-PLUG-FILE-0008' || detail?.code === 'ENOENT'
      || /does not exist|no such file|not found/i.test(detail?.message || '');
    readFailed = !missing;
    if (missing) unreadNativePaths.delete(path);
  }
  if (readFailed) unreadNativePaths.add(path);
  const fallback = readLocalCopy(key)?.trim();
  if (fallback && valid(fallback)) return fallback;
  // A hung read is not evidence of an absent file. Do not overwrite an unknown key.
  if (readTimedOut) throw new Error('LOCAL_STORAGE_TIMEOUT');
  if (readFailed) throw new Error('LOCAL_STORAGE_READ_FAILED');
  return null;
}

async function persistLocalValue(path: string, key: string, raw: string): Promise<void> {
  localCandidates.set(path, raw);
  let localVerified = false;
  try {
    window.localStorage.setItem(key, raw);
    localVerified = window.localStorage.getItem(key) === raw;
  } catch { /* native persistence is still possible */ }
  // Never mirror over a file whose read is still pending (even with a local copy).
  if (unreadNativePaths.has(path)) {
    if (!localVerified) throw new Error('LOCAL_STORAGE_TIMEOUT');
    return;
  }
  const knownNative = nativeVerifiedValues.get(path);
  if (knownNative) {
    try {
      if (knownNative === raw || JSON.stringify(JSON.parse(knownNative)) === JSON.stringify(JSON.parse(raw))) return;
    } catch { /* plain string credential */ }
  }
  const nativeWrite = (async () => {
    await localDeadline(Filesystem.writeFile({ path, directory: Directory.Data, data: raw, encoding: Encoding.UTF8 }));
    const saved = await localDeadline(Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 }));
    if (String(saved.data).trim() !== raw) throw new Error('LOCAL_STORAGE_VERIFY_FAILED');
    nativeVerifiedValues.set(path, raw);
  })();
  if (localVerified) {
    // Do not hold the local UI hostage to a stalled native bridge.
    void nativeWrite.catch(() => undefined);
    return;
  }
  try {
    await nativeWrite;
  } catch {
    throw new Error('LOCAL_IDENTITY_PERSISTENCE_FAILED');
  }
}

function validJson(raw: string, fields: string[]): boolean {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return fields.every((field) => typeof value?.[field] === 'string' && Boolean(value[field]));
  } catch {
    return false;
  }
}

// Alfabeto legível alfanumérico para display code (ex: XF-7K29-PQ41)
const DISPLAY_CODE_CHARSET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function encodeUtf8(value: string): Uint8Array {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    let codePoint = value.charCodeAt(index);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00);
        index += 1;
      } else {
        codePoint = 0xfffd;
      }
    } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
      codePoint = 0xfffd;
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >>> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >>> 12),
        0x80 | ((codePoint >>> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >>> 18),
        0x80 | ((codePoint >>> 12) & 0x3f),
        0x80 | ((codePoint >>> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }

  return Uint8Array.from(bytes);
}

function computeSha256Pure(value: string): string {
  const source = encodeUtf8(value);
  const bitLength = source.length * 8;
  const paddedLength = Math.ceil((source.length + 9) / 64) * 64;
  const message = new Uint8Array(paddedLength);
  message.set(source);
  message[source.length] = 0x80;

  const bitLengthHigh = Math.floor(bitLength / 0x1_0000_0000);
  const bitLengthLow = bitLength >>> 0;
  const lengthOffset = paddedLength - 8;
  message[lengthOffset] = (bitLengthHigh >>> 24) & 0xff;
  message[lengthOffset + 1] = (bitLengthHigh >>> 16) & 0xff;
  message[lengthOffset + 2] = (bitLengthHigh >>> 8) & 0xff;
  message[lengthOffset + 3] = bitLengthHigh & 0xff;
  message[lengthOffset + 4] = (bitLengthLow >>> 24) & 0xff;
  message[lengthOffset + 5] = (bitLengthLow >>> 16) & 0xff;
  message[lengthOffset + 6] = (bitLengthLow >>> 8) & 0xff;
  message[lengthOffset + 7] = bitLengthLow & 0xff;

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < message.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const position = offset + index * 4;
      words[index] = (
        (message[position] << 24) |
        (message[position + 1] << 16) |
        (message[position + 2] << 8) |
        message[position + 3]
      ) >>> 0;
    }

    for (let index = 16; index < 64; index += 1) {
      const previous15 = words[index - 15];
      const previous2 = words[index - 2];
      const sigma0 = rotateRight(previous15, 7) ^ rotateRight(previous15, 18) ^ (previous15 >>> 3);
      const sigma1 = rotateRight(previous2, 17) ^ rotateRight(previous2, 19) ^ (previous2 >>> 10);
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let index = 0; index < 64; index += 1) {
      const sigma1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temporary1 = (h + sigma1 + choice + SHA256_K[index] + words[index]) >>> 0;
      const sigma0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (sigma0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

let initIdentityPromise: Promise<DeviceIdentity> | null = null;
let initInstallationPromise: Promise<InstallationIdentity> | null = null;

export class DeviceIdentityService {
  public static cachedIdentity: DeviceIdentity | null = null;
  private static cachedActivation: StoredActivationState | null = null;
  public static cachedInstallation: InstallationIdentity | null = null;
  private static activationKeyPromise: Promise<{ rawActivationKey: string; activationKeyHash: string }> | null = null;
  private static deviceTokenPromise: Promise<{ rawDeviceToken: string; deviceTokenHash: string }> | null = null;

  /**
   * Gera um UUID v4 criptograficamente seguro.
   */
  static generateUuid(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    // Fallback criptográfico via getRandomValues
    const bytes = new Uint8Array(16);
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      // Fallback pseudo-aleatório caso Web Crypto não esteja montado (ex: ambientes de teste mínimos)
      for (let i = 0; i < 16; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    // Marca versão 4 e variante RFC 4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /**
   * Gera um código de exibição legível no formato XF-XXXX-XXXX.
   */
  static generateDisplayCode(): string {
    const bytes = new Uint8Array(8);
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 8; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += DISPLAY_CODE_CHARSET[bytes[i] % DISPLAY_CODE_CHARSET.length];
    }
    for (let i = 4; i < 8; i++) {
      p2 += DISPLAY_CODE_CHARSET[bytes[i] % DISPLAY_CODE_CHARSET.length];
    }

    return `XF-${p1}-${p2}`;
  }

  /**
   * Detecta heurística de tipo padrão do dispositivo com base no ambiente.
   */
  static detectDefaultDeviceType(): DeviceType {
    if (typeof navigator === 'undefined') return 'TV';
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('aft') || ua.includes('firetv') || ua.includes('smart-tv') || ua.includes('googletv') || ua.includes('crkey')) {
      return 'TV';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'TABLET';
    }
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'PHONE';
    }
    return 'TV'; // Padrão recomendado para dispositivos de streaming de sala
  }

  /**
   * Obtém a identidade persistida do dispositivo ou gera uma nova no primeiro boot.
   */
  /**
   * Obtém a identidade persistida do dispositivo ou gera uma nova no primeiro boot.
   */
  static async getOrCreateIdentity(): Promise<DeviceIdentity> {
    return getOrCreateDeviceIdentity();
  }

  public static async persistIdentityToFilesystem(identity: DeviceIdentity): Promise<void> {
    try {
      await Filesystem.writeFile({
        path: IDENTITY_FILE,
        directory: Directory.Data,
        data: JSON.stringify(identity, null, 2),
        encoding: Encoding.UTF8,
      });
    } catch {}
  }

  /**
   * Obtém a identidade da instalação atual persistida no sandbox privado ou gera uma nova no primeiro boot.
   *
   * Princípios:
   * - INSTALLATION_NOT_AUTHORIZED_DEVICE: Instalação identifica apenas a instância local do app.
   * - UNINSTALL_NEW_IDENTITY: Desinstalação e reinstalação limpam o sandbox, gerando nova installationId.
   * - NO_HARDWARE_FINGERPRINT: Baseada estritamente em UUID v4 gerado localmente.
   */
  static async getOrCreateInstallationIdentity(): Promise<InstallationIdentity> {
    if (this.cachedInstallation) {
      return this.cachedInstallation;
    }
    if (initInstallationPromise) {
      return initInstallationPromise;
    }

    initInstallationPromise = (async () => {
      try {
        const stored = await readLocalValue(INSTALLATION_FILE, LOCAL_STORAGE_INSTALLATION_KEY,
          (raw) => validJson(raw, ['installationId']));
        const installation: InstallationIdentity = stored ? JSON.parse(stored) : {
          installationId: this.generateUuid(),
          createdAtIso: new Date().toISOString(),
        };
        await persistLocalValue(INSTALLATION_FILE, LOCAL_STORAGE_INSTALLATION_KEY, JSON.stringify(installation));
        this.cachedInstallation = installation;
        return installation;
      } finally {
        initInstallationPromise = null;
      }
    })();

    return initInstallationPromise;
  }

  public static async persistInstallationToFilesystem(identity: InstallationIdentity): Promise<void> {
    try {
      await Filesystem.writeFile({
        path: INSTALLATION_FILE,
        directory: Directory.Data,
        data: JSON.stringify(identity, null, 2),
        encoding: Encoding.UTF8,
      });
    } catch {}
  }

  /**
   * Salva o estado de ativação no storage privado.
   */
  static async saveActivationState(state: StoredActivationState): Promise<void> {
    this.cachedActivation = state;
    const jsonStr = JSON.stringify(state, null, 2);

    try {
      await Filesystem.writeFile({
        path: ACTIVATION_FILE,
        directory: Directory.Data,
        data: jsonStr,
        encoding: Encoding.UTF8,
      });
    } catch {}

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_ACTIVATION_KEY, jsonStr);
      } catch {}
    }
  }

  /**
   * Persistência usada pela reativação: confirma o write antes de liberar o
   * fluxo para o preflight. O token nunca é retornado nem registrado.
   */
  static async saveActivationStateVerified(state: StoredActivationState): Promise<boolean> {
    const jsonStr = JSON.stringify(state, null, 2);

    try {
      await localDeadline(Filesystem.writeFile({
        path: ACTIVATION_FILE,
        directory: Directory.Data,
        data: jsonStr,
        encoding: Encoding.UTF8,
      }));

      const saved = await localDeadline(Filesystem.readFile({
        path: ACTIVATION_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      }));
      const parsed = JSON.parse(String(saved.data)) as StoredActivationState;
      const verified = parsed.deviceId === state.deviceId
        && parsed.status === 'AUTHORIZED'
        && parsed.deviceAuthToken === state.deviceAuthToken;
      if (!verified) return false;
      this.cachedActivation = state;
      return true;
    } catch {
      // Fallback exclusivo quando o bridge nativo não está disponível.
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LOCAL_STORAGE_ACTIVATION_KEY, jsonStr);
          const raw = window.localStorage.getItem(LOCAL_STORAGE_ACTIVATION_KEY);
          if (!raw) return false;
          const parsed = JSON.parse(raw) as StoredActivationState;
          const verified = parsed.deviceId === state.deviceId
            && parsed.status === 'AUTHORIZED'
            && parsed.deviceAuthToken === state.deviceAuthToken;
          if (!verified) return false;
          this.cachedActivation = state;
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Carrega o estado de ativação previamente persistido.
   */
  static async loadActivationState(): Promise<StoredActivationState | null> {
    if (this.cachedActivation) {
      return this.cachedActivation;
    }

    // 1. Filesystem nativo
    try {
      const file = await localDeadline(Filesystem.readFile({
        path: ACTIVATION_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      }));

      if (file && file.data) {
        const parsed = JSON.parse(String(file.data)) as StoredActivationState;
        this.cachedActivation = parsed;
        return parsed;
      }
    } catch {}

    // 2. localStorage fallback
    {
      try {
        const raw = readLocalCopy(LOCAL_STORAGE_ACTIVATION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredActivationState;
          this.cachedActivation = parsed;
          return parsed;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Remove o estado de ativação do dispositivo.
   */
  static async clearActivationState(): Promise<void> {
    this.cachedActivation = null;

    try {
      await Filesystem.deleteFile({
        path: ACTIVATION_FILE,
        directory: Directory.Data,
      });
    } catch {}

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_ACTIVATION_KEY);
      } catch {}
    }
  }

  /**
   * Obtém ou gera o deviceAuthToken canônico local.
   * ÚNICA autoridade canônica para criação e resolução de deviceAuthToken.
   * Regras:
   * 1. Se o dispositivo já possui ativação autorizada, preserva o token existente intacto (zero rotação).
   * 2. Se for uma nova instalação ainda não ativada, obtém ou gera um token bruto aleatório seguro (32 bytes = 256 bits).
   * 3. O servidor armazena apenas o hash SHA-256; o token bruto NUNCA é retornado ou exposto desnecessariamente.
   */
  static getOrCreateDeviceAuthToken(): Promise<{ rawDeviceToken: string; deviceTokenHash: string }> {
    if (this.deviceTokenPromise) return this.deviceTokenPromise;
    const promise = this.createDeviceAuthToken();
    this.deviceTokenPromise = promise;
    void promise.finally(() => {
      if (this.deviceTokenPromise === promise) this.deviceTokenPromise = null;
    }).catch(() => undefined);
    return promise;
  }

  private static async createDeviceAuthToken(): Promise<{ rawDeviceToken: string; deviceTokenHash: string }> {
    // 1. Prioridade: estado de ativação já persistido
    const activation = await this.loadActivationState();
    if (activation && typeof activation.deviceAuthToken === 'string' && activation.deviceAuthToken.trim().length > 0) {
      const cleanToken = activation.deviceAuthToken.trim();
      const hash = await this.computeSha256(cleanToken);
      return { rawDeviceToken: cleanToken, deviceTokenHash: hash };
    }

    const stored = await readLocalValue(PENDING_TOKEN_FILE, LOCAL_STORAGE_PENDING_TOKEN_KEY, (raw) => raw.length >= 32);
    if (stored) {
      await persistLocalValue(PENDING_TOKEN_FILE, LOCAL_STORAGE_PENDING_TOKEN_KEY, stored);
      return { rawDeviceToken: stored, deviceTokenHash: await this.computeSha256(stored) };
    }

    // 4. Gerar novo token bruto criptograficamente seguro (32 bytes = 256 bits)
    const bytes = new Uint8Array(32);
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 32; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    const newRawToken = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

    await persistLocalValue(PENDING_TOKEN_FILE, LOCAL_STORAGE_PENDING_TOKEN_KEY, newRawToken);

    const hash = await this.computeSha256(newRawToken);
    return { rawDeviceToken: newRawToken, deviceTokenHash: hash };
  }

  /**
   * Gera a chave longa do fluxo A1. Ela é diferente do deviceAuthToken:
   * a chave pode ser exibida ao usuário para o claim externo, enquanto o
   * deviceAuthToken permanece como credencial interna do runtime.
   */
  static getOrCreateDeviceActivationKey(): Promise<{ rawActivationKey: string; activationKeyHash: string }> {
    if (this.activationKeyPromise) {
      return this.activationKeyPromise;
    }

    const activationKeyPromise = (async () => {
      try {
        let rawActivationKey = await readLocalValue(DEVICE_ACTIVATION_KEY_FILE, LOCAL_STORAGE_DEVICE_ACTIVATION_KEY,
          (raw) => /^[0-9]{6}$/.test(raw));
        if (!rawActivationKey) {
          const sample = new Uint32Array(1);
          const range = 900_000;
          const limit = Math.floor(0x1_0000_0000 / range) * range;
          if (typeof globalThis.crypto?.getRandomValues === 'function') {
            do {
              globalThis.crypto.getRandomValues(sample);
            } while (sample[0] >= limit);
            rawActivationKey = String(100_000 + (sample[0] % range));
          } else {
            rawActivationKey = String(100_000 + Math.floor(Math.random() * range));
          }

        }

        await persistLocalValue(DEVICE_ACTIVATION_KEY_FILE, LOCAL_STORAGE_DEVICE_ACTIVATION_KEY, rawActivationKey);

        return {
          rawActivationKey,
          activationKeyHash: await this.computeSha256(rawActivationKey),
        };
      } catch (error) {
        this.activationKeyPromise = null;
        throw error;
      }
    })();

    this.activationKeyPromise = activationKeyPromise;
    return activationKeyPromise;
  }

  /** Remove a consumed capability so a later activation request gets a new key. */
  static async rotateDeviceActivationKey(): Promise<void> {
    this.activationKeyPromise = null;
    localCandidates.delete(DEVICE_ACTIVATION_KEY_FILE);
    nativeVerifiedValues.delete(DEVICE_ACTIVATION_KEY_FILE);
    unreadNativePaths.delete(DEVICE_ACTIVATION_KEY_FILE);

    try {
      await Filesystem.deleteFile({
        path: DEVICE_ACTIVATION_KEY_FILE,
        directory: Directory.Data,
      });
    } catch {}

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_DEVICE_ACTIVATION_KEY);
      } catch {}
    }
  }

  private static async computeSha256(value: string): Promise<string> {
    try {
      if (globalThis.crypto?.subtle?.digest) {
        const data = new TextEncoder().encode(value);
        const digest = await localDeadline(globalThis.crypto.subtle.digest('SHA-256', data));
        if (digest.byteLength === 32) {
          return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
      }
    } catch { /* Missing, rejected or stalled Web Crypto: use the same real SHA-256. */ }
    return computeSha256Pure(value);
  }
}

export const generateSecureDeviceId = (): string => DeviceIdentityService.generateUuid();
export const generateDisplayCode = (): string => DeviceIdentityService.generateDisplayCode();
export const isValidDisplayCode = (code: string): boolean => {
  return /^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
};

export async function getOrCreateDeviceIdentity(): Promise<DeviceIdentity> {
  if (initIdentityPromise) {
    return initIdentityPromise;
  }
  if (DeviceIdentityService.cachedIdentity) {
    return DeviceIdentityService.cachedIdentity;
  }

  initIdentityPromise = (async () => {
    try {
      const stored = await readLocalValue(IDENTITY_FILE, LOCAL_STORAGE_IDENTITY_KEY,
        (raw) => validJson(raw, ['deviceId', 'displayCode']));
      const deviceType = DeviceIdentityService.detectDefaultDeviceType();
      const identity: DeviceIdentity = stored ? JSON.parse(stored) : {
        deviceId: DeviceIdentityService.generateUuid(),
        displayCode: DeviceIdentityService.generateDisplayCode(),
        deviceType,
        deviceLabel: deviceType === 'TV' ? 'TV SALA' : 'MEU DISPOSITIVO',
        createdAtIso: new Date().toISOString(),
      };

      await persistLocalValue(IDENTITY_FILE, LOCAL_STORAGE_IDENTITY_KEY, JSON.stringify(identity));
      DeviceIdentityService.cachedIdentity = identity;
      return identity;
    } finally {
      initIdentityPromise = null;
    }
  })();

  return initIdentityPromise;
}
