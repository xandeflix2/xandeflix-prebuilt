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
  type NativeEpisodeNavigationEvent,
} from './native-android-player.bridge.ts';
import { episodeContext, orderedSeriesEpisodes } from './episode-sequence.ts';
import { sanitizePlaybackUriForLog } from './playback-redaction.ts';
import { getAuthorizedPlaybackSessionGuard } from '../control-plane/client/playback-session.service.ts';
import { bootTelemetry } from '../diagnostics/boot-telemetry.ts';
import { armCastAuthorization,stopGoogleCast } from './google-cast.ts';
import { NativeAndroidPlayer } from './native-android-player.bridge.ts';
import {watchHistory,WatchHistory,watchFingerprint} from './watch-history.ts';
import { isAdultCatalogItem } from './content-adult-policy.ts';

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
  private history:WatchHistory;
  private watchPlaybackId?:string;
  private episodeRun = 0;
  private episodePlayback?: { seriesId: string; episodeId: string; model: CatalogReadModel; playbackId: string; run: number };
  private navigatingEpisode = false;
  private currentSession: PlaybackSessionInfo;
  private listeners = new Set<PlaybackStateListener>();

  constructor(options?: {
    runtimeContext?: RuntimeSourceContext;
    contextProvider?: RuntimeSourceContextProvider;
    resolver?: StreamResolver;
    playerAdapter?: NativePlayerAdapter;
    playerClient?: NativePlayerClient;
    sessionGuard?: PlaybackSessionGuard;
    history?:WatchHistory;
  }) {
    // Caminho canônico real não cria contexto sintético arbitrário
    this.runtimeContext = options?.runtimeContext;
    this.contextProvider = options?.contextProvider;
    this.resolver = options?.resolver ?? new DirectStreamResolver();
    this.playerAdapter = options?.playerAdapter ?? new NativeAndroidPlayerAdapter();
    this.playerClient = options?.playerClient;
    this.sessionGuard = options?.sessionGuard;
    this.history=options?.history ?? watchHistory;
    if (this.sessionGuard?.onTermination) {
      this.sessionGuard.onTermination((reason, code) => {
        this.invalidateEpisodePlayback();
        void stopGoogleCast();void NativeAndroidPlayer.stopPlayback().catch(()=>{});
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
      nativeErrorCode: updates.state ? undefined : this.currentSession.nativeErrorCode,
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
    this.invalidateEpisodePlayback();
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
        await armCastAuthorization();
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
      await this.history.syncNativeProgress();
      const fingerprint = watchFingerprint('movie', movie);
      const resolvedRequest = await this.resolveStream(streamRef, {
        title: movie.title,
        startPositionMs: options?.startPositionMs ?? this.history.savedPosition('movie', movieId, fingerprint),
      });

      // 5. Iniciar player nativo
      this.watchPlaybackId=this.history.begin('movie',movieId,undefined,fingerprint,!isAdultCatalogItem(movie,readModel));
      await this.history.ready();
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
    this.invalidateEpisodePlayback();
    return this.playEpisodeInternal(seriesId, episodeId, readModel, options, this.episodeRun);
  }

  private invalidateEpisodePlayback(): void {
    this.episodeRun++;
    this.episodePlayback = undefined;
    this.navigatingEpisode = false;
  }

  /** Only the active native playback may request an episode; no stream URLs enter this event. */
  async navigateEpisode(event: NativeEpisodeNavigationEvent): Promise<boolean> {
    const current = this.episodePlayback;
    if (!current || current.playbackId !== event.playbackId || current.run !== this.episodeRun
      || this.navigatingEpisode || !/^[A-Za-z0-9_-]{1,64}$/.test(event.requestId)
      || !['ended', 'next', 'select'].includes(event.reason)) return false;
    const sequence = orderedSeriesEpisodes(current.model, current.seriesId);
    const index = sequence.findIndex(ep => ep.id === current.episodeId);
    const next = event.reason === 'select'
      ? sequence.find(ep => ep.id === event.episodeId && ep.id !== current.episodeId)
      : index >= 0 ? sequence[index + 1] : undefined;
    if (!next) {
      await NativeAndroidPlayer.cancelEpisodeNavigation({ playbackId: event.playbackId, requestId: event.requestId }).catch(() => {});
      return false;
    }
    this.navigatingEpisode = true;
    try {
      // Final native journal has already saved completion/manual exit. Close old C9 lease
      // before acquiring the next one; the normal authorization/resolver remains authoritative.
      await this.history.syncNativeProgress();
      if (current.run !== this.episodeRun) return false;
      await this.releaseSession('EPISODE_TRANSITION');
      if (current.run !== this.episodeRun) return false;
      const result = await this.playEpisodeInternal(current.seriesId, next.id, current.model,
        event.reason === 'select' ? undefined : { startPositionMs: 0 }, current.run,
        { replacePlaybackId: event.playbackId, navigationRequestId: event.requestId });
      if (!result.success && current.run === this.episodeRun) {
        this.episodePlayback = undefined;
        await NativeAndroidPlayer.cancelEpisodeNavigation({ playbackId: event.playbackId, requestId: event.requestId }).catch(() => {});
      }
      return result.success;
    } catch (error) {
      if (current.run === this.episodeRun) {
        this.episodePlayback = undefined;
        await this.handlePlaybackFailure(error);
        await NativeAndroidPlayer.cancelEpisodeNavigation({ playbackId: event.playbackId, requestId: event.requestId }).catch(() => {});
      }
      return false;
    } finally {
      if (current.run === this.episodeRun) this.navigatingEpisode = false;
    }
  }

  private async playEpisodeInternal(
    seriesId: string, episodeId: string, readModel: CatalogReadModel,
    options: { startPositionMs?: number } | undefined, run: number,
    replacement?: { replacePlaybackId: string; navigationRequestId: string },
  ): Promise<NativePlayerLaunchResult> {
    const assertActive = () => { if (run !== this.episodeRun) throw new Error('EPISODE_TRANSITION_CANCELLED'); };
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
        if (run !== this.episodeRun) {
          if (guardRes.allowed) await this.sessionGuard.releaseSession('USER_EXIT');
          assertActive();
        }
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
      await armCastAuthorization();
      assertActive();
      const series = readModel.seriesById.get(seriesId);
      if (series) bootTelemetry.mark('SERIES_DETAIL_RESOLVED');
      let episode = readModel.episodesById.get(episodeId);
      if (typeof readModel.loadEpisodesForSeries === 'function') {
        await readModel.loadEpisodesForSeries(seriesId);
        assertActive();
        episode = readModel.episodesById.get(episodeId);
      }

      if (!series || !episode || episode.seriesId !== seriesId) {
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
      assertActive();
      if (!streamRef) {
        throw PlaybackError.streamRefNotFound(streamId);
      }
      bootTelemetry.mark('EPISODE_STREAMREF_RESOLVED');

      this.updateSession({ streamRefId: streamRef.id });

      // 4. Resolver requisição direta
      const title = series
        ? `${series.title} — EP ${episode.episodeNumber}: ${episode.title}`
        : episode.title;

      await this.history.syncNativeProgress();
      assertActive();
      const fingerprint = watchFingerprint('series', series);
      const resolvedRequest = await this.resolveStream(streamRef, {
        title,
        startPositionMs: options?.startPositionMs ?? this.history.savedPosition('series', seriesId, fingerprint, episodeId),
      }, () => run === this.episodeRun);
      assertActive();

      // 5. Iniciar player nativo
      this.watchPlaybackId=this.history.begin('series',seriesId,episodeId,fingerprint,!isAdultCatalogItem(series,readModel));
      await this.history.ready();
      assertActive();
      this.episodePlayback = { seriesId, episodeId, model: readModel, playbackId: this.watchPlaybackId, run };
      return await this.launchPlayer(resolvedRequest, replacement, () => run === this.episodeRun);
    } catch (err: unknown) {
      if (run !== this.episodeRun) {
        if (this.sessionAcquired && !this.episodePlayback) await this.releaseSession('USER_EXIT');
        return { success: false, state: 'NATIVE_PLAYER_ERROR', errorMessage: 'Reprodução encerrada.' };
      }
      this.episodePlayback = undefined;
      return await this.handlePlaybackFailure(err);
    }
  }

  /**
   * Executa a resolução direta da StreamRef via resolver injetado.
   */
  async resolveStream(
    streamRef: StreamRef,
    options?: { title?: string; startPositionMs?: number },
    isCurrent?: () => boolean,
  ): Promise<ResolvedPlaybackRequest> {
    const hasDirectUrl = Boolean(streamRef.directStreamUrl);

    // Lazy resolution: se o contexto não está disponível, consultar o provider
    if (!hasDirectUrl && this.contextProvider) {
      const resolved = await this.contextProvider.resolve({
        forceRefresh: Boolean(this.runtimeContext),
      });
      this.runtimeContext = resolved;
    }
    if (isCurrent && !isCurrent()) throw new Error('EPISODE_TRANSITION_CANCELLED');

    if (!this.runtimeContext && !hasDirectUrl) {
      const providerFailure = this.contextProvider?.getLastFailure?.();
      throw providerFailure ?? PlaybackError.sourceContextUnavailable();
    }

    const resolved = await this.resolver.resolve(streamRef, this.runtimeContext, options);
    if (isCurrent && !isCurrent()) throw new Error('EPISODE_TRANSITION_CANCELLED');
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
    request: ResolvedPlaybackRequest,
    replacement?: { replacePlaybackId: string; navigationRequestId: string },
    isCurrent?: () => boolean,
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
        playbackId:this.watchPlaybackId,
        uri: request.uri,
        title: request.title,
        kind,
        headers: request.headers,
        startPositionMs: request.startPositionMs,
        episodeContext: kind === 'series' && this.episodePlayback
          ? episodeContext(this.episodePlayback.model, this.episodePlayback.seriesId, this.episodePlayback.episodeId) : undefined,
        ...replacement,
      };

      result = await this.playerAdapter.launch(nativeRequest);
    }

    if (isCurrent && !isCurrent()) return { success: false, state: 'NATIVE_PLAYER_ERROR', errorMessage: 'Reprodução encerrada.' };
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
        nativeErrorCode: result.errorCode,
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
    this.invalidateEpisodePlayback();
    await stopGoogleCast();void NativeAndroidPlayer.stopPlayback().catch(()=>{});
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
    await stopGoogleCast();
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
