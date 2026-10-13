import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { AutomaticSourceRefresh, canRefreshCatalog, SOURCE_REFRESH_INTERVAL_MS, SOURCE_REFRESH_RETRY_MS, localSourceContentRepository, readRefreshClock } from '../src/bootstrap/automatic-source-refresh.ts';
import { BootSyncCoordinator } from '../src/bootstrap/boot-sync-coordinator.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { ManagedSourceStagingOrchestrator } from '../src/source/managed-source-staging.orchestrator.ts';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { CURRENT_CLASSIFICATION_PROFILE_VERSION } from '../src/source/source-classification-profile.ts';

let passed = 0;
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }
const hash = text => createHash('sha256').update(text).digest('hex');
const playlist = titles => '#EXTM3U\n' + titles.map((title, i) => `#EXTINF:-1 group-title="Filmes | Lancamentos",${title}\nhttps://media.fixture.invalid/movie/${i}.mp4\n`).join('');
function harness() {
  const storage = new InMemoryCatalogStorage(), bootstrap = new BootstrapService(storage);
  let body = playlist(['Primeiro Filme (2026)']), fail = false, reads = 0, downloads = 0, cleaned = 0, checkpoint = null, status = 'SOURCE_READY';
  const authority = () => ({ status, remoteResultCode: status, remoteAuthorityAvailable: true,
    sourceId: 'source-c60-fixture', sourceVersion: 1, sourceStatus: 'ACTIVE', protocol: 'M3U',
    licenseId: 'license-fixture', licenseStatus: 'ACTIVE', mode: 'MANAGED' });
  const nativeTransport = {
    async startDownload() { downloads++; return fail ? { success: false, stage: 'REQUEST_START', errorCode: 'CONNECT_TIMEOUT', retryable: true } : {
      success: true, downloadId: 'fixture-download', bytesWritten: Buffer.byteLength(body),
      sourceContentDigest: hash(body), httpResponseReceived: 'SIM', httpStatusClass: '2XX', stage: 'DOWNLOAD_COMPLETE', retryable: false,
    }; },
    async readChunk() { reads++; return reads % 2 ? { done: false, dataText: body, bytesRead: Buffer.byteLength(body) } : { done: true, bytesRead: 0 }; },
    async cleanupDownload() { cleaned++; return { success: true, stage: 'TEMP_CLEANUP', retryable: false }; },
    async cancelDownload() { return { success: true }; },
  };
  const record = { sourceId: 'source-c60-fixture', sourceVersion: 1, protocol: 'M3U', sourceConfig: { playlistUrl: 'https://source.fixture.invalid/playlist.m3u' } };
  const staging = new ManagedSourceStagingOrchestrator({ resolveAuthorization: async () => authority(),
    secureSourceStore: { get: async () => record }, bootstrapService: bootstrap,
    importer: { importM3u: (config, options) => RealSourceImporterService.importM3u(config, { ...options, nativeTransport }), importXtream: () => { throw Error('Unexpected protocol'); } },
  });
  const identity = { deviceId: 'device-fixture', displayCode: 'XF-TEST-TEST' };
  const activation = { ...identity, status: 'AUTHORIZED', deviceAuthToken: 'fixture-token', licenseId: 'license-fixture', licenseStatus: 'ACTIVE', licenseMode: 'MANAGED' };
  const coordinator = new BootSyncCoordinator({ bootstrapService: bootstrap, stagingOrchestrator: staging,
    secureStore: { get: async () => record }, sourceResolver: async () => authority(),
    deviceContext: { loadActivationState: async () => activation, getOrCreateIdentity: async () => identity },
    contentRepository: { read: () => checkpoint, write: value => { checkpoint = value; } }, searchBuilder: async () => ({ success: true }),
  });
  return { storage, bootstrap, coordinator, setBody(v) { body = v; }, setFailure(v) { fail = v; }, setStatus(v) { status = v; },
    setCheckpoint(v) { checkpoint = v; }, checkpoint: () => checkpoint, metrics: () => ({ reads, downloads, cleaned }) };
}

const h = harness();
await test('FIRST_IMPORT_PROMOTES_AND_BINDS_DIGEST_AFTER_COMMIT', async () => {
  const result = await h.coordinator.coordinateBootSync({ checkContent: true });
  assert.equal(result.outcome, 'PROMOTED');
  assert.equal(h.checkpoint().snapshotId, (await h.storage.readActivePointer()).snapshotId);
  assert.equal(h.checkpoint().contentDigest, hash(playlist(['Primeiro Filme (2026)'])));
  assert.equal(h.metrics().cleaned, 1);
});
await test('UNCHANGED_NATIVE_BODY_SKIPS_PARSE_STAGING_AND_PROMOTION', async () => {
  const before = h.metrics(), pointer = await h.storage.readActivePointer();
  const result = await h.coordinator.coordinateBootSync({ checkContent: true });
  assert.equal(result.outcome, 'NO_OP'); assert.deepEqual(await h.storage.readActivePointer(), pointer);
  assert.equal(h.metrics().reads, before.reads); assert.equal(h.metrics().cleaned, before.cleaned + 1);
});
await test('SAME_SOURCE_VERSION_NEW_TITLE_AND_CATEGORY_VISIBLE_AFTER_PROMOTION', async () => {
  const old = await h.storage.readActivePointer();
  h.setBody(playlist(['Primeiro Filme (2026)', 'Novo Filme (2026)']));
  const result = await h.coordinator.coordinateBootSync({ checkContent: true });
  assert.equal(result.outcome, 'PROMOTED'); assert.equal(result.sourceVersion, 1); assert.notEqual(result.snapshotId, old.snapshotId);
  const catalog = await h.storage.readActiveCatalog();
  assert.equal(catalog.movies.length, 2); assert.equal(catalog.movies[1].title, 'Novo Filme (2026)');
  assert.ok(catalog.categories.some(c => c.contentKinds.includes('movie')));
});
await test('DEFAULT_CONFIGURATION_CHECK_STILL_NO_OP_WITHOUT_DOWNLOAD', async () => {
  const before = h.metrics().downloads;
  assert.equal((await h.coordinator.coordinateBootSync()).outcome, 'NO_OP'); assert.equal(h.metrics().downloads, before);
});
await test('FETCH_FAILURE_PRESERVES_ACTIVE_AND_COMMITTED_DIGEST', async () => {
  const pointer = await h.storage.readActivePointer(), checkpoint = h.checkpoint();
  h.setFailure(true); assert.equal((await h.coordinator.coordinateBootSync({ checkContent: true })).outcome, 'LOCAL_FIRST_ACTIVE_PRESERVED');
  assert.deepEqual(await h.storage.readActivePointer(), pointer); assert.deepEqual(h.checkpoint(), checkpoint); h.setFailure(false);
});
await test('REVOCATION_NEVER_DOWNLOADS_SOURCE', async () => {
  const before = h.metrics().downloads; h.setStatus('DEVICE_REVOKED');
  assert.equal((await h.coordinator.coordinateBootSync({ checkContent: true })).outcome, 'DEVICE_NOT_AUTHORIZED');
  assert.equal(h.metrics().downloads, before); h.setStatus('SOURCE_READY');
});
await test('PARALLEL_CONTENT_CHECKS_COALESCE_SINGLE_DOWNLOAD', async () => {
  const before = h.metrics().downloads;
  const results = await Promise.all(Array.from({ length: 12 }, () => h.coordinator.coordinateBootSync({ checkContent: true })));
  assert.ok(results.every(r => r.outcome === 'NO_OP')); assert.equal(h.metrics().downloads, before + 1);
});
await test('WRONG_SNAPSHOT_DIGEST_CANNOT_SKIP_IMPORT', async () => {
  h.setCheckpoint({ ...h.checkpoint(), snapshotId: 'different-active-generation' });
  assert.equal((await h.coordinator.coordinateBootSync({ checkContent: true })).outcome, 'PROMOTED');
});
await test('OLD_CLASSIFICATION_PROFILE_IGNORES_UNCHANGED_DIGEST', async () => {
  const pointer = await h.storage.readActivePointer(), manifest = await h.storage.readActiveManifest();
  h.storage.corruptSnapshotManifest(pointer.snapshotId, JSON.stringify({ ...manifest, classificationProfileVersion: CURRENT_CLASSIFICATION_PROFILE_VERSION - 1 }));
  assert.equal((await h.coordinator.coordinateBootSync({ checkContent: true })).outcome, 'PROMOTED');
});
await test('INVALID_EMPTY_RESPONSE_NEVER_REPLACES_WORKING_CATALOG', async () => {
  const pointer = await h.storage.readActivePointer(), checkpoint = h.checkpoint(); h.setBody('<html>Upstream temporarily unavailable</html>');
  assert.equal((await h.coordinator.coordinateBootSync({ checkContent: true })).outcome, 'VALIDATION_FAILED');
  assert.deepEqual(await h.storage.readActivePointer(), pointer); assert.deepEqual(h.checkpoint(), checkpoint);
});
await test('DETAIL_OPENED_DURING_DOWNLOAD_DEFERS_PROMOTION_AND_PRESERVES_IDENTITIES', async () => {
  const pointer = await h.storage.readActivePointer(), checkpoint = h.checkpoint();
  h.setBody(playlist(['Nova Primeira Posicao (2026)', 'Primeiro Filme (2026)', 'Novo Filme (2026)']));
  assert.equal((await h.coordinator.coordinateBootSync({ checkContent: true, canPromote: () => false })).outcome, 'LOCAL_FIRST_ACTIVE_PRESERVED');
  assert.deepEqual(await h.storage.readActivePointer(), pointer); assert.deepEqual(h.checkpoint(), checkpoint);
});
await test('REMOVED_TITLE_IS_REMOVED_WITHOUT_CHANGING_SOURCE_VERSION', async () => {
  h.setBody(playlist(['Primeiro Filme (2026)']));
  assert.equal((await h.coordinator.coordinateBootSync({ checkContent: true })).outcome, 'PROMOTED');
  assert.equal((await h.storage.readActiveCatalog()).movies.length, 1);
});
await test('FAILED_PROMOTION_NEVER_COMMITS_NEW_CONTENT_DIGEST', async () => {
  const pointer = await h.storage.readActivePointer(), checkpoint = h.checkpoint(), promote = h.bootstrap.promoteStagedSnapshot;
  h.setBody(playlist(['Primeiro Filme (2026)', 'Outra Adicao (2026)']));
  h.bootstrap.promoteStagedSnapshot = async () => ({ success: false, status: 'FAILED', errors: ['fixture promotion failure'] });
  try {
    assert.equal((await h.coordinator.coordinateBootSync({ checkContent: true })).outcome, 'PROMOTION_FAILED');
    assert.deepEqual(await h.storage.readActivePointer(), pointer); assert.deepEqual(h.checkpoint(), checkpoint);
  } finally { h.bootstrap.promoteStagedSnapshot = promote; }
});
await test('WEB_STREAM_DIGEST_AND_UNCHANGED_FALLBACK_MATCH_RAW_UTF8', async () => {
  const body = playlist(['Filme com acentuação (2026)']), storage = new InMemoryCatalogStorage();
  const options = { storage, snapshotId: 'web-first', fetchImpl: async () => new Response(body) };
  const first = await RealSourceImporterService.importM3u({ type: 'M3U', playlistUrl: 'https://fixture.invalid/source' }, options);
  assert.equal(first.contentDigest, hash(body));
  const second = await RealSourceImporterService.importM3u({ type: 'M3U', playlistUrl: 'https://fixture.invalid/source' }, { ...options, snapshotId: 'web-second', unchangedContentDigest: first.contentDigest });
  assert.equal(second.notModified, true); assert.equal(await storage.readStaging('web-second'), null);
});
await test('XTREAM_ALL_205_MOVIES_130_SERIES_150_CHANNELS_MATERIALIZED', async () => {
  const storage = new InMemoryCatalogStorage();
  const lists = { get_vod_categories: [{ category_id: '1', category_name: 'Movies' }], get_series_categories: [{ category_id: '2', category_name: 'Series' }], get_live_categories: [{ category_id: '3', category_name: 'Live' }],
    get_vod_streams: Array.from({ length: 205 }, (_, i) => ({ stream_id: i + 1, name: 'Movie ' + i, category_id: '1', stream_icon: 'https://fixture.invalid/poster.jpg' })),
    get_series: Array.from({ length: 130 }, (_, i) => ({ series_id: i + 1, name: 'Series ' + i, category_id: '2', cover: 'https://fixture.invalid/poster.jpg' })),
    get_live_streams: Array.from({ length: 150 }, (_, i) => ({ stream_id: i + 1, name: 'Channel ' + i, category_id: '3' })), };
  const fetchImpl = async url => Response.json(lists[new URL(url).searchParams.get('action')] || { user_info: { auth: 1 } });
  const first = await RealSourceImporterService.importXtream({ type: 'XTREAM', host: 'https://fixture.invalid', username: 'fixture', password: 'fixture' }, { fetchImpl, storage, snapshotId: 'xtream-test', provenance: { kind: 'REAL', sourceId: 'fixture', sourceVersion: 1 } });
  assert.deepEqual([first.segmentedStaging.manifest.counts.movies, first.segmentedStaging.manifest.counts.series, first.segmentedStaging.manifest.counts.live], [205, 130, 150]);
  for (const [kind, expected] of [['movies', 205], ['series', 130], ['live', 150]]) assert.equal(first.segmentedStaging.manifest.segments.filter(e => e.kind === kind).reduce((n, e) => n + e.recordCount, 0), expected);
  const noChange = await RealSourceImporterService.importXtream({ type: 'XTREAM', host: 'https://fixture.invalid', username: 'fixture', password: 'fixture' }, { fetchImpl, storage, unchangedContentDigest: first.contentDigest });
  assert.equal(noChange.notModified, true); assert.equal(noChange.segmentedStaging, undefined);
});
await test('XTREAM_PARTIAL_FAILED_LIST_REJECTED_INSTEAD_OF_EMPTY_SUCCESS', async () => {
  await assert.rejects(() => RealSourceImporterService.importXtream({ type: 'XTREAM', host: 'https://fixture.invalid', username: 'fixture', password: 'fixture' }, { fetchImpl: async url => new URL(url).searchParams.has('action') ? new Response('', { status: 503 }) : Response.json({ user_info: { auth: 1 } }) }), /XTREAM_LIST_FETCH_FAILED/);
});
await test('SCHEDULER_FOREGROUND_COOLDOWN_BACKOFF_AND_SINGLE_FLIGHT', async () => {
  let now = 1000000, permitted = false, count = 0, clock = { attemptedAt: 0, succeededAt: 0 }, outcome = 'NO_OP';
  const deps = { now: () => now, canRun: () => permitted, check: async () => { count++; return { outcome }; }, readClock: () => clock, saveClock: v => { clock = v; } };
  const scheduler = new AutomaticSourceRefresh(deps);
  await scheduler.tick(); assert.equal(count, 0); permitted = true;
  await Promise.all(Array.from({ length: 8 }, () => scheduler.tick())); assert.equal(count, 1);
  now += SOURCE_REFRESH_INTERVAL_MS - 1; await scheduler.tick(); assert.equal(count, 1);
  now++; outcome = 'LOCAL_FIRST_ACTIVE_PRESERVED'; await scheduler.tick(); assert.equal(count, 2);
  now += SOURCE_REFRESH_RETRY_MS - 1; await scheduler.tick(); assert.equal(count, 2);
  now++; outcome = 'PROMOTED'; await scheduler.tick(); assert.equal(count, 3);
  const restart = new AutomaticSourceRefresh(deps); await restart.tick(); assert.equal(count, 3);
  now += SOURCE_REFRESH_INTERVAL_MS; permitted = false; await restart.tick(); assert.equal(count, 3);
  permitted = true; await restart.tick(); assert.equal(count, 4); restart.stop(); now += SOURCE_REFRESH_INTERVAL_MS; await restart.tick(); assert.equal(count, 4);
  const firstBoot = new AutomaticSourceRefresh({ ...deps, readClock: () => ({ attemptedAt: 0, succeededAt: 0 }) });
  firstBoot.recordSuccessfulCheck(); await firstBoot.tick(); assert.equal(count, 4);
});
await test('REAL_FOREGROUND_POLICY_DEFERS_DETAILS_LIVE_MODAL_AND_ALL_PLAYING_STATES', async () => {
  const input = { visible: true, online: true, view: 'home', playbackState: 'IDLE', modalOpen: false };
  for (const view of ['home', 'movies', 'series', 'search']) assert.equal(canRefreshCatalog({ ...input, view }), true);
  for (const view of ['movie-detail', 'series-detail', 'live', 'portal', 'manager-panel']) assert.equal(canRefreshCatalog({ ...input, view }), false);
  for (const playbackState of ['PLAYING', 'PAUSED', 'BUFFERING', 'RESOLVING', 'READY_TO_START', 'OPENING_NATIVE_PLAYER']) assert.equal(canRefreshCatalog({ ...input, playbackState }), false);
  assert.equal(canRefreshCatalog({ ...input, visible: false }), false); assert.equal(canRefreshCatalog({ ...input, online: false }), false);
  assert.equal(canRefreshCatalog({ ...input, modalOpen: true }), false);
});
await test('OPTIONAL_CACHE_CORRUPTION_AND_CLOCK_ROLLBACK_ARE_SAFE', async () => {
  globalThis.window = { localStorage: { getItem: () => '{broken', setItem() {} } };
  assert.equal(localSourceContentRepository.read(), null); assert.deepEqual(readRefreshClock(), { attemptedAt: 0, succeededAt: 0 });
  window.localStorage.getItem = () => JSON.stringify({ attemptedAt: Date.now() + 999999, succeededAt: Date.now() + 999999 });
  assert.deepEqual(readRefreshClock(), { attemptedAt: 0, succeededAt: 0 }); delete globalThis.window;
});
console.log(`C60 automatic source refresh: ${passed} tests passed`);
