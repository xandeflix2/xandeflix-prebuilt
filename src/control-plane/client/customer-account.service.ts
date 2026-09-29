/**
-- =============================================================================
-- Xandeflix Prebuilt — Customer Account Service (C3)
--
-- Serviço cliente para gestão de identidade comercial (Customer Profile)
-- e Nickname Account sobre Supabase Auth.
--
-- Princípios:
-- - SUPABASE_AUTH_AUTHORITY: auth.users é a autoridade de autenticação.
-- - NICKNAME_NOT_CREDENTIAL: Nickname é identificador público, não credencial.
-- - ZERO_SECRETS: Nenhuma senha ou token transita neste serviço.
-- =============================================================================
-*/

import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import type { CustomerProfileResponse, CustomerStatus } from '../control-plane.types.ts';

export const RESERVED_NICKNAMES = new Set([
  'admin',
  'administrator',
  'manager',
  'support',
  'system',
  'xandeflix',
  'root',
  'moderator',
  'null',
  'undefined',
  'gestor',
]);

export interface NicknameValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

export function validateCustomerNickname(raw: string): NicknameValidationResult {
  if (typeof raw !== 'string') {
    return { valid: false, normalized: '', error: 'NICKNAME_REQUIRED' };
  }

  const normalized = raw.trim();

  if (normalized.length < 3 || normalized.length > 32) {
    return { valid: false, normalized, error: 'NICKNAME_LENGTH_INVALID' };
  }

  // Permite letras, números, underscore, hífen e espaços internos
  const formatRegex = /^[A-Za-z0-9][A-Za-z0-9_ -]{1,30}[A-Za-z0-9]$/;
  if (!formatRegex.test(normalized)) {
    return { valid: false, normalized, error: 'NICKNAME_FORMAT_INVALID' };
  }

  if (RESERVED_NICKNAMES.has(normalized.toLowerCase())) {
    return { valid: false, normalized, error: 'RESERVED_NICKNAME' };
  }

  return { valid: true, normalized };
}

export class CustomerAccountService {
  /**
   * Cria o perfil do cliente autenticado via RPC segura.
   */
  static async createProfile(nickname: string): Promise<CustomerProfileResponse> {
    const validation = validateCustomerNickname(nickname);
    if (!validation.valid) {
      return {
        success: false,
        code: validation.error,
        message: 'Nickname inválido ou reservado.',
      };
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      return {
        success: false,
        code: 'CLIENT_UNAVAILABLE',
        message: 'Cliente Supabase não inicializado.',
      };
    }

    try {
      const { data, error } = await client.rpc('rpc_customer_create_profile', {
        p_nickname: validation.normalized,
      });

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      return {
        success: true,
        customerId: data.customerId,
        nickname: data.nickname,
        status: data.status as CustomerStatus,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_OR_UNEXPECTED',
        message: err?.message || 'Erro ao criar perfil.',
      };
    }
  }

  /**
   * Obtém o perfil do cliente autenticado.
   */
  static async getProfile(): Promise<CustomerProfileResponse> {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return {
        success: false,
        code: 'CLIENT_UNAVAILABLE',
        message: 'Cliente Supabase não inicializado.',
      };
    }

    try {
      const { data, error } = await client.rpc('rpc_customer_get_profile');

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      if (!data || data.success === false) {
        return {
          success: false,
          code: data?.code || 'PROFILE_NOT_FOUND',
          message: 'Perfil de cliente não encontrado.',
        };
      }

      return {
        success: true,
        customerId: data.customerId,
        nickname: data.nickname,
        status: data.status as CustomerStatus,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_OR_UNEXPECTED',
        message: err?.message || 'Erro ao carregar perfil.',
      };
    }
  }

  /**
   * Atualiza o nickname do cliente autenticado via RPC segura.
   */
  static async updateNickname(newNickname: string): Promise<CustomerProfileResponse> {
    const validation = validateCustomerNickname(newNickname);
    if (!validation.valid) {
      return {
        success: false,
        code: validation.error,
        message: 'Novo nickname inválido ou reservado.',
      };
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      return {
        success: false,
        code: 'CLIENT_UNAVAILABLE',
        message: 'Cliente Supabase não inicializado.',
      };
    }

    try {
      const { data, error } = await client.rpc('rpc_customer_update_nickname', {
        p_nickname: validation.normalized,
      });

      if (error) {
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message,
        };
      }

      return {
        success: true,
        customerId: data.customerId,
        nickname: data.nickname,
        status: data.status as CustomerStatus,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_OR_UNEXPECTED',
        message: err?.message || 'Erro ao atualizar nickname.',
      };
    }
  }
}
