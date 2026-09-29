/**
 * =============================================================================
 * Xandeflix Prebuilt — Customer Device Pairing Service (C4)
 *
 * Serviço client-side para o cliente autenticado vincular um dispositivo
 * (exibindo displayCode + pairingCode) à sua conta e a uma licença elegível.
 *
 * Princípios:
 * - AUTH_REQUIRED: Cliente deve estar autenticado.
 * - CUSTOMER_OWNED_LICENSE_ONLY: Só pode associar licenças pertencentes ao cliente.
 * - SINGLE_USE_ATOMIC: Consumo é transacional e atômico.
 * =============================================================================
 */

import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import type {
  CustomerPairDeviceParams,
  CustomerPairDeviceResult,
} from '../control-plane.types.ts';

export class CustomerDevicePairingService {
  /**
   * Executa o pareamento de um dispositivo com a conta do cliente logado.
   */
  async pairDevice(params: CustomerPairDeviceParams): Promise<CustomerPairDeviceResult> {
    const cleanDisplayCode = params.displayCode?.trim();
    const cleanPairingCode = params.pairingCode?.trim().replace(/\D/g, '');

    if (!cleanDisplayCode || !cleanPairingCode) {
      return {
        success: false,
        code: 'PARAMS_REQUIRED',
        message: 'Código de exibição (Display Code) e Código de Pareamento de 6 dígitos são obrigatórios.',
      };
    }

    if (cleanPairingCode.length !== 6) {
      return {
        success: false,
        code: 'PAIRING_CODE_LENGTH_INVALID',
        message: 'O código de pareamento deve conter exatamente 6 dígitos numéricos.',
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

      const { data, error } = await client.rpc('rpc_customer_pair_device', {
        p_display_code: cleanDisplayCode,
        p_pairing_code: cleanPairingCode,
        p_device_label: params.deviceLabel?.trim() || null,
        p_license_id: params.licenseId || null,
      });

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      return data as CustomerPairDeviceResult;
    } catch (err) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

let defaultCustomerDevicePairingService: CustomerDevicePairingService | null = null;

export function getCustomerDevicePairingService(): CustomerDevicePairingService {
  if (!defaultCustomerDevicePairingService) {
    defaultCustomerDevicePairingService = new CustomerDevicePairingService();
  }
  return defaultCustomerDevicePairingService;
}
