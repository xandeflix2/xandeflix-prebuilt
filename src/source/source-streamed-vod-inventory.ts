import type { SourceRuntimeConfig } from '../debug/source/source-runtime-config.ts';
import { yieldToEventLoop } from '../diagnostics/boot-telemetry.ts';
import { fetchDeviceDirectM3uStream, type FetchDiagnosticsOptions } from './device-direct-fetch.ts';
import { deriveDirectoryRuntimeConfig, DIRECTORY_JSON_MAX_BYTES } from './source-directory-api.ts';

// Nominal exception: the conventional full-buffer JSON reader remains at 16 MiB.
export const STREAMED_VOD_LIMITS = Object.freeze({
  rawBytes: 64 * 1024 * 1024,
  rowBytes: 256 * 1024,
  projectedBytes: 16 * 1024 * 1024,
  rows: 200_000,
  depth: 32,
});

type VodRow = Record<string, string | number | null | string[]>;
type LowerLimits = Partial<Record<keyof typeof STREAMED_VOD_LIMITS, number>>;
export interface StreamedVodInventory {
  rows: VodRow[];
  rawBytes: number;
  projectedBytes: number;
  rawRows: number;
  duplicateRows: number;
  usedProjection: boolean;
}
const FIELDS = new Set(['stream_id', 'name', 'category_id', 'container_extension', 'stream_icon', 'year']);
function fail(code = 'STREAMED_VOD_JSON_INVALID'): never { throw new Error(code); }

/** Validate the entire global array; never accept a prefix as an inventory. */
export async function parseStreamedVodRows(
  chunks: AsyncIterable<Uint8Array | string>, lowerLimits: LowerLimits = {},
): Promise<StreamedVodInventory> {
  const limits = { ...STREAMED_VOD_LIMITS, ...lowerLimits };
  // Tests may tighten limits, but no caller can raise the approved ceilings.
  for (const [key, value] of Object.entries(limits)) {
    if (!Object.hasOwn(STREAMED_VOD_LIMITS, key) || !Number.isSafeInteger(value) || value <= 0
        || value > STREAMED_VOD_LIMITS[key as keyof typeof STREAMED_VOD_LIMITS]) fail('STREAMED_VOD_LIMIT_INVALID');
  }
  const decoder = new TextDecoder('utf-8', { fatal: true }), encoder = new TextEncoder();
  const rows: VodRow[] = [], ids = new Map<string, VodRow>();
  let rawBytes = 0, projectedBytes = 2, row = '', depth = 0, rawRows = 0, duplicateRows = 0;
  let quoted = false, escaped = false, first = true, nextYield = 200;
  const parser = { state: 'START' };

  function finishRow(): void {
    if (encoder.encode(row).byteLength > limits.rowBytes) fail('STREAMED_VOD_ROW_LIMIT');
    let value: Record<string, unknown>;
    try { value = JSON.parse(row); } catch { return fail(); }
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
    const id = value.stream_id;
    if (!['string', 'number'].includes(typeof id) || !/^[1-9]\d{0,18}$/.test(String(id))
        || (typeof id === 'number' && !Number.isSafeInteger(id))
        || typeof value.name !== 'string' || !value.name.trim()) fail('STREAMED_VOD_ROW_INVALID');
    if (++rawRows > limits.rows) fail('STREAMED_VOD_COUNT_LIMIT');
    const projected: VodRow = {};
    for (const [key, item] of Object.entries(value)) {
      if (!FIELDS.has(key)) continue;
      if (!(typeof item === 'string' || typeof item === 'number' || item === null)
          || (typeof item === 'number' && !Number.isFinite(item))) fail('STREAMED_VOD_ROW_INVALID');
      projected[key] = item;
    }
    const previous = ids.get(String(id));
    if (previous) {
      // Same provider film, possibly multiple categories. Reject content conflicts.
      for (const key of ['name', 'container_extension', 'stream_icon', 'year']) {
        if (previous[key] !== projected[key]) fail('STREAMED_VOD_ROW_INVALID');
      }
      if (previous.category_id !== projected.category_id) {
        const oldCategory = String(previous.category_id), newCategory = String(projected.category_id);
        if (!/^\d{1,19}$/.test(oldCategory) || !/^\d{1,19}$/.test(newCategory)) fail('STREAMED_VOD_ROW_INVALID');
        const memberships = Array.isArray(previous.__directoryCategoryIds)
          ? previous.__directoryCategoryIds : [oldCategory];
        if (!memberships.includes(newCategory)) {
          if (memberships.length >= 512) fail('STREAMED_VOD_ROW_INVALID');
          const next = { ...previous, __directoryCategoryIds: [...memberships, newCategory] };
          const extra = encoder.encode(JSON.stringify(next)).byteLength - encoder.encode(JSON.stringify(previous)).byteLength;
          if (extra > limits.projectedBytes - projectedBytes) fail('STREAMED_VOD_PROJECTED_LIMIT');
          projectedBytes += extra;
          previous.__directoryCategoryIds = next.__directoryCategoryIds;
        }
      }
      duplicateRows++;
      row = '';
      parser.state = 'AFTER_ROW';
      return;
    }
    const projectedJson = JSON.stringify(projected);
    const size = encoder.encode(projectedJson).byteLength + 1;
    if (size > limits.projectedBytes - projectedBytes) fail('STREAMED_VOD_PROJECTED_LIMIT');
    projectedBytes += size;
    // Detach retained fields from the raw row's potentially much larger backing.
    const retained = JSON.parse(projectedJson) as VodRow;
    rows.push(retained);
    ids.set(String(id), retained);
    row = '';
    parser.state = 'AFTER_ROW';
  }

  function consume(text: string): void {
    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      if (first) { first = false; if (char === '\uFEFF') continue; }
      if (parser.state === 'ROW') {
        row += char;
        if (row.length > limits.rowBytes) fail('STREAMED_VOD_ROW_LIMIT');
        if (quoted) {
          if (escaped) escaped = false;
          else if (char === '\\') escaped = true;
          else if (char === '"') quoted = false;
        } else if (char === '"') quoted = true;
        else if (char === '{' || char === '[') {
          if (++depth > limits.depth) fail('STREAMED_VOD_DEPTH_LIMIT');
        } else if (char === '}' || char === ']') {
          if (--depth < 0) fail();
          if (depth === 0) finishRow();
        }
        continue;
      }
      if (char === ' ' || char === '\r' || char === '\n' || char === '\t') continue;
      if (parser.state === 'START') {
        if (char !== '[') fail();
        parser.state = 'FIRST_ROW';
      } else if (parser.state === 'FIRST_ROW' || parser.state === 'NEXT_ROW') {
        if (char === ']' && parser.state === 'FIRST_ROW') { parser.state = 'END'; continue; }
        if (char !== '{') fail();
        parser.state = 'ROW'; row = '{'; depth = 1; quoted = false; escaped = false;
      } else if (parser.state === 'AFTER_ROW') {
        if (char === ',') parser.state = 'NEXT_ROW';
        else if (char === ']') parser.state = 'END';
        else fail();
      } else fail();
    }
  }

  try {
    for await (const chunk of chunks) {
      const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
      if (bytes.byteLength > limits.rawBytes - rawBytes) fail('STREAMED_VOD_RAW_LIMIT');
      rawBytes += bytes.byteLength;
      // Decode fixed windows, including when a test/browser yields a large chunk.
      for (let offset = 0; offset < bytes.byteLength; offset += 32768) {
        consume(decoder.decode(bytes.subarray(offset, offset + 32768), { stream: true }));
        if (rows.length >= nextYield) {
          await yieldToEventLoop();
          nextYield = rows.length + 200;
        }
      }
    }
    consume(decoder.decode());
  } catch (error) {
    if (error instanceof Error && /^STREAMED_VOD_[A-Z_]+$/.test(error.message)) throw error;
    return fail();
  }
  if (parser.state !== 'END') fail();
  return { rows, rawBytes, projectedBytes, rawRows, duplicateRows, usedProjection: true };
}

/** Preserve small JSON exactly; switch to row projection inside the same stream. */
async function readCompleteVodInventory(chunks: AsyncIterable<Uint8Array | string>): Promise<StreamedVodInventory> {
  const iterator = chunks[Symbol.asyncIterator](), encoder = new TextEncoder();
  let buffer = new Uint8Array(65536), size = 0;
  try {
    while (true) {
      const next = await iterator.next();
      if (next.done) break;
      const bytes = typeof next.value === 'string' ? encoder.encode(next.value) : next.value;
      if (bytes.byteLength > DIRECTORY_JSON_MAX_BYTES - size) {
        const prefix = buffer.subarray(0, size);
        async function* completeStream(): AsyncIterable<Uint8Array | string> {
          yield prefix;
          yield bytes;
          while (true) {
            const remaining = await iterator.next();
            if (remaining.done) break;
            yield remaining.value;
          }
        }
        return await parseStreamedVodRows(completeStream());
      }
      const required = size + bytes.byteLength;
      if (required > buffer.byteLength) {
        const grown = new Uint8Array(Math.min(DIRECTORY_JSON_MAX_BYTES, Math.max(required, buffer.byteLength * 2)));
        grown.set(buffer.subarray(0, size)); buffer = grown;
      }
      buffer.set(bytes, size); size = required;
    }
    let value: unknown;
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, size)).replace(/^\uFEFF/, '')); }
    catch { return fail(); }
    if (!Array.isArray(value)) fail();
    if (value.length > STREAMED_VOD_LIMITS.rows) fail('STREAMED_VOD_COUNT_LIMIT');
    return { rows: value, rawBytes: size, projectedBytes: size, rawRows: value.length, duplicateRows: 0, usedProjection: false };
  } finally { await iterator.return?.(); }
}

/** Same-origin fixed global action; no repeated oversized download. */
export async function fetchStreamedVodInventory(
  config: SourceRuntimeConfig,
  options: { headers?: Record<string, string>; fetchImpl?: typeof fetch; nativeTransport?: FetchDiagnosticsOptions['nativeTransport'] } = {},
): Promise<StreamedVodInventory> {
  const derived = deriveDirectoryRuntimeConfig(config);
  if (!derived) fail('STREAMED_VOD_SOURCE_UNSUPPORTED');
  const url = new URL(`${derived.host}/player_api.php`);
  url.searchParams.set('username', derived.username!);
  url.searchParams.set('password', derived.password!);
  url.searchParams.set('action', 'get_vod_streams');
  const streamFetch: typeof fetch = async (...args) => {
    const response = await (options.fetchImpl || fetch)(...args);
    if (response.ok && !response.body) fail('STREAMED_VOD_STREAM_REQUIRED');
    return response;
  };
  const fetched = await fetchDeviceDirectM3uStream(url.href, {
    headers: { Accept: 'application/json', ...options.headers },
  }, { fetchImpl: streamFetch, nativeTransport: options.nativeTransport,
    maxSourceFileBytes: STREAMED_VOD_LIMITS.rawBytes, progressiveDownload: true });
  if (!fetched.success || !fetched.stream) {
    fail(fetched.observation.sanitizedFetchErrorCode === 'RESPONSE_TOO_LARGE'
      ? 'STREAMED_VOD_RAW_LIMIT' : 'STREAMED_VOD_FETCH_FAILED');
  }
  let result: StreamedVodInventory | undefined, failure: Error | undefined;
  try {
    result = await readCompleteVodInventory(fetched.stream.readChunks());
    if (!fetched.observation.transportSuccess) fail('STREAMED_VOD_FETCH_FAILED');
  } catch (error) {
    failure = new Error(fetched.observation.sanitizedFetchErrorCode === 'RESPONSE_TOO_LARGE' ? 'STREAMED_VOD_RAW_LIMIT'
      : !fetched.observation.transportSuccess && fetched.observation.sanitizedFetchErrorCode ? 'STREAMED_VOD_FETCH_FAILED'
      : error instanceof Error && /^STREAMED_VOD_[A-Z_]+$/.test(error.message) ? error.message : 'STREAMED_VOD_FETCH_FAILED');
  } finally {
    const alreadyFailed = !fetched.observation.transportSuccess;
    try {
      await fetched.stream.cleanup();
      if (!alreadyFailed && !fetched.observation.transportSuccess && !failure) failure = new Error('STREAMED_VOD_CLEANUP_FAILED');
    } catch { if (!failure) failure = new Error('STREAMED_VOD_CLEANUP_FAILED'); }
  }
  if (failure) throw failure;
  if (!result) return fail('STREAMED_VOD_FETCH_FAILED');
  return result;
}
