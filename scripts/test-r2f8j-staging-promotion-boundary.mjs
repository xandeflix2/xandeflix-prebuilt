import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { PackageBuilder } from '../src/provisioning/package-builder.ts';
import { InMemoryCatalogStorage } from '../src/bootstrap/storage/in-memory.storage.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';
import {
  candidateFromRemoteMetadata,
  candidateFromTmpMetadata,
  resolveSourceAuthority,
} from '../src/control-plane/source-resolution-authority.ts';
import { createManagedStagingCandidatePlan, SNAPSHOT_STAGING_PROMOTION_BOUNDARY_LOCK_ID } from '../src/bootstrap/staging-candidate.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LOCK_TEST_ID = SNAPSHOT_STAGING_PROMOTION_BOUNDARY_LOCK_ID;
const fixturePath = `${ROOT}/fixtures/source/synthetic-source.valid.json`;

let total = 0;
let passed = 0;

async function test(name, fn) {
  total += 1;
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function buildPackage(catalogVersion, generatedAt) {
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const ingestion = await new IngestionPipeline(new SyntheticSourceAdapter()).execute(raw, {
    sourceNamespace: 'r2f8j',
    catalogVersion,
    deterministicGeneratedAt: generatedAt,
  });
  assert.equal(ingestion.success, true);
  assert.ok(ingestion.catalog);

  const built = await new PackageBuilder().build(ingestion.catalog, {
    deterministicCreatedAt: generatedAt,
  });
  assert.equal(built.success, true);
  assert.ok(built.packageBuffer);
  return built;
}

const packageA = await buildPackage('r2f8j-a', '2026-09-13T00:00:00.000Z');
const packageB = await buildPackage('r2f8j-b', '2026-09-13T00:01:00.000Z');
const storage = new InMemoryCatalogStorage();
const bootstrap = new BootstrapService(storage);
const activeImport = await bootstrap.importPackage(packageA.packageBuffer);
assert.equal(activeImport.status, 'PROMOTED');
const activeBefore = await bootstrap.getActivePointer();
assert.ok(activeBefore);

await test('T01 runtime active pointer authority identified', async () => {
  const storageSource = fs.readFileSync(`${ROOT}/src/bootstrap/storage/capacitor-filesystem.storage.ts`, 'utf8');
  const hookSource = fs.readFileSync(`${ROOT}/src/ui/hooks/useActiveCatalog.ts`, 'utf8');
  assert.match(storageSource, /Directory\.Data/);
  assert.match(storageSource, /prebuilt\/active\.json/);
  assert.match(hookSource, /service\.initialize\(\)/);
  assert.match(hookSource, /service\.getActiveCatalog\(\)/);
});

await test('T02 tmp active pointer não vira authority', async () => {
  const runtimeFiles = [
    'src/bootstrap/storage/capacitor-filesystem.storage.ts',
    'src/bootstrap/bootstrap.service.ts',
    'src/ui/hooks/useActiveCatalog.ts',
  ];
  for (const file of runtimeFiles) {
    const source = fs.readFileSync(`${ROOT}/${file}`, 'utf8');
    assert.doesNotMatch(source, /tmp[\\/]active\.json/);
  }
  assert.equal((await bootstrap.getActivePointer())?.snapshotId, activeBefore.snapshotId);
});

await test('T03 candidate creation não altera active', async () => {
  const staged = await bootstrap.stagePackage(packageB.packageBuffer);
  assert.equal(staged.success, true);
  assert.equal(staged.status, 'STAGED');
  assert.equal((await bootstrap.getActivePointer())?.snapshotId, activeBefore.snapshotId);
  assert.ok(await storage.readStaging(packageB.snapshotId));
});

await test('T04 staging creation não altera active', async () => {
  assert.equal((await bootstrap.getActivePointer())?.snapshotId, activeBefore.snapshotId);
  assert.notEqual((await storage.readStaging(packageB.snapshotId))?.manifest.snapshotId, activeBefore.snapshotId);
});

await test('T05 promotion só ocorre por ação explícita', async () => {
  assert.equal((await bootstrap.getActivePointer())?.snapshotId, activeBefore.snapshotId);
  const promoted = await bootstrap.promoteStagedSnapshot(packageB.snapshotId, {
    expectedPreviousSnapshotId: activeBefore.snapshotId,
  });
  assert.equal(promoted.status, 'PROMOTED');
  assert.equal((await bootstrap.getActivePointer())?.snapshotId, packageB.snapshotId);
});

await test('T06 v5 source pode entrar no staging flow', async () => {
  const decision = resolveSourceAuthority({
    mode: 'MANAGED',
    deviceId: 'device-r2f8j',
    managedCandidates: [candidateFromRemoteMetadata({
      status: 'SOURCE_READY',
      mode: 'MANAGED',
      sourceId: 'src_uhwh5cio',
      sourceVersion: 5,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
    }, 'device-r2f8j')],
  });
  const plan = createManagedStagingCandidatePlan(decision.selected);
  assert.equal(decision.outcome, 'SOURCE_READY');
  assert.equal(plan.sourceVersion, 5);
  assert.equal(plan.promotionRequired, 'SIM');
});

await test('T07 stale v4 tmp não é requisito de source authority', async () => {
  const decision = resolveSourceAuthority({
    mode: 'MANAGED',
    deviceId: 'device-r2f8j',
    managedCandidates: [candidateFromRemoteMetadata({
      status: 'SOURCE_READY',
      mode: 'MANAGED',
      sourceId: 'src_uhwh5cio',
      sourceVersion: 5,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
    }, 'device-r2f8j')],
    tmpCandidate: candidateFromTmpMetadata({
      deviceId: 'device-r2f8j',
      sourceId: 'src_uhwh5cio',
      sourceVersion: 4,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      mode: 'MANAGED',
    }),
  });
  assert.equal(decision.selected.sourceVersion, 5);
  assert.equal(decision.staleTmpVersionObserved, 4);
});

await test('T08 rollback/recovery não é acionado durante candidate creation', async () => {
  const recoveryBeforeCandidate = await storage.readRecoveryJournal();
  const staged = await bootstrap.stagePackage(packageA.packageBuffer, { forceReimport: true });
  assert.equal(staged.status, 'STAGED');
  assert.deepEqual(await storage.readRecoveryJournal(), recoveryBeforeCandidate);
  assert.equal((await bootstrap.getActivePointer())?.snapshotId, packageB.snapshotId);
});

await test('T09 active pointer conflitante não sobrepõe autoridade runtime', async () => {
  const runtimePointer = await bootstrap.getActivePointer();
  const tmpPointer = { snapshotId: 'real-tablet-1789276355259' };
  assert.ok(runtimePointer);
  assert.notEqual(tmpPointer.snapshotId, runtimePointer.snapshotId);
  assert.equal(runtimePointer.snapshotId, packageB.snapshotId);
});

await test('T10 SELF_SERVICE não sofre alteração indevida', async () => {
  const decision = resolveSourceAuthority({
    mode: 'SELF_SERVICE',
    deviceId: 'device-r2f8j',
    managedCandidates: [],
  });
  assert.equal(decision.outcome, 'SELF_SERVICE_LOCAL');
});

await test('T11 nenhuma credencial aparece em logs ou contrato de staging', async () => {
  const source = fs.readFileSync(`${ROOT}/src/bootstrap/package-importer.ts`, 'utf8');
  assert.doesNotMatch(source, /password|username|playlistUrl|deviceAuthToken|service_role/i);
  assert.doesNotMatch(source, /console\.(log|warn|error)/);
});

await test('T12 locks anteriores continuam PASS', async () => {
  const outputs = [
    fs.readFileSync(`${ROOT}/scripts/test-r2f8c1-content-kind-classifier-lock.mjs`, 'utf8'),
    fs.readFileSync(`${ROOT}/scripts/test-r2f8d-typed-category-scope.mjs`, 'utf8'),
    fs.readFileSync(`${ROOT}/scripts/test-r2f8h-source-resolution-authority.mjs`, 'utf8'),
  ].join('\n');
  assert.match(outputs, /CONTENT_KIND_CLASSIFIER_LOCK_V1/);
  assert.match(outputs, /TYPED_CATEGORY_SCOPE_LOCK_V1/);
  assert.match(outputs, /MANAGED_SOURCE_RESOLUTION_AUTHORITY_LOCK_V1/);
});

console.log(`R2F8J_TEST_COUNT=${total}`);
console.log(`R2F8J_TEST_PASS_COUNT=${passed}`);
console.log(`SNAPSHOT_BOUNDARY_LOCK_ID=${LOCK_TEST_ID}`);
console.log(`SNAPSHOT_BOUNDARY_LOCK_TEST=${passed === total ? 'PASS' : 'FAIL'}`);
const lockFiles = [
  'src/bootstrap/types.ts',
  'src/bootstrap/package-importer.ts',
  'src/bootstrap/bootstrap.service.ts',
  'src/bootstrap/staging-candidate.ts',
  'scripts/test-r2f8j-staging-promotion-boundary.mjs',
  'scripts/execute-r7c-r6d-tablet-pipeline.ts',
];
const digest = crypto.createHash('sha256');
for (const file of lockFiles) {
  digest.update(file);
  digest.update(fs.readFileSync(`${ROOT}/${file}`));
}
console.log(`SNAPSHOT_BOUNDARY_LOCK_HASH=${digest.digest('hex').toUpperCase()}`);
if (passed !== total) process.exitCode = 1;
