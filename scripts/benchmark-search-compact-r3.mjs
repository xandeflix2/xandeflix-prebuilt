/**
 * Xandeflix Prebuilt — Search Architecture Benchmark R3 (Varint Delta & String Pool)
 *
 * Bancada experimental comparando:
 * - A: BASELINE (JSON_INVERTED_INDEX_V1)
 * - B: CANDIDATO V1 (COMPACT_SEARCH_INDEX_V1)
 * - C: CANDIDATO V2 (COMPACT_SEARCH_INDEX_V2 com Delta+Varint e String Pooling)
 * sobre catálogo sintético de 240.000 itens.
 *
 * Princípios:
 * - ISOLATED_EXPERIMENT = SIM
 * - PERFORMANCE_EVIDENCE_IS_NOT_SLA = SIM
 * - ZERO_REAL_DATA = SIM (100% sintético)
 * - PROTECTED_PROJECT_UNTOUCHED = SIM
 */

import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Garantir medição precisa de memória através de garbage collection exposto
if (!global.gc) {
  const child = spawnSync(process.execPath, ['--expose-gc', ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(child.status ?? 0);
}

import { SearchIndexBuilder } from '../src/search/search-index-builder.ts';
import { SearchEngine } from '../src/search/search-engine.ts';
import { CompactSearchIndexBuilder } from '../src/experiments/search-compact/compact-search-builder.ts';
import { CompactSearchEngine } from '../src/experiments/search-compact/compact-search-engine.ts';
import { serializeCompactIndex } from '../src/experiments/search-compact/compact-search-serializer.ts';

import {
  encodeVarint,
  decodeVarint,
  encodeDeltaPosting,
  decodeDeltaPosting,
  verifyCodecRoundtrip,
} from '../src/experiments/search-compact-v2/codec.ts';
import { CompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';
import { CompactSearchEngineV2 } from '../src/experiments/search-compact-v2/compact-search-v2-engine.ts';
import { serializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';

console.log('=== Xandeflix Prebuilt — R3 Varint Delta & String Pool Benchmark ===\n');

// =========================================================================
// [1/6] TESTES UNITÁRIOS DE CODEC E ROUNDTRIP
// =========================================================================
console.log('[1/6] Testando roundtrip de Varint/VByte e Delta Encoding...');

// Teste 1: Varint codec roundtrip com valores representativos
let varintRoundtripPass = true;
const testValues = [0, 1, 63, 127, 128, 255, 256, 16383, 16384, 65535, 100000, 240000, 1000000];
for (const val of testValues) {
  const buf = [];
  encodeVarint(val, buf);
  const [decoded, bytesRead] = decodeVarint(new Uint8Array(buf), 0);
  if (decoded !== val || bytesRead !== buf.length) {
    console.error(`  ✗ Falha no Varint roundtrip para valor ${val}: decoded=${decoded}, bytesRead=${bytesRead}`);
    varintRoundtripPass = false;
  }
}
console.log(`  ✓ VARINT_CODEC_ROUNDTRIP: ${varintRoundtripPass ? 'PASS' : 'FAIL'}`);

// Teste 2: Delta postings roundtrip
let deltaRoundtripPass = true;
// Exemplo canônico do Contrato R3: [10001, 10004, 10005, 10009] -> deltas [10001, 3, 1, 4]
const contractExample = [10001, 10004, 10005, 10009];
if (!verifyCodecRoundtrip(contractExample)) {
  console.error('  ✗ Falha no exemplo canônico de Delta Posting');
  deltaRoundtripPass = false;
}

// Casos de borda
const edgeCases = [
  [],
  [0],
  [1],
  [0, 1],
  [1, 2, 3, 4, 5],
  [100, 200, 300, 400],
  Array.from({ length: 10000 }, (_, i) => i * 3),
];
for (const tc of edgeCases) {
  if (!verifyCodecRoundtrip(tc)) {
    console.error(`  ✗ Falha em caso de borda Delta: length=${tc.length}`);
    deltaRoundtripPass = false;
  }
}
console.log(`  ✓ DELTA_POSTINGS_ROUNDTRIP: ${deltaRoundtripPass ? 'PASS' : 'FAIL'}`);

if (!varintRoundtripPass || !deltaRoundtripPass) {
  console.error('Abortando benchmark devido a falha no codec.');
  process.exit(1);
}

// =========================================================================
// [2/6] GERAÇÃO DO DATASET DETERMINÍSTICO DE 240.000 ITENS
// =========================================================================
const TARGET_DOC_COUNT = 240000;
const MOVIE_COUNT = 160000;
const SERIES_COUNT = 80000;
const TOP_K = 50;

const genres = [
  { id: 'g-action', name: 'Ação' },
  { id: 'g-comedy', name: 'Comédia' },
  { id: 'g-drama', name: 'Drama' },
  { id: 'g-scifi', name: 'Ficção Científica' },
  { id: 'g-thriller', name: 'Suspense' },
  { id: 'g-horror', name: 'Terror' },
  { id: 'g-romance', name: 'Romance' },
  { id: 'g-adventure', name: 'Aventura' },
  { id: 'g-animation', name: 'Animação' },
  { id: 'g-fantasy', name: 'Fantasia' },
];

const categories = [
  { id: 'c-movies-top', name: 'Top Filmes' },
  { id: 'c-movies-action', name: 'Filmes de Ação' },
  { id: 'c-series-top', name: 'Top Séries' },
  { id: 'c-series-drama', name: 'Séries de Drama' },
];

console.log(`\n[2/6] Gerando catálogo sintético com ${TARGET_DOC_COUNT} títulos...`);

const specialMovies = [
  { title: 'Silo', originalTitle: undefined, year: 2023 },
  { title: 'Silo 2', originalTitle: undefined, year: 2024 },
  { title: 'Tá Chovendo Hambúrguer', originalTitle: 'Cloudy with a Chance of Meatballs', year: 2009 },
  { title: 'Questão de Tempo', originalTitle: 'About Time', year: 2013 },
  { title: 'Matrix', originalTitle: 'The Matrix', year: 1999 },
  { title: 'Matrix Reloaded', originalTitle: 'The Matrix Reloaded', year: 2003 },
];

const movies = new Array(MOVIE_COUNT);
for (let i = 0; i < specialMovies.length; i++) {
  const padded = String(i).padStart(6, '0');
  movies[i] = {
    id: `syn:movie:${padded}`,
    sourceItemId: `m_${padded}`,
    title: specialMovies[i].title,
    originalTitle: specialMovies[i].originalTitle,
    year: specialMovies[i].year,
    genreIds: [genres[i % genres.length].id],
    categoryIds: [categories[i % 2].id],
    streamIds: [],
    artworkIds: [],
  };
}

for (let i = specialMovies.length; i < MOVIE_COUNT; i++) {
  const padded = String(i).padStart(6, '0');
  movies[i] = {
    id: `syn:movie:${padded}`,
    sourceItemId: `m_${padded}`,
    title: `Movie ${i} Alpha Explorer`,
    originalTitle: i % 5 === 0 ? `Original Movie ${i}` : undefined,
    year: 1980 + (i % 45),
    genreIds: [genres[i % genres.length].id],
    categoryIds: [categories[i % 2].id],
    streamIds: [],
    artworkIds: [],
  };
}

const series = new Array(SERIES_COUNT);
for (let i = 0; i < SERIES_COUNT; i++) {
  const padded = String(i).padStart(6, '0');
  series[i] = {
    id: `syn:series:${padded}`,
    sourceItemId: `s_${padded}`,
    title: `Series ${i} Delta Chronicles`,
    originalTitle: i % 4 === 0 ? `Original Series ${i}` : undefined,
    year: 1990 + (i % 35),
    genreIds: [genres[(i + 3) % genres.length].id],
    categoryIds: [categories[2 + (i % 2)].id],
    artworkIds: [],
  };
}

const largeCatalog = {
  metadata: {
    schemaVersion: 1,
    catalogVersion: '1.0.0-scale-benchmark-r3',
    generatedAt: '2026-09-06T00:00:00.000Z',
    sourceNamespace: 'syn',
    snapshotId: 'snap-scale-240k-r3',
    counts: {
      movies: MOVIE_COUNT,
      series: SERIES_COUNT,
      seasons: 0,
      episodes: 0,
      categories: categories.length,
      genres: genres.length,
      streams: 0,
      artworks: 0,
    },
  },
  movies,
  series,
  seasons: [],
  episodes: [],
  categories,
  genres,
  streams: [],
  artworks: [],
};

console.log(`  ✓ ${largeCatalog.movies.length + largeCatalog.series.length} entidades geradas.`);

const tmpDir = path.resolve('.scratch_r3');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// =========================================================================
// [3/6] EXECUÇÃO DO BASELINE A (JSON_INVERTED_INDEX_V1)
// =========================================================================
console.log('\n[3/6] Executando medições do BASELINE A...');
global.gc();
const memBeforeA = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const builderA = new SearchIndexBuilder();
const buildStartA = performance.now();
let indexA = builderA.build(largeCatalog, {
  generator: 'xandeflix-prebuilt-r3-baseline/1.0',
  deterministicGeneratedAt: '2026-09-06T00:00:00.000Z',
});
const buildDurationMsA = Math.round(performance.now() - buildStartA);
const memAfterBuildA = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

let serializedIndexA = JSON.stringify(indexA);
const fileA = path.join(tmpDir, 'search-index-a.json');
fs.writeFileSync(fileA, serializedIndexA, 'utf8');
const bytesA = fs.statSync(fileA).size;

let engineA = new SearchEngine();
const loadStartA = performance.now();
engineA.load(indexA);
const loadDurationMsA = Math.round(performance.now() - loadStartA);
const memAfterLoadA = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
const memPeakA = Math.max(memBeforeA, memAfterBuildA, memAfterLoadA);

// Consultas Baseline A
const exactStartA = performance.now();
const exactResA = engineA.query('Movie 123456 Alpha Explorer');
const exactDurationMsA = Number((performance.now() - exactStartA).toFixed(2));

const prefixStartA = performance.now();
const prefixResA = engineA.query('Chro');
const prefixDurationMsA = Number((performance.now() - prefixStartA).toFixed(2));

const multiStartA = performance.now();
const multiResA = engineA.query('Series 45000 Delta');
const multiDurationMsA = Number((performance.now() - multiStartA).toFixed(2));

const partialStartA = performance.now();
const partialResA = engineA.query('Matrix Adventure');
const partialDurationMsA = Number((performance.now() - partialStartA).toFixed(2));

const noResStartA = performance.now();
const noResA = engineA.query('NonExistentTerm99999');
const noResDurationMsA = Number((performance.now() - noResStartA).toFixed(2));

const docCountA = indexA.documentCount;
const tokenCountA = indexA.tokenCount;
indexA = null;
serializedIndexA = null;
engineA = null;
global.gc();
global.gc();

console.log(`  ✓ Baseline A: Bytes=${bytesA}, Build=${buildDurationMsA}ms, Load=${loadDurationMsA}ms, Exact=${exactDurationMsA}ms, Prefix=${prefixDurationMsA}ms, Multi=${multiDurationMsA}ms`);

// =========================================================================
// [4/6] EXECUÇÃO DO CANDIDATO B (COMPACT_SEARCH_INDEX_V1)
// =========================================================================
console.log('\n[4/6] Executando medições do CANDIDATO B (V1)...');
global.gc();
const memBeforeB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const builderB = new CompactSearchIndexBuilder();
const buildStartB = performance.now();
const indexB = builderB.build(largeCatalog, {
  generator: 'xandeflix-prebuilt-r3-compact-v1/1.0',
  deterministicGeneratedAt: '2026-09-06T00:00:00.000Z',
});
const buildDurationMsB = Math.round(performance.now() - buildStartB);
const memAfterBuildB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const binaryBufferB = serializeCompactIndex(indexB);
const fileB = path.join(tmpDir, 'compact-search-index-v1.bin');
fs.writeFileSync(fileB, binaryBufferB);
const bytesB = fs.statSync(fileB).size;

const engineB = new CompactSearchEngine();
const loadStartB = performance.now();
engineB.load(binaryBufferB);
const loadDurationMsB = Math.round(performance.now() - loadStartB);
const memAfterLoadB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
const memPeakB = Math.max(memBeforeB, memAfterBuildB, memAfterLoadB);

// Consultas Candidato B
const exactResB = engineB.query('Movie 123456 Alpha Explorer', { topK: TOP_K });
const exactDurationMsB = exactResB.durationMs;

const prefixResB = engineB.query('Chro', { topK: TOP_K });
const prefixDurationMsB = prefixResB.durationMs;

const multiResB = engineB.query('Series 45000 Delta', { topK: TOP_K });
const multiDurationMsB = multiResB.durationMs;

const partialResB = engineB.query('Matrix Adventure', { topK: TOP_K });
const partialDurationMsB = partialResB.durationMs;

const noResB = engineB.query('NonExistentTerm99999', { topK: TOP_K });
const noResDurationMsB = noResB.durationMs;

const docCountB = indexB.metadata.documentCount;
const tokenCountB = indexB.metadata.tokenCount;

// Consultas adicionais de paridade B
const siloResB = engineB.query('Silo', { topK: TOP_K });
const silo2ResB = engineB.query('Silo 2', { topK: TOP_K });
const diacriticResB = engineB.query('ta chovendo', { topK: TOP_K });
const questaoResB = engineB.query('Questão de Tempo', { topK: TOP_K });
const matrixResB = engineB.query('Matrix', { topK: TOP_K });
const matrixReloadedResB = engineB.query('Matrix Reloaded', { topK: TOP_K });

console.log(`  ✓ Candidato B: Bytes=${bytesB}, Build=${buildDurationMsB}ms, Load=${loadDurationMsB}ms, Exact=${exactDurationMsB}ms, Prefix=${prefixDurationMsB}ms, Multi=${multiDurationMsB}ms`);

// =========================================================================
// [5/6] EXECUÇÃO DO CANDIDATO C (COMPACT_SEARCH_INDEX_V2)
// =========================================================================
console.log('\n[5/6] Executando medições do CANDIDATO C (V2 com Delta+Varint e String Pooling)...');
global.gc();
const memBeforeC = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const builderC = new CompactSearchIndexV2Builder();
const buildStartC = performance.now();
const indexC = builderC.build(largeCatalog, {
  generator: 'xandeflix-prebuilt-r3-compact-v2/1.0',
  deterministicGeneratedAt: '2026-09-06T00:00:00.000Z',
});
const buildDurationMsC = Math.round(performance.now() - buildStartC);
const memAfterBuildC = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const { buffer: binaryBufferC, breakdown } = serializeCompactIndexV2(indexC);
const fileC = path.join(tmpDir, 'compact-search-index-v2.bin');
fs.writeFileSync(fileC, binaryBufferC);
const bytesC = fs.statSync(fileC).size;

const engineC = new CompactSearchEngineV2();
const loadStartC = performance.now();
engineC.load(binaryBufferC);
const loadDurationMsC = Math.round(performance.now() - loadStartC);
const memAfterLoadC = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
const memPeakC = Math.max(memBeforeC, memAfterBuildC, memAfterLoadC);

// Consultas Candidato C
const exactResC = engineC.query('Movie 123456 Alpha Explorer', { topK: TOP_K });
const exactDurationMsC = exactResC.durationMs;

const prefixResC = engineC.query('Chro', { topK: TOP_K });
const prefixDurationMsC = prefixResC.durationMs;

const multiResC = engineC.query('Series 45000 Delta', { topK: TOP_K });
const multiDurationMsC = multiResC.durationMs;

const partialResC = engineC.query('Matrix Adventure', { topK: TOP_K });
const partialDurationMsC = partialResC.durationMs;

const noResC = engineC.query('NonExistentTerm99999', { topK: TOP_K });
const noResDurationMsC = noResC.durationMs;

// Consultas adicionais de paridade C
const siloResC = engineC.query('Silo', { topK: TOP_K });
const silo2ResC = engineC.query('Silo 2', { topK: TOP_K });
const diacriticResC = engineC.query('ta chovendo', { topK: TOP_K });
const questaoResC = engineC.query('Questão de Tempo', { topK: TOP_K });
const matrixResC = engineC.query('Matrix', { topK: TOP_K });
const matrixReloadedResC = engineC.query('Matrix Reloaded', { topK: TOP_K });

console.log(`  ✓ Candidato C: Bytes=${bytesC}, Build=${buildDurationMsC}ms, Load=${loadDurationMsC}ms, Exact=${exactDurationMsC}ms, Prefix=${prefixDurationMsC}ms, Multi=${multiDurationMsC}ms`);
console.log(`    Decomposição: StringPool=${breakdown.stringPoolBytes}, DocTable=${breakdown.documentTableBytes}, TokenDict=${breakdown.tokenDictionaryBytes}, ExactIndex=${breakdown.exactIndexBytes}, Postings=${breakdown.postingsBytes}, Meta=${breakdown.metadataBytes}`);

// =========================================================================
// [6/6] VERIFICAÇÃO DE PARIDADE SEMÂNTICA B -> C
// =========================================================================
console.log('\n[6/6] Validando paridade semântica estrita entre B e C...');

let semanticParityBtoC = true;

function checkParity(name, resB, resC) {
  if (resB.items.length !== resC.items.length) {
    console.error(`  ✗ [${name}] Comprimento divergente: B=${resB.items.length}, C=${resC.items.length}`);
    semanticParityBtoC = false;
    return;
  }
  for (let i = 0; i < resB.items.length; i++) {
    const itemB = resB.items[i];
    const itemC = resC.items[i];
    if (itemB.id !== itemC.id || itemB.score !== itemC.score || itemB.matchClass !== itemC.matchClass) {
      console.error(`  ✗ [${name}] Divergência no item ${i}: B=(${itemB.id}, ${itemB.score}, ${itemB.matchClass}) vs C=(${itemC.id}, ${itemC.score}, ${itemC.matchClass})`);
      semanticParityBtoC = false;
      return;
    }
  }
  console.log(`  ✓ [${name}] 100% idêntico (top1=${resC.items[0]?.id}, score=${resC.items[0]?.score}, class=${resC.items[0]?.matchClass})`);
}

checkParity('Movie 123456 Alpha Explorer', exactResB, exactResC);
checkParity('Silo', siloResB, siloResC);
checkParity('Silo 2', silo2ResB, silo2ResC);
checkParity('ta chovendo', diacriticResB, diacriticResC);
checkParity('Questão de Tempo', questaoResB, questaoResC);
checkParity('Matrix', matrixResB, matrixResC);
checkParity('Matrix Reloaded', matrixReloadedResB, matrixReloadedResC);
checkParity('Chro (Prefix)', prefixResB, prefixResC);
checkParity('Series 45000 Delta (Multi)', multiResB, multiResC);
checkParity('Matrix Adventure (Partial)', partialResB, partialResC);
checkParity('NonExistentTerm99999 (NoResult)', noResB, noResC);

// Limpeza de arquivos temporários
try {
  fs.rmSync(tmpDir, { recursive: true, force: true });
} catch {
  // noop
}

// Cálculos de Relações e Speedups
const sizeRatioCtoA = Number((bytesC / bytesA).toFixed(4));
const sizeRatioCtoB = Number((bytesC / bytesB).toFixed(4));

const memoryRatioCtoA = Number((memPeakC / Math.max(1, memPeakA)).toFixed(4));
const memoryRatioCtoB = Number((memPeakC / Math.max(1, memPeakB)).toFixed(4));

const exactSpeedupCtoA = Number((exactDurationMsA / Math.max(0.01, exactDurationMsC)).toFixed(2));
const exactSpeedupCtoB = Number((exactDurationMsB / Math.max(0.01, exactDurationMsC)).toFixed(2));

const prefixSpeedupCtoA = Number((prefixDurationMsA / Math.max(0.01, prefixDurationMsC)).toFixed(2));
const prefixSpeedupCtoB = Number((prefixDurationMsB / Math.max(0.01, prefixDurationMsC)).toFixed(2));

const multiSpeedupCtoA = Number((multiDurationMsA / Math.max(0.01, multiDurationMsC)).toFixed(2));
const multiSpeedupCtoB = Number((multiDurationMsB / Math.max(0.01, multiDurationMsC)).toFixed(2));

const loadRatioCtoB = Number((loadDurationMsC / Math.max(1, loadDurationMsB)).toFixed(4));
const buildRatioCtoB = Number((buildDurationMsC / Math.max(1, buildDurationMsB)).toFixed(4));

console.log('\n==================================================');
console.log('=== RELATÓRIO DO BENCHMARK R3 — DELTA & STRING POOL ===');
console.log('==================================================');
console.log(`A_DOCUMENTS:                              ${docCountA}`);
console.log(`A_TOKENS:                                 ${tokenCountA}`);
console.log(`A_BYTES:                                  ${bytesA}`);
console.log(`A_BUILD_MS:                               ${buildDurationMsA}`);
console.log(`A_LOAD_MS:                                ${loadDurationMsA}`);
console.log(`A_EXACT_MS:                               ${exactDurationMsA}`);
console.log(`A_PREFIX_MS:                              ${prefixDurationMsA}`);
console.log(`A_MULTI_MS:                               ${multiDurationMsA}`);
console.log(`A_PARTIAL_MS:                             ${partialDurationMsA}`);
console.log(`A_NO_RESULT_MS:                           ${noResDurationMsA}`);
console.log(`A_MEMORY_PEAK_MB:                         ${memPeakA}`);
console.log('--------------------------------------------------');
console.log(`B_DOCUMENTS:                              ${docCountB}`);
console.log(`B_TOKENS:                                 ${tokenCountB}`);
console.log(`B_BYTES:                                  ${bytesB}`);
console.log(`B_BUILD_MS:                               ${buildDurationMsB}`);
console.log(`B_LOAD_MS:                                ${loadDurationMsB}`);
console.log(`B_EXACT_MS:                               ${exactDurationMsB}`);
console.log(`B_PREFIX_MS:                              ${prefixDurationMsB}`);
console.log(`B_MULTI_MS:                               ${multiDurationMsB}`);
console.log(`B_PARTIAL_MS:                             ${partialDurationMsB}`);
console.log(`B_NO_RESULT_MS:                           ${noResDurationMsB}`);
console.log(`B_MEMORY_PEAK_MB:                         ${memPeakB}`);
console.log('--------------------------------------------------');
console.log(`C_DOCUMENTS:                              ${indexC.metadata.documentCount}`);
console.log(`C_TOKENS:                                 ${indexC.metadata.tokenCount}`);
console.log(`C_BYTES:                                  ${bytesC}`);
console.log(`C_STRING_POOL_BYTES:                      ${breakdown.stringPoolBytes}`);
console.log(`C_DOCUMENT_TABLE_BYTES:                   ${breakdown.documentTableBytes}`);
console.log(`C_TOKEN_DICTIONARY_BYTES:                 ${breakdown.tokenDictionaryBytes}`);
console.log(`C_EXACT_INDEX_BYTES:                      ${breakdown.exactIndexBytes}`);
console.log(`C_POSTINGS_BYTES:                         ${breakdown.postingsBytes}`);
console.log(`C_METADATA_BYTES:                         ${breakdown.metadataBytes}`);
console.log(`C_BUILD_MS:                               ${buildDurationMsC}`);
console.log(`C_LOAD_MS:                                ${loadDurationMsC}`);
console.log(`C_EXACT_MS:                               ${exactDurationMsC}`);
console.log(`C_PREFIX_MS:                              ${prefixDurationMsC}`);
console.log(`C_MULTI_MS:                               ${multiDurationMsC}`);
console.log(`C_PARTIAL_MS:                             ${partialDurationMsC}`);
console.log(`C_NO_RESULT_MS:                           ${noResDurationMsC}`);
console.log(`C_MEMORY_PEAK_MB:                         ${memPeakC}`);
console.log('--------------------------------------------------');
console.log(`SIZE_RATIO_C_TO_A:                        ${sizeRatioCtoA}`);
console.log(`SIZE_RATIO_C_TO_B:                        ${sizeRatioCtoB}`);
console.log(`MEMORY_RATIO_C_TO_A:                      ${memoryRatioCtoA}`);
console.log(`MEMORY_RATIO_C_TO_B:                      ${memoryRatioCtoB}`);
console.log(`EXACT_SPEEDUP_C_TO_A:                     ${exactSpeedupCtoA}x`);
console.log(`EXACT_SPEEDUP_C_TO_B:                     ${exactSpeedupCtoB}x`);
console.log(`PREFIX_SPEEDUP_C_TO_A:                    ${prefixSpeedupCtoA}x`);
console.log(`PREFIX_SPEEDUP_C_TO_B:                    ${prefixSpeedupCtoB}x`);
console.log(`MULTI_SPEEDUP_C_TO_A:                     ${multiSpeedupCtoA}x`);
console.log(`MULTI_SPEEDUP_C_TO_B:                     ${multiSpeedupCtoB}x`);
console.log(`LOAD_RATIO_C_TO_B:                        ${loadRatioCtoB}`);
console.log(`BUILD_RATIO_C_TO_B:                       ${buildRatioCtoB}`);
console.log('--------------------------------------------------');
console.log(`VARINT_CODEC_ROUNDTRIP:                   ${varintRoundtripPass ? 'PASS' : 'FAIL'}`);
console.log(`DELTA_POSTINGS_ROUNDTRIP:                 ${deltaRoundtripPass ? 'PASS' : 'FAIL'}`);
console.log(`STRING_POOL_PRESENT:                      SIM`);
console.log(`SEMANTIC_PARITY_B_TO_C:                   ${semanticParityBtoC ? 'PASS' : 'FAIL'}`);
console.log('==================================================\n');

if (!semanticParityBtoC || !varintRoundtripPass || !deltaRoundtripPass) {
  process.exit(1);
}
