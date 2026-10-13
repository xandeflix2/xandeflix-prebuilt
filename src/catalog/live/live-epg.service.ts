import type { LiveChannel } from './live-tv.types.ts';
import { AuthorizedRuntimeSourceContextProvider, type RuntimeSourceContextProvider } from '../../playback/runtime-source-context-provider.ts';
import type { RuntimeSourceContext } from '../../playback/source-runtime-context.ts';
import { LocalSecureSourceStore, validateLocalSecureSourceRecord } from '../../security/local-secure-source-store.ts';

export interface LiveEpgProgram {
  id: string;
  title: string;
  description: string;
  start: number;
  end: number;
}
export type LiveEpgResult =
  | { status: 'ready'; programs: LiveEpgProgram[] }
  | { status: 'unavailable'; reason: 'empty' | 'unsupported' | 'unauthorized' }
  | { status: 'error' };

const MAX_BYTES = 256 * 1024;
const MAX_PROGRAMS = 12;

function epgText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  let text = value.slice(0, max * 4).trim();
  if (text.length >= 8 && text.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(text)) {
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(text), c => c.charCodeAt(0)));
      if (!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(decoded)) text = decoded;
    } catch { /* A fonte também pode enviar texto simples. */ }
  }
  return text.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

/** Timestamps absolutos da fonte: nunca adivinhar o fuso de strings sem offset. */
export function normalizeLiveEpg(payload: unknown, now = Date.now()): LiveEpgProgram[] {
  const rows = Array.isArray(payload) ? payload : (payload as { epg_listings?: unknown } | null)?.epg_listings;
  if (!Array.isArray(rows)) return [];
  const result: LiveEpgProgram[] = [], seen = new Set<string>();
  for (const row of rows.slice(0, 128)) {
    if (!row || typeof row !== 'object') continue;
    const startSeconds = Number(row.start_timestamp), endSeconds = Number(row.stop_timestamp);
    const start = startSeconds * 1000, end = endSeconds * 1000;
    const title = epgText(row.title, 180);
    if (!title || !Number.isFinite(start) || !Number.isFinite(end) || start < 946684800000 || end <= start || end <= now || end - start > 7 * 86400000) continue;
    const id = `${start}:${end}:${title}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push({ id, title, description: epgText(row.description, 1600), start, end });
  }
  return result.sort((a, b) => a.start - b.start).slice(0, MAX_PROGRAMS);
}

function apiBase(base: string): URL {
  const url = new URL(base);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error('EPG_SOURCE_INVALID');
  url.search = ''; url.hash = '';
  url.pathname = url.pathname.replace(/\/(?:get|player_api)\.php\/?$/i, '').replace(/\/+$/, '') + '/player_api.php';
  return url;
}

function sourceStreamId(channel: LiveChannel, api: URL, username: string, password: string, requireDirect: boolean): string | undefined {
  const direct = channel.streamRef.directStreamUrl;
  if (direct) {
    try {
      const stream = new URL(direct), parts = stream.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      const id = parts.at(-1)?.match(/^(\d+)(?:\.(?:ts|m3u8))?$/i)?.[1];
      // get.php pode entregar CDN e IDs sem extensão; a conta deve coincidir.
      // A API continua exclusivamente no endpoint seguro provisionado.
      if (!/^https?:$/.test(stream.protocol) || (!requireDirect && stream.origin !== api.origin) || !id || parts.at(-3) !== username || parts.at(-2) !== password) return undefined;
      return id;
    } catch { return undefined; }
  }
  const id = channel.streamRef.sourceItemId;
  return !requireDirect && /^\d+$/.test(id) ? id : undefined;
}

async function boundedJson(url: URL, headers: Record<string, string> | undefined, signal: AbortSignal, fetchImpl: typeof fetch): Promise<unknown> {
  const response = await fetchImpl(url.href, { headers: { ...headers, Accept: 'application/json' }, signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok || Number(response.headers.get('content-length')) > MAX_BYTES) {
    await response.body?.cancel();
    throw new Error('EPG_RESPONSE_INVALID');
  }
  if (!response.body?.getReader) {
    const text = await response.text();
    if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('EPG_RESPONSE_TOO_LARGE');
    return JSON.parse(text);
  }
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      if (signal.aborted) throw new Error('EPG_CANCELLED');
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('EPG_RESPONSE_TOO_LARGE');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder().decode(bytes));
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}

/** Device → fonte autorizada; sem storage, logs, catálogo remoto ou sessão extra. */
export class LiveEpgService {
  constructor(private readonly dependencies: {
    provider?: RuntimeSourceContextProvider;
    store?: Pick<LocalSecureSourceStore, 'get'>;
    fetchImpl?: typeof fetch;
  } = {}) {}

  async load(channel: LiveChannel, signal: AbortSignal): Promise<LiveEpgResult> {
    const controller = new AbortController();
    let rejectAbort: () => void = () => undefined;
    const stopped = new Promise<never>((_, reject) => { rejectAbort = () => { controller.abort(); reject(new Error('EPG_CANCELLED')); }; });
    signal.addEventListener('abort', rejectAbort, { once: true });
    const timer = setTimeout(rejectAbort, 8000);
    if (signal.aborted) rejectAbort();
    const provider = this.dependencies.provider ?? new AuthorizedRuntimeSourceContextProvider();
    try {
      return await Promise.race([stopped, this.loadAuthorized(channel, controller.signal, provider)]);
    } catch { return { status: 'error' }; }
    finally { clearTimeout(timer); signal.removeEventListener('abort', rejectAbort); provider.invalidate(); }
  }

  private async loadAuthorized(channel: LiveChannel, signal: AbortSignal, provider: RuntimeSourceContextProvider): Promise<LiveEpgResult> {
    const context = await provider.resolve({ forceRefresh: true });
    if (signal.aborted) return { status: 'error' };
    if (!context || context.sourceStatus !== 'ACTIVE' || !context.sourceVersion || (context.expiresAt && context.expiresAt <= Date.now())) return { status: 'unavailable', reason: 'unauthorized' };
    const account = await this.resolveAccount(context);
    if (signal.aborted) return { status: 'error' };
    if (!account) return { status: 'unavailable', reason: 'unsupported' };
    const { api, username, password, requireDirect } = account;
    const id = sourceStreamId(channel, api, username, password, requireDirect);
    if (!id) return { status: 'unavailable', reason: 'unsupported' };
    api.searchParams.set('username', username); api.searchParams.set('password', password);
    api.searchParams.set('action', 'get_short_epg'); api.searchParams.set('stream_id', id); api.searchParams.set('limit', String(MAX_PROGRAMS));
    const payload = await boundedJson(api, context.headers, signal, this.dependencies.fetchImpl ?? fetch);
    if (signal.aborted) return { status: 'error' };
    const programs = normalizeLiveEpg(payload);
    return programs.length ? { status: 'ready', programs } : { status: 'unavailable', reason: 'empty' };
  }

  private async resolveAccount(context: RuntimeSourceContext): Promise<{ api: URL; username: string; password: string; requireDirect: boolean } | undefined> {
    if (context.protocol === 'XTREAM' && context.sessionMaterial?.username && context.sessionMaterial.password) {
      return { api: apiBase(context.baseUrl), username: context.sessionMaterial.username, password: context.sessionMaterial.password, requireDirect: false };
    }
    if (context.protocol !== 'M3U') return undefined;
    const record = await (this.dependencies.store ?? new LocalSecureSourceStore()).get(context.sourceId);
    if (!record) return undefined;
    validateLocalSecureSourceRecord(record);
    if (record.sourceId !== context.sourceId || record.sourceVersion !== context.sourceVersion || record.protocol !== 'M3U' || !record.sourceConfig.playlistUrl) return undefined;
    const playlist = new URL(record.sourceConfig.playlistUrl);
    if (!/\/get\.php$/i.test(playlist.pathname) || playlist.origin !== new URL(context.baseUrl).origin) return undefined;
    const username = playlist.searchParams.get('username'), password = playlist.searchParams.get('password');
    return username && password ? { api: apiBase(playlist.href), username, password, requireDirect: true } : undefined;
  }
}

export const liveEpgService = new LiveEpgService();
