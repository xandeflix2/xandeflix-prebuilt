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
import {
  type RuntimeSourceContext,
  createSyntheticSourceContext,
} from './source-runtime-context.ts';
import { type StreamResolver } from './stream-resolver.interface.ts';
import { DirectStreamResolver } from './direct-stream-resolver.ts';
import { NativePlayerClient } from './native-player.client.ts';
import { sanitizePlaybackUriForLog } from './playback-redaction.ts';

export type PlaybackStateListener = (session: PlaybackSessionInfo) => void;

export class PlaybackService {
  private runtimeContext: RuntimeSourceContext | undefined;
  private resolver: StreamResolver;
  private playerClient: NativePlayerClient;
  private currentSession: PlaybackSessionInfo;
  private listeners = new Set<PlaybackStateListener>();

  constructor(options?: {
    runtimeContext?: RuntimeSourceContext;
    resolver?: StreamResolver;
    playerClient?: NativePlayerClient;
  }) {
    // Por padrão no Gate G8 técnico, inicializa com contexto sintético
    this.runtimeContext = options?.runtimeContext ?? createSyntheticSourceContext();
    this.resolver = options?.resolver ?? new DirectStreamResolver();
    this.playerClient = options?.playerClient ?? new NativePlayerClient();

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
      // 1. Localizar filme no catálogo ativo
      const movie = readModel.moviesById.get(movieId);
      if (!movie) {
        throw PlaybackError.streamRefNotFound(`Filme ${movieId}`);
      }

      // 2. Extrair primeiro streamId associado
      const streamId = movie.streamIds?.[0];
      if (!streamId) {
        throw PlaybackError.streamRefNotFound(`Nenhum streamId no filme ${movieId}`);
      }

      // 3. Localizar StreamRef canônico
      const streamRef = readModel.getStreamRef(streamId);
      if (!streamRef) {
        throw PlaybackError.streamRefNotFound(streamId);
      }

      this.updateSession({ streamRefId: streamRef.id });

      // 4. Resolver requisição direta
      const resolvedRequest = await this.resolveStream(streamRef, {
        title: movie.title,
        startPositionMs: options?.startPositionMs,
      });

      // 5. Iniciar player nativo
      return await this.launchPlayer(resolvedRequest);
    } catch (err: unknown) {
      return this.handlePlaybackFailure(err);
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
      // 1. Localizar série e episódio no catálogo ativo
      const series = readModel.seriesById.get(seriesId);
      const episode = readModel.episodesById.get(episodeId);

      if (!episode) {
        throw PlaybackError.streamRefNotFound(`Episódio ${episodeId}`);
      }

      // 2. Extrair primeiro streamId associado
      const streamId = episode.streamIds?.[0];
      if (!streamId) {
        throw PlaybackError.streamRefNotFound(`Nenhum streamId no episódio ${episodeId}`);
      }

      // 3. Localizar StreamRef canônico
      const streamRef = readModel.getStreamRef(streamId);
      if (!streamRef) {
        throw PlaybackError.streamRefNotFound(streamId);
      }

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
      return this.handlePlaybackFailure(err);
    }
  }

  /**
   * Executa a resolução direta da StreamRef via resolver injetado.
   */
  async resolveStream(
    streamRef: StreamRef,
    options?: { title?: string; startPositionMs?: number }
  ): Promise<ResolvedPlaybackRequest> {
    if (!this.runtimeContext) {
      throw PlaybackError.sourceContextUnavailable();
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
    this.updateSession({ state: 'OPENING_NATIVE_PLAYER' });

    const result = await this.playerClient.launch(request);

    if (result.state === 'NATIVE_PLAYER_OPENED') {
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

    return result;
  }

  private handlePlaybackFailure(err: unknown): NativePlayerLaunchResult {
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

    return {
      success: false,
      state: 'NATIVE_PLAYER_ERROR',
      errorMessage,
    };
  }
}

// Instância singleton para uso compartilhado na UI
export const defaultPlaybackService = new PlaybackService();
