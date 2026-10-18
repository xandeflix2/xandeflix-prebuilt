import { isWebValidation } from './validation.ts';

const stages = ['VALIDATION', 'HTML_MEDIA', 'HLS', 'MPEGTS', 'PLAY', 'LOAD'] as const;
const codes = ['HTTPS_REQUIRED', 'HEADERS_UNSUPPORTED', 'UNSUPPORTED', 'NETWORK', 'TIMEOUT', 'HTTP_ERROR',
  'DECODE', 'CODEC_UNSUPPORTED', 'FORMAT', 'BUFFER', 'ABORTED', 'PLAY_REJECTED', 'UNKNOWN'] as const;
export interface WebMediaFailure {
  stage: typeof stages[number];
  code: typeof codes[number];
  httpStatus?: number;
  mediaCode?: number;
}
type Kind = 'movie' | 'series' | 'live';
type State = 'STARTING' | 'PLAYING' | 'AUTOPLAY_BLOCKED' | 'FAILED';
interface Observation {
  attempt: number; kind: Kind; state: State; protocol: 'HTTP' | 'HTTPS' | 'OTHER';
  format: 'HLS' | 'MPEGTS' | 'FLV' | 'MP4' | 'MKV' | 'WEBM' | 'OTHER';
  stage: WebMediaFailure['stage']; code: WebMediaFailure['code'] | 'NONE'; httpStatus: number; mediaCode: number;
}
const observations = new Map<Kind, Observation>();
let sequence = 0;
let detailsSequence = 0;
let details = { state: 'NOT_OBSERVED', code: 'NONE' };
const status = (value: unknown) => Number.isInteger(value) && Number(value) >= 100 && Number(value) <= 599 ? Number(value) : 0;
const formats: Record<string, Observation['format']> = { m3u8: 'HLS', ts: 'MPEGTS', m2ts: 'MPEGTS', flv: 'FLV', mp4: 'MP4', mkv: 'MKV', webm: 'WEBM' };

/** Only primitive allowlisted diagnostics are retained, never the input request/error. */
export function beginWebPlayback(request: { uri: string; kind?: string }): number {
  if (!isWebValidation()) return 0;
  const kind: Kind = request.kind === 'live' ? 'live' : request.kind === 'series' ? 'series' : 'movie';
  let protocol: Observation['protocol'] = 'OTHER', format: Observation['format'] = 'OTHER';
  try {
    const url = new URL(request.uri), extension = url.pathname.toLowerCase().split('.').at(-1);
    protocol = url.protocol === 'https:' ? 'HTTPS' : url.protocol === 'http:' ? 'HTTP' : 'OTHER';
    format = Object.hasOwn(formats, extension || '') ? formats[extension!] : 'OTHER';
  } catch { /* Malformed addresses are recorded only as OTHER. */ }
  const attempt = ++sequence;
  observations.set(kind, { attempt, kind, state: 'STARTING', protocol, format, stage: 'VALIDATION', code: 'NONE', httpStatus: 0, mediaCode: 0 });
  return attempt;
}

export function markWebPlayback(attempt: number, state: State, failure?: WebMediaFailure): void {
  if (!isWebValidation() || !attempt) return;
  if (!['STARTING', 'PLAYING', 'AUTOPLAY_BLOCKED', 'FAILED'].includes(state)) return;
  const row = [...observations.values()].find(value => value.attempt === attempt);
  if (!row || row.state === 'FAILED') return;
  row.state = state;
  if (failure) {
    row.stage = stages.includes(failure.stage) ? failure.stage : 'LOAD';
    row.code = codes.includes(failure.code) ? failure.code : 'UNKNOWN';
    row.httpStatus = status(failure.httpStatus);
    row.mediaCode = Number.isInteger(failure.mediaCode) && Number(failure.mediaCode) >= 1 && Number(failure.mediaCode) <= 4 ? Number(failure.mediaCode) : 0;
  }
  if (state === 'FAILED') {
    try { console.info('XANDEFLIX_WEB_PLAYBACK_DIAGNOSTIC_V1\n' + lines(row).join('\n')); } catch { /* Observation cannot interrupt cleanup. */ }
  }
}

function lines(row: Observation): string[] {
  const prefix = 'WEB_' + row.kind.toUpperCase() + '_';
  return [`${prefix}PLAYBACK_STATE=${row.state}`, `${prefix}PROTOCOL=${row.protocol}`, `${prefix}FORMAT=${row.format}`,
    `${prefix}FAILURE_STAGE=${row.stage}`, `${prefix}FAILURE_CODE=${row.code}`, `${prefix}HTTP_STATUS=${row.httpStatus}`, `${prefix}MEDIA_ERROR=${row.mediaCode}`];
}
export function webPlaybackDiagnosticLines(): string[] {
  if (!isWebValidation()) return [];
  return (['movie', 'series', 'live'] as const).flatMap(kind => {
    const row = observations.get(kind);
    return row ? lines(row) : ['WEB_' + kind.toUpperCase() + '_PLAYBACK_STATE=NOT_OBSERVED'];
  }).concat('WEB_SERIES_DETAILS_STATE=' + details.state, 'WEB_SERIES_DETAILS_CODE=' + details.code);
}

/** Observe only the UI request; authorization, validation, value and rejection stay unchanged. */
export function observeWebSeriesDetails<T>(operation: () => Promise<T>): Promise<T> {
  if (!isWebValidation()) return operation();
  const attempt = ++detailsSequence;
  details = { state: 'LOADING', code: 'NONE' };
  const failed = (error: unknown): never => {
    if (attempt === detailsSequence) {
      const allowed = ['DIRECTORY_SERIES_ID_INVALID', 'DIRECTORY_SERIES_DETAILS_INVALID', 'DIRECTORY_SERIES_NOT_FOUND',
        'DIRECTORY_DETAILS_BUSY', 'DIRECTORY_DETAILS_LIMIT_EXCEEDED', 'DIRECTORY_GENERATION_CHANGED',
        'DIRECTORY_SOURCE_NOT_AUTHORIZED', 'DIRECTORY_SOURCE_CONFIGURATION_MISMATCH', 'DIRECTORY_SOURCE_UNSUPPORTED',
        'DIRECTORY_AUTHORIZATION_UNAVAILABLE', 'DIRECTORY_JSON_TOO_LARGE', 'DIRECTORY_JSON_INVALID', 'DIRECTORY_JSON_FETCH_FAILED'];
      const value = (error as { message?: unknown } | null)?.message;
      details = { state: 'FAILED', code: typeof value === 'string' && allowed.includes(value) ? value : 'UNKNOWN' };
      try { console.info('XANDEFLIX_WEB_SERIES_DETAILS_DIAGNOSTIC_V1\nWEB_SERIES_DETAILS_STATE=FAILED\nWEB_SERIES_DETAILS_CODE=' + details.code); } catch { /* Observation only. */ }
    }
    throw error;
  };
  let request: Promise<T>;
  try { request = operation(); } catch (error) { request = Promise.reject(error); }
  return request.then(value => { if (attempt === detailsSequence) details = { state: 'READY', code: 'NONE' }; return value; }, failed);
}

export function htmlMediaFailure(code: unknown): WebMediaFailure {
  const mediaCode = Number.isInteger(code) && Number(code) >= 1 && Number(code) <= 4 ? Number(code) : 0;
  const mediaCodes: Record<number, WebMediaFailure['code']> = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'UNSUPPORTED' };
  return { stage: 'HTML_MEDIA', code: mediaCodes[mediaCode] || 'UNKNOWN', mediaCode };
}
export function webMediaException(error: unknown, stage: WebMediaFailure['stage'] = 'LOAD'): WebMediaFailure {
  const value = error as { message?: unknown; name?: unknown } | null;
  const code = value?.message === 'WEB_MEDIA_HTTPS_REQUIRED' ? 'HTTPS_REQUIRED'
    : value?.message === 'WEB_MEDIA_HEADERS_UNSUPPORTED' ? 'HEADERS_UNSUPPORTED'
    : value?.message === 'WEB_MEDIA_UNSUPPORTED' || value?.name === 'NotSupportedError' ? 'UNSUPPORTED'
    : stage === 'PLAY' ? 'PLAY_REJECTED' : 'UNKNOWN';
  return { stage, code };
}
export function hlsMediaFailure(type: unknown, detail: unknown, httpStatus?: unknown): WebMediaFailure {
  const code = status(httpStatus) >= 400 ? 'HTTP_ERROR'
    : typeof detail === 'string' && ['manifestLoadTimeOut', 'levelLoadTimeOut', 'fragLoadTimeOut', 'keyLoadTimeOut', 'audioTrackLoadTimeOut'].includes(detail) ? 'TIMEOUT'
    : detail === 'manifestIncompatibleCodecsError' || detail === 'bufferIncompatibleCodecsError' ? 'CODEC_UNSUPPORTED'
    : detail === 'manifestParsingError' || type === 'muxError' ? 'FORMAT'
    : type === 'networkError' ? 'NETWORK' : type === 'mediaError' ? 'BUFFER' : 'UNKNOWN';
  return { stage: 'HLS', code, httpStatus: status(httpStatus) };
}
export function mpegtsMediaFailure(type: unknown, detail: unknown, httpStatus?: unknown): WebMediaFailure {
  const code = status(httpStatus) >= 400 ? 'HTTP_ERROR' : detail === 'ConnectingTimeout' ? 'TIMEOUT'
    : detail === 'CodecUnsupported' ? 'CODEC_UNSUPPORTED'
    : detail === 'FormatError' || detail === 'FormatUnsupported' ? 'FORMAT'
    : type === 'NetworkError' ? 'NETWORK' : type === 'MediaError' ? 'BUFFER' : 'UNKNOWN';
  return { stage: 'MPEGTS', code, httpStatus: status(httpStatus) };
}
