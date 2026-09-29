import {
  LocalSecureSourceStore,
  type LocalSecureSourceConfig,
  type LocalSecureSourceRecord,
  type LocalSourceProtocol,
} from './local-secure-source-store.ts';
import type { DeviceResolveSelfServiceSourceResult } from '../control-plane/control-plane.types.ts';

export interface DeviceSourceResolverClient {
  rpc<T = unknown>(
    fn: string,
    args?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: { message: string; code?: string } | null }>;
  functions?: {
    invoke<T = unknown>(
      functionName: string,
      options: { body: Record<string, unknown> },
    ): Promise<{ data: T | null; error: { message: string; code?: string } | null }>;
  };
}

export interface ResolveSelfServiceSourceOptions {
  deviceId: string;
  deviceToken: string;
  licenseId: string;
}

export interface ResolveSelfServiceSourceOutcome {
  success: boolean;
  sourceId?: string;
  sourceVersion?: number;
  protocol?: LocalSourceProtocol;
  errorCode?: string;
  message?: string;
}

export class DeviceSelfServiceSourceResolverService {
  private readonly client: DeviceSourceResolverClient;
  private readonly localStore: LocalSecureSourceStore;

  constructor(
    client: DeviceSourceResolverClient,
    localStore: LocalSecureSourceStore = new LocalSecureSourceStore(),
  ) {
    this.client = client;
    this.localStore = localStore;
  }

  /**
   * Resolve a configuração autorizada de autoatendimento para um dispositivo pareado
   * e a persiste em cofre seguro local (LocalSecureSourceStore).
   * Prioriza a boundary servidora device-self-service-source-delivery que decifra
   * os segredos no servidor, garantindo que o dispositivo nunca receba a chave mestra.
   */
  async resolveAndStoreSource(
    options: ResolveSelfServiceSourceOptions,
  ): Promise<ResolveSelfServiceSourceOutcome> {
    const { deviceId, deviceToken, licenseId } = options;

    if (!deviceId || !deviceToken || !licenseId) {
      return {
        success: false,
        errorCode: 'INVALID_ARGUMENTS',
        message: 'deviceId, deviceToken e licenseId são obrigatórios.',
      };
    }

    try {
      // 1. Prioridade: entrega decifrada via Edge Function servidora
      if (this.client.functions?.invoke) {
        const { data, error } = await this.client.functions.invoke<DeviceResolveSelfServiceSourceResult>(
          'device-self-service-source-delivery',
          {
            body: {
              deviceId,
              deviceAuthToken: deviceToken,
              licenseId,
            },
          },
        );

        if (error) {
          return {
            success: false,
            errorCode: error.code || 'DELIVERY_TRANSPORT_FAILED',
            message: error.message,
          };
        }

        if (!data || !data.success) {
          return {
            success: false,
            errorCode: data?.code || 'DELIVERY_REJECTED',
            message: data?.message || 'Falha ao resolver fonte de autoatendimento.',
          };
        }

        const protocol: LocalSourceProtocol =
          data.sourceType === 'XTREAM' || data.protocol === 'XTREAM' ? 'XTREAM' : 'M3U';

        const record: LocalSecureSourceRecord = {
          sourceId: data.sourceId!,
          sourceVersion: data.sourceVersion!,
          protocol,
          sourceConfig: (data.sourceConfig as LocalSecureSourceConfig) ?? {
            endpoint: data.displayName || 'default',
          },
        };

        try {
          await this.sealSourceRecord(record);
        } catch (storeError) {
          const msg = storeError instanceof Error ? storeError.message : String(storeError);
          return {
            success: false,
            errorCode: 'LOCAL_STORE_SEAL_FAILED',
            message: msg || 'Falha ao selar credenciais no cofre local.',
          };
        }

        return {
          success: true,
          sourceId: data.sourceId,
          sourceVersion: data.sourceVersion,
          protocol,
        };
      }

      // 2. Caminho de compatibilidade via RPC direta
      const { data, error } = await this.client.rpc<DeviceResolveSelfServiceSourceResult>(
        'rpc_device_resolve_self_service_source',
        {
          p_device_id: deviceId,
          p_device_token: deviceToken,
          p_license_id: licenseId,
        },
      );

      if (error) {
        return {
          success: false,
          errorCode: error.code || 'DELIVERY_RPC_FAILED',
          message: error.message,
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          errorCode: data?.code || 'DELIVERY_REJECTED',
          message: data?.message || 'Falha ao resolver fonte de autoatendimento.',
        };
      }

      const protocol: LocalSourceProtocol =
        data.sourceType === 'XTREAM' || data.protocol === 'XTREAM' ? 'XTREAM' : 'M3U';

      // Monta registro para selagem em cofre local nativo
      const record: LocalSecureSourceRecord = {
        sourceId: data.sourceId!,
        sourceVersion: data.sourceVersion!,
        protocol,
        sourceConfig: (data.sourceConfig as LocalSecureSourceConfig) ?? {
          endpoint: data.ciphertext ?? 'default',
          runtimeOptions: {
            nonce: data.nonce,
            authTag: data.authTag,
            keyVersion: data.keyVersion || 'v1',
          },
        },
      };

      try {
        await this.sealSourceRecord(record);
      } catch (storeError) {
        const msg = storeError instanceof Error ? storeError.message : String(storeError);
        return {
          success: false,
          errorCode: 'LOCAL_STORE_SEAL_FAILED',
          message: msg || 'Falha ao selar credenciais no cofre local.',
        };
      }

      return {
        success: true,
        sourceId: data.sourceId,
        sourceVersion: data.sourceVersion,
        protocol,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        errorCode: 'UNHANDLED_RESOLVER_EXCEPTION',
        message: msg,
      };
    }
  }

  /**
   * Sela o registro decifrado ou envelope no cofre seguro local (LocalSecureSourceStore).
   */
  async sealSourceRecord(record: LocalSecureSourceRecord): Promise<void> {
    await this.localStore.put(record);
  }
}
