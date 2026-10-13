import type { NativePlayerResumeEvent } from './native-android-player.bridge.ts';
import { CAST_FAILURE_CODES } from './cast-failure.ts';

const ERROR_CODES = ['NATIVE_ERROR', 'INVALID_REQUEST', 'PLAYER_ACTIVITY_UNAVAILABLE', 'PREVIEW_UNAVAILABLE', ...CAST_FAILURE_CODES];
const CATEGORIES = ['HTTP_ERROR', 'NETWORK_TIMEOUT', 'DECODER_ERROR', 'SOURCE_UNAVAILABLE', 'MEDIA_PARSER_FAILURE', 'MEDIA_ERROR', 'UNKNOWN'];
const PAGES = ['home', 'movies', 'series', 'live', 'search', 'movie-detail', 'series-detail'];
const REPORT_HEADER = 'XANDEFLIX_PLAYBACK_DIAGNOSTIC_V1';

export const PLAYBACK_DIAGNOSTIC_FIELDS = ['PACKAGE', 'APP_VERSION', 'BUNDLE', 'UTC', 'PAGE', 'ERROR_CODE',
  'ERROR_CATEGORY', 'HTTP_STATUS', 'MEDIA3_ERROR_CODE', 'CHECKPOINT', 'ANDROID', 'WEBVIEW_CHROME'] as const;
export type PlaybackDiagnostic = Record<typeof PLAYBACK_DIAGNOSTIC_FIELDS[number], string>;

/** Reject arbitrary text/extra fields before it crosses the control-plane boundary. */
export function parsePlaybackDiagnostic(value: unknown): PlaybackDiagnostic | null {
  if (typeof value !== 'string' || value.length > 1400) return null;
  const lines = value.split('\n');
  if (lines.shift() !== REPORT_HEADER || lines.length !== PLAYBACK_DIAGNOSTIC_FIELDS.length) return null;
  const result: Record<string, string> = {};
  for (const line of lines) {
    const separator = line.indexOf('=');
    const key = line.slice(0, separator), field = line.slice(separator + 1);
    if (separator < 1 || !PLAYBACK_DIAGNOSTIC_FIELDS.some(allowed => allowed === key) || key in result) return null;
    result[key] = field;
  }
  if (result.PACKAGE !== 'com.xandeflix.prebuilt' || result.APP_VERSION !== '1.0'
    || !/^(UNKNOWN|index-[A-Za-z0-9_-]{6,64}\.js)$/.test(result.BUNDLE)
    || !(result.UTC === 'UNKNOWN' || (/^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(result.UTC)
      && Number.isFinite(Date.parse(result.UTC)) && new Date(result.UTC).toISOString() === result.UTC))
    || ![...PAGES, 'UNKNOWN'].includes(result.PAGE) || ![...ERROR_CODES, 'UNKNOWN'].includes(result.ERROR_CODE)
    || !CATEGORIES.includes(result.ERROR_CATEGORY) || !/^(UNAVAILABLE|[45][0-9]{2})$/.test(result.HTTP_STATUS)
    || !(result.MEDIA3_ERROR_CODE === 'UNAVAILABLE' || (/^[1-9][0-9]{3,9}$/.test(result.MEDIA3_ERROR_CODE)
      && Number(result.MEDIA3_ERROR_CODE) <= 2147483647))
    || !['UNKNOWN', 'NATIVE_ACTIVITY_STARTED', 'DATASOURCE_OPEN', 'FIRST_FRAME', 'PLAYER_READY'].includes(result.CHECKPOINT)
    || !/^(UNKNOWN|[0-9]{1,2}(\.[0-9]{1,2}){0,2})$/.test(result.ANDROID)
    || !/^(UNKNOWN|[0-9]{1,3}(\.[0-9]{1,5}){0,3})$/.test(result.WEBVIEW_CHROME)) return null;
  return result as PlaybackDiagnostic;
}

export function formatPlaybackDiagnostic(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const fields = value as Record<string, unknown>;
  if (Object.keys(fields).length !== PLAYBACK_DIAGNOSTIC_FIELDS.length
    || PLAYBACK_DIAGNOSTIC_FIELDS.some(key => typeof fields[key] !== 'string')) return null;
  const text = [REPORT_HEADER, ...PLAYBACK_DIAGNOSTIC_FIELDS.map(key => `${key}=${fields[key]}`)].join('\n');
  return parsePlaybackDiagnostic(text) ? text : null;
}

interface DiagnosticContext {
  page?: unknown;
  userAgent?: unknown;
  bundle?: unknown;
  observedAtMs?: number;
}

const known = (value: unknown, values: string[]): string =>
  typeof value === 'string' && values.includes(value) ? value : 'UNKNOWN';

/** A closed projection: never serialize the native event, route or user agent. */
export function createPlaybackSupportDiagnostic(event: NativePlayerResumeEvent, context: DiagnosticContext = {}): string | null {
  if (typeof event.errorCode !== 'string' || !event.errorCode.trim()) return null;
  const category = known(event.errorCategory, CATEGORIES);
  const status = event.httpStatus;
  const http = category === 'HTTP_ERROR' && typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599
    ? String(status) : 'UNAVAILABLE';
  const ua = typeof context.userAgent === 'string' ? context.userAgent.slice(0, 2048) : '';
  const android = ua.match(/\bAndroid ([0-9]{1,2}(?:\.[0-9]{1,2}){0,2})(?:[; )])/i)?.[1] || 'UNKNOWN';
  const webView = ua.match(/\bChrome\/([0-9]{1,3}(?:\.[0-9]{1,5}){0,3})(?:[ )])/i)?.[1] || 'UNKNOWN';
  const bundle = typeof context.bundle === 'string' && /^index-[A-Za-z0-9_-]{6,64}\.js$/.test(context.bundle) ? context.bundle : 'UNKNOWN';
  const time = context.observedAtMs ?? Date.now();
  const timestamp = Number.isFinite(time) && time >= 946684800000 && time < 4102444800000 ? new Date(time).toISOString() : 'UNKNOWN';
  const media3 = typeof event.media3ErrorCode === 'number' && Number.isInteger(event.media3ErrorCode) && event.media3ErrorCode >= 1000 && event.media3ErrorCode <= 2147483647
    ? String(event.media3ErrorCode) : 'UNAVAILABLE';
  return [REPORT_HEADER, 'PACKAGE=com.xandeflix.prebuilt', 'APP_VERSION=1.0', `BUNDLE=${bundle}`, `UTC=${timestamp}`,
    `PAGE=${known(context.page, PAGES)}`, `ERROR_CODE=${known(event.errorCode, ERROR_CODES)}`, `ERROR_CATEGORY=${category}`,
    `HTTP_STATUS=${http}`, `MEDIA3_ERROR_CODE=${media3}`, `CHECKPOINT=${known(event.checkpoint, ['NATIVE_ACTIVITY_STARTED', 'DATASOURCE_OPEN', 'FIRST_FRAME', 'PLAYER_READY'])}`,
    `ANDROID=${android}`, `WEBVIEW_CHROME=${webView}`].join('\n');
}

export function capturePlaybackSupportDiagnostic(event: NativePlayerResumeEvent, page: unknown): string | null {
  const bundle = typeof document === 'undefined' ? undefined : Array.from(document.scripts)
    .map(script => script.src.match(/\/(index-[A-Za-z0-9_-]{6,64}\.js)(?:[?#]|$)/)?.[1]).find(Boolean);
  return createPlaybackSupportDiagnostic(event, { page, bundle, userAgent: typeof navigator === 'undefined' ? undefined : navigator.userAgent });
}

/** Only a published phone number and our bounded report can enter this public URL. */
export function whatsappPlaybackSupportUrl(diagnostic: string, whatsapp?: string): string {
  const number = typeof whatsapp === 'string' && /^[1-9][0-9]{7,14}$/.test(whatsapp) ? whatsapp : '';
  const report = diagnostic.startsWith(`${REPORT_HEADER}\n`) && diagnostic.length <= 1400 ? diagnostic : REPORT_HEADER;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Olá! Preciso de ajuda com um erro de reprodução no Xandeflix.\n\n${report}`)}`;
}
