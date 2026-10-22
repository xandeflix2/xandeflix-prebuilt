import assert from 'node:assert/strict';
import { ManagedSourceStagingOrchestrator } from '../src/source/managed-source-staging.orchestrator.ts';
import { BootSyncCoordinator } from '../src/bootstrap/boot-sync-coordinator.ts';
import { CURRENT_CLASSIFICATION_PROFILE_VERSION } from '../src/source/source-classification-profile.ts';

let passed = 0;
async function test(name, run) { await run(); console.log('PASS ' + name); passed++; }
const sourceId = 'src_c105fixture';
const authority = { status: 'SOURCE_READY', remoteResultCode: 'SOURCE_READY', remoteAuthorityAvailable: true,
  mode: 'MANAGED', sourceStatus: 'ACTIVE', sourceId, sourceVersion: 1, protocol: 'M3U',
  licenseId: 'license-fixture', licenseStatus: 'ACTIVE' };
const record = { sourceId, sourceVersion: 1, protocol: 'M3U', sourceConfig: {
  playlistUrl: 'https://provider.fixture.invalid/sub/get.php?username=fixture-user&password=fixture-pass&type=m3u_plus' } };
const rejected = { success: false, error: 'REAL_SOURCE_FETCH_FAILED', errorStage: 'FETCH' };
function stagingHarness(overrides = {}) {
  const calls = [];
  const successful = { success: true, contentDigest: 'a'.repeat(64), catalog: {}, liveCatalog: {},
    segmentedStaging: { snapshotId: 'directory-candidate', catalogHeader: {}, manifest: {} } };
  const orchestrator = new ManagedSourceStagingOrchestrator({
    resolveAuthorization: async () => overrides.authority || authority,
    secureSourceStore: { get: async () => overrides.record || record },
    bootstrapService: { stagePackage: async () => { throw Error('Unexpected package'); } },
    importer: {
      importXtream: async (config, options) => { calls.push({ kind: 'XTREAM', config, options });
        if (overrides.throwDirectory) throw Error('Synthetic private failure');
        return overrides.failDirectory ? rejected : successful; },
      importM3u: async (config, options) => { calls.push({ kind: 'M3U', config, options }); return successful; },
    },
  });
  return { orchestrator, calls };
}

await test('FIRST_DIRECTORY_IMPORT_PRESERVES_M3U_PROVENANCE_AND_SEALED_CONFIG', async () => {
  const before = JSON.stringify(record), h = stagingHarness();
  const result = await h.orchestrator.stageManagedSource(undefined, { directoryRoots: 'PREFER' });
  assert.equal(result.status, 'STAGED'); assert.equal(result.protocol, 'M3U'); assert.equal(result.sourceVersion, 1);
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].kind, 'XTREAM');
  assert.equal(h.calls[0].options.directoryRoots, true);
  assert.equal(h.calls[0].config.host, 'https://provider.fixture.invalid/sub');
  assert.deepEqual(h.calls[0].options.provenance, { kind: 'REAL', sourceId, sourceVersion: 1 });
  assert.equal(JSON.stringify(record), before);
});
await test('LEGACY_DEFAULT_REMAINS_M3U_WITHOUT_DIRECTORY', async () => {
  const h = stagingHarness(); await h.orchestrator.stageManagedSource();
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].kind, 'M3U');
  assert.equal(h.calls[0].options.directoryRoots, undefined);
});
await test('FIRST_UNSUPPORTED_DIRECTORY_FALLS_BACK_TO_LEGACY', async () => {
  const h = stagingHarness({ failDirectory: true });
  assert.equal((await h.orchestrator.stageManagedSource(undefined, { directoryRoots: 'PREFER' })).success, true);
  assert.deepEqual(h.calls.map(c => c.kind), ['XTREAM', 'M3U']);
});
await test('DIRECTORY_EXCEPTION_FIRST_IMPORT_CAN_FALL_BACK', async () => {
  const h = stagingHarness({ throwDirectory: true });
  assert.equal((await h.orchestrator.stageManagedSource(undefined, { directoryRoots: 'PREFER' })).success, true);
  assert.deepEqual(h.calls.map(c => c.kind), ['XTREAM', 'M3U']);
});
await test('ESTABLISHED_DIRECTORY_FAILURE_NEVER_SWITCHES_PROVIDER_IDS_TO_ORDINALS', async () => {
  const h = stagingHarness({ failDirectory: true });
  assert.equal((await h.orchestrator.stageManagedSource(undefined, { directoryRoots: 'REQUIRE' })).success, false);
  assert.deepEqual(h.calls.map(c => c.kind), ['XTREAM']);
});
await test('ESTABLISHED_DIRECTORY_INCOMPATIBLE_CONFIG_FAILS_WITHOUT_FETCH', async () => {
  const h = stagingHarness({ record: { ...record, sourceConfig: { playlistUrl: 'https://provider.fixture.invalid/playlist.m3u' } } });
  assert.equal((await h.orchestrator.stageManagedSource(undefined, { directoryRoots: 'REQUIRE' })).success, false);
  assert.equal(h.calls.length, 0);
});
await test('REVOKED_OR_WRONG_GENERATION_NEVER_FETCHES_DIRECTORY', async () => {
  for (const overrides of [{ authority: { ...authority, status: 'DEVICE_REVOKED', remoteResultCode: 'DEVICE_REVOKED' } },
    { record: { ...record, sourceVersion: 2 } }]) {
    const h = stagingHarness(overrides);
    assert.equal((await h.orchestrator.stageManagedSource(undefined, { directoryRoots: 'PREFER' })).success, false);
    assert.equal(h.calls.length, 0);
  }
});
await test('DIRECTORY_UNCHANGED_DIGEST_USES_EXISTING_CHECKPOINT', async () => {
  const h = stagingHarness();
  await h.orchestrator.stageManagedSource({ sourceId, sourceVersion: 1, unchangedContentDigest: 'a'.repeat(64) }, { directoryRoots: 'REQUIRE' });
  assert.equal(h.calls[0].options.unchangedContentDigest, 'a'.repeat(64));
});

function bootHarness(mode, overrides = {}) {
  const pointer = mode === 'NONE' ? null : { snapshotId: 'active-fixture', catalogVersion: '1.0.0',
    schemaVersion: 1, packageContentHash: 'b'.repeat(64), promotedAt: '2026-10-14T00:00:00Z',
    kind: 'REAL', sourceId: overrides.activeSourceId || sourceId, sourceVersion: overrides.activeVersion || 1 };
  const identity = { deviceId: 'device-fixture', displayCode: 'XF-TEST-TEST' };
  const activation = { ...identity, status: 'AUTHORIZED', deviceAuthToken: 'synthetic-token', licenseId: authority.licenseId,
    licenseStatus: 'ACTIVE', licenseMode: 'MANAGED' };
  let captured;
  const storage = { hasActiveCatalog: async () => !!pointer,
    readActiveManifest: async () => ({ classificationProfileVersion: CURRENT_CLASSIFICATION_PROFILE_VERSION }) };
  const coordinator = new BootSyncCoordinator({
    deviceContext: { loadActivationState: async () => activation, getOrCreateIdentity: async () => identity },
    sourceResolver: async () => authority, secureStore: { get: async () => record },
    bootstrapService: { getStorage: () => storage, getActivePointer: async () => pointer,
      getActiveCatalog: async () => ({ metadata: { snapshotId: pointer?.snapshotId }, extensions: {
        sourceInventoryMode: mode === 'DIRECTORY' ? 'DIRECTORY_ROOTS_V1' : undefined } }) },
    contentRepository: { read: () => null, write: () => {} }, searchBuilder: async () => ({ success: true }),
    stagingOrchestrator: { stageManagedSource: async (check, inventory) => { captured = { check, inventory };
      return { success: false, status: 'REJECTED', rawItemCount: 0, movieCount: 0, seriesCount: 0, liveCount: 0, unresolvedCount: 0 }; } },
  });
  return { coordinator, captured: () => captured, pointer: () => pointer };
}
await test('BOOT_SELECTS_DIRECTORY_ONLY_FIRST_INSTALL_OR_PREVIOUS_DIRECTORY', async () => {
  for (const [mode, expected] of [['NONE', 'PREFER'], ['DIRECTORY', 'REQUIRE'], ['LEGACY', undefined]]) {
    const h = bootHarness(mode); await h.coordinator.coordinateBootSync({ checkContent: true });
    assert.equal(h.captured()?.inventory?.directoryRoots, expected, mode);
  }
});
await test('DIFFERENT_SOURCE_MAY_PREFER_DIRECTORY_WITHOUT_INHERITING_OLD_INVENTORY', async () => {
  for (const mode of ['DIRECTORY', 'LEGACY']) {
    const h = bootHarness(mode, { activeSourceId: 'src_previousfixture' });
    const result = await h.coordinator.coordinateBootSync({ checkContent: true });
    assert.equal(h.captured()?.inventory?.directoryRoots, 'PREFER');
    assert.equal(result.outcome, 'LOCAL_FIRST_ACTIVE_PRESERVED');
    assert.equal(h.pointer().sourceId, 'src_previousfixture');
  }
});
await test('SAME_SOURCE_VERSION_CHANGE_PRESERVES_DIRECTORY_AND_LEGACY_IDS', async () => {
  for (const [mode, expected] of [['DIRECTORY', 'REQUIRE'], ['LEGACY', undefined]]) {
    const h = bootHarness(mode, { activeVersion: 2 });
    await h.coordinator.coordinateBootSync({ checkContent: true });
    assert.equal(h.captured()?.inventory?.directoryRoots, expected);
  }
});
console.log(`C105_DIRECTORY_ORCHESTRATION_TESTS=${passed}/11_PASS`);
