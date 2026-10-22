import fs from 'node:fs';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const dir = 'tmp/c135-active-source';
fs.mkdirSync(dir, { recursive: true });
const result = await build({ entryPoints: ['src/catalog/adult-catalog-reader.ts'], bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'local-parental-and-presentation-ports', setup(b) {
    const ports = {
      'parental-control.store.ts': 'export const parentalControl={adultVisible:()=>globalThis.__readerAllowed,rule:key=>globalThis.__readerRules?.[key]}',
      'parental-content.ts': 'export const parentalCatalogMetadata=row=>({key:row.id,adult:row.adult===true})',
      'catalog-selectors.ts': 'export const movieToViewModel=(_,row)=>({...row,kind:"movie"}),seriesToViewModel=(_,row)=>({...row,kind:"series"})',
    };
    b.onResolve({ filter: /\.ts$/ }, a => ports[a.path.split('/').at(-1)] ? { path: a.path.split('/').at(-1), namespace: 'ports' } : undefined);
    b.onLoad({ filter: /.*/, namespace: 'ports' }, a => ({ contents: ports[a.path], loader: 'js' }));
  } }] });
const { AdultCatalogReader } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
globalThis.__readerAllowed = true;
const movies = Array.from({ length: 50 }, (_, n) => ({ id: 'm' + n, title: 'Synthetic adult ' + n, categoryIds: [], adult: true }));
const series = Array.from({ length: 4 }, (_, n) => ({ id: 's' + n, title: 'Synthetic series ' + n, categoryIds: [], adult: true }));
const model = { catalog: { metadata: { snapshotId: 'fixture' }, movies: [], series: [] } };
let failSeries = true, generation = 'fixture', abortDuringRead, lockDuringRead = false, changeDuringRead = false;
const reads = [];
const storage = { readActiveManifest: async () => ({ snapshotId: generation, segments: [{ kind: 'movies', fileName: 'segments/movies.json' }, { kind: 'series', fileName: 'segments/series.json' }] }),
  readActiveSegment: async file => {
    reads.push(file);
    if (file.includes('series') && failSeries) { failSeries = false; throw new Error('SYNTHETIC_READ_FAILURE'); }
    if (abortDuringRead) { abortDuringRead.abort(); abortDuringRead = undefined; }
    if (lockDuringRead) { globalThis.__readerAllowed = false; lockDuringRead = false; }
    if (changeDuringRead) { generation = 'other'; changeDuringRead = false; }
    return JSON.stringify(file.includes('movies') ? movies : series);
  } };
let tests = 0;
async function test(name, operation) { await operation(); tests++; console.log('PASS ' + name); }
const reader = new AdultCatalogReader(model, storage), signal = new AbortController().signal;
await test('SECOND_PHASE_FAILURE_RETRY_RETAINS_FIRST_PHASE_WITHOUT_OMISSION', async () => {
  const batches = [];
  for (let i = 0; i < 3; i++) { const page = await reader.loadNext(signal); batches.push(...page.items); }
  assert.equal(batches.length, 50); assert.equal(reads.filter(f => f.includes('series')).length, 0);
  await assert.rejects(reader.loadNext(signal), /SYNTHETIC_READ_FAILURE/);
  let more = true;
  while (more) { const page = await reader.loadNext(signal); batches.push(...page.items); more = page.hasMore; }
  assert.equal(batches.length, 54); assert.equal(new Set(batches.map(r => r.id)).size, 54);
  assert.deepEqual(batches.filter(r => r.kind === 'movie').map(r => r.id), movies.map(r => r.id));
  reader.dispose();
});
await test('ABORT_DOES_NOT_ADVANCE_CURSOR', async () => {
  const active = new AdultCatalogReader(model, storage), request = new AbortController(); abortDuringRead = request;
  await assert.rejects(active.loadNext(request.signal), /BLOCKED|CANCELLED/);
  const page = await active.loadNext(signal); assert.equal(page.items[0].id, 'm0'); assert.equal(page.items.length, 24); active.dispose();
});
await test('LOCK_AND_SNAPSHOT_CHANGE_PREVENT_READ', async () => {
  const active = new AdultCatalogReader(model, storage); globalThis.__readerAllowed = false;
  await assert.rejects(active.loadNext(signal), /BLOCKED/); globalThis.__readerAllowed = true; generation = 'other';
  await assert.rejects(active.loadNext(signal), /GENERATION_CHANGED/); active.dispose(); generation = 'fixture';
});
await test('LOCK_OR_GENERATION_CHANGE_DURING_IO_ROLLS_BACK', async () => {
  for (const cause of ['lock', 'generation']) {
    const active = new AdultCatalogReader(model, storage);
    lockDuringRead = cause === 'lock'; changeDuringRead = cause === 'generation';
    await assert.rejects(active.loadNext(signal), /BLOCKED|GENERATION_CHANGED/);
    globalThis.__readerAllowed = true; generation = 'fixture';
    assert.equal((await active.loadNext(signal)).items[0].id, 'm0'); active.dispose();
  }
});
await test('SPARSE_SCAN_BOUNDED_EMPTY_PARTIAL_PAGES_AND_MANUAL_RULE', async () => {
  let count = 0;
  const entries = Array.from({ length: 7501 }, (_, n) => ({ id: 'p' + n, title: 'Synthetic', categoryIds: [] }));
  globalThis.__readerRules = { p7500: { adult: true } };
  const sparse = { readActiveManifest: async () => ({ snapshotId: 'fixture', segments: Array.from({ length: 4 }, (_, n) => ({ kind: 'movies', fileName: `segments/movies-${n}.json` })) }),
    readActiveSegment: async file => { count++; const n = Number(file.match(/movies-(\d+)/)[1]); return JSON.stringify(entries.slice(n * 2500, (n + 1) * 2500)); } };
  const active = new AdultCatalogReader(model, sparse);
  const first = await active.loadNext(signal); assert.deepEqual(first.items, []); assert.equal(first.hasMore, true); assert.equal(count, 2);
  const second = await active.loadNext(signal); assert.equal(second.items[0].id, 'p7500'); assert.equal(count, 4);
  assert.equal((await active.loadNext(signal)).hasMore, false); active.dispose(); globalThis.__readerRules = {};
});
fs.writeFileSync(dir + '/adult-reader-tests.json', JSON.stringify({ result: 'PASS', tests, realSegmentedReader: true, syntheticOnly: true }, null, 2));
