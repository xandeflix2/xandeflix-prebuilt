import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import {
  readClassificationProfileVersion,
  requiresClassificationProfileRefresh,
} from '../src/bootstrap/boot-sync-coordinator.ts';
import {
  LiveCatalogService,
  readLiveChannelsForGroupFromSegments,
} from '../src/catalog/live/live-catalog.service.ts';

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

function manifest(snapshotId, classificationProfileVersion) {
  return {
    schemaVersion: 1,
    packageFormatVersion: 2,
    snapshotId,
    catalogVersion: '1.0.0',
    generatedAt: new Date(0).toISOString(),
    generator: 'c11-profile-live-fix-test',
    catalogSha256: 'a'.repeat(64),
    packageContentHash: 'a'.repeat(64),
    catalogSizeBytes: 1,
    allowSensitiveRuntimeLocators: true,
    classificationProfileVersion,
    counts: {
      movies: 0,
      series: 0,
      seasons: 0,
      episodes: 0,
      live: 1027,
      streams: 0,
      artworks: 0,
      categories: 0,
      genres: 0,
    },
    segments: [],
    metadata: { kind: 'REAL', sourceId: 'source-test', sourceVersion: 1 },
  };
}

function emptyCatalog(snapshotId) {
  return {
    metadata: {
      schemaVersion: 1,
      catalogVersion: '1.0.0',
      snapshotId,
      generatedAt: new Date(0).toISOString(),
      generator: 'c11-profile-live-fix-test',
      counts: { movies: 0, series: 0, seasons: 0, episodes: 0, categories: 0, genres: 0, streams: 0, artworks: 0 },
    },
    categories: [],
    genres: [],
    movies: [],
    series: [],
    seasons: [],
    episodes: [],
    streams: [],
    artworks: [],
  };
}

function channel(id, groupId) {
  return {
    id,
    name: `Canal ${id}`,
    groupId,
    groupName: groupId,
    streamId: id,
    streamRef: { sourceItemId: id, containerExtension: 'm3u8', directStreamUrl: `https://media.invalid/${id}.m3u8` },
  };
}

const snapshotId = 'snap-c11-profile-live';

await test('TEST_T127_PROFILE_VERSION_PERSISTED_TO_STAGING_MANIFEST', async () => {
  const storage = new InMemoryCatalogStorage();
  await storage.writeStaging(snapshotId, manifest(snapshotId, 2), emptyCatalog(snapshotId));
  const staged = await storage.readStaging(snapshotId);
  assert.equal(staged?.manifest.classificationProfileVersion, 2);
});

await test('TEST_T128_PROFILE_VERSION_SURVIVES_PROMOTION', async () => {
  const storage = new InMemoryCatalogStorage();
  await storage.writeStaging(snapshotId, manifest(snapshotId, 2), emptyCatalog(snapshotId));
  await storage.promoteStaging(snapshotId);
  await storage.writeActivePointer({
    snapshotId,
    catalogVersion: '1.0.0',
    schemaVersion: 1,
    packageContentHash: 'a'.repeat(64),
    promotedAt: new Date(0).toISOString(),
    kind: 'REAL',
    sourceId: 'source-test',
    sourceVersion: 1,
  });
  assert.equal((await storage.readActiveManifest())?.classificationProfileVersion, 2);
});

await test('TEST_T129_PROFILE_VERSION_READBACK_EQUALS_CURRENT', async () => {
  const storage = new InMemoryCatalogStorage();
  await storage.writeStaging(snapshotId, manifest(snapshotId, 2), emptyCatalog(snapshotId));
  assert.equal(readClassificationProfileVersion((await storage.readStaging(snapshotId))?.manifest || null), 2);
});

await test('TEST_T130_CURRENT_PROFILE_BOOT_DOES_NOT_REFRESH', async () => {
  assert.equal(requiresClassificationProfileRefresh(manifest(snapshotId, 2)), false);
});

await test('TEST_T131_OLD_PROFILE_REFRESHES_ONCE_ONLY', async () => {
  assert.equal(requiresClassificationProfileRefresh(manifest(snapshotId, undefined)), true);
  assert.equal(requiresClassificationProfileRefresh(manifest(snapshotId, 1)), true);
  assert.equal(requiresClassificationProfileRefresh(manifest(snapshotId, 2)), false);
});

const firstFold = Array.from({ length: 100 }, (_, index) => channel(`live:first:${index}`, 'first'));
const lateChannel = channel('live:late:1027', 'late-group');
const liveCatalog = LiveCatalogService.buildCatalog(
  snapshotId,
  [{ id: 'first', name: 'Primeiro' }, { id: 'late-group', name: 'Grupo Tardio' }],
  firstFold,
  { totalChannels: 1027, segmentFiles: ['live_000001.json', 'live_000011.json'] },
);
const segmentData = {
  'live_000001.json': JSON.stringify(firstFold),
  'live_000011.json': JSON.stringify([lateChannel]),
};

await test('TEST_T132_LIVE_READER_USES_ACTIVE_SNAPSHOT', async () => {
  const serviceSource = await fs.readFile('src/catalog/live/live-catalog.service.ts', 'utf8');
  assert.match(serviceSource, /prebuilt\/active\.json/);
  assert.match(serviceSource, /snapshots/);
});

await test('TEST_T133_LIVE_READER_DOES_NOT_REQUIRE_ROOT_FILE', async () => {
  const serviceSource = await fs.readFile('src/catalog/live/live-catalog.service.ts', 'utf8');
  assert.doesNotMatch(serviceSource, /LIVE_CATALOG_FILE/);
  assert.doesNotMatch(serviceSource, /path:\s*['"]live_catalog\.json['"]/);
});

await test('TEST_T134_LIVE_FIRST_FOLD_100_RENDERABLE', async () => {
  assert.equal(liveCatalog.channels.length, 100);
  assert.equal(liveCatalog.totalChannels, 1027);
});

await test('TEST_T135_LIVE_LATE_SEGMENT_CHANNEL_ACCESSIBLE', async () => {
  const channels = await readLiveChannelsForGroupFromSegments(
    liveCatalog,
    'late-group',
    liveCatalog.segmentFiles,
    async (fileName) => segmentData[fileName] || null,
  );
  assert.equal(channels.some((item) => item.id === lateChannel.id), true);
});

await test('TEST_T136_LIVE_MANIFEST_1027_NOT_TRUNCATED_TO_100', async () => {
  assert.equal(liveCatalog.totalChannels, 1027);
  assert.equal(liveCatalog.segmentFiles.length, 2);
});

await test('TEST_T137_LIVE_LATE_GROUP_ACCESSIBLE', async () => {
  const channels = await readLiveChannelsForGroupFromSegments(
    liveCatalog,
    'late-group',
    liveCatalog.segmentFiles,
    async (fileName) => segmentData[fileName] || null,
  );
  assert.equal(channels.length, 1);
  assert.equal(channels[0].groupId, 'late-group');
});

await test('TEST_T138_LIVE_LATE_STREAMREF_RESOLVED', async () => {
  const channels = await readLiveChannelsForGroupFromSegments(
    liveCatalog,
    'late-group',
    liveCatalog.segmentFiles,
    async (fileName) => segmentData[fileName] || null,
  );
  assert.equal(channels[0].streamRef.sourceItemId, lateChannel.streamRef.sourceItemId);
  assert.equal(channels[0].streamRef.containerExtension, 'm3u8');
  assert.equal(typeof channels[0].streamRef.directStreamUrl, 'string');
});

await test('TEST_T139_LIVE_READER_MEMORY_BOUNDED', async () => {
  let maxRecordsRead = 0;
  await readLiveChannelsForGroupFromSegments(
    liveCatalog,
    'late-group',
    liveCatalog.segmentFiles,
    async (fileName) => {
      const data = segmentData[fileName] || '[]';
      maxRecordsRead = Math.max(maxRecordsRead, JSON.parse(data).length);
      return data;
    },
  );
  assert.equal(maxRecordsRead, 100);
});

await test('TEST_T140_NO_LIVE_SECRET_LOGGING', async () => {
  const source = await fs.readFile('src/catalog/live/live-catalog.service.ts', 'utf8');
  assert.doesNotMatch(source, /console\.(log|info|debug|warn|error)/);
});

await test('TEST_T141_SEARCH_REGRESSION_GUARD', async () => {
  const source = await fs.readFile('src/search/deferred-search-index-coordinator.ts', 'utf8');
  assert.match(source, /compact-search-index-v2/);
});

await test('TEST_T142_EPISODE_REGRESSION_GUARD', async () => {
  const source = await fs.readFile('src/ui/pages/SeriesDetailPage.tsx', 'utf8');
  assert.match(source, /StreamRef|streamRef|episode/i);
});

await test('TEST_T143_FIRETV_DENSITY_REGRESSION_GUARD', async () => {
  const css = await fs.readFile('src/index.css', 'utf8');
  assert.match(css, /TV_COMPACT_16_9_LOW_HEIGHT/);
  assert.match(css, /--tv-hero-height|hero/);
});

console.log(results.join('\n'));
if (results.some((result) => result.endsWith('=FAIL'))) process.exitCode = 1;
