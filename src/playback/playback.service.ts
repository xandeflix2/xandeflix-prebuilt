/**
 * Xandeflix Prebuilt — Playback Service (Gate G8)
 *
 * Orquestrador central da resolução de mídia e acionamento do player nativo.
 *
 * Princípios:
 * - DECOUPLED CONTEXT: Contexto da fonte é mantido apenas em memória de runtime.
 * - FAIL-CLOSED: Se a referência de stream ou o contexto faltarem, encerra sem adivinhação.
 * - OBSERVABILITY: Notifica ouvintes sobre transições de estado com metadados sanitizados.
 */

import type { CatalogReadModel } from '../catalog/catalog-read-model.ts';
import type { StreamRef } from '../contracts/catalog.ts';
import type {
  PlaybackSessionInfo,
  PlaybackErrorCategory,
  NativePlayerLaunchResult,
  ResolvedPlaybackRequest,
} from './playback.types.ts';
import { PlaybackError } from './playback-errors.ts';
import { type RuntimeSourceContext } from './source-runtime-context.ts';
import { type StreamResolver } from './stream-resolver.interface.ts';
import { DirectStreamResolver } from './direct-stream-resolver.ts';
import { NativePlayerClient } from './native-player.client.ts';
import {
  type NativePlayerAdapter,
  NativeAndroidPlayerAdapter,
} from './native-android-player.adapter.ts';
import {
  type RuntimeSourceContextProvider,
  AuthorizedRuntimeSourceContextProvider,
} from './runtime-source-context-provider.ts';
import {
  type NativePlaybackRequest,
  type NativePlaybackKind,
} from './native-android-player.bridge.ts';
import { sanitizePlaybackUriForLog } from './playback-redaction.ts';
import { getAuthorizedPlaybackSessionGuard } from '../control-plane/client/playback-session.service.ts';
import { bootTelemetry } from '../diagnostics/boot-telemetry.ts';

export type PlaybackStateListener = (session: PlaybackSessionInfo) => void;

export interface PlaybackSessionGuard {
  acquireSession(metadata?: Record<string, unknown>): Promise<{ allowed: boolean; code?: string; message?: string }>;
  releaseSession(reason?: string): Promise<void>;
  onTermination?(callback: (reason: string, code?: string) => void): () => void;
}

export class PlaybackService {
  private runtimeContext: RuntimeSourceContext | undefined;
  private contextProvider?: RuntimeSourceContextProvider;
  private resolver: StreamResolver;
  private playerAdapter: NativePlayerAdapter;
  private playerClient?: NativePlayerClient;
  private sessionGuard?: PlaybackSessionGuard;
  private sessionAcquired = false;
  private currentSession: PlaybackSessionInfo;
  private listeners = new Set<PlaybackStateListener>();

  constructor(options?: {
    runtimeContext?: RuntimeSourceContext;
    contextProvider?: RuntimeSourceContextProvider;
    resolver?: StreamResolver;
    playerAdapter?: NativePlayerAdapter;
    playerClient?: NativePlayerClient;
    sessionGuard?: PlaybackSessionGuard;
  }) {
    // Caminho canônico real não cria contexto sintético arbitrário
    this.runtimeContext = options?.runtimeContext;
    this.contextProvider = options?.contextProvider;
    this.resolver = options?.resolver ?? new DirectStreamResolver();
    this.playerAdapter = options?.playerAdapter ?? new NativeAndroidPlayerAdapter();
    this.playerClient = options?.playerClient;
    this.sessionGuard = options?.sessionGuard;
    if (this.sessionGuard?.onTermination) {
      this.sessionGuard.onTermination((reason, code) => {
        this.sessionAcquired = false;
        this.updateSession({
          state: 'ERROR',
          errorCategory: 'LICENSE_ACCESS_DENIED',
          errorMessage: code ? `${code}: ${reason}` : reason,
        });
      });
    }

    this.currentSession = {
      sessionId: `session-${Date.now()}`,
      state: 'IDLE',
    };
  }

  setRuntimeSourceContext(context: RuntimeSourceContext | undefined): void {
    this.runtimeContext = context;
  }

  getRuntimeSourceContext(): RuntimeSourceContext | undefined {
    return this.runtimeContext;
  }

  getCurrentSession(): PlaybackSessionInfo {
    return { ...this.currentSession };
  }

  subscribe(listener: PlaybackStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getCurrentSession());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateSession(updates: Partial<PlaybackSessionInfo>): void {
    this.currentSession = {
      ...this.currentSession,
      ...updates,
    };
    for (const listener of this.listeners) {
      try {
        listener(this.getCurrentSession());
      } catch {
        // Ignora erros de listeners
      }
    }
  }

  /**
   * Inicia o fluxo de resolução e reprodução direta para um filme.
   */
  async playMovie(
    movieId: string,
    readModel: CatalogReadModel,
    options?: { startPositionMs?: number }
  ): Promise<NativePlayerLaunchResult> {
    bootTelemetry.mark('MOVIE_PLAY_REQUESTED');
    const sessionId = `movie-${movieId}-${Date.now()}`;
    this.updateSession({
      sessionId,
      state: 'RESOLVING',
      streamRefId: undefined,
      sanitizedUri: undefined,
      errorCategory: undefined,
      errorMessage: undefined,
    });

    try {
      // 0. Guarda de Sessão Concorrente Comercial (Gate C9)
      if (this.sessionGuard) {
        const guardRes = await this.sessionGuard.acquireSession({
          contentKind: 'movie',
          playbackSessionId: sessionId,
        });
        if (!guardRes.allowed) {
          if (guardRes.code === 'SESSION_LIMIT_REACHED') {
            throw PlaybackError.concurrentSessionLimit();
          }
          throw PlaybackError.licenseAccessDenied(guardRes.message || guardRes.code);
        }
        this.sessionAcquired = true;
        bootTelemetry.mark('C9_SESSION_STARTED');
      }

      // 1. Localizar filme no catálogo ativo
      const movie = readModel.moviesById.get(movieId);
      if (!movie) {
        throw PlaybackError.streamRefNotFound(`Filme ${movieId}`);
      }
      bootTelemetry.mark('MOVIE_CANONICAL_ITEM_RESOLVED');

      // 2. Extrair primeiro streamId associado
      const streamId = movie.streamIds?.[0];
      if (!streamId) {
        throw PlaybackError.streamRefNotFound(`Nenhum streamId no filme ${movieId}`);
      }

      // 3. Localizar StreamRef canônico
      bootTelemetry.mark('MOVIE_STREAMREF_REQUESTED');
      const streamRef = await readModel.getStreamRefAsync(streamId);
      if (!streamRef) {
        throw PlaybackError.streamRefNotFound(streamId);
      }
      bootTelemetry.mark('MOVIE_STREAMREF_RESOLVED');

      this.updateSession({ streamRefId: streamRef.id });

      // 4. Resolver requisição direta
      const resolvedRequest = await this.resolveStream(streamRef, {
        title: movie.title,
        startPositionMs: options?.startPositionMs,
      });

      // 5. Iniciar player nativo
      return await this.launchPlayer(resolvedRequest);
    } catch (err: unknown) {
      return await this.handlePlaybackFailure(err);
    }
  }

  /**
   * Inicia o fluxo de resolução e reprodução direta para um episódio de série.
   */
  async playEpisode(
    seriesId: string,
    episodeId: string,
    readModel: CatalogReadModel,
    options?: { startPositionMs?: number }
  ): Promise<NativePlayerLaunchResult> {
    const sessionId = `episode-${episodeId}-${Date.now()}`;
    this.updateSession({
      sessionId,
      state: 'RESOLVING',
      streamRefId: undefined,
      sanitizedUri: undefined,
      errorCategory: undefined,
      errorMessage: undefined,
    });

    try {
      // 0. Guarda de Sessão Concorrente Comercial (Gate C9)
      if (this.sessionGuard) {
        const guardRes = await this.sessionGuard.acquireSession({
          contentKind: 'episode',
          playbackSessionId: sessionId,
        });
        if (!guardRes.allowed) {
          if (guardRes.code === 'SESSION_LIMIT_REACHED') {
            throw PlaybackError.concurrentSessionLimit();
          }
          throw PlaybackError.licenseAccessDenied(guardRes.message || guardRes.code);
        }
        this.sessionAcquired = true;
        bootTelemetry.mark('C9_SESSION_STARTED');
      }

      // 1. Localizar série e episódio no catálogo ativo
      const series = readModel.seriesById.get(seriesId);
      if (series) bootTelemetry.mark('SERIES_DETAIL_RESOLVED');
      let episode = readModel.episodesById.get(episodeId);
      if (!episode && typeof (readModel as any).loadEpisodesForSeries === "function") {
        await (readModel as any).loadEpisodesForSeries(seriesId);
        episode = readModel.episodesById.get(episodeId);
      }

      if (!episode) {
        throw PlaybackError.streamRefNotFound(`Episódio ${episodeId}`);
      }
      bootTelemetry.mark('EPISODE_SELECTED');
      bootTelemetry.mark('SEASON_RESOLVED');

      // 2. Extrair primeiro streamId associado
      const streamId = episode.streamIds?.[0];
      if (!streamId) {
        throw PlaybackError.streamRefNotFound(`Nenhum streamId no episódio ${episodeId}`);
      }

      // 3. Localizar StreamRef canônico
      bootTelemetry.mark('EPISODE_STREAMREF_REQUESTED');
      const streamRef = await readModel.getStreamRefAsync(streamId);
      if (!streamRef) {
        throw PlaybackError.streamRefNotFound(streamId);
      }
      bootTelemetry.mark('EPISODE_STREAMREF_RESOLVED');

      this.updateSession({ streamRefId: streamRef.id });

      // 4. Resolver requisição direta
      const title = series
        ? `${series.title} — EP ${episode.episodeNumber}: ${episode.title}`
        : episode.title;

      const resolvedRequest = await this.resolveStream(streamRef, {
        title,
        startPositionMs: options?.startPositionMs,
      });

      // 5. Iniciar player nativo
      return await this.launchPlayer(resolvedRequest);
    } catch (err: unknown) {
      return await this.handlePlaybackFailure(err);
    }
  }

  /**
   * Executa a resolução direta da StreamRef via resolver injetado.
   */
  async resolveStream(
    streamRef: StreamRef,
    options?: { title?: string; startPositionMs?: number }
  ): Promise<ResolvedPlaybackRequest> {
    const hasDirectUrl = Boolean(streamRef.directStreamUrl);

    // Lazy resolution: se o contexto não está disponível, consultar o provider
    if (!hasDirectUrl && this.contextProvider) {
      const resolved = await this.contextProvider.resolve({
        forceRefresh: Boolean(this.runtimeContext),
      });
      this.runtimeContext = resolved;
    }

    if (!this.runtimeContext && !hasDirectUrl) {
      const providerFailure = this.contextProvider?.getLastFailure?.();
      throw providerFailure ?? PlaybackError.sourceContextUnavailable();
    }

    const resolved = await this.resolver.resolve(streamRef, this.runtimeContext, options);
    this.updateSession({
      state: 'READY_TO_START',
      sanitizedUri: sanitizePlaybackUriForLog(resolved.uri),
    });

    return resolved;
  }

  /**
   * Dispara o pedido de abertura do player nativo.
   */
  private async launchPlayer(
    request: ResolvedPlaybackRequest
  ): Promise<NativePlayerLaunchResult> {
    bootTelemetry.mark('NATIVE_PLAYER_START_REQUESTED');
    this.updateSession({ state: 'OPENING_NATIVE_PLAYER' });

    let result: NativePlayerLaunchResult;

    if (this.playerClient) {
      // Compatibilidade retroativa para injeção explícita de client legado
      result = await this.playerClient.launch(request);
    } else {
      // Caminho canônico novo via NativeAndroidPlayerAdapter
      const kind: NativePlaybackKind =
        request.contentKind === 'movie'
          ? 'movie'
          : request.contentKind === 'episode'
            ? 'series'
            : 'vod';

      const nativeRequest: NativePlaybackRequest = {
        uri: request.uri,
        title: request.title,
        kind,
        headers: request.headers,
        startPositionMs: request.startPositionMs,
      };

      result = await this.playerAdapter.launch(nativeRequest);
    }

    if (result.state === 'NATIVE_PLAYER_OPENED') {
      bootTelemetry.mark('NATIVE_PLAYER_STARTED');
      bootTelemetry.mark('FIRST_FRAME_OR_PLAYER_STATE');
      this.updateSession({ state: 'PLAYING' });
    } else if (result.state === 'NATIVE_PLAYER_UNAVAILABLE') {
      this.updateSession({
        state: 'UNAVAILABLE',
        errorCategory: 'PLAYER_UNAVAILABLE',
        errorMessage: result.errorMessage,
      });
    } else {
      this.updateSession({
        state: 'ERROR',
        errorCategory: 'PLAYER_INIT_FAILED',
        errorMessage: result.errorMessage,
      });
    }

    if (result.state !== 'NATIVE_PLAYER_OPENED' && this.sessionAcquired) {
      await this.releaseSession('PLAYER_START_FAILED');
    }

    return result;
  }

  /**
   * Encerra a reprodução e libera a sessão concorrente de forma best-effort (Gate C9).
   */
  async stopPlayback(reason: string = 'USER_EXIT'): Promise<void> {
    await this.releaseSession(reason);
    this.updateSession({ state: 'IDLE' });
  }

  private async handlePlaybackFailure(err: unknown): Promise<NativePlayerLaunchResult> {
    let errorCategory: PlaybackErrorCategory = 'UNKNOWN';
    let errorMessage = 'Erro inesperado durante a reprodução.';

    if (err instanceof PlaybackError) {
      errorCategory = err.category;
      errorMessage = err.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    this.updateSession({
      state: 'ERROR',
      errorCategory,
      errorMessage,
    });

    await this.releaseSession('MEDIA_ERROR');

    return {
      success: false,
      state: 'NATIVE_PLAYER_ERROR',
      errorMessage,
    };
  }

  private async releaseSession(reason: string): Promise<void> {
    if (!this.sessionGuard || !this.sessionAcquired) return;
    this.sessionAcquired = false;
    await this.sessionGuard.releaseSession(reason);
  }
}

// Instância singleton para uso compartilhado na UI
export const defaultPlaybackService = new PlaybackService({
  contextProvider: new AuthorizedRuntimeSourceContextProvider(),
  // O guard usa a mesma autoridade C9 para filme, episódio e Live.
  sessionGuard: getAuthorizedPlaybackSessionGuard(),
});

export const EPISODE_STREAMREF_RESOLUTION = 'LAZY_BOUNDED';
