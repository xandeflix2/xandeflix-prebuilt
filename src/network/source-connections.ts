import type { SourceRuntimeConfig } from '../debug/source/source-runtime-config.ts';
import { AuthorizedSourceResolver, type ResolvedSourceResult } from '../control-plane/client/authorized-source-resolver.ts';
import { LocalSecureSourceStore, validateLocalSecureSourceRecord, type LocalSecureSourceRecord } from '../security/local-secure-source-store.ts';
import { getClientBootstrapService } from '../bootstrap/client.ts';
import { deriveDirectoryRuntimeConfig } from '../source/source-directory-api.ts';
import { fetchDeviceDirectM3uStream } from '../source/device-direct-fetch.ts';
import { awaitWithAbort, parseSourceConnections, type SourceConnections } from './diagnostic-policy.ts';
const MAX_INFO_BYTES = 64 * 1024;
export async function fetchSourceUserInfo(config: SourceRuntimeConfig, signal: AbortSignal): Promise<unknown> {
  const derived = deriveDirectoryRuntimeConfig(config); if (!derived || signal.aborted) return null;
  const url = new URL(derived.host + '/player_api.php');
  url.searchParams.set('username', derived.username!); url.searchParams.set('password', derived.password!);
  const pending = fetchDeviceDirectM3uStream(url.href, { headers: { Accept: 'application/json' } }, {
    progressiveDownload: true, maxSourceFileBytes: MAX_INFO_BYTES, connectTimeoutMs: 4000, readTimeoutMs: 4000,
  });
  void pending.then(r => { if (signal.aborted && r.stream) void r.stream.cancel().then(() => r.stream!.cleanup()).catch(() => {}); }, () => {});
  const response = await awaitWithAbort(pending, signal); if (!response.success || !response.stream) return null;
  const stream = response.stream, cancel = () => { void stream.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  const decoder = new TextDecoder('utf-8', { fatal: true }), encoder = new TextEncoder(); let bytes = 0, text = '', complete = false;
  try {
    for await (const chunk of stream.readChunks()) {
      if (signal.aborted) return null;
      bytes += typeof chunk === 'string' ? encoder.encode(chunk).byteLength : chunk.byteLength;
      if (bytes > MAX_INFO_BYTES) return null;
      text += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
    }
    text += decoder.decode(); complete = true; return signal.aborted ? null : JSON.parse(text);
  } finally { signal.removeEventListener('abort', cancel); if (!complete || signal.aborted) await stream.cancel().catch(() => {}); await stream.cleanup().catch(() => {}); }
}
interface Pointer { kind?: string; sourceId?: string; sourceVersion?: number; snapshotId?: string }
interface Dependencies {
  resolve(): Promise<ResolvedSourceResult>; local(id: string): Promise<LocalSecureSourceRecord | undefined>;
  pointer(): Promise<Pointer | null | undefined>; fetch(config: SourceRuntimeConfig, signal: AbortSignal): Promise<unknown>;
}
/** Only numerical account metadata escapes this function. Never publish/store source configuration. */
export async function readSourceConnections(signal: AbortSignal, dependencies: Dependencies = {
  resolve: () => AuthorizedSourceResolver.resolve(), local: id => new LocalSecureSourceStore().get(id),
  pointer: () => getClientBootstrapService().getStorage().readActivePointer(), fetch: fetchSourceUserInfo,
}): Promise<SourceConnections | null> {
  try {
    if (signal.aborted) return null;
    const auth = await dependencies.resolve();
    if (signal.aborted || auth.status !== 'SOURCE_READY' || auth.sourceStatus !== 'ACTIVE' || !auth.sourceId || !Number.isSafeInteger(auth.sourceVersion) || Number(auth.sourceVersion) < 1
      || auth.remoteResultCode === 'REMOTE_AUTHORITY_UNAVAILABLE' || auth.remoteAuthorityAvailable === false
      || !['MANAGED', 'SELF_SERVICE'].includes(auth.mode || '') || !['M3U', 'XTREAM'].includes(auth.protocol || '')) return null;
    const first = await dependencies.pointer();
    if (!first || first.kind !== 'REAL' || first.sourceId !== auth.sourceId || first.sourceVersion !== auth.sourceVersion) return null;
    let config = auth.config;
    if (auth.mode === 'MANAGED' || !config) {
      const record = await dependencies.local(auth.sourceId); if (!record || signal.aborted) return null;
      validateLocalSecureSourceRecord(record);
      if (record.sourceId !== auth.sourceId || record.sourceVersion !== auth.sourceVersion || record.protocol !== auth.protocol) return null;
      config = { type: record.protocol, host: record.sourceConfig.endpoint, playlistUrl: record.sourceConfig.playlistUrl, username: record.sourceConfig.username, password: record.sourceConfig.password };
    }
    if (config.type !== auth.protocol || !deriveDirectoryRuntimeConfig(config) || signal.aborted) return null;
    const beforeFetch = await dependencies.pointer();
    if (!beforeFetch || beforeFetch.snapshotId !== first.snapshotId || beforeFetch.sourceId !== first.sourceId || beforeFetch.sourceVersion !== first.sourceVersion || signal.aborted) return null;
    const data = await dependencies.fetch(config, signal), last = await dependencies.pointer();
    if (signal.aborted || !last || last.snapshotId !== first.snapshotId || last.sourceId !== first.sourceId || last.sourceVersion !== first.sourceVersion) return null;
    return parseSourceConnections(data);
  } catch { return null; }
}
