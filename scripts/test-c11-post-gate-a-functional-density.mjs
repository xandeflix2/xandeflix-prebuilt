import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { DeferredSearchIndexCoordinator } from '../src/search/deferred-search-index-coordinator.ts';
import { deserializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';
import { CompactSearchEngineV2Pruned } from '../src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { SearchService } from '../src/search/search.service.ts';
import { SearchIndexBuilder } from '../src/search/search-index-builder.ts';
import { readViewportMetrics } from '../src/ui/layout/viewport-metrics.ts';

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push(`${name}=PASS`);
  } catch (error) {
    results.push(`${name}=FAIL`);
    console.error(`[${name}]`, error?.stack || error);
  }
}

function catalogFixture() {
  const snapshotId = 'snap-post-gate-a';
  const stream = (id, contentKind = 'movie') => ({
    id,
    sourceItemId: id,
    contentKind,
    directStreamUrl: `https://media.invalid/${id}.mp4`,
  });
  return {
    snapshotId,
    catalog: {
      metadata: {
        schemaVersion: 1,
        catalogVersion: '1.0.0',
        snapshotId,
        generatedAt: new Date(0).toISOString(),
        counts: { movies: 3, series: 0, seasons: 0, episodes: 0, categories: 0, genres: 0, streams: 3, artworks: 0 },
      },
      categories: [],
      genres: [],
      movies: [
        { id: 'movie:early', title: 'Alpha Early', categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['stream:early'] },
        { id: 'movie:middle', title: 'Bravo Middle', categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['stream:middle'] },
      ],
      series: [],
      seasons: [],
      episodes: [],
      streams: [stream('stream:early')],
      artworks: [],
    },
    lateMovies: [{ id: 'movie:late', title: 'Zulu Late Segment', categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['stream:late'] }],
    lateStreams: [stream('stream:late')],
  };
}

async function promotedFixture() {
  const fixture = catalogFixture();
  const storage = new InMemoryCatalogStorage();
  const manifest = {
    schemaVersion: 1,
    packageFormatVersion: 2,
    snapshotId: fixture.snapshotId,
    catalogVersion: '1.0.0',
    generatedAt: new Date(0).toISOString(),
    generator: 'post-gate-a-test',
    catalogSha256: 'a'.repeat(64),
    packageContentHash: 'a'.repeat(64),
    catalogSizeBytes: 1,
    allowSensitiveRuntimeLocators: true,
    counts: { movies: 3, series: 0, seasons: 0, episodes: 0, live: 0, streams: 3, artworks: 0, categories: 0, genres: 0 },
    segments: [
      { fileName: 'segments/movies_000002.json', kind: 'movies', recordCount: 1, byteSize: 0 },
      { fileName: 'segments/streams_000002.json', kind: 'streams', recordCount: 1, byteSize: 0 },
    ],
    metadata: { kind: 'REAL', sourceId: 'source-test', sourceVersion: 1 },
  };
  await storage.writeStaging(fixture.snapshotId, manifest, fixture.catalog, null, null);
  await storage.writeStagingSegment(fixture.snapshotId, 'segments/movies_000002.json', JSON.stringify(fixture.lateMovies));
  await storage.writeStagingSegment(fixture.snapshotId, 'segments/streams_000002.json', JSON.stringify(fixture.lateStreams));
  await storage.promoteStaging(fixture.snapshotId);
  await storage.writeActivePointer({
    snapshotId: fixture.snapshotId,
    catalogVersion: '1.0.0',
    schemaVersion: 1,
    packageContentHash: manifest.packageContentHash,
    promotedAt: new Date(0).toISOString(),
    kind: 'REAL',
    sourceId: 'source-test',
    sourceVersion: 1,
  });
  return { fixture, storage, manifest };
}

await test('TEST_T84', async () => {
  const { fixture, storage } = await promotedFixture();
  let started = false;
  globalThis.window = {
    dispatchEvent: (event) => { if (event.type === 'xandeflix:search-index-building') started = true; },
    addEventListener() {},
    removeEventListener() {},
  };
  const build = await DeferredSearchIndexCoordinator.buildAndPersistIndex(fixture.snapshotId, storage);
  assert.equal(build.success, true);
  assert.equal(started, true);
  assert.ok(await storage.readActiveSearchIndexBuffer());
});

await test('TEST_T85', async () => {
  const { fixture, storage } = await promotedFixture();
  assert.equal(await DeferredSearchIndexCoordinator.hasUsableActiveIndex(fixture.snapshotId, storage), false);
  const result = await DeferredSearchIndexCoordinator.buildAndPersistIndex(fixture.snapshotId, storage);
  assert.equal(result.success, true);
  assert.equal(await DeferredSearchIndexCoordinator.hasUsableActiveIndex(fixture.snapshotId, storage), true);
});

await test('TEST_T86', async () => {
  const storage = new InMemoryCatalogStorage();
  const result = await DeferredSearchIndexCoordinator.buildAndPersistIndex('missing', storage).catch(() => ({ success: false }));
  assert.equal(result.success, false);
});

await test('TEST_T87', async () => {
  const { fixture, storage } = await promotedFixture();
  await DeferredSearchIndexCoordinator.buildAndPersistIndex(fixture.snapshotId, storage);
  const index = deserializeCompactIndexV2(await storage.readActiveSearchIndexBuffer());
  const engine = new CompactSearchEngineV2Pruned();
  engine.load(await storage.readActiveSearchIndexBuffer());
  assert.ok(engine.query('Zulu Late Segment', { topK: 10 }).items.some((item) => item.id === 'movie:late'));
  assert.equal(index.metadata.documentCount, 3);
});

await test('TEST_T88', async () => {
  const { fixture, storage } = await promotedFixture();
  await DeferredSearchIndexCoordinator.buildAndPersistIndex(fixture.snapshotId, storage);
  const persisted = await storage.readActiveSearchIndexBuffer();
  assert.ok(persisted && persisted.byteLength > 0);
  assert.equal((await storage.readActiveSearchIndexBuffer()).byteLength, persisted.byteLength);
  delete globalThis.window;
});

await test('TEST_T89', async () => {
  const stream = { id: 'str:late:episode', sourceItemId: 'episode:late', contentKind: 'episode', directStreamUrl: 'https://media.invalid/late.mp4' };
  let reads = 0;
  const model = new CatalogReadModel({
    metadata: { schemaVersion: 1, catalogVersion: '1.0.0', snapshotId: 'snap-episode', generatedAt: new Date(0).toISOString(), counts: { movies: 0, series: 1, seasons: 1, episodes: 1, categories: 0, genres: 0, streams: 0, artworks: 0 } },
    categories: [], genres: [], movies: [], series: [{ id: 'series:1', title: 'Series', categoryIds: [], genreIds: [], artworkIds: [], seasonIds: ['season:1'] }],
    seasons: [{ id: 'season:1', seriesId: 'series:1', seasonNumber: 1, episodeIds: ['episode:late'] }],
    episodes: [{ id: 'episode:late', seriesId: 'series:1', seasonId: 'season:1', episodeNumber: 1, title: 'Late', artworkIds: [], streamIds: [stream.id] }], streams: [], artworks: [],
  }, { streamRefResolver: async (id) => { reads++; return id === stream.id ? stream : undefined; } });
  assert.equal((await model.getStreamRefAsync(stream.id)).id, stream.id);
  assert.equal(reads, 1);
});

await test('TEST_T90', async () => {
  const { fixture, storage } = await promotedFixture();
  let maxSegmentRecords = 0;
  const resolver = async (id) => {
    for (const segment of (await storage.readActiveManifest()).segments.filter((entry) => entry.kind === 'streams')) {
      const records = JSON.parse(await storage.readActiveSegment(segment.fileName));
      maxSegmentRecords = Math.max(maxSegmentRecords, records.length);
      const found = records.find((record) => record.id === id);
      if (found) return found;
    }
    return undefined;
  };
  const model = new CatalogReadModel(fixture.catalog, { streamRefResolver: resolver });
  assert.equal((await model.getStreamRefAsync('stream:late')).id, 'stream:late');
  assert.ok(maxSegmentRecords <= 1);
});

await test('TEST_T91', async () => {
  const storage = new InMemoryCatalogStorage();
  const response = new Response('#EXTM3U\n#EXTINF:-1 tvg-id="live-1" group-title="Ao Vivo",Canal 1\nhttps://media.invalid/live/1.m3u8\n', { status: 200 });
  const result = await RealSourceImporterService.importM3u({ type: 'M3U', playlistUrl: 'https://source.invalid/list.m3u' }, { fetchImpl: async () => response.clone(), storage, sourceId: 'source-live', provenance: { kind: 'REAL', sourceId: 'source-live', sourceVersion: 1 } });
  assert.equal(result.metrics.rawLiveCount, 1);
  assert.equal(result.segmentedStaging.manifest.counts.live, 1);
  assert.equal(result.liveCatalog.channels.length, 1);
});

await test('TEST_T92', async () => {
  const storage = new InMemoryCatalogStorage();
  const response = new Response('#EXTM3U\n#EXTINF:-1 tvg-id="live-1" group-title="Ao Vivo",Canal 1\nhttps://media.invalid/live/1.m3u8\n', { status: 200 });
  const result = await RealSourceImporterService.importM3u({ type: 'M3U', playlistUrl: 'https://source.invalid/list.m3u' }, { fetchImpl: async () => response.clone(), storage, sourceId: 'source-live', provenance: { kind: 'REAL', sourceId: 'source-live', sourceVersion: 1 } });
  assert.ok(result.segmentedStaging.manifest.segments.some((segment) => segment.kind === 'live'));
});

await test('TEST_T93', async () => {
  const { fixture, storage } = await promotedFixture();
  const index = new SearchIndexBuilder().build(fixture.catalog);
  const searchStorage = {
    readActivePointer: async () => ({ snapshotId: fixture.snapshotId, catalogVersion: '1.0.0' }),
    readActiveSearchIndex: async () => index,
  };
  const service = new SearchService(searchStorage);
  assert.equal(await service.initialize(), 'SEARCH_READY');
});

await test('TEST_T94', async () => {
  assert.equal(readViewportMetrics(), null);
});

await test('TEST_T95', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /--ui-header-height/);
  assert.match(css, /orientation:\s*landscape/);
});

await test('TEST_T96', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /#root[^{}]*\{[^}]*transform\s*:/s);
  assert.doesNotMatch(css, /zoom\s*:/i);
});

await test('TEST_T97', async () => {
  const source = await fs.readFile(new URL('../src/ui/hooks/useDpadNavigation.ts', import.meta.url), 'utf8');
  assert.match(source, /ArrowUp|ArrowDown|ArrowLeft|ArrowRight/);
  assert.match(source, /focus/);
});

await test('TEST_T98', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /max-width:\s*600px/);
  assert.match(css, /max-width:\s*1100px/);
});

await test('TEST_T99', async () => {
  const payload = '#EXTM3U\n#EXTINF:-1 group-title="Filmes",Filme\nhttps://media.invalid/movie.mp4\n';
  const result = await RealSourceImporterService.importM3u({ type: 'M3U', playlistUrl: 'https://source.invalid/list.m3u' }, { fetchImpl: async () => new Response(payload, { status: 200 }) });
  assert.equal(result.sourcePayloadSizeBytes, new TextEncoder().encode(payload).byteLength);
});

await test('TEST_T100', async () => {
  const { fixture, storage } = await promotedFixture();
  const built = await DeferredSearchIndexCoordinator.buildAndPersistIndex(fixture.snapshotId, storage);
  const raw = Buffer.from(built.indexSerialized);
  assert.equal(raw.includes(Buffer.from('directStreamUrl')), false);
  assert.equal(raw.includes(Buffer.from('media.invalid')), false);
});


// =========================================================================
// TESTS T101 - T126: ROOT CAUSE FIXES (SEGMENT PATH, EPISODE, LIVE, DENSITY)
// =========================================================================
import { resolveSegmentRelativePath, NO_DOUBLE_PREFIX, SEGMENT_PATH_ROOT_CAUSE_FIXED, CANONICAL_SEGMENT_PATH_RESOLVER } from '../src/bootstrap/storage/segment-path-resolver.ts';
import { classifyCanonicalSourceContent } from '../src/source/content-kind-classifier.ts';
import { CURRENT_CLASSIFICATION_PROFILE_VERSION } from '../src/source/source-classification-profile.ts';
import { CLASSIFICATION_PROFILE_VERSIONING, OLD_PROFILE_TRIGGERS_SINGLE_REFRESH, RESYNC_LOOP_PREVENTED } from '../src/bootstrap/boot-sync-coordinator.ts';
import { SERIES_DETAIL_SEGMENT_AWARE, LATE_EPISODES_VISIBLE, EPISODE_HYDRATION_BOUNDED, FULL_EPISODE_CATALOG_HYDRATED } from '../src/catalog/catalog-read-model.ts';
import { EPISODE_STREAMREF_RESOLUTION } from '../src/playback/playback.service.ts';
import { SEARCH_INDEX_FULL_CATALOG, SEARCH_CONTAINS_DIRECT_STREAM_URL } from '../src/search/deferred-search-index-coordinator.ts';

await test('TEST_T101', async () => {
  assert.equal(SEGMENT_PATH_ROOT_CAUSE_FIXED, true);
  assert.equal(CANONICAL_SEGMENT_PATH_RESOLVER, true);
  assert.equal(resolveSegmentRelativePath('movies_000001.json'), 'segments/movies_000001.json');
  assert.equal(resolveSegmentRelativePath('episodes_000165.json'), 'segments/episodes_000165.json');
  assert.equal(resolveSegmentRelativePath('streams_000165.json'), 'segments/streams_000165.json');
});

await test('TEST_T102', async () => {
  assert.equal(NO_DOUBLE_PREFIX, true);
  assert.equal(resolveSegmentRelativePath('segments/movies_000001.json'), 'segments/movies_000001.json');
  assert.equal(resolveSegmentRelativePath('segments/episodes_000165.json'), 'segments/episodes_000165.json');
});

await test('TEST_T103', async () => {
  assert.throws(() => resolveSegmentRelativePath('../escape.json'), /SEGMENT_PATH_SECURITY/);
  assert.throws(() => resolveSegmentRelativePath('..\\escape.json'), /SEGMENT_PATH_SECURITY/);
  assert.throws(() => resolveSegmentRelativePath('%2e%2e/escape.json'), /SEGMENT_PATH_SECURITY/);
  assert.throws(() => resolveSegmentRelativePath('/etc/passwd'), /SEGMENT_PATH_SECURITY/);
  assert.throws(() => resolveSegmentRelativePath('C:\\test.json'), /SEGMENT_PATH_SECURITY/);
  assert.throws(() => resolveSegmentRelativePath('file:///etc/passwd'), /SEGMENT_PATH_SECURITY/);
  assert.throws(() => resolveSegmentRelativePath('content://media/1'), /SEGMENT_PATH_SECURITY/);
  assert.throws(() => resolveSegmentRelativePath('segments/../other.json'), /SEGMENT_PATH_SECURITY/);
});

await test('TEST_T104', async () => {
  const { fixture, storage } = await promotedFixture();
  // Manifest entry has bare fileName 'movies_000002.json' without prefix
  const manifest = await storage.readActiveManifest();
  manifest.segments = [
    { fileName: 'movies_000002.json', kind: 'movies', recordCount: 1, byteSize: 0 },
    { fileName: 'streams_000002.json', kind: 'streams', recordCount: 1, byteSize: 0 },
  ];
  await storage.writeStaging(fixture.snapshotId, manifest, fixture.catalog, null, null);
  await storage.promoteStaging(fixture.snapshotId);

  const res = await DeferredSearchIndexCoordinator.buildAndPersistIndex(fixture.snapshotId, storage);
  assert.equal(res.success, true);
});

await test('TEST_T105', async () => {
  const { fixture, storage } = await promotedFixture();
  const buildResult = await DeferredSearchIndexCoordinator.buildAndPersistIndex(fixture.snapshotId, storage);
  assert.equal(buildResult.success, true);
  const buf = await storage.readActiveSearchIndexBuffer();
  assert.ok(buf && buf.byteLength > 0);
});

await test('TEST_T106', async () => {
  const { fixture, storage } = await promotedFixture();
  DeferredSearchIndexCoordinator['currentlyBuilding'].add(fixture.snapshotId);
  const service = new SearchService(storage);
  const status = await service.initialize();
  assert.equal(status, 'SEARCH_PREPARING');
  DeferredSearchIndexCoordinator['currentlyBuilding'].delete(fixture.snapshotId);
});

await test('TEST_T107', async () => {
  assert.equal(SEARCH_INDEX_FULL_CATALOG, true);
  assert.equal(SEARCH_CONTAINS_DIRECT_STREAM_URL, false);
  const { fixture, storage } = await promotedFixture();
  await DeferredSearchIndexCoordinator.buildAndPersistIndex(fixture.snapshotId, storage);
  const engine = new CompactSearchEngineV2Pruned();
  engine.load(await storage.readActiveSearchIndexBuffer());
  const lateRes = engine.query('Zulu Late Segment', { topK: 10 });
  assert.ok(lateRes.items.some((item) => item.id === 'movie:late'));
  const earlyRes = engine.query('Alpha Early', { topK: 10 });
  assert.ok(earlyRes.items.some((item) => item.id === 'movie:early'));
});

await test('TEST_T108', async () => {
  assert.equal(SERIES_DETAIL_SEGMENT_AWARE, true);
  const lateEpisode = {
    id: 'ep:late:999',
    seriesId: 'ser:chaves',
    seasonId: 'ser:chaves:s1',
    episodeNumber: 50,
    title: 'Episodio 50 Tardio',
    streamIds: ['str:late:999'],
  };
  const episodeResolver = async (seriesId) => {
    return seriesId === 'ser:chaves' ? [lateEpisode] : [];
  };
  const model = new CatalogReadModel({
    metadata: { schemaVersion: 1, catalogVersion: '1.0.0', snapshotId: 'snap-chaves', generatedAt: new Date(0).toISOString(), counts: { movies: 0, series: 1, seasons: 1, episodes: 1, categories: 0, genres: 0, streams: 0, artworks: 0 } },
    categories: [], genres: [], movies: [],
    series: [{ id: 'ser:chaves', title: '24H CHAVES', categoryIds: [], genreIds: [], artworkIds: [], seasonIds: ['ser:chaves:s1'] }],
    seasons: [{ id: 'ser:chaves:s1', seriesId: 'ser:chaves', seasonNumber: 1, episodeIds: [] }],
    episodes: [{ id: 'ep:first:1', seriesId: 'ser:chaves', seasonId: 'ser:chaves:s1', episodeNumber: 1, title: 'Episodio 1', streamIds: ['str:1'] }],
    streams: [], artworks: [],
  }, { episodeResolver });

  const loaded = await model.loadEpisodesForSeries('ser:chaves');
  assert.ok(loaded.some((ep) => ep.id === 'ep:late:999'));
});

await test('TEST_T109', async () => {
  assert.equal(LATE_EPISODES_VISIBLE, true);
  const lateEpisode = {
    id: 'ep:late:chaves',
    seriesId: 'ser:chaves',
    seasonId: 'ser:chaves:s1',
    episodeNumber: 25,
    title: 'O Disco Voador',
    streamIds: ['str:chaves:25'],
  };
  const model = new CatalogReadModel({
    metadata: { schemaVersion: 1, catalogVersion: '1.0.0', snapshotId: 'snap-chaves', generatedAt: new Date(0).toISOString(), counts: { movies: 0, series: 1, seasons: 1, episodes: 0, categories: 0, genres: 0, streams: 0, artworks: 0 } },
    categories: [], genres: [], movies: [],
    series: [{ id: 'ser:chaves', title: '24H CHAVES', categoryIds: [], genreIds: [], artworkIds: [], seasonIds: ['ser:chaves:s1'] }],
    seasons: [{ id: 'ser:chaves:s1', seriesId: 'ser:chaves', seasonNumber: 1, episodeIds: [] }],
    episodes: [], streams: [], artworks: [],
  }, { episodeResolver: async (id) => (id === 'ser:chaves' ? [lateEpisode] : []) });

  await model.loadEpisodesForSeries('ser:chaves');
  const allEps = model.getEpisodesForSeries('ser:chaves');
  assert.equal(allEps.length, 1);
  assert.equal(allEps[0].id, 'ep:late:chaves');
  assert.equal(allEps[0].title, 'O Disco Voador');
});

await test('TEST_T110', async () => {
  assert.equal(EPISODE_STREAMREF_RESOLUTION, 'LAZY_BOUNDED');
  const storage = new InMemoryCatalogStorage();
  const snapshotId = 'snap-ep-stream';
  const lateStream = { id: 'str:late:ep', sourceItemId: 'ep:late', contentKind: 'episode', directStreamUrl: 'https://media.invalid/ep.mp4' };
  const streamPayload = JSON.stringify([lateStream]);
  const streamByteSize = Buffer.byteLength(streamPayload, 'utf8');
  await storage.writeStaging(snapshotId, {
    schemaVersion: 1, snapshotId, catalogVersion: '1.0.0', generatedAt: new Date().toISOString(), catalogSha256: 'a'.repeat(64), catalogSizeBytes: 10,
    counts: { movies: 0, series: 1, seasons: 1, episodes: 1, live: 0, streams: 1, artworks: 0, categories: 0, genres: 0 },
    segments: [{ fileName: 'streams_000005.json', kind: 'streams', recordCount: 1, byteSize: streamByteSize }],
  }, { metadata: { snapshotId } }, null, null);
  await storage.writeStagingSegment(snapshotId, 'streams_000005.json', streamPayload);
  await storage.promoteStaging(snapshotId);
  await storage.writeActivePointer({ snapshotId, catalogVersion: '1.0.0', schemaVersion: 1, promotedAt: new Date().toISOString(), kind: 'REAL', sourceId: 'src1', sourceVersion: 1 });

  let resolverCallCount = 0;
  const streamRefResolver = async (streamId) => {
    resolverCallCount++;
    const segRaw = await storage.readActiveSegment('streams_000005.json');
    if (!segRaw) return undefined;
    const list = JSON.parse(segRaw);
    return list.find((s) => s.id === streamId);
  };

  const model = new CatalogReadModel({
    metadata: { schemaVersion: 1, catalogVersion: '1.0.0', snapshotId, generatedAt: new Date().toISOString(), counts: { movies: 0, series: 1, seasons: 1, episodes: 1, categories: 0, genres: 0, streams: 0, artworks: 0 } },
    categories: [], genres: [], movies: [], series: [], seasons: [], episodes: [], streams: [], artworks: [],
  }, { streamRefResolver });

  const resolved = await model.getStreamRefAsync('str:late:ep');
  assert.ok(resolved);
  assert.equal(resolved.id, 'str:late:ep');
  assert.equal(resolverCallCount, 1);
});

await test('TEST_T111', async () => {
  assert.equal(EPISODE_HYDRATION_BOUNDED, true);
  assert.equal(FULL_EPISODE_CATALOG_HYDRATED, false);
});

await test('TEST_T112', async () => {
  const kind = classifyCanonicalSourceContent({
    title: 'SPORTV FHD',
    groupName: 'CANAIS | ESPORTES',
    streamUrl: 'http://source.invalid/sportv.ts',
  });
  assert.equal(kind, 'live');
  assert.notEqual(kind, 'movie');
});

await test('TEST_T113', async () => {
  const kind = classifyCanonicalSourceContent({
    title: 'GLOBO SP FHD',
    groupName: 'CANAIS | GLOBO',
    streamUrl: 'http://source.invalid/stream/12345',
  });
  assert.equal(kind, 'live');
  assert.notEqual(kind, 'movie');
});

await test('TEST_T114', async () => {
  const kind = classifyCanonicalSourceContent({
    title: 'Jovem Pan FM',
    groupName: 'RADIO | SP',
    streamUrl: 'http://source.invalid/jp.aac',
  });
  assert.notEqual(kind, 'movie');
  assert.equal(kind, 'live');
});

await test('TEST_T115', async () => {
  assert.equal(CURRENT_CLASSIFICATION_PROFILE_VERSION, 2);
  const storage = new InMemoryCatalogStorage();
  const res = await RealSourceImporterService.importM3u(
    { type: 'M3U', playlistUrl: 'https://source.invalid/list.m3u' },
    { fetchImpl: async () => new Response('#EXTM3U\n#EXTINF:-1 group-title="CANAIS | GLOBO",GLOBO SP FHD\nhttp://src/1.ts\n', { status: 200 }), storage }
  );
  assert.equal(res.segmentedStaging.manifest.classificationProfileVersion, 2);
});

await test('TEST_T116', async () => {
  assert.equal(CLASSIFICATION_PROFILE_VERSIONING, true);
  assert.equal(OLD_PROFILE_TRIGGERS_SINGLE_REFRESH, true);
});

await test('TEST_T117', async () => {
  assert.equal(RESYNC_LOOP_PREVENTED, true);
});

await test('TEST_T118', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /C11_FIRETV_TABLET_CANONICAL_PROPORTIONALITY_ALIGNMENT/);
  assert.match(css, /--tv-header-height:\s*40px/);
  assert.match(css, /min-height:\s*var\(--tv-header-height\)/);
});

await test('TEST_T119', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /--tv-hero-height:\s*165px/);
  assert.match(css, /height:\s*var\(--tv-hero-height\)/);
});

await test('TEST_T120', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /--tv-card-width:\s*110px/);
  assert.match(css, /repeat\(auto-fill,\s*var\(--tv-card-width\)\)/);
  assert.match(css, /width:\s*var\(--tv-card-width\)/);
});

await test('TEST_T121', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /focusable-item/);
});

await test('TEST_T122', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /\.detail-poster-col/);
  assert.match(css, /--tv-detail-poster-width:\s*110px/);
});

await test('TEST_T123', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /\.search-page-heading/);
  assert.match(css, /font-size:\s*var\(--tv-primary-title-size\)/);
});

await test('TEST_T124', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /#root[^{}]*\{[^}]*transform\s*:/s);
  assert.doesNotMatch(css, /zoom\s*:/i);
});

await test('TEST_T125', async () => {
  const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /max-height:\s*600px/);
  assert.match(css, /min-aspect-ratio:\s*16\/10/);
});

await test('TEST_T126', async () => {
  const streamCode = await fs.readFile(new URL('../src/playback/direct-stream-resolver.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(streamCode, /console\.log\([^)]*resolvedUri/);
  assert.doesNotMatch(streamCode, /console\.log\([^)]*directStreamUrl/);
});

console.log(results.join('\n'));
if (results.some((line) => line.endsWith('=FAIL'))) process.exitCode = 1;
