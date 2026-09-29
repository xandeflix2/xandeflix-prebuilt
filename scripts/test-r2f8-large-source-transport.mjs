import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { iterateUtf8Lines } from '../src/source/m3u-line-stream.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FETCH_SOURCE = fs.readFileSync(path.join(ROOT, 'src/source/device-direct-fetch.ts'), 'utf8');
const IMPORTER_SOURCE = fs.readFileSync(path.join(ROOT, 'src/source/real-source-importer.service.ts'), 'utf8');
const BRIDGE_SOURCE = fs.readFileSync(path.join(ROOT, 'src/source/large-source-transport.bridge.ts'), 'utf8');
const NATIVE_SOURCE = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/xandeflix/prebuilt/source/LargeSourceTransportPlugin.java'), 'utf8');

let total = 0;
let passed = 0;

async function test(name, fn) {
  total += 1;
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

function syntheticUrl() {
  return 'https://large-source.synthetic.invalid/playlist.m3u';
}

function m3uRecordLines() {
  return [
    '#EXTM3U',
    '#EXTINF:-1 tvg-logo="https://assets.synthetic.invalid/movie.png" group-title="Filmes",Filme Unicode Ã‰lite',
    'https://stream.synthetic.invalid/movie/1.mp4',
    '#EXTINF:-1 tvg-logo="https://assets.synthetic.invalid/series.png" group-title="Series",Serie Ãšnica S01E01',
    'https://stream.synthetic.invalid/series/1.mp4',
    '#EXTINF:-1 tvg-logo="https://assets.synthetic.invalid/live.png" group-title="Ao Vivo",Canal Ãšnico',
    'https://stream.synthetic.invalid/live/1.m3u8',
  ];
}

function buildSyntheticReadableStream(targetBytes) {
  const encoder = new TextEncoder();
  const prefix = `${m3uRecordLines().join('\n')}\n`;
  let emitted = 0;
  let paddingIndex = 0;
  return new ReadableStream({
    pull(controller) {
      if (emitted >= targetBytes) {
        controller.close();
        return;
      }
      let chunk = '';
      if (emitted === 0) chunk += prefix;
      const remaining = Math.max(0, targetBytes - emitted - encoder.encode(chunk).byteLength);
      const payload = `#padding-${paddingIndex++}-${'x'.repeat(Math.min(64 * 1024, Math.max(1, remaining - 1)))}\n`;
      chunk += payload;
      const bytes = encoder.encode(chunk);
      const bounded = bytes.byteLength > targetBytes - emitted
        ? bytes.slice(0, targetBytes - emitted)
        : bytes;
      emitted += bounded.byteLength;
      controller.enqueue(bounded);
    },
  });
}

function streamedResponse(targetBytes) {
  return new Response(buildSyntheticReadableStream(targetBytes), {
    status: 200,
    headers: { 'content-type': 'audio/mpegurl' },
  });
}

await test('T01 limite antigo pertence somente ao caminho textual legado', async () => {
  assert.match(FETCH_SOURCE, /DEFAULT_MAX_RESPONSE_BYTES = 50 \* 1024 \* 1024/);
  assert.match(FETCH_SOURCE, /DEFAULT_MAX_SOURCE_FILE_BYTES = 256 \* 1024 \* 1024/);
  assert.match(IMPORTER_SOURCE, /fetchDeviceDirectM3uStream/);
  assert.doesNotMatch(IMPORTER_SOURCE, /const m3uContent = fetched\.body/);
});

await test('T02 transporte nativo grava arquivo privado em chunks', async () => {
  assert.match(BRIDGE_SOURCE, /LargeSourceTransport/);
  assert.match(BRIDGE_SOURCE, /readChunk/);
  assert.match(NATIVE_SOURCE, /getCacheDir\(\)/);
  assert.match(NATIVE_SOURCE, /new byte\[DOWNLOAD_BUFFER_BYTES\]/);
  assert.match(NATIVE_SOURCE, /FileOutputStream\(tempFile\)/);
  assert.match(NATIVE_SOURCE, /closeAndDelete/);
  assert.doesNotMatch(NATIVE_SOURCE, /Log\.[idwe]\(/);
});

await test('T03 parser incremental preserva CRLF, LF, BOM e ordem', async () => {
  const fixture = '\ufeff#EXTM3U\r\n#EXTINF:-1 group-title="Geral",Ã‰lite\r\nhttps://synthetic.invalid/a.mp4\n';
  const bytes = new TextEncoder().encode(fixture);
  const chunks = [bytes.slice(0, 5), bytes.slice(5, 23), bytes.slice(23)];
  const lines = [];
  async function* source() {
    for (const chunk of chunks) yield chunk;
  }
  for await (const line of iterateUtf8Lines(source())) lines.push(line);
  assert.deepEqual(lines, fixture.replace(/^\ufeff/, '').split(/\r?\n/).filter((line, index, all) => !(index === all.length - 1 && line === '')));
});

await test('T04 fixture sintética acima de 50 MB usa ReadableStream sem response.text', async () => {
  const targetBytes = 60 * 1024 * 1024;
  const before = process.memoryUsage().rss;
  let peak = before;
  const sampler = setInterval(() => { peak = Math.max(peak, process.memoryUsage().rss); }, 10);
  const result = await RealSourceImporterService.importM3u(
    { type: 'M3U', playlistUrl: syntheticUrl() },
    {
      persistLiveCatalog: false,
      requestHeaders: { 'X-Synthetic': 'yes' },
      fetchImpl: async () => streamedResponse(targetBytes),
    },
  );
  clearInterval(sampler);
  const after = process.memoryUsage().rss;
  console.log(`SYNTHETIC_SOURCE_SIZE_BYTES=${targetBytes}`);
  console.log(`PROCESS_MEMORY_BEFORE=${before}`);
  console.log(`PROCESS_MEMORY_PEAK=${peak}`);
  console.log(`PROCESS_MEMORY_AFTER=${after}`);
  assert.equal(result.success, true);
  assert.equal(result.transport?.sanitizedFetchErrorCode, undefined);
  assert.equal(result.metrics?.canonicalMovieCount, 1);
  assert.equal(result.metrics?.canonicalSeriesCount, 1);
  assert.equal(result.metrics?.canonicalLiveChannelCount, 1);
  assert.equal(result.sourcePayloadSizeBytes, targetBytes);
});

await test('T05 caminho pequeno permanece funcional', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(m3uRecordLines().join('\n'), { status: 200 });
  try {
    const result = await RealSourceImporterService.importM3u(
      { type: 'M3U', playlistUrl: syntheticUrl() },
      { persistLiveCatalog: false },
    );
    assert.equal(result.success, true);
    assert.equal(result.metrics?.rawItemCount, 3);
    assert.equal(result.metrics?.canonicalMovieCount, 1);
    assert.equal(result.metrics?.canonicalSeriesCount, 1);
    assert.equal(result.metrics?.canonicalLiveChannelCount, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

await test('T06 contrato não usa proxy, conteúdo ou URL em observabilidade', async () => {
  assert.doesNotMatch(IMPORTER_SOURCE, /supabase\.from|functions\.invoke|edge function/i);
  assert.match(FETCH_SOURCE, /sanitizedFetchErrorCode/);
  assert.match(NATIVE_SOURCE, /headers/);
  assert.doesNotMatch(NATIVE_SOURCE, /Log\.[idwe]\(/);
});

const lockMaterial = [
  'LARGE_SOURCE_DEVICE_DIRECT_TRANSPORT_LOCK_V1',
  FETCH_SOURCE,
  BRIDGE_SOURCE,
  NATIVE_SOURCE,
].join('\n');
console.log(`LARGE_SOURCE_TRANSPORT_LOCK_ID=LARGE_SOURCE_DEVICE_DIRECT_TRANSPORT_LOCK_V1`);
console.log(`LARGE_SOURCE_TRANSPORT_LOCK_HASH=${crypto.createHash('sha256').update(lockMaterial).digest('hex').toUpperCase()}`);
console.log(`LARGE_SOURCE_M3U_STREAMING_PARITY_LOCK_ID=LARGE_SOURCE_M3U_STREAMING_PARITY_LOCK_V1`);
console.log(`LARGE_SOURCE_M3U_STREAMING_PARITY_LOCK_HASH=${crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'src/source/m3u-line-stream.ts'))).digest('hex').toUpperCase()}`);
console.log(`R2F8_LARGE_SOURCE_TEST_COUNT=${total}`);
console.log(`R2F8_LARGE_SOURCE_TEST_PASS_COUNT=${passed}`);
if (passed !== total) process.exitCode = 1;
