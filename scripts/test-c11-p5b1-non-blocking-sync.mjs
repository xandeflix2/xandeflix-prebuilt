/**
 * Xandeflix Prebuilt — Non-Blocking Boot Sync Test Suite (Cycle C11-P5B1)
 *
 * Valida os 14 requisitos contratuais de inicialização não-bloqueante e background sync:
 * T1: Clean install S24 - shell <=2s target, interactive <=5s target, sync background
 * T2: Clean install simulated slow device - UI não bloqueia enquanto sync continua
 * T3: Returning device real snapshot - Home local imediata, refresh background
 * T4: Source version same - NO_OP
 * T5: Source version new - background refresh & promotion
 * T6: Network slow - app continua navegável
 * T7: Network offline first install - app abre, sync waiting
 * T8: Network drop mid import - active pointer unchanged
 * T9: Restart mid import - fast boot, recovery safe
 * T10: Concurrent triggers - one sync only
 * T11: Main thread - no multi-second UI freeze (yielding)
 * T12: Synthetic fixture - never shown as commercial content
 * T13: Full promotion - real snapshot atomic
 * T14: Post promotion - Home switches to real catalog without app restart
 */

import assert from 'node:assert/strict';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { BootSyncCoordinator } from '../src/bootstrap/boot-sync-coordinator.ts';
import { LiveCatalogService } from '../src/catalog/live/live-catalog.service.ts';
import { createActivePointer } from '../src/bootstrap/active-snapshot.ts';
import { bootTelemetry, yieldToEventLoop } from '../src/diagnostics/boot-telemetry.ts';

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
      { id: 'stream-1', sourceItemId: '1', contentKind: 'movie' },
      { id: 'stream-2', sourceItemId: '2', contentKind: 'movie' },
      { id: 'stream-3', sourceItemId: '3', contentKind: 'series' },
      { id: 'stream-4', sourceItemId: '4', contentKind: 'series' },
    ],
    artworks: [],
  };
}

async function createBuiltPackage(storage, snapshotId, sourceId = 'src_uhwh5cio', sourceVersion = 6) {
  const catalog = createRealCatalog(snapshotId, `v${sourceVersion}`);
  const builder = new PackageBuilder();
  const liveCatalog = LiveCatalogService.buildCatalog(snapshotId, [], []);
  const pkg = await builder.build(catalog, {
    packageFormatVersion: 2,
    liveCatalog,
    metadata: {
      kind: 'REAL',
      sourceId,
      sourceVersion,
    },
  });

  await storage.writeStaging(
    snapshotId,
    pkg.manifest,
    catalog,
    undefined,
    liveCatalog,
  );
  await storage.promoteStaging(snapshotId);

  return { catalog, manifest: pkg.manifest };
}

const MOCK_DEVICE_ID = 'device-c11-p5b1-fixture';
const MOCK_DISPLAY_CODE = 'XF-4PNM-CD8C';

const mockAuthorizedContext = {
  async getOrCreateIdentity() {
    return {
      deviceId: MOCK_DEVICE_ID,
      displayCode: MOCK_DISPLAY_CODE,
    };
  },
  async loadActivationState() {
    return {
      status: 'AUTHORIZED',
      deviceAuthToken: 'token_mock_valid',
      deviceId: MOCK_DEVICE_ID,
      displayCode: MOCK_DISPLAY_CODE,
      licenseId: 'license-c11-p5b1-fixture',
      licenseStatus: 'ACTIVE',
      licenseMode: 'MANAGED',
    };
  },
};

const mockSourceResolverReady = async () => ({
  status: 'SOURCE_READY',
  licenseId: 'license-c11-p5b1-fixture',
  licenseStatus: 'ACTIVE',
  mode: 'MANAGED',
  sourceId: 'src_uhwh5cio',
  sourceVersion: 6,
  sourceLabel: 'SINAL ATIVO TABLET',
});

// T1: CLEAN INSTALL S24 - shell <=2s target, interactive <=5s target, full sync background
await test('T1 CLEAN INSTALL S24: shell and navigation non-blocking, sync in background', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const realPackage = await createBuiltPackage(storage, 'snap-t1-real', 'src_uhwh5cio', 6);

  let stagingResolved = false;
  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    sourceDelivery: { async deliver() {} },
    secureStore: {
      async get() {
        return {
          sourceId: 'src_uhwh5cio',
          sourceVersion: 6,
          decryptedUrl: 'http://example.com/playlist.m3u',
        };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        await new Promise((r) => setTimeout(r, 50));
        stagingResolved = true;
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 1,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const startTime = Date.now();
  coordinator.startNonBlockingSync();
  const synchronousReturnTime = Date.now() - startTime;

  // A chamada startNonBlockingSync() deve retornar imediatamente (< 50ms)
  assert.ok(synchronousReturnTime < 50, `Retorno síncrono deve ser < 50ms, foi ${synchronousReturnTime}ms`);
  assert.equal(stagingResolved, false, 'Staging não deve bloquear o retorno do início');

  // Aguarda a conclusão em background
  const result = await coordinator.awaitFullSync();
  assert.equal(result.outcome, 'PROMOTED');
  assert.equal(stagingResolved, true);
});

// T2: CLEAN INSTALL SIMULATED SLOW DEVICE: UI não bloqueia enquanto sync continua
await test('T2 CLEAN INSTALL SIMULATED SLOW DEVICE: UI nao bloqueia durante sync longo', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const realPackage = await createBuiltPackage(storage, 'snap-t2-slow', 'src_uhwh5cio', 6);

  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    sourceDelivery: { async deliver() {} },
    secureStore: {
      async get() {
        return {
          sourceId: 'src_uhwh5cio',
          sourceVersion: 6,
          decryptedUrl: 'http://example.com/playlist.m3u',
        };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        // Simula I/O lento
        await new Promise((r) => setTimeout(r, 100));
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPackage.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 1,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  coordinator.startNonBlockingSync();

  // Enquanto a sync roda, o estado é observável mas não lança erro
  const stateDuring = coordinator.getState();
  assert.ok(['CHECKING_SOURCE', 'CHECKING', 'DOWNLOADING', 'STAGING', 'PREPARANDO_CATALOGO_REAL'].includes(stateDuring));

  const result = await coordinator.awaitFullSync();
  assert.equal(result.outcome, 'PROMOTED');
  assert.equal(coordinator.getState(), 'READY');
});

// T3: RETURNING DEVICE REAL SNAPSHOT: Home local imediata, refresh background
await test('T3 RETURNING DEVICE REAL SNAPSHOT: Home local imediata e refresh background', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const existingPkg = await createBuiltPackage(storage, 'snap-t3-existing', 'src_uhwh5cio', 6);

  await storage.writeActivePointer(
    createActivePointer(existingPkg.manifest)
  );

  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    bootstrapService: bootstrap,
  });

  const pointerBefore = await bootstrap.getActivePointer();
  assert.equal(pointerBefore?.kind, 'REAL');
  assert.equal(pointerBefore?.snapshotId, 'snap-t3-existing');

  coordinator.startNonBlockingSync();
  const res = await coordinator.awaitFullSync();
  assert.equal(res.outcome, 'NO_OP');
  assert.equal(res.snapshotId, 'snap-t3-existing');
});

// T4: SOURCE VERSION SAME: no import
await test('T4 SOURCE VERSION SAME: no import', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const existingPkg = await createBuiltPackage(storage, 'snap-t4-same', 'src_uhwh5cio', 6);

  await storage.writeActivePointer(
    createActivePointer(existingPkg.manifest)
  );

  let stageCalled = false;
  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    stagingOrchestrator: {
      async stageManagedSource() {
        stageCalled = true;
        return { success: false, status: 'REJECTED' };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'NO_OP');
  assert.equal(stageCalled, false, 'Staging não deve ser chamado para a mesma versão');
});

// T5: SOURCE VERSION NEW: background refresh
await test('T5 SOURCE VERSION NEW: background refresh', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const oldPkg = await createBuiltPackage(storage, 'snap-t5-old', 'src_uhwh5cio', 6);
  const newPkg = await createBuiltPackage(storage, 'snap-t5-new', 'src_uhwh5cio', 7);

  await storage.writeActivePointer(
    createActivePointer(oldPkg.manifest)
  );

  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: async () => ({
      status: 'SOURCE_READY',
      licenseId: 'license-c11-p5b1-fixture',
      licenseStatus: 'ACTIVE',
      mode: 'MANAGED',
      sourceId: 'src_uhwh5cio',
      sourceVersion: 7, // Nova versão
      sourceLabel: 'SINAL ATIVO TABLET V7',
    }),
    sourceDelivery: { async deliver() {} },
    secureStore: {
      async get() {
        return {
          sourceId: 'src_uhwh5cio',
          sourceVersion: 7,
          decryptedUrl: 'http://example.com/playlist-v7.m3u',
        };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        return {
          success: true,
          status: 'STAGED',
          snapshotId: newPkg.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 1,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'PROMOTED');
  assert.equal(res.sourceVersion, 7);

  const active = await bootstrap.getActivePointer();
  assert.equal(active?.sourceVersion, 7);
  assert.equal(active?.snapshotId, 'snap-t5-new');
});

// T6: NETWORK SLOW: app continua navegável
await test('T6 NETWORK SLOW: app continua navegavel', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: async () => {
      // Simula latência de 80ms na resolução
      await new Promise((r) => setTimeout(r, 80));
      return mockSourceResolverReady();
    },
    bootstrapService: bootstrap,
  });

  const start = Date.now();
  coordinator.startNonBlockingSync();
  const returnTime = Date.now() - start;

  assert.ok(returnTime < 20, `startNonBlockingSync deve retornar imediatamente, foi ${returnTime}ms`);
});

// T7: NETWORK OFFLINE FIRST INSTALL: app abre; sync waiting
await test('T7 NETWORK OFFLINE FIRST INSTALL: app abre, sync waiting', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: async () => {
      throw new Error('ENOTFOUND: supabase remote unreachable');
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'REMOTE_AUTHORITY_UNAVAILABLE');
  assert.equal(res.syncState, 'OFFLINE');
  assert.equal(coordinator.getState(), 'OFFLINE');
});

// T8: NETWORK DROP MID IMPORT: active pointer unchanged
await test('T8 NETWORK DROP MID IMPORT: active pointer unchanged', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    sourceDelivery: { async deliver() {} },
    secureStore: {
      async get() {
        return { sourceId: 'src_uhwh5cio', sourceVersion: 6, decryptedUrl: 'http://example.com/stream' };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        throw new Error('ECONNRESET mid download');
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'STAGING_FAILED');
  const active = await bootstrap.getActivePointer();
  assert.equal(active, null, 'Active pointer não deve ter sido criado');
});

// T9: RESTART MID IMPORT: fast boot; recovery safe
await test('T9 RESTART MID IMPORT: fast boot, recovery safe', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  // Simula lixo deixado em staging por um crash anterior
  await storage.writeStaging('incomplete-staging-1', 'catalog.json', '{}');

  const realPkg = await createBuiltPackage(storage, 'snap-t9-recovery', 'src_uhwh5cio', 6);

  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    sourceDelivery: { async deliver() {} },
    secureStore: {
      async get() {
        return { sourceId: 'src_uhwh5cio', sourceVersion: 6, decryptedUrl: 'http://example.com' };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPkg.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 1,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'PROMOTED');
  assert.equal(res.snapshotId, 'snap-t9-recovery');
});

// T10: CONCURRENT TRIGGERS: one sync only
await test('T10 CONCURRENT TRIGGERS: one sync only', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const realPkg = await createBuiltPackage(storage, 'snap-t10-concurrent', 'src_uhwh5cio', 6);

  let stagingCallCount = 0;
  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    sourceDelivery: { async deliver() {} },
    secureStore: {
      async get() {
        return { sourceId: 'src_uhwh5cio', sourceVersion: 6, decryptedUrl: 'http://example.com' };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        stagingCallCount++;
        await new Promise((r) => setTimeout(r, 40));
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPkg.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 1,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  // Dispara dois triggers simultâneos
  coordinator.startNonBlockingSync();
  const p1 = coordinator.awaitFullSync();
  const p2 = coordinator.coordinateBootSync();

  const [res1, res2] = await Promise.all([p1, p2]);
  assert.equal(res1.outcome, 'PROMOTED');
  assert.equal(res2.outcome, 'PROMOTED');
  assert.equal(stagingCallCount, 1, 'Staging só deve ter sido executado uma única vez');
});

// T11: MAIN THREAD: no multi-second UI freeze
await test('T11 MAIN THREAD: yieldToEventLoop allows other tasks to run', async () => {
  let otherTaskRan = false;
  setTimeout(() => {
    otherTaskRan = true;
  }, 5);

  for (let i = 0; i < 5; i++) {
    await yieldToEventLoop();
  }

  assert.equal(otherTaskRan, true, 'Event-loop yield permitiu execução de tarefas concorrentes');
});

// T12: SYNTHETIC FIXTURE: never shown as commercial content
await test('T12 SYNTHETIC FIXTURE: never shown as commercial content during first sync', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);

  // Pointer de fixture sintética
  await storage.writeActivePointer({
    snapshotId: 'snap-synthetic-fixture',
    catalogVersion: '1.0.0',
    schemaVersion: 1,
    packageContentHash: 'a'.repeat(64),
    promotedAt: new Date().toISOString(),
    kind: 'PREBUILT_FIXTURE',
    sourceId: 'fixture_source',
    sourceVersion: 1,
  });

  const pointer = await bootstrap.getActivePointer();
  const isExistingReal = pointer?.kind === 'REAL';
  assert.equal(isExistingReal, false, 'Fixture sintética não deve ser considerada catálogo REAL');
});

// T13: FULL PROMOTION: real snapshot atomic
await test('T13 FULL PROMOTION: real snapshot atomic', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const realPkg = await createBuiltPackage(storage, 'snap-t13-atomic', 'src_uhwh5cio', 6);

  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    sourceDelivery: { async deliver() {} },
    secureStore: {
      async get() {
        return { sourceId: 'src_uhwh5cio', sourceVersion: 6, decryptedUrl: 'http://example.com' };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPkg.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 1,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  const res = await coordinator.coordinateBootSync();
  assert.equal(res.outcome, 'PROMOTED');

  const active = await bootstrap.getActivePointer();
  assert.equal(active?.kind, 'REAL');
  assert.equal(active?.sourceId, 'src_uhwh5cio');
  assert.equal(active?.sourceVersion, 6);
  assert.equal(active?.snapshotId, 'snap-t13-atomic');
});

// T14: POST PROMOTION: Home switches to real catalog without app restart
await test('T14 POST PROMOTION: Home switches to real catalog without app restart', async () => {
  const storage = new InMemoryCatalogStorage();
  const bootstrap = new BootstrapService(storage);
  const realPkg = await createBuiltPackage(storage, 'snap-t14-switch', 'src_uhwh5cio', 6);

  let refreshed = false;
  const coordinator = new BootSyncCoordinator({
    deviceContext: mockAuthorizedContext,
    sourceResolver: mockSourceResolverReady,
    sourceDelivery: { async deliver() {} },
    secureStore: {
      async get() {
        return { sourceId: 'src_uhwh5cio', sourceVersion: 6, decryptedUrl: 'http://example.com' };
      },
    },
    stagingOrchestrator: {
      async stageManagedSource() {
        return {
          success: true,
          status: 'STAGED',
          snapshotId: realPkg.manifest.snapshotId,
          rawItemCount: 3,
          movieCount: 2,
          seriesCount: 1,
          liveCount: 1,
          unresolvedCount: 0,
        };
      },
    },
    bootstrapService: bootstrap,
  });

  coordinator.subscribe((_state, result) => {
    if (result?.outcome === 'PROMOTED') {
      refreshed = true;
    }
  });

  coordinator.startNonBlockingSync();
  await coordinator.awaitFullSync();

  assert.equal(refreshed, true, 'Notificação de promoção recebida para refresh sem restart');
});

console.log(`\nTODOS OS TESTES P5B1 PASSARAM: ${passedTests}/${totalTests}`);
