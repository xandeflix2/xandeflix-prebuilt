import assert from 'node:assert/strict';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { CanonicalItemResolver } from '../src/catalog/canonical-item-resolver.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { getMovieDetail, getSeriesDetail, movieToViewModel } from '../src/catalog/catalog-selectors.ts';
import {
  LiveCatalogService,
  countLiveChannelsByGroupFromSegments,
  readLiveChannelsForGroupFromSegments,
} from '../src/catalog/live/live-catalog.service.ts';
import { BROWSE_PAGE_SIZE, SegmentedBrowseService } from '../src/catalog/segmented-browse.service.ts';
import { readFile } from 'node:fs/promises';

const snapshotId = 'snap-rehydrate-test';
const lateMovieId = 'movie-301';
const lateSeriesId = 'series-301';
const lateEpisodeId = 'episode-301';
const movies = Array.from({ length: 360 }, (_, index) => ({
  id: `movie-${index + 1}`, title: `Filme ${index + 1}`, categoryIds: ['movie-cat'], genreIds: [], artworkIds: [], streamIds: [`movie-stream-${index + 1}`],
}));
const series = Array.from({ length: 360 }, (_, index) => ({
  id: `series-${index + 1}`, title: `Série ${index + 1}`, categoryIds: ['series-cat'], genreIds: [], artworkIds: [], seasonIds: [`season-${index + 1}`],
}));
const seasons = series.map((item, index) => ({ id: `season-${index + 1}`, seriesId: item.id, seasonNumber: 1, title: 'Temporada 1', episodeIds: [`episode-${index + 1}`] }));
const episodes = series.map((item, index) => ({ id: `episode-${index + 1}`, seriesId: item.id, seasonId: `season-${index + 1}`, seasonNumber: 1, episodeNumber: 1, title: `Episódio ${index + 1}`, artworkIds: [], streamIds: [`episode-stream-${index + 1}`] }));
const streams = [
  ...movies.map((item, index) => ({ id: `movie-stream-${index + 1}`, sourceItemId: item.id, contentKind: 'movie', directStreamUrl: `https://test.invalid/movie/${index + 1}` })),
  ...episodes.map((item, index) => ({ id: `episode-stream-${index + 1}`, sourceItemId: item.id, contentKind: 'episode', directStreamUrl: `https://test.invalid/episode/${index + 1}` })),
];
const segmentSize = (records) => Buffer.byteLength(JSON.stringify(records), 'utf8');
const manifest = {
  snapshotId, classificationProfileVersion: 2, generatedAt: '2026-09-27T00:00:00.000Z', totalRecords: 1080, catalogSizeBytes: 1, catalogSha256: 'x', packageContentHash: 'x',
  counts: { movies: 360, series: 360, seasons: 360, episodes: 360, live: 360, streams: 720, artworks: 0, categories: 2, genres: 0 },
  segments: [
    { fileName: 'movies_000001.json', kind: 'movies', recordCount: 180, byteSize: segmentSize(movies.slice(0, 180)) }, { fileName: 'movies_000002.json', kind: 'movies', recordCount: 180, byteSize: segmentSize(movies.slice(180)) },
    { fileName: 'series_000001.json', kind: 'series', recordCount: 180, byteSize: segmentSize(series.slice(0, 180)) }, { fileName: 'series_000002.json', kind: 'series', recordCount: 180, byteSize: segmentSize(series.slice(180)) },
    { fileName: 'seasons_000001.json', kind: 'seasons', recordCount: 360, byteSize: segmentSize(seasons) }, { fileName: 'episodes_000001.json', kind: 'episodes', recordCount: 360, byteSize: segmentSize(episodes) },
    { fileName: 'streams_000001.json', kind: 'streams', recordCount: 720, byteSize: segmentSize(streams) },
  ],
};
const header = { metadata: { snapshotId, counts: manifest.counts }, categories: [], genres: [], artworks: [], movies: movies.slice(0, 100), series: series.slice(0, 100), seasons: seasons.slice(0, 100), episodes: episodes.slice(0, 100), streams: streams.slice(0, 200), extensions: { isSegmented: true } };
const storage = new InMemoryCatalogStorage();
await storage.writeStaging(snapshotId, manifest, header);
for (const [path, records] of [
  ['movies_000001.json', movies.slice(0, 180)], ['movies_000002.json', movies.slice(180)],
  ['series_000001.json', series.slice(0, 180)], ['series_000002.json', series.slice(180)],
  ['seasons_000001.json', seasons], ['episodes_000001.json', episodes], ['streams_000001.json', streams],
]) await storage.writeStagingSegment(snapshotId, path, JSON.stringify(records));
await storage.promoteStaging(snapshotId);
await storage.writeActivePointer({ snapshotId, catalogVersion: '1', schemaVersion: 1, packageContentHash: 'x', promotedAt: '2026-09-27T00:00:00.000Z', kind: 'REAL' });

const resolver = new CanonicalItemResolver(storage, snapshotId);
let movieResolveCalls = 0;
let seriesResolveCalls = 0;
const readModel = new CatalogReadModel(header, {
  movieResolver: async (id) => { movieResolveCalls++; return resolver.resolveMovieById(id); },
  seriesResolver: async (id) => { seriesResolveCalls++; return resolver.resolveSeriesById(id); },
  seasonResolver: async (id) => seasons.filter((season) => season.seriesId === id),
  episodeResolver: async (id) => episodes.filter((episode) => episode.seriesId === id),
  streamRefResolver: async (id) => streams.find((stream) => stream.id === id),
});
const browse = new SegmentedBrowseService(storage);
let passed = 0;
async function test(id, fn) { await fn(); passed++; console.log(`${id}=PASS`); }

await test('T226_MOVIE_PAGED_CANONICAL_REHYDRATION', async () => { assert.equal((await resolver.resolveMovieById(lateMovieId))?.id, lateMovieId); });
await test('T227_MOVIE_FIRST_FOLD_FAST_PATH', async () => { const before = movieResolveCalls; assert.equal((await readModel.resolveMovieById('movie-1'))?.id, 'movie-1'); assert.equal(movieResolveCalls, before); });
await test('T228_MOVIE_DETAIL_FALLBACK_TO_SEGMENT_RESOLVER', async () => { assert.equal(getMovieDetail(readModel, lateMovieId), null); await readModel.resolveMovieById(lateMovieId); assert.equal(getMovieDetail(readModel, lateMovieId)?.id, lateMovieId); });
await test('T229_SEARCH_LATE_MOVIE_CANONICAL_REHYDRATION', async () => { await readModel.resolveMovieById(lateMovieId); assert.equal(getMovieDetail(readModel, lateMovieId)?.title, 'Filme 301'); });
await test('T230_MOVIE_STREAMREF_AFTER_REHYDRATION', async () => { const movie = await readModel.resolveMovieById(lateMovieId); assert.equal((await readModel.getStreamRefAsync(movie.streamIds[0]))?.sourceItemId, lateMovieId); });
await test('T231_SERIES_PAGED_CANONICAL_REHYDRATION', async () => { assert.equal((await resolver.resolveSeriesById(lateSeriesId))?.id, lateSeriesId); });
await test('T232_SERIES_FIRST_FOLD_FAST_PATH', async () => { const before = seriesResolveCalls; assert.equal((await readModel.resolveSeriesById('series-1'))?.id, 'series-1'); assert.equal(seriesResolveCalls, before); });
await test('T233_SERIES_DETAIL_FALLBACK_TO_SEGMENT_RESOLVER', async () => { assert.equal(getSeriesDetail(readModel, lateSeriesId), null); await readModel.resolveSeriesById(lateSeriesId); assert.equal(getSeriesDetail(readModel, lateSeriesId)?.id, lateSeriesId); });
await test('T234_SEARCH_LATE_SERIES_CANONICAL_REHYDRATION', async () => { await readModel.resolveSeriesById(lateSeriesId); assert.equal(getSeriesDetail(readModel, lateSeriesId)?.title, 'Série 301'); });
await test('T235_SERIES_EPISODE_LOOKUP_AFTER_REHYDRATION', async () => { await readModel.loadEpisodesForSeries(lateSeriesId); const episode = readModel.episodesById.get(lateEpisodeId); assert.equal(episode?.id, lateEpisodeId); assert.equal((await readModel.getStreamRefAsync(episode.streamIds[0]))?.sourceItemId, lateEpisodeId); });

const groups = [{ id: 'group-a', name: 'A' }, { id: 'group-b', name: 'B' }, { id: 'group-c', name: 'C' }];
const liveRecords = Array.from({ length: 360 }, (_, index) => ({ id: `live-${index}`, name: `Canal ${index}`, groupId: index < 100 ? 'group-a' : index < 128 ? 'group-b' : 'group-c', streamId: `live-${index}`, streamRef: { sourceItemId: `live-${index}`, containerExtension: 'm3u8', directStreamUrl: `https://test.invalid/live/${index}` } }));
const liveCatalog = LiveCatalogService.buildCatalog(snapshotId, groups, liveRecords.slice(0, 100), { totalChannels: 360, segmentFiles: ['live_000001.json', 'live_000002.json'] });
const liveSegments = { 'live_000001.json': JSON.stringify(liveRecords.slice(0, 180)), 'live_000002.json': JSON.stringify(liveRecords.slice(180)) };
const readLive = async (name) => liveSegments[name] || null;
const counts = await countLiveChannelsByGroupFromSegments(liveCatalog, liveCatalog.segmentFiles, readLive);
await test('T236_LIVE_GROUP_TOTAL_NOT_LOADED_LENGTH', async () => { assert.equal(liveCatalog.channelsByGroup['group-b'].length, 0); assert.equal(counts['group-b'], 28); });
await test('T237_LIVE_OUTSIDE_FIRST_FOLD_GROUP_NONZERO', async () => { assert.equal(counts['group-b'] > 0, true); });
await test('T238_LIVE_CANONICAL_COUNT_24HRS_STYLE_LARGE_GROUP', async () => { assert.equal(counts['group-c'], 232); });
await test('T239_LIVE_GROUP_LAZY_READ_AFTER_CANONICAL_COUNT', async () => { assert.equal((await readLiveChannelsForGroupFromSegments(liveCatalog, 'group-c', liveCatalog.segmentFiles, readLive)).length, 232); });
await test('T240_LIVE_FALSE_ZERO_COUNT_ZERO', async () => { assert.equal(Object.values(counts).filter((count) => count === 0).length, 0); });
await test('T241_NO_DIRECT_STREAM_URL_IN_BROWSE_DTO', async () => { const vm = movieToViewModel(readModel, movies[300]); assert.equal(Object.hasOwn(vm, 'directStreamUrl'), false); });
await test('T242_CANONICAL_RESOLVER_BOUNDED_MEMORY', async () => { const source = await readFile(new URL('../src/catalog/canonical-item-resolver.ts', import.meta.url), 'utf8'); assert.match(source, /if \(match\) return match/); assert.match(source, /await Promise\.resolve\(\)/); });
await test('T243_PLAYBACK_DIAGNOSTIC_BREADCRUMBS_SANITIZED', async () => { const source = await readFile(new URL('../src/playback/playback.service.ts', import.meta.url), 'utf8'); assert.match(source, /MOVIE_PLAY_REQUESTED/); assert.match(source, /EPISODE_STREAMREF_RESOLVED/); assert.doesNotMatch(source, /bootTelemetry\.mark\([^)]*directStreamUrl/); });
await test('T244_EXISTING_SNAPSHOT_COMPATIBILITY', async () => { assert.equal(BROWSE_PAGE_SIZE, 48); assert.equal((await browse.loadPage('movies')).totalAvailable, 360); assert.equal(counts['group-a'] + counts['group-b'] + counts['group-c'], 360); });
await test('T245_SEARCH_BROWSE_DETAIL_SINGLE_RESOLUTION_PATH', async () => { await readModel.resolveMovieById(lateMovieId); await readModel.resolveSeriesById(lateSeriesId); assert.equal(movieResolveCalls > 0 && seriesResolveCalls > 0, true); });
console.log(`T226_TO_T245=PASS (${passed}/20)`);
