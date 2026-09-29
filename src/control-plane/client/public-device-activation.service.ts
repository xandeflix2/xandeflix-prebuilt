import { getSupabaseBrowserClient, parseSanitizedFunctionError } from '../../integrations/supabase/client.ts';
import type { LicenseStatus } from '../control-plane.types.ts';

export interface PublicDeviceActivationSession {
  sessionToken: string;
  sessionId: string;
  displayCode: string;
  expiresAt: string;
}

export interface PublicDeviceActivationResult {
  success: boolean;
  status?: string;
  deviceAuthorizationState?: string;
  licenseId?: string;
  licenseStatus?: LicenseStatus;
  sourceId?: string;
  trial?: Record<string, unknown>;
  code?: string;
  message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeMessage(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.message === 'string' ? value.message : fallback;
}

export class PublicDeviceActivationService {
  async registerPermanentKey(params: {
    activationId: string;
    deviceId: string;
    displayCode: string;
    activationKey: string;
  }): Promise<PublicDeviceActivationResult> {
    const client = getSupabaseBrowserClient();
    if (!client) return { success: false, code: 'CLIENT_UNAVAILABLE', message: 'Serviço de ativação indisponível.' };

    try {
      const { data, error } = await client.functions.invoke('device-public-activation', {
        body: { operation: 'REGISTER_KEY', ...params },
      });
      if (error) {
        const parsed = await parseSanitizedFunctionError(error);
        return { success: false, code: parsed.code || 'REMOTE_ERROR', message: parsed.message };
      }
      if (!isRecord(data)) return { success: false, code: 'INVALID_RESPONSE', message: 'Resposta de registro inválida.' };
      return {
        success: data.success === true,
        status: typeof data.status === 'string' ? data.status : undefined,
        code: typeof data.code === 'string' ? data.code : undefined,
        message: typeof data.message === 'string' ? data.message : undefined,
      };
    } catch (error) {
      return { success: false, code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Falha de rede.' };
    }
  }

  async start(displayCode: string, activationKey: string): Promise<PublicDeviceActivationSession | PublicDeviceActivationResult> {
    const client = getSupabaseBrowserClient();
    if (!client) return { success: false, code: 'CLIENT_UNAVAILABLE', message: 'Serviço de ativação indisponível.' };

    try {
      const { data, error } = await client.functions.invoke('device-public-activation', {
        body: { operation: 'START', displayCode, activationKey },
      });
      if (error) {
        const parsed = await parseSanitizedFunctionError(error);
        return { success: false, code: parsed.code || 'REMOTE_ERROR', message: parsed.message };
      }
      if (!isRecord(data) || data.success !== true || typeof data.sessionToken !== 'string' || typeof data.sessionId !== 'string') {
        return { success: false, code: isRecord(data) && typeof data.code === 'string' ? data.code : 'INVALID_RESPONSE', message: safeMessage(data, 'Não foi possível iniciar a ativação.') };
      }
      return {
        sessionToken: data.sessionToken,
        sessionId: data.sessionId,
        displayCode: typeof data.displayCode === 'string' ? data.displayCode : displayCode,
        expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : '',
      };
    } catch (error) {
      return { success: false, code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Falha de rede.' };
    }
  }

  async complete(params: {
    displayCode: string;
    sessionToken: string;
    sourceName: string;
    sourceType?: 'M3U' | 'M3U8';
    sourceUrl: string;
    epgUrl?: string;
    username?: string;
    password?: string;
  }): Promise<PublicDeviceActivationResult> {
    const client = getSupabaseBrowserClient();
    if (!client) return { success: false, code: 'CLIENT_UNAVAILABLE', message: 'Serviço de ativação indisponível.' };

    try {
      const { data, error } = await client.functions.invoke('device-public-activation', {
        body: { operation: 'COMPLETE', ...params, sourceType: params.sourceType ?? 'M3U' },
      });
      if (error) {
        const parsed = await parseSanitizedFunctionError(error);
        return { success: false, code: parsed.code || 'REMOTE_ERROR', message: parsed.message };
      }
      if (!isRecord(data)) return { success: false, code: 'INVALID_RESPONSE', message: 'Resposta de ativação inválida.' };
      return {
        success: data.success === true,
        status: typeof data.status === 'string' ? data.status : undefined,
        deviceAuthorizationState: typeof data.deviceAuthorizationState === 'string' ? data.deviceAuthorizationState : undefined,
        licenseId: typeof data.licenseId === 'string' ? data.licenseId : undefined,
        licenseStatus: data.licenseStatus === 'TRIAL' || data.licenseStatus === 'ACTIVE' || data.licenseStatus === 'REVOKED' || data.licenseStatus === 'EXPIRED' || data.licenseStatus === 'SUSPENDED'
          ? data.licenseStatus
          : undefined,
        sourceId: typeof data.sourceId === 'string' ? data.sourceId : undefined,
        trial: isRecord(data.trial) ? data.trial : undefined,
        code: typeof data.code === 'string' ? data.code : undefined,
        message: typeof data.message === 'string' ? data.message : undefined,
      };
    } catch (error) {
      return { success: false, code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Falha de rede.' };
    }
  }
}

let defaultPublicDeviceActivationService: PublicDeviceActivationService | null = null;

export function getPublicDeviceActivationService(): PublicDeviceActivationService {
  if (!defaultPublicDeviceActivationService) defaultPublicDeviceActivationService = new PublicDeviceActivationService();
  return defaultPublicDeviceActivationService;
}
