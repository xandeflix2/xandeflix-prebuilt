import type { SourceRuntimeConfig } from '../debug/source/source-runtime-config.ts';
import { fetchDeviceDirectM3uStream } from './device-direct-fetch.ts';

export const DIRECTORY_ROOTS_MODE = 'DIRECTORY_ROOTS_V1';
export const DIRECTORY_JSON_MAX_BYTES = 16 * 1024 * 1024;

const ACTIONS = new Set([
  'get_live_categories', 'get_live_streams', 'get_vod_categories',
  'get_vod_streams', 'get_series_categories', 'get_series',
  'get_series_info', 'get_vod_info',
]);
const PARAMS = new Set(['series_id', 'vod_id', 'category_id']);
const ITEM_ID = /^[1-9]\d{0,18}$/;

/** Derive only an explicit, same-origin provider API; never change the sealed record. */
export function deriveDirectoryRuntimeConfig(config: SourceRuntimeConfig): SourceRuntimeConfig | undefined {
  try {
    const isXtream = config.type === 'XTREAM';
    if (!isXtream && config.type !== 'M3U') return undefined;
    const url = new URL(isXtream ? config.host || '' : config.playlistUrl || '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) return undefined;
    if (!isXtream && !/\/get\.php$/i.test(url.pathname)) return undefined;
    if (!isXtream && (url.searchParams.getAll('username').length !== 1 || url.searchParams.getAll('password').length !== 1)) return undefined;
    const username = isXtream ? config.username : url.searchParams.get('username');
    const password = isXtream ? config.password : url.searchParams.get('password');
    if (!username?.trim() || !password?.trim()) return undefined;
    const basePath = url.pathname.replace(/\/(?:get|player_api)\.php$/i, '').replace(/\/+$/, '');
    // Retain an explicit original playlist only in this transient runtime value,
    // so source-selected Live output remains equivalent without changing storage.
    const playlistUrl = !isXtream ? config.playlistUrl : config.playlistUrl && (() => {
      const playlist = new URL(config.playlistUrl);
      return playlist.origin === url.origin && /\/get\.php$/i.test(playlist.pathname) ? config.playlistUrl : undefined;
    })();
    return { type: 'XTREAM', host: url.origin + basePath, username, password, ...(playlistUrl ? { playlistUrl } : {}) };
  } catch {
    return undefined;
  }
}

function requireDirectoryConfig(config: SourceRuntimeConfig): SourceRuntimeConfig {
  const derived = deriveDirectoryRuntimeConfig(config);
  if (!derived) throw new Error('DIRECTORY_SOURCE_UNSUPPORTED');
  return derived;
}

/** Private runtime URI, consumed only by the existing licensed device-direct player. */
export function buildDirectoryStreamUrl(
  config: SourceRuntimeConfig, kind: 'movie' | 'series' | 'live', id: string, extension: string,
): string {
  const derived = requireDirectoryConfig(config);
  if (!['movie', 'series', 'live'].includes(kind) || !ITEM_ID.test(id) || !/^[a-zA-Z0-9]{1,12}$/.test(extension)) {
    throw new Error('DIRECTORY_STREAM_INVALID');
  }
  return `${derived.host}/${kind}/${encodeURIComponent(derived.username!)}/${encodeURIComponent(derived.password!)}/${id}.${extension}`;
}

/** Bounded, UTF-8-exact JSON delivered directly from the provider, never the Control Plane. */
export async function fetchDirectoryJson(
  config: SourceRuntimeConfig,
  action?: string,
  params?: Record<string, string>,
  requestOptions?: { headers?: Record<string, string>; fetchImpl?: typeof fetch },
): Promise<unknown> {
  const derived = requireDirectoryConfig(config);
  if (action !== undefined && !ACTIONS.has(action)) throw new Error('DIRECTORY_ACTION_INVALID');
  const url = new URL(`${derived.host}/player_api.php`);
  url.searchParams.set('username', derived.username!);
  url.searchParams.set('password', derived.password!);
  if (action) url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(params || {})) {
    if (!PARAMS.has(key) || !ITEM_ID.test(value)) throw new Error('DIRECTORY_ACTION_INVALID');
    url.searchParams.set(key, value);
  }

  const fetched = await fetchDeviceDirectM3uStream(url.href, {
    headers: { Accept: 'application/json', ...requestOptions?.headers },
  }, {
    fetchImpl: requestOptions?.fetchImpl,
    maxSourceFileBytes: DIRECTORY_JSON_MAX_BYTES,
    // Native progressive blocks are raw bytes; decoding isolated UTF-8 strings
    // would corrupt names when an accent spans a transport chunk boundary.
    progressiveDownload: true,
  });
  if (!fetched.success || !fetched.stream) {
    throw new Error(fetched.observation.sanitizedFetchErrorCode === 'RESPONSE_TOO_LARGE'
      ? 'DIRECTORY_JSON_TOO_LARGE' : 'DIRECTORY_JSON_FETCH_FAILED');
  }

  const decoder = new TextDecoder('utf-8', { fatal: true });
  const encoder = new TextEncoder();
  let byteSize = 0;
  const parts: string[] = [];
  try {
    for await (const chunk of fetched.stream.readChunks()) {
      const size = typeof chunk === 'string' ? encoder.encode(chunk).byteLength : chunk.byteLength;
      if (size > DIRECTORY_JSON_MAX_BYTES - byteSize) throw new Error('DIRECTORY_JSON_TOO_LARGE');
      byteSize += size;
      parts.push(typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true }));
    }
    parts.push(decoder.decode());
    if (!byteSize) throw new Error('DIRECTORY_JSON_INVALID');
    try {
      return JSON.parse(parts.join('')) as unknown;
    } catch {
      throw new Error('DIRECTORY_JSON_INVALID');
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (fetched.observation.sanitizedFetchErrorCode === 'RESPONSE_TOO_LARGE') {
      throw new Error('DIRECTORY_JSON_TOO_LARGE');
    }
    throw new Error(code === 'DIRECTORY_JSON_TOO_LARGE' || code === 'DIRECTORY_JSON_INVALID'
      ? code : 'DIRECTORY_JSON_FETCH_FAILED');
  } finally {
    try { await fetched.stream.cleanup(); }
    catch { throw new Error('DIRECTORY_JSON_FETCH_FAILED'); }
  }
}
