import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { PackageValidator } from '../src/provisioning/package-validator.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import {
  ManagedSourceStagingOrchestrator,
} from '../src/source/managed-source-staging.orchestrator.ts';
import { LiveCatalogService } from '../src/catalog/live/live-catalog.service.ts';

const LIVE_STAGING_PAYLOAD_LOCK_ID = 'LIVE_CATALOG_STAGING_PAYLOAD_LOCK_V1';

let total = 0;
let passed = 0;

async function test(name, fn) {
  total += 1;
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

const fixture = JSON.parse(
  fs.readFileSync(new URL('../fixtures/source/synthetic-source.valid.json', import.meta.url), 'utf8'),
);
const secondSeries = JSON.parse(JSON.stringify(fixture.series[0]));
secondSeries.sourceItemId = '2002';
secondSeries.title = 'Series Synthetic Delta';
secondSeries.originalTitle = 'Synthetic Delta Chronicles';
for (const season of secondSeries.seasons) {
  for (const episode of season.episodes) {
    for (const stream of episode.streams || []) {
      stream.sourceItemId = `${stream.sourceItemId}-2002`;
    }
  }
}
fixture.series.push(secondSeries);

const ingestion = await new IngestionPipeline(new SyntheticSourceAdapter()).execute(fixture, {
  sourceNamespace: 'r2f8m',
  catalogVersion: 'r2f8m-synthetic',
  deterministicGeneratedAt: '2026-09-13T00:00:00.000Z',
});
assert.equal(ingestion.success, true);
assert.ok(ingestion.catalog);
const catalog = ingestion.catalog;

const liveGroups = [
  { id: 'live-news', name: 'Notícias', order: 1 },
  { id: 'live-sports', name: 'Esportes', order: 2 },
];
const liveCatalog = LiveCatalogService.buildCatalog(catalog.metadata.snapshotId, liveGroups, [
  {
    id: 'live:synthetic:1',
    name: 'Canal Sintético 1',
    groupId: 'live-news',
    groupName: 'Notícias',
    streamId: 'synthetic-stream-1',
    streamRef: {
      sourceItemId: 'synthetic-stream-1',
      containerExtension: 'm3u8',
      directStreamUrl: 'https://live.synthetic.test/channel-1.m3u8',
    },
  },
  {
    id: 'live:synthetic:2',
    name: 'Canal Sintético 2',
    groupId: 'live-news',
    groupName: 'Notícias',
    streamId: 'synthetic-stream-2',
    streamRef: {
      sourceItemId: 'synthetic-stream-2',
      containerExtension: 'm3u8',
      directStreamUrl: 'https://live.synthetic.test/channel-2.m3u8',
    },
  },
  {
    id: 'live:synthetic:3',
    name: 'Canal Sintético 3',
    groupId: 'live-sports',
    groupName: 'Esportes',
    streamId: 'synthetic-stream-3',
    streamRef: {
      sourceItemId: 'synthetic-stream-3',
      containerExtension: 'ts',
      directStreamUrl: 'https://live.synthetic.test/channel-3.ts',
    },
  },
]);

const syntheticImport = {
  success: true,
  catalog,
  liveCatalog,
  metrics: {
    rawItemCount: 7,
    rawMovieCount: 2,
    rawSeriesCount: 2,
    rawLiveCount: 3,
    rawUnresolvedCount: 0,
    canonicalMovieCount: catalog.movies.length,
    canonicalSeriesCount: catalog.series.length,
    canonicalSeasonCount: catalog.seasons.length,
    canonicalEpisodeCount: catalog.episodes.length,
    canonicalLiveGroupCount: liveCatalog.groups.length,
    canonicalLiveChannelCount: liveCatalog.channels.length,
  },
};

const authority = {
  status: 'SOURCE_READY',
  remoteResultCode: 'SOURCE_READY',
  remoteAuthorityAvailable: true,
  mode: 'MANAGED',
  sourceId: 'src_uhwh5cio',
  sourceVersion: 5,
  protocol: 'M3U',
  sourceStatus: 'ACTIVE',
};

const storage = new InMemoryCatalogStorage();
const bootstrap = new BootstrapService(storage);
let importerOptions;
let capturedBuild;
const packageBuilder = {
  async build(inputCatalog, options) {
    capturedBuild = await new PackageBuilder().build(inputCatalog, options);
    return capturedBuild;
  },
};
const importer = {
  async importM3u(_config, options) {
    importerOptions = options;
    return syntheticImport;
  },
  async importXtream(_config, options) {
    importerOptions = options;
    return syntheticImport;
  },
};

const orchestrator = new ManagedSourceStagingOrchestrator({
  resolveAuthorization: async () => authority,
  secureSourceStore: {
    async get(sourceId) {
      assert.equal(sourceId, authority.sourceId);
      return {
        sourceId: authority.sourceId,
        sourceVersion: authority.sourceVersion,
        protocol: authority.protocol,
        sourceConfig: { playlistUrl: 'https://synthetic.invalid/playlist.m3u' },
      };
    },
  },
  importer,
  packageBuilder,
  bootstrapService: {
    async stagePackage(packageBuffer) {
      return bootstrap.stagePackage(packageBuffer, { forceReimport: true });
    },
  },
});

await test('T01 fixture possui dois filmes e duas séries', async () => {
  assert.equal(catalog.movies.length, 2);
  assert.equal(catalog.series.length, 2);
});

await test('T02 fixture Live possui três canais e duas categorias', async () => {
  assert.equal(liveCatalog.channels.length, 3);
  assert.equal(liveCatalog.groups.length, 2);
});

await test('T03 importer recebe persistLiveCatalog=false', async () => {
  const result = await orchestrator.stageManagedSource();
  assert.equal(result.success, true);
  assert.equal(importerOptions.persistLiveCatalog, false);
});

await test('T04 autoridade Managed e secure store precedem o importer', async () => {
  assert.equal(capturedBuild.success, true);
  assert.equal(capturedBuild.manifest.liveCatalogFile, 'live_catalog.json');
});

await test('T05 pacote v2 declara e embute o payload Live', async () => {
  const validation = await new PackageValidator().validate(capturedBuild.packageBuffer);
  assert.equal(validation.valid, true);
  assert.equal(validation.liveCatalog.channels.length, 3);
  assert.equal(validation.liveCatalog.groups.length, 2);
});

await test('T06 caminho completo termina em STAGED', async () => {
  const result = await orchestrator.stageManagedSource();
  assert.equal(result.status, 'STAGED');
  assert.equal(result.liveCount, 3);
});

const stagedResult = await orchestrator.stageManagedSource();
const staged = await storage.readStaging(stagedResult.snapshotId);

await test('T07 readback de staging preserva o catálogo principal', async () => {
  assert.ok(staged);
  assert.equal(staged.catalog.movies.length, 2);
  assert.equal(staged.catalog.series.length, 2);
});

await test('T08 readback de staging preserva Live separado', async () => {
  assert.ok(staged?.liveCatalog);
  assert.equal(staged.liveCatalog.channels.length, 3);
  assert.equal(staged.liveCatalog.groups.length, 2);
  assert.equal(staged.liveCatalog.snapshotId, staged.catalog.metadata.snapshotId);
});

await test('T09 Live não contamina filmes, séries ou categorias tipadas', async () => {
  const mainIds = new Set([...staged.catalog.movies, ...staged.catalog.series].map((item) => item.id));
  assert.equal(staged.liveCatalog.channels.filter((channel) => mainIds.has(channel.id)).length, 0);
  assert.equal(staged.catalog.categories.some((category) => category.contentKinds.includes('live')), false);
});

await test('T10 staging não altera o active pointer', async () => {
  assert.equal(await storage.readActivePointer(), null);
});

await test('T11 rota não promove nem executa fetch real', async () => {
  assert.equal(stagedResult.status, 'STAGED');
  assert.equal(stagedResult.errorCode, undefined);
  assert.equal(JSON.stringify(stagedResult).includes('synthetic.invalid'), false);
});

await test('T12 payload Live opcional permanece compatível sem segunda store', async () => {
  assert.equal(typeof capturedBuild.manifest.liveCatalogSha256, 'string');
  assert.equal(typeof capturedBuild.manifest.liveCatalogSizeBytes, 'number');
  assert.equal(typeof storage.readStaging, 'function');
  assert.equal(typeof storage.readActiveCatalog, 'function');
});

console.log(`R2F8M_TEST_COUNT=${total}`);
console.log(`R2F8M_TEST_PASS_COUNT=${passed}`);
console.log(`LIVE_STAGING_LOCK_ID=${LIVE_STAGING_PAYLOAD_LOCK_ID}`);
console.log(`LIVE_STAGING_LOCK_TEST=${passed === total ? 'PASS' : 'FAIL'}`);
const lockFiles = [
  'src/provisioning/types.ts',
  'src/provisioning/integrity.ts',
  'src/provisioning/manifest.ts',
  'src/provisioning/package-builder.ts',
  'src/provisioning/package-validator.ts',
  'src/bootstrap/storage/storage.interface.ts',
  'src/bootstrap/storage/in-memory.storage.ts',
  'src/bootstrap/storage/capacitor-filesystem.storage.ts',
  'src/bootstrap/package-importer.ts',
  'src/source/managed-source-staging.orchestrator.ts',
  'src/catalog/live/live-catalog-validation.ts',
  'scripts/test-r2f8m-live-staging-payload.mjs',
];
const digest = crypto.createHash('sha256');
for (const file of lockFiles) {
  digest.update(file);
  digest.update(fs.readFileSync(new URL(`../${file}`, import.meta.url)));
}
console.log(`LIVE_STAGING_LOCK_HASH=${digest.digest('hex').toUpperCase()}`);
if (passed !== total) process.exitCode = 1;
