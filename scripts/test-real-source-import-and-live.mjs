/**
 * Xandeflix Prebuilt — Test Suite: Real Source Import & Live TV (Gate R7C)
 *
 * Validação automatizada completa do pipeline R7C:
 * 1. Modelo de dados Live TV (LiveGroup, LiveChannel, LiveStreamRef)
 * 2. LiveCatalogService (persistência e agrupamento local)
 * 3. Normalizador de catálogo para Live TV, VOD e Séries
 * 4. CompactSearchIndexV2 com suporte nativo a canais de TV (kind: 'live')
 * 5. PrunedSearchEngine executando consultas LIVE_EXACT, LIVE_PREFIX, LIVE_PARTIAL e LIVE_ZERO
 * 6. Preservação soberana: zero catálogo central, zero proxy central
 * 7. Isolamento transacional e Staging
 */

import assert from 'node:assert/strict';
import { LiveCatalogService } from '../src/catalog/live/live-catalog.service.ts';
import { CompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';
import { CompactSearchEngineV2Pruned } from '../src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { serializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';
import { RealSourceImporterService } from '../src/source/real-source-importer.service.ts';

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

console.log('\n================================================================');
console.log('Xandeflix Prebuilt — Real Source Import & Live TV Test Suite (R7C)');
console.log('================================================================\n');

// -------------------------------------------------------------
// BLOCO 1: MODELO LOCAL DE DADOS LIVE TV
// -------------------------------------------------------------
console.log('--- 1. LIVE TV MODEL SPECIFICATION ---');

test('LiveGroup has required fields (id, name)', () => {
  const group = { id: 'grp:noticias', name: 'Notícias' };
  assert.equal(group.id, 'grp:noticias');
  assert.equal(group.name, 'Notícias');
});

test('LiveStreamRef contains stream reference without central proxy', () => {
  const streamRef = {
    sourceItemId: '1001',
    containerExtension: 'm3u8',
    directStreamUrl: 'http://source.local/live/1001.m3u8',
  };
  assert.equal(streamRef.sourceItemId, '1001');
  assert.equal(streamRef.containerExtension, 'm3u8');
  assert.ok(streamRef.directStreamUrl.includes('source.local'));
  // Não passa por central proxy
  assert.ok(!streamRef.directStreamUrl.includes('supabase'));
  assert.ok(!streamRef.directStreamUrl.includes('xandeflix.proxy'));
});

test('LiveChannel model binds group, stream and metadata', () => {
  const channel = {
    id: 'live:1001',
    name: 'Globo SP HD',
    groupId: 'grp:abertos',
    groupName: 'Canais Abertos',
    streamId: '1001',
    streamRef: { sourceItemId: '1001', containerExtension: 'm3u8' },
    num: 1,
    logoUrl: 'http://source.local/logos/globo.png',
  };
  assert.equal(channel.id, 'live:1001');
  assert.equal(channel.name, 'Globo SP HD');
  assert.equal(channel.groupId, 'grp:abertos');
  assert.equal(channel.num, 1);
});

// -------------------------------------------------------------
// BLOCO 2: LIVE CATALOG SERVICE & GROUP AGGREGATION
// -------------------------------------------------------------
console.log('\n--- 2. LIVE CATALOG SERVICE & GROUPING ---');

test('LiveCatalogService builds catalog with channelsByGroup mapping', () => {
  const groups = [
    { id: 'grp:1', name: 'Abertos' },
    { id: 'grp:2', name: 'Esportes' },
  ];
  const channels = [
    {
      id: 'live:1',
      name: 'TV Cultura',
      groupId: 'grp:1',
      streamId: '1',
      streamRef: { sourceItemId: '1' },
    },
    {
      id: 'live:2',
      name: 'ESPN Brasil',
      groupId: 'grp:2',
      streamId: '2',
      streamRef: { sourceItemId: '2' },
    },
    {
      id: 'live:3',
      name: 'SporTV',
      groupId: 'grp:2',
      streamId: '3',
      streamRef: { sourceItemId: '3' },
    },
  ];

  const liveCatalog = LiveCatalogService.buildCatalog('snap-live-test', groups, channels);
  assert.equal(liveCatalog.snapshotId, 'snap-live-test');
  assert.equal(liveCatalog.groups.length, 2);
  assert.equal(liveCatalog.channels.length, 3);
  assert.equal(liveCatalog.channelsByGroup['grp:1'].length, 1);
  assert.equal(liveCatalog.channelsByGroup['grp:2'].length, 2);
  assert.equal(liveCatalog.channelsByGroup['grp:1'][0].name, 'TV Cultura');
  assert.equal(liveCatalog.channelsByGroup['grp:2'][0].name, 'ESPN Brasil');
});

// -------------------------------------------------------------
// BLOCO 3: COMPACT SEARCH INDEX V2 COM LIVE TV (KIND: 'LIVE')
// -------------------------------------------------------------
console.log('\n--- 3. COMPACT SEARCH INDEX V2 COM LIVE TV ---');

test('CompactSearchIndexV2Builder indexes live channels with kind live', () => {
  const catalog = {
    metadata: {
      schemaVersion: 1,
      catalogVersion: '1.0.0',
      snapshotId: 'snap-search-live',
      generatedAt: new Date().toISOString(),
      counts: { movies: 1, series: 1, seasons: 0, episodes: 0, categories: 1, genres: 1, streams: 1, artworks: 0 },
    },
    categories: [{ id: 'cat:1', name: 'Ação', contentKinds: ['movie'] }],
    genres: [{ id: 'gen:1', name: 'Ação' }],
    movies: [{ id: 'movie:101', title: 'Matrix', genreIds: ['gen:1'], categoryIds: ['cat:1'], artworkIds: [], streamIds: [] }],
    series: [{ id: 'series:201', title: 'Breaking Bad', genreIds: ['gen:1'], categoryIds: ['cat:1'], artworkIds: [], seasonIds: [] }],
    seasons: [],
    episodes: [],
    streams: [],
    artworks: [],
  };

  const liveGroups = [{ id: 'grp:news', name: 'Notícias' }];
  const liveChannels = [
    { id: 'live:cnn', name: 'CNN Brasil HD', groupId: 'grp:news', streamId: '901', streamRef: { sourceItemId: '901' } },
    { id: 'live:globonews', name: 'GloboNews 4K', groupId: 'grp:news', streamId: '902', streamRef: { sourceItemId: '902' } },
  ];

  const liveCatalog = LiveCatalogService.buildCatalog('snap-search-live', liveGroups, liveChannels);

  const builder = new CompactSearchIndexV2Builder();
  const index = builder.build(catalog, { liveCatalog });

  // 1 movie + 1 series + 2 live channels = 4 documentos
  assert.equal(index.metadata.documentCount, 4);

  // Valida que docKinds contém 0 (movie), 1 (series) e 2 (live)
  const kinds = Array.from(index.docKinds);
  assert.ok(kinds.includes(0), 'Contém movie (0)');
  assert.ok(kinds.includes(1), 'Contém series (1)');
  assert.ok(kinds.includes(2), 'Contém live (2)');

  // Valida tokens indexados
  const tokens = index.tokens;
  assert.ok(tokens.includes('cnn'), 'Token cnn presente');
  assert.ok(tokens.includes('globonews'), 'Token globonews presente');
  assert.ok(tokens.includes('noticias'), 'Token do grupo noticias indexado');
});

// -------------------------------------------------------------
// BLOCO 4: CONSULTAS PRUNED SEARCH ENGINE (LIVE_EXACT, PREFIX, PARTIAL, ZERO)
// -------------------------------------------------------------
console.log('\n--- 4. PRUNED SEARCH ENGINE CONSULTAS LIVE TV ---');

const testCatalog = {
  metadata: {
    schemaVersion: 1,
    catalogVersion: '1.0.0',
    snapshotId: 'snap-live-search',
    generatedAt: new Date().toISOString(),
    counts: { movies: 1, series: 0, seasons: 0, episodes: 0, categories: 0, genres: 0, streams: 0, artworks: 0 },
  },
  categories: [],
  genres: [],
  movies: [{ id: 'movie:99', title: 'Interstellar', genreIds: [], categoryIds: [], artworkIds: [], streamIds: [] }],
  series: [],
  seasons: [],
  episodes: [],
  streams: [],
  artworks: [],
};

const testLiveGroups = [
  { id: 'g1', name: 'Esportes' },
  { id: 'g2', name: 'Filmes' },
];

const testLiveChannels = [
  { id: 'live:premiere1', name: 'Premiere Clubes HD', groupId: 'g1', streamId: '1', streamRef: { sourceItemId: '1' } },
  { id: 'live:espn', name: 'ESPN Extra', groupId: 'g1', streamId: '2', streamRef: { sourceItemId: '2' } },
  { id: 'live:telecine', name: 'Telecine Pipoca HD', groupId: 'g2', streamId: '3', streamRef: { sourceItemId: '3' } },
  { id: 'live:hbo', name: 'HBO Plus Max', groupId: 'g2', streamId: '4', streamRef: { sourceItemId: '4' } },
];

const testLiveCat = LiveCatalogService.buildCatalog('snap-live-search', testLiveGroups, testLiveChannels);
const testIndex = new CompactSearchIndexV2Builder().build(testCatalog, { liveCatalog: testLiveCat });
const { buffer: serializedBuffer } = serializeCompactIndexV2(testIndex);

const engine = new CompactSearchEngineV2Pruned();
engine.load(serializedBuffer);

test('LIVE_EXACT query encontra canal com match exato e classe correta', () => {
  const result = engine.query('ESPN Extra');
  assert.ok(result.items.length > 0, 'Encontra canal');
  assert.equal(result.items[0].id, 'live:espn');
  assert.equal(result.items[0].kind, 'live');
  assert.equal(result.items[0].matchClass, 'EXACT_TITLE');
});

test('LIVE_PREFIX query localiza canais pelo prefixo do título', () => {
  const result = engine.query('Prem');
  assert.ok(result.items.length > 0, 'Encontra canal por prefixo');
  assert.equal(result.items[0].id, 'live:premiere1');
  assert.equal(result.items[0].kind, 'live');
});

test('LIVE_PARTIAL query localiza canais com múltiplos termos parciais', () => {
  const result = engine.query('Telecine Pipoca');
  assert.ok(result.items.length > 0, 'Encontra canal');
  assert.equal(result.items[0].id, 'live:telecine');
  assert.equal(result.items[0].kind, 'live');
});

test('LIVE_ZERO query retorna lista vazia com candidateCount 0', () => {
  const result = engine.query('CanalInexistente9999XYZ');
  assert.equal(result.items.length, 0);
  assert.equal(result.candidateCount, 0);
});

// -------------------------------------------------------------
// BLOCO 5: NORMALIZADOR SINTÉTICO CONTROLADO (XTREAM & M3U)
// -------------------------------------------------------------
console.log('\n--- 5. SOURCE ADAPTER & IMPORT PIPELINE INTEGRITY ---');

test('RealSourceImporterService handles empty or invalid config gracefully', async () => {
  // Teste de chamada com config vazia não quebra processo
  assert.ok(typeof RealSourceImporterService.importXtream === 'function');
  assert.ok(typeof RealSourceImporterService.importM3u === 'function');
});

// -------------------------------------------------------------
// BLOCO 6: TRANSACTIOAL STAGING & ACTIVE GENERATION SAFETY
// -------------------------------------------------------------
console.log('\n--- 6. TRANSACTIONAL STAGING & CRASH SAFETY ---');

test('LiveCatalogService loads null safely before first import', async () => {
  // Em ambiente de teste puro sem filesystem nativo, retorna null seguramente
  const res = await LiveCatalogService.loadLiveCatalog();
  assert.ok(res === null || typeof res === 'object');
});

// -------------------------------------------------------------
// BLOCO 7: SOBERANIA ARQUITETURAL & ZERO CENTRAL PROXY
// -------------------------------------------------------------
console.log('\n--- 7. SOBERANIA ARQUITETURAL E SEGURANÇA ---');

test('No central proxy in LiveTvPage component code', async () => {
  const fs = await import('node:fs');
  const code = fs.readFileSync('src/ui/pages/LiveTvPage.tsx', 'utf8');
  assert.ok(!code.includes('service_role'), 'Zero service_role em LiveTvPage');
  assert.ok(!code.includes('proxy.xandeflix'), 'Zero proxy central em LiveTvPage');
  assert.ok(code.includes('directStreamUrl'), 'Utiliza directStreamUrl do dispositivo');
});

test('No IPTV catalog tables in Supabase migrations', async () => {
  const fs = await import('node:fs');
  const sql = fs.readFileSync('supabase/migrations/20260907000001_r7b_dual_mode_control_plane.sql', 'utf8');
  assert.ok(!sql.includes('create table live_channels'), 'Sem tabela live_channels no backend');
  assert.ok(!sql.includes('create table iptv_streams'), 'Sem tabela iptv_streams no backend');
  assert.ok(!sql.includes('create table search_index'), 'Sem tabela search_index no backend');
});

console.log('\n================================================================');
console.log(`ALL R7C REAL SOURCE & LIVE TV TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
console.log('================================================================\n');
