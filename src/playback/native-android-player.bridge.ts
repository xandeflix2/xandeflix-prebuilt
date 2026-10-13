/**
 * Xandeflix Prebuilt — Native Android Player Bridge (Unidade T4)
 *
 * Ponte IPC via Capacitor para comunicação com o plugin NativeAndroidPlayer.
 *
 * Princípios Normativos:
 * 1. NO_SECRET_CONTEXT: Headers, tokens e dados sensíveis trafegam exclusivamente
 *    em memória de runtime. Nunca persistir ou logar valores de credenciais.
 * 2. SANITIZED_ERRORS: Erros normalizados (INVALID_REQUEST, PLAYER_ACTIVITY_UNAVAILABLE,
 *    PREVIEW_UNAVAILABLE, NATIVE_ERROR) sem expor credenciais, host ou URLs brutas.
 * 3. NO_SILENT_WEB_FALLBACK: Em ambientes web sem plugin nativo, reporta PLAYER_ACTIVITY_UNAVAILABLE
 *    de maneira observável, sem fallback silencioso para player HTML5.
 * 4. M3U_DIRECT_AUTHORITY: Consome requisições preparadas com URI autoritativa.
 */

import { registerPlugin, Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { validatePlaybackUri } from './playback-redaction.ts';
import { isCastFailureCode, castFailureNotice, type CastFailureCode } from './cast-failure.ts';

export type NativePlaybackKind = 'movie' | 'series' | 'live' | 'vod';

export interface NativeEpisodeContext {
  currentEpisodeId: string;
  hasNext: boolean;
  seasonNumber: number;
  episodeNumber: number;
  episodes: Array<{ id: string; title: string; seasonNumber: number; episodeNumber: number }>;
}
export interface NativeEpisodeNavigationEvent {
  playbackId: string;
  requestId: string;
  reason: 'ended' | 'next' | 'select';
  episodeId?: string;
}

export interface NativePlaybackRequest {
  playbackId?:string;
  uri: string;
  title?: string;
  kind: NativePlaybackKind;
  headers?: Record<string, string>;
  startPositionMs?: number;
  episodeContext?: NativeEpisodeContext;
  replacePlaybackId?: string;
  navigationRequestId?: string;
}

export interface NativePreviewRequest {
  uri: string;
  kind: 'live' | 'vod';
  headers?: Record<string, string>;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  liveContext?: NativeLiveContext;
}

export type NativeLiveAction = 'previous' | 'next' | 'channels' | 'categories' | 'guide' | 'favorite' | 'favorites' | 'selectChannel' | 'selectGroup' | 'pageNext' | 'pagePrevious' | 'groupNext' | 'groupPrevious' | 'closePanel';
export interface NativeLiveActionEvent { previewId: string; channelId: string; action: NativeLiveAction; id?: string }
export interface NativeLiveContext {
  channelId: string; name: string; groupName: string; favorite: boolean;
  browseName: string; channels: Array<{ id: string; name: string; favorite: boolean }>;
  groups: Array<{ id: string; name: string }>;
  nextPage: boolean; previousPage: boolean; nextGroups: boolean; previousGroups: boolean;
  busy: boolean; message: string;
  epg: { message: string; programs: Array<{ title: string; description: string; start: number; end: number }> };
}

export interface NativePreviewUpdateRequest {
  previewId?: string;
  /** Stop the authorized media before C9 handoff, retaining the view/mode. */
  suspendPlayback?: boolean;
  uri?: string;
  headers?: Record<string, string>;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}

export interface NativePreviewErrorEvent {
  previewId?: string;
  errorCode?: string;
}

export interface NativePreviewFullscreenChangedEvent {
  previewId?: string;
  fullscreen: boolean;
}

export interface NativePreviewTapEvent {
  previewId: string;
}

export interface NativePreviewPlayingEvent { previewId: string }

export interface NativeAndroidBackButtonEvent {}

export interface NativePlayerResumeEvent {
  positionMs?: number;
  ended?: boolean;
  errorCode?: string;
  errorCategory?: 'HTTP_ERROR' | 'NETWORK_TIMEOUT' | 'DECODER_ERROR' | 'SOURCE_UNAVAILABLE'
    | 'MEDIA_PARSER_FAILURE' | 'MEDIA_ERROR' | 'UNKNOWN';
  httpStatus?: number;
  media3ErrorCode?: number;
  checkpoint?: 'NATIVE_ACTIVITY_STARTED' | 'DATASOURCE_OPEN' | 'FIRST_FRAME' | 'PLAYER_READY';
}

export interface NativePlayerProgressEvent {playbackId?:string;positionMs:number;durationMs?:number;observedAt?:number;ended?:boolean}

export interface NativeAndroidPlayerPlugin {
  openLivePanel(options: { previewId: string; panel: 'channels' | 'categories' | 'guide' | 'favorites' }): Promise<{ accepted: boolean }>;
  setLiveControls(options: { previewId: string; context: NativeLiveContext }): Promise<{ accepted: boolean }>;
  cancelEpisodeNavigation(options: { playbackId: string; requestId: string }): Promise<void>;
  stopPlayback():Promise<void>;
  getWatchProgress(): Promise<{ events: NativePlayerProgressEvent[] }>;
  open(options: NativePlaybackRequest): Promise<{ accepted: boolean; candidateCount?: number; message?: string }>;
  startPreview(options: NativePreviewRequest): Promise<{ accepted: boolean; previewId: string; message?: string }>;
  updatePreview(options: NativePreviewUpdateRequest): Promise<{ accepted: boolean; previewId: string; message?: string }>;
  stopPreview(options?: { previewId?: string }): Promise<{ accepted: boolean; previewId?: string; message?: string }>;
  enterPreviewFullscreen(options?: { previewId?: string }): Promise<{ accepted: boolean; fullscreen: boolean; previewId?: string; message?: string }>;
  exitPreviewFullscreen(options?: { previewId?: string }): Promise<{ accepted: boolean; fullscreen: boolean; previewId?: string; message?: string }>;
  finishApp(): Promise<{ finished: boolean }>;
  addListener(eventName: 'resume', listenerFunc: (event: NativePlayerResumeEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName:'progress',listenerFunc:(event:NativePlayerProgressEvent)=>void):Promise<PluginListenerHandle>;
  addListener(eventName:'episodeNavigation',listenerFunc:(event:NativeEpisodeNavigationEvent)=>void):Promise<PluginListenerHandle>;
  addListener(eventName: 'nativePreviewError', listenerFunc: (event: NativePreviewErrorEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'nativePreviewFullscreenChanged', listenerFunc: (event: NativePreviewFullscreenChangedEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'nativePreviewTap', listenerFunc: (event: NativePreviewTapEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'nativePreviewPlaying', listenerFunc: (event: NativePreviewPlayingEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'nativeLiveAction', listenerFunc: (event: NativeLiveActionEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'androidBackButton', listenerFunc: (event: NativeAndroidBackButtonEvent) => void): Promise<PluginListenerHandle>;
}

export const NativeAndroidPlayer = registerPlugin<NativeAndroidPlayerPlugin>('NativeAndroidPlayer');

export type NativeAndroidPlayerErrorCode =
  | CastFailureCode
  | 'INVALID_REQUEST'
  | 'PLAYER_ACTIVITY_UNAVAILABLE'
  | 'PREVIEW_UNAVAILABLE'
  | 'NATIVE_ERROR'
  | 'LIVE_PREVIEW_NATIVE_UNAVAILABLE'
  | 'LIVE_PREVIEW_SURFACE_FAILED'
  | 'LIVE_PREVIEW_OPEN_FAILED'
  | 'LIVE_PREVIEW_UNSUPPORTED_CONTAINER'
  | 'LIVE_PREVIEW_PLAYBACK_FAILED'
  | 'LIVE_PREVIEW_FULLSCREEN_FAILED';

export interface NativeAndroidPlayerOpenResult {
  success: boolean;
  state: 'NATIVE_PLAYER_OPENED' | 'NATIVE_PLAYER_UNAVAILABLE' | 'NATIVE_PLAYER_ERROR';
  candidateCount?: number;
  errorCode?: NativeAndroidPlayerErrorCode;
  errorMessage?: string;
}

export interface NativeAndroidPreviewResult {
  success: boolean;
  accepted: boolean;
  previewId?: string;
  errorCode?: NativeAndroidPlayerErrorCode;
  errorMessage?: string;
  fullscreen?: boolean;
}

/**
 * Valida a integridade da requisição de reprodução nativa antes da chamada IPC.
 */
function validatePlaybackRequest(request: NativePlaybackRequest): void {
  if (!request || typeof request !== 'object') {
    throw new Error('Requisição de reprodução nula ou inválida.');
  }

  if (!request.uri || typeof request.uri !== 'string' || request.uri.trim().length === 0) {
    throw new Error('URI de reprodução ausente.');
  }

  validatePlaybackUri(request.uri);

  const allowedKinds: NativePlaybackKind[] = ['movie', 'series', 'live', 'vod'];
  if (!request.kind || !allowedKinds.includes(request.kind)) {
    throw new Error(`Kind de reprodução inválido: ${request.kind}`);
  }
}

/**
 * Abre a Activity nativa em tela cheia (NativePlayerActivity) via NativeAndroidPlayer.
 */
export async function openNativeAndroidPlayer(
  request: NativePlaybackRequest,
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<NativeAndroidPlayerOpenResult> {
  // 1. Validação estrita de contrato e segurança
  try {
    validatePlaybackRequest(request);
  } catch (validationErr: unknown) {
    const msg = validationErr instanceof Error ? validationErr.message : 'Parâmetros de requisição inválidos.';
    return {
      success: false,
      state: 'NATIVE_PLAYER_ERROR',
      errorCode: 'INVALID_REQUEST',
      errorMessage: msg,
    };
  }

  // 2. Verificação de suporte de plataforma nativa
  const isNative = Capacitor.isNativePlatform();
  const isPluginAvailable = Capacitor.isPluginAvailable('NativeAndroidPlayer');

  if (!isNative && !isPluginAvailable && !pluginInstance) {
    return {
      success: false,
      state: 'NATIVE_PLAYER_UNAVAILABLE',
      errorCode: 'PLAYER_ACTIVITY_UNAVAILABLE',
      errorMessage: 'Player nativo AndroidX Media3 disponível exclusivamente em dispositivos Android nativos.',
    };
  }

  const plugin = pluginInstance || NativeAndroidPlayer;

  // 3. Invocação segura via IPC Capacitor
  try {
    const result = await plugin.open({
      playbackId:request.playbackId,
      episodeContext:request.episodeContext,
      replacePlaybackId:request.replacePlaybackId,
      navigationRequestId:request.navigationRequestId,
      uri: request.uri.trim(),
      title: request.title?.trim() || undefined,
      kind: request.kind,
      headers: request.headers ? { ...request.headers } : undefined,
      startPositionMs: request.startPositionMs && request.startPositionMs > 0 ? request.startPositionMs : undefined,
    });

    if (result.accepted) {
      return {
        success: true,
        state: 'NATIVE_PLAYER_OPENED',
        candidateCount: result.candidateCount,
      };
    }

    return {
      success: false,
      state: 'NATIVE_PLAYER_ERROR',
      errorCode: 'NATIVE_ERROR',
      errorMessage: result.message || 'Player nativo rejeitou os parâmetros de reprodução.',
    };
  } catch (ipcErr: unknown) {
    const reported = readNativeErrorCode(ipcErr);
    const code = isCastFailureCode(reported) || reported === 'INVALID_REQUEST'
      || reported === 'PLAYER_ACTIVITY_UNAVAILABLE' || reported === 'PREVIEW_UNAVAILABLE' ? reported : 'NATIVE_ERROR';
    return {
      success: false,
      state: 'NATIVE_PLAYER_ERROR',
      errorCode: code,
      errorMessage: castFailureNotice(code) || 'Não foi possível iniciar o player nativo. Tente novamente.',
    };
  }
}

/**
 * Inicia preview nativo embutido (contrato preparado para ciclo posterior de Live TV).
 */
export async function startNativeAndroidPreview(
  request: NativePreviewRequest,
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<NativeAndroidPreviewResult> {
  const isNative = Capacitor.isNativePlatform();
  const isPluginAvailable = Capacitor.isPluginAvailable('NativeAndroidPlayer');

  if (!isNative && !isPluginAvailable && !pluginInstance) {
    return {
      success: false,
      accepted: false,
      errorCode: 'PREVIEW_UNAVAILABLE',
      errorMessage: 'Live preview nativo indisponível fora do ambiente nativo Android.',
    };
  }

  const plugin = pluginInstance || NativeAndroidPlayer;
  try {
    validatePlaybackUri(request.uri);
    const res = await plugin.startPreview(request);
    return {
      success: res.accepted,
      accepted: res.accepted,
      previewId: res.previewId,
      errorMessage: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      accepted: false,
      errorCode: readNativeErrorCode(err) || 'NATIVE_ERROR',
      errorMessage: err instanceof Error ? err.message : 'Erro ao iniciar preview nativo.',
    };
  }
}

/**
 * Atualiza preview nativo embutido.
 */
export async function updateNativeAndroidPreview(
  request: NativePreviewUpdateRequest,
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<NativeAndroidPreviewResult> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  try {
    if (request.uri) {
      validatePlaybackUri(request.uri);
    }
    const res = await plugin.updatePreview(request);
    return {
      success: res.accepted,
      accepted: res.accepted,
      previewId: res.previewId,
      errorMessage: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      accepted: false,
      errorCode: readNativeErrorCode(err) || 'NATIVE_ERROR',
      errorMessage: err instanceof Error ? err.message : 'Erro ao atualizar preview nativo.',
    };
  }
}

/**
 * Encerra preview nativo embutido.
 */
export async function stopNativeAndroidPreview(
  options?: { previewId?: string },
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<NativeAndroidPreviewResult> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  try {
    const res = await plugin.stopPreview(options);
    return {
      success: res.accepted,
      accepted: res.accepted,
      previewId: res.previewId,
      errorMessage: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      accepted: false,
      errorCode: readNativeErrorCode(err) || 'NATIVE_ERROR',
      errorMessage: err instanceof Error ? err.message : 'Erro ao encerrar preview nativo.',
    };
  }
}

/** Promove o PlayerView inline existente para fullscreen sem recriar o player. */
export async function enterNativeAndroidPreviewFullscreen(
  options?: { previewId?: string },
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<NativeAndroidPreviewResult> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  try {
    const res = await plugin.enterPreviewFullscreen(options);
    return {
      success: res.accepted,
      accepted: res.accepted,
      previewId: res.previewId,
      fullscreen: res.fullscreen,
      errorMessage: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      accepted: false,
      errorCode: readNativeErrorCode(err) || 'LIVE_PREVIEW_FULLSCREEN_FAILED',
      errorMessage: 'Erro ao expandir o preview nativo.',
    };
  }
}

/** Restaura o mesmo PlayerView inline sem recriar o player. */
export async function exitNativeAndroidPreviewFullscreen(
  options?: { previewId?: string },
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<NativeAndroidPreviewResult> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  try {
    const res = await plugin.exitPreviewFullscreen(options);
    return {
      success: res.accepted,
      accepted: res.accepted,
      previewId: res.previewId,
      fullscreen: res.fullscreen,
      errorMessage: res.message,
    };
  } catch (err: unknown) {
    return {
      success: false,
      accepted: false,
      errorCode: readNativeErrorCode(err) || 'LIVE_PREVIEW_FULLSCREEN_FAILED',
      errorMessage: 'Erro ao restaurar o preview nativo.',
    };
  }
}

/**
 * Adiciona listener para eventos de retorno da Activity nativa do player para a WebView.
 */
export async function addNativePlayerResumeListener(
  listener: (event: NativePlayerResumeEvent) => void,
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<PluginListenerHandle> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  return plugin.addListener('resume', listener);
}

/** Recebe o BACK físico nativo antes de qualquer fallback que finalize a Activity. */
export async function addNativeAndroidBackButtonListener(
  listener: (event: NativeAndroidBackButtonEvent) => void,
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<PluginListenerHandle> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  return plugin.addListener('androidBackButton', listener);
}

/** Finaliza a Activity somente quando a rota web atual é a raiz real. */
export async function finishNativeAndroidApp(
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<boolean> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  try {
    const result = await plugin.finishApp();
    return result.finished === true;
  } catch {
    return false;
  }
}

export async function addNativePreviewErrorListener(
  listener: (event: NativePreviewErrorEvent) => void,
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<PluginListenerHandle> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  return plugin.addListener('nativePreviewError', listener);
}

export async function addNativePreviewFullscreenListener(
  listener: (event: NativePreviewFullscreenChangedEvent) => void,
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<PluginListenerHandle> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  return plugin.addListener('nativePreviewFullscreenChanged', listener);
}

export async function addNativePreviewTapListener(
  listener: (event: NativePreviewTapEvent) => void,
  pluginInstance?: NativeAndroidPlayerPlugin
): Promise<PluginListenerHandle> {
  const plugin = pluginInstance || NativeAndroidPlayer;
  return plugin.addListener('nativePreviewTap', listener);
}

export async function addNativePlayerProgressListener(listener:(event:NativePlayerProgressEvent)=>void):Promise<PluginListenerHandle> {
  if(!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('NativeAndroidPlayer'))throw new Error('NATIVE_UNAVAILABLE');
  return NativeAndroidPlayer.addListener('progress',listener);
}

export async function readNativeWatchProgress(): Promise<NativePlayerProgressEvent[]> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('NativeAndroidPlayer')) return [];
  try {
    const result = await NativeAndroidPlayer.getWatchProgress();
    return Array.isArray(result.events) ? result.events.slice(0, 4) : [];
  } catch { return []; }
}

export async function addNativePreviewPlayingListener(listener: (event: NativePreviewPlayingEvent) => void): Promise<PluginListenerHandle> {
  return NativeAndroidPlayer.addListener('nativePreviewPlaying', listener);
}

export function addNativeLiveActionListener(listener: (event: NativeLiveActionEvent) => void): Promise<PluginListenerHandle> {
  return NativeAndroidPlayer.addListener('nativeLiveAction', listener);
}
export async function setNativeLiveControls(previewId: string, context: NativeLiveContext): Promise<void> {
  const result = await NativeAndroidPlayer.setLiveControls({ previewId, context });
  if (!result.accepted) throw Error('LIVE_CONTROLS_UNAVAILABLE');
}
export async function openNativeLivePanel(previewId: string, panel: 'channels' | 'categories' | 'guide' | 'favorites'): Promise<void> {
  const result = await NativeAndroidPlayer.openLivePanel({ previewId, panel });
  if (!result.accepted) throw Error('LIVE_CONTROLS_UNAVAILABLE');
}

function readNativeErrorCode(err: unknown): NativeAndroidPlayerErrorCode | undefined {
  if (!err || typeof err !== 'object' || !('code' in err)) {
    return undefined;
  }

  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? (code as NativeAndroidPlayerErrorCode) : undefined;
}
