/**
 * =============================================================================
 * XANDEFLIX PREBUILT — PLAYBACK SESSION SERVICE (C9)
 *
 * Gerenciador client-side de ciclo de vida de sessões concorrentes de reprodução.
 *
 * Princípios:
 * - CONTROL_PLANE_ONLY: Autorização lógica de telas, sem media proxy ou restream.
 * - DIRECT_MEDIA_PRESERVED: Mídia trafega direto do provedor para o player.
 * - FAIL_CLOSED: Falha de autorização ou expiração encerra a sessão e notifica o player.
 * - HEARTBEAT_AUTOMATION: Pulso a cada 60s mantendo o lease vivo.
 * - CLEANUP_BEST_EFFORT: Liberação imediata ao sair do player; fallback em stale timeout (120s).
 * =============================================================================
 */

import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import { getControlPlaneEngine } from '../engine/control-plane-engine.ts';
import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import type {
  DeviceStartPlaybackSessionRequest,
  DeviceStartPlaybackSessionResponse,
  DeviceHeartbeatPlaybackSessionRequest,
  DeviceHeartbeatPlaybackSessionResponse,
  DeviceClosePlaybackSessionResponse,
  CustomerPlaybackSessionListItem,
} from '../control-plane.types.ts';

export interface ActivePlaybackSessionInfo {
  sessionId: string;
  sessionToken: string;
  licenseId: string;
  deviceId: string;
  status: 'ACTIVE';
  heartbeatIntervalSeconds: number;
  staleSessionSeconds: number;
}

export type PlaybackTerminationHandler = (reason: string, code?: string) => void;

export class PlaybackSessionService {
  private activeSession: ActivePlaybackSessionInfo | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private terminationCallbacks = new Set<PlaybackTerminationHandler>();
  private preferLocalEngine: boolean = false;

  constructor(options?: { preferLocalEngine?: boolean }) {
    this.preferLocalEngine = options?.preferLocalEngine ?? false;
  }

  setPreferLocalEngine(prefer: boolean): void {
    this.preferLocalEngine = prefer;
  }

  getActiveSession(): ActivePlaybackSessionInfo | null {
    return this.activeSession ? { ...this.activeSession } : null;
  }

  onTermination(callback: PlaybackTerminationHandler): () => void {
    this.terminationCallbacks.add(callback);
    return () => {
      this.terminationCallbacks.delete(callback);
    };
  }

  /**
   * Adquire um slot de reprodução concorrente de forma atômica no plano de controle.
   */
  async acquireSession(
    req: DeviceStartPlaybackSessionRequest
  ): Promise<DeviceStartPlaybackSessionResponse> {
    // 1. Caminho local via engine em memória se configurado
    if (this.preferLocalEngine) {
      const engine = getControlPlaneEngine();
      const res = await engine.startPlaybackSession(req);
      if (res.success && res.sessionId && res.sessionToken) {
        this.activeSession = {
          sessionId: res.sessionId,
          sessionToken: res.sessionToken,
          licenseId: req.licenseId,
          deviceId: req.deviceId,
          status: 'ACTIVE',
          heartbeatIntervalSeconds: res.heartbeatIntervalSeconds || 60,
          staleSessionSeconds: res.staleSessionSeconds || 120,
        };
      }
      return res;
    }

    // 2. Caminho remoto via Supabase RPC
    const client = getSupabaseBrowserClient();
    if (!client) {
      // Fallback gracioso para engine local se cliente supabase não inicializado
      const engine = getControlPlaneEngine();
      const res = await engine.startPlaybackSession(req);
      if (res.success && res.sessionId && res.sessionToken) {
        this.activeSession = {
          sessionId: res.sessionId,
          sessionToken: res.sessionToken,
          licenseId: req.licenseId,
          deviceId: req.deviceId,
          status: 'ACTIVE',
          heartbeatIntervalSeconds: res.heartbeatIntervalSeconds || 60,
          staleSessionSeconds: res.staleSessionSeconds || 120,
        };
      }
      return res;
    }

    try {
      const { data, error } = await client.rpc('rpc_device_start_playback_session', {
        p_license_id: req.licenseId,
        p_device_id: req.deviceId,
        p_device_token: req.deviceToken,
        p_metadata: req.metadata || {},
      });

      if (error) {
        return {
          success: false,
          code: 'RPC_EXECUTION_ERROR',
          message: error.message || 'Falha ao iniciar sessão de reprodução no servidor.',
        };
      }

      const res = data as DeviceStartPlaybackSessionResponse;
      if (res.success && res.sessionId && res.sessionToken) {
        this.activeSession = {
          sessionId: res.sessionId,
          sessionToken: res.sessionToken,
          licenseId: req.licenseId,
          deviceId: req.deviceId,
          status: 'ACTIVE',
          heartbeatIntervalSeconds: res.heartbeatIntervalSeconds || 60,
          staleSessionSeconds: res.staleSessionSeconds || 120,
        };
      }
      return res;
    } catch (err: unknown) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Falha de comunicação com o plano de controle.',
      };
    }
  }

  /**
   * Envia pulso de heartbeat para renovação do lease de sessão no servidor.
   */
  async sendHeartbeat(
    req: DeviceHeartbeatPlaybackSessionRequest
  ): Promise<DeviceHeartbeatPlaybackSessionResponse> {
    if (this.preferLocalEngine) {
      const engine = getControlPlaneEngine();
      return engine.heartbeatPlaybackSession(req);
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      const engine = getControlPlaneEngine();
      return engine.heartbeatPlaybackSession(req);
    }

    try {
      const { data, error } = await client.rpc('rpc_device_heartbeat_playback_session', {
        p_session_id: req.sessionId,
        p_device_id: req.deviceId,
        p_session_token: req.sessionToken,
      });

      if (error) {
        return {
          success: false,
          code: 'RPC_EXECUTION_ERROR',
          message: error.message,
        };
      }

      return data as DeviceHeartbeatPlaybackSessionResponse;
    } catch (err: unknown) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Falha de comunicação no heartbeat.',
      };
    }
  }

  /**
   * Encerra a sessão de reprodução ativamente liberando o slot imediatamente.
   */
  async closeSession(
    closeReason: string = 'USER_EXIT'
  ): Promise<DeviceClosePlaybackSessionResponse> {
    this.stopHeartbeatLoop();

    const current = this.activeSession;
    if (!current) {
      return {
        success: true,
        status: 'CLOSED',
        message: 'Nenhuma sessão ativa para encerrar.',
      };
    }

    this.activeSession = null;

    if (this.preferLocalEngine) {
      const engine = getControlPlaneEngine();
      return engine.closePlaybackSession({
        sessionId: current.sessionId,
        deviceId: current.deviceId,
        sessionToken: current.sessionToken,
        closeReason,
      });
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      const engine = getControlPlaneEngine();
      return engine.closePlaybackSession({
        sessionId: current.sessionId,
        deviceId: current.deviceId,
        sessionToken: current.sessionToken,
        closeReason,
      });
    }

    try {
      const { data, error } = await client.rpc('rpc_device_close_playback_session', {
        p_session_id: current.sessionId,
        p_device_id: current.deviceId,
        p_session_token: current.sessionToken,
        p_close_reason: closeReason,
      });

      if (error) {
        return {
          success: false,
          code: 'RPC_EXECUTION_ERROR',
          message: error.message,
        };
      }

      return data as DeviceClosePlaybackSessionResponse;
    } catch (err: unknown) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Falha ao comunicar encerramento de sessão.',
      };
    }
  }

  /**
   * Inicia o loop automático de heartbeat a cada 60s (ou intervalo retornado pelo servidor).
   */
  startHeartbeatLoop(intervalMs?: number): void {
    this.stopHeartbeatLoop();

    const interval = intervalMs ?? (this.activeSession?.heartbeatIntervalSeconds ? this.activeSession.heartbeatIntervalSeconds * 1000 : 60000);

    this.heartbeatTimer = setInterval(async () => {
      const session = this.activeSession;
      if (!session) {
        this.stopHeartbeatLoop();
        return;
      }

      const hbRes = await this.sendHeartbeat({
        sessionId: session.sessionId,
        deviceId: session.deviceId,
        sessionToken: session.sessionToken,
      });

      if (!hbRes.success) {
        this.stopHeartbeatLoop();
        this.activeSession = null;
        for (const callback of this.terminationCallbacks) {
          callback(
            hbRes.message || 'Sessão revogada ou expirada pelo plano de controle.',
            hbRes.code
          );
        }
      }
    }, interval);
  }

  /**
   * Para o loop de heartbeat.
   */
  stopHeartbeatLoop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Lista sessões pertencentes ao cliente autenticado (Customer Portal).
   */
  static async listCustomerSessions(licenseId?: string): Promise<CustomerPlaybackSessionListItem[]> {
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

export interface AuthorizedPlaybackSessionGuard {
  acquireSession(metadata?: Record<string, unknown>): Promise<{ allowed: boolean; code?: string; message?: string }>;
  releaseSession(reason?: string): Promise<void>;
  onTermination?(callback: PlaybackTerminationHandler): () => void;
}

/** Adapta a identidade autorizada ao contrato C9 sem persistir sessionId. */
export function getAuthorizedPlaybackSessionGuard(): AuthorizedPlaybackSessionGuard {
  const sessionService = getPlaybackSessionService();

  return {
    async acquireSession(metadata?: Record<string, unknown>) {
      const activation = await DeviceIdentityService.loadActivationState();
      if (
        !activation ||
        activation.status !== 'AUTHORIZED' ||
        !activation.licenseId ||
        !activation.deviceAuthToken
      ) {
        return {
          allowed: false,
          code: 'DEVICE_NOT_AUTHORIZED',
          message: 'Dispositivo sem autorização ativa para reproduzir mídia.',
        };
      }

      const result = await sessionService.acquireSession({
        licenseId: activation.licenseId,
        deviceId: activation.deviceId,
        deviceToken: activation.deviceAuthToken,
        metadata,
      });

      if (!result.success || !result.sessionId || !result.sessionToken) {
        return { allowed: false, code: result.code, message: result.message };
      }

      // Usa o intervalo retornado pelo servidor (fallback canônico do service: 60s).
      sessionService.startHeartbeatLoop();
      return { allowed: true };
    },
    async releaseSession(reason?: string) {
      await sessionService.closeSession(reason || 'USER_EXIT');
    },
    onTermination(callback: PlaybackTerminationHandler) {
      return sessionService.onTermination(callback);
    },
  };
}

let defaultPlaybackSessionService: PlaybackSessionService | null = null;
export function getPlaybackSessionService(preferLocalEngine?: boolean): PlaybackSessionService {
  if (!defaultPlaybackSessionService) {
    defaultPlaybackSessionService = new PlaybackSessionService({ preferLocalEngine });
  } else if (preferLocalEngine !== undefined) {
    defaultPlaybackSessionService.setPreferLocalEngine(preferLocalEngine);
  }
  return defaultPlaybackSessionService;
}
