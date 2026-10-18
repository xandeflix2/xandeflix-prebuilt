import type { NativePlaybackRequest } from '../playback/native-android-player.bridge.ts';
import { hlsMediaFailure, mpegtsMediaFailure, type WebMediaFailure } from './web-playback-diagnostic.ts';
export type WebMediaTrack = { label: string; selected: boolean; select: () => void };
export type WebMediaResource = (() => void) & { tracks?: () => { audio: WebMediaTrack[]; subtitles: WebMediaTrack[] } };
function browserTracks(video: HTMLVideoElement) {
  const audio = Array.from((video as HTMLVideoElement & { audioTracks?: ArrayLike<{ label: string; language: string; enabled: boolean }> }).audioTracks || []);
  const subtitles = Array.from(video.textTracks || []).filter(track => track.kind === 'subtitles' || track.kind === 'captions');
  return {
    audio: audio.map((track, index) => ({ label: track.label || track.language || `Áudio ${index + 1}`, selected: track.enabled,
      select: () => audio.forEach(row => { row.enabled = row === track; }) })),
    subtitles: [{ label: 'Desativadas', selected: !subtitles.some(track => track.mode === 'showing'), select: () => subtitles.forEach(track => { track.mode = 'disabled'; }) },
      ...subtitles.map((track, index) => ({ label: track.label || track.language || `Legenda ${index + 1}`, selected: track.mode === 'showing',
        select: () => subtitles.forEach(row => { row.mode = row === track ? 'showing' : 'disabled'; }) }))],
  };
}
export function webMediaKind(uri: string): 'hls' | 'mpegts' | 'native' {
  const path = new URL(uri).pathname.toLowerCase();
  return path.endsWith('.m3u8') ? 'hls' : /\.(ts|m2ts|flv)$/.test(path) ? 'mpegts' : 'native';
}
export function normalizeWebMediaRequest<T extends Pick<NativePlaybackRequest, 'uri' | 'headers'>>(request: T): T {
  const headers = Object.fromEntries(Object.entries(request.headers || {}).filter(([name, value]) => !(name.toLowerCase() === 'user-agent' && value === 'IPTVSmarters/1.0')));
  const normalized = { ...request, headers: Object.keys(headers).length ? headers : undefined };
  validateWebMedia(normalized); return normalized;
}
export function validateWebMedia(request: Pick<NativePlaybackRequest, 'uri' | 'headers'>): void {
  const uri = new URL(request.uri);
  if (!['http:', 'https:'].includes(uri.protocol)) throw new Error('WEB_MEDIA_UNSUPPORTED');
  if (location.protocol === 'https:' && uri.protocol === 'http:') throw new Error('WEB_MEDIA_HTTPS_REQUIRED');
  const headers = Object.keys(request.headers || {});
  if (headers.some(name => /^(user-agent|referer|origin|host|cookie|connection|sec-|proxy-)/i.test(name))) throw new Error('WEB_MEDIA_HEADERS_UNSUPPORTED');
  if (webMediaKind(request.uri) === 'native' && headers.length) throw new Error('WEB_MEDIA_HEADERS_UNSUPPORTED');
}

/** Each attachment owns one direct transport. Destroy also aborts library downloads. */
export async function attachWebMedia(video: HTMLVideoElement, request: Pick<NativePlaybackRequest, 'uri' | 'headers' | 'kind'>,
  signal: AbortSignal, failure: (reason?: WebMediaFailure) => void): Promise<WebMediaResource> {
  validateWebMedia(request);
  const check = () => { if (signal.aborted) throw new Error('WEB_MEDIA_CANCELLED'); };
  const clear = () => { video.pause(); video.removeAttribute('src'); video.load(); };
  check(); const kind = webMediaKind(request.uri);
  if (kind === 'hls' && (!video.canPlayType('application/vnd.apple.mpegurl') || Object.keys(request.headers || {}).length)) {
    const { default: Hls } = await import('hls.js'); check();
    if (!Hls.isSupported()) throw new Error('WEB_MEDIA_UNSUPPORTED');
    const hls = new Hls({ debug: false, enableWorker: true, maxBufferLength: 20, backBufferLength: 20,
      xhrSetup: xhr => { for (const [name, value] of Object.entries(request.headers || {})) xhr.setRequestHeader(name, value); } });
    hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal && !signal.aborted) failure(hlsMediaFailure(data.type, data.details, data.response?.code)); });
    hls.attachMedia(video); hls.loadSource(request.uri);
    return Object.assign(() => { hls.destroy(); clear(); }, { tracks: () => ({
      audio: hls.audioTracks.map((track, index) => ({ label: track.name || track.lang || `Áudio ${index + 1}`, selected: hls.audioTrack === index, select: () => { hls.audioTrack = index; } })),
      subtitles: [{ label: 'Desativadas', selected: hls.subtitleTrack === -1, select: () => { hls.subtitleTrack = -1; } },
        ...hls.subtitleTracks.map((track, index) => ({ label: track.name || track.lang || `Legenda ${index + 1}`, selected: hls.subtitleTrack === index,
          select: () => { hls.subtitleDisplay = true; hls.subtitleTrack = index; } }))],
    }) });
  }
  if (kind === 'mpegts') {
    const { default: mpegts } = await import('mpegts.js'); check();
    mpegts.LoggingControl.enableAll = false;
    if (!mpegts.isSupported()) throw new Error('WEB_MEDIA_UNSUPPORTED');
    const player = mpegts.createPlayer({ type: new URL(request.uri).pathname.toLowerCase().endsWith('.flv') ? 'flv' : 'mpegts',
      isLive: request.kind === 'live', cors: true, url: request.uri }, { enableWorker: true, headers: request.headers,
      autoCleanupSourceBuffer: true, autoCleanupMaxBackwardDuration: 30, autoCleanupMinBackwardDuration: 10 });
    player.on(mpegts.Events.ERROR, (type, detail, info) => { if (!signal.aborted) failure(mpegtsMediaFailure(type, detail, info?.code)); });
    player.attachMediaElement(video); player.load();
    return Object.assign(() => { player.unload(); player.detachMediaElement(); player.destroy(); clear(); }, { tracks: () => browserTracks(video) });
  }
  video.src = request.uri; return Object.assign(clear, { tracks: () => browserTracks(video) });
}
