/**
 * Cliente Supabase browser-side. Somente a publishable/anon key pode ser
 * usada aqui; service_role e qualquer segredo administrativo sao proibidos.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  ManagerAuthClient,
  SanitizedRemoteFunctionError,
} from '../../control-plane/client/manager-remote-control-plane-authority.ts';
import type { RemoteRpcClient } from '../../control-plane/client/remote-control-plane-authority.ts';
import type { ManagedVaultDeliveryTransport } from '../../security/managed-vault-device-delivery.service.ts';
import type { DeviceSourceResolverClient } from '../../security/device-self-service-source-resolver.service.ts';
import { getSupabaseRuntimeConfig } from './runtime-config.ts';

let clientInstance: SupabaseClient | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function parseSanitizedFunctionError(error: unknown): Promise<SanitizedRemoteFunctionError> {
  const context = isRecord(error) && typeof Response !== 'undefined' && error.context instanceof Response
    ? error.context
    : undefined;
  let body: Record<string, unknown> | undefined;

  if (context) {
    try {
      const candidate: unknown = await context.clone().json();
      if (isRecord(candidate)) body = candidate;
    } catch {
      body = undefined;
    }
  }

  return {
    code: typeof body?.code === 'string' ? body.code : undefined,
    stage: typeof body?.stage === 'string' ? body.stage : undefined,
    message: typeof body?.message === 'string'
      ? body.message
      : 'Falha remota sanitizada da Edge Function.',
    status: context?.status,
  };
}

export function getSupabaseBrowserClient(): SupabaseClient | undefined {
  if (clientInstance) return clientInstance;

  const config = getSupabaseRuntimeConfig();
  if (!config) {
    return undefined;
  }

  try {
    clientInstance = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return clientInstance;
  } catch {
    return undefined;
  }
}

export function setSupabaseBrowserClientInstance(client: SupabaseClient | undefined): void {
  clientInstance = client;
}

export function createSupabaseRemoteRpcClient(client: SupabaseClient): RemoteRpcClient {
  return {
    async rpc(functionName, params) {
      const response = await client.rpc(functionName, params);
      return {
        data: response.data,
        error: response.error ? { message: response.error.message } : null,
      };
    },
  };
}

export function createSupabaseManagerAuthClient(client: SupabaseClient): ManagerAuthClient {
  const rpcClient = createSupabaseRemoteRpcClient(client);
  return {
    ...rpcClient,
    auth: {
      async getSession() {
        const response = await client.auth.getSession();
        return {
          data: {
            session: response.data.session
              ? { user: { id: response.data.session.user.id } }
              : null,
          },
          error: response.error ? { message: response.error.message } : null,
        };
      },
      async signInWithPassword(credentials) {
        const response = await client.auth.signInWithPassword(credentials);
        return {
          data: {
            session: response.data.session
              ? { user: { id: response.data.session.user.id } }
              : null,
          },
          error: response.error ? { message: response.error.message } : null,
        };
      },
      async signOut() {
        const response = await client.auth.signOut();
        return { error: response.error ? { message: response.error.message } : null };
      },
    },
    functions: {
      async invoke(functionName, options) {
        const response = await client.functions.invoke(functionName, options);
        return {
          data: response.data,
          error: response.error ? await parseSanitizedFunctionError(response.error) : null,
        };
      },
    },
  };
}

export function createSupabaseManagedVaultDeliveryTransport(
  client: SupabaseClient,
): ManagedVaultDeliveryTransport {
  return {
    async invoke(functionName, options) {
      const response = await client.functions.invoke(functionName, options);
      return {
        data: response.data,
        error: response.error ? await parseSanitizedFunctionError(response.error) : null,
      };
    },
  };
}

export function createSupabaseDeviceSourceResolverClient(
  client: SupabaseClient,
): DeviceSourceResolverClient {
  return {
    async rpc<T = unknown>(functionName: string, params?: Record<string, unknown>) {
      const response = await client.rpc(functionName, params ?? {});
      return {
        data: response.data as T | null,
        error: response.error
          ? { message: response.error.message, code: response.error.code }
          : null,
      };
    },
    functions: {
      async invoke<T = unknown>(functionName: string, options: { body: Record<string, unknown> }) {
        const response = await client.functions.invoke<T>(functionName, options);
        const parsedError = response.error ? await parseSanitizedFunctionError(response.error) : null;
        return {
          data: response.data,
          error: parsedError
            ? { message: parsedError.message || 'Falha remota sanitizada da Edge Function.', code: parsedError.code }
            : null,
        };
      },
    },
  };
}

/** Compatibilidade com o bootstrap legado; o caminho remoto nao recebe configuracao real. */
export function getConfiguredSourceConfigSealer(): undefined {
  return undefined;
}
