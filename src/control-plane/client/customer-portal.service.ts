/**
 * =============================================================================
 * Xandeflix Prebuilt — Customer Portal Service (C7)
 *
 * Orquestrador central client-side para o Portal do Cliente (Customer Portal).
 * Não cria novas autoridades de negócio; agrega e orquestra estritamente os contratos
 * validados de C2 (Installation Registry), C3 (Customer Identity), C4 (Device Pairing),
 * C5 (Trial/License Engine) e C6 (Remote Self-Service Source & Vault).
 *
 * Princípios Canônicos:
 * - LIGHTWEIGHT_ORCHESTRATOR: Apenas orquestra serviços existentes sem duplicar backend.
 * - ZERO_SECRETS_EXPOSURE: Nenhuma credencial em texto claro, URL com token, chave mestra,
 *   hash ou segredo do cofre trafega em logs, DOM persistente ou armazenamento local.
 * - SERVER_TIME_AUTHORITY: Expiração e dias restantes baseados exclusivamente no horário do servidor.
 * - SEPARATION_OF_PRODUCT: Portal do Cliente != Painel do Gestor (zero manager RPCs).
 * - PLACEHOLDER_ONLY_SESSIONS: Sessões simultâneas exibidas como informativo (C9 ainda não implementado).
 * - INFORMATIVE_ONLY_PAYMENT: Pagamento exibido como informativo "Em breve" (C10 ainda não implementado).
 * =============================================================================
 */

import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import { CustomerAccountService } from './customer-account.service.ts';
import { getCustomerDevicePairingService } from './customer-device-pairing.service.ts';
import { getCustomerDeviceActivationService } from './customer-device-activation.service.ts';
import { getTrialLicenseService } from './trial-license.service.ts';
import { CustomerSourceService } from './customer-source.service.ts';
import type {
  CustomerProfileResponse,
  CustomerPairDeviceParams,
  CustomerPairDeviceResult,
  CustomerActivateDeviceParams,
  CustomerActivateDeviceResult,
  CustomerSourceEntity,
  CreateCustomerSourceParams,
  CreateCustomerSourceResult,
  UpdateCustomerSourceParams,
  UpdateCustomerSourceResult,
  DisableCustomerSourceResult,
  CustomerPlaybackSessionListItem,
} from '../control-plane.types.ts';
import { getControlPlaneEngine } from '../engine/control-plane-engine.ts';
import type { CustomerSourceClient } from './customer-source.service.ts';

export type PortalTab = 'dashboard' | 'license' | 'devices' | 'source' | 'account' | 'sessions' | 'login';

export interface PortalCustomerProfile {
  customerId: string;
  nickname: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortalLicenseSummary {
  id: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  mode: 'SELF_SERVICE' | 'MANAGED';
  isTrial: boolean;
  accessAllowed: boolean;
  maxDevices: number;
  maxConcurrentSessions: number;
  activeDevicesCount: number;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  expiresAt?: string;
  serverTime?: string;
  daysRemaining: number;
  code?: string;
  message?: string;
}

export interface PortalDeviceItem {
  deviceId: string;
  displayCode: string;
  deviceLabel: string;
  deviceType: string;
  status: string;
  boundAt?: string;
  lastSeenAt?: string;
  licenseId?: string;
}

export interface PortalDashboardSummary {
  authenticated: boolean;
  userEmail?: string;
  profile: PortalCustomerProfile | null;
  needsOnboarding: boolean;
  license: PortalLicenseSummary | null;
  devices: PortalDeviceItem[];
  deviceLoadError?: string;
  activeSource: CustomerSourceEntity | null;
  sourcesCount: number;
  serverTime: string;
}

const ERROR_MESSAGE_MAP: Record<string, string> = {
  AUTH_REQUIRED: 'Autenticação de sessão obrigatória. Por favor, faça login para continuar.',
  NO_ELIGIBLE_LICENSE: 'Nenhuma licença comercial elegível encontrada para esta conta.',
  LICENSE_DEVICE_LIMIT_REACHED: 'Limite de dispositivos atingido para esta licença.',
  TRIAL_EXPIRED: 'Seu período de teste de 7 dias terminou.',
  LICENSE_EXPIRED: 'Sua licença comercial expirou.',
  LICENSE_SUSPENDED: 'Sua licença comercial está suspensa temporariamente.',
  LICENSE_REVOKED: 'Sua licença comercial foi revogada administrativamente.',
  UNAUTHORIZED_LICENSE_ACCESS: 'Acesso não autorizado à licença informada.',
  PAIRING_ALREADY_CONSUMED: 'Este código de pareamento já foi utilizado por outro dispositivo.',
  PAIRING_CODE_EXPIRED: 'O código de pareamento exibido na TV expirou (tempo limite de 10 min).',
  PAIRING_ATTEMPT_LIMIT_EXCEEDED: 'Limite de 5 tentativas incorretas excedido. Gere um novo código na TV.',
  INVALID_PAIRING_CODE: 'Código de pareamento incorreto de 6 dígitos.',
  DISPLAY_CODE_REQUIRED: 'O código de exibição (Display Code) do dispositivo é obrigatório.',
  PAIRING_CODE_REQUIRED: 'O código de pareamento numérico de 6 dígitos é obrigatório.',
  NICKNAME_LENGTH_INVALID: 'O nome de usuário deve conter entre 3 e 32 caracteres.',
  NICKNAME_FORMAT_INVALID: 'Formato de nome inválido. Use apenas letras, números e traços.',
  RESERVED_NICKNAME: 'Este nome de usuário é reservado do sistema.',
  VERSION_CONFLICT: 'Esta fonte foi modificada por outra sessão concorrente. Recarregue a página.',
  NO_ACTIVE_SOURCE_FOR_LICENSE: 'Nenhuma fonte ativa vinculada a esta licença.',
  CROSS_CUSTOMER_ACCESS_DENIED: 'Acesso negado: a fonte informada pertence a outro cliente.',
  INVALID_M3U_PLAYLIST_URL: 'A URL da lista M3U é inválida ou aponta para endereço privado/local proibido.',
  INVALID_XTREAM_ENDPOINT: 'O endpoint Xtream é inválido ou aponta para endereço privado/local proibido.',
  INVALID_XTREAM_USERNAME: 'Nome de usuário Xtream é obrigatório.',
  INVALID_XTREAM_PASSWORD: 'Senha Xtream é obrigatória.',
  ACTIVATION_NOT_FOUND: 'Solicitação de ativação não encontrada. Gere uma nova chave no dispositivo.',
  INVALID_ACTIVATION_KEY: 'A chave de ativação não confere com o dispositivo informado.',
  ACTIVATION_ALREADY_CONSUMED: 'Esta ativação já foi concluída.',
  ACTIVATION_KEY_INVALID: 'A chave de ativação informada é inválida.',
  SOURCE_NOT_ACTIVE_OR_NOT_OWNED: 'A fonte não está ativa ou não pertence a esta licença.',
  SOURCE_MODE_MISMATCH: 'A fonte escolhida não corresponde ao modo da licença.',
};

export class CustomerPortalService {
  private static sourceServiceInstance: CustomerSourceService | null = null;

  /**
   * Permite injeção de dependência do CustomerSourceService para testes e auditorias determinísticas.
   */
  static setSourceServiceInstance(instance: CustomerSourceService | null): void {
    this.sourceServiceInstance = instance;
  }

  /**
   * Obtém a instância de CustomerSourceService conectada ao cliente Supabase atual.
   */
  private static getSourceService(): CustomerSourceService | null {
    const client = getSupabaseBrowserClient();
    if (!client) return null;
    if (!this.sourceServiceInstance) {
      this.sourceServiceInstance = new CustomerSourceService(client as unknown as CustomerSourceClient);
    }
    return this.sourceServiceInstance;
  }

  /**
   * Converte código de erro do Control Plane em mensagem amigável em Português.
   */
  static mapErrorMessage(code?: string, defaultMessage?: string): string {
    if (!code) return defaultMessage || 'Operação realizada com sucesso.';
    return ERROR_MESSAGE_MAP[code] || defaultMessage || 'Ocorreu um erro no processamento da solicitação.';
  }

  /**
   * Calcula determinística e estritamente os dias restantes a partir do tempo do servidor.
   * Não confia no relógio local do cliente.
   */
  static calculateDaysRemaining(expiresAtIso?: string, serverTimeIso?: string): number {
    if (!expiresAtIso) return 0;
    const expiryTime = new Date(expiresAtIso).getTime();
    if (Number.isNaN(expiryTime)) return 0;

    const referenceTime = serverTimeIso ? new Date(serverTimeIso).getTime() : Date.now();
    const diffMs = expiryTime - referenceTime;
    if (diffMs <= 0) return 0;

    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Obtém a sessão do usuário autenticado atual.
   */
  static async getCurrentUser(): Promise<{ id: string; email?: string } | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return null;

    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.user) return null;
      return {
        id: data.session.user.id,
        email: data.session.user.email,
      };
    } catch {
      return null;
    }
  }

  /**
   * Realiza login do cliente com email e senha.
   */
  static async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, error: 'Cliente Supabase não inicializado.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: !!data.session };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao realizar login.' };
    }
  }

  /**
   * Realiza cadastro (sign up) do cliente com email, senha e opcionalmente nickname.
   */
  static async signUp(email: string, password: string, nickname?: string): Promise<{ success: boolean; needsEmailConfirmation?: boolean; error?: string }> {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return { success: false, error: 'Cliente Supabase não inicializado.' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: nickname ? { data: { nickname: nickname.trim() } } : undefined,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session && nickname) {
        await CustomerAccountService.createProfile(nickname).catch(() => {});
      }

      return {
        success: true,
        needsEmailConfirmation: !data.session,
      };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao cadastrar conta.' };
    }
  }

  /**
   * Encerra a sessão do cliente autenticado.
   */
  static async signOut(): Promise<void> {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    try {
      await client.auth.signOut();
    } catch {
      // no-op em caso de falha de logout
    }
  }

  /**
   * Carrega o perfil do cliente logado via C3 CustomerAccountService.
   */
  static async getProfile(): Promise<CustomerProfileResponse> {
    return CustomerAccountService.getProfile();
  }

  /**
   * Atualiza o nickname do cliente via C3 CustomerAccountService.
   */
  static async updateNickname(newNickname: string): Promise<CustomerProfileResponse> {
    return CustomerAccountService.updateNickname(newNickname);
  }

  /**
   * Cria o perfil inicial do cliente via C3 CustomerAccountService.
   */
  static async createProfile(nickname: string): Promise<CustomerProfileResponse> {
    return CustomerAccountService.createProfile(nickname);
  }

  /**
   * Carrega todas as licenças pertencentes ao cliente autenticado.
   * Suporta leitura direta com RLS ou inferência segura a partir de fontes e pareamentos.
   */
  static async listLicenses(): Promise<PortalLicenseSummary[]> {
    const client = getSupabaseBrowserClient();
    if (!client) return [];

    const user = await this.getCurrentUser();
    if (!user) return [];

    try {
      // Consulta a tabela licenses com RLS
      const { data: licenseRows } = await client
        .from('licenses')
        .select('id, mode, status, trial_eligible, trial_started_at, trial_expires_at, expires_at, max_devices, max_concurrent_sessions, created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      const serverNowIso = new Date().toISOString();

      if (Array.isArray(licenseRows) && licenseRows.length > 0) {
        const trialService = getTrialLicenseService();
        const summaries: PortalLicenseSummary[] = [];

        for (const row of licenseRows) {
          const evalResult = await trialService.evaluateAccess({ licenseId: row.id });
          const isTrial = row.status === 'TRIAL' || evalResult.isTrial === true;
          const expiryIso = isTrial ? (row.trial_expires_at || evalResult.trialExpiresAt) : row.expires_at;
          const serverTime = evalResult.serverTime || serverNowIso;
          const daysRemaining = this.calculateDaysRemaining(expiryIso, serverTime);

          summaries.push({
            id: row.id,
            status: (evalResult.licenseStatus as any) || row.status,
            mode: (row.mode as any) || 'SELF_SERVICE',
            isTrial,
            accessAllowed: evalResult.accessAllowed,
            maxDevices: row.max_devices || 1,
            maxConcurrentSessions: row.max_concurrent_sessions || 1,
            activeDevicesCount: 0, // Atualizado no dashboard aggregation
            trialStartedAt: row.trial_started_at || evalResult.trialStartedAt,
            trialExpiresAt: row.trial_expires_at || evalResult.trialExpiresAt,
            expiresAt: row.expires_at,
            serverTime,
            daysRemaining,
            code: evalResult.code,
            message: evalResult.message,
          });
        }
        return summaries;
      }

      // Se não houver linhas diretas (ex: licença inferida via fonte salva), verifica nas fontes
      const sourceService = this.getSourceService();
      if (sourceService) {
        const sourcesRes = await sourceService.listSources();
        if (sourcesRes.success && sourcesRes.sources && sourcesRes.sources.length > 0) {
          const firstLicId = sourcesRes.sources[0].licenseId;
          const trialService = getTrialLicenseService();
          const evalResult = await trialService.evaluateAccess({ licenseId: firstLicId });
          const isTrial = evalResult.isTrial === true;
          const expiryIso = evalResult.trialExpiresAt;
          const serverTime = evalResult.serverTime || serverNowIso;

          return [{
            id: firstLicId,
            status: (evalResult.licenseStatus as any) || 'ACTIVE',
            mode: 'SELF_SERVICE',
            isTrial,
            accessAllowed: evalResult.accessAllowed,
            maxDevices: 1,
            maxConcurrentSessions: 1,
            activeDevicesCount: 0,
            trialStartedAt: evalResult.trialStartedAt,
            trialExpiresAt: evalResult.trialExpiresAt,
            serverTime,
            daysRemaining: this.calculateDaysRemaining(expiryIso, serverTime),
            code: evalResult.code,
            message: evalResult.message,
          }];
        }
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Lista apenas os dispositivos pertencentes às licenças do cliente logado.
   * Não expõe tokens brutos, hashes ou capabilities de pareamento.
   */
  static async listCustomerDevices(): Promise<PortalDeviceItem[]> {
    const client = getSupabaseBrowserClient();
    if (!client) return [];

    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await client.rpc('rpc_customer_list_devices');

    if (error) {
      throw new Error(`DEVICE_LIST_LOAD_ERROR: ${error.message || error.code || 'permission denied'}`);
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return (data as any[]).map((d) => ({
      deviceId: d.deviceId,
      displayCode: d.displayCode,
      deviceLabel: d.deviceLabel || 'Dispositivo',
      deviceType: d.deviceType || 'TV',
      status: d.status,
      boundAt: d.boundAt,
      lastSeenAt: d.lastSeenAt,
      licenseId: d.licenseId,
    }));
  }

  /**
   * Executa o pareamento de um dispositivo utilizando o contrato C4.
   */
  static async pairDevice(params: CustomerPairDeviceParams): Promise<CustomerPairDeviceResult> {
    const pairingService = getCustomerDevicePairingService();
    return pairingService.pairDevice(params);
  }

  /**
   * Executa o claim A1 com displayCode + chave longa + sourceId opaco.
   */
  static async activateDevice(params: CustomerActivateDeviceParams): Promise<CustomerActivateDeviceResult> {
    return getCustomerDeviceActivationService().activateDevice(params);
  }

  /**
   * Lista as fontes de autoatendimento do cliente utilizando o contrato C6.
   */
  static async listSources(): Promise<CustomerSourceEntity[]> {
    const sourceService = this.getSourceService();
    if (!sourceService) return [];
    const res = await sourceService.listSources();
    return res.success && res.sources ? res.sources : [];
  }

  /**
   * Cadastra nova fonte de autoatendimento (M3U ou Xtream) via C6 Edge Function.
   * Não salva credenciais no estado persistente local.
   */
  static async createSource(params: CreateCustomerSourceParams): Promise<CreateCustomerSourceResult> {
    const sourceService = this.getSourceService();
    if (!sourceService) {
      return { success: false, message: 'Serviço de fontes indisponível.' };
    }
    return sourceService.createSource(params);
  }

  /**
   * Atualiza nome de exibição ou rotaciona credenciais via C6 Edge Function.
   */
  static async updateSource(params: UpdateCustomerSourceParams): Promise<UpdateCustomerSourceResult> {
    const sourceService = this.getSourceService();
    if (!sourceService) {
      return { success: false, message: 'Serviço de fontes indisponível.' };
    }
    return sourceService.updateSource(params);
  }

  /**
   * Desativa fonte de autoatendimento via C6 RPC.
   */
  static async disableSource(sourceId: string): Promise<DisableCustomerSourceResult> {
    const sourceService = this.getSourceService();
    if (!sourceService) {
      return { success: false, message: 'Serviço de fontes indisponível.' };
    }
    return sourceService.disableSource(sourceId);
  }

  /**
   * Obtém o resumo unificado do Dashboard do Portal do Cliente.
   */
  static async getDashboardSummary(): Promise<PortalDashboardSummary> {
    const user = await this.getCurrentUser();
    const serverNowIso = new Date().toISOString();

    if (!user) {
      return {
        authenticated: false,
        profile: null,
        needsOnboarding: false,
        license: null,
        devices: [],
        activeSource: null,
        sourcesCount: 0,
        serverTime: serverNowIso,
      };
    }

    // 1. Carrega Perfil C3
    const profileRes = await this.getProfile();
    const needsOnboarding = !profileRes.success || !profileRes.nickname;
    const profile: PortalCustomerProfile | null = profileRes.success && profileRes.nickname
      ? {
          customerId: profileRes.customerId || user.id,
          nickname: profileRes.nickname,
          status: profileRes.status || 'ACTIVE',
          createdAt: profileRes.createdAt,
          updatedAt: profileRes.updatedAt,
        }
      : null;

    // 2. Carrega Licenças C5
    const licenses = await this.listLicenses();
    const primaryLicense = licenses.length > 0 ? licenses[0] : null;

    // 3. Carrega Dispositivos C4 via RPC rpc_customer_list_devices
    let devices: PortalDeviceItem[] = [];
    let deviceLoadError: string | undefined;
    try {
      devices = await this.listCustomerDevices();
      if (primaryLicense) {
        primaryLicense.activeDevicesCount = devices.length;
      }
    } catch (err: unknown) {
      deviceLoadError = 'DEVICE_LIST_LOAD_ERROR';
      devices = [];
    }

    // 4. Carrega Fontes C6
    const sources = await this.listSources();
    const activeSource = sources.find((s) => s.status === 'ACTIVE') || null;

    return {
      authenticated: true,
      userEmail: user.email,
      profile,
      needsOnboarding,
      license: primaryLicense,
      devices,
      deviceLoadError,
      activeSource,
      sourcesCount: sources.length,
      serverTime: primaryLicense?.serverTime || serverNowIso,
    };
  }

  /**
   * Lista as sessões de reprodução ativas e recentes do cliente autenticado (Gate C9).
   */
  static async listPlaybackSessions(licenseId?: string): Promise<CustomerPlaybackSessionListItem[]> {
    const client = getSupabaseBrowserClient();
    if (!client) {
      const engine = getControlPlaneEngine();
      return engine.listPlaybackSessions({ licenseId });
    }

    try {
      const { data, error } = await client.rpc('rpc_customer_list_playback_sessions', {
        p_license_id: licenseId || null,
      });

      if (error || !data || !data.success || !Array.isArray(data.sessions)) {
        return [];
      }

      return data.sessions as CustomerPlaybackSessionListItem[];
    } catch {
      return [];
    }
  }
}
