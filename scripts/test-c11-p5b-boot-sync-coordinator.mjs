import assert from 'node:assert/strict';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { BootSyncCoordinator } from '../src/bootstrap/boot-sync-coordinator.ts';
import { LiveCatalogService } from '../src/catalog/live/live-catalog.service.ts';
import { createActivePointer } from '../src/bootstrap/active-snapshot.ts';

let totalTests = 0;
let passedTests = 0;

async function test(name, fn) {
  totalTests += 1;
  try {
    await fn();
    passedTests += 1;
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    console.error(err);
    throw err;
  }
}

// Catálogo real para testes
function createRealCatalog(snapshotId = 'snap-real-001', catalogVersion = 'v6') {
  return {
    metadata: {
      schemaVersion: 1,
      catalogVersion,
      snapshotId,
      generatedAt: new Date().toISOString(),
      counts: {
        movies: 2,
        series: 1,
        seasons: 1,
        episodes: 2,
        categories: 1,
        genres: 1,
        streams: 4,
        artworks: 0,
      },
    },
    categories: [{ id: 'cat-1', name: 'Ação', contentKinds: ['movie'] }],
    genres: [{ id: 'gen-1', name: 'Ação' }],
    movies: [
      {
        id: 'real-mov-1',
        title: 'Filme Comercial Real Um',
        year: 2026,
        genreIds: ['gen-1'],
        categoryIds: ['cat-1'],
        artworkIds: [],
        streamIds: ['stream-1'],
      },
      {
        id: 'real-mov-2',
        title: 'Filme Comercial Real Dois',
        year: 2026,
        genreIds: ['gen-1'],
        categoryIds: ['cat-1'],
        artworkIds: [],
        streamIds: ['stream-2'],
      },
    ],
    series: [
      {
        id: 'real-ser-1',
        title: 'Série Comercial Real Um',
        year: 2026,
        genreIds: ['gen-1'],
        categoryIds: ['cat-1'],
        artworkIds: [],
        seasonIds: ['sea-1'],
      },
    ],
    seasons: [
      {
        id: 'sea-1',
        seriesId: 'real-ser-1',
        seasonNumber: 1,
        episodeIds: ['ep-1', 'ep-2'],
      },
    ],
    episodes: [
      {
        id: 'ep-1',
        seriesId: 'real-ser-1',
        seasonId: 'sea-1',
        episodeNumber: 1,
        title: 'Episódio 1',
        artworkIds: [],
        streamIds: ['stream-3'],
      },
      {
        id: 'ep-2',
        seriesId: 'real-ser-1',
        seasonId: 'sea-1',
        episodeNumber: 2,
        title: 'Episódio 2',
        artworkIds: [],
        streamIds: ['stream-4'],
      },
    ],
    streams: [
      { id: 'stream-1', sourceItemId: 's1', contentKind: 'movie' },
      { id: 'stream-2', sourceItemId: 's2', contentKind: 'movie' },
      { id: 'stream-3', sourceItemId: 's3', contentKind: 'episode' },
      { id: 'stream-4', sourceItemId: 's4', contentKind: 'episode' },
    ],
    artworks: [],
  };
}

// Catálogo sintético de fixture
function createSyntheticFixtureCatalog(snapshotId = 'snap-synthetic-fixture') {
  return {
    metadata: {
      schemaVersion: 1,
      catalogVersion: 'v0-synthetic',
      snapshotId,
      generatedAt: new Date().toISOString(),
      counts: {
        movies: 1,
        series: 0,
        seasons: 0,
        episodes: 0,
        categories: 1,
        genres: 1,
        streams: 1,
        artworks: 0,
      },
    },
    categories: [{ id: 'cat-syn', name: 'Synthetic', contentKinds: ['movie'] }],
    genres: [{ id: 'gen-syn', name: 'Synthetic' }],
    movies: [
      {
        id: 'synthetic-alpha',
        title: 'Movie Synthetic Alpha',
        year: 2026,
        genreIds: ['gen-syn'],
        categoryIds: ['cat-syn'],
        artworkIds: [],
        streamIds: ['stream-syn-1'],
      },
    ],
    series: [],
    seasons: [],
    episodes: [],
    streams: [{ id: 'stream-syn-1', sourceItemId: 'syn1', contentKind: 'movie' }],
    artworks: [],
  };
}

async function buildPackageHelper(catalog, metadata = {}) {
  const builder = new PackageBuilder();
  const liveCatalog = LiveCatalogService.buildCatalog(catalog.metadata.snapshotId, [], []);
  return builder.build(catalog, {
    packageFormatVersion: 2,
    liveCatalog,
    metadata,
  });
}

async function setInitialActive(storage, catalog, manifest) {
  const liveCatalog = LiveCatalogService.buildCatalog(manifest.snapshotId, [], []);
  await storage.writeStaging(manifest.snapshotId, manifest, catalog, undefined, liveCatalog);
  await storage.promoteStaging(manifest.snapshotId);
  await storage.writeActivePointer(createActivePointer(manifest));
}

function createMockDeviceContext(overrides = {}) {
  return {
    getOrCreateIdentity: async () => ({ deviceId: 'dev-123' }),
    loadActivationState: async () => ({
    deviceId: 'dev-123',
    status: 'AUTHORIZED',
    licenseMode: 'SELF_SERVICE',
    licenseId: 'test-license',
    licenseStatus: 'ACTIVE',
    deviceAuthToken: 'secret-auth-token',
      ...overrides,
    }),
  };
}

const EXPECTED_SOURCE_ID = 'src_uhwh5cio';
const EXPECTED_SOURCE_VERSION = 6;

// ==========================================
// T1: authorized + fixture active + SOURCE_READY -> inicia sync real
// ==========================================
await test('T1 authorized + fixture active + SOURCE_READY -> inicia sync real', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const synCatalog = createSyntheticFixtureCatalog();
  const synPackage = await buildPackageHelper(synCatalog, { kind: 'PREBUILT_FIXTURE' });
  await setInitialActive(storage, synCatalog, synPackage.manifest);

  const realCatalog = createRealCatalog('snap-t1-real', '6');
  const realPackage = await buildPackageHelper(realCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: EXPECTED_SOURCE_VERSION,
  });

  let stageCalls = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: EXPECTED_SOURCE_VERSION,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: EXPECTED_SOURCE_VERSION,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://real-stream.secret/stream.m3u' },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => {
        stageCalls += 1;
        await storage.writeStaging(
          realPackage.manifest.snapshotId,
          realPackage.manifest,
          realCatalog,
          undefined,
          LiveCatalogService.buildCatalog(realPackage.manifest.snapshotId, [], []),
        );
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'PROMOTED');
  assert.equal(stageCalls, 1);
  const active = await bootstrap.getActivePointer();
  assert.equal(active?.kind, 'REAL');
  assert.equal(active?.sourceId, EXPECTED_SOURCE_ID);
  assert.equal(active?.sourceVersion, EXPECTED_SOURCE_VERSION);
});

// ==========================================
// T2: same real source/version already active -> NO_OP
// ==========================================
await test('T2 same real source/version already active -> NO_OP', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const realCatalog = createRealCatalog('snap-t2-real', '6');
  const realPackage = await buildPackageHelper(realCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: EXPECTED_SOURCE_VERSION,
  });
  await setInitialActive(storage, realCatalog, realPackage.manifest);

  let stageCalls = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: EXPECTED_SOURCE_VERSION,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    stagingOrchestrator: {
      stageManagedSource: async () => {
        stageCalls += 1;
        return { success: true, status: 'STAGED', rawItemCount: 1, movieCount: 1, seriesCount: 0, liveCount: 0, unresolvedCount: 0 };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'NO_OP');
  assert.equal(stageCalls, 0, 'Não deve acionar staging nem reimportar no mesmo snapshot real');
});

// ==========================================
// T3: source version mudou -> stage nova versao
// ==========================================
await test('T3 source version mudou -> stage nova versao', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  // Ativo v5
  const oldCatalog = createRealCatalog('snap-t3-v5', '5');
  const oldPackage = await buildPackageHelper(oldCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: 5,
  });
  await setInitialActive(storage, oldCatalog, oldPackage.manifest);

  // Novo v6
  const newCatalog = createRealCatalog('snap-t3-v6', '6');
  const newPackage = await buildPackageHelper(newCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: 6,
  });

  let stageCalls = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: 6,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: 6,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://real.secret/v6' },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => {
        stageCalls += 1;
        await storage.writeStaging(
          newPackage.manifest.snapshotId,
          newPackage.manifest,
          newCatalog,
          undefined,
          LiveCatalogService.buildCatalog(newPackage.manifest.snapshotId, [], []),
        );
        return {
          success: true,
          status: 'STAGED',
          snapshotId: newPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'PROMOTED');
  assert.equal(stageCalls, 1);
  const active = await bootstrap.getActivePointer();
  assert.equal(active?.sourceVersion, 6);
});

// ==========================================
// T4: LICENSE_INVALID -> no import
// ==========================================
await test('T4 LICENSE_INVALID -> no import', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  let stageCalls = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'LICENSE_INVALID',
      mode: 'SELF_SERVICE',
      message: 'Licenca expirada',
    }),
    stagingOrchestrator: {
      stageManagedSource: async () => {
        stageCalls += 1;
        return { success: false, status: 'REJECTED', rawItemCount: 0, movieCount: 0, seriesCount: 0, liveCount: 0, unresolvedCount: 0 };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'LICENSE_INVALID');
  assert.equal(stageCalls, 0);
});

// ==========================================
// T5: source missing -> no import
// ==========================================
await test('T5 source missing -> no import', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  let stageCalls = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_NOT_BOUND',
      remoteAuthorityAvailable: true,
      remoteResultCode: 'SOURCE_NOT_BOUND',
      mode: 'SELF_SERVICE',
    }),
    stagingOrchestrator: {
      stageManagedSource: async () => {
        stageCalls += 1;
        return { success: false, status: 'REJECTED', rawItemCount: 0, movieCount: 0, seriesCount: 0, liveCount: 0, unresolvedCount: 0 };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'SOURCE_NOT_BOUND');
  assert.equal(stageCalls, 0);
});

// ==========================================
// T6A: autoridade indisponível -> não pode ser SOURCE_NOT_BOUND
// ==========================================
await test('T6A autoridade indisponível -> REMOTE_AUTHORITY_UNAVAILABLE', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  let stageCalls = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'DEVICE_NOT_AUTHORIZED',
      remoteAuthorityAvailable: false,
      mode: 'SELF_SERVICE',
      message: 'Autoridade remota indisponível.',
    }),
    stagingOrchestrator: {
      stageManagedSource: async () => {
        stageCalls += 1;
        return { success: false, status: 'REJECTED', rawItemCount: 0, movieCount: 0, seriesCount: 0, liveCount: 0, unresolvedCount: 0 };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'REMOTE_AUTHORITY_UNAVAILABLE');
  assert.equal(res.syncState, 'OFFLINE');
  assert.equal(stageCalls, 0);
});

// ==========================================
// T6: staging fail -> active pointer unchanged
// ==========================================
await test('T6 staging fail -> active pointer unchanged', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const initialCatalog = createRealCatalog('snap-t6-initial', '1');
  const initialPackage = await buildPackageHelper(initialCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: 1,
  });
  await setInitialActive(storage, initialCatalog, initialPackage.manifest);

  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: 2,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: 2,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://real.secret/v2' },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => ({
        success: false,
        status: 'REJECTED',
        errorCode: 'REAL_SOURCE_FETCH_FAILED',
        rawItemCount: 0,
        movieCount: 0,
        seriesCount: 0,
        liveCount: 0,
        unresolvedCount: 0,
      }),
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'LOCAL_FIRST_ACTIVE_PRESERVED');
  const activeAfter = await bootstrap.getActivePointer();
  assert.equal(activeAfter?.snapshotId, 'snap-t6-initial', 'Active pointer deve permanecer inalterado');
});

// ==========================================
// T7: validation/hash fail -> no promotion
// ==========================================
await test('T7 validation/hash fail -> no promotion', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  // Staging com metadados inconsistentes (sourceId incorreto)
  const badCatalog = createRealCatalog('snap-t7-corrupt', '6');
  const badPackage = await buildPackageHelper(badCatalog, {
    kind: 'REAL',
    sourceId: 'wrong-source-id',
    sourceVersion: 6,
  });

  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: EXPECTED_SOURCE_VERSION,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: EXPECTED_SOURCE_VERSION,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://real.secret/v6' },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => {
        await storage.writeStaging(
          badPackage.manifest.snapshotId,
          badPackage.manifest,
          badCatalog,
          undefined,
          LiveCatalogService.buildCatalog(badPackage.manifest.snapshotId, [], []),
        );
        return {
          success: true,
          status: 'STAGED',
          snapshotId: badPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'VALIDATION_FAILED');
  const active = await bootstrap.getActivePointer();
  assert.equal(active, null, 'Nenhuma promoção deve ocorrer com divergência de validação');
});

// ==========================================
// T8: successful staging -> atomic promotion
// ==========================================
await test('T8 successful staging -> atomic promotion', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const realCatalog = createRealCatalog('snap-t8', '6');
  const realPackage = await buildPackageHelper(realCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: EXPECTED_SOURCE_VERSION,
  });

  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: EXPECTED_SOURCE_VERSION,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: EXPECTED_SOURCE_VERSION,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://real.secret/t8' },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => {
        await storage.writeStaging(
          realPackage.manifest.snapshotId,
          realPackage.manifest,
          realCatalog,
          undefined,
          LiveCatalogService.buildCatalog(realPackage.manifest.snapshotId, [], []),
        );
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'PROMOTED');
  assert.equal(res.snapshotId, realPackage.manifest.snapshotId);
  const promotedPointer = await bootstrap.getActivePointer();
  assert.equal(promotedPointer?.snapshotId, realPackage.manifest.snapshotId);
});

// ==========================================
// T9: promoted provenance -> source_id/version corretos
// ==========================================
await test('T9 promoted provenance -> source_id/version corretos', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const realCatalog = createRealCatalog('snap-t9', '6');
  const realPackage = await buildPackageHelper(realCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: 6,
  });

  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: 6,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: 6,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://real.secret/t9' },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => {
        await storage.writeStaging(
          realPackage.manifest.snapshotId,
          realPackage.manifest,
          realCatalog,
          undefined,
          LiveCatalogService.buildCatalog(realPackage.manifest.snapshotId, [], []),
        );
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  await coordinator.coordinateBootSync();
  const activePointer = await bootstrap.getActivePointer();
  assert.equal(activePointer?.kind, 'REAL');
  assert.equal(activePointer?.sourceId, EXPECTED_SOURCE_ID);
  assert.equal(activePointer?.sourceVersion, 6);
});

// ==========================================
// T10: concurrent boot triggers -> one import only
// ==========================================
await test('T10 concurrent boot triggers -> one import only', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const realCatalog = createRealCatalog('snap-t10', '6');
  const realPackage = await buildPackageHelper(realCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: 6,
  });

  let stageCalls = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: 6,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: 6,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://real.secret/t10' },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => {
        stageCalls += 1;
        await new Promise((r) => setTimeout(r, 20)); // Simula latência
        await storage.writeStaging(
          realPackage.manifest.snapshotId,
          realPackage.manifest,
          realCatalog,
          undefined,
          LiveCatalogService.buildCatalog(realPackage.manifest.snapshotId, [], []),
        );
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const [res1, res2] = await Promise.all([
    coordinator.coordinateBootSync(),
    coordinator.coordinateBootSync(),
  ]);

  assert.equal(res1.outcome, 'PROMOTED');
  assert.equal(res2.outcome, 'PROMOTED');
  assert.equal(stageCalls, 1, 'Exatamente um staging deve ser executado para triggers concorrentes');
});

// ==========================================
// T11: offline first sync -> no false real catalog
// ==========================================
await test('T11 offline first sync -> no false real catalog', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => {
      throw new Error('Network error (offline)');
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'REMOTE_AUTHORITY_UNAVAILABLE');
  const active = await bootstrap.getActivePointer();
  assert.equal(active, null, 'Nenhum catálogo falso deve ser ativado offline');
});

// ==========================================
// T12: existing real snapshot + offline -> local-first continues
// ==========================================
await test('T12 existing real snapshot + offline -> local-first continues', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  // Já possui um snapshot REAL ativo
  const realCatalog = createRealCatalog('snap-t12-existing', '6');
  const realPackage = await buildPackageHelper(realCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: 6,
  });
  await setInitialActive(storage, realCatalog, realPackage.manifest);

  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => {
      throw new Error('Network offline');
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'REMOTE_AUTHORITY_UNAVAILABLE');
  assert.equal(res.snapshotId, 'snap-t12-existing');
  const active = await bootstrap.getActivePointer();
  assert.equal(active?.snapshotId, 'snap-t12-existing', 'Snapshot REAL existente permanece ativo');
});

// ==========================================
// T13: no secrets in logs/catalog/active
// ==========================================
await test('T13 no secrets in logs/catalog/active', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const secretString = 'secret_password_super_confidential_123';
  const realCatalog = createRealCatalog('snap-t13', '6');
  const realPackage = await buildPackageHelper(realCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: 6,
  });

  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: 6,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: 6,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: `https://user:${secretString}@real.stream/playlist.m3u` },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => {
        await storage.writeStaging(
          realPackage.manifest.snapshotId,
          realPackage.manifest,
          realCatalog,
          undefined,
          LiveCatalogService.buildCatalog(realPackage.manifest.snapshotId, [], []),
        );
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'PROMOTED');

  const activePointer = await bootstrap.getActivePointer();
  const activeManifest = await bootstrap.getActiveMetadata();
  const activeCatalog = await bootstrap.getActiveCatalog();

  const serialized = JSON.stringify({ activePointer, activeManifest, activeCatalog, res });
  assert.equal(serialized.includes(secretString), false, 'Nenhum segredo pode vazar em active/catalog/res');
});

// ==========================================
// T14: fixture sintetica nao aparece como comercial apos real sync iniciar
// ==========================================
await test('T14 fixture sintetica nao aparece como comercial apos real sync iniciar', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  // Ativo inicial é a fixture sintética
  const synCatalog = createSyntheticFixtureCatalog();
  const synPackage = await buildPackageHelper(synCatalog, { kind: 'PREBUILT_FIXTURE' });
  await setInitialActive(storage, synCatalog, synPackage.manifest);

  let observedStates = [];
  const realCatalog = createRealCatalog('snap-t14-real', '6');
  const realPackage = await buildPackageHelper(realCatalog, {
    kind: 'REAL',
    sourceId: EXPECTED_SOURCE_ID,
    sourceVersion: 6,
  });

  const coordinator = new BootSyncCoordinator({
    deviceContext: createMockDeviceContext(),
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      mode: 'SELF_SERVICE',
      sourceId: EXPECTED_SOURCE_ID,
      sourceVersion: 6,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      licenseId: 'test-license',
      licenseStatus: 'ACTIVE',
    }),
    secureStore: {
      get: async () => ({
        sourceId: EXPECTED_SOURCE_ID,
        sourceVersion: 6,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://real.stream/t14' },
      }),
    },
    stagingOrchestrator: {
      stageManagedSource: async () => {
        await storage.writeStaging(
          realPackage.manifest.snapshotId,
          realPackage.manifest,
          realCatalog,
          undefined,
          LiveCatalogService.buildCatalog(realPackage.manifest.snapshotId, [], []),
        );
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 0,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  coordinator.subscribe((state) => {
    observedStates.push(state);
  });

  await coordinator.coordinateBootSync();

  assert.ok(
    observedStates.includes('PREPARANDO_CATALOGO_REAL'),
    'Estado PREPARANDO_CATALOGO_REAL deve ser emitido durante first real sync',
  );

  const finalCatalog = await bootstrap.getActiveCatalog();
  const hasAlpha = finalCatalog?.movies.some((m) => m.title === 'Movie Synthetic Alpha');
  assert.equal(hasAlpha, false, 'Movie Synthetic Alpha não deve estar presente no catálogo promovido');
});

console.log(`\nTODOS OS TESTES PASSARAM: ${passedTests}/${totalTests}`);
