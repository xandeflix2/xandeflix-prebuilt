/**
 * =============================================================================
 * Xandeflix Prebuilt — Trial License Service (C5)
 *
 * Serviço client-side para o motor de licenças de Trial e avaliação de
 * autorização e entitlement comercial no dispositivo e portal.
 *
 * Princípios:
 * - CONTROL_PLANE_SERVER_TIME: Toda decisão de expiração é calculada no servidor.
 * - FAIL_CLOSED: Erros de rede ou respostas inválidas resultam em acesso não permitido.
 * - ZERO_LOCAL_MUTATION: A avaliação não apaga dados locais do dispositivo.
 * =============================================================================
 */

import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import type {
  LicenseAccessEvaluationParams,
  LicenseAccessEvaluationResult,
} from '../control-plane.types.ts';

export class TrialLicenseService {
  /**
   * Avalia a elegibilidade e autorização comercial da licença no servidor.
   */
  async evaluateAccess(params: LicenseAccessEvaluationParams): Promise<LicenseAccessEvaluationResult> {
    if (!params.licenseId) {
      return {
        accessAllowed: false,
        code: 'INVALID_LICENSE',
        message: 'Identificador de licença é obrigatório.',
      };
    }

    try {
      const client = getSupabaseBrowserClient();
      if (!client) {
        return {
          accessAllowed: false,
          code: 'INVALID_LICENSE',
          message: 'Cliente Supabase indisponível.',
        };
      }

      const { data, error } = await client.rpc('rpc_evaluate_license_access', {
        p_license_id: params.licenseId,
        p_device_id: params.deviceId || null,
      });

      if (error) {
        return {
          accessAllowed: false,
          code: 'INVALID_LICENSE',
          message: error.message || 'Falha ao avaliar status da licença no servidor.',
        };
      }

      return data as LicenseAccessEvaluationResult;
    } catch (err) {
      return {
        accessAllowed: false,
        code: 'INVALID_LICENSE',
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

let defaultTrialLicenseService: TrialLicenseService | null = null;

export function getTrialLicenseService(): TrialLicenseService {
  if (!defaultTrialLicenseService) {
    defaultTrialLicenseService = new TrialLicenseService();
  }
  return defaultTrialLicenseService;
}
