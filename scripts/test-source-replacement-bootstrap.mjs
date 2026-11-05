import assert from 'node:assert/strict';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { BootSyncCoordinator } from '../src/bootstrap/boot-sync-coordinator.ts';
import { LiveCatalogService } from '../src/catalog/live/live-catalog.service.ts';
import { createActivePointer } from '../src/bootstrap/active-snapshot.ts';
import { CURRENT_CLASSIFICATION_PROFILE_VERSION } from '../src/source/source-classification-profile.ts';

import { SourceReplacementLifecycle, SOURCE_REPLACEMENT_KEY, SOURCE_METADATA_KEYS, canUseSourceCatalog } from '../src/bootstrap/source-replacement.ts';
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
async function buildPackageHelper(catalog, metadata = {}) {
  const builder = new PackageBuilder();
  const liveCatalog = LiveCatalogService.buildCatalog(catalog.metadata.snapshotId, [], []);
  return builder.build(catalog, {
    packageFormatVersion: 2,
    liveCatalog,
    metadata: { classificationProfileVersion: CURRENT_CLASSIFICATION_PROFILE_VERSION, ...metadata },
  });
}

async function setInitialActive(storage, catalog, manifest) {
  const liveCatalog = LiveCatalogService.buildCatalog(manifest.snapshotId, [], []);
  await storage.writeStaging(manifest.snapshotId, manifest, catalog, undefined, liveCatalog);
  await storage.promoteStaging(manifest.snapshotId);
  await storage.writeActivePointer(createActivePointer(manifest));
}

const A = { sourceId: 'source_A', sourceVersion: 1, protocol: 'XTREAM' };
const B = { sourceId: 'source_B', sourceVersion: 1, protocol: 'XTREAM' };
let epochs = 0, snapshots = 0, cases = 0;
async function test(name, run) { await run(); cases++; console.log('PASS ' + name); }
async function harness({ installed = true, accepted = false } = {}) {
  const storage = new InMemoryCatalogStorage(), bootstrap = new BootstrapService(storage);
  const rows = new Map([['device_identity', 'unchanged'], ['license', 'unchanged']]);
  const port = { getItem: k => rows.get(k) ?? null, setItem: (k,v) => rows.set(k,v), removeItem: k => rows.delete(k) };
  const h = { storage, bootstrap, port, rows, target: A, fail: false, denied: false, corrupt: false, empty: false, unavailable: false, race: false,
    stageCalls: 0, deliveryCalls: 0, authorityCalls: 0, stages: [], activationWrites: 0 };
  if (installed) {
    const c = createRealCatalog('old_snapshot'), p = await buildPackageHelper(c, { kind: 'REAL', ...A });
    await setInitialActive(storage, c, p.manifest);
  }
  const lifecycle = () => new SourceReplacementLifecycle(port, true, () => 's_bootstrap_' + ++epochs);
  if (accepted) {
    const l = new SourceReplacementLifecycle(port, false, () => 's_bootstrap_' + ++epochs);
    const plan = l.prepare(A, await bootstrap.getActivePointer()); l.complete(A, await bootstrap.getActivePointer(), plan.epoch);
  }
  h.coordinator = () => new BootSyncCoordinator({
    sourceReplacement: lifecycle(), bootstrapService: bootstrap,
    clearSourcePresentation: async () => { if(h.presentationFailure) throw Error('fixture blocked database'); h.presentationCleaned=true; },
    deviceContext: {
      getOrCreateIdentity: async () => ({ deviceId: 'device_fixture', displayCode: 'FIXTURE' }),
      loadActivationState: async () => ({ status: 'AUTHORIZED', deviceId: 'device_fixture', displayCode: 'FIXTURE', deviceAuthToken: 'synthetic_fixture_token', licenseId: 'fixture_license', licenseStatus: 'ACTIVE', licenseMode: 'SELF_SERVICE' }),
      saveActivationState: async () => { h.activationWrites++; },
    },
    sourceResolver: async () => {
      h.authorityCalls++;
      if (h.unavailable) throw Error('fixture offline');
      return { status: h.denied ? 'DEVICE_REVOKED' : 'SOURCE_READY', remoteAuthorityAvailable: true,
        sourceStatus: 'ACTIVE', licenseId: 'fixture_license', licenseStatus: 'ACTIVE', mode: 'SELF_SERVICE',
        ...(h.race && h.stageCalls ? A : h.target) };
    },
    secureStore: { get: async () => ({ ...h.target }) },
    sourceDelivery: { deliver: async () => { h.deliveryCalls++; } },
    contentRepository: { read: () => ({ ...h.target, snapshotId: 'old_snapshot', contentDigest: 'a'.repeat(64) }), write: () => {} },
    searchBuilder: async () => ({ success: true }),
    stagingOrchestrator: { stageManagedSource: async (checkpoint, options) => {
      assert.equal(h.presentationCleaned,true,'PRESENTATION_CLEANUP_MUST_PRECEDE_FULL_STAGING');
      h.stageCalls++; h.stages.push({ checkpoint, options });
      if (h.fail) return { success: false, status: 'REJECTED', errorCode: 'FIXTURE_IMPORT_FAILED' };
      const c = createRealCatalog('new_snapshot_' + ++snapshots);
      if (h.empty) { c.movies = []; c.series = []; c.seasons = []; c.episodes = []; c.streams = []; }
      const p = await buildPackageHelper(c, { kind: 'REAL', ...h.target, ...(h.corrupt ? { sourceId: 'wrong_source' } : {}) });
      await storage.writeStaging(c.metadata.snapshotId, p.manifest, c, undefined, LiveCatalogService.buildCatalog(c.metadata.snapshotId, [], []));
      return { success: true, status: 'STAGED', snapshotId: c.metadata.snapshotId, contentDigest: 'b'.repeat(64) };
    } },
  });
  return h;
}
await test('installed boot checks authority before exposure; migration bypasses checkpoint and NO_OP', async () => {
  const h = await harness(), c = h.coordinator();
  assert.equal(canUseSourceCatalog(c.getSourceReadiness(), await h.bootstrap.getActivePointer()), false);
  h.rows.set(SOURCE_METADATA_KEYS[0], 'old');
  assert.equal((await c.coordinateBootSync()).outcome, 'SOURCE_RESET_REQUIRED'); assert.equal(h.authorityCalls, 1); assert.equal(h.stageCalls, 0);
  assert.equal((await c.coordinateBootSync()).outcome, 'SOURCE_RESET_REQUIRED'); assert.equal(h.stageCalls, 0);
  const next = h.coordinator(), result = await next.coordinateBootSync();
  assert.equal(result.outcome, 'PROMOTED'); assert.equal(h.stageCalls, 1); assert.equal(h.deliveryCalls, 1);
  assert.equal(h.stages[0].checkpoint, undefined); assert.equal(h.stages[0].options.directoryRoots, 'PREFER');
  assert.notEqual(result.snapshotId, 'old_snapshot');
  assert.equal(canUseSourceCatalog(next.getSourceReadiness(), await h.bootstrap.getActivePointer()), true);
  assert.equal(h.rows.get('device_identity'), 'unchanged'); assert.equal(h.rows.get('license'), 'unchanged'); assert.equal(h.activationWrites, 0);
  assert.equal((await next.coordinateBootSync()).outcome, 'NO_OP'); assert.equal(h.stageCalls, 1);
});
await test('A to B to A reloads both times without reusing original snapshot', async () => {
  const h = await harness({ accepted: true }); h.target = B;
  assert.equal((await h.coordinator().coordinateBootSync()).outcome, 'SOURCE_RESET_REQUIRED');
  const bEpoch = JSON.parse(h.port.getItem(SOURCE_REPLACEMENT_KEY)).epoch;
  const b = await h.coordinator().coordinateBootSync(); assert.equal(b.outcome, 'PROMOTED');
  assert.equal((await h.bootstrap.getActivePointer()).sourceId, B.sourceId);
  h.target = A; assert.equal((await h.coordinator().coordinateBootSync()).outcome, 'SOURCE_RESET_REQUIRED');
  assert.notEqual(JSON.parse(h.port.getItem(SOURCE_REPLACEMENT_KEY)).epoch, bEpoch);
  const a = await h.coordinator().coordinateBootSync(); assert.equal(a.outcome, 'PROMOTED');
  assert.notEqual(a.snapshotId, 'old_snapshot'); assert.notEqual(a.snapshotId, b.snapshotId);
  assert.equal(h.stageCalls, 2); assert.ok(h.stages.every(s => s.checkpoint === undefined));
});
await test('failed B plus offline restart blocks A usage; returning A imports fresh', async () => {
  const h = await harness({ accepted: true }); h.target = B;
  await h.coordinator().coordinateBootSync(); h.fail = true;
  const failed = h.coordinator(), result = await failed.coordinateBootSync();
  assert.equal(result.syncState, 'ERROR'); assert.equal(canUseSourceCatalog(failed.getSourceReadiness(), await h.bootstrap.getActivePointer()), false);
  assert.equal((await h.bootstrap.getActivePointer()).snapshotId, 'old_snapshot');
  h.unavailable = true; const offline = h.coordinator(); await offline.coordinateBootSync();
  assert.equal(canUseSourceCatalog(offline.getSourceReadiness(), await h.bootstrap.getActivePointer()), false);
  h.unavailable = false; h.fail = false; h.target = A;
  assert.equal((await h.coordinator().coordinateBootSync()).outcome, 'SOURCE_RESET_REQUIRED');
  assert.equal((await h.coordinator().coordinateBootSync()).outcome, 'PROMOTED');
  assert.notEqual((await h.bootstrap.getActivePointer()).snapshotId, 'old_snapshot');
});
await test('unknown or denied authority cannot clear metadata or expose legacy catalog', async () => {
  for (const mode of ['unavailable', 'denied']) {
    const h = await harness(); h[mode] = true; h.rows.set(SOURCE_METADATA_KEYS[0], 'preserved');
    const c = h.coordinator(); await c.coordinateBootSync();
    assert.equal(h.rows.get(SOURCE_METADATA_KEYS[0]), 'preserved'); assert.equal(h.port.getItem(SOURCE_REPLACEMENT_KEY), null);
    assert.equal(h.stageCalls, 0); assert.equal(canUseSourceCatalog(c.getSourceReadiness(), await h.bootstrap.getActivePointer()), false);
  }
});
await test('verified exact snapshot works offline; rollback snapshot never inherits readiness', async () => {
  const h = await harness({ accepted: true }); h.unavailable = true;
  const c = h.coordinator(); await c.coordinateBootSync();
  assert.equal(canUseSourceCatalog(c.getSourceReadiness(), await h.bootstrap.getActivePointer()), true);
  assert.equal(canUseSourceCatalog(c.getSourceReadiness(), { ...(await h.bootstrap.getActivePointer()), snapshotId: 'foreign_rollback' }), false);
});
await test('authority change before promotion rejects stale source import', async () => {
  const h = await harness({ accepted: true }); h.target = B;
  await h.coordinator().coordinateBootSync(); h.race = true;
  const c = h.coordinator(), result = await c.coordinateBootSync();
  assert.equal(result.outcome, 'SOURCE_REPLACEMENT_FAILED'); assert.equal(result.syncState, 'ERROR');
  assert.equal((await h.bootstrap.getActivePointer()).snapshotId, 'old_snapshot');
  assert.equal(canUseSourceCatalog(c.getSourceReadiness(), await h.bootstrap.getActivePointer()), false);
});
await test('empty and wrong-source staging cannot promote or expose old catalog', async () => {
  for (const fault of ['empty', 'corrupt']) {
    const h = await harness({ accepted: true }); h.target = B; await h.coordinator().coordinateBootSync(); h[fault] = true;
    const c = h.coordinator(), r = await c.coordinateBootSync();
    assert.equal(r.syncState, 'ERROR'); assert.equal((await h.bootstrap.getActivePointer()).snapshotId, 'old_snapshot');
    assert.equal(canUseSourceCatalog(c.getSourceReadiness(), await h.bootstrap.getActivePointer()), false);
  }
});
await test('concurrent calls coalesce into one reset and one post-restart import', async () => {
  const h = await harness(), c = h.coordinator();
  const initial = await Promise.all([c.coordinateBootSync(), c.coordinateBootSync()]);
  assert.ok(initial.every(r => r.outcome === 'SOURCE_RESET_REQUIRED')); assert.equal(h.authorityCalls, 1);
  const next = h.coordinator(), results = await Promise.all([next.coordinateBootSync(), next.coordinateBootSync()]);
  assert.ok(results.every(r => r.outcome === 'PROMOTED')); assert.equal(h.stageCalls, 1);
});
await test('promotion guard failure blocks stale UI and supports a safe retry', async () => {
  const h = await harness({ accepted: true }); h.target = B; await h.coordinator().coordinateBootSync();
  const c = h.coordinator(), r = await c.coordinateBootSync({ canPromote: () => false });
  assert.equal(r.syncState, 'ERROR'); assert.equal(canUseSourceCatalog(c.getSourceReadiness(), await h.bootstrap.getActivePointer()), false);
  assert.equal((await c.coordinateBootSync({ canPromote: () => true })).outcome, 'PROMOTED');
});
await test('blocked presentation database prevents staging and promotion, then retries safely', async () => {
  const h = await harness(); await h.coordinator().coordinateBootSync(); h.presentationFailure=true;
  const c=h.coordinator(), result=await c.coordinateBootSync();
  assert.equal(result.outcome,'SOURCE_REPLACEMENT_FAILED'); assert.equal(h.stageCalls,0);
  assert.equal((await h.bootstrap.getActivePointer()).snapshotId,'old_snapshot');
  assert.equal(canUseSourceCatalog(c.getSourceReadiness(),await h.bootstrap.getActivePointer()),false);
  h.presentationFailure=false; assert.equal((await c.coordinateBootSync()).outcome,'PROMOTED');
});
console.log(`SOURCE_REPLACEMENT_BOOTSTRAP=PASS ${cases}`);
