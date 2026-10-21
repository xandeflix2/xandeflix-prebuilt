import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DIRECTORY_ROOTS_MODE, DIRECTORY_JSON_MAX_BYTES, deriveDirectoryRuntimeConfig, fetchDirectoryJson, buildDirectoryStreamUrl } from '../src/source/source-directory-api.ts';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { PackageImporter } from '../src/bootstrap/package-importer.ts';

// Entirely synthetic, no live provider, device state, or source credentials.
const CONFIG = { type: 'M3U', playlistUrl: 'https://directory.fixture.invalid:8443/get.php?username=fixture-user&password=fixture-pass&type=m3u_plus' };
const RUNTIME = deriveDirectoryRuntimeConfig(CONFIG);
const PROVENANCE = { kind: 'REAL', sourceId: 'src_directoryfixture', sourceVersion: 1 };
const encode = value => new TextEncoder().encode(value);
let passed = 0;
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }

class ObservedStorage extends InMemoryCatalogStorage {
  segmentWrites = 0;
  async writeStagingSegment(...args) { this.segmentWrites++; return super.writeStagingSegment(...args); }
}
const lists = {
  get_live_categories: [{ category_id: '1', category_name: 'Canais' }],
  get_vod_categories: [{ category_id: '2', category_name: 'Filmes' }],
  get_series_categories: [{ category_id: '3', category_name: 'Séries' }],
  get_live_streams: Array.from({ length: 121 }, (_, index) => ({ stream_id: index + 1, name: `Canal ${index + 1}`, category_id: '1' })),
  get_vod_streams: Array.from({ length: 2801 }, (_, index) => ({ stream_id: index + 1, name: `Filme Ação ${index + 1}`, category_id: '2', container_extension: 'mp4', stream_icon: 'https://artwork.fixture.invalid/poster.jpg' })),
  get_series: Array.from({ length: 503 }, (_, index) => ({ series_id: index + 1, name: `Série Élite ${index + 1}`, category_id: '3', cover: 'https://artwork.fixture.invalid/poster.jpg' })),
};
function fixture(storage, replacements = {}, calls = []) {
  return async (input, init) => {
    const url = new URL(String(input)), action = url.searchParams.get('action');
    assert.equal(url.origin, 'https://directory.fixture.invalid:8443');
    assert.equal(url.pathname, '/player_api.php');
    assert.equal(url.searchParams.get('username'), 'fixture-user');
    assert.equal(url.searchParams.get('password'), 'fixture-pass');
    assert.equal(init.headers.Accept, 'application/json');
    assert.equal(storage.segmentWrites, 0, 'No staging before all six lists finish');
    calls.push(action || 'handshake');
    if (!action) return Response.json({ user_info: { auth: 1, status: 'Active' } });
    const value = replacements[action] ?? lists[action];
    assert.ok(value !== undefined, 'Unexpected synthetic API request');
    return value instanceof Response ? value : Response.json(value);
  };
}
async function promote(storage, result) {
  const importer = new PackageImporter(storage);
  // Match the real segmented flow: the importer has already written canonical
  // staging. Re-staging its header through the monolithic path is forbidden.
  const staged = await storage.readStaging(result.segmentedStaging.snapshotId);
  assert.ok(staged); assert.equal(staged.catalog.extensions.sourceInventoryMode, DIRECTORY_ROOTS_MODE);
  const promotion = await importer.promoteStagedPackage(result.segmentedStaging.snapshotId);
  assert.equal(promotion.success, true, promotion.errors?.join('; '));
}
async function segmentRows(storage, manifest, kind) {
  const rows = [];
  for (const entry of manifest.segments.filter(entry => entry.kind === kind)) {
    rows.push(...JSON.parse(await storage.readStagingSegment(manifest.snapshotId, entry.fileName)));
  }
  return rows;
}

await test('SAME_ORIGIN_ADAPTER_REJECTS_UNDECLARED_OR_AMBIGUOUS_CREDENTIALS', async () => {
  assert.deepEqual(RUNTIME, { type: 'XTREAM', host: 'https://directory.fixture.invalid:8443', username: 'fixture-user', password: 'fixture-pass', playlistUrl: CONFIG.playlistUrl });
  assert.deepEqual(deriveDirectoryRuntimeConfig(RUNTIME), RUNTIME);
  for (const playlistUrl of [
    'https://directory.fixture.invalid/list.m3u?username=a&password=b',
    'https://directory.fixture.invalid/get.php?username=a',
    'https://directory.fixture.invalid/get.php?username=a&username=b&password=c',
    'https://user:pass@directory.fixture.invalid/get.php?username=a&password=b',
    'file:///get.php?username=a&password=b',
  ]) assert.equal(deriveDirectoryRuntimeConfig({ type: 'M3U', playlistUrl }), undefined);
  assert.equal(deriveDirectoryRuntimeConfig({ type: 'AUTO', playlistUrl: CONFIG.playlistUrl }), undefined);
  const padded = deriveDirectoryRuntimeConfig({ type: 'M3U', playlistUrl: 'https://directory.fixture.invalid/get.php?username=%20user%20&password=%20pass%20' });
  assert.equal(padded.username, ' user '); assert.equal(padded.password, ' pass ');
  assert.equal(deriveDirectoryRuntimeConfig(padded).password, ' pass ');
  assert.equal(buildDirectoryStreamUrl(RUNTIME, 'movie', '2801', 'mp4'), 'https://directory.fixture.invalid:8443/movie/fixture-user/fixture-pass/2801.mp4');
  assert.throws(() => buildDirectoryStreamUrl(RUNTIME, 'movie', '../1', 'mp4'), /DIRECTORY_STREAM_INVALID/);
  await assert.rejects(fetchDirectoryJson(RUNTIME, 'get_series_info', { password: 'replacement' }), /DIRECTORY_ACTION_INVALID/);
  await assert.rejects(fetchDirectoryJson(RUNTIME, 'search', { search: 'title' }), /DIRECTORY_ACTION_INVALID/);
});

await test('BOUNDED_JSON_PRESERVES_UTF8_AND_FAILS_CLOSED', async () => {
  const payload = encode(JSON.stringify({ title: 'Ação Élite 🧭' }));
  let index = 0;
  const fetchImpl = async () => new Response(new ReadableStream({
    pull(controller) { if (index < payload.length) controller.enqueue(payload.slice(index, ++index)); else controller.close(); },
  }));
  assert.deepEqual(await fetchDirectoryJson(RUNTIME, undefined, undefined, { fetchImpl }), { title: 'Ação Élite 🧭' });
  await assert.rejects(fetchDirectoryJson(RUNTIME, undefined, undefined, { fetchImpl: async () => new Response('{ invalid') }), /DIRECTORY_JSON_INVALID/);
  await assert.rejects(fetchDirectoryJson(RUNTIME, undefined, undefined, { fetchImpl: async () => new Response('denied', { status: 403 }) }), /DIRECTORY_JSON_FETCH_FAILED/);
  let generated = 0, cancelled = false;
  const bigChunk = new Uint8Array(65536).fill(65);
  await assert.rejects(fetchDirectoryJson(RUNTIME, undefined, undefined, { fetchImpl: async () => new Response(new ReadableStream({
    pull(controller) { generated += bigChunk.length; controller.enqueue(bigChunk); },
    cancel() { cancelled = true; },
  })) }), /DIRECTORY_JSON_TOO_LARGE/);
  assert.equal(cancelled, true, 'Oversized payload must cancel remaining transport');
});

const storage = new ObservedStorage();
let first;
await test('COMPLETE_ROOTS_ALL_LISTS_BEFORE_STAGING_AND_ATOMIC_PROMOTION', async () => {
  const calls = [];
  first = await RealSourceImporterService.importXtream(RUNTIME, {
    directoryRoots: true, snapshotId: 'directory-first', provenance: PROVENANCE, storage, fetchImpl: fixture(storage, {}, calls),
  });
  assert.equal(first.success, true);
  assert.equal(calls.length, 7);
  assert.deepEqual(new Set(calls), new Set(['handshake', ...Object.keys(lists)]));
  assert.equal(first.catalog.extensions.sourceInventoryMode, DIRECTORY_ROOTS_MODE);
  assert.deepEqual([first.metrics.rawMovieCount, first.metrics.rawSeriesCount, first.metrics.rawLiveCount], [2801, 503, 121]);
  const manifest = first.segmentedStaging.manifest;
  assert.deepEqual([manifest.counts.movies, manifest.counts.series, manifest.counts.live, manifest.counts.episodes], [2801, 503, 121, 0]);
  const movies = await segmentRows(storage, manifest, 'movies');
  const series = await segmentRows(storage, manifest, 'series');
  const streams = await segmentRows(storage, manifest, 'streams');
  const channels = await segmentRows(storage, manifest, 'live');
  assert.equal(movies.length, 2801); assert.equal(series.length, 503); assert.equal(channels.length, 121);
  assert.equal(movies.at(-1).id, 'movie:2801'); assert.equal(series.at(-1).id, 'series:503');
  assert.equal(streams.at(-1).directStreamUrl, buildDirectoryStreamUrl(RUNTIME, 'movie', '2801', 'mp4'));
  assert.equal(channels.at(-1).streamRef.directStreamUrl, buildDirectoryStreamUrl(RUNTIME, 'live', '121', 'm3u8'));
  assert.ok(series.every(row => row.seasonIds.length === 0), 'Episode details are intentionally fetched only after selection');
  assert.equal(await storage.readActivePointer(), null, 'Importer must never publish the candidate itself');
  await promote(storage, first);
  assert.equal((await storage.readActivePointer()).snapshotId, 'directory-first');
  assert.equal((await storage.readActiveCatalog()).extensions.sourceInventoryMode, DIRECTORY_ROOTS_MODE);
});

await test('UNCHANGED_DIRECTORY_SKIPS_STAGING_AND_PRESERVES_ACTIVE', async () => {
  const active = await storage.readActivePointer();
  storage.segmentWrites = 0;
  const unchanged = await RealSourceImporterService.importXtream(RUNTIME, {
    directoryRoots: true, unchangedContentDigest: first.contentDigest, snapshotId: 'directory-unchanged',
    provenance: PROVENANCE, storage, fetchImpl: fixture(storage),
  });
  assert.equal(unchanged.notModified, true);
  assert.equal(storage.segmentWrites, 0);
  assert.equal(await storage.readStaging('directory-unchanged'), null);
  assert.deepEqual(await storage.readActivePointer(), active);
});

await test('LATE_LIST_FAILURE_OR_DUPLICATE_NEVER_PUBLISHES_PARTIAL_ROOTS', async () => {
  const active = await storage.readActivePointer();
  for (const replacement of [new Response('unavailable', { status: 503 }), { error: 'invalid-list' }, [lists.get_series[0], lists.get_series[0]]]) {
    storage.segmentWrites = 0;
    await assert.rejects(RealSourceImporterService.importXtream(RUNTIME, {
      directoryRoots: true, snapshotId: 'directory-failed', provenance: PROVENANCE, storage,
      fetchImpl: fixture(storage, { get_series: replacement }),
    }), /DIRECTORY_JSON_FETCH_FAILED|XTREAM_LIST_INVALID/);
    assert.equal(storage.segmentWrites, 0);
    assert.equal(await storage.readStaging('directory-failed'), null);
    assert.deepEqual(await storage.readActivePointer(), active);
  }
});

await test('LEGACY_XTREAM_MODE_KEEPS_PREVIOUS_TAG_AND_STREAM_BEHAVIOR', async () => {
  const legacyStorage = new ObservedStorage();
  const legacy = await RealSourceImporterService.importXtream(RUNTIME, {
    snapshotId: 'legacy-xtream', provenance: PROVENANCE, storage: legacyStorage, fetchImpl: fixture(legacyStorage),
  });
  assert.equal(legacy.success, true);
  assert.equal(legacy.catalog.extensions.sourceInventoryMode, undefined);
  assert.equal(legacy.catalog.streams[0].directStreamUrl, undefined);
  assert.equal(legacy.liveCatalog.channels[0].streamRef.directStreamUrl, undefined);
  assert.deepEqual([legacy.metrics.rawMovieCount, legacy.metrics.rawSeriesCount, legacy.metrics.rawLiveCount], [2801, 503, 121]);
});

await test('DIRECTORY_LIVE_KEEPS_SOURCE_SELECTED_TS_OUTPUT', async () => {
  const tsConfig = deriveDirectoryRuntimeConfig({ ...CONFIG, playlistUrl: CONFIG.playlistUrl + '&output=ts' });
  const tsStorage = new ObservedStorage();
  const result = await RealSourceImporterService.importXtream(tsConfig, {
    directoryRoots: true, snapshotId: 'directory-ts-output', provenance: PROVENANCE,
    storage: tsStorage, fetchImpl: fixture(tsStorage),
  });
  assert.equal(result.liveCatalog.channels[0].streamRef.containerExtension, 'ts');
  assert.ok(result.liveCatalog.channels[0].streamRef.directStreamUrl.endsWith('/1.ts'));
});

await test('OUTPUT_ALIASES_PRESERVE_ORIGINAL_URL_AND_VOD_SERIES_ARTWORK', async () => {
  for (const [output, extension] of [
    ['hls', 'm3u8'], ['mpegts', 'ts'], ['ts', 'ts'], ['TS', 'ts'],
    ['MPEGTS', 'ts'], [' mpegts ', 'ts'], ['m3u8', 'm3u8'], ['unknown', 'm3u8'],
  ]) {
    const url = new URL(CONFIG.playlistUrl);
    url.searchParams.set('output', output);
    const config = deriveDirectoryRuntimeConfig({ ...CONFIG, playlistUrl: url.href });
    const originalConfig = structuredClone(config);
    const target = new ObservedStorage();
    const result = await RealSourceImporterService.importXtream(config, {
      directoryRoots: true, snapshotId: 'output-alias', provenance: PROVENANCE,
      storage: target, fetchImpl: fixture(target),
    });
    assert.equal(result.success, true);
    assert.deepEqual(config, originalConfig, 'Never rewrite the source configuration');
    assert.equal(result.liveCatalog.channels[0].streamRef.containerExtension, extension, output);
    assert.equal(result.liveCatalog.channels[0].streamRef.directStreamUrl,
      buildDirectoryStreamUrl(config, 'live', '1', extension));
    assert.deepEqual(result.catalog.movies, first.catalog.movies);
    assert.deepEqual(result.catalog.series, first.catalog.series);
    assert.deepEqual(result.catalog.artworks, first.catalog.artworks);
    assert.deepEqual([result.metrics.rawMovieCount, result.metrics.rawSeriesCount, result.metrics.rawLiveCount], [2801, 503, 121]);
    assert.equal(await target.readActivePointer(), null);
  }
});

const mpegtsConfig = deriveDirectoryRuntimeConfig({ ...CONFIG, playlistUrl: CONFIG.playlistUrl + '&output=mpegts' });
let repairedTs;
await test('OLD_DIRECTORY_DIGEST_REBUILDS_TS_WITH_ATOMIC_PROMOTION', async () => {
  const legacyHasher = createHash('sha256');
  for (const list of [lists.get_live_categories, lists.get_live_streams, lists.get_vod_categories,
    lists.get_vod_streams, lists.get_series_categories, lists.get_series]) {
    legacyHasher.update('[');
    for (const row of list) legacyHasher.update(JSON.stringify(row) + '\n');
    legacyHasher.update(']');
  }
  const legacyDigest = legacyHasher.digest('hex');
  assert.equal(first.contentDigest, legacyDigest, 'Existing HLS checkpoints remain compatible');
  const active = await storage.readActivePointer();
  storage.segmentWrites = 0;
  repairedTs = await RealSourceImporterService.importXtream(mpegtsConfig, {
    directoryRoots: true, unchangedContentDigest: legacyDigest, snapshotId: 'directory-ts-repaired',
    provenance: PROVENANCE, storage, fetchImpl: fixture(storage),
  });
  assert.equal(repairedTs.success, true);
  assert.notEqual(repairedTs.notModified, true, 'Old raw digest cannot retain the incorrect HLS channel');
  assert.notEqual(repairedTs.contentDigest, legacyDigest);
  assert.ok(storage.segmentWrites > 0);
  assert.deepEqual(await storage.readActivePointer(), active, 'Candidate is not active before promotion');
  const channels = await segmentRows(storage, repairedTs.segmentedStaging.manifest, 'live');
  assert.ok(channels.every(channel => channel.streamRef.containerExtension === 'ts'));
  assert.equal(channels[0].id, first.liveCatalog.channels[0].id);
  await promote(storage, repairedTs);
  assert.equal((await storage.readActivePointer()).snapshotId, 'directory-ts-repaired');
});

await test('REPAIRED_TS_DIGEST_SKIPS_UNCHANGED_IMPORT', async () => {
  const active = await storage.readActivePointer();
  storage.segmentWrites = 0;
  const result = await RealSourceImporterService.importXtream(mpegtsConfig, {
    directoryRoots: true, unchangedContentDigest: repairedTs.contentDigest, snapshotId: 'ts-still-current',
    provenance: PROVENANCE, storage, fetchImpl: fixture(storage),
  });
  assert.equal(result.notModified, true);
  assert.equal(storage.segmentWrites, 0);
  assert.equal(await storage.readStaging('ts-still-current'), null);
  assert.deepEqual(await storage.readActivePointer(), active);
});

await test('MPEGTS_PARTIAL_OR_UNAUTHORIZED_REFRESH_PRESERVES_ACTIVE', async () => {
  const active = await storage.readActivePointer();
  storage.segmentWrites = 0;
  await assert.rejects(RealSourceImporterService.importXtream(mpegtsConfig, {
    directoryRoots: true, unchangedContentDigest: repairedTs.contentDigest, snapshotId: 'ts-partial',
    provenance: PROVENANCE, storage,
    fetchImpl: fixture(storage, { get_series: new Response('unavailable', { status: 503 }) }),
  }), /DIRECTORY_JSON_FETCH_FAILED/);
  assert.equal(storage.segmentWrites, 0);
  assert.deepEqual(await storage.readActivePointer(), active);
  let calls = 0;
  const denied = await RealSourceImporterService.importXtream(mpegtsConfig, {
    directoryRoots: true, snapshotId: 'ts-denied', provenance: PROVENANCE, storage,
    fetchImpl: async () => { calls++; return Response.json({ user_info: { auth: 0, status: 'Disabled' } }); },
  });
  assert.equal(denied.success, false);
  assert.equal(denied.error, 'HANDSHAKE_AUTH_REJECTED');
  assert.equal(calls, 1);
  assert.equal(storage.segmentWrites, 0);
  assert.deepEqual(await storage.readActivePointer(), active);
});

await test('DIRECT_M3U_HLS_AND_MPEGTS_KEEP_PLAYLIST_AND_MEDIA_URL_AUTHORITY', async () => {
  for (const [output, extension] of [['hls', 'm3u8'], ['mpegts', 'ts']]) {
    const config = { ...CONFIG, playlistUrl: CONFIG.playlistUrl + '&output=' + output };
    const media = 'https://media.fixture.invalid/live/1.' + extension;
    const target = new ObservedStorage();
    let calls = 0;
    const result = await RealSourceImporterService.importM3u(config, {
      snapshotId: 'm3u-' + output, provenance: PROVENANCE, storage: target,
      fetchImpl: async input => {
        calls++;
        assert.equal(String(input), config.playlistUrl);
        return new Response('#EXTM3U\n#EXTINF:-1 group-title="Canais",Canal fixture\n' + media + '\n');
      },
    });
    assert.equal(result.success, true);
    assert.equal(calls, 1);
    assert.equal(result.liveCatalog.channels[0].streamRef.directStreamUrl, media);
    assert.equal(result.liveCatalog.channels[0].streamRef.containerExtension, extension);
  }
});

console.log(`C105 directory import: ${passed} tests passed`);
console.log('SOURCE_OUTPUT_FORMAT_REGRESSION=PASS');
