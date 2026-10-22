import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readCatalogReadDiagnostic } from '../src/ui/settings/catalog-read-diagnostic.ts';
let passed = 0;
const test = async (name, run) => { await run(); passed++; console.log('PASS ' + name); };
const snapshotId = 'diagnostic-fixture';
const privateValue = 'https://private.fixture.invalid/path?password=PRIVATE_FIXTURE';
function fixture(overrides = {}) {
  const catalog = { metadata: { snapshotId }, movies: [{ title: privateValue }], series: [{ title: privateValue }], categories: [{ name: privateValue }] };
  const manifest = { snapshotId, counts: { movies: 2000, series: 1000, live: 500 },
    segments: ['movies', 'series', 'live'].flatMap(kind => [1, 2].map(n => ({ kind, fileName: kind + '_' + n + '.json' }))) };
  let pointers = 0;
  const reads = [];
  const storage = {
    readActivePointer: async () => { pointers++; if (overrides.pointerError) throw Error(privateValue);
      return overrides.noPointer ? null : { snapshotId: overrides.badSnapshot || (overrides.changed && pointers > 1 ? 'different' : snapshotId) }; },
    readActiveManifest: async () => overrides.manifest === undefined ? manifest : overrides.manifest,
    readActiveCatalog: async () => overrides.catalog === undefined ? catalog : overrides.catalog,
    readActiveSegment: async path => { reads.push(path); if (overrides.segmentError) throw Error(privateValue);
      return overrides.raw === undefined ? JSON.stringify([{ title: privateValue }, {}]) : overrides.raw; },
  };
  const deps = { storage, readLiveHeader: async () => {
    if (overrides.liveError) throw Error(privateValue);
    return overrides.live === undefined ? JSON.stringify({ snapshotId, channels: [{ name: privateValue }], groups: [{ name: privateValue }] }) : overrides.live;
  }, parentalStatus: () => overrides.parental || 'ready' };
  return { deps, reads, catalog, manifest };
}
await test('PROMOTED_TOTALS_DISTINCT_FROM_BOUNDED_HEADERS_AND_SAMPLES', async () => {
  const f = fixture(), before = JSON.stringify([f.catalog, f.manifest]);
  const result = await readCatalogReadDiagnostic(f.deps);
  assert.equal(result.state, 'READABLE');
  assert.deepEqual(result.totals, { movies: 2000, series: 1000, live: 500 });
  assert.deepEqual(result.firstFold, { movies: 1, series: 1, live: 1 });
  assert.deepEqual(Object.values(result.samples).map(s => s.records), [2, 2, 2]);
  assert.deepEqual(f.reads, ['segments/movies_1.json', 'segments/series_1.json', 'segments/live_1.json']);
  assert.equal(JSON.stringify([f.catalog, f.manifest]), before);
  assert.ok(!JSON.stringify(result).includes('PRIVATE_FIXTURE'));
  assert.ok(!JSON.stringify(result).includes('fixture.invalid'));
  assert.ok(!JSON.stringify(result).includes(snapshotId));
});
await test('LEGITIMATE_ZEROS_AND_NO_ACTIVE_CATALOG_ARE_EXPLICIT', async () => {
  const f = fixture({ manifest: { snapshotId, counts: { movies: 0, series: 0, live: 0 }, segments: [] },
    catalog: { metadata: { snapshotId }, movies: [], series: [], categories: [] },
    live: { snapshotId, channels: [], groups: [] } });
  const result = await readCatalogReadDiagnostic(f.deps);
  assert.equal(result.state, 'READABLE'); assert.deepEqual(result.totals, { movies: 0, series: 0, live: 0 }); assert.equal(f.reads.length, 0);
  const absent = await readCatalogReadDiagnostic(fixture({ noPointer: true }).deps);
  assert.equal(absent.state, 'ABSENT'); assert.equal(absent.totals.movies, null);
});
await test('POINTER_FAILURE_AND_PATH_INJECTION_NEVER_BECOME_VALID_EMPTY', async () => {
  for (const overrides of [{ pointerError: true }, { badSnapshot: '../escape' }, { badSnapshot: privateValue }]) {
    const f = fixture(overrides); f.deps.readLiveHeader = async () => { throw Error('UNEXPECTED_READ'); };
    const result = await readCatalogReadDiagnostic(f.deps);
    assert.equal(result.state, 'UNAVAILABLE'); assert.equal(result.totals.movies, null); assert.equal(f.reads.length, 0);
  }
});
await test('MISSING_OR_MALFORMED_HEADER_IS_PARTIAL_AND_UNKNOWN', async () => {
  for (const overrides of [{ catalog: null }, { live: '{bad' }, { liveError: true }, { manifest: null }]) {
    const result = await readCatalogReadDiagnostic(fixture(overrides).deps);
    assert.equal(result.state, 'PARTIAL');
    if (overrides.catalog === null) assert.equal(result.firstFold.movies, null);
    if (overrides.manifest === null) assert.equal(result.totals.movies, null);
    assert.ok(!JSON.stringify(result).includes('PRIVATE_FIXTURE'));
  }
});
await test('SEGMENT_MISSING_INVALID_OVERSIZED_OR_TRAVERSAL_IS_NOT_READABLE', async () => {
  for (const [overrides, state] of [[{ raw: null }, 'MISSING'], [{ segmentError: true }, 'MISSING'], [{ raw: '{broken' }, 'INVALID'],
    [{ raw: '{}' }, 'INVALID'], [{ raw: ' '.repeat(4 * 1024 * 1024 + 1) }, 'OVERSIZED']]) {
    const result = await readCatalogReadDiagnostic(fixture(overrides).deps);
    assert.equal(result.state, 'PARTIAL'); assert.equal(result.samples.movies.state, state); assert.equal(result.samples.movies.records, null);
  }
  const f = fixture(); f.manifest.segments[0].fileName = '../' + privateValue;
  const result = await readCatalogReadDiagnostic(f.deps);
  assert.equal(result.samples.movies.state, 'INVALID'); assert.ok(!f.reads.some(p => p.includes('..')));
});
await test('GENERATION_CHANGE_DISCARDS_ALL_COUNTS_AND_IDENTITIES', async () => {
  for (const overrides of [{ changed: true }, { catalog: { metadata: { snapshotId: 'old' }, movies: [], series: [] } },
    { live: { snapshotId: 'old', channels: [], groups: [] } }]) {
    const result = await readCatalogReadDiagnostic(fixture(overrides).deps);
    assert.equal(result.state, 'GENERATION_CHANGED');
    assert.ok(Object.values(result.totals).every(n => n === null));
    assert.ok(Object.values(result.firstFold).every(n => n === null));
    assert.ok(Object.values(result.samples).every(s => s.records === null));
  }
});
await test('INVALID_COUNTS_REMAIN_UNKNOWN_AND_PARENTAL_ERRORS_REMAIN_BLOCKED', async () => {
  const f = fixture({ parental: 'error' }); f.manifest.counts = { movies: privateValue, series: -1, live: Number.MAX_SAFE_INTEGER + 1 };
  const result = await readCatalogReadDiagnostic(f.deps);
  assert.deepEqual(result.totals, { movies: null, series: null, live: null }); assert.equal(result.parental, 'error');
  assert.ok(!JSON.stringify(result).includes('PRIVATE_FIXTURE'));
  assert.equal((await readCatalogReadDiagnostic(fixture({ parental: privateValue }).deps)).parental, 'unknown');
});
await test('EXPLICIT_UI_ACTION_IS_SEPARATE_FROM_SOURCE_UPDATE_AND_NO_WRITE_NETWORK', async () => {
  const source = readFileSync(new URL('../src/ui/components/ActiveSourceSettings.tsx', import.meta.url), 'utf8');
  assert.match(source, /Verificar leitura local/); assert.match(source, /readCatalogReadDiagnostic\(\)/);
  assert.match(source, /if \(mounted.current\) setDiagnostic\(result\)/); assert.match(source, /setDiagnostic\(undefined\)/);
  const originalFetch = globalThis.fetch; let calls = 0; globalThis.fetch = () => { calls++; throw Error('NETWORK_FORBIDDEN'); };
  try { await readCatalogReadDiagnostic(fixture().deps); assert.equal(calls, 0); } finally { globalThis.fetch = originalFetch; }
  const diagnosticSource = readFileSync(new URL('../src/ui/settings/catalog-read-diagnostic.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(diagnosticSource, /writeFile|writeActive|promoteStaging|authorize\(|unlockAdult\(|sourceConfig|console\./);
});
console.log(`CATALOG_READ_DIAGNOSTIC=PASS tests=${passed}`);
