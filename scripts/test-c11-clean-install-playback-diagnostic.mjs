import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { CanonicalItemResolver } from '../src/catalog/canonical-item-resolver.ts';
import { PlaybackService } from '../src/playback/playback.service.ts';

// Read-only diagnosis of CURRENT production code, not a fix/regression gate.
// All URIs are synthetic; native player/session authorization are controlled
// probes. No network, real credentials, device operations or file writes.
const hookFile = fileURLToPath(new URL('../src/ui/hooks/useActiveCatalog.ts', import.meta.url));
const hook = fs.readFileSync(hookFile, 'utf8');
const ast = ts.createSourceFile(hookFile, hook, ts.ScriptTarget.Latest, true);
const names = ['createSegmentedStreamResolver', 'createSegmentedEpisodeResolver', 'createSegmentedSeasonResolver'];
const helpers = names.map((name) => {
  const node = ast.statements.find((s) => ts.isFunctionDeclaration(s) && s.name?.text === name);
  assert.ok(node, `Production helper missing: ${name}`);
  return node.getText(ast);
}).join('\n');
const source = `const { resolveSegmentRelativePath } = require('../../bootstrap/storage/segment-path-resolver.ts');\n${helpers}\nmodule.exports = { ${names.join(', ')} };`;
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module, exports: module.exports, require: createRequire(hookFile), console: { log() {}, error() {}, warn() {} } });
const factories = module.exports;

const movie = { id: 'movie-late-301', title: 'Synthetic movie', streamIds: ['stream-movie-301'], artworkIds: [], genreIds: [], categoryIds: [] };
const series = { id: 'series-301', title: 'Synthetic series', seasonIds: ['season-301'], artworkIds: [], genreIds: [], categoryIds: [] };
const season = { id: 'season-301', seriesId: series.id, seasonNumber: 1, episodeIds: ['episode-301'] };
const episode = { id: 'episode-301', seriesId: series.id, seasonId: season.id, episodeNumber: 1, title: 'Synthetic episode', artworkIds: [], streamIds: ['stream-episode-301'] };
const streams = [
  { id: movie.streamIds[0], sourceItemId: movie.id, contentKind: 'movie', directStreamUrl: 'https://playback.synthetic.invalid/movie.mp4' },
  { id: episode.streamIds[0], sourceItemId: episode.id, contentKind: 'episode', directStreamUrl: 'https://playback.synthetic.invalid/episode.mp4' },
];

function generation(snapshotId, streamFile = 'streams_000001.json') {
  const header = { metadata: { schemaVersion: 1, catalogVersion: '1.0', snapshotId, counts: {} },
    movies: [], series: [], seasons: [], episodes: [], streams: [], categories: [], genres: [], artworks: [], extensions: { isSegmented: true } };
  const segments = new Map([
    ['movies_000001.json', JSON.stringify([movie])], ['series_000001.json', JSON.stringify([series])],
    ['seasons_000001.json', JSON.stringify([season])], ['episodes_000001.json', JSON.stringify([episode])],
    [streamFile, JSON.stringify(streams)],
  ]);
  const manifest = { snapshotId, segments: [...segments.keys()].map((fileName) => ({ fileName, kind: fileName.split('_')[0] })) };
  return { header, segments, manifest };
}

function fixture(initial = null) {
  let active = initial;
  let manifestReads = 0;
  const storage = {
    async readActiveManifest() { manifestReads++; return active?.manifest || null; },
    async readActiveSegment(relative) { return active?.segments.get(relative.replace(/^segments\//, '')) || null; },
  };
  const service = { getStorage: () => storage };
  const streamRefResolver = factories.createSegmentedStreamResolver(service);
  const episodeResolver = factories.createSegmentedEpisodeResolver(service);
  const seasonResolver = factories.createSegmentedSeasonResolver(service);
  async function readModel() {
    const itemResolver = new CanonicalItemResolver(storage, active.header.metadata.snapshotId);
    const model = new CatalogReadModel(active.header, { streamRefResolver, episodeResolver, seasonResolver,
      movieResolver: (id) => itemResolver.resolveMovieById(id), seriesResolver: (id) => itemResolver.resolveSeriesById(id) });
    await model.resolveMovieById(movie.id);
    await model.resolveSeriesById(series.id);
    await model.loadEpisodesForSeries(series.id);
    return model;
  }
  return { streamRefResolver, readModel, activate(next) { active = next; }, manifestReads: () => manifestReads };
}

function player(allowed = true) {
  const launches = [];
  const playback = new PlaybackService({
    sessionGuard: { async acquireSession() { return { allowed, code: allowed ? undefined : 'SESSION_LIMIT_REACHED', message: 'Synthetic session denial' }; }, async releaseSession() {} },
    playerAdapter: { async launch(request) { launches.push(request.kind); return { success: true, state: 'NATIVE_PLAYER_OPENED' }; } },
  });
  return { playback, launches };
}

async function playBoth(f, expectOpened) {
  const model = await f.readModel(); const probe = player();
  const m = await probe.playback.playMovie(movie.id, model);
  const movieCategory = probe.playback.getCurrentSession().errorCategory;
  await probe.playback.stopPlayback();
  const e = await probe.playback.playEpisode(series.id, episode.id, model);
  const episodeCategory = probe.playback.getCurrentSession().errorCategory;
  assert.equal(m.success, expectOpened); assert.equal(e.success, expectOpened);
  if (!expectOpened) {
    assert.equal(movieCategory, 'STREAM_REF_NOT_FOUND'); assert.equal(episodeCategory, 'STREAM_REF_NOT_FOUND');
    assert.equal(probe.launches.length, 0);
  } else assert.deepEqual(probe.launches, ['movie', 'series']);
  return { movie: m.state, episode: e.state, movieCategory, episodeCategory, nativeProbeCalls: probe.launches.length };
}

// A clean resolver created BEFORE activation works if its first lookup happens
// AFTER promotion: merely mounting the app is not enough to trigger the defect.
const clean = fixture(); clean.activate(generation('new-device'));
console.log('CLEAN_INSTALL_NORMAL=' + JSON.stringify(await playBoth(clean, true)));

// Conditional real bug: an early lookup caches [] and never reloads the manifest.
const early = fixture();
assert.equal(await early.streamRefResolver('not-yet-imported'), undefined);
early.activate(generation('new-device'));
console.log('EMPTY_CACHE_THEN_PROMOTION=' + JSON.stringify(await playBoth(early, false)));

// Same stable hook resolver after a new generation uses the old file list.
const updated = fixture(generation('generation-a'));
assert.ok(await updated.streamRefResolver(streams[0].id));
updated.activate(generation('generation-b', 'streams_000002.json'));
console.log('GENERATION_CHANGE_STALE_CACHE=' + JSON.stringify(await playBoth(updated, false)));

// Recreating the resolver (e.g. process restart) cures the synthetic cache issue.
const restarted = fixture(generation('generation-b', 'streams_000002.json'));
console.log('RECREATED_RESOLVER=' + JSON.stringify(await playBoth(restarted, true)));

// Commercial session rejection stops BEFORE stream lookup/native launch.
const deniedFixture = fixture(generation('denied-probe'));
const deniedModel = await deniedFixture.readModel(); const denied = player(false);
assert.equal((await denied.playback.playMovie(movie.id, deniedModel)).success, false);
assert.equal(denied.playback.getCurrentSession().errorCategory, 'CONCURRENT_SESSION_LIMIT');
assert.equal((await denied.playback.playEpisode(series.id, episode.id, deniedModel)).success, false);
assert.equal(denied.playback.getCurrentSession().errorCategory, 'CONCURRENT_SESSION_LIMIT');
assert.equal(denied.launches.length, 0);
console.log('SESSION_DENIAL_BEFORE_PLAYER=CONFIRMED_CONTROL_ONLY');
console.log('PLAYBACK_DIAGNOSTIC_REPRODUCED_CACHE_DEFECT=YES');
console.log('PHYSICAL_FAILURE_CAUSE=NOT_CONFIRMED_NO_DEVICE_LOGS');
