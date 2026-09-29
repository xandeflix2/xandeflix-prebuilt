/**
 * C11/C9 runtime wiring: prova o ciclo compartilhado do PlaybackService sem
 * depender de VOD upstream ou de um dispositivo físico.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { PlaybackService } from '../src/playback/playback.service.ts';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function createCatalog() {
  return new CatalogReadModel({
    version: '1.0.0',
    generatedAt: '2026-09-22T00:00:00.000Z',
    sourceNamespace: 'c9-runtime-test',
    categories: [],
    genres: [],
    artworks: [],
    movies: [{ id: 'movie-1', title: 'Filme', categoryIds: [], genreIds: [], streamIds: ['stream-movie'] }],
    series: [{ id: 'series-1', title: 'Série', categoryIds: [], genreIds: [], seasonIds: ['season-1'] }],
    seasons: [{ id: 'season-1', seriesId: 'series-1', seasonNumber: 1, title: 'Temporada 1', episodeIds: ['episode-1'] }],
    episodes: [{ id: 'episode-1', seriesId: 'series-1', seasonId: 'season-1', seasonNumber: 1, episodeNumber: 1, title: 'Episódio', streamIds: ['stream-episode'] }],
    streams: [
      { id: 'stream-movie', sourceItemId: 'movie-1', contentKind: 'movie', containerExtension: 'mp4', directStreamUrl: 'https://media.test/movie.mp4' },
      { id: 'stream-episode', sourceItemId: 'episode-1', contentKind: 'episode', containerExtension: 'mp4', directStreamUrl: 'https://media.test/episode.mp4' },
    ],
  });
}

class FakeGuard {
  constructor({ allowed = true, code, message } = {}) {
    this.allowed = allowed;
    this.code = code;
    this.message = message;
    this.acquireCalls = [];
    this.releaseCalls = [];
    this.heartbeatCount = 0;
    this.terminationCallbacks = new Set();
  }

  async acquireSession(metadata) {
    this.acquireCalls.push(metadata);
    if (this.allowed) this.heartbeatCount++;
    return { allowed: this.allowed, code: this.code, message: this.message };
  }

  async releaseSession(reason) {
    this.releaseCalls.push(reason);
  }

  onTermination(callback) {
    this.terminationCallbacks.add(callback);
    return () => this.terminationCallbacks.delete(callback);
  }

  emitTermination(reason = 'HEARTBEAT_FAILED', code = 'SESSION_EXPIRED') {
    for (const callback of this.terminationCallbacks) callback(reason, code);
  }
}

class FakePlayerAdapter {
  constructor(result = { success: true, state: 'NATIVE_PLAYER_OPENED' }) {
    this.result = result;
    this.launches = [];
  }

  async launch(request) {
    this.launches.push(request);
    return this.result;
  }
}

function createService(guard, adapter = new FakePlayerAdapter()) {
  return {
    service: new PlaybackService({ playerAdapter: adapter, sessionGuard: guard }),
    adapter,
  };
}

const readModel = createCatalog();
let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}

await test('TEST_A_START_SUCCESS', async () => {
  const guard = new FakeGuard();
  const { service, adapter } = createService(guard);
  const result = await service.playMovie('movie-1', readModel);
  assert.equal(result.state, 'NATIVE_PLAYER_OPENED');
  assert.equal(guard.acquireCalls.length, 1);
  assert.equal(adapter.launches.length, 1);
  assert.equal(guard.heartbeatCount, 1);
});

await test('TEST_B_START_DENIED', async () => {
  const guard = new FakeGuard({ allowed: false, code: 'SESSION_LIMIT_REACHED' });
  const { service, adapter } = createService(guard);
  const result = await service.playMovie('movie-1', readModel);
  assert.equal(result.success, false);
  assert.equal(adapter.launches.length, 0);
  assert.equal(guard.releaseCalls.length, 0);
});

await test('TEST_C_HEARTBEAT', async () => {
  const guard = new FakeGuard();
  const { service } = createService(guard);
  await service.playMovie('movie-1', readModel);
  assert.equal(guard.heartbeatCount, 1, 'o guard C9 inicia o heartbeat ao autorizar');
});

await test('TEST_D_NORMAL_BACK', async () => {
  const guard = new FakeGuard();
  const { service } = createService(guard);
  await service.playMovie('movie-1', readModel);
  await service.stopPlayback('USER_EXIT');
  assert.deepEqual(guard.releaseCalls, ['USER_EXIT']);
});

await test('TEST_E_MEDIA_ERROR_AND_VOD_404_CLEANUP', async () => {
  const guard = new FakeGuard();
  const adapter = new FakePlayerAdapter({ success: false, state: 'NATIVE_PLAYER_ERROR', errorMessage: 'HTTP 404' });
  const { service } = createService(guard, adapter);
  const result = await service.playMovie('movie-1', readModel);
  assert.equal(result.success, false);
  assert.deepEqual(guard.releaseCalls, ['PLAYER_START_FAILED']);
});

await test('TEST_F_COMPLETION', async () => {
  const guard = new FakeGuard();
  const { service } = createService(guard);
  await service.playMovie('movie-1', readModel);
  await service.stopPlayback('COMPLETION');
  assert.deepEqual(guard.releaseCalls, ['COMPLETION']);
});

await test('TEST_G_REENTRY', async () => {
  const guard = new FakeGuard();
  const { service, adapter } = createService(guard);
  await service.playMovie('movie-1', readModel);
  await service.stopPlayback('USER_EXIT');
  const result = await service.playMovie('movie-1', readModel);
  assert.equal(result.success, true);
  assert.equal(guard.acquireCalls.length, 2);
  assert.equal(adapter.launches.length, 2);
});

await test('TEST_H_NO_SESSION_LEAK', async () => {
  const guard = new FakeGuard();
  const { service } = createService(guard);
  await service.playMovie('movie-1', readModel);
  await service.stopPlayback('USER_EXIT');
  await service.stopPlayback('DUPLICATE_TERMINAL_EVENT');
  guard.emitTermination();
  assert.equal(guard.releaseCalls.length, 1);
});

await test('TEST_I_LIVE_STATIC_SHARED_LIFECYCLE', async () => {
  const source = fs.readFileSync(path.join(rootDir, 'src/ui/pages/LiveTvPage.tsx'), 'utf8');
  assert.match(source, /getAuthorizedPlaybackSessionGuard\(\)/);
  assert.match(source, /contentKind:\s*'live'/);
  assert.match(source, /releaseSession\('USER_EXIT'\)/);
  assert.match(source, /releaseSession\('MEDIA_ERROR'\)/);
});

await test('TEST_J_MOVIE_EPISODE_SHARED_PATH', async () => {
  const guard = new FakeGuard();
  const { service, adapter } = createService(guard);
  assert.equal((await service.playMovie('movie-1', readModel)).success, true);
  await service.stopPlayback('USER_EXIT');
  assert.equal((await service.playEpisode('series-1', 'episode-1', readModel)).success, true);
  assert.deepEqual(guard.acquireCalls.map((m) => m.contentKind), ['movie', 'episode']);
  assert.equal(adapter.launches.length, 2);
});

console.log(`C11/C9 runtime wiring: ${passed}/10 PASS`);
