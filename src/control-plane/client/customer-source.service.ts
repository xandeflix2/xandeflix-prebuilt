import type {
  CreateCustomerSourceParams,
  CreateCustomerSourceResult,
  DisableCustomerSourceResult,
  ListCustomerSourcesResult,
  UpdateCustomerSourceParams,
  UpdateCustomerSourceResult,
} from '../control-plane.types.ts';

export interface SupabaseRpcClient {
  rpc<T = unknown>(
    fn: string,
    args?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: { message: string; code?: string } | null }>;
}

export interface CustomerSourceFunctionsClient {
  invoke<T = unknown>(
    functionName: string,
    options: { body: Record<string, unknown> },
  ): Promise<{ data: T | null; error: { message: string; code?: string } | null }>;
}

export interface CustomerSourceClient extends SupabaseRpcClient {
  functions?: CustomerSourceFunctionsClient;
}

export class CustomerSourceService {
  private readonly client: CustomerSourceClient;

  constructor(client: CustomerSourceClient) {
    this.client = client;
  }

  /**
   * Validação estritamente sintática de URL de playlist / endpoint.
   * Não realiza requisições HTTP externas para prevenir SSRF.
   */
  static validateUrlSafety(rawUrl: string): { valid: boolean; error?: string } {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { valid: false, error: 'URL_REQUIRED' };
    }

    const trimmed = rawUrl.trim();
    if (trimmed.length < 8 || trimmed.length > 2048) {
      return { valid: false, error: 'INVALID_URL_LENGTH' };
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'UNSUPPORTED_PROTOCOL' };
      }
      if (!parsed.hostname || parsed.hostname.length === 0) {
        return { valid: false, error: 'INVALID_HOSTNAME' };
      }
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        return { valid: false, error: 'PRIVATE_OR_LOOPBACK_ADDRESS_BLOCKED' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'MALFORMED_URL' };
    }
  }

  /**
   * Cria uma nova fonte de autoatendimento para uma licença.
   * Se sourceConfig em texto plano for fornecido e o cliente possuir transport Edge Function,
   * invoca a boundary server-side customer-source-upsert para cifragem com chave mestra do servidor.
   * Caso contrário, delega o envelope pré-cifrado para a RPC atômica.
   */
  async createSource(params: CreateCustomerSourceParams): Promise<CreateCustomerSourceResult> {
    try {
      if (params.sourceConfig && this.client.functions?.invoke) {
        const { data, error } = await this.client.functions.invoke<CreateCustomerSourceResult>(
          'customer-source-upsert',
          {
            body: {
              operation: 'CREATE_CUSTOMER_SOURCE',
              licenseId: params.licenseId,
              sourceType: params.sourceType,
              displayName: params.displayName,
              sourceConfig: params.sourceConfig,
            },
          },
        );

        if (error) {
          return {
            success: false,
            code: error.code || 'FUNCTION_ERROR',
            message: error.message,
          };
        }

        return data ?? { success: false, message: 'RESPOSTA_VAZIA_DO_SERVIDOR' };
      }

      // Caminho transacional via RPC (envelope já cifrado no servidor/ambiente autorizado)
      const { data, error } = await this.client.rpc<CreateCustomerSourceResult>(
        'rpc_customer_create_source',
        {
          p_license_id: params.licenseId,
          p_source_type: params.sourceType,
          p_display_name: params.displayName,
          p_ciphertext: params.ciphertext,
          p_nonce: params.nonce,
          p_auth_tag: params.authTag,
          p_key_version: params.keyVersion || 'v1',
        },
      );

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      return data ?? { success: false, message: 'RESPOSTA_VAZIA_DO_SERVIDOR' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        code: 'NETWORK_OR_CLIENT_ERROR',
        message: msg,
      };
    }
  }

  /**
   * Atualiza o nome ou rotaciona as credenciais de uma fonte existente.
   */
  async updateSource(params: UpdateCustomerSourceParams): Promise<UpdateCustomerSourceResult> {
    try {
      if (params.sourceConfig && this.client.functions?.invoke) {
        const { data, error } = await this.client.functions.invoke<UpdateCustomerSourceResult>(
          'customer-source-upsert',
          {
            body: {
              operation: 'UPDATE_CUSTOMER_SOURCE',
              sourceId: params.sourceId,
              sourceType: params.sourceType,
              displayName: params.displayName,
              expectedVersion: params.expectedVersion,
              sourceConfig: params.sourceConfig,
            },
          },
        );

        if (error) {
          return {
            success: false,
            code: error.code || 'FUNCTION_ERROR',
            message: error.message,
          };
        }

        return data ?? { success: false, message: 'RESPOSTA_VAZIA_DO_SERVIDOR' };
      }

      const { data, error } = await this.client.rpc<UpdateCustomerSourceResult>(
        'rpc_customer_update_source',
        {
          p_source_id: params.sourceId,
          p_display_name: params.displayName || null,
          p_ciphertext: params.ciphertext || null,
          p_nonce: params.nonce || null,
          p_auth_tag: params.authTag || null,
          p_key_version: params.keyVersion || 'v1',
        },
      );

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      return data ?? { success: false, message: 'RESPOSTA_VAZIA_DO_SERVIDOR' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        code: 'NETWORK_OR_CLIENT_ERROR',
        message: msg,
      };
    }
  }

  /**
   * Lista metadados de todas as fontes pertencentes ao cliente autenticado.
   */
  async listSources(): Promise<ListCustomerSourcesResult> {
    try {
      const { data, error } = await this.client.rpc<ListCustomerSourcesResult>(
        'rpc_customer_list_sources',
      );

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      return data ?? { success: false, message: 'RESPOSTA_VAZIA_DO_SERVIDOR' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        code: 'NETWORK_OR_CLIENT_ERROR',
        message: msg,
      };
    }
  }

  /**
   * Desativa uma fonte de autoatendimento.
   */
  async disableSource(sourceId: string): Promise<DisableCustomerSourceResult> {
    try {
      const { data, error } = await this.client.rpc<DisableCustomerSourceResult>(
        'rpc_customer_disable_source',
        { p_source_id: sourceId },
      );

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      return data ?? { success: false, message: 'RESPOSTA_VAZIA_DO_SERVIDOR' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        code: 'NETWORK_OR_CLIENT_ERROR',
        message: msg,
      };
    }
  }
}
