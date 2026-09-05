/**
 * Xandeflix Prebuilt — Playback Types (Gate G8)
 *
 * Contratos de tipos para o subsistema de reprodução direta Device-to-Source.
 *
 * Princípios:
 * - ZERO CATALOG SECRET: StreamRef e catálogo permanecem desacoplados de credenciais.
 * - EPHEMERAL REQUEST: ResolvedPlaybackRequest existe apenas durante a sessão de reprodução.
 * - CANONICAL STATES: Estados e categorias de erro bem definidos e sanitizados.
 */

export type SourceProviderKind =
  | 'SYNTHETIC_DIRECT'
  | 'FUTURE_XTREAM'
  | 'FUTURE_GENERIC_HTTP';

export type PlaybackState =
  | 'IDLE'
  | 'RESOLVING'
  | 'READY_TO_START'
  | 'OPENING_NATIVE_PLAYER'
  | 'BUFFERING'
  | 'PLAYING'
  | 'PAUSED'
  | 'ENDED'
  | 'ERROR'
  | 'UNAVAILABLE';

export type PlaybackErrorCategory =
  | 'STREAM_REF_NOT_FOUND'
  | 'SOURCE_CONTEXT_UNAVAILABLE'
  | 'SOURCE_CONTEXT_EXPIRED'
  | 'UNSUPPORTED_SCHEME'
  | 'URL_USERINFO_CREDENTIALS_REJECTED'
  | 'RESOLUTION_FAILED'
  | 'PLAYER_UNAVAILABLE'
  | 'PLAYER_INIT_FAILED'
  | 'MEDIA_SOURCE_ERROR'
  | 'PLAYBACK_ERROR'
  | 'UNKNOWN';

export interface ResolvedPlaybackRequest {
  uri: string;
  streamRefId: string;
  contentKind: 'movie' | 'episode';
  title: string;
  providerKind: SourceProviderKind;
  headers?: Record<string, string>;
  mimeType?: string;
  startPositionMs?: number;
}

export type NativePlayerLaunchState =
  | 'NATIVE_PLAYER_OPENED'
  | 'NATIVE_PLAYER_UNAVAILABLE'
  | 'NATIVE_PLAYER_ERROR';

export interface NativePlayerLaunchResult {
  success: boolean;
  state: NativePlayerLaunchState;
  errorMessage?: string;
}

export interface PlaybackSessionInfo {
  sessionId: string;
  state: PlaybackState;
  streamRefId?: string;
  sanitizedUri?: string;
  errorCategory?: PlaybackErrorCategory;
  errorMessage?: string;
}
