import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { IngestionPipeline } from '../src/ingestion/pipeline.ts';
import { SyntheticSourceAdapter } from '../src/ingestion/adapters/synthetic-source.adapter.ts';
import { createManifest } from '../src/provisioning/manifest.ts';
import { createActivePointer } from '../src/bootstrap/active-snapshot.ts';
import { BootstrapService } from '../src/bootstrap/bootstrap.service.ts';

// No disk writes, network, device install or real credentials. Unlike the old
// in-memory adapter, this bridge model NEVER creates parents in copy/rename.
const storagePath = fileURLToPath(new URL('../src/bootstrap/storage/capacitor-filesystem.storage.ts', import.meta.url));
const storageSource = fs.readFileSync(storagePath, 'utf8');
const realRequire = createRequire(storagePath);
const fixture = fs.readFileSync(new URL('../fixtures/source/synthetic-source.valid.json', import.meta.url), 'utf8');
const ingestion = await new IngestionPipeline(new SyntheticSourceAdapter()).execute(fixture, {
  sourceNamespace: 'promotion-directories-synthetic',
  catalogVersion: '1.0.0',
  deterministicGeneratedAt: '2026-10-03T00:00:00.000Z',
});
assert.equal(ingestion.success, true);

const parent = (path) => path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
const ioError = (code, message) => Object.assign(new Error(message), { code });
const ACTIVE = 'prebuilt/active.json';
const IDENTITY_FILES = {
  'device_identity.json': 'synthetic-existing-device',
  'device_activation_key.json': 'synthetic-existing-key',
  'activation_state.json': 'synthetic-existing-authorization',
};

function createBridge(options = {}) {
  const dirs = new Set(['']);
  const files = new Map();
  const calls = [];
  const expected = new Map();
  function seedDir(path) {
    if (!path) return;
    seedDir(parent(path));
    dirs.add(path);
  }
  function put(path, value) { seedDir(parent(path)); files.set(path, value); }
  function record(method, args) {
    assert.equal(args.directory, 'DATA');
    if (args.toDirectory !== undefined) assert.equal(args.toDirectory, 'DATA');
    calls.push({ method, ...args });
  }
  function requireParent(path) {
    if (!dirs.has(parent(path))) throw ioError('OS-PLUG-FILE-0011', 'Missing parent directory');
  }
  function requireFile(path) {
    if (!files.has(path)) throw ioError('OS-PLUG-FILE-0008', 'File does not exist');
    return files.get(path);
  }
  function existingError() {
    if (options.existsStyle === 'web') return new Error('Current directory does already exist.');
    if (options.existsStyle === 'posix') return ioError('EEXIST', 'Already exists');
    return ioError('OS-PLUG-FILE-0010', 'Directory already exists');
  }
  const api = {
    async mkdir(args) {
      record('mkdir', args);
      assert.equal(args.recursive, true);
      if (options.mkdirFailure?.path === args.path) throw options.mkdirFailure.error;
      if (dirs.has(args.path) || files.has(args.path)) throw existingError();
      seedDir(args.path);
    },
    async stat(args) {
      record('stat', args);
      if (options.statFailure?.path === args.path) throw options.statFailure.error;
      if (dirs.has(args.path)) return { type: 'directory', size: 0 };
      if (files.has(args.path)) return { type: 'file', size: Buffer.byteLength(files.get(args.path)) };
      throw ioError('OS-PLUG-FILE-0008', 'File does not exist');
    },
    async readFile(args) { record('readFile', args); return { data: requireFile(args.path) }; },
    async writeFile(args) {
      record('writeFile', args);
      if (args.recursive) seedDir(parent(args.path));
      requireParent(args.path);
      if (args.path === ACTIVE) {
        const pointer = JSON.parse(args.data);
        const manifest = expected.get(pointer.snapshotId);
        if (manifest) {
          requireFile(`prebuilt/snapshots/${pointer.snapshotId}/manifest.json`);
          requireFile(`prebuilt/snapshots/${pointer.snapshotId}/catalog.json`);
          for (const seg of manifest.segments || []) {
            requireFile(`prebuilt/snapshots/${pointer.snapshotId}/segments/${seg.fileName.replace(/^segments\//, '')}`);
          }
        }
      }
      files.set(args.path, args.data);
    },
    async appendFile(args) { record('appendFile', args); files.set(args.path, requireFile(args.path) + args.data); },
    async deleteFile(args) { record('deleteFile', args); requireFile(args.path); files.delete(args.path); },
    async rmdir(args) {
      record('rmdir', args);
      assert.equal(args.recursive, true);
      if (!dirs.has(args.path)) throw ioError('OS-PLUG-FILE-0008', 'Directory does not exist');
      for (const path of [...files.keys()]) if (path.startsWith(`${args.path}/`)) files.delete(path);
      for (const path of [...dirs]) if (path === args.path || path.startsWith(`${args.path}/`)) dirs.delete(path);
    },
    async rename(args) {
      record('rename', args);
      if (options.renameFailure) throw ioError('RENAME_UNAVAILABLE', 'Directory rename unavailable');
      requireParent(args.to);
      if (!dirs.has(args.from)) throw ioError('OS-PLUG-FILE-0008', 'Directory does not exist');
      if (files.has(args.to) || dirs.has(args.to)) throw existingError();
      for (const path of [...dirs]) {
        if (path === args.from || path.startsWith(`${args.from}/`)) {
          dirs.delete(path); dirs.add(args.to + path.slice(args.from.length));
        }
      }
      for (const [path, data] of [...files]) {
        if (path.startsWith(`${args.from}/`)) {
          files.delete(path); files.set(args.to + path.slice(args.from.length), data);
        }
      }
    },
    async copy(args) {
      record('copy', args);
      requireParent(args.to);
      if (options.copyFailure && args.to.endsWith(options.copyFailure)) throw ioError('COPY_FAILED', 'Injected copy failure');
      files.set(args.to, requireFile(args.from));
    },
    async readdir(args) {
      record('readdir', args);
      return { files: [...files.keys()].filter((p) => parent(p) === args.path).map((p) => ({ name: p.slice(p.lastIndexOf('/') + 1) })) };
    },
  };
  for (const [path, value] of Object.entries(IDENTITY_FILES)) put(path, value);
  return { api, dirs, files, calls, expected, put, seedDir };
}

function legacyNoop(source) {
  const ast = ts.createSourceFile(storagePath, source, ts.ScriptTarget.Latest, true);
  const cls = ast.statements.find((s) => ts.isClassDeclaration(s) && s.name?.text === 'CapacitorFilesystemStorage');
  const method = cls.members.find((m) => m.name?.getText(ast) === 'ensureDir');
  assert.ok(method?.body);
  return source.slice(0, method.body.pos) + ' { /* pre-fix no-op */ }' + source.slice(method.body.end);
}

function loadStorage(bridge, source = storageSource) {
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const require = (name) => name === '@capacitor/filesystem'
    ? { Filesystem: bridge.api, Directory: { Data: 'DATA' }, Encoding: { UTF8: 'utf8' } }
    : realRequire(name);
  vm.runInNewContext(compiled, { module, exports: module.exports, require, Buffer, Uint8Array, btoa, atob,
    console: { log() {}, warn() {}, error() {} } }, { filename: storagePath });
  return new module.exports.CapacitorFilesystemStorage();
}

function packageData(snapshotId = 'snap-new', segments = false) {
  const catalog = { ...ingestion.catalog, metadata: { ...ingestion.catalog.metadata, snapshotId } };
  const manifest = createManifest(catalog, undefined, { compression: 'STORE', deterministicCreatedAt: '2026-10-03T00:00:00.000Z' });
  if (segments) manifest.segments = [{ fileName: 'movies_000001.json' }, { fileName: 'segments/streams_000001.json' }];
  return { catalog, manifest };
}

function seedStage(bridge, data) {
  const path = `prebuilt/staging/${data.manifest.snapshotId}`;
  bridge.put(`${path}/manifest.json`, JSON.stringify(data.manifest));
  bridge.put(`${path}/catalog.json`, JSON.stringify(data.catalog));
  for (const seg of data.manifest.segments || []) {
    bridge.put(`${path}/segments/${seg.fileName.replace(/^segments\//, '')}`, '[]');
  }
  bridge.expected.set(data.manifest.snapshotId, data.manifest);
}

function seedActive(bridge, snapshotId = 'snap-old') {
  const data = packageData(snapshotId);
  bridge.put(`prebuilt/snapshots/${snapshotId}/manifest.json`, JSON.stringify(data.manifest));
  bridge.put(`prebuilt/snapshots/${snapshotId}/catalog.json`, JSON.stringify(data.catalog));
  bridge.put(ACTIVE, JSON.stringify(createActivePointer(data.manifest, '2026-10-02T00:00:00.000Z')));
  return data;
}

function preservedFiles(bridge) {
  return new Map([...bridge.files].filter(([path]) => path === ACTIVE || path.startsWith('prebuilt/snapshots/snap-old/') || path in IDENTITY_FILES));
}
function assertPreserved(bridge, before) {
  for (const [path, value] of before) assert.equal(bridge.files.get(path), value, `Existing data changed: ${path}`);
}
function assertIdentity(bridge) { for (const [path, value] of Object.entries(IDENTITY_FILES)) assert.equal(bridge.files.get(path), value); }

let passed = 0;
async function test(name, run) { await run(); passed++; console.log(`PASS ${name}`); }

await test('fresh install: mkdir parent then rename, read model ready', async () => {
  const bridge = createBridge(); const storage = loadStorage(bridge); const data = packageData();
  seedStage(bridge, data);
  const service = new BootstrapService(storage);
  const result = await service.promoteStagedSnapshot(data.manifest.snapshotId);
  assert.equal(result.status, 'PROMOTED');
  assert.equal((await service.initialize()).status, 'ACTIVE_CATALOG_READY');
  assert.equal((await service.getActiveCatalog()).metadata.snapshotId, data.manifest.snapshotId);
  assert.equal(bridge.dirs.has('prebuilt/staging/snap-new'), false);
  const mkdir = bridge.calls.findIndex((c) => c.method === 'mkdir');
  const rename = bridge.calls.findIndex((c) => c.method === 'rename');
  const pointer = bridge.calls.findIndex((c) => c.method === 'writeFile' && c.path === ACTIVE);
  assert.ok(mkdir < rename && rename < pointer);
  assertIdentity(bridge);
});

for (const renameFailure of [false, true]) {
  await test(`actual stageArtifacts -> ${renameFailure ? 'copy' : 'rename'} -> Bootstrap read model`, async () => {
    const bridge = createBridge({ renameFailure }); const storage = loadStorage(bridge);
    const data = packageData(); const service = new BootstrapService(storage);
    bridge.expected.set(data.manifest.snapshotId, data.manifest);
    const staged = await service.stageArtifacts(data.manifest, data.catalog);
    assert.equal(staged.status, 'STAGED');
    assert.equal(bridge.files.has(ACTIVE), false);
    assert.equal(bridge.dirs.has('prebuilt/snapshots'), false);
    assert.equal((await service.promoteStagedSnapshot('snap-new')).status, 'PROMOTED');
    assert.equal((await service.initialize()).status, 'ACTIVE_CATALOG_READY');
    assert.equal((await service.getActiveCatalog()).metadata.snapshotId, 'snap-new');
    assertIdentity(bridge);
  });
}

for (const existsStyle of ['native', 'web', 'posix']) {
  await test(`existing directories ${existsStyle}: stat-confirmed and old snapshot preserved`, async () => {
    const bridge = createBridge({ existsStyle }); const storage = loadStorage(bridge);
    seedActive(bridge); seedStage(bridge, packageData());
    const oldCatalog = bridge.files.get('prebuilt/snapshots/snap-old/catalog.json');
    await storage.promoteStaging('snap-new');
    assert.equal(bridge.files.get('prebuilt/snapshots/snap-old/catalog.json'), oldCatalog);
    assert.ok(bridge.calls.some((c) => c.method === 'stat' && c.path === 'prebuilt/snapshots'));
    assertIdentity(bridge);
  });
}

await test('rename unavailable: fallback creates target and canonical segments before pointer', async () => {
  const bridge = createBridge({ renameFailure: true }); const storage = loadStorage(bridge);
  seedActive(bridge); seedStage(bridge, packageData('snap-new', true));
  await storage.promoteStaging('snap-new');
  assert.equal(JSON.parse(bridge.files.get(ACTIVE)).snapshotId, 'snap-new');
  assert.deepEqual(await storage.listActiveSegments(), ['segments/movies_000001.json', 'segments/streams_000001.json']);
  assert.equal(await storage.readActiveSegment('movies_000001.json'), '[]');
  assert.equal(await storage.readActiveSegment('segments/streams_000001.json'), '[]');
  assert.ok(bridge.calls.some((c) => c.method === 'mkdir' && c.path.endsWith('/snap-new/segments')));
  assert.ok(!bridge.calls.some((c) => c.to?.includes('segments/segments/')));
  assertIdentity(bridge);
});

await test('fallback on fresh install: full Bootstrap -> storage -> active read model', async () => {
  const bridge = createBridge({ renameFailure: true }); const storage = loadStorage(bridge);
  seedStage(bridge, packageData());
  const service = new BootstrapService(storage);
  assert.equal((await service.promoteStagedSnapshot('snap-new')).status, 'PROMOTED');
  assert.equal((await service.initialize()).status, 'ACTIVE_CATALOG_READY');
  assert.equal((await service.getActiveCatalog()).metadata.snapshotId, 'snap-new');
  assertIdentity(bridge);
});

await test('fallback on update: keeps previous generation', async () => {
  const bridge = createBridge({ renameFailure: true }); const storage = loadStorage(bridge);
  seedActive(bridge); seedStage(bridge, packageData());
  const old = bridge.files.get('prebuilt/snapshots/snap-old/catalog.json');
  await storage.promoteStaging('snap-new');
  assert.equal(bridge.files.get('prebuilt/snapshots/snap-old/catalog.json'), old);
  assertIdentity(bridge);
});

await test('existing non-active partial target: fallback recovers without changing old generation', async () => {
  const bridge = createBridge({ renameFailure: true }); const storage = loadStorage(bridge);
  seedActive(bridge); seedStage(bridge, packageData('snap-new', true));
  bridge.put('prebuilt/snapshots/snap-new/partial.json', 'stale');
  await storage.promoteStaging('snap-new');
  assert.equal(bridge.files.has('prebuilt/snapshots/snap-new/partial.json'), false);
  assertIdentity(bridge);
});

for (const [code, message] of [['OS-PLUG-FILE-0007', 'Permission denied'], ['ENOSPC', 'No space left'], ['BRIDGE_UNAVAILABLE', 'Bridge unavailable']]) {
  await test(`mkdir ${code}: propagated, active and identities intact`, async () => {
    const error = ioError(code, message);
    const bridge = createBridge({ mkdirFailure: { path: 'prebuilt/snapshots', error } });
    const storage = loadStorage(bridge); seedActive(bridge); seedStage(bridge, packageData());
    const before = preservedFiles(bridge);
    await assert.rejects(storage.promoteStaging('snap-new'), (e) => e === error);
    assert.equal(bridge.calls.some((c) => c.method === 'rename' || c.method === 'copy'), false);
    assertPreserved(bridge, before);
  });
}

await test('target mkdir failure: old pointer and snapshot intact', async () => {
  const error = ioError('ENOSPC', 'No space left');
  const bridge = createBridge({ renameFailure: true, mkdirFailure: { path: 'prebuilt/snapshots/snap-new', error } });
  const storage = loadStorage(bridge); seedActive(bridge); seedStage(bridge, packageData());
  const before = preservedFiles(bridge);
  await assert.rejects(storage.promoteStaging('snap-new'), (e) => e === error);
  assertPreserved(bridge, before);
});

await test('segments mkdir failure: incomplete target cleaned, old active intact', async () => {
  const error = ioError('OS-PLUG-FILE-0007', 'Permission denied');
  const bridge = createBridge({ renameFailure: true, mkdirFailure: { path: 'prebuilt/snapshots/snap-new/segments', error } });
  const storage = loadStorage(bridge); seedActive(bridge); seedStage(bridge, packageData('snap-new', true));
  const before = preservedFiles(bridge);
  await assert.rejects(storage.promoteStaging('snap-new'), (e) => e === error);
  assert.equal(bridge.dirs.has('prebuilt/snapshots/snap-new'), false);
  assertPreserved(bridge, before);
});

await test('already exists but is a file: reject, never delete file', async () => {
  const bridge = createBridge(); const storage = loadStorage(bridge); seedStage(bridge, packageData());
  bridge.put('prebuilt/snapshots', 'not-a-directory');
  await assert.rejects(storage.promoteStaging('snap-new'), (e) => e.code === 'OS-PLUG-FILE-0010');
  assert.equal(bridge.files.get('prebuilt/snapshots'), 'not-a-directory');
  assert.equal(bridge.calls.some((c) => c.method === 'rmdir'), false);
  assertIdentity(bridge);
});

await test('already exists but stat fails: do not swallow I/O error', async () => {
  const error = ioError('STAT_FAILED', 'Injected stat failure');
  const bridge = createBridge({ statFailure: { path: 'prebuilt/snapshots', error } });
  const storage = loadStorage(bridge); seedActive(bridge); seedStage(bridge, packageData());
  const before = preservedFiles(bridge);
  await assert.rejects(storage.promoteStaging('snap-new'), (e) => e === error);
  assertPreserved(bridge, before);
});

for (const copyFailure of ['/manifest.json', '/catalog.json', '/segments/streams_000001.json']) {
  await test(`copy failure ${copyFailure}: cleanup candidate only, preserve old active`, async () => {
    const bridge = createBridge({ renameFailure: true, copyFailure }); const storage = loadStorage(bridge);
    seedActive(bridge); seedStage(bridge, packageData('snap-new', true));
    const before = preservedFiles(bridge);
    await assert.rejects(storage.promoteStaging('snap-new'), (e) => e.code === 'COPY_FAILED');
    assert.equal(bridge.dirs.has('prebuilt/snapshots/snap-new'), false);
    assert.equal(bridge.calls.some((c) => c.method === 'writeFile' && c.path === ACTIVE), false);
    assertPreserved(bridge, before);
  });
}

for (const conflict of [false, true]) {
  await test(`same active snapshot ${conflict ? 'hash conflict' : 'repeat'}: reject before deleting data`, async () => {
    const bridge = createBridge(); const storage = loadStorage(bridge);
    const data = seedActive(bridge);
    if (conflict) data.manifest.packageContentHash = 'f'.repeat(64);
    seedStage(bridge, data);
    const before = preservedFiles(bridge);
    const result = await new BootstrapService(storage).promoteStagedSnapshot('snap-old');
    assert.equal(result.status, 'REJECTED');
    assert.match(result.errors[0], /STORAGE_PROMOTION_ACTIVE_CONFLICT/);
    assert.equal(bridge.calls.some((c) => c.method === 'rmdir' && c.path === 'prebuilt/snapshots/snap-old'), false);
    assertPreserved(bridge, before);
  });
}

await test('staging and binary index mkdir idempotence: existing data unchanged', async () => {
  const bridge = createBridge(); const storage = loadStorage(bridge); const data = packageData();
  await storage.writeStaging('snap-new', data.manifest, data.catalog, Buffer.from('synthetic-index'));
  await storage.writeStaging('snap-new', data.manifest, data.catalog, Buffer.from('synthetic-index'));
  await storage.writeActiveSearchIndex('snap-index', Buffer.from('synthetic-index'));
  await storage.writeActiveSearchIndex('snap-index', Buffer.from('synthetic-index'));
  assert.equal(bridge.files.get('prebuilt/staging/snap-new/compact-search-index-v2.bin'), Buffer.from('synthetic-index').toString('base64'));
  assert.equal(bridge.calls.some((c) => c.method === 'rmdir'), false);
  assertIdentity(bridge);
});

await test('concurrent mkdir for index writes: existing-directory race tolerated', async () => {
  const bridge = createBridge(); const storage = loadStorage(bridge);
  await Promise.all([storage.writeActiveSearchIndex('snap-index', Buffer.from('index')), storage.writeActiveSearchIndex('snap-index', Buffer.from('index'))]);
  assert.equal(bridge.files.get('prebuilt/snapshots/snap-index/compact-search-index-v2.bin'), Buffer.from('index').toString('base64'));
  assertIdentity(bridge);
});

for (const renameFailure of [false, true]) {
  await test(`negative control no-op ensureDir ${renameFailure ? 'copy' : 'rename'}: reproduces reported failure`, async () => {
    const bridge = createBridge({ renameFailure }); const storage = loadStorage(bridge, legacyNoop(storageSource));
    seedStage(bridge, packageData());
    const result = await new BootstrapService(storage).promoteStagedSnapshot('snap-new');
    assert.equal(result.status, 'REJECTED');
    assert.match(result.errors[0], /PROMOTION_FAILED.*Missing parent directory/);
    assert.equal(bridge.calls.some((c) => c.method === 'mkdir'), false);
    assert.equal(bridge.files.has(ACTIVE), false);
    assertIdentity(bridge);
  });
}

await test('negative control no-op with existing parent: explains device-dependent success', async () => {
  const bridge = createBridge(); const storage = loadStorage(bridge, legacyNoop(storageSource));
  bridge.seedDir('prebuilt/snapshots'); seedStage(bridge, packageData());
  assert.equal((await new BootstrapService(storage).promoteStagedSnapshot('snap-new')).status, 'PROMOTED');
  assertIdentity(bridge);
});

console.log(`C11_CATALOG_PROMOTION_DIRECTORY_TESTS=${passed}/${passed}_PASS`);
console.log('ANDROID_BRIDGE_MODEL_ONLY_PHYSICAL_REVALIDATION=PENDING');
