import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fetchDeviceDirectM3uStream } from '../src/source/device-direct-fetch.ts';
import { RealSourceImporterService, IMPORT_BATCH_SIZE } from '../src/source/real-source-importer.service.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { PackageImporter } from '../src/bootstrap/package-importer.ts';

// C104: synthetic protocol/integration evidence. No real provider or device data.
const SOURCE_URL = 'https://progressive.synthetic.invalid/catalog.m3u';
const CONFIG = { type: 'M3U', playlistUrl: SOURCE_URL };
const PROVENANCE = { kind: 'REAL', sourceId: 'progressive-synthetic', sourceVersion: 1 };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const encode = (value) => new TextEncoder().encode(value);
const record = (index) => `#EXTINF:-1 group-title="Filmes",Ação Élite ${index} 🧭\r\nhttps://stream.synthetic.invalid/movie/${index}.mp4\r\n`;
const playlist = (count) => '#EXTM3U\r\n' + Array.from({ length: count }, (_, index) => record(index)).join('');
const data = (bytes) => ({ done: false, bytesRead: bytes.length, dataBase64: Buffer.from(bytes).toString('base64'), stage: 'FILE_READ' });
const pending = () => ({ done: false, pending: true, bytesRead: 0, stage: 'FILE_READ' });
const done = () => ({ done: true, bytesRead: 0, stage: 'DOWNLOAD_COMPLETE' });
const failed = () => ({ done: true, bytesRead: 0, stage: 'FILE_WRITE', errorCode: 'READ_TIMEOUT', retryable: true });

function splitBytes(bytes) {
  // Includes cuts inside BOM/accents/emoji and large bounded blocks.
  const sizes = [1, 2, 3, 7, 17, 8191, 65537];
  const result = [];
  for (let offset = 0, index = 0; offset < bytes.length; index++) {
    const end = Math.min(bytes.length, offset + sizes[index % sizes.length]);
    result.push(data(bytes.slice(offset, end)));
    offset = end;
  }
  return result;
}

function transportFixture(chunks, { completed = false, bytes = 0, digest } = {}) {
  const calls = { starts: [], reads: 0, cleanups: 0, cancels: 0 };
  return {
    calls,
    async startDownload(options) {
      calls.starts.push(options);
      return {
        success: true, downloadId: 'synthetic-download', bytesWritten: bytes,
        sourceContentDigest: digest, stage: completed ? 'DOWNLOAD_COMPLETE' : 'FILE_WRITE',
        httpResponseReceived: 'SIM', httpStatusClass: '2XX', retryable: false,
        transportType: 'NATIVE_FILE_BACKED',
      };
    },
    async readChunk(options) {
      assert.equal(options.downloadId, 'synthetic-download');
      assert.ok(options.maxBytes > 0 && options.maxBytes <= 2 * 1024 * 1024);
      const next = chunks[calls.reads++];
      assert.ok(next, 'Unexpected read after terminal result');
      return typeof next === 'function' ? await next() : next;
    },
    async cleanupDownload({ downloadId }) {
      assert.equal(downloadId, 'synthetic-download');
      calls.cleanups++;
      return { success: true, stage: 'TEMP_CLEANUP', retryable: false };
    },
    async cancelDownload() { calls.cancels++; return { success: true }; },
  };
}

class ObservedStorage extends InMemoryCatalogStorage {
  writes = [];
  finalizations = [];
  cleanups = [];
  promotions = [];
  async writeStagingSegment(snapshotId, segmentPath, json) {
    this.writes.push({ snapshotId, segmentPath, records: JSON.parse(json).length });
    return super.writeStagingSegment(snapshotId, segmentPath, json);
  }
  async writeStaging(snapshotId, ...args) {
    this.finalizations.push(snapshotId);
    return super.writeStaging(snapshotId, ...args);
  }
  async cleanupStaging(snapshotId) {
    this.cleanups.push(snapshotId);
    return super.cleanupStaging(snapshotId);
  }
  async promoteStaging(snapshotId) {
    this.promotions.push(snapshotId);
    return super.promoteStaging(snapshotId);
  }
  resetObservations() {
    this.writes.length = this.finalizations.length = this.cleanups.length = this.promotions.length = 0;
  }
}

async function promoteResult(storage, result) {
  assert.equal(result.success, true);
  const importer = new PackageImporter(storage);
  const staged = await importer.stageArtifacts(result.segmentedStaging.manifest, result.catalog,
    undefined, result.liveCatalog, undefined, result.catalogJson);
  assert.equal(staged.success, true, staged.errors?.join('; '));
  const promoted = await importer.promoteStagedPackage(result.segmentedStaging.snapshotId);
  assert.equal(promoted.success, true, promoted.errors?.join('; '));
}

async function storageWithActive() {
  const storage = new ObservedStorage();
  const body = playlist(1);
  const nativeTransport = transportFixture([data(encode(body)), done()], {
    completed: true, bytes: Buffer.byteLength(body), digest: sha256(body),
  });
  const result = await RealSourceImporterService.importM3u(CONFIG, {
    snapshotId: 'previous-active', storage, provenance: PROVENANCE, nativeTransport,
  });
  await promoteResult(storage, result);
  storage.resetObservations();
  return storage;
}

let passed = 0;
async function test(name, run) {
  await run();
  passed++;
  console.log('PASS ' + name);
}

const previousFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('Live network forbidden in progressive fixture'); };
try {
  await test('PROGRESSIVE_PENDING_UTF8_BYTES_AND_COMPLETE_SIZE', async () => {
    const bytes = encode('\ufeff' + playlist(3));
    const transport = transportFixture([pending(), ...splitBytes(bytes), pending(), done()]);
    const result = await fetchDeviceDirectM3uStream(SOURCE_URL, {}, { nativeTransport: transport, progressiveDownload: true });
    assert.equal(result.success, true);
    assert.equal(result.observation.transportStage, 'FILE_WRITE');
    assert.equal(result.sourceContentDigest, undefined);
    assert.equal(result.getSourcePayloadSizeBytes(), 0);
    assert.equal(transport.calls.starts[0].progressive, true);
    const chunks = [];
    for await (const chunk of result.stream.readChunks()) {
      assert.ok(chunk instanceof Uint8Array, 'Base64 chunks must remain raw bytes');
      chunks.push(Buffer.from(chunk));
    }
    const actual = Buffer.concat(chunks);
    assert.deepEqual(actual, Buffer.from(bytes));
    assert.equal(sha256(actual), sha256(bytes));
    assert.equal(result.getSourcePayloadSizeBytes(), bytes.length);
    assert.equal(result.observation.transportStage, 'DOWNLOAD_COMPLETE');
    await result.stream.cleanup();
    assert.equal(transport.calls.cleanups, 1);
  });

  await test('FIRST_BATCH_BEFORE_EOF_UNICODE_DIGEST_AND_ATOMIC_PROMOTION', async () => {
    const storage = await storageWithActive();
    const active = await storage.readActivePointer();
    const prefix = '\ufeff' + playlist(IMPORT_BATCH_SIZE);
    const tail = record(IMPORT_BATCH_SIZE) + record(IMPORT_BATCH_SIZE + 1);
    const prefixBytes = encode(prefix), tailBytes = encode(tail);
    let sawBatchBeforeEof = false;
    const transport = transportFixture([
      pending(), ...splitBytes(prefixBytes),
      async () => {
        assert.ok(storage.writes.some(write => write.records === IMPORT_BATCH_SIZE));
        assert.equal(storage.finalizations.length, 0, 'Partial catalog must not finalize');
        assert.equal(storage.promotions.length, 0, 'Partial catalog must not promote');
        assert.deepEqual(await storage.readActivePointer(), active);
        sawBatchBeforeEof = true;
        return pending();
      },
      ...splitBytes(tailBytes), done(),
    ]);
    const result = await RealSourceImporterService.importM3u(CONFIG, {
      snapshotId: 'progressive-complete', storage, provenance: PROVENANCE, nativeTransport: transport,
    });
    assert.equal(transport.calls.starts[0].progressive, true);
    assert.equal(sawBatchBeforeEof, true);
    assert.equal(result.success, true);
    assert.equal(result.contentDigest, sha256(Buffer.concat([prefixBytes, tailBytes])));
    assert.equal(result.sourcePayloadSizeBytes, prefixBytes.length + tailBytes.length);
    assert.equal(result.metrics.rawItemCount, IMPORT_BATCH_SIZE + 2);
    assert.equal(result.segmentedStaging.manifest.counts.movies, IMPORT_BATCH_SIZE + 2);
    const firstMovieSegment = result.segmentedStaging.manifest.segments.find(segment => segment.kind === 'movies');
    const movies = JSON.parse(await storage.readStagingSegment('progressive-complete', firstMovieSegment.fileName));
    assert.equal(movies[0].title, 'Ação Élite 0 🧭');
    assert.equal(movies.at(-1).title, `Ação Élite ${IMPORT_BATCH_SIZE - 1} 🧭`);
    assert.ok(storage.writes.every(write => write.records <= IMPORT_BATCH_SIZE));
    assert.deepEqual(await storage.readActivePointer(), active, 'Import alone must not replace active catalog');
    assert.equal(transport.calls.cleanups, 1);
    await promoteResult(storage, result);
    assert.equal((await storage.readActivePointer()).snapshotId, 'progressive-complete');
  });

  await test('ERROR_WITH_DONE_TRUE_IS_FAILURE_BEFORE_FIRST_BATCH', async () => {
    const transport = transportFixture([failed()]);
    const fetched = await fetchDeviceDirectM3uStream(SOURCE_URL, {}, { nativeTransport: transport, progressiveDownload: true });
    await assert.rejects(async () => {
      for await (const _chunk of fetched.stream.readChunks()) assert.fail('Failed transport yielded data');
    }, /NATIVE_CHUNK_READ_FAILED/);
    assert.equal(fetched.observation.transportSuccess, false);
    assert.equal(fetched.observation.transportErrorCode, 'TIMEOUT');
    await fetched.stream.cleanup();

    const storage = await storageWithActive(), active = await storage.readActivePointer();
    const importerTransport = transportFixture([failed()]);
    await assert.rejects(RealSourceImporterService.importM3u(CONFIG, {
      snapshotId: 'progressive-early-failed', storage, provenance: PROVENANCE, nativeTransport: importerTransport,
    }), /NATIVE_CHUNK_READ_FAILED/);
    assert.deepEqual(await storage.readActivePointer(), active);
    assert.equal(storage.writes.length, 0);
    assert.equal(storage.finalizations.length, 0);
    assert.equal(storage.promotions.length, 0);
    assert.deepEqual(storage.cleanups, ['progressive-early-failed']);
    assert.equal(importerTransport.calls.cleanups, 1);
  });

  await test('LATE_FAILURE_REMOVES_PERSISTED_BATCH_AND_PRESERVES_ACTIVE', async () => {
    const storage = await storageWithActive(), active = await storage.readActivePointer();
    const activeCatalog = await storage.readActiveCatalog();
    let sawStaging = false;
    const transport = transportFixture([
      ...splitBytes(encode(playlist(IMPORT_BATCH_SIZE + 3))),
      async () => {
        assert.ok(storage.writes.some(write => write.records === IMPORT_BATCH_SIZE));
        assert.ok(await storage.readStagingSegment('progressive-late-failed', 'movies_000001.json'));
        sawStaging = true;
        return failed();
      },
    ]);
    await assert.rejects(RealSourceImporterService.importM3u(CONFIG, {
      snapshotId: 'progressive-late-failed', storage, provenance: PROVENANCE, nativeTransport: transport,
    }), /NATIVE_CHUNK_READ_FAILED/);
    assert.equal(sawStaging, true, 'Failure must happen after a real staging batch');
    assert.equal(storage.finalizations.length, 0);
    assert.equal(storage.promotions.length, 0);
    assert.equal(await storage.readStaging('progressive-late-failed'), null);
    for (const write of storage.writes) {
      assert.equal(await storage.readStagingSegment('progressive-late-failed', write.segmentPath), null);
    }
    assert.deepEqual(await storage.readActivePointer(), active);
    assert.deepEqual(await storage.readActiveCatalog(), activeCatalog);
    assert.equal(transport.calls.cleanups, 1);
  });

  await test('C60_UNCHANGED_NATIVE_DIGEST_REQUESTS_COMPLETE_MODE_AND_SKIPS_PARSE', async () => {
    const storage = await storageWithActive(), active = await storage.readActivePointer();
    const body = playlist(7), digest = sha256(body);
    const transport = transportFixture([], { completed: true, bytes: Buffer.byteLength(body), digest });
    const result = await RealSourceImporterService.importM3u(CONFIG, {
      snapshotId: 'unchanged-c60', storage, provenance: PROVENANCE,
      unchangedContentDigest: digest, nativeTransport: transport,
    });
    assert.equal(transport.calls.starts[0].progressive, false);
    assert.equal(result.success, true);
    assert.equal(result.notModified, true);
    assert.equal(result.contentDigest, digest);
    assert.equal(result.sourcePayloadSizeBytes, Buffer.byteLength(body));
    assert.equal(result.segmentedStaging, undefined);
    assert.equal(transport.calls.reads, 0);
    assert.equal(transport.calls.cleanups, 1);
    assert.equal(storage.writes.length, 0);
    assert.equal(storage.finalizations.length, 0);
    assert.equal(storage.promotions.length, 0);
    assert.deepEqual(await storage.readActivePointer(), active);
  });

  await test('EXISTING_FETCH_CALLERS_DEFAULT_TO_COMPLETE_MODE', async () => {
    const bytes = encode(playlist(1));
    const transport = transportFixture([data(bytes), done()], { completed: true, bytes: bytes.length, digest: sha256(bytes) });
    const result = await fetchDeviceDirectM3uStream(SOURCE_URL, {}, { nativeTransport: transport });
    assert.equal(transport.calls.starts[0].progressive, false);
    assert.equal(result.sourceContentDigest, sha256(bytes));
    for await (const _chunk of result.stream.readChunks()) { /* Consume legacy complete-file path. */ }
    assert.equal(result.getSourcePayloadSizeBytes(), bytes.length, 'Complete mode must not double-count bytes');
    await result.stream.cleanup();
  });

  await test('CANCEL_DURING_NATIVE_READ_CANNOT_MASQUERADE_AS_EOF', async () => {
    const readStarted = Promise.withResolvers();
    const delayedRead = Promise.withResolvers();
    const transport = transportFixture([async () => {
      readStarted.resolve();
      return delayedRead.promise;
    }]);
    const result = await fetchDeviceDirectM3uStream(SOURCE_URL, {}, { nativeTransport: transport, progressiveDownload: true });
    const iterator = result.stream.readChunks()[Symbol.asyncIterator]();
    const rejection = assert.rejects(iterator.next(), /NATIVE_DOWNLOAD_ABORTED/);
    await readStarted.promise;
    await result.stream.cancel();
    delayedRead.resolve(done());
    await rejection;
    assert.equal(transport.calls.reads, 1);
    assert.equal(transport.calls.cancels, 1);
    assert.equal(result.observation.transportSuccess, false);
    assert.equal(result.observation.transportErrorCode, 'DOWNLOAD_CANCELLED');
    assert.equal(result.getSourcePayloadSizeBytes(), 0);
    await result.stream.cleanup();
    assert.equal(transport.calls.cleanups, 1);
  });

  await test('CANCEL_AFTER_YIELD_REJECTS_NEXT_READ_INSTEAD_OF_COMPLETING', async () => {
    const bytes = encode(playlist(1));
    const transport = transportFixture([data(bytes)]);
    const result = await fetchDeviceDirectM3uStream(SOURCE_URL, {}, { nativeTransport: transport, progressiveDownload: true });
    const iterator = result.stream.readChunks()[Symbol.asyncIterator]();
    const first = await iterator.next();
    assert.equal(first.done, false);
    assert.deepEqual(Buffer.from(first.value), Buffer.from(bytes));
    await result.stream.cancel();
    await assert.rejects(iterator.next(), /NATIVE_DOWNLOAD_ABORTED/);
    assert.equal(transport.calls.reads, 1, 'Cancelled reader must not ask native transport for another chunk');
    assert.equal(transport.calls.cancels, 1);
    assert.equal(result.observation.transportSuccess, false);
    assert.equal(result.observation.transportErrorCode, 'DOWNLOAD_CANCELLED');
    await result.stream.cleanup();
    assert.equal(transport.calls.cleanups, 1);
  });
} finally {
  globalThis.fetch = previousFetch;
}

console.log(`C11_PROGRESSIVE_SOURCE_DOWNLOAD_TEST_COUNT=${passed}`);
console.log('C11_PROGRESSIVE_SOURCE_DOWNLOAD_TESTS=PASS');
