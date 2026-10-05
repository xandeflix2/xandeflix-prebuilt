import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { iterateUtf8Lines } from '../src/source/m3u-line-stream.ts';
import { parseM3uExtInfLine, parseM3uEpisodeIdentity } from '../src/source/m3u-extinf-parser.ts';

const MiB = 1024 * 1024;
const mode = process.argv[2];
const encoder = new TextEncoder();

// Baseline control: slices share the decoded chunk backing store in V8.
async function* originalSlices(chunks) {
  const decoder = new TextDecoder('utf-8');
  let pending = '';
  for await (const chunk of chunks) {
    pending += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
    let start = 0;
    let end = pending.indexOf('\n', start);
    while (end !== -1) {
      const line = pending.slice(start, end);
      yield line.endsWith('\r') ? line.slice(0, -1) : line;
      start = end + 1;
      end = pending.indexOf('\n', start);
    }
    pending = pending.slice(start);
  }
  pending += decoder.decode();
  if (pending) yield pending;
}

async function runRetention() {
  assert.equal(typeof global.gc, 'function');
  const decodeBytes = mode.endsWith('bytes');
  async function* chunks() {
    for (let i = 0; i < 24; i++) {
      const head = `#EXTINF:-1 group-title="Series",Synthetic retained series title ${i} S01E01\n`;
      const filler = '# filler synthetic\n';
      const chunk = head + filler.repeat(Math.floor((2 * MiB - head.length) / filler.length));
      yield decodeBytes ? encoder.encode(chunk) : chunk;
    }
  }
  global.gc();
  const before = process.memoryUsage().heapUsed;
  const roots = [];
  const reader = mode.startsWith('negative') || mode.startsWith('baseline') ? originalSlices : iterateUtf8Lines;
  for await (const line of reader(chunks())) {
    if (line.startsWith('#EXTINF:')) {
      roots.push(parseM3uEpisodeIdentity(parseM3uExtInfLine(line).displayTitle).rootTitle);
    }
  }
  for (let i = 0; i < 24; i++) assert.equal(roots[i], `Synthetic retained series title ${i}`);
  global.gc();
  const retainedDeltaMiB = (process.memoryUsage().heapUsed - before) / MiB;
  console.log(JSON.stringify({ mode, syntheticMiB: 48, retainedTitles: roots.length, retainedDeltaMiB }));
  // Node's TextDecoder currently materializes a different string layout;
  // the confirmed negative is the native dataText path, not byte decoding.
  if (!mode.startsWith('baseline')) assert.ok(retainedDeltaMiB < 8, 'CHUNK_BACKING_RETAINED_BY_TITLES');
  console.log(`PASS ${mode}`);
}

async function checkLines() {
  const escapedQuote = String.fromCharCode(92, 34);
  const source = `\uFEFF#EXTM3U\r\n#EXTINF:-1 tvg-logo="https://art.synthetic.invalid/a,b.jpg" group-title="Séries, ação" tvg-name="A ${escapedQuote}B${escapedQuote}",Série 🐉 – 東京 S01E02\r\nhttps://stream.synthetic.invalid/v.mp4\n# comentário\nÚltima linha sem newline`;
  const expected = source.split(/\r?\n/);
  async function collect(chunks) {
    const lines = [];
    for await (const line of iterateUtf8Lines(chunks)) lines.push(line);
    return lines;
  }
  for (const size of [1, 2, 7, 19, 1024]) {
    async function* chunks() {
      const bytes = encoder.encode(source);
      for (let offset = 0; offset < bytes.length; offset += size) yield bytes.subarray(offset, offset + size);
    }
    const decodedExpected = [...expected];
    decodedExpected[0] = decodedExpected[0].replace(/^\uFEFF/, '');
    assert.deepEqual(await collect(chunks()), decodedExpected);
  }
  async function* strings() { yield source.slice(0, 12); yield ''; yield source.slice(12); }
  assert.deepEqual(await collect(strings()), expected);
  const parsed = parseM3uExtInfLine(expected[1]);
  assert.equal(parsed.groupTitle, 'Séries, ação');
  assert.equal(parsed.tvgName, 'A "B"');
  assert.equal(parsed.tvgLogo, 'https://art.synthetic.invalid/a,b.jpg');
  assert.deepEqual(parseM3uEpisodeIdentity(parsed.displayTitle), {
    rootTitle: 'Série 🐉 – 東京', seasonNumber: 1, episodeNumber: 2,
  });
  assert.equal(parseM3uExtInfLine('#EXTINF:-1 group-title="unclosed,Title'), undefined);
  assert.equal(parseM3uExtInfLine('#EXTINF:-1,'), undefined);
  // String input must remain lossless even for a lone UTF-16 surrogate.
  async function* lone() { yield 'before\ud800after\n'; }
  assert.deepEqual(await collect(lone()), ['before\ud800after']);
  async function* oversized(newline) { yield 'x'.repeat(8 * MiB + 1) + newline; }
  await assert.rejects(collect(oversized('')), /M3U_LINE_TOO_LARGE/);
  await assert.rejects(collect(oversized('\n')), /M3U_LINE_TOO_LARGE/);
  async function* tail() { yield 'head\n'; yield 'tail\r\n'; yield '\n'; }
  assert.deepEqual(await collect(tail()), ['head', 'tail', '']);
  console.log('PASS UTF8_CRLF_QUOTED_UNICODE_INVALID_INPUT_AND_LINE_LIMITS');
}

async function runImport() {
  const { RealSourceImporterService } = await import('../src/source/real-source-importer.service.ts');
  const records = 100_000;
  let next = 0;
  let payloadBytes = 0;
  const renderRecord = (index) => {
    const series = Math.floor(index / 10);
    const episode = index % 10 + 1;
    return `#EXTINF:-1 group-title="Series",Synthetic series ${series} with Unicode ação 🐉 S01E${String(episode).padStart(2, '0')}\nhttps://stream.synthetic.invalid/series/${series}/${episode}.mp4\n`;
  };
  let declaredBytes = Buffer.byteLength('#EXTM3U\n');
  for (let i = 0; i < records; i++) declaredBytes += Buffer.byteLength(renderRecord(i));
  // Exercise Android's actual dataText bridge path, not only TextDecoder.
  const nativeTransport = {
    async startDownload() {
      return { success: true, downloadId: 'synthetic-only', httpResponseReceived: 'SIM',
        httpStatusClass: '2XX', bytesWritten: declaredBytes, stage: 'DOWNLOAD_COMPLETE',
        retryable: false, transportType: 'NATIVE_FILE_BACKED' };
    },
    async readChunk({ maxBytes }) {
      assert.equal(maxBytes, 2 * MiB);
      if (next === records) return { done: true, bytesRead: 0 };
      let text = next === 0 ? '#EXTM3U\n' : '';
      while (next < records && text.length < 2 * MiB - 512) {
        // All episode titles are deliberately long enough to be V8 slices.
        text += renderRecord(next);
        next++;
      }
      const bytesRead = Buffer.byteLength(text);
      payloadBytes += bytesRead;
      return { done: false, bytesRead, dataText: text, stage: 'FILE_READ' };
    },
    async cleanupDownload() { return { success: true, stage: 'TEMP_CLEANUP', retryable: false }; },
    async cancelDownload() { return { success: true }; },
  };
  const counts = new Map();
  const entries = new Map();
  const rolling = createHash('sha256');
  let totalBytes = 0;
  let maxWriteBytes = 0;
  let peakHeapMiB = 0;
  const pendingStreams = new Map(); // At most one writer batch; never all records.
  const storage = {
    async writeStagingSegment(_snapshot, path, json) {
      const kind = path.split('/').pop().split('_')[0];
      const rows = JSON.parse(json);
      const bytes = Buffer.from(json, 'utf8');
      rolling.update(bytes);
      totalBytes += bytes.length;
      maxWriteBytes = Math.max(maxWriteBytes, bytes.length);
      entries.set(path.split('/').pop(), { count: rows.length, sha: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
      counts.set(kind, (counts.get(kind) || 0) + rows.length);
      for (const row of rows) {
        if (kind === 'episodes') {
          assert.equal(row.seasonId, `${row.seriesId}:s1`);
          assert.equal(row.id, `${row.seasonId}:e${row.episodeNumber}`);
          const seriesNumber = Number(row.seriesId.split(':').pop());
          assert.equal(row.title, `Synthetic series ${seriesNumber} with Unicode ação 🐉 S01E${String(row.episodeNumber).padStart(2, '0')}`);
          pendingStreams.set(row.streamIds[0], row.id);
        } else if (kind === 'streams') {
          assert.equal(pendingStreams.get(row.id), row.sourceItemId);
          assert.match(row.directStreamUrl, /^https:\/\/stream\.synthetic\.invalid\/series\/\d+\/\d+\.mp4$/);
          pendingStreams.delete(row.id);
        } else if (kind === 'series') {
          assert.deepEqual(row.seasonIds, [`${row.id}:s1`]);
          assert.equal(row.title, `Synthetic series ${Number(row.id.split(':').pop())} with Unicode ação 🐉`);
        } else if (kind === 'seasons') {
          assert.equal(row.id, `${row.seriesId}:s1`);
          assert.deepEqual(row.episodeIds, []);
        }
      }
      assert.ok(pendingStreams.size <= 3000);
      global.gc();
      peakHeapMiB = Math.max(peakHeapMiB, process.memoryUsage().heapUsed / MiB);
    },
    async writeStaging(_snapshot, manifest, header) {
      assert.equal(manifest.counts.episodes, records);
      assert.ok(JSON.parse(header).episodes.length <= 100);
    },
  };
  const start = performance.now();
  const result = await RealSourceImporterService.importM3u(
    { type: 'M3U', playlistUrl: 'https://source.synthetic.invalid/playlist.m3u' },
    {
      sourceId: 'synthetic-retention-test',
      provenance: { kind: 'REAL', sourceId: 'synthetic-retention-test', sourceVersion: 1 },
      storage,
      expectedSourceRecordCount: records,
      nativeTransport,
    },
  );
  assert.equal(result.success, true);
  assert.equal(result.metrics.rawItemCount, records);
  assert.equal(result.metrics.canonicalEpisodeCount, records);
  assert.equal(result.metrics.canonicalSeriesCount, records / 10);
  assert.equal(result.sourcePayloadSizeBytes, payloadBytes);
  assert.equal(result.sourcePayloadSizeBytes, declaredBytes);
  assert.equal(counts.get('episodes'), records);
  assert.equal(counts.get('streams'), records);
  assert.equal(counts.get('series'), records / 10);
  assert.equal(counts.get('seasons'), records / 10);
  assert.equal(pendingStreams.size, 0);
  const manifest = result.segmentedStaging.manifest;
  assert.equal(manifest.segments.filter((entry) => entry.kind === 'episodes').length, Math.ceil(records / 2500));
  assert.equal(manifest.segments.filter((entry) => entry.kind === 'streams').length, Math.ceil(records / 2500));
  assert.equal(manifest.catalogSha256, rolling.digest('hex'));
  assert.equal(manifest.catalogSizeBytes, totalBytes);
  for (const entry of manifest.segments) {
    const observed = entries.get(entry.fileName);
    assert.equal(entry.sha256, observed.sha);
    assert.equal(entry.byteSize, observed.bytes);
    assert.equal(entry.recordCount, observed.count);
  }
  assert.ok(peakHeapMiB < 80, 'SYNTHETIC_IMPORT_HEAP_EXCEEDS_BOUND');
  console.log(JSON.stringify({ records, sourceMiB: payloadBytes / MiB, peakHeapMiB, maxWriteBytes, segmentCount: manifest.segments.length, durationMs: Math.round(performance.now() - start), sink: 'hash/count only; no retained catalog payload' }));
  console.log('PASS COMPLETE_IMPORT_COUNTS_RELATIONSHIPS_AND_SEGMENT_HASHES');
}

if (mode?.includes('retention') || mode?.startsWith('negative') || mode?.startsWith('baseline')) {
  await runRetention();
} else if (mode === 'import') {
  await runImport();
} else {
  await checkLines();
  for (const childMode of ['retention-text', 'retention-bytes', 'negative-text', 'baseline-bytes', 'import']) {
    const child = spawnSync(process.execPath, [
      '--expose-gc', '--max-old-space-size=128', '--experimental-strip-types', fileURLToPath(import.meta.url), childMode,
    ], { cwd: process.cwd(), encoding: 'utf8', timeout: 180_000, maxBuffer: MiB });
    assert.ifError(child.error);
    if (childMode.startsWith('negative')) {
      assert.notEqual(child.status, 0, 'negative control unexpectedly passed');
      assert.match(child.stderr, /CHUNK_BACKING_RETAINED_BY_TITLES/);
      console.log(child.stdout.trim());
      console.log(`PASS negative control rejected: ${childMode}`);
    } else {
      assert.equal(child.status, 0, child.stdout + child.stderr);
      console.log(child.stdout.trim());
    }
  }
  console.log('C11_FIRE_STICK_SYNTHETIC_RETENTION_AND_INTEGRITY=PASS');
  console.log('PHYSICAL_FIRE_STICK_60_SECONDS_ACCEPTANCE=PENDING');
}
