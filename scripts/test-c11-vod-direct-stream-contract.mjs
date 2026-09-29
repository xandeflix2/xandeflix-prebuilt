import assert from 'node:assert/strict';

import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';
import { DirectStreamResolver } from '../src/playback/direct-stream-resolver.ts';
import { PlaybackError } from '../src/playback/playback-errors.ts';
import { PlaybackService } from '../src/playback/playback.service.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { SearchIndexBuilder } from '../src/search/search-index-builder.ts';
import { CompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';
import { serializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';
import { validateNormalizedCatalog } from '../src/ingestion/validate.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';

const SOURCE_PLAYLIST_URL = 'https://playlist.example.invalid/fixture.m3u';
const MOVIE_URL = 'https://media.example.invalid/movie/fixture-movie.mp4?token=fixture-token';
const EPISODE_URL = 'https://media.example.invalid/series/fixture-episode.mp4?token=fixture-token';
const LIVE_URL = 'https://media.example.invalid/live/fixture-channel.m3u8?token=fixture-token';

const playlist = [
  '#EXTM3U',
  '#EXTINF:-1 group-title="Filmes",Filme de Teste',
  MOVIE_URL,
  '#EXTINF:-1 group-title="Series",Serie de Teste S01E01',
  EPISODE_URL,
  '#EXTINF:-1 group-title="CANAIS",Canal de Teste',
  LIVE_URL,
].join('\n');

function fixtureResponse() {
  return {
    ok: true,
    status: 200,
    body: null,
    async text() { return playlist; },
  };
}

function reportPass(name) {
  console.log(`PASS ${name}`);
}

const imported = await RealSourceImporterService.importM3u(
  { type: 'M3U', playlistUrl: SOURCE_PLAYLIST_URL },
  {
    sourceId: 'src_uhwh5cio',
    persistLiveCatalog: false,
    fetchImpl: async () => fixtureResponse(),
  },
);

assert.equal(imported.success, true);
assert.ok(imported.catalog);
assert.ok(imported.liveCatalog);
const catalog = imported.catalog;

const movieStream = catalog.streams.find((stream) => stream.contentKind === 'movie');
const episodeStream = catalog.streams.find((stream) => stream.contentKind === 'episode');
assert.equal(movieStream?.directStreamUrl, MOVIE_URL);
reportPass('TEST_1_M3U_MOVIE_DIRECT_REFERENCE_PRESERVED');

assert.equal(episodeStream?.directStreamUrl, EPISODE_URL);
reportPass('TEST_2_M3U_EPISODE_DIRECT_REFERENCE_PRESERVED');

const readbackCatalog = JSON.parse(JSON.stringify(catalog));
const readModel = new CatalogReadModel(readbackCatalog);
assert.equal(readModel.getStreamRef(movieStream.id)?.directStreamUrl, MOVIE_URL);
assert.equal(readModel.getStreamRef(episodeStream.id)?.directStreamUrl, EPISODE_URL);
reportPass('TEST_3_SNAPSHOT_SERIALIZATION_READBACK_PRESERVES_DIRECT_REFERENCE');

const oldCatalog = JSON.parse(JSON.stringify(catalog));
for (const stream of oldCatalog.streams) delete stream.directStreamUrl;
assert.equal(validateNormalizedCatalog(oldCatalog).valid, true);
reportPass('TEST_4_OLD_STREAMREF_WITHOUT_DIRECT_REFERENCE_REMAINS_VALID');

const searchIndex = new SearchIndexBuilder().build(catalog);
const compactIndex = new CompactSearchIndexV2Builder().build(catalog, {
  liveCatalog: imported.liveCatalog,
});
const compactBuffer = serializeCompactIndexV2(compactIndex).buffer;
const searchPayload = JSON.stringify(searchIndex);
assert.equal(searchPayload.includes('directStreamUrl'), false);
assert.equal(searchPayload.includes('media.example.invalid'), false);
assert.equal(compactBuffer.toString('utf8').includes('media.example.invalid'), false);
reportPass('TEST_5_DIRECT_REFERENCE_EXCLUDED_FROM_SEARCH_INDEX');

const resolver = new DirectStreamResolver();
const directResolved = await resolver.resolve(movieStream);
assert.equal(directResolved.uri, MOVIE_URL);
reportPass('TEST_6_RESOLVER_PREFERS_DIRECT_REFERENCE_WITHOUT_CONTEXT');

const derivedResolved = await resolver.resolve(
  {
    id: 'legacy-stream',
    sourceItemId: '100',
    contentKind: 'movie',
    containerExtension: 'mp4',
  },
  {
    sourceId: 'fixture-source',
    providerKind: 'M3U',
    baseUrl: 'https://media.example.invalid',
  },
);
assert.equal(derivedResolved.uri, 'https://media.example.invalid/movies/100.mp4');
reportPass('TEST_7_PROTOCOL_DERIVED_FALLBACK_REMAINS_BACKWARD_COMPATIBLE');

let malformedFailedSafely = false;
try {
  await resolver.resolve({
    id: 'malformed-stream',
    sourceItemId: 'malformed',
    contentKind: 'movie',
    directStreamUrl: 'not-a-url?token=fixture-token',
  });
} catch (error) {
  malformedFailedSafely = error instanceof PlaybackError &&
    error.category === 'RESOLUTION_FAILED' &&
    !error.message.includes('fixture-token');
}
assert.equal(malformedFailedSafely, true);
reportPass('TEST_8_MALFORMED_DIRECT_REFERENCE_FAILS_WITHOUT_SECRET_LOGGING');

const service = new PlaybackService();
const serviceResolved = await service.resolveStream(movieStream, { title: 'Filme de Teste' });
assert.equal(serviceResolved.uri, MOVIE_URL);
reportPass('TEST_9_PLAYBACK_SERVICE_TRANSPORTS_DIRECT_REFERENCE');

const liveRef = imported.liveCatalog.channels[0]?.streamRef;
assert.equal(liveRef?.directStreamUrl, LIVE_URL);
reportPass('TEST_10_LIVE_DIRECT_REFERENCE_BEHAVIOR_UNCHANGED');

const packageBuilder = new PackageBuilder();
const publicBuild = await packageBuilder.build(catalog, { packageFormatVersion: 2 });
assert.equal(publicBuild.success, false);
assert.ok(publicBuild.errors.some((error) => error.includes('PRIVATE_RUNTIME_LOCATOR_EXPORT_FORBIDDEN')));
const privateBuild = await packageBuilder.build(catalog, {
  packageFormatVersion: 2,
  allowSensitiveRuntimeLocators: true,
  liveCatalog: imported.liveCatalog,
});
assert.equal(privateBuild.success, true);
reportPass('TEST_11_PRIVATE_STAGING_BOUNDARY_ENFORCED');

const staticSources = [
  'src/source/real-source-importer.service.ts',
  'src/playback/direct-stream-resolver.ts',
  'src/playback/playback.service.ts',
  'src/playback/playback-redaction.ts',
];
for (const file of staticSources) {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(file, 'utf8'));
  assert.equal(/console\.log\([^\n]*(directStreamUrl|streamRef|resolved\.uri)/.test(source), false);
}
reportPass('TEST_12_DIRECT_REFERENCE_NOT_EMITTED_BY_RUNTIME_LOGS');

console.log('C11_VOD_DIRECT_STREAM_CONTRACT_TESTS=PASS');
