/**
 * Xandeflix Prebuilt — Customer A1 Device Activation Service
 *
 * Claim do dispositivo pelo Portal do Cliente autenticado. O portal envia a
 * chave somente por HTTPS para a RPC; nenhum valor é persistido no navegador.
 */

import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import type {
  CustomerActivateDeviceParams,
  CustomerActivateDeviceResult,
} from '../control-plane.types.ts';

export class CustomerDeviceActivationService {
  async activateDevice(params: CustomerActivateDeviceParams): Promise<CustomerActivateDeviceResult> {
    const displayCode = params.displayCode?.trim().toUpperCase();
    const activationKey = params.activationKey?.trim();
    const sourceId = params.sourceId?.trim();

    if (!displayCode || !activationKey || !sourceId) {
      return {
        success: false,
        code: 'PARAMS_REQUIRED',
        message: 'Código do dispositivo, chave de ativação e fonte são obrigatórios.',
      };
    }

    if (activationKey.length < 32) {
      return {
        success: false,
        code: 'ACTIVATION_KEY_INVALID',
        message: 'A chave de ativação informada é inválida.',
      };
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, code: 'CLIENT_UNAVAILABLE', message: 'Cliente Supabase não inicializado.' };
    }

    try {
      const { data, error } = await client.rpc('rpc_customer_activate_device', {
        p_display_code: displayCode,
        p_activation_key: activationKey,
        p_source_id: sourceId,
        p_device_label: params.deviceLabel?.trim() || null,
        p_license_id: params.licenseId || null,
      });

      if (error) {
        return { success: false, code: error.code || 'RPC_ERROR', message: error.message };
      }

      return data as CustomerActivateDeviceResult;
    } catch (error) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

let defaultCustomerDeviceActivationService: CustomerDeviceActivationService | null = null;

export function getCustomerDeviceActivationService(): CustomerDeviceActivationService {
  if (!defaultCustomerDeviceActivationService) {
    defaultCustomerDeviceActivationService = new CustomerDeviceActivationService();
  }
  return defaultCustomerDeviceActivationService;
}
