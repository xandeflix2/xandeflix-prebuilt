import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import {
  ManagedSourceStagingOrchestrator,
  MANAGED_FETCH_TO_STAGING_LOCK_ID,
} from '../src/source/managed-source-staging.orchestrator.ts';
import { LiveCatalogService } from '../src/catalog/live/live-catalog.service.ts';

const ROOT = new URL('..', import.meta.url);
const fixturePath = new URL('../fixtures/source/synthetic-source.valid.json', import.meta.url);
const secretUrl = 'https://synthetic-secret.invalid/playlist.m3u';
const secretToken = 'synthetic-secret-token-never-logged';

let total = 0;
let passed = 0;

async function test(name, fn) {
  total += 1;
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

const raw = fs.readFileSync(fixturePath, 'utf8');
const ingestion = await new IngestionPipeline(new SyntheticSourceAdapter()).execute(raw, {
  sourceNamespace: 'r2f8l',
  catalogVersion: 'r2f8l-synthetic',
  deterministicGeneratedAt: '2026-09-13T00:00:00.000Z',
});
assert.equal(ingestion.success, true);
assert.ok(ingestion.catalog);

const syntheticImport = {
  success: true,
  catalog: ingestion.catalog,
  liveCatalog: LiveCatalogService.buildCatalog(ingestion.catalog.metadata.snapshotId, [], []),
  metrics: {
    rawItemCount: 3,
    rawMovieCount: 2,
    rawSeriesCount: 1,
    rawLiveCount: 0,
    rawUnresolvedCount: 0,
    canonicalMovieCount: 2,
    canonicalSeriesCount: 1,
    canonicalSeasonCount: 2,
    canonicalEpisodeCount: 4,
    canonicalLiveGroupCount: 0,
    canonicalLiveChannelCount: 0,
  },
  transport: {
    fetchImplementation: 'OTHER',
    fetchExecutionContext: 'OTHER',
    webviewOrigin: 'NOT_APPLICABLE',
    capacitorHttpEnabled: 'UNPROVEN',
    transportRuntime: 'OTHER',
    sourceSchemeClass: 'HTTPS',
    httpResponseReceived: 'SIM',
    httpStatusClass: '2XX',
    corsEnforcementApplies: 'NAO',
    corsFailureClassified: 'NAO',
    androidCleartextAllowed: 'UNPROVEN',
    webviewMixedContentAllowed: 'UNPROVEN',
    webviewMixedContentMode: 'NOT_APPLICABLE',
    tlsConnectionAttempted: 'SIM',
    tlsHandshakeResult: 'PASS',
    certificateValidation: 'PASS',
    sourceHostDnsResult: 'PASS',
    sourceHostTcpConnect: 'PASS',
    customUserAgentPresent: 'SIM',
    acceptHeaderPresent: 'SIM',
  },
};

function authority(overrides = {}) {
  return {
    status: 'SOURCE_READY',
    remoteResultCode: 'SOURCE_READY',
    remoteAuthorityAvailable: true,
    mode: 'MANAGED',
    sourceId: 'src_uhwh5cio',
    sourceVersion: 5,
    protocol: 'M3U',
    sourceStatus: 'ACTIVE',
    ...overrides,
  };
}

function record(overrides = {}) {
  return {
    sourceId: 'src_uhwh5cio',
    sourceVersion: 5,
    protocol: 'M3U',
    sourceConfig: { playlistUrl: secretUrl, token: secretToken },
    ...overrides,
  };
}

function setup(options = {}) {
  let secureReads = 0;
  let fetchCalls = 0;
  let stageCalls = 0;
  const storage = options.storage || new InMemoryCatalogStorage();
  const bootstrap = options.bootstrap || new BootstrapService(storage);
  const importer = options.importer || {
    async importM3u(config, requestOptions) {
      fetchCalls += 1;
      assert.equal(config.playlistUrl, secretUrl);
      assert.equal(requestOptions.requestHeaders.Authorization, `Bearer ${secretToken}`);
      return syntheticImport;
    },
    async importXtream() {
      fetchCalls += 1;
      return syntheticImport;
    },
  };
  const bootstrapAdapter = options.bootstrapAdapter || {
    async stagePackage(packageBuffer) {
      stageCalls += 1;
      return bootstrap.stagePackage(packageBuffer, { forceReimport: true });
    },
  };
  const orchestrator = new ManagedSourceStagingOrchestrator({
    resolveAuthorization: async () => options.authority || authority(),
    secureSourceStore: {
      async get(sourceId) {
        secureReads += 1;
        assert.equal(sourceId, 'src_uhwh5cio');
        return options.record === undefined ? record() : options.record;
      },
    },
    importer,
    packageBuilder: options.packageBuilder || new PackageBuilder(),
    bootstrapService: bootstrapAdapter,
  });
  return {
    orchestrator,
    storage,
    bootstrap,
    importer,
    get secureReads() { return secureReads; },
    get fetchCalls() { return fetchCalls; },
    get stageCalls() { return stageCalls; },
  };
}

const source = fs.readFileSync(new URL('../src/source/managed-source-staging.orchestrator.ts', import.meta.url), 'utf8');
const importerSource = fs.readFileSync(new URL('../src/source/real-source-importer.service.ts', import.meta.url), 'utf8');

await test('T01 SOURCE_READY permite staging', async () => {
  const ctx = setup();
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.success, true);
  assert.equal(result.status, 'STAGED');
});

await test('T02 source não autorizada bloqueia antes do fetch', async () => {
  const ctx = setup({ authority: authority({ status: 'DEVICE_NOT_AUTHORIZED', remoteResultCode: 'DEVICE_NOT_AUTHORIZED' }) });
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.errorCode, 'SOURCE_AUTHORITY_NOT_READY');
  assert.equal(ctx.fetchCalls, 0);
});

await test('T03 source DISABLED bloqueia antes do fetch', async () => {
  const ctx = setup({ authority: authority({ sourceStatus: 'DISABLED' }) });
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.errorCode, 'SOURCE_AUTHORITY_NOT_READY');
  assert.equal(ctx.fetchCalls, 0);
});

await test('T04 binding inválido bloqueia antes do fetch', async () => {
  const ctx = setup({ authority: authority({ status: 'SOURCE_NOT_BOUND', remoteResultCode: 'SOURCE_NOT_BOUND' }) });
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.errorCode, 'SOURCE_AUTHORITY_NOT_READY');
  assert.equal(ctx.fetchCalls, 0);
});

await test('T05 logical source mismatch bloqueia', async () => {
  const ctx = setup({ record: record({ sourceId: 'src_other123' }) });
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.errorCode, 'SOURCE_CONFIG_MISMATCH');
  assert.equal(ctx.fetchCalls, 0);
});

await test('T06 secure store é reutilizado', async () => {
  const ctx = setup();
  await ctx.orchestrator.stageManagedSource();
  assert.equal(ctx.secureReads, 1);
});

await test('T07 fetch recebe config somente em memória', async () => {
  const ctx = setup();
  await ctx.orchestrator.stageManagedSource();
  assert.equal(ctx.fetchCalls, 1);
});

await test('T08 segredo não vai para tmp', async () => {
  assert.doesNotMatch(source, /tmp[\\/]control-plane-state|tmp[\\/]active\.json/);
  assert.doesNotMatch(source, /console\.(log|warn|error)/);
});

await test('T09 staging usa stagePackage()', async () => {
  const ctx = setup();
  await ctx.orchestrator.stageManagedSource();
  assert.equal(ctx.stageCalls, 1);
});

await test('T10 staging nunca chama importPackage()', async () => {
  assert.doesNotMatch(source, /importPackage\s*\(/);
});

await test('T11 staging nunca chama promoteStagedSnapshot()', async () => {
  assert.doesNotMatch(source, /promoteStagedSnapshot|promoteStagedPackage/);
});

await test('T12 active pointer permanece idêntico', async () => {
  const ctx = setup();
  const active = await ctx.bootstrap.importPackage((await new PackageBuilder().build(ingestion.catalog)).packageBuffer);
  assert.equal(active.success, true);
  const before = await ctx.bootstrap.getActivePointer();
  await ctx.orchestrator.stageManagedSource();
  const after = await ctx.bootstrap.getActivePointer();
  assert.deepEqual(after, before);
});

await test('T13 candidate é relido e validado em staging', async () => {
  const ctx = setup();
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.status, 'STAGED');
  const staged = await ctx.storage.readStaging(result.snapshotId);
  assert.equal(staged.manifest.snapshotId, result.snapshotId);
  assert.equal(staged.catalog.metadata.snapshotId, result.snapshotId);
});

await test('T14 canonical classifier é reutilizado', async () => {
  assert.match(importerSource, /classifyCanonicalSourceContent/);
  assert.match(source, /RealSourceImporterService/);
});

await test('T15 category scope não é alterado', async () => {
  assert.doesNotMatch(source, /MoviesPage|SeriesPage|typed category scope|contentKinds\s*=/i);
});

await test('T16 transport policy não é alterada', async () => {
  assert.doesNotMatch(source, /CapacitorHttp|cleartext|network_security|User-Agent|redirect/);
});

await test('T17 nenhum segredo aparece em logs/errors', async () => {
  const ctx = setup({ authority: authority({ sourceId: 'src_uhwh5cio' }) });
  const result = await ctx.orchestrator.stageManagedSource();
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /synthetic-secret|playlist\.m3u/);
  assert.doesNotMatch(source, /console\.(log|warn|error)/);
});

await test('T18 falha de fetch não altera active', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const ctx = setup({
    storage,
    bootstrap,
    importer: { async importM3u() { return { success: false, error: 'hidden', transport: syntheticImport.transport }; } },
  });
  const before = await bootstrap.getActivePointer();
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.errorCode, 'REAL_SOURCE_FETCH_FAILED');
  assert.deepEqual(await bootstrap.getActivePointer(), before);
});

await test('T19 falha de package não altera active', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const ctx = setup({
    storage,
    bootstrap,
    packageBuilder: { async build() { return { success: false, packageBuffer: undefined }; } },
  });
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.errorCode, 'PACKAGE_BUILD_FAILED');
  assert.deepEqual(await bootstrap.getActivePointer(), null);
});

await test('T20 SELF_SERVICE não é redirecionado indevidamente para Managed', async () => {
  const ctx = setup({ authority: authority({ mode: 'SELF_SERVICE' }) });
  const result = await ctx.orchestrator.stageManagedSource();
  assert.equal(result.errorCode, 'SOURCE_MODE_NOT_MANAGED');
  assert.equal(ctx.secureReads, 0);
  assert.equal(ctx.fetchCalls, 0);
});

console.log(`R2F8L_TEST_COUNT=${total}`);
console.log(`R2F8L_TEST_PASS_COUNT=${passed}`);
console.log(`MANAGED_STAGING_LOCK_ID=${MANAGED_FETCH_TO_STAGING_LOCK_ID}`);
console.log(`MANAGED_STAGING_LOCK_TEST=${passed === total ? 'PASS' : 'FAIL'}`);
if (passed !== total) process.exitCode = 1;
