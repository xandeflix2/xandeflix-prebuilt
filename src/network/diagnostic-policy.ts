export type NetworkTransport = 'wifi' | 'ethernet' | 'cellular' | 'vpn' | 'other' | 'none' | 'unknown';
export interface NetworkStatus { connected: boolean | null; validated: boolean | null; captive: boolean; transport: NetworkTransport }
export const UNKNOWN_NETWORK: NetworkStatus = { connected: null, validated: null, captive: false, transport: 'unknown' };
export function nativeNetworkStatus(value: unknown): NetworkStatus {
  if (!value || typeof value !== 'object') return UNKNOWN_NETWORK;
  const v = value as Record<string, unknown>;
  if (v.available !== true || typeof v.connected !== 'boolean') return UNKNOWN_NETWORK;
  const transport = ['wifi', 'ethernet', 'cellular', 'vpn', 'other', 'none'].includes(String(v.transport)) ? v.transport as NetworkTransport : 'unknown';
  return { connected: v.connected, validated: v.connected && typeof v.validated === 'boolean' ? v.validated : false, captive: v.captive === true, transport: v.connected ? transport : 'none' };
}
export function describeNetwork(state: NetworkStatus): { label: string; detail: string; tone: 'good' | 'bad' | 'pending' } {
  const label = { wifi: 'Wi-Fi', ethernet: 'Ethernet', cellular: 'Dados móveis', vpn: 'VPN', other: 'Rede', none: 'Sem rede', unknown: 'Rede' }[state.transport];
  if (state.connected === false) return { label: 'Sem rede', detail: 'Sem conexão de rede', tone: 'bad' };
  if (state.connected === null) return { label, detail: 'Não foi possível verificar a rede', tone: 'pending' };
  if (state.captive) return { label, detail: 'A rede exige login para acessar a internet', tone: 'bad' };
  if (state.validated === true) return { label, detail: 'Acesso à internet validado pelo aparelho', tone: 'good' };
  return { label, detail: 'Rede conectada; acesso à internet não confirmado', tone: 'pending' };
}
export interface SourceConnections { active: number; maximum: number }
export function parseSourceConnections(value: unknown): SourceConnections | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const info = (value as Record<string, unknown>).user_info;
  if (!info || typeof info !== 'object' || Array.isArray(info)) return null;
  const row = info as Record<string, unknown>;
  if (String(row.auth) !== '1' || typeof row.status !== 'string' || row.status.toLowerCase() !== 'active') return null;
  const integer = (v: unknown): number | null => {
    if ((typeof v !== 'string' && typeof v !== 'number') || !/^\d{1,6}$/.test(String(v))) return null;
    const n = Number(v); return Number.isSafeInteger(n) ? n : null;
  };
  const active = integer(row.active_cons), maximum = integer(row.max_connections);
  return active === null || maximum === null || maximum < 1 ? null : { active, maximum };
}
export const SPEED_MAX_BYTES = 5_000_000;
export const SPEED_TIMEOUT_MS = 15_000;
const SPEED_ENDPOINT = 'https://speed.cloudflare.com/__down';
export interface InternetMeasurement { downloadMbps: number; responseMs: number; receivedBytes: number; elapsedMs: number; limited: boolean }
function abortError(): Error { return new Error('INTERNET_TEST_CANCELLED'); }
export function awaitWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}
/** Explicit user action only. Public data, bounded stream, no source or account input. */
export async function measureInternet(options: {
  signal: AbortSignal; canRun: () => boolean; fetchImpl: typeof fetch;
  progress?: (bytes: number) => void; now?: () => number; timeoutMs?: number;
}): Promise<InternetMeasurement> {
  const now = options.now || (() => performance.now()), controller = new AbortController();
  let timedOut = false, reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let bytes = 0, responseMs = 0, downloadStarted = 0;
  const started = now();
  const cancel = () => controller.abort();
  const guard = () => { if (options.signal.aborted || controller.signal.aborted || !options.canRun()) throw abortError(); };
  guard(); options.signal.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, Math.min(SPEED_TIMEOUT_MS, Math.max(1, options.timeoutMs ?? SPEED_TIMEOUT_MS)));
  const request = async (size: number): Promise<Response> => {
    guard();
    const pending = options.fetchImpl(SPEED_ENDPOINT + '?bytes=' + size + '&t=' + Math.trunc(now()), {
      signal: controller.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
    });
    void pending.then(r => { if (controller.signal.aborted) void r.body?.cancel().catch(() => {}); }, () => {});
    const response = await awaitWithAbort(pending, controller.signal);
    if (!response.ok || /text\/html|application\/json/i.test(response.headers.get('content-type') || '')) { void response.body?.cancel().catch(() => {}); throw new Error('INTERNET_TEST_HTTP_FAILED'); }
    return response;
  };
  const result = (limited: boolean): InternetMeasurement => ({ downloadMbps: bytes * 8 / Math.max(1, now() - downloadStarted) / 1000, responseMs, receivedBytes: bytes, elapsedMs: now() - started, limited });
  try {
    const latencyStarted = now(), ping = await request(0);
    responseMs = now() - latencyStarted; await ping.body?.cancel();
    const response = await request(SPEED_MAX_BYTES), declared = response.headers.get('content-length');
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) !== SPEED_MAX_BYTES)) { void response.body?.cancel().catch(() => {}); throw new Error('INTERNET_TEST_SIZE_INVALID'); }
    if (!response.body?.getReader) throw new Error('INTERNET_TEST_STREAM_UNAVAILABLE');
    reader = response.body.getReader(); downloadStarted = now(); let lastProgress = -Infinity;
    while (true) {
      guard(); const chunk = await awaitWithAbort(reader.read(), controller.signal); guard();
      if (chunk.done) break;
      if (chunk.value.byteLength > SPEED_MAX_BYTES - bytes) throw new Error('INTERNET_TEST_LIMIT_EXCEEDED');
      bytes += chunk.value.byteLength;
      if (now() - lastProgress >= 250) { options.progress?.(bytes); lastProgress = now(); }
    }
    if (bytes !== SPEED_MAX_BYTES) throw new Error('INTERNET_TEST_INCOMPLETE');
    return result(false);
  } catch (error) {
    if (timedOut && !options.signal.aborted && options.canRun() && bytes >= 16_384 && downloadStarted > 0) return result(true);
    if (timedOut) throw new Error('INTERNET_TEST_TIMEOUT');
    throw error;
  } finally {
    clearTimeout(timeout); options.signal.removeEventListener('abort', cancel); controller.abort();
    try { await reader?.cancel(); } catch { /* Cancellation is best effort after transport closure. */ }
  }
}
