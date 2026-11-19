import assert from 'node:assert/strict';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { PackageImporter } from '../src/bootstrap/package-importer.ts';
import { XuiM3uKindResolver, opaqueXuiTransport } from '../src/source/xui-m3u-kind-resolver.ts';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import ts from 'typescript';

const CONFIG = { type: 'M3U', playlistUrl: 'https://xui.fixture.invalid:8443/sub/get.php?username=fixture%2Buser&password=fixture%26pass&type=m3u_plus&output=mpegts' };
const PROVENANCE = { kind: 'REAL', sourceId: 'src_xuifixture', sourceVersion: 1 };
const liveUrl = 'https://media.fixture.invalid/play/opaque-live/ts?token=synthetic%2Bvalue';
const movieUrl = 'https://media.fixture.invalid/play/opaque-movie?token=synthetic%26value';
const body = '#EXTM3U\n' + [
  '#EXTINF:-1 xui-id="101" tvg-id="fixture.channel" group-title="Grupo A",Canal fixture', liveUrl,
  '#EXTINF:-1 xui-id="202" tvg-logo="https://art.fixture.invalid/poster.jpg" group-title="Grupo B",Filme fixture', movieUrl,
  '#EXTINF:-1 xui-id="303" group-title="Grupo C",Serie fixture S01E01', 'https://media.fixture.invalid/play/opaque-episode',
].join('\n');
let passed = 0;
async function test(name, run) { await run(); passed++; console.log('PASS ' + name); }
const lists = {
  get_live_categories: [{ category_id: '1', category_name: 'Grupo A' }],
  get_vod_categories: [{ category_id: '2', category_name: 'Grupo B' }],
  get_live_streams: [{ stream_id: 101, category_id: '1' }],
  get_vod_streams: [{ stream_id: 202, category_id: '2' }],
};
function fixture(options = {}) {
  const calls = [];
  const fetchImpl = async input => {
    const url = new URL(String(input));
    if (!url.pathname.endsWith('/player_api.php')) {
      const text = options.body ?? body;
      if (!options.chunked) return new Response(text);
      const bytes = new TextEncoder().encode(text); let offset = 0;
      return new Response(new ReadableStream({ pull(controller) {
        if (offset < bytes.length) controller.enqueue(bytes.slice(offset, ++offset)); else controller.close();
      } }));
    }
    assert.equal(url.origin, 'https://xui.fixture.invalid:8443');
    assert.equal(url.pathname, '/sub/player_api.php');
    assert.equal(url.searchParams.get('username'), 'fixture+user');
    assert.equal(url.searchParams.get('password'), 'fixture&pass');
    const action = url.searchParams.get('action'); calls.push(action || 'auth');
    if (options.fail) throw Error('PRIVATE_FIXTURE_ERROR');
    if (!action) return Response.json(options.auth ?? { user_info: { auth: 1, status: 'Active' } });
    if (action.endsWith('_streams')) assert.equal(url.searchParams.get('category_id'), action === 'get_live_streams' ? '1' : '2');
    const result = options[action] ?? lists[action];
    assert.ok(result !== undefined, 'No broad or series-detail API calls');
    return result instanceof Response ? result : Response.json(result);
  };
  return { calls, fetchImpl };
}
async function importFixture(options = {}, storage = new InMemoryCatalogStorage(), config = CONFIG, extra = {}) {
  const f = fixture(options), original = structuredClone(config);
  const result = await RealSourceImporterService.importM3u(config, { snapshotId: 'xui-candidate', storage,
    sourceId: PROVENANCE.sourceId, provenance: PROVENANCE, fetchImpl: f.fetchImpl, ...extra });
  assert.deepEqual(config, original);
  return { result, storage, calls: f.calls };
}

await test('OPAQUE_SOURCE_RESTORES_MOVIE_LIVE_AND_KEEPS_SERIES_URLS_IDS_ARTWORK', async () => {
  const { result, storage, calls } = await importFixture();
  assert.equal(result.success, true);
  assert.deepEqual([result.metrics.rawMovieCount, result.metrics.rawLiveCount, result.metrics.rawSeriesCount], [1, 1, 1]);
  assert.equal(result.catalog.movies[0].id, 'mov:m3u:1');
  assert.equal(result.catalog.series[0].id, 'ser:m3u:0');
  assert.equal(result.catalog.streams.find(s => s.contentKind === 'movie').directStreamUrl, movieUrl);
  assert.equal(result.liveCatalog.channels[0].streamRef.directStreamUrl, liveUrl);
  assert.equal(result.liveCatalog.channels[0].streamRef.containerExtension, 'ts');
  assert.equal(result.catalog.movies[0].posterUri, 'https://art.fixture.invalid/poster.jpg');
  assert.equal(result.catalog.categories.find(c => c.id === result.catalog.movies[0].categoryIds[0]).name, 'Grupo B');
  assert.equal(result.catalog.categories.find(c => c.id === result.catalog.series[0].categoryIds[0]).name, 'Grupo C');
  assert.equal(result.liveCatalog.groups[0].name, 'Grupo A');
  assert.deepEqual(calls, ['auth', 'get_live_categories', 'get_vod_categories', 'get_live_streams', 'get_vod_streams']);
  assert.equal(await storage.readActivePointer(), null);
  assert.equal((await new PackageImporter(storage).promoteStagedPackage('xui-candidate')).success, true);
  assert.equal((await storage.readActivePointer()).sourceId, PROVENANCE.sourceId);
});

await test('HLS_MPEGTS_AND_LEGACY_TS_KEEP_EXACT_SOURCE_URLS', async () => {
  for (const [output, suffix, extension] of [['hls', 'hls', 'm3u8'], ['hls', 'm3u8', 'm3u8'], ['mpegts', 'ts', 'ts'], ['ts', 'mpegts', 'ts']]) {
    const config = { ...CONFIG, playlistUrl: CONFIG.playlistUrl.replace('output=mpegts', 'output=' + output) };
    const url = liveUrl.replace('/ts?', '/' + suffix + '?');
    const { result } = await importFixture({ body: body.replace(liveUrl, url) }, undefined, config);
    assert.equal(result.success, true); assert.equal(result.liveCatalog.channels[0].streamRef.containerExtension, extension);
    assert.equal(result.liveCatalog.channels[0].streamRef.directStreamUrl, url);
    assert.equal(result.catalog.streams.find(s => s.contentKind === 'movie').directStreamUrl, movieUrl);
  }
  for (const url of ['file:///play/token/ts', 'https://media.fixture.invalid/play/token/unknown', 'https://media.fixture.invalid/not-play/token/ts', 'https://user:pass@media.fixture.invalid/play/token/ts']) assert.equal(opaqueXuiTransport(url), undefined);
});
await test('API_FAILURE_OR_UNCONFIRMED_TYPE_NEVER_PROMOTES_PARTIAL_CATALOG', async () => {
  const storage = new InMemoryCatalogStorage();
  await importFixture({}, storage); assert.equal((await new PackageImporter(storage).promoteStagedPackage('xui-candidate')).success, true);
  const active = await storage.readActivePointer(), manifest = await storage.readActiveManifest();
  for (const options of [
    { fail: true }, { auth: { user_info: { auth: 0 } } }, { auth: { user_info: { auth: 1, status: 'Disabled' } } },
    { get_live_categories: {} },
    { get_live_categories: [lists.get_live_categories[0], lists.get_live_categories[0]] },
    { get_live_streams: [{ stream_id: 101, category_id: '9' }] },
    { get_live_streams: [lists.get_live_streams[0], lists.get_live_streams[0]] },
    { get_live_streams: [{ stream_id: '1e2', category_id: '1' }] },
    { body: body.replace('xui-id="101"', 'xui-id="invalid"') },
    { body: body.replace('xui-id="101"', '') },
    { get_live_streams: new Response('private unavailable', { status: 503 }) },
    { get_live_streams: new Response('{invalid') },
    { get_live_streams: new Response(' '.repeat(16 * 1024 * 1024 + 1)) },
  ]) {
    const { result } = await importFixture(options, storage, CONFIG, { snapshotId: 'rejected-xui' });
    assert.equal(result.success, false); assert.equal(result.error, 'XUI_M3U_KIND_UNCONFIRMED'); assert.equal(result.errorStage, 'PARSE');
    assert.ok(!JSON.stringify(result).includes('PRIVATE_FIXTURE')); assert.ok(!JSON.stringify(result).includes('fixture.invalid'));
    assert.equal(await storage.readStaging('rejected-xui'), null);
    assert.deepEqual(await storage.readActivePointer(), active); assert.deepEqual(await storage.readActiveManifest(), manifest);
  }
});
await test('API_SCOPE_ABSENCE_AND_STRUCTURAL_RECORDS_NO_TYPE_GUESSING', async () => {
  const config = { type: 'M3U', playlistUrl: 'https://xui.fixture.invalid/list.m3u' };
  const opaque = await importFixture({}, undefined, config);
  assert.equal(opaque.result.success, false); assert.equal(opaque.calls.length, 0);
  const structural = '#EXTM3U\n#EXTINF:-1 group-title="Filmes",Movie\nhttps://media.fixture.invalid/movie/1.mp4\n#EXTINF:-1 group-title="Grupo C",Serie S01E01\nhttps://media.fixture.invalid/play/episode';
  const ok = await importFixture({ body: structural, fail: true });
  assert.equal(ok.result.success, true); assert.deepEqual(ok.calls, []); assert.equal(ok.result.catalog.series[0].id, 'ser:m3u:0');
});
await test('UTF8_CHUNK_BOUNDARIES_AND_LATE_FAILURE_CLEAN_STAGING_ONLY', async () => {
  const unicode = body.replace('Filme fixture', 'A\u00e7\u00e3o \ud83e\udded');
  const good = await importFixture({ body: unicode, chunked: true });
  assert.equal(good.result.catalog.movies[0].title, 'A\u00e7\u00e3o \ud83e\udded');
  const storage = good.storage;
  assert.equal((await new PackageImporter(storage).promoteStagedPackage('xui-candidate')).success, true);
  const pointer = await storage.readActivePointer();
  const late = '#EXTM3U\n' + Array.from({ length: 2600 }, (_, i) => '#EXTINF:-1,Movie ' + i + '\nhttps://media.fixture.invalid/movie/' + i + '.mp4\n').join('') + body.slice(8);
  const rejected = await importFixture({ body: late, fail: true }, storage, CONFIG, { snapshotId: 'late-failed' });
  assert.equal(rejected.result.success, false); assert.equal(await storage.readStaging('late-failed'), null);
  assert.deepEqual(await storage.readActivePointer(), pointer);
});
await test('EXACT_CATEGORY_NAMES_ID_MEMBERSHIP_AND_AMBIGUITY', async () => {
  const base = async action => !action ? { user_info: { auth: 1 } } : action.endsWith('_categories')
    ? [{ category_id: action === 'get_live_categories' ? '1' : '2', category_name: 'Same' }]
    : [{ stream_id: 101, category_id: action === 'get_live_streams' ? '1' : '2' }];
  await assert.rejects(new XuiM3uKindResolver(base).resolve('101', 'Same'), /XUI_M3U_KIND_UNCONFIRMED/);
  const resolver = new XuiM3uKindResolver(async action => !action ? { user_info: { auth: 1 } }
    : action === 'get_live_categories' ? [{ category_id: '1', category_name: 'Exato' }]
    : action === 'get_vod_categories' ? [] : [{ stream_id: 101, category_id: '1' }]);
  assert.equal(await resolver.resolve('101', 'EXATO'), undefined);
  assert.equal(await resolver.resolve('101', ' Exato '), 'live');
  assert.equal(await resolver.resolve('102', 'Exato'), undefined);
});
await test('SUCCESSFUL_API_ABSENCE_PRESERVES_LEGACY_UNRESOLVED_WITHOUT_FABRICATING_TYPE', async () => {
  for (const overrides of [{ get_live_categories: [{ category_id: '1', category_name: 'Different' }] },
    { get_live_streams: [{ stream_id: 999, category_id: '1' }] }]) {
    const { result } = await importFixture(overrides);
    assert.equal(result.success, true); assert.equal(result.metrics.rawUnresolvedCount, 1);
    assert.equal(result.metrics.rawLiveCount, 0); assert.equal(result.metrics.rawMovieCount, 1);
    assert.equal(result.metrics.rawSeriesCount, 1);
  }
});
await test('BOUNDED_LAZY_CATEGORY_LOOKUP_CACHES_ONCE', async () => {
  const calls = [];
  const resolver = new XuiM3uKindResolver(async (action, params) => {
    calls.push([action, params]);
    if (!action) return { user_info: { auth: 1 } };
    if (action === 'get_live_categories') return [{ category_id: '1', category_name: 'Group' }];
    if (action === 'get_vod_categories') return [];
    assert.deepEqual(params, { category_id: '1' });
    return Array.from({ length: 3000 }, (_, i) => ({ stream_id: i + 1, category_id: '1' }));
  });
  for (let i = 1; i <= 3000; i++) assert.equal(await resolver.resolve(String(i), 'Group'), 'live');
  assert.equal(calls.length, 4);
  for (const rows of [Array.from({ length: 513 }, (_, i) => ({ category_id: String(i + 1), category_name: 'Group' }))]) {
    const excessive = new XuiM3uKindResolver(async action => !action ? { user_info: { auth: 1 } } : rows);
    await assert.rejects(excessive.resolve('1', 'Group'), /XUI_M3U_KIND_UNCONFIRMED/);
  }
  const oversizedRows = new XuiM3uKindResolver(async action => !action ? { user_info: { auth: 1 } }
    : action === 'get_live_categories' ? [{ category_id: '1', category_name: 'Group' }]
    : action === 'get_vod_categories' ? [] : Array(100001).fill({ stream_id: 1, category_id: '1' }));
  await assert.rejects(oversizedRows.resolve('1', 'Group'), /XUI_M3U_KIND_UNCONFIRMED/);
  const categories = Array.from({ length: 257 }, (_, i) => ({ category_id: String(i + 1), category_name: 'Group ' + i }));
  const manyGroups = new XuiM3uKindResolver(async (action, params) => !action ? { user_info: { auth: 1 } }
    : action === 'get_live_categories' ? categories : action === 'get_vod_categories' ? [] : [{ stream_id: 1, category_id: params.category_id }]);
  for (let i = 0; i < 256; i++) assert.equal(await manyGroups.resolve('1', 'Group ' + i), 'live');
  await assert.rejects(manyGroups.resolve('1', 'Group 256'), /XUI_M3U_KIND_UNCONFIRMED/);
  const manyIds = new XuiM3uKindResolver(async (action, params) => !action ? { user_info: { auth: 1 } }
    : action === 'get_live_categories' ? categories.slice(0, 3) : action === 'get_vod_categories' ? []
      : Array.from({ length: 75000 }, (_, i) => ({ stream_id: i + 1, category_id: params.category_id })));
  for (let i = 0; i < 2; i++) assert.equal(await manyIds.resolve('1', 'Group ' + i), 'live');
  await assert.rejects(manyIds.resolve('1', 'Group 2'), /XUI_M3U_KIND_UNCONFIRMED/);
});
await test('OLD_CHECKPOINT_REBUILDS_ONCE_THEN_NATIVE_AND_STREAM_DIGESTS_MATCH', async () => {
  const text = '#EXTM3U\n#EXTINF:-1 group-title="Grupo",Movie\nhttps://media.fixture.invalid/movie/1.mp4';
  const rawDigest = createHash('sha256').update(text).digest('hex');
  const first = await importFixture({ body: text }, undefined, CONFIG, { unchangedContentDigest: rawDigest });
  assert.equal(first.result.success, true); assert.equal(first.result.notModified, undefined); assert.notEqual(first.result.contentDigest, rawDigest);
  let reads = 0, cleanups = 0;
  const nativeTransport = {
    startDownload: async () => ({ success: true, downloadId: 'synthetic', sourceContentDigest: rawDigest,
      bytesWritten: Buffer.byteLength(text), stage: 'DOWNLOAD_COMPLETE', httpResponseReceived: 'SIM', httpStatusClass: '2XX', retryable: false }),
    readChunk: async () => (++reads % 2 ? { done: false, dataText: text, bytesRead: Buffer.byteLength(text) } : { done: true, bytesRead: 0 }),
    cleanupDownload: async () => { cleanups++; return { success: true }; }, cancelDownload: async () => ({ success: true }),
  };
  const options = { nativeTransport, storage: new InMemoryCatalogStorage(), snapshotId: 'native-test', provenance: PROVENANCE };
  const native = await RealSourceImporterService.importM3u(CONFIG, options);
  assert.equal(native.contentDigest, first.result.contentDigest);
  const before = reads;
  const unchanged = await RealSourceImporterService.importM3u(CONFIG, { ...options, unchangedContentDigest: native.contentDigest });
  assert.equal(unchanged.notModified, true); assert.equal(reads, before); assert.equal(cleanups, 2);
});
await test('NATIVE_REFRESH_ERROR_IS_FAILED_REAL_DEFERRAL_STAYS_DEFERRED', async () => {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/ui/settings/active-source-status.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name.includes('google-cast') ? { hasGoogleCast: () => false } : {}, module, module.exports);
  const run = async (outcome, error) => module.exports.updateSourceCatalog({ canRun: async () => true, sync: async () => ({ outcome, ...(error ? { error } : {}) }) });
  assert.equal(await run('LOCAL_FIRST_ACTIVE_PRESERVED', 'IMPORT_FAILED'), 'failed');
  assert.equal(await run('LOCAL_FIRST_ACTIVE_PRESERVED'), 'deferred');
  assert.equal(await run('PROMOTED'), 'updated'); assert.equal(await run('NO_OP'), 'unchanged');
  assert.equal(await module.exports.updateSourceCatalog({ canRun: async () => false, sync: () => { throw Error('Must not run'); } }), 'deferred');
});

console.log(`XUI_M3U_RECOVERY_TESTS=${passed}_PASS\nXUI_M3U_RECOVERY=PASS`);
