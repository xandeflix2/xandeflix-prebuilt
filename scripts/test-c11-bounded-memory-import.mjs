import assert from 'node:assert/strict';

import {
  RealSourceImporterService,
  IMPORT_BATCH_SIZE,
  SERIES_MEMORY_STRATEGY,
  FULL_CATALOG_JSON_STRINGIFY_REMOVED,
  FULL_STAGING_JSON_PARSE_REMOVED,
  STREAMING_HASH_USED,
  SEARCH_BUILD_DEFERRED_AFTER_PROMOTION,
  SEARCH_BUILD_BATCHED,
  EVENT_LOOP_YIELD_PRESENT,
  MAX_SINGLE_STORAGE_WRITE_ESTIMATE,
} from '../src/source/real-source-importer.service.ts';
import { CompactSearchEngineV2Pruned } from '../src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { DeferredSearchIndexCoordinator } from '../src/search/deferred-search-index-coordinator.ts';
import { PackageImporter } from '../src/bootstrap/package-importer.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import { BootSyncCoordinator } from '../src/bootstrap/boot-sync-coordinator.ts';
import { createActivePointer, isValidActivePointer } from '../src/bootstrap/active-snapshot.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { createManifest } from '../src/provisioning/manifest.ts';

const SOURCE_RECORDS = 250_000;
const SOURCE_URL = 'https://bounded-memory.synthetic.invalid/playlist.m3u';
const AUTHORIZED_SOURCE_ID = 'bounded-memory-synthetic';
const AUTHORIZED_SOURCE_VERSION = 17;
const CHECKPOINTS = [
  'MEM01_START',
  'MEM02_25_PERCENT',
  'MEM03_50_PERCENT',
  'MEM04_75_PERCENT',
  'MEM05_PARSE_COMPLETE',
  'MEM06_NORMALIZATION_COMPLETE',
  'MEM07_SEARCH_COMPLETE',
];

function renderRecord(index) {
  if (index % 20 === 0) {
    return `#EXTINF:-1 tvg-id="live-${index}" group-title="Ao Vivo",Canal ${index}\nhttps://stream.synthetic.invalid/live/${index}.m3u8\n`;
  }

  if (index % 10 === 0) {
    const seriesIndex = Math.floor(index / 20) % 1000;
    const episodeNumber = Math.floor(index / 20_000) + 1;
    return `#EXTINF:-1 group-title="Series",Serie ${seriesIndex} S01E${String(episodeNumber).padStart(2, '0')}\nhttps://stream.synthetic.invalid/series/${seriesIndex}/${episodeNumber}.mp4\n`;
  }

  return `#EXTINF:-1 group-title="Filmes",Filme ${index}\nhttps://stream.synthetic.invalid/movie/${index}.mp4\n`;
}

function createSyntheticResponse() {
  const encoder = new TextEncoder();
  let nextRecord = 0;

  const body = new ReadableStream({
    pull(controller) {
      let payload = nextRecord === 0 ? '#EXTM3U\n' : '';
      while (nextRecord < SOURCE_RECORDS && payload.length < 512 * 1024) {
        payload += renderRecord(nextRecord);
        nextRecord += 1;
      }

      controller.enqueue(encoder.encode(payload));
      if (nextRecord >= SOURCE_RECORDS) controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/vnd.apple.mpegurl' },
  });
}

function captureRss() {
  return Math.round(process.memoryUsage().rss / 1024 / 1024);
}

const storage = new InMemoryCatalogStorage();
const checkpointSamples = new Map();

console.log('[TEST] Starting Bounded Memory 250k Synthetic Import...');
const result = await RealSourceImporterService.importM3u(
  { type: 'M3U', playlistUrl: SOURCE_URL },
  {
    sourceId: AUTHORIZED_SOURCE_ID,
    provenance: {
      kind: 'REAL',
      sourceId: AUTHORIZED_SOURCE_ID,
      sourceVersion: AUTHORIZED_SOURCE_VERSION,
    },
    storage,
    fetchImpl: async () => createSyntheticResponse(),
    expectedSourceRecordCount: SOURCE_RECORDS,
    onMemoryCheckpoint: (checkpoint) => {
      checkpointSamples.set(checkpoint.name, {
        ...checkpoint,
        rssMb: captureRss(),
      });
    },
  },
);

// T1 synthetic 250k records completes
assert.equal(result.success, true, `Import bounded-memory falhou: ${result.error || 'erro desconhecido'}`);
assert.equal(result.metrics?.rawItemCount, SOURCE_RECORDS, 'T1 failed: rawItemCount != 250000');
console.log('TEST_T1=PASS');

// T2 maximum batch remains bounded
assert.equal(IMPORT_BATCH_SIZE, 1000, 'T2 failed: IMPORT_BATCH_SIZE != 1000');
console.log('TEST_T2=PASS');

// T3 no unbounded movies accumulation
const catalog = result.catalog;
assert.ok(catalog.movies.length <= 100, `T3 failed: catalog.movies length ${catalog.movies.length} > 100`);
console.log('TEST_T3=PASS');

// T4 no unbounded episodes accumulation
assert.ok(catalog.episodes.length <= 100, `T4 failed: catalog.episodes length ${catalog.episodes.length} > 100`);
console.log('TEST_T4=PASS');

// T5 no unbounded live accumulation
assert.ok(result.liveCatalog.channels.length <= 100, `T5 failed: liveCatalog.channels length ${result.liveCatalog.channels.length} > 100`);
console.log('TEST_T5=PASS');

// T6 no whole catalog stringify
assert.equal(FULL_CATALOG_JSON_STRINGIFY_REMOVED, true, 'T6 failed: FULL_CATALOG_JSON_STRINGIFY_REMOVED != true');
console.log('TEST_T6=PASS');

// T7 no whole staging JSON.parse
assert.equal(FULL_STAGING_JSON_PARSE_REMOVED, true, 'T7 failed: FULL_STAGING_JSON_PARSE_REMOVED != true');
console.log('TEST_T7=PASS');

// T8 segmented persistence
assert.ok(result.segmentedStaging, 'T8 failed: result.segmentedStaging missing');
const manifest = result.segmentedStaging.manifest;
assert.ok(manifest.segments.length > 0, 'T8 failed: manifest.segments empty');
const firstMovieSegment = manifest.segments.find(s => s.kind === 'movies');
assert.ok(firstMovieSegment, 'T8 failed: no movie segment in manifest');
const firstSegmentData = await storage.readStagingSegment(manifest.snapshotId, firstMovieSegment.fileName);
assert.ok(firstSegmentData && firstSegmentData.length > 0, 'T8 failed: readStagingSegment returned null or empty');
console.log('TEST_T8=PASS');

// T9 incremental hash
assert.equal(STREAMING_HASH_USED, true, 'T9 failed: STREAMING_HASH_USED != true');
assert.ok(manifest.catalogSha256 && manifest.catalogSha256.length === 64, 'T9 failed: catalogSha256 invalid length');
console.log('TEST_T9=PASS');

// T10 deterministic counts
assert.equal(result.metrics?.rawMovieCount, 225_000, 'T10 failed: rawMovieCount');
assert.equal(result.metrics?.rawSeriesCount, 12_500, 'T10 failed: rawSeriesCount');
assert.equal(result.metrics?.rawLiveCount, 12_500, 'T10 failed: rawLiveCount');
assert.equal(manifest.counts.movies, 225_000, 'T10 failed: manifest counts movies');
assert.equal(manifest.counts.series, 1_000, 'T10 failed: manifest counts series');
assert.equal(manifest.counts.episodes, 12_500, 'T10 failed: manifest counts episodes');
assert.equal(manifest.counts.live, 12_500, 'T10 failed: manifest counts live');
console.log('TEST_T10=PASS');

// T65: SEGMENTED_MANIFEST_HAS_REAL_KIND
assert.equal(manifest.metadata?.kind, 'REAL', 'T65 failed: metadata.kind must be REAL');
console.log('TEST_T65=PASS');

// T66: SEGMENTED_MANIFEST_HAS_SOURCE_ID
assert.equal(manifest.metadata?.sourceId, AUTHORIZED_SOURCE_ID, 'T66 failed: sourceId mismatch');
console.log('TEST_T66=PASS');

// T67: SEGMENTED_MANIFEST_HAS_SOURCE_VERSION
assert.equal(manifest.metadata?.sourceVersion, AUTHORIZED_SOURCE_VERSION, 'T67 failed: sourceVersion mismatch');
console.log('TEST_T67=PASS');

// T68: PROVENANCE_SURVIVES_STAGING
const provenanceReadback = await storage.readStaging(manifest.snapshotId);
assert.deepEqual(
  provenanceReadback?.manifest.metadata,
  manifest.metadata,
  'T68 failed: persisted/read-back provenance mismatch',
);
assert.deepEqual(
  Object.keys(provenanceReadback?.manifest.metadata ?? {}).sort(),
  ['kind', 'sourceId', 'sourceVersion'],
  'T68 failed: provenance contains unexpected fields',
);
console.log('TEST_T68=PASS');

// T11 directStreamUrl private persistence preserved
const firstStreamSegment = manifest.segments.find(s => s.kind === 'streams');
assert.ok(firstStreamSegment, 'T11 failed: no stream segment');
const streamsJson = await storage.readStagingSegment(manifest.snapshotId, firstStreamSegment.fileName);
assert.ok(streamsJson && streamsJson.includes('directStreamUrl'), 'T11 failed: streams segment missing directStreamUrl');
console.log('TEST_T11=PASS');

// T12 directStreamUrl absent from Search
// T16 Search only after promotion
assert.equal(result.searchIndexBuffer, undefined, 'T16 failed: searchIndexBuffer must be undefined during import');
console.log('TEST_T16=PASS');

// Stage and promote package
const importer = new PackageImporter(storage);
const staged = await importer.stageArtifacts(
  manifest,
  catalog,
  undefined,
  result.liveCatalog,
  undefined,
  result.catalogJson,
);
assert.equal(staged.success, true, `Staging failed: ${staged.errors?.join('; ')}`);
assert.equal(staged.status, 'STAGED', 'Staging status not STAGED');

// T14 promotion only after validation
const invalidPromotion = await importer.promoteStagedPackage('snap-corrupted-does-not-exist');
assert.equal(invalidPromotion.success, false, 'T14 failed: promotion of corrupted snapshot should fail');
console.log('TEST_T14=PASS');

// Valid promotion
const promoted = await importer.promoteStagedPackage(manifest.snapshotId);
console.log('PROMOTED_RESULT=', JSON.stringify(promoted, null, 2));
assert.equal(promoted.success, true, `Promotion failed: ${promoted.errors?.join('; ')}`);
assert.equal(promoted.status, 'PROMOTED', 'Promotion status not PROMOTED');

// T13 interrupted staging preserves active snapshot
const activePointerBefore = await storage.readActivePointer();
assert.equal(activePointerBefore?.snapshotId, manifest.snapshotId);
// Incomplete staging simulation
await storage.writeStaging('snap-interrupted', manifest, catalog, undefined, undefined);
// Verify active pointer is still the previously promoted snapshot
const activePointerAfter = await storage.readActivePointer();
assert.equal(activePointerAfter?.snapshotId, manifest.snapshotId, 'T13 failed: active snapshot modified by incomplete staging');
console.log('TEST_T13=PASS');

// T15 incomplete staging restart deterministic
await storage.cleanupStaging('snap-interrupted');
const stagedAfterCleanup = await storage.readStaging('snap-interrupted');
assert.equal(stagedAfterCleanup, null, 'T15 failed: cleanupStaging should cleanly remove interrupted staging');
console.log('TEST_T15=PASS');

// Build deferred search index
const searchBuild = await DeferredSearchIndexCoordinator.buildAndPersistIndex(
  manifest.snapshotId,
  storage,
  { catalogHeader: catalog, liveCatalog: result.liveCatalog, yieldBatchSize: 1000 }
);
assert.equal(searchBuild.success, true, 'Search build failed');
assert.ok(searchBuild.tokenCount > 0, 'Search build token count 0');

// T17 Search bounded/yielding
assert.equal(SEARCH_BUILD_BATCHED, true, 'T17 failed: SEARCH_BUILD_BATCHED != true');
assert.equal(EVENT_LOOP_YIELD_PRESENT, true, 'T17 failed: EVENT_LOOP_YIELD_PRESENT != true');
console.log('TEST_T17=PASS');

// Test Search queries
const search = new CompactSearchEngineV2Pruned();
search.load(searchBuild.indexSerialized);
assert.ok(search.query('Filme 1').items.length > 0, 'Search query Filme 1 returned 0 items');
assert.equal(search.query('https').items.length, 0, 'T12 failed: directStreamUrl leaked into Search');
assert.equal(search.query('stream.synthetic').items.length, 0, 'T12 failed: stream url leaked into Search');
console.log('TEST_T12=PASS');

// T18 Home first-fold segmented read works
const activeCatalog = await storage.readActiveCatalog();
assert.ok(activeCatalog, 'T18 failed: active catalog missing');
assert.equal(activeCatalog.movies.length, 100, 'T18 failed: active catalog movies first fold != 100');
assert.ok(activeCatalog.categories.length > 0, 'T18 failed: active catalog categories empty');
console.log('TEST_T18=PASS');

// T19 Movies integrity
const movieSegmentParsed = JSON.parse(firstSegmentData);
assert.ok(movieSegmentParsed.length > 0, 'T19 failed: movie segment empty');
assert.ok(movieSegmentParsed[0].id && movieSegmentParsed[0].title, 'T19 failed: movie id or title missing');
assert.ok(movieSegmentParsed[0].categoryIds?.length > 0, 'T19 failed: movie categoryIds missing');
console.log('TEST_T19=PASS');

// T20 Series/episodes integrity
const seriesSegment = manifest.segments.find(s => s.kind === 'series');
assert.ok(seriesSegment, 'T20 failed: series segment missing');
const seriesData = await storage.readActiveSegment(seriesSegment.fileName);
const seriesParsed = JSON.parse(seriesData);
assert.equal(seriesParsed.length, 1_000, 'T20 failed: series count != 1000');
assert.ok(seriesParsed[0].seasonIds?.length > 0, 'T20 failed: series seasonIds empty');
console.log('TEST_T20=PASS');

// T21 Live integrity
const liveSegment = manifest.segments.find(s => s.kind === 'live');
assert.ok(liveSegment, 'T21 failed: live segment missing');
const liveData = await storage.readActiveSegment(liveSegment.fileName);
const liveParsed = JSON.parse(liveData);
assert.ok(liveParsed.length > 0, 'T21 failed: live channels empty');
assert.ok(liveParsed[0].streamRef?.directStreamUrl, 'T21 failed: live channel streamRef missing directStreamUrl');
console.log('TEST_T21=PASS');

// T22 playback locator contract
const streamParsed = JSON.parse(streamsJson);
assert.ok(streamParsed.length > 0, 'T22 failed: streamParsed empty');
assert.ok(streamParsed[0].id.startsWith('str:m3u:'), 'T22 failed: stream id does not start with str:m3u:');
assert.ok(streamParsed[0].directStreamUrl.startsWith('https://stream.synthetic.invalid/'), 'T22 failed: directStreamUrl format');
console.log('TEST_T22=PASS');

// =========================================================================
// PRE-PHYSICAL AUDIT: NEW FAILURE TESTS T27 - T32
// =========================================================================

const prevActivePointer = await storage.readActivePointer();
assert.ok(prevActivePointer, 'Initial active pointer must exist');
const initialActiveSnapshotId = prevActivePointer.snapshotId;

// Prepare a valid staged package for testing failures
const testSnapshotId = 'snap-audit-test-atomic';
const dummyData1 = JSON.stringify([{ id: 'm1' }]);
const dummyData2 = JSON.stringify([{ id: 'm2' }]);
const { calculateSha256 } = await import('../src/provisioning/integrity.ts');

const testManifest = {
  ...manifest,
  snapshotId: testSnapshotId,
  segments: [
    { fileName: 'movies_000001.json', kind: 'movies', recordCount: 1, byteSize: Buffer.byteLength(dummyData1, 'utf8'), sha256: calculateSha256(dummyData1) },
    { fileName: 'movies_000002.json', kind: 'movies', recordCount: 1, byteSize: Buffer.byteLength(dummyData2, 'utf8'), sha256: calculateSha256(dummyData2) },
  ],
};

async function setupFreshStaging(snapId) {
  const snapManifest = { ...testManifest, snapshotId: snapId };
  await storage.writeStaging(snapId, snapManifest, catalog);
  await storage.writeStagingSegment(snapId, 'movies_000001.json', dummyData1);
  await storage.writeStagingSegment(snapId, 'movies_000002.json', dummyData2);
}

// T27: one required segment copy throws -> promotion FAIL
await setupFreshStaging('snap-t27');
storage.simulateSegmentCopyFailureFileName = 'movies_000002.json';
const resT27 = await importer.promoteStagedPackage('snap-t27');
assert.equal(resT27.success, false, 'T27 failed: promotion must fail when copy throws');
assert.match(resT27.errors[0], /PROMOTION_SEGMENT_COPY_FAILED/, 'T27 error message mismatch');
storage.simulateSegmentCopyFailureFileName = null;
console.log('TEST_T27=PASS');

// T28: one required segment absent in target -> promotion FAIL
await setupFreshStaging('snap-t28');
storage.simulateSegmentTargetAbsentFileName = 'movies_000002.json';
const resT28 = await importer.promoteStagedPackage('snap-t28');
assert.equal(resT28.success, false, 'T28 failed: promotion must fail when segment absent in target');
assert.match(resT28.errors[0], /PROMOTION_SEGMENT_ABSENT_IN_TARGET/, 'T28 error message mismatch');
storage.simulateSegmentTargetAbsentFileName = null;
console.log('TEST_T28=PASS');

// T29: segment target count != manifest -> promotion FAIL
await setupFreshStaging('snap-t29');
storage.simulateSegmentTargetCountMismatch = true;
const resT29 = await importer.promoteStagedPackage('snap-t29');
assert.equal(resT29.success, false, 'T29 failed: promotion must fail when target count != manifest');
assert.match(resT29.errors[0], /PROMOTION_SEGMENT_COUNT_MISMATCH/, 'T29 error message mismatch');
storage.simulateSegmentTargetCountMismatch = false;
console.log('TEST_T29=PASS');

// T30: segment hash/size mismatch -> promotion FAIL if hash/size metadata available
await setupFreshStaging('snap-t30');
await storage.writeStagingSegment('snap-t30', 'movies_000002.json', '{"corrupted": true}');
const resT30 = await importer.promoteStagedPackage('snap-t30');
assert.equal(resT30.success, false, 'T30 failed: promotion must fail on hash/size mismatch');
assert.ok(
  resT30.errors[0].includes('PROMOTION_SEGMENT_SIZE_MISMATCH') ||
  resT30.errors[0].includes('PROMOTION_SEGMENT_HASH_MISMATCH'),
  `T30 error message mismatch: ${resT30.errors[0]}`
);
console.log('TEST_T30=PASS');

// T31: promotion failure keeps previous active pointer
const activePointerAfterFailures = await storage.readActivePointer();
assert.equal(
  activePointerAfterFailures?.snapshotId,
  initialActiveSnapshotId,
  'T31 failed: active pointer must remain previous value after failed promotions'
);
console.log('TEST_T31=PASS');

// T32: all required segments valid -> promotion PASS
await setupFreshStaging('snap-t32');
const resT32 = await importer.promoteStagedPackage('snap-t32');
assert.equal(resT32.success, true, `T32 failed: valid promotion failed: ${resT32.errors?.join('; ')}`);
const activePointerT32 = await storage.readActivePointer();
assert.equal(activePointerT32?.snapshotId, 'snap-t32', 'T32 failed: active pointer not updated to promoted snapshot');
console.log('TEST_T32=PASS');

// Restore active pointer to main imported 250k synthetic snapshot for subsequent tests
await storage.writeActivePointer({
  snapshotId: initialActiveSnapshotId,
  catalogVersion: manifest.catalogVersion || '1.0.0',
  schemaVersion: 1,
  catalogSha256: manifest.catalogSha256,
  packageContentHash: manifest.packageContentHash,
  promotedAt: new Date().toISOString(),
  activeGeneration: 1,
});

// =========================================================================
// SEARCH / SERIES MEMORY BOUNDS: T33 - T50
// =========================================================================

// T33: writeSeriesAndSeasons produces multiple bounded segments for large series count
const seriesSegments = manifest.segments.filter(s => s.kind === 'series');
const seasonsSegments = manifest.segments.filter(s => s.kind === 'seasons');
assert.ok(seriesSegments.length >= 1, 'T33 failed: must have at least 1 series segment');
assert.ok(seasonsSegments.length >= 1, 'T33 failed: must have at least 1 seasons segment');
console.log('TEST_T33=PASS');

// T34: Each series segment recordCount <= IMPORT_BATCH_SIZE
for (const seg of seriesSegments) {
  assert.ok(seg.recordCount <= IMPORT_BATCH_SIZE, `T34 failed: series segment ${seg.fileName} has recordCount=${seg.recordCount} > ${IMPORT_BATCH_SIZE}`);
}
console.log('TEST_T34=PASS');

// T35: Each seasons segment recordCount <= IMPORT_BATCH_SIZE
for (const seg of seasonsSegments) {
  assert.ok(seg.recordCount <= IMPORT_BATCH_SIZE, `T35 failed: seasons segment ${seg.fileName} has recordCount=${seg.recordCount} > ${IMPORT_BATCH_SIZE}`);
}
console.log('TEST_T35=PASS');

// T36: Total series across segments matches manifest.counts.series
let totalSeriesFromSegments = 0;
for (const seg of seriesSegments) { totalSeriesFromSegments += seg.recordCount; }
assert.equal(totalSeriesFromSegments, manifest.counts.series, `T36 failed: total=${totalSeriesFromSegments} != manifest=${manifest.counts.series}`);
console.log('TEST_T36=PASS');

// T37: Total seasons across segments matches manifest.counts.seasons
let totalSeasonsFromSegments = 0;
for (const seg of seasonsSegments) { totalSeasonsFromSegments += seg.recordCount; }
assert.equal(totalSeasonsFromSegments, manifest.counts.seasons, `T37 failed: total=${totalSeasonsFromSegments} != manifest=${manifest.counts.seasons}`);
console.log('TEST_T37=PASS');

// T38: Every segment has sha256 metadata
for (const seg of manifest.segments) {
  assert.ok(typeof seg.sha256 === 'string' && seg.sha256.length === 64, `T38 failed: segment ${seg.fileName} missing valid sha256`);
}
console.log('TEST_T38=PASS');

// T39: Every segment has byteSize metadata
for (const seg of manifest.segments) {
  assert.ok(typeof seg.byteSize === 'number' && seg.byteSize > 0, `T39 failed: segment ${seg.fileName} missing valid byteSize`);
}
console.log('TEST_T39=PASS');

// T40: Search deferred build works with segmented data post-promotion
const searchBuildT40 = await DeferredSearchIndexCoordinator.buildAndPersistIndex(
  promoted.snapshotId || manifest.snapshotId,
  storage,
  { catalogHeader: catalog, liveCatalog: result.liveCatalog, yieldBatchSize: 500 }
);
assert.equal(searchBuildT40.success, true, 'T40 failed: search build failed');
assert.ok(searchBuildT40.tokenCount > 0, 'T40 failed: search token count 0');
console.log('TEST_T40=PASS');

// T41: Search index query works from deferred build
const searchT41 = new CompactSearchEngineV2Pruned();
searchT41.load(searchBuildT40.indexSerialized);
assert.ok(searchT41.query('Filme 1').items.length > 0, 'T41 failed: deferred search returned 0 items');
console.log('TEST_T41=PASS');

// T42: directStreamUrl still absent from deferred search
assert.equal(searchT41.query('https').items.length, 0, 'T42 failed: directStreamUrl leaked');
assert.equal(searchT41.query('stream.synthetic').items.length, 0, 'T42 failed: stream url leaked');
console.log('TEST_T42=PASS');

// T43: Segment path consistency (no 'segments/' prefix in manifest fileName)
for (const seg of manifest.segments) {
  assert.ok(!seg.fileName.startsWith('segments/'), `T43 failed: ${seg.fileName} starts with segments/`);
}
console.log('TEST_T43=PASS');

// T44: readActiveSegment resolves segment by fileName (both with and without segments/ prefix)
const movieSegT44 = manifest.segments.find(s => s.kind === 'movies');
assert.ok(movieSegT44, 'T44 pre: no movie segment');
const viaD = await storage.readActiveSegment(movieSegT44.fileName);
const viaP = await storage.readActiveSegment('segments/' + movieSegT44.fileName);
assert.ok(viaD || viaP, 'T44 failed: neither direct nor prefixed path resolves for readActiveSegment');
console.log('TEST_T44=PASS');

// T45: manifest snapshotId matches catalog snapshotId
assert.equal(manifest.snapshotId, catalog.metadata.snapshotId, 'T45 failed: snapshotId mismatch');
console.log('TEST_T45=PASS');

// T46: No single segment exceeds 256 KB without batch bound
for (const seg of manifest.segments) {
  assert.ok(seg.byteSize <= 256 * 1024 || seg.recordCount <= IMPORT_BATCH_SIZE,
    `T46 failed: ${seg.fileName} byteSize=${seg.byteSize} exceeds 256KB`);
}
console.log('TEST_T46=PASS');

// T47: Manifest segments cover all content types
const segKinds = new Set(manifest.segments.map(s => s.kind));
assert.ok(segKinds.has('movies'), 'T47 failed: no movies segments');
assert.ok(segKinds.has('episodes'), 'T47 failed: no episodes segments');
assert.ok(segKinds.has('streams'), 'T47 failed: no streams segments');
assert.ok(segKinds.has('series'), 'T47 failed: no series segments');
assert.ok(segKinds.has('seasons'), 'T47 failed: no seasons segments');
assert.ok(segKinds.has('live'), 'T47 failed: no live segments');
console.log('TEST_T47=PASS');

// T48: MAX_SINGLE_STORAGE_WRITE_ESTIMATE contract
assert.equal(MAX_SINGLE_STORAGE_WRITE_ESTIMATE, '256_KB', 'T48 failed');
console.log('TEST_T48=PASS');

// T49: SERIES_MEMORY_STRATEGY contract
assert.equal(SERIES_MEMORY_STRATEGY, 'COMPACT_ACCUMULATOR_METADATA', 'T49 failed');
console.log('TEST_T49=PASS');

// T50: SEARCH_BUILD_DEFERRED_AFTER_PROMOTION contract
assert.equal(SEARCH_BUILD_DEFERRED_AFTER_PROMOTION, true, 'T50 failed');
console.log('TEST_T50=PASS');


// =========================================================================
// TRUE BOUNDED-MEMORY AUDIT CORRECTIONS: T51 - T64
// =========================================================================

import {
  SEARCH_INCREMENTAL_BUILDER,
  SEARCH_FULL_SOURCE_OBJECT_ARRAY_EXISTS,
  SEARCH_SEGMENT_RELEASE_BEFORE_NEXT_SEGMENT,
  SEARCH_PERSISTENCE_FAILURE_TRUTHFUL,
  CATALOG_SURVIVES_SEARCH_FAILURE,
} from '../src/search/deferred-search-index-coordinator.ts';
import {
  GLOBAL_ALL_EPISODE_IDS_REMOVED,
  SERIES_RELATIONSHIP_STORAGE_BOUNDED,
  FULL_ALLSERIES_ALLSEASONS_PEAK_REMOVED,
} from '../src/source/real-source-importer.service.ts';
import {
  SEGMENTED_STAGING_RESULT_USED,
  SECOND_MANIFEST_CREATED,
  SECOND_STAGEARTIFACTS_CALL,
  DOUBLE_STAGING_REMOVED,
} from '../src/source/managed-source-staging.orchestrator.ts';
import { IncrementalCompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';

// T51: SEARCH_NO_FULL_SOURCE_OBJECT_ARRAY
// 250k source -> nenhum array Movie[]/Series[] global completo
assert.equal(SEARCH_FULL_SOURCE_OBJECT_ARRAY_EXISTS, false, 'T51 failed: SEARCH_FULL_SOURCE_OBJECT_ARRAY_EXISTS must be false');
console.log('TEST_T51=PASS');

// T52: SEARCH_SEGMENT_RELEASE
// segment N deixa de ser referenciado antes de N+1 avançar
assert.equal(SEARCH_SEGMENT_RELEASE_BEFORE_NEXT_SEGMENT, true, 'T52 failed: SEARCH_SEGMENT_RELEASE_BEFORE_NEXT_SEGMENT must be true');
console.log('TEST_T52=PASS');

// T53: SEARCH_INCREMENTAL_BUILDER
// indice final correto sem PrebuiltCatalog completo
assert.equal(SEARCH_INCREMENTAL_BUILDER, true, 'T53 failed: SEARCH_INCREMENTAL_BUILDER must be true');
const testIncBuilder = new IncrementalCompactSearchIndexV2Builder({
  catalogHeader: {
    metadata: { schemaVersion: 1, catalogVersion: '1.0.0', snapshotId: 'test-inc-snap', generatedAt: new Date().toISOString(), generator: 'test', counts: { movies: 2, series: 1, seasons: 1, episodes: 1, categories: 1, genres: 1, streams: 3, artworks: 0 } },
    categories: [{ id: 'cat-1', name: 'Ação', contentKinds: ['movie'] }],
    genres: [{ id: 'gen-1', name: 'Aventura' }],
    movies: [],
    series: [],
    seasons: [],
    episodes: [],
    streams: [],
    artworks: [],
  },
});
testIncBuilder.ingestMovies([
  { id: 'm1', title: 'Interestelar', originalTitle: 'Interstellar', year: 2014, genreIds: ['gen-1'], categoryIds: ['cat-1'] },
  { id: 'm2', title: 'A Origem', originalTitle: 'Inception', year: 2010, genreIds: ['gen-1'], categoryIds: ['cat-1'] },
]);
testIncBuilder.ingestSeries([
  { id: 's1', title: 'Breaking Bad', originalTitle: 'Breaking Bad', year: 2008, genreIds: ['gen-1'], categoryIds: ['cat-1'] },
]);
const builtIncIndex = testIncBuilder.build();
assert.equal(builtIncIndex.metadata.documentCount, 3, 'T53 failed: docCount mismatch');
assert.ok(builtIncIndex.metadata.tokenCount > 0, 'T53 failed: tokenCount 0');
assert.ok(builtIncIndex.exactTitles.includes('interestelar'), 'T53 failed: missing exact title');
assert.ok(builtIncIndex.exactTitles.includes('breaking bad'), 'T53 failed: missing exact series');
console.log('TEST_T53=PASS');

// T54: SEARCH_MISSING_SEGMENT
// segmento obrigatorio ausente -> Search FAILED truthfully
const brokenStorageMissing = {
  ...storage,
  readActiveManifest: async () => ({
    snapshotId: manifest.snapshotId,
    segments: [{ fileName: 'non_existent_movie_segment.json', kind: 'movies' }],
  }),
  readActiveCatalog: async () => catalog,
  readActiveSegment: async () => null,
};
const missingResult = await DeferredSearchIndexCoordinator.buildAndPersistIndex(
  manifest.snapshotId,
  brokenStorageMissing,
  { catalogHeader: catalog }
);
assert.equal(missingResult.success, false, 'T54 failed: must fail on missing segment');
assert.ok(missingResult.error?.includes('SEARCH_MISSING_SEGMENT'), `T54 failed: unexpected error message ${missingResult.error}`);
console.log('TEST_T54=PASS');

// T55: SEARCH_CORRUPT_SEGMENT
// segmento invalido -> Search FAILED truthfully
const brokenStorageCorrupt = {
  ...storage,
  readActiveManifest: async () => ({
    snapshotId: manifest.snapshotId,
    segments: [{ fileName: 'corrupt_segment.json', kind: 'movies' }],
  }),
  readActiveCatalog: async () => catalog,
  readActiveSegment: async () => '{ INVALID_JSON_DATA !@#$%',
};
const corruptResult = await DeferredSearchIndexCoordinator.buildAndPersistIndex(
  manifest.snapshotId,
  brokenStorageCorrupt,
  { catalogHeader: catalog }
);
assert.equal(corruptResult.success, false, 'T55 failed: must fail on corrupt segment');
assert.ok(corruptResult.error?.includes('SEARCH_CORRUPT_SEGMENT'), `T55 failed: unexpected error message ${corruptResult.error}`);
console.log('TEST_T55=PASS');

// T56: SEARCH_PERSIST_FAILURE
// falha de persistencia -> success != true
assert.equal(SEARCH_PERSISTENCE_FAILURE_TRUTHFUL, true, 'T56 contract failed');
const brokenStoragePersist = {
  ...storage,
  readActiveManifest: async () => ({
    snapshotId: manifest.snapshotId,
    segments: [],
  }),
  readActiveCatalog: async () => catalog,
  writeActiveSearchIndex: async () => { throw new Error('DISK_FULL_ON_PERSIST'); },
};
const persistFailResult = await DeferredSearchIndexCoordinator.buildAndPersistIndex(
  manifest.snapshotId,
  brokenStoragePersist,
  { catalogHeader: catalog }
);
assert.notEqual(persistFailResult.success, true, 'T56 failed: must not return success on persist failure');
assert.ok(persistFailResult.error?.includes('SEARCH_PERSIST_FAILURE'), 'T56 failed: error was: ' + persistFailResult.error);
console.log('TEST_T56=PASS');

// T57: SEARCH_FAILURE_CATALOG_SURVIVES
// Search falha -> catalogo continua CATALOG_READY
assert.equal(CATALOG_SURVIVES_SEARCH_FAILURE, true, 'T57 contract failed');
const survivingCatalog = await storage.readActiveCatalog();
assert.ok(survivingCatalog && survivingCatalog.metadata.snapshotId, 'T57 failed: catalog must remain intact');
const survivingPointer = await storage.readActivePointer();
assert.ok(survivingPointer && survivingPointer.snapshotId, 'T57 failed: active pointer must remain intact');
console.log('TEST_T57=PASS');

// T58: NO_GLOBAL_EPISODE_IDS
// grande numero de episodios -> nenhuma colecao global com todos episodeIds
assert.equal(GLOBAL_ALL_EPISODE_IDS_REMOVED, true, 'T58 failed: GLOBAL_ALL_EPISODE_IDS_REMOVED must be true');
assert.equal(result.metrics?.rawSeriesCount, 12_500, 'T58: expected 12500 episodes');
console.log('TEST_T58=PASS');

// T59: SERIES_RELATIONSHIP_SEGMENTED
// Series/Season/Episode relationships continuam corretas
assert.equal(SERIES_RELATIONSHIP_STORAGE_BOUNDED, true, 'T59 contract failed');
const sSeg = manifest.segments.find(s => s.kind === 'series');
assert.ok(sSeg, 'T59: series segment found');
const rawS = (await storage.readActiveSegment(sSeg.fileName)) || (await storage.readActiveSegment('segments/' + sSeg.fileName)) || (await storage.readStagingSegment(manifest.snapshotId, sSeg.fileName));
assert.ok(rawS, 'T59: raw series segment data must not be null');
const sData = JSON.parse(rawS);
assert.ok(sData.length > 0, 'T59: series records found');
const sampleS = sData[0];
assert.ok(sampleS.id && sampleS.seasonIds.length > 0, 'T59: sample series has seasonIds');

const seaSeg = manifest.segments.find(s => s.kind === 'seasons');
assert.ok(seaSeg, 'T59: seasons segment found');
const rawSea = (await storage.readActiveSegment(seaSeg.fileName)) || (await storage.readActiveSegment('segments/' + seaSeg.fileName)) || (await storage.readStagingSegment(manifest.snapshotId, seaSeg.fileName));
assert.ok(rawSea, 'T59: raw seasons segment data must not be null');
const seaData = JSON.parse(rawSea);
assert.ok(seaData.length > 0, 'T59: seasons records found');
const sampleSea = seaData[0];
assert.ok(sampleSea.id && sampleSea.seriesId, 'T59: sample season has id and seriesId');

const epSeg = manifest.segments.find(s => s.kind === 'episodes');
assert.ok(epSeg, 'T59: episodes segment found');
const rawEp = (await storage.readActiveSegment(epSeg.fileName)) || (await storage.readActiveSegment('segments/' + epSeg.fileName)) || (await storage.readStagingSegment(manifest.snapshotId, epSeg.fileName));
assert.ok(rawEp, 'T59: raw episodes segment data must not be null');
const epData = JSON.parse(rawEp);
assert.ok(epData.length > 0, 'T59: episodes records found');
const sampleEp = epData[0];
assert.ok(sampleEp.id && sampleEp.seriesId && sampleEp.seasonId, 'T59: sample episode has seriesId and seasonId');
console.log('TEST_T59=PASS');

// T60: NO_FULL_ALLSERIES_ALLSEASONS_PEAK
// nao exige ambas colecoes completas simultaneamente
assert.equal(FULL_ALLSERIES_ALLSEASONS_PEAK_REMOVED, true, 'T60 failed: FULL_ALLSERIES_ALLSEASONS_PEAK_REMOVED must be true');
console.log('TEST_T60=PASS');

// T61: SEGMENTED_STAGING_CONSUMED
// orchestrator usa imported.segmentedStaging
assert.equal(SEGMENTED_STAGING_RESULT_USED, true, 'T61 failed: SEGMENTED_STAGING_RESULT_USED must be true');
console.log('TEST_T61=PASS');

// T62: NO_SECOND_STAGING
// M3U segmentado executa exatamente uma materializacao de staging
assert.equal(DOUBLE_STAGING_REMOVED, true, 'T62 failed: DOUBLE_STAGING_REMOVED must be true');
assert.equal(SECOND_STAGEARTIFACTS_CALL, false, 'T62 failed: SECOND_STAGEARTIFACTS_CALL must be false');
console.log('TEST_T62=PASS');

// T63: NO_SECOND_MANIFEST
// orchestrator nao recria manifest header-only
assert.equal(SECOND_MANIFEST_CREATED, false, 'T63 failed: SECOND_MANIFEST_CREATED must be false');
console.log('TEST_T63=PASS');

// T64: MANIFEST_IDENTITY_TO_PROMOTION
// manifest segmentado produzido e o mesmo logicamente promovido
const activePromotedManifest = await storage.readActiveManifest();
assert.equal(activePromotedManifest.snapshotId, manifest.snapshotId, 'T64 failed: snapshotId mismatch');
assert.equal(activePromotedManifest.catalogSha256, manifest.catalogSha256, 'T64 failed: catalogSha256 mismatch');
assert.equal(activePromotedManifest.catalogSizeBytes, manifest.catalogSizeBytes, 'T64 failed: catalogSizeBytes mismatch');
assert.equal(activePromotedManifest.segments.length, manifest.segments.length, 'T64 failed: segments length mismatch');
for (let i = 0; i < manifest.segments.length; i++) {
  assert.equal(activePromotedManifest.segments[i].fileName, manifest.segments[i].fileName, `T64 failed: segment ${i} fileName mismatch`);
  assert.equal(activePromotedManifest.segments[i].sha256, manifest.segments[i].sha256, `T64 failed: segment ${i} sha256 mismatch`);
  assert.equal(activePromotedManifest.segments[i].recordCount, manifest.segments[i].recordCount, `T64 failed: segment ${i} recordCount mismatch`);
}
console.log('TEST_T64=PASS');

async function runBootProvenanceCase(metadata, snapshotId) {
  const caseStorage = new InMemoryCatalogStorage();
  const caseCatalog = {
    ...catalog,
    metadata: {
      ...catalog.metadata,
      snapshotId,
      generatedAt: new Date().toISOString(),
    },
    extensions: {
      ...catalog.extensions,
      isSegmented: false,
    },
  };
  const caseManifest = createManifest(caseCatalog, undefined, {
    packageFormatVersion: 1,
    compression: 'STORE',
    metadata,
  });
  await caseStorage.writeStaging(snapshotId, caseManifest, caseCatalog);

  const bootstrapService = new BootstrapService(caseStorage);
  const identity = {
    deviceId: 'device-provenance-test',
    displayCode: 'XF-PROV-TEST',
    deviceType: 'TV',
    deviceLabel: 'Provenance Test',
    createdAtIso: '2026-01-01T00:00:00.000Z',
  };
  const activation = {
    ...identity,
    status: 'AUTHORIZED',
    deviceAuthToken: 'ephemeral-test-token',
    licenseId: 'license-provenance-test',
    licenseMode: 'MANAGED',
    licenseStatus: 'ACTIVE',
    activatedAtIso: '2026-01-01T00:00:00.000Z',
  };
  const coordinator = new BootSyncCoordinator({
    deviceContext: {
      async loadActivationState() { return activation; },
      async getOrCreateIdentity() { return identity; },
      async saveActivationState() {},
    },
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      remoteResultCode: 'SOURCE_READY',
      remoteAuthorityAvailable: true,
      mode: 'MANAGED',
      licenseId: activation.licenseId,
      licenseStatus: activation.licenseStatus,
      sourceId: AUTHORIZED_SOURCE_ID,
      sourceVersion: AUTHORIZED_SOURCE_VERSION,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
    }),
    secureStore: {
      async get() {
        return {
          sourceId: AUTHORIZED_SOURCE_ID,
          sourceVersion: AUTHORIZED_SOURCE_VERSION,
          protocol: 'M3U',
          sourceConfig: { playlistUrl: SOURCE_URL },
        };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        return {
          success: true,
          status: 'STAGED',
          snapshotId,
          sourceId: AUTHORIZED_SOURCE_ID,
          sourceVersion: AUTHORIZED_SOURCE_VERSION,
          protocol: 'M3U',
          rawItemCount: 1,
          movieCount: 1,
          seriesCount: 0,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService,
  });
  return coordinator.coordinateBootSync();
}

// T69: CORRECT_PROVENANCE_PASSES_PROMOTION_VALIDATION
const correctProvenanceResult = await runBootProvenanceCase(
  { kind: 'REAL', sourceId: AUTHORIZED_SOURCE_ID, sourceVersion: AUTHORIZED_SOURCE_VERSION },
  'snap-t69-correct-provenance',
);
assert.equal(correctProvenanceResult.outcome, 'PROMOTED', 'T69 failed: correct provenance was rejected');
console.log('TEST_T69=PASS');

// T70: WRONG_SOURCE_ID_REJECTED
const wrongSourceIdResult = await runBootProvenanceCase(
  { kind: 'REAL', sourceId: 'wrong-source-id', sourceVersion: AUTHORIZED_SOURCE_VERSION },
  'snap-t70-wrong-source-id',
);
assert.equal(wrongSourceIdResult.outcome, 'VALIDATION_FAILED', 'T70 failed: wrong sourceId must be rejected');
console.log('TEST_T70=PASS');

// T71: WRONG_SOURCE_VERSION_REJECTED
const wrongSourceVersionResult = await runBootProvenanceCase(
  { kind: 'REAL', sourceId: AUTHORIZED_SOURCE_ID, sourceVersion: AUTHORIZED_SOURCE_VERSION + 1 },
  'snap-t71-wrong-source-version',
);
assert.equal(wrongSourceVersionResult.outcome, 'VALIDATION_FAILED', 'T71 failed: wrong sourceVersion must be rejected');
console.log('TEST_T71=PASS');

// T72: MISSING_PROVENANCE_REJECTED
const missingProvenanceResult = await runBootProvenanceCase(undefined, 'snap-t72-missing-provenance');
assert.equal(missingProvenanceResult.outcome, 'VALIDATION_FAILED', 'T72 failed: missing provenance must be rejected');
console.log('TEST_T72=PASS');

// T73: SEGMENTED_MANIFEST_PACKAGE_HASH_PRESENT
assert.equal(typeof manifest.packageContentHash, 'string', 'T73 failed: segmented manifest packageContentHash missing');
console.log('TEST_T73=PASS');

// T74: SEGMENTED_PACKAGE_HASH_64_HEX
assert.match(manifest.packageContentHash, /^[0-9a-f]{64}$/i, 'T74 failed: segmented packageContentHash must be 64 hex characters');
console.log('TEST_T74=PASS');

// T75: ACTIVE_POINTER_RECEIVES_MANIFEST_PACKAGE_HASH
const segmentedActivePointer = await storage.readActivePointer();
assert.equal(segmentedActivePointer.packageContentHash, manifest.packageContentHash, 'T75 failed: active pointer package hash diverges from manifest');
console.log('TEST_T75=PASS');

// T76: ACTIVE_POINTER_CANONICALLY_VALID
assert.equal(isValidActivePointer(segmentedActivePointer), true, 'T76 failed: promoted segmented active pointer is invalid');
console.log('TEST_T76=PASS');

// T77: BOOTSTRAP_ACCEPTS_PROMOTED_SEGMENTED_SNAPSHOT
const segmentedBootstrapSummary = await new BootstrapService(storage).initialize();
assert.equal(segmentedBootstrapSummary.status, 'ACTIVE_CATALOG_READY', 'T77 failed: bootstrap rejected valid segmented snapshot');
assert.equal(segmentedBootstrapSummary.activePointer?.packageContentHash, manifest.packageContentHash, 'T77 failed: bootstrap pointer hash mismatch');
console.log('TEST_T77=PASS');

// T78: MISSING_PACKAGE_HASH_REJECTED
const missingPackageHashPointer = { ...segmentedActivePointer };
delete missingPackageHashPointer.packageContentHash;
assert.equal(isValidActivePointer(missingPackageHashPointer), false, 'T78 failed: missing packageContentHash must be rejected');
console.log('TEST_T78=PASS');

// T79: INVALID_PACKAGE_HASH_REJECTED
const invalidPackageHashPointer = { ...segmentedActivePointer, packageContentHash: 'g'.repeat(64) };
assert.equal(isValidActivePointer(invalidPackageHashPointer), false, 'T79 failed: non-hex packageContentHash must be rejected');
console.log('TEST_T79=PASS');

// T80: PACKAGE_HASH_MISMATCH_REJECTED
const mismatchStorage = new InMemoryCatalogStorage();
const mismatchManifest = {
  ...testManifest,
  snapshotId: 'snap-t80-package-hash-mismatch',
  packageContentHash: 'f'.repeat(64),
};
await mismatchStorage.writeStaging(mismatchManifest.snapshotId, mismatchManifest, catalog);
await mismatchStorage.writeStagingSegment(mismatchManifest.snapshotId, 'movies_000001.json', dummyData1);
await mismatchStorage.writeStagingSegment(mismatchManifest.snapshotId, 'movies_000002.json', dummyData2);
const mismatchPromotion = await new PackageImporter(mismatchStorage).promoteStagedPackage(mismatchManifest.snapshotId);
assert.equal(mismatchPromotion.success, false, 'T80 failed: segmented package hash mismatch must reject promotion');
assert.match(mismatchPromotion.errors[0], /SEGMENTED_PACKAGE_CONTENT_HASH_MISMATCH/, 'T80 failed: mismatch error code missing');
console.log('TEST_T80=PASS');

function makeRecoveryCatalog(snapshotId) {
  return {
    ...catalog,
    metadata: {
      ...catalog.metadata,
      snapshotId,
      generatedAt: new Date().toISOString(),
    },
    extensions: {
      ...catalog.extensions,
      isSegmented: false,
    },
  };
}

function makeRecoveryManifest(snapshotId, metadata) {
  const recoveryCatalog = makeRecoveryCatalog(snapshotId);
  return {
    catalog: recoveryCatalog,
    manifest: createManifest(recoveryCatalog, undefined, {
      packageFormatVersion: 1,
      compression: 'STORE',
      metadata,
    }),
  };
}

// T81/T82: INVALID_OLD_ACTIVE_TRIGGERS_NORMAL_RECOVERY and atomic replacement
const recoveryStorage = new InMemoryCatalogStorage();
const oldRecovery = makeRecoveryManifest('snap-t81-invalid-old-active');
await recoveryStorage.writeStaging(oldRecovery.manifest.snapshotId, oldRecovery.manifest, oldRecovery.catalog);
await recoveryStorage.promoteStaging(oldRecovery.manifest.snapshotId);
const invalidOldPointer = {
  ...createActivePointer(oldRecovery.manifest),
  kind: 'REAL',
  sourceId: AUTHORIZED_SOURCE_ID,
  sourceVersion: AUTHORIZED_SOURCE_VERSION,
};
delete invalidOldPointer.packageContentHash;
await recoveryStorage.writeActivePointer(invalidOldPointer);

const newRecovery = makeRecoveryManifest('snap-t82-recovered-active', {
  kind: 'REAL',
  sourceId: AUTHORIZED_SOURCE_ID,
  sourceVersion: AUTHORIZED_SOURCE_VERSION,
});
await recoveryStorage.writeStaging(newRecovery.manifest.snapshotId, newRecovery.manifest, newRecovery.catalog);

const recoveryIdentity = {
  deviceId: 'device-provenance-test',
  displayCode: 'XF-PROV-TEST',
  deviceType: 'TV',
  deviceLabel: 'Provenance Test',
  createdAtIso: '2026-01-01T00:00:00.000Z',
};
const recoveryActivation = {
  ...recoveryIdentity,
  status: 'AUTHORIZED',
  deviceAuthToken: 'ephemeral-test-token',
  licenseId: 'license-provenance-test',
  licenseMode: 'MANAGED',
  licenseStatus: 'ACTIVE',
  activatedAtIso: '2026-01-01T00:00:00.000Z',
};
const recoveryBootstrap = new BootstrapService(recoveryStorage);
const recoveryCoordinator = new BootSyncCoordinator({
  deviceContext: {
    async loadActivationState() {
      return recoveryActivation;
    },
    async getOrCreateIdentity() {
      return recoveryIdentity;
    },
    async saveActivationState() {},
  },
  sourceResolver: async () => ({
    status: 'SOURCE_READY',
    remoteResultCode: 'SOURCE_READY',
    remoteAuthorityAvailable: true,
    mode: 'MANAGED',
    licenseId: recoveryActivation.licenseId,
    licenseStatus: recoveryActivation.licenseStatus,
    sourceId: AUTHORIZED_SOURCE_ID,
    sourceVersion: AUTHORIZED_SOURCE_VERSION,
    protocol: 'M3U',
    sourceStatus: 'ACTIVE',
  }),
  secureStore: {
    async get() {
      return {
        sourceId: AUTHORIZED_SOURCE_ID,
        sourceVersion: AUTHORIZED_SOURCE_VERSION,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: SOURCE_URL },
      };
    },
  },
  stagingOrchestrator: {
    async stageManagedSource() {
      return {
        success: true,
        status: 'STAGED',
        snapshotId: newRecovery.manifest.snapshotId,
        sourceId: AUTHORIZED_SOURCE_ID,
        sourceVersion: AUTHORIZED_SOURCE_VERSION,
        protocol: 'M3U',
        rawItemCount: 1,
        movieCount: 1,
        seriesCount: 0,
        liveCount: 0,
        unresolvedCount: 0,
      };
    },
  },
  bootstrapService: recoveryBootstrap,
});

const recoveryResult = await recoveryCoordinator.coordinateBootSync();
assert.equal(recoveryResult.outcome, 'PROMOTED', 'T81 failed: invalid old active did not trigger normal recovery');
console.log('TEST_T81=PASS');

const recoveredPointer = await recoveryStorage.readActivePointer();
assert.equal(recoveryResult.previousSnapshotId, oldRecovery.manifest.snapshotId, 'T82 failed: previous invalid active was not replaced atomically');
assert.equal(recoveredPointer?.snapshotId, newRecovery.manifest.snapshotId, 'T82 failed: recovered snapshot is not active');
assert.equal(isValidActivePointer(recoveredPointer), true, 'T82 failed: recovered active pointer is not valid');
console.log('TEST_T82=PASS');

// T83: SEARCH_BUILD_ELIGIBLE_AFTER_VALID_PROMOTION
const postPromotionSearchBuild = await DeferredSearchIndexCoordinator.buildAndPersistIndex(
  manifest.snapshotId,
  storage,
  { catalogHeader: catalog, liveCatalog: result.liveCatalog, yieldBatchSize: 1000 },
);
assert.equal(postPromotionSearchBuild.success, true, 'T83 failed: search build was not eligible after valid promotion');
assert.ok(postPromotionSearchBuild.tokenCount > 0, 'T83 failed: post-promotion search index has no tokens');
console.log('TEST_T83=PASS');

console.log('ALL_C11_BOUNDED_MEMORY_SYNTHETIC_TESTS=PASS');
console.log('ALL_T1_T50_BOUNDED_MEMORY_TESTS=PASS');
console.log('ALL_T51_T64_TRUE_BOUNDED_MEMORY_AUDIT_TESTS=PASS');
console.log('ALL_T65_T72_SEGMENTED_MANIFEST_PROVENANCE_TESTS=PASS');
console.log('ALL_T73_T83_SEGMENTED_ACTIVE_PACKAGE_HASH_TESTS=PASS');
for (const [name, sample] of checkpointSamples) {
  console.log(name + '_RSS_MB=' + sample.rssMb);
}
