import { getSupabaseBrowserClient, parseSanitizedFunctionError } from '../../integrations/supabase/client.ts';
import type { LicenseStatus } from '../control-plane.types.ts';
import { activationDeadline } from './activation-timeout.ts';
import { validatePublicDeviceRegistration, type PublicDeviceRegistration } from '../../../supabase/functions/_shared/public-device-registration.ts';

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
      const { data, error } = await activationDeadline((signal) => client.functions.invoke('device-public-activation', {
        body: { operation: 'REGISTER_KEY', ...params },
        signal,
      }));
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
      const { data, error } = await activationDeadline(signal => client.functions.invoke('device-public-activation', {
        body: { operation: 'START', displayCode, activationKey }, signal,
      }));
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

  async resume(displayCode: string, sessionToken: string): Promise<PublicDeviceActivationSession | PublicDeviceActivationResult> {
    const client = getSupabaseBrowserClient();
    if (!client) return { success: false, code: 'CLIENT_UNAVAILABLE', message: 'Serviço de ativação indisponível.' };
    try {
      const { data, error } = await activationDeadline(signal => client.functions.invoke('device-public-activation', {
        body: { operation: 'RESUME', displayCode, sessionToken }, signal,
      }));
      if (error) {
        const parsed = await parseSanitizedFunctionError(error);
        return { success: false, code: parsed.code || 'REMOTE_ERROR', message: parsed.message };
      }
      if (!isRecord(data) || data.success !== true || data.displayCode !== displayCode
        || typeof data.sessionId !== 'string' || typeof data.expiresAt !== 'string') {
        return { success: false, code: 'ACTIVATION_SESSION_NOT_OPEN', message: 'A abertura expirou. Abra novamente a página pelo aplicativo.' };
      }
      return { displayCode, sessionToken, sessionId: data.sessionId, expiresAt: data.expiresAt };
    } catch {
      return { success: false, code: 'NETWORK_ERROR', message: 'Não foi possível validar o aparelho. Abra novamente a página pelo aplicativo.' };
    }
  }

  async complete(params: {
    displayCode: string;
    sessionToken: string;
    sourceName: string;
    sourceType?: 'M3U' | 'M3U8';
    initialScreens?: number;
    sourceUrl: string;
    epgUrl?: string;
    username?: string;
    password?: string;
  } & PublicDeviceRegistration): Promise<PublicDeviceActivationResult> {
    if ((params.initialScreens ?? 1) !== 1) return { success: false, code: 'INITIAL_SCREEN_LIMIT', message: 'A ativação inicial permite somente este aparelho.' };
    const registration = validatePublicDeviceRegistration(params);
    if (!registration.success) return { success: false, code: registration.code, message: 'Informe seu primeiro nome, o Local/Tipo e a plataforma do aparelho.' };
    const client = getSupabaseBrowserClient();
    if (!client) return { success: false, code: 'CLIENT_UNAVAILABLE', message: 'Serviço de ativação indisponível.' };

    try {
      const { data, error } = await client.functions.invoke('device-public-activation', {
        body: { operation: 'COMPLETE', displayCode: params.displayCode, sessionToken: params.sessionToken,
          sourceName: params.sourceName, sourceType: params.sourceType ?? 'M3U', initialScreens: 1,
          sourceUrl: params.sourceUrl, epgUrl: params.epgUrl, username: params.username, password: params.password,
          ...registration.value },
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
