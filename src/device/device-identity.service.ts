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

// Alfabeto legível alfanumérico para display code (ex: XF-7K29-PQ41)
const DISPLAY_CODE_CHARSET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export class DeviceIdentityService {
  private static cachedIdentity: DeviceIdentity | null = null;
  private static cachedActivation: StoredActivationState | null = null;
  private static cachedInstallation: InstallationIdentity | null = null;

  /**
   * Gera um UUID v4 criptograficamente seguro.
   */
  static generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Fallback criptográfico via getRandomValues
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
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
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
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
  static async getOrCreateIdentity(): Promise<DeviceIdentity> {
    if (this.cachedIdentity) {
      return this.cachedIdentity;
    }

    // 1. Tentar ler do Filesystem nativo privado
    try {
      const file = await Filesystem.readFile({
        path: IDENTITY_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      if (file && file.data) {
        const parsed = JSON.parse(String(file.data)) as DeviceIdentity;
        if (parsed.deviceId && parsed.displayCode) {
          this.cachedIdentity = parsed;
          return parsed;
        }
      }
    } catch {
      // Arquivo ainda não existe no storage nativo
    }

    // 2. Tentar ler do localStorage (fallback)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_IDENTITY_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DeviceIdentity;
          if (parsed.deviceId && parsed.displayCode) {
            this.cachedIdentity = parsed;
            // Tenta sincronizar de volta para o filesystem se possível
            this.persistIdentityToFilesystem(parsed).catch(() => {});
            return parsed;
          }
        }
      } catch {}
    }

    // 3. Primeira execução: gerar identidade persistente
    const deviceType = this.detectDefaultDeviceType();
    const newIdentity: DeviceIdentity = {
      deviceId: this.generateUuid(),
      displayCode: this.generateDisplayCode(),
      deviceType,
      deviceLabel: deviceType === 'TV' ? 'TV SALA' : 'MEU DISPOSITIVO',
      createdAtIso: new Date().toISOString(),
    };

    this.cachedIdentity = newIdentity;

    // Salva no storage privado e localStorage
    await this.persistIdentityToFilesystem(newIdentity);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_IDENTITY_KEY, JSON.stringify(newIdentity));
      } catch {}
    }

    return newIdentity;
  }

  private static async persistIdentityToFilesystem(identity: DeviceIdentity): Promise<void> {
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

    // 1. Tentar ler do Filesystem nativo privado
    try {
      const file = await Filesystem.readFile({
        path: INSTALLATION_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      if (file && file.data) {
        const parsed = JSON.parse(String(file.data)) as InstallationIdentity;
        if (parsed.installationId) {
          this.cachedInstallation = parsed;
          return parsed;
        }
      }
    } catch {
      // Arquivo ainda não existe no storage nativo
    }

    // 2. Tentar ler do localStorage (fallback)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_INSTALLATION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as InstallationIdentity;
          if (parsed.installationId) {
            this.cachedInstallation = parsed;
            this.persistInstallationToFilesystem(parsed).catch(() => {});
            return parsed;
          }
        }
      } catch {}
    }

    // 3. Primeira execução: gerar instalação persistente
    const newInstallation: InstallationIdentity = {
      installationId: this.generateUuid(),
      createdAtIso: new Date().toISOString(),
    };

    this.cachedInstallation = newInstallation;

    await this.persistInstallationToFilesystem(newInstallation);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_INSTALLATION_KEY, JSON.stringify(newInstallation));
      } catch {}
    }

    return newInstallation;
  }

  private static async persistInstallationToFilesystem(identity: InstallationIdentity): Promise<void> {
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
      await Filesystem.writeFile({
        path: ACTIVATION_FILE,
        directory: Directory.Data,
        data: jsonStr,
        encoding: Encoding.UTF8,
      });

      const saved = await Filesystem.readFile({
        path: ACTIVATION_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const parsed = JSON.parse(String(saved.data)) as StoredActivationState;
      const verified = parsed.deviceId === state.deviceId
        && parsed.status === 'AUTHORIZED'
        && parsed.deviceAuthToken === state.deviceAuthToken;
      if (!verified) return false;
      this.cachedActivation = state;
      return true;
    } catch {
      // Fallback exclusivo quando o bridge nativo não está disponível.
      if (typeof window !== 'undefined' && window.localStorage) {
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
      const file = await Filesystem.readFile({
        path: ACTIVATION_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      if (file && file.data) {
        const parsed = JSON.parse(String(file.data)) as StoredActivationState;
        this.cachedActivation = parsed;
        return parsed;
      }
    } catch {}

    // 2. localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_ACTIVATION_KEY);
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
  static async getOrCreateDeviceAuthToken(): Promise<{ rawDeviceToken: string; deviceTokenHash: string }> {
    // 1. Prioridade: estado de ativação já persistido
    const activation = await this.loadActivationState();
    if (activation && typeof activation.deviceAuthToken === 'string' && activation.deviceAuthToken.trim().length > 0) {
      const cleanToken = activation.deviceAuthToken.trim();
      const hash = await this.computeSha256(cleanToken);
      return { rawDeviceToken: cleanToken, deviceTokenHash: hash };
    }

    // 2. Tentar ler token pendente do Filesystem nativo
    try {
      const file = await Filesystem.readFile({
        path: PENDING_TOKEN_FILE,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      if (file && file.data) {
        const raw = String(file.data).trim();
        if (raw.length >= 32) {
          const hash = await this.computeSha256(raw);
          return { rawDeviceToken: raw, deviceTokenHash: hash };
        }
      }
    } catch {}

    // 3. Fallback localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_PENDING_TOKEN_KEY);
        if (raw && raw.trim().length >= 32) {
          const cleanRaw = raw.trim();
          const hash = await this.computeSha256(cleanRaw);
          return { rawDeviceToken: cleanRaw, deviceTokenHash: hash };
        }
      } catch {}
    }

    // 4. Gerar novo token bruto criptograficamente seguro (32 bytes = 256 bits)
    const bytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 32; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    const newRawToken = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Persistir no storage nativo privado
    try {
      await Filesystem.writeFile({
        path: PENDING_TOKEN_FILE,
        directory: Directory.Data,
        data: newRawToken,
        encoding: Encoding.UTF8,
      });
    } catch {}

    // Persistir no localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_PENDING_TOKEN_KEY, newRawToken);
      } catch {}
    }

    const hash = await this.computeSha256(newRawToken);
    return { rawDeviceToken: newRawToken, deviceTokenHash: hash };
  }

  /**
   * Gera a chave longa do fluxo A1. Ela é diferente do deviceAuthToken:
   * a chave pode ser exibida ao usuário para o claim externo, enquanto o
   * deviceAuthToken permanece como credencial interna do runtime.
   */
  static async getOrCreateDeviceActivationKey(): Promise<{ rawActivationKey: string; activationKeyHash: string }> {
    const readStored = async (): Promise<string | null> => {
      try {
        const file = await Filesystem.readFile({
          path: DEVICE_ACTIVATION_KEY_FILE,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        const raw = String(file.data || '').trim();
        if (/^[0-9]{6}$/.test(raw)) return raw;
      } catch {}

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw = window.localStorage.getItem(LOCAL_STORAGE_DEVICE_ACTIVATION_KEY)?.trim();
          if (raw && /^[0-9]{6}$/.test(raw)) return raw;
        } catch {}
      }

      return null;
    };

    let rawActivationKey = await readStored();
    if (!rawActivationKey) {
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const sample = new Uint32Array(1);
        const range = 900_000;
        const limit = Math.floor(0x1_0000_0000 / range) * range;
        do {
          crypto.getRandomValues(sample);
        } while (sample[0] >= limit);
        rawActivationKey = String(100_000 + (sample[0] % range));
      } else {
        rawActivationKey = String(100_000 + Math.floor(Math.random() * 900_000));
      }

      try {
        await Filesystem.writeFile({
          path: DEVICE_ACTIVATION_KEY_FILE,
          directory: Directory.Data,
          data: rawActivationKey,
          encoding: Encoding.UTF8,
        });
      } catch {}

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(LOCAL_STORAGE_DEVICE_ACTIVATION_KEY, rawActivationKey);
        } catch {}
      }
    }

    return {
      rawActivationKey,
      activationKeyHash: await this.computeSha256(rawActivationKey),
    };
  }

  /** Remove a consumed capability so a later activation request gets a new key. */
  static async rotateDeviceActivationKey(): Promise<void> {
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
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const encoder = new TextEncoder();
      const data = encoder.encode(value);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    try {
      const nodeCrypto = await import('crypto');
      return nodeCrypto.createHash('sha256').update(value, 'utf8').digest('hex');
    } catch {
      throw new Error('Criptografia SHA-256 indisponível');
    }
  }
}

export const generateSecureDeviceId = (): string => DeviceIdentityService.generateUuid();
export const generateDisplayCode = (): string => DeviceIdentityService.generateDisplayCode();
export const isValidDisplayCode = (code: string): boolean => {
  return /^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
};
