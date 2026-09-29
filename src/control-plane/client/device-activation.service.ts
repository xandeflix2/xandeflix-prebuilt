/**
 * Xandeflix Prebuilt — A1 Remote Device Activation Service
 *
 * Registra a solicitação de ativação do dispositivo e consulta seu status.
 * A chave em texto puro só é usada para exibição/claim; este serviço envia
 * somente o hash para registrar a solicitação e usa a capability de status
 * retornada uma única vez para acompanhar o claim no portal.
 */

import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import { getPublicDeviceActivationService } from './public-device-activation.service.ts';
import type {
  DeviceActivationRequestParams,
  DeviceActivationRequestResult,
  DeviceActivationStatusResult,
} from '../control-plane.types.ts';

const STORAGE_KEY_PENDING_ACTIVATION = 'xandeflix:device_activation:pending';

export interface PendingDeviceActivationState {
  activationId: string;
  activationStatusSecret: string;
  displayCode: string;
  deviceId: string;
  requestedAt: string;
}

export class DeviceActivationService {
  async getOrCreateActivationKey(): Promise<{ rawActivationKey: string; activationKeyHash: string }> {
    return DeviceIdentityService.getOrCreateDeviceActivationKey();
  }

  async requestActivation(params: DeviceActivationRequestParams): Promise<DeviceActivationRequestResult> {
    if (!params.installationId || !params.deviceId || !params.displayCode || !params.deviceTokenHash || !params.activationKeyHash) {
      return {
        success: false,
        code: 'PARAMS_REQUIRED',
        message: 'Os dados do dispositivo e os hashes de ativação são obrigatórios.',
      };
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, code: 'CLIENT_UNAVAILABLE', message: 'Cliente Supabase não inicializado.' };
    }

    try {
      const { data, error } = await client.rpc('rpc_request_device_activation', {
        p_installation_id: params.installationId,
        p_device_id: params.deviceId,
        p_display_code: params.displayCode,
        p_device_token_hash: params.deviceTokenHash,
        p_activation_key_hash: params.activationKeyHash,
        p_device_type: params.deviceType || 'TV',
        p_device_label: params.deviceLabel || null,
      });

      if (error) {
        return { success: false, code: error.code || 'RPC_ERROR', message: error.message };
      }

      const result = data as DeviceActivationRequestResult;
      if (result.success && result.activationId && result.activationStatusSecret) {
        this.setPendingActivation({
          activationId: result.activationId,
          activationStatusSecret: result.activationStatusSecret,
          displayCode: params.displayCode,
          deviceId: params.deviceId,
          requestedAt: new Date().toISOString(),
        });
      }
      return result;
    } catch (error) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async registerPermanentKey(params: {
    activationId: string;
    deviceId: string;
    displayCode: string;
    activationKey: string;
  }): Promise<{ success: boolean; code?: string; message?: string }> {
    return getPublicDeviceActivationService().registerPermanentKey(params);
  }

  async checkStatus(
    activationId: string,
    deviceId: string,
    activationStatusSecret: string,
  ): Promise<DeviceActivationStatusResult> {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, code: 'CLIENT_UNAVAILABLE', message: 'Cliente Supabase não inicializado.' };
    }

    try {
      const { data, error } = await client.rpc('rpc_check_device_activation_status', {
        p_activation_id: activationId,
        p_device_id: deviceId,
        p_activation_status_secret: activationStatusSecret,
      });
      if (error) {
        return { success: false, code: error.code || 'RPC_ERROR', message: error.message };
      }

      const result = data as DeviceActivationStatusResult;
      if (result.status === 'CONSUMED' || result.status === 'CANCELLED') {
        const pending = this.getPendingActivation();
        if (pending?.activationId === activationId) this.clearPendingActivation();
      }
      return result;
    } catch (error) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getPendingActivation(): PendingDeviceActivationState | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = window.localStorage.getItem(STORAGE_KEY_PENDING_ACTIVATION);
      return raw ? JSON.parse(raw) as PendingDeviceActivationState : null;
    } catch {
      return null;
    }
  }

  private setPendingActivation(state: PendingDeviceActivationState): void {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY_PENDING_ACTIVATION, JSON.stringify(state));
      }
    } catch {}
  }

  clearPendingActivation(): void {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY_PENDING_ACTIVATION);
    } catch {}
  }
}

let defaultDeviceActivationService: DeviceActivationService | null = null;

export function getDeviceActivationService(): DeviceActivationService {
  if (!defaultDeviceActivationService) defaultDeviceActivationService = new DeviceActivationService();
  return defaultDeviceActivationService;
}
