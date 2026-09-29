/**
 * =============================================================================
 * Xandeflix Prebuilt — Device Pairing Service (C4)
 *
 * Serviço client-side do aplicativo para solicitação e monitoramento
 * de pareamento de dispositivo (Pre-Auth) sem identificadores de hardware.
 *
 * Princípios:
 * - NO_HARDWARE_IDS: Sem MAC, IMEI ou Android ID.
 * - DEVICE_TOKEN_AUTHORITY: Token bruto gerado localmente; servidor recebe apenas hash.
 * - PRE_AUTH: Dispositivo solicita código antes de qualquer autenticação de cliente.
 * =============================================================================
 */

import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import type {
  DevicePairingRequestParams,
  DevicePairingRequestResult,
  DevicePairingStatusResult,
} from '../control-plane.types.ts';

export const PAIRING_CODE_TTL_SECONDS = 600; // 10 minutos
export const PAIRING_CODE_ATTEMPT_LIMIT = 5;

const STORAGE_KEY_PENDING_PAIRING = 'xandeflix:device_pairing:pending';

export interface PendingPairingState {
  pairingId: string;
  pairingCode: string;
  pairingStatusSecret: string;
  displayCode: string;
  expiresAt: string;
  deviceId: string;
  deviceTokenHash: string;
  requestedAt: string;
}

export function formatPairingCode(code: string): string {
  const clean = code.replace(/\D/g, '');
  if (clean.length === 6) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return code;
}

export class DevicePairingService {
  /**
   * Obtém ou gera o token de autorização do dispositivo via DeviceIdentityService.
   * DeviceIdentityService é a autoridade ÚNICA canônica (DUPLICATE_TOKEN_AUTHORITY=NAO).
   * O token bruto NUNCA é enviado ao servidor em solicitações de pareamento.
   */
  async getOrCreateDeviceToken(): Promise<{ rawDeviceToken: string; deviceTokenHash: string }> {
    return DeviceIdentityService.getOrCreateDeviceAuthToken();
  }

  /**
   * Solicita um novo código temporário de pareamento para o aplicativo.
   * O aplicativo deve fornecer installationId, deviceId, displayCode e o deviceTokenHash gerado localmente.
   */
  async requestPairing(params: DevicePairingRequestParams): Promise<DevicePairingRequestResult> {
    if (!params.installationId || !params.deviceId || !params.displayCode || !params.deviceTokenHash) {
      return {
        success: false,
        code: 'PARAMS_REQUIRED',
        message: 'installationId, deviceId, displayCode e deviceTokenHash sao obrigatorios.',
      };
    }

    try {
      const client = getSupabaseBrowserClient();
      if (!client) {
        return {
          success: false,
          code: 'CLIENT_UNAVAILABLE',
          message: 'Cliente Supabase não inicializado.',
        };
      }

      const { data, error } = await client.rpc('rpc_request_device_pairing', {
        p_installation_id: params.installationId,
        p_device_id: params.deviceId,
        p_display_code: params.displayCode,
        p_device_token_hash: params.deviceTokenHash,
        p_device_type: params.deviceType || 'TV',
        p_device_label: params.deviceLabel || null,
      });

      if (error) {
        const isAlreadyPaired = error.message?.includes('DEVICE_ALREADY_PAIRED');
        return {
          success: false,
          code: isAlreadyPaired ? 'DEVICE_ALREADY_PAIRED' : (error.code || 'RPC_ERROR'),
          message: error.message,
        };
      }

      const res = data as DevicePairingRequestResult;
      if (res.success && res.pairingId && res.pairingCode && res.expiresAt && res.pairingStatusSecret) {
        this.setPendingPairing({
          pairingId: res.pairingId,
          pairingCode: res.pairingCode,
          pairingStatusSecret: res.pairingStatusSecret,
          displayCode: params.displayCode,
          expiresAt: res.expiresAt,
          deviceId: params.deviceId,
          deviceTokenHash: params.deviceTokenHash,
          requestedAt: new Date().toISOString(),
        });
      }

      return res;
    } catch (err) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Consulta o status do pareamento atual no servidor.
   * Utiliza pairingStatusSecret (capability token temporária de 192 bits) sem expor deviceTokenHash como bearer secret.
   */
  async checkPairingStatus(
    pairingId: string,
    deviceId: string,
    pairingStatusSecret: string,
  ): Promise<DevicePairingStatusResult> {
    try {
      const client = getSupabaseBrowserClient();
      if (!client) {
        return {
          success: false,
          code: 'CLIENT_UNAVAILABLE',
          message: 'Cliente Supabase não inicializado.',
        };
      }

      const { data, error } = await client.rpc('rpc_check_pairing_status', {
        p_pairing_id: pairingId,
        p_device_id: deviceId,
        p_pairing_status_secret: pairingStatusSecret,
      });

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      const res = data as DevicePairingStatusResult;
      if (res.status === 'CONSUMED' || res.status === 'EXPIRED' || res.status === 'CANCELLED') {
        // Se finalizado, limpa do storage local se coincidir
        const pending = this.getPendingPairing();
        if (pending && pending.pairingId === pairingId) {
          this.clearPendingPairing();
        }
      }

      return res;
    } catch (err) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Obtém metadados de pareamento pendente armazenados localmente no dispositivo.
   */
  getPendingPairing(): PendingPairingState | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(STORAGE_KEY_PENDING_PAIRING);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PendingPairingState;
      // Verifica se já expirou localmente
      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        this.clearPendingPairing();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Salva metadados de pareamento pendente.
   */
  setPendingPairing(state: PendingPairingState): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PENDING_PAIRING, JSON.stringify(state));
      }
    } catch {
      // Best-effort storage
    }
  }

  /**
   * Limpa o estado pendente de pareamento local.
   */
  clearPendingPairing(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_PENDING_PAIRING);
      }
    } catch {
      // Ignore
    }
  }
}

let defaultDevicePairingService: DevicePairingService | null = null;

export function getDevicePairingService(): DevicePairingService {
  if (!defaultDevicePairingService) {
    defaultDevicePairingService = new DevicePairingService();
  }
  return defaultDevicePairingService;
}
