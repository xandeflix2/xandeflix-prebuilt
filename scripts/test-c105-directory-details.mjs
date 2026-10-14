import assert from 'node:assert/strict';
import { SourceDirectoryDetailsResolver, DIRECTORY_DETAILS_MAX_EPISODES, DIRECTORY_DETAILS_MAX_SERIES } from '../src/source/source-directory-details.ts';
import { DIRECTORY_ROOTS_MODE } from '../src/source/source-directory-api.ts';
import { createActiveCatalogReadModel } from '../src/ui/hooks/useActiveCatalog.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';

// All credentials, roots, URLs and responses below are isolated synthetic data.
const rootSeries = id => ({ id: `series:${id}`, title: `Série ${id}`, genreIds: [], categoryIds: ['series-group'], artworkIds: [], seasonIds: [], externalIds: { sourceItemId: String(id) } });
const payload = id => ({
  info: { series_id: String(id) },
  seasons: [{ season_number: 1, name: 'Primeira temporada', episode_count: 2 }, { season_number: 2, name: 'Segunda temporada', episode_count: 1 }],
  episodes: {
    1: [{ id: id * 100 + 2, episode_num: 2, season: 1, title: 'Ação — segundo 🧭', container_extension: 'mkv', info: { duration_secs: '1800', movie_image: 'https://images.synthetic.invalid/second.jpg' } },
      { id: id * 100 + 1, episode_num: 1, season: 1, title: 'Primeiro', container_extension: 'mp4' }],
    2: [{ id: id * 100 + 3, episode_num: 1, season: 2, title: 'Final', container_extension: 'mp4' }],
  },
});

function harness() {
  const initialSnapshot = 'directory-initial';
  let snapshotId = initialSnapshot, sourceVersion = 2, sourceId = 'src_fixture';
  let auth = true, sealedVersion = 2, fetchCalls = 0, sourceCalls = 0, response = payload(7);
  let fetchOperation = null;
  let roots = Array.from({ length: 12 }, (_, index) => rootSeries(index + 1));
  const header = {
    metadata: { schemaVersion: 1, catalogVersion: '1.0.0', snapshotId: initialSnapshot,
      generatedAt: '2026-10-14T00:00:00Z', counts: { movies: 0, series: roots.length, seasons: 0, episodes: 0, categories: 1, genres: 0, streams: 0, artworks: 0 } },
    categories: [{ id: 'series-group', name: 'Séries', contentKinds: ['series'] }], genres: [],
    movies: [], series: [roots[0]], seasons: [], episodes: [], streams: [], artworks: [],
    extensions: { sourceInventoryMode: DIRECTORY_ROOTS_MODE },
  };
  const pointer = () => ({ snapshotId, sourceId, sourceVersion, kind: 'REAL', catalogVersion: '1.0.0', schemaVersion: 1, packageContentHash: 'synthetic', promotedAt: '2026-10-14T00:00:00Z' });
  const storage = {
    async readActivePointer() { return pointer(); },
    async readActiveManifest() { return { snapshotId, metadata: { kind: 'REAL', sourceId, sourceVersion },
      segments: [{ kind: 'series', fileName: 'series_000001.json' }, { kind: 'streams', fileName: 'streams_000001.json' }] }; },
    async readActiveCatalog() { return { ...header, metadata: { ...header.metadata, snapshotId } }; },
    async readActiveSegment(path) {
      if (path.endsWith('series_000001.json')) return JSON.stringify(roots);
      if (path.endsWith('streams_000001.json')) return JSON.stringify([{ id: 'late-root-stream', sourceItemId: '77', contentKind: 'movie' }]);
      return null;
    },
    async writeActivePointer() { assert.fail('Hydration must never write active pointer'); },
    async writeStaging() { assert.fail('Hydration must never stage or mutate catalog'); },
    async writeStagingSegment() { assert.fail('Hydration must never mutate segments'); },
  };
  const options = {
    async resolveAuthorization() {
      sourceCalls++;
      return { status: auth ? 'SOURCE_READY' : 'DEVICE_REVOKED', remoteResultCode: auth ? 'SOURCE_READY' : 'DEVICE_REVOKED',
        remoteAuthorityAvailable: true, sourceStatus: 'ACTIVE', sourceId, sourceVersion, protocol: 'M3U', mode: 'MANAGED', licenseStatus: 'ACTIVE' };
    },
    secureSourceStore: { async get(id) { return {
      sourceId: id, sourceVersion: sealedVersion, protocol: 'M3U',
      sourceConfig: { playlistUrl: 'https://provider.synthetic.invalid/get.php?username=fixture&password=fixture&type=m3u_plus' },
    }; } },
    async fetchImpl(url) {
      fetchCalls++;
      const parsed = new URL(url);
      assert.equal(parsed.origin, 'https://provider.synthetic.invalid');
      assert.equal(parsed.pathname, '/player_api.php');
      assert.equal(parsed.searchParams.get('action'), 'get_series_info');
      if (fetchOperation) return await fetchOperation(parsed);
      return Response.json(response);
    },
  };
  const resolver = new SourceDirectoryDetailsResolver(storage, initialSnapshot, options);
  return { header, storage, options, resolver,
    counts: () => ({ fetchCalls, sourceCalls }),
    setResponse(value) { response = value; }, setAuth(value) { auth = value; },
    setSnapshot(value) { snapshotId = value; }, setSourceId(value) { sourceId = value; },
    setSourceVersion(value) { sourceVersion = value; }, setSealedVersion(value) { sealedVersion = value; },
    setFetchOperation(value) { fetchOperation = value; }, setRoots(value) { roots = value; },
  };
}

let passed = 0;
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }
const previousFetch = globalThis.fetch;
globalThis.fetch = async () => { throw Error('Live network forbidden in directory details fixture'); };
try {
  await test('SELECTED_SERIES_COMPLETE_DETAILS_PROVIDER_IDS_AND_PRIVATE_STREAMS', async () => {
    const h = harness(), before = JSON.stringify(h.header);
    const details = await h.resolver.resolveSeriesDetails('series:7');
    assert.equal(h.counts().fetchCalls, 1);
    assert.deepEqual(details.seasons.map(season => season.id), ['series:7:s1', 'series:7:s2']);
    assert.deepEqual(details.episodes.map(episode => episode.id), ['episode:7:701', 'episode:7:702', 'episode:7:703']);
    assert.equal(details.episodes[1].title, 'Ação — segundo 🧭');
    assert.equal(details.episodes[1].durationSeconds, 1800);
    assert.equal(details.episodes[1].thumbnailUri, 'https://images.synthetic.invalid/second.jpg');
    assert.equal(details.streams[0].contentKind, 'episode');
    const stream = await h.resolver.resolveStreamRef('str:episode:7:702');
    assert.equal(stream.directStreamUrl, 'https://provider.synthetic.invalid/series/fixture/fixture/702.mkv');
    assert.equal(h.counts().fetchCalls, 1, 'Stream resolution must reuse the selected-series cache');
    assert.equal(JSON.stringify(h.header), before, 'Immutable root snapshot must not change');
    assert.equal((await h.storage.readActivePointer()).snapshotId, h.header.metadata.snapshotId);
    assert.equal(await h.resolver.resolveStreamRef('str:movie:7'), undefined);
  });

  await test('CONCURRENT_SELECTED_SERIES_LOADS_SINGLE_FLIGHT', async () => {
    const h = harness();
    const started = Promise.withResolvers(), release = Promise.withResolvers();
    h.setFetchOperation(async () => { started.resolve(); await release.promise; return Response.json(payload(7)); });
    const requests = Array.from({ length: 10 }, () => h.resolver.resolveSeriesDetails('series:7'));
    await started.promise;
    assert.equal(h.counts().fetchCalls, 1);
    release.resolve();
    const results = await Promise.all(requests);
    assert.ok(results.every(result => result.episodes.length === 3));
    assert.equal(h.counts().fetchCalls, 1);
  });

  await test('PROVIDER_IDS_REMAIN_EXACT_BEYOND_JAVASCRIPT_SAFE_INTEGER', async () => {
    const h = harness(), id = '9007199254740993', episodeId = '9007199254740995';
    h.setRoots([rootSeries(id)]);
    h.setResponse({ info: { series_id: id }, seasons: [{ season_number: 1 }], episodes: {
      1: [{ id: episodeId, episode_num: 1, title: 'Exact ID', container_extension: 'mp4' }],
    } });
    const details = await h.resolver.resolveSeriesDetails(`series:${id}`);
    assert.equal(details.episodes[0].id, `episode:${id}:${episodeId}`);
    assert.ok(details.streams[0].directStreamUrl.endsWith(`/${episodeId}.mp4`));
  });

  await test('CACHE_REQUIRES_CURRENT_AUTHORITY_SEALED_VERSION_AND_GENERATION', async () => {
    const h = harness();
    await h.resolver.resolveSeriesDetails('series:7');
    h.setAuth(false);
    await assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_SOURCE_NOT_AUTHORIZED/);
    assert.equal(h.counts().fetchCalls, 1);
    h.setAuth(true); h.setSealedVersion(3);
    await assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_SOURCE_CONFIGURATION_MISMATCH/);
    assert.equal(h.counts().fetchCalls, 1);
    h.setSealedVersion(2);
    await h.resolver.resolveSeriesDetails('series:7');
    assert.equal(h.counts().fetchCalls, 2, 'Invalidated cache must not reappear after authorization changes');
    h.setSnapshot('directory-new');
    await assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_GENERATION_CHANGED/);
    assert.equal(h.counts().fetchCalls, 2);
  });

  await test('GENERATION_CHANGE_DURING_DOWNLOAD_REJECTS_WITHOUT_CACHING', async () => {
    const h = harness(), started = Promise.withResolvers(), release = Promise.withResolvers();
    h.setFetchOperation(async () => { started.resolve(); await release.promise; return Response.json(payload(7)); });
    const rejection = assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_GENERATION_CHANGED/);
    await started.promise; h.setSnapshot('replacement'); release.resolve(); await rejection;
    h.setSnapshot('directory-initial'); h.setFetchOperation(null);
    await h.resolver.resolveSeriesDetails('series:7');
    assert.equal(h.counts().fetchCalls, 2, 'Rejected late response must never populate cache');
  });

  await test('SOURCE_BINDING_CHANGES_REJECT_CACHED_DETAILS', async () => {
    const h = harness(); await h.resolver.resolveSeriesDetails('series:7');
    h.setSourceId('src_other');
    await assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_GENERATION_CHANGED/);
    assert.equal(h.counts().fetchCalls, 1);
    const v = harness(); await v.resolver.resolveSeriesDetails('series:7');
    v.setSourceVersion(3); v.setSealedVersion(3);
    await assert.rejects(v.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_GENERATION_CHANGED/);
    assert.equal(v.counts().fetchCalls, 1);
  });

  await test('MISSING_AND_FAILED_DETAILS_NEVER_BECOME_CACHED_EMPTY_SUCCESS', async () => {
    const h = harness();
    h.setResponse({ info: { series_id: 7 }, seasons: [] });
    await assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_SERIES_DETAILS_INVALID/);
    h.setFetchOperation(async () => new Response('', { status: 503 }));
    await assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_JSON_FETCH_FAILED/);
    h.setFetchOperation(null); h.setResponse(payload(7));
    assert.equal((await h.resolver.resolveSeriesDetails('series:7')).episodes.length, 3);
    assert.equal(h.counts().fetchCalls, 3);
    await assert.rejects(h.resolver.resolveSeriesDetails('series:999'), /DIRECTORY_SERIES_NOT_FOUND/);
    assert.equal(h.counts().fetchCalls, 3, 'Unknown root must not request provider details');
    const empty = harness(); empty.setResponse({ info: { series_id: 7 }, seasons: [], episodes: {} });
    assert.deepEqual(await empty.resolver.resolveSeriesDetails('series:7'), { seasons: [], episodes: [], streams: [] });
  });

  await test('MALFORMED_DUPLICATE_PARTIAL_AND_OVERSIZE_DETAILS_FAIL_CLOSED', async () => {
    for (const response of [
      { ...payload(7), info: { series_id: 8 } },
      { ...payload(7), episodes: { 1: [{ id: 1, episode_num: 1 }, { id: 1, episode_num: 2 }] } },
      { ...payload(7), episodes: { 1: [{ episode_num: 1 }] } },
      { ...payload(7), episodes: {} },
    ]) {
      const h = harness(); h.setResponse(response);
      await assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_SERIES_DETAILS_INVALID/);
    }
    const h = harness();
    h.setResponse({ info: { series_id: 7 }, seasons: [{ season_number: 1 }], episodes: {
      1: Array.from({ length: DIRECTORY_DETAILS_MAX_EPISODES + 1 }, (_, index) => ({ id: index + 1, episode_num: index + 1, title: 'Fixture' })),
    } });
    await assert.rejects(h.resolver.resolveSeriesDetails('series:7'), /DIRECTORY_DETAILS_LIMIT_EXCEEDED/);
  });

  await test('SELECTED_SERIES_CACHE_IS_BOUNDED_AND_ERRORS_ARE_NOT_CACHED', async () => {
    const h = harness(); h.setFetchOperation(async url => Response.json(payload(Number(url.searchParams.get('series_id')))));
    for (let id = 1; id <= DIRECTORY_DETAILS_MAX_SERIES + 1; id++) await h.resolver.resolveSeriesDetails(`series:${id}`);
    const before = h.counts().fetchCalls;
    await h.resolver.resolveSeriesDetails('series:1');
    assert.equal(h.counts().fetchCalls, before + 1, 'Oldest selected series must be evicted');
  });

  await test('ACTIVE_MODEL_LAZY_DETAIL_STREAM_RETRY_AND_SNAPSHOT_IMMUTABILITY', async () => {
    const h = harness(), service = new BootstrapService(h.storage);
    const model = createActiveCatalogReadModel(service, h.header, h.options);
    const before = JSON.stringify(h.header);
    await model.resolveSeriesById('series:7');
    h.setResponse({ seasons: [] });
    await assert.rejects(model.loadEpisodesForSeries('series:7'), /DIRECTORY_SERIES_DETAILS_INVALID/);
    assert.equal(model.getEpisodesForSeries('series:7').length, 0);
    h.setResponse(payload(7));
    const episodes = await model.loadEpisodesForSeries('series:7');
    assert.equal(episodes.length, 3);
    assert.equal(model.episodesById.get('episode:7:702').title, 'Ação — segundo 🧭');
    assert.equal((await model.getStreamRefAsync('str:episode:7:702')).contentKind, 'episode');
    assert.deepEqual(model.seriesById.get('series:7').seasonIds, ['series:7:s1', 'series:7:s2']);
    assert.equal(JSON.stringify(h.header), before);
    h.setAuth(false);
    await assert.rejects(model.getStreamRefAsync('str:episode:7:702'), /DIRECTORY_SOURCE_NOT_AUTHORIZED/);
    await assert.rejects(model.loadEpisodesForSeries('series:7'), /DIRECTORY_SOURCE_NOT_AUTHORIZED/);
  });

  await test('MODEL_MEMORY_EVICTS_OLD_SELECTED_EPISODES_WITHOUT_SNAPSHOT_MUTATION', async () => {
    const h = harness(); h.setFetchOperation(async url => Response.json(payload(Number(url.searchParams.get('series_id')))));
    const model = createActiveCatalogReadModel(new BootstrapService(h.storage), h.header, h.options);
    for (let id = 1; id <= DIRECTORY_DETAILS_MAX_SERIES + 1; id++) {
      await model.resolveSeriesById(`series:${id}`);
      await model.loadEpisodesForSeries(`series:${id}`);
    }
    assert.equal(model.getEpisodesForSeries('series:1').length, 0);
    assert.equal(model.episodesById.has('episode:1:101'), false);
    assert.equal(model.getStreamRef('str:episode:1:101'), undefined);
    assert.equal(model.episodesById.size, DIRECTORY_DETAILS_MAX_SERIES * 3);
    assert.equal(h.header.episodes.length, 0);
  });

  await test('NEW_ACTIVE_MODEL_HAS_OWN_SEGMENT_RESOLVERS_LEGACY_UNCHANGED', async () => {
    const h = harness();
    const catalog = { ...h.header, extensions: {} };
    const service = new BootstrapService(h.storage);
    const first = createActiveCatalogReadModel(service, catalog);
    assert.equal((await first.getStreamRefAsync('late-root-stream')).sourceItemId, '77');
    h.setSnapshot('legacy-new');
    await assert.rejects(first.getStreamRefAsync('late-root-stream'), /CATALOG_GENERATION_CHANGED/);
    const second = createActiveCatalogReadModel(service, { ...catalog, metadata: { ...catalog.metadata, snapshotId: 'legacy-new' } });
    assert.equal((await second.getStreamRefAsync('late-root-stream')).sourceItemId, '77');
    const legacy = new CatalogReadModel(catalog, { episodeResolver: async () => { throw Error('legacy fixture'); } });
    assert.deepEqual(await legacy.loadEpisodesForSeries('series:1'), [], 'Legacy resolution behavior remains unchanged');
  });
} finally { globalThis.fetch = previousFetch; }
console.log(`C105_DIRECTORY_DETAILS_TEST_COUNT=${passed}`);
console.log('C105_DIRECTORY_DETAILS_TESTS=PASS');
