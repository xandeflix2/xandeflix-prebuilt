import assert from 'node:assert/strict';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { DailyTrendingHeroService } from '../src/catalog/daily-trending-hero.service.ts';

const movie = (id, title, year, tmdbId) => ({ id, title, year, categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['local-ref'],
  ...(tmdbId === undefined ? {} : { externalIds: { tmdbId } }) });
const series = (id, title, year, tmdbId) => ({ id, title, year, categoryIds: [], genreIds: [], artworkIds: [], seasonIds: ['local-season'],
  ...(tmdbId === undefined ? {} : { externalIds: { tmdbId } }) });
const model = (snapshotId, movies = [], shows = []) => new CatalogReadModel({
  metadata: { schemaVersion: 1, catalogVersion: '1', snapshotId, generatedAt: '2026-11-18',
    counts: { movies: movies.length, series: shows.length, seasons: 0, episodes: 0, categories: 0, genres: 0, streams: 0, artworks: 0 } },
  movies, series: shows, seasons: [], episodes: [], categories: [], genres: [], streams: [], artworks: [],
});
const ranked = [
  { id: 99, media_type: 'person', name: 'Not a video' },
  { id: 12, media_type: 'movie', title: 'Movie B', release_date: '2024-01-01' },
  { id: 23, media_type: 'tv', name: 'Series C', first_air_date: '2021-02-02' },
  { id: 11, media_type: 'movie', title: 'Movie A', release_date: '2023-03-03' },
  { id: 77, media_type: 'movie', title: 'TMDB only', release_date: '2026-04-01' },
];
let hour = Date.UTC(2026, 10, 18, 2), calls = 0;
const fetchImpl = async (url, options) => {
  calls++;
  assert.match(url, /^https:\/\/api\.themoviedb\.org\/3\/trending\/(all|movie|tv)\/day\?/);
  assert.equal(options.referrerPolicy, 'no-referrer');
  const mode = new URL(url).pathname.split('/')[3];
  return { ok: true, json: async () => ({ total_pages: 1, results: mode === 'all' ? ranked
    : ranked.filter(row => row.media_type === mode) }) };
};
const service = new DailyTrendingHeroService({ credential: () => 'public-test-credential', fetchImpl, now: () => hour });
const catalog = model('snapshot-a', [movie('a', 'Movie A', 2023)], []);
const segments = { 'movies_1.json': [movie('b', 'Different source label', 2024, 12)],
  'series_1.json': [series('c', 'Series C', 2021)] };
let sourceId = 'source-a', pointer = 'snapshot-a', reads = 0;
const storage = {
  async readActiveManifest() { return { snapshotId: pointer, metadata: { sourceId }, segments: [
    { kind: 'movies', fileName: 'movies_1.json' }, { kind: 'series', fileName: 'series_1.json' }] }; },
  async readActivePointer() { return { snapshotId: pointer }; },
  async readActiveSegment(file) { reads++; return JSON.stringify(segments[file.split('/').at(-1)]); },
};
const signal = () => new AbortController().signal;
const all = await service.available(catalog, storage, 'all', signal());
assert.deepEqual(all.map(option => [option.item.kind, option.item.id]), [['movie', 'b'], ['series', 'c'], ['movie', 'a']]);
assert.ok(all.every(option => option.key.startsWith('day:snapshot-a:')));
assert.equal(reads, 2, 'segments beyond first fold are read one by one');
assert.deepEqual((await service.available(catalog, storage, 'movie', signal())).map(option => option.item.id), ['b', 'a']);
assert.deepEqual((await service.available(catalog, storage, 'series', signal())).map(option => option.item.id), ['c']);
assert.equal(calls, 3, 'one public ranking per page type');
await service.available(catalog, storage, 'all', signal());
assert.equal(calls, 3, 'same-hour public ranking reused');
assert.equal(reads, 4, 'same-hour catalog intersection reused without another segment scan');
hour += 3600000;
await service.available(catalog, storage, 'all', signal());
assert.equal(calls, 4, 'new hour refreshes Today ranking');
assert.equal(reads, 6, 'new hour scans the active snapshot again');
console.log('PASS_DAILY_ORDER_TYPES_SEGMENTS_SOURCE_ONLY_AND_HOURLY_REFRESH');

const changedCatalog = model('snapshot-b', [movie('replacement', 'Movie A', 2023)], []);
const changedStorage = { ...storage,
  async readActiveManifest() { return { snapshotId: 'snapshot-b', metadata: { sourceId: 'source-b' }, segments: [] }; },
  async readActivePointer() { return { snapshotId: 'snapshot-b' }; },
};
assert.deepEqual((await service.available(changedCatalog, changedStorage, 'all', signal())).map(option => option.item.id), ['replacement']);
pointer = 'snapshot-b';
await assert.rejects(() => service.available(catalog, storage, 'all', signal()), /GENERATION_CHANGED/);
pointer = 'snapshot-a';
sourceId = 'source-b';
const changedDuringRead = { ...storage,
  async readActiveSegment(file) { sourceId = 'source-c'; return JSON.stringify(segments[file.split('/').at(-1)]); },
};
await assert.rejects(() => service.available(catalog, changedDuringRead, 'all', signal()), /GENERATION_CHANGED/);
sourceId = 'source-a';
console.log('PASS_SOURCE_SWITCH_AND_STALE_SNAPSHOT_FAIL_CLOSED');

const conflicting = model('conflict', [movie('wrong-id', 'Movie A', 2023, 999), movie('bad-year', 'Movie A', 2020),
  movie('duplicate-1', 'Movie B', 2024, 12), movie('duplicate-2', 'Movie B', 2024, 12)], []);
const noSegments = { async readActiveManifest() { return null; }, async readActivePointer() { return null; } };
assert.deepEqual(await service.available(conflicting, noSegments, 'movie', signal()), [], 'conflicts cannot become hero choices');
const missingCredential = new DailyTrendingHeroService({ credential: () => '', fetchImpl });
assert.deepEqual(await missingCredential.available(catalog, storage, 'all', signal()), []);
const failed = new DailyTrendingHeroService({ credential: () => 'public', fetchImpl: async () => { throw Error('offline'); } });
await assert.rejects(() => failed.available(catalog, storage, 'all', signal()), /offline/);
const cancelled = new AbortController(); cancelled.abort();
await assert.rejects(() => service.ranked('all', cancelled.signal), /CANCELLED/);
console.log('PASS_CONFLICTS_MISSING_CREDENTIAL_FAILURE_AND_CANCELLATION_NO_OLD_FALLBACK');

const fallbackCalls = [];
const fallbackService = new DailyTrendingHeroService({ credential: () => 'public', maxPages: 1,
  fetchImpl: async (url) => {
    const target = new URL(url); fallbackCalls.push(`${target.pathname}${target.search}`);
    let results = [];
    if (target.pathname === '/3/trending/all/week') results = [
      { id: 72, media_type: 'movie', title: 'Weekly film', release_date: '2024-01-01' }];
    if (target.pathname === '/3/discover/movie' && target.searchParams.get('primary_release_year') === '2026') results = [
      { id: 73, title: 'Year film', release_date: '2026-02-01', popularity: 4 }];
    if (target.pathname === '/3/discover/tv' && target.searchParams.get('first_air_date_year') === '2026') results = [
      { id: 74, name: 'Year show', first_air_date: '2026-04-01', popularity: 8 }];
    if (target.pathname === '/3/discover/movie' && target.searchParams.get('primary_release_year') === '2025') results = [
      { id: 75, title: 'Last year film', release_date: '2025-03-01', popularity: 2 }];
    return { ok: true, json: async () => ({ total_pages: 1, results }) };
  } });
const fallbackCatalog = model('fallback', [movie('weekly', 'Weekly film', 2024, 72),
  movie('year-film', 'Year film', 2026, 73), movie('last-film', 'Last year film', 2025, 75)],
  [series('year-show', 'Year show', 2026, 74)]);
const fallbackStorage = { async readActiveManifest() { return { snapshotId: 'fallback', metadata: { sourceId: 'source-a' }, segments: [] }; },
  async readActivePointer() { return { snapshotId: 'fallback' }; } };
assert.deepEqual((await fallbackService.available(fallbackCatalog, fallbackStorage, 'all', signal(), 'week'))
  .map(option => option.item.id), ['weekly']);
assert.deepEqual((await fallbackService.available(fallbackCatalog, fallbackStorage, 'all', signal(), '2026'))
  .map(option => option.item.id), ['year-show', 'year-film']);
assert.deepEqual((await fallbackService.available(fallbackCatalog, fallbackStorage, 'movie', signal(), '2025'))
  .map(option => option.item.id), ['last-film']);
assert.ok(fallbackCalls.some(call => call.startsWith('/3/trending/all/week?')));
assert.ok(fallbackCalls.some(call => call.includes('primary_release_year=2026')));
assert.ok(fallbackCalls.some(call => call.includes('first_air_date_year=2026')));
assert.ok(fallbackCalls.every(call => !call.includes('private-source')));
const priorityCalls = [];
const priority = new DailyTrendingHeroService({ credential: () => 'public', maxPages: 1,
  fetchImpl: async (url) => {
    const path = new URL(url).pathname; priorityCalls.push(path);
    return { ok: true, json: async () => ({ total_pages: 1, results: path.endsWith('/week')
      ? [{ id: 72, media_type: 'movie', title: 'Weekly film', release_date: '2024-01-01' }] : [] }) };
  } });
assert.deepEqual((await priority.availableByPriority(fallbackCatalog, fallbackStorage, 'all', signal()))
  .map(option => option.item.id), ['weekly']);
assert.deepEqual(priorityCalls, ['/3/trending/all/day', '/3/trending/all/week'],
  'the first matching band stops lower-priority requests');
console.log('PASS_WEEK_YEAR_RANKING_AND_ACTIVE_SOURCE_INTERSECTION');
console.log('HERO_TRENDS_TODAY=PASS');
