/**
 * Xandeflix Prebuilt — Search Architecture Benchmark R2 (Compact Representation)
 *
 * Bancada experimental paralela e isolada para avaliação de:
 * BASELINE A (JSON_INVERTED_INDEX_V1) vs CANDIDATO B (COMPACT_SEARCH_INDEX_V1)
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

console.log('=== Xandeflix Prebuilt — R2 Compact Search Architecture Benchmark ===\n');

const TARGET_DOC_COUNT = 240000;
const MOVIE_COUNT = 160000;
const SERIES_COUNT = 80000;
const TOP_K = 50;

// Gêneros e Categorias sintéticos padronizados
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

console.log(`[1/4] Gerando catálogo sintético controlado com ${TARGET_DOC_COUNT} títulos...`);

// Títulos específicos não-patológicos conforme Seção 10
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
    catalogVersion: '1.0.0-scale-benchmark-r2',
    generatedAt: '2026-09-06T00:00:00.000Z',
    sourceNamespace: 'syn',
    snapshotId: 'snap-scale-240k-r2',
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

// =========================================================================
// [2/4] BASELINE A — CANONICAL_JSON_INVERTED_INDEX_V1
// =========================================================================
console.log('\n[2/4] Executando medições do BASELINE A (JSON_INVERTED_INDEX_V1)...');
global.gc();
const memBeforeA = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const builderA = new SearchIndexBuilder();
const buildStartA = performance.now();
let indexA = builderA.build(largeCatalog, {
  generator: 'xandeflix-prebuilt-r2-baseline/1.0',
  deterministicGeneratedAt: '2026-09-06T00:00:00.000Z',
});
const buildDurationMsA = Math.round(performance.now() - buildStartA);
const memAfterBuildA = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

let serializedIndexA = JSON.stringify(indexA);
const serializedSizeBytesA = Buffer.byteLength(serializedIndexA, 'utf8');

const tmpDir = path.resolve('.scratch_r2');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
const fileA = path.join(tmpDir, 'search-index.json');
fs.writeFileSync(fileA, serializedIndexA, 'utf8');
const physicalArtifactBytesA = fs.statSync(fileA).size;

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
const exactCandidatesA = exactResA.length;

const prefixStartA = performance.now();
const prefixResA = engineA.query('Chro');
const prefixDurationMsA = Number((performance.now() - prefixStartA).toFixed(2));
const prefixCandidatesA = prefixResA.length;

const multiStartA = performance.now();
const multiResA = engineA.query('Series 45000 Delta');
const multiDurationMsA = Number((performance.now() - multiStartA).toFixed(2));
const multiCandidatesA = multiResA.length;

const partialStartA = performance.now();
const partialResA = engineA.query('Matrix Adventure');
const partialDurationMsA = Number((performance.now() - partialStartA).toFixed(2));
const partialCandidatesA = partialResA.length;

const noResStartA = performance.now();
const noResA = engineA.query('NonExistentTerm99999');
const noResDurationMsA = Number((performance.now() - noResStartA).toFixed(2));
const noResCandidatesA = noResA.length;

// Consultas adicionais de paridade
const siloResA = engineA.query('Silo');
const diacriticResA = engineA.query('ta chovendo');

console.log(`  ✓ Baseline A construído em ${buildDurationMsA} ms | Serializado: ${(serializedSizeBytesA / 1024 / 1024).toFixed(2)} MB`);
console.log(`  ✓ Baseline A consultas: Exact=${exactDurationMsA}ms (${exactCandidatesA} cands), Prefix=${prefixDurationMsA}ms (${prefixCandidatesA} cands), Multi=${multiDurationMsA}ms (${multiCandidatesA} cands), Partial=${partialDurationMsA}ms (${partialCandidatesA} cands), NoRes=${noResDurationMsA}ms`);

// Limpar memória de Baseline A antes de medir Candidato B
const docCountA = indexA.documentCount;
const tokenCountA = indexA.tokenCount;
indexA = null;
serializedIndexA = null;
engineA = null;
global.gc();
global.gc();

// =========================================================================
// [3/4] CANDIDATO B — COMPACT_SEARCH_INDEX_V1
// =========================================================================
console.log('\n[3/4] Executando medições do CANDIDATO B (COMPACT_SEARCH_INDEX_V1)...');
const memBeforeB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const builderB = new CompactSearchIndexBuilder();
const buildStartB = performance.now();
const indexB = builderB.build(largeCatalog, {
  generator: 'xandeflix-prebuilt-r2-compact/1.0',
  deterministicGeneratedAt: '2026-09-06T00:00:00.000Z',
});
const buildDurationMsB = Math.round(performance.now() - buildStartB);
const memAfterBuildB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const binaryBufferB = serializeCompactIndex(indexB);
const logicalSizeBytesB = binaryBufferB.length;

const fileB = path.join(tmpDir, 'compact-search-index.bin');
fs.writeFileSync(fileB, binaryBufferB);
const physicalArtifactBytesB = fs.statSync(fileB).size;

const engineB = new CompactSearchEngine();
const loadStartB = performance.now();
engineB.load(binaryBufferB);
const loadDurationMsB = Math.round(performance.now() - loadStartB);
const memAfterLoadB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
const memPeakB = Math.max(memBeforeB, memAfterBuildB, memAfterLoadB);

// Consultas Candidato B com bounded TOP_K = 50
const exactResB = engineB.query('Movie 123456 Alpha Explorer', { topK: TOP_K });
const exactDurationMsB = exactResB.durationMs;
const exactCandidatesB = exactResB.candidateCount;

const prefixResB = engineB.query('Chro', { topK: TOP_K });
const prefixDurationMsB = prefixResB.durationMs;
const prefixCandidatesB = prefixResB.candidateCount;

const multiResB = engineB.query('Series 45000 Delta', { topK: TOP_K });
const multiDurationMsB = multiResB.durationMs;
const multiCandidatesB = multiResB.candidateCount;

const partialResB = engineB.query('Matrix Adventure', { topK: TOP_K });
const partialDurationMsB = partialResB.durationMs;
const partialCandidatesB = partialResB.candidateCount;

const noResB = engineB.query('NonExistentTerm99999', { topK: TOP_K });
const noResDurationMsB = noResB.durationMs;
const noResCandidatesB = noResB.candidateCount;

// Consultas adicionais de paridade
const siloResB = engineB.query('Silo', { topK: TOP_K });
const diacriticResB = engineB.query('ta chovendo', { topK: TOP_K });

console.log(`  ✓ Candidato B construído em ${buildDurationMsB} ms | Serializado: ${(physicalArtifactBytesB / 1024 / 1024).toFixed(2)} MB`);
console.log(`  ✓ Candidato B consultas: Exact=${exactDurationMsB}ms (${exactCandidatesB} cands), Prefix=${prefixDurationMsB}ms (${prefixCandidatesB} cands), Multi=${multiDurationMsB}ms (${multiCandidatesB} cands), Partial=${partialDurationMsB}ms (${partialCandidatesB} cands), NoRes=${noResDurationMsB}ms`);

// =========================================================================
// [4/4] AVALIAÇÃO DE PARIDADE SEMÂNTICA E INTEGRIDADE
// =========================================================================
console.log('\n[4/4] Verificando paridade semântica e casos não-patológicos...');

let semanticParity = true;

// 1. Exact Match
if (
  exactResA[0]?.id !== exactResB.items[0]?.id ||
  exactResA[0]?.score !== exactResB.items[0]?.score ||
  exactResB.items[0]?.matchClass !== 'EXACT_TITLE'
) {
  console.error(`  ✗ Falha na paridade de Exact: A=${exactResA[0]?.id} (${exactResA[0]?.score}) B=${exactResB.items[0]?.id} (${exactResB.items[0]?.score})`);
  semanticParity = false;
} else {
  console.log(`  ✓ Paridade de Exact Query: aprovada (id=${exactResB.items[0]?.id}, score=${exactResB.items[0]?.score}, class=${exactResB.items[0]?.matchClass})`);
}

// 2. Silo
if (
  siloResA[0]?.id !== siloResB.items[0]?.id ||
  siloResA[0]?.score !== siloResB.items[0]?.score ||
  siloResB.items[0]?.matchClass !== 'EXACT_TITLE'
) {
  console.error(`  ✗ Falha em Silo exact match: A=${siloResA[0]?.id} B=${siloResB.items[0]?.id}`);
  semanticParity = false;
} else {
  console.log(`  ✓ Silo exact query: aprovada (id=${siloResB.items[0]?.id}, score=${siloResB.items[0]?.score})`);
}

// 3. Normalização de Diacríticos
if (
  diacriticResA[0]?.id !== diacriticResB.items[0]?.id ||
  diacriticResA[0]?.score !== diacriticResB.items[0]?.score ||
  diacriticResA[0]?.matchClass !== diacriticResB.items[0]?.matchClass
) {
  console.error(`  ✗ Falha em normalização de acentos: A=${diacriticResA[0]?.id} B=${diacriticResB.items[0]?.id}`);
  semanticParity = false;
} else {
  console.log(`  ✓ Normalização de acentos ("ta chovendo"): aprovada (id=${diacriticResB.items[0]?.id}, score=${diacriticResB.items[0]?.score}, class=${diacriticResB.items[0]?.matchClass})`);
}

// 4. Prefix Query
if (
  prefixResA[0]?.id !== prefixResB.items[0]?.id ||
  prefixResA[0]?.score !== prefixResB.items[0]?.score ||
  prefixResA[0]?.matchClass !== prefixResB.items[0]?.matchClass
) {
  console.error(`  ✗ Falha em Prefix query ("Chro"): A=${prefixResA[0]?.id} B=${prefixResB.items[0]?.id}`);
  semanticParity = false;
} else {
  console.log(`  ✓ Prefix query ("Chro"): aprovada (id=${prefixResB.items[0]?.id}, score=${prefixResB.items[0]?.score}, class=${prefixResB.items[0]?.matchClass})`);
}

// 5. Multi-token Query
if (
  multiResA[0]?.id !== multiResB.items[0]?.id ||
  multiResA[0]?.score !== multiResB.items[0]?.score ||
  multiResA[0]?.matchClass !== multiResB.items[0]?.matchClass
) {
  console.error(`  ✗ Falha em Multi-token match: A=${multiResA[0]?.id} B=${multiResB.items[0]?.id}`);
  semanticParity = false;
} else {
  console.log(`  ✓ Multi-token query ("Series 45000 Delta"): aprovada (id=${multiResB.items[0]?.id}, score=${multiResB.items[0]?.score}, class=${multiResB.items[0]?.matchClass})`);
}

// 6. Partial Token Query
if (
  partialResA[0]?.id !== partialResB.items[0]?.id ||
  partialResA[0]?.score !== partialResB.items[0]?.score ||
  partialResA[0]?.matchClass !== 'PARTIAL' ||
  partialResB.items[0]?.matchClass !== 'PARTIAL'
) {
  console.error(`  ✗ Falha em Partial token match: A=${partialResA[0]?.id} B=${partialResB.items[0]?.id}`);
  semanticParity = false;
} else {
  console.log(`  ✓ Partial token query ("Matrix Adventure"): aprovada (id=${partialResB.items[0]?.id}, score=${partialResB.items[0]?.score}, class=${partialResB.items[0]?.matchClass})`);
}

// 7. No-result
if (noResA.length !== 0 || noResB.items.length !== 0) {
  console.error('  ✗ Falha em No-result query');
  semanticParity = false;
} else {
  console.log('  ✓ No-result query: aprovada (0 resultados em ambos)');
}

// Limpeza de arquivos temporários de teste
try {
  fs.rmSync(tmpDir, { recursive: true, force: true });
} catch {
  // noop
}

// Cálculos de Relações e Speedups
const sizeRatio = Number((physicalArtifactBytesB / physicalArtifactBytesA).toFixed(4));
const loadRatio = Number((loadDurationMsB / Math.max(1, loadDurationMsA)).toFixed(4));
const exactSpeedup = Number((exactDurationMsA / Math.max(0.01, exactDurationMsB)).toFixed(2));
const prefixSpeedup = Number((prefixDurationMsA / Math.max(0.01, prefixDurationMsB)).toFixed(2));
const multiSpeedup = Number((multiDurationMsA / Math.max(0.01, multiDurationMsB)).toFixed(2));
const noResultSpeedup = Number((noResDurationMsA / Math.max(0.01, noResDurationMsB)).toFixed(2));
const memoryRatio = Number((memPeakB / Math.max(1, memPeakA)).toFixed(4));

// Estimativas de Storage Teórico (Seção 12)
const singleGenA = physicalArtifactBytesA;
const singleGenB = physicalArtifactBytesB;
const activeStagingA = singleGenA * 2;
const activeStagingB = singleGenB * 2;
const activePrevStagingA = singleGenA * 3;
const activePrevStagingB = singleGenB * 3;

console.log('\n==================================================');
console.log('=== RELATÓRIO DO BENCHMARK R2 — COMPACT SEARCH ===');
console.log('==================================================');
console.log(`BASELINE_A_DOCUMENTS:                     ${docCountA}`);
console.log(`BASELINE_A_TOKENS:                        ${tokenCountA}`);
console.log(`BASELINE_A_BUILD_MS:                      ${buildDurationMsA}`);
console.log(`BASELINE_A_BYTES:                         ${physicalArtifactBytesA}`);
console.log(`BASELINE_A_LOAD_MS:                       ${loadDurationMsA}`);
console.log(`BASELINE_A_EXACT_MS:                      ${exactDurationMsA}`);
console.log(`BASELINE_A_PREFIX_MS:                     ${prefixDurationMsA}`);
console.log(`BASELINE_A_MULTI_MS:                      ${multiDurationMsA}`);
console.log(`BASELINE_A_PARTIAL_MS:                    ${partialDurationMsA}`);
console.log(`BASELINE_A_NO_RESULT_MS:                  ${noResDurationMsA}`);
console.log(`BASELINE_A_MEMORY_PEAK_MB:                ${memPeakA}`);
console.log(`BASELINE_A_EXACT_CANDIDATES:              ${exactCandidatesA}`);
console.log(`BASELINE_A_PREFIX_CANDIDATES:             ${prefixCandidatesA}`);
console.log(`BASELINE_A_MULTI_CANDIDATES:              ${multiCandidatesA}`);
console.log(`BASELINE_A_PARTIAL_CANDIDATES:            ${partialCandidatesA}`);
console.log(`BASELINE_A_NO_RESULT_CANDIDATES:          ${noResCandidatesA}`);
console.log('--------------------------------------------------');
console.log(`CANDIDATE_B_DOCUMENTS:                    ${indexB.metadata.documentCount}`);
console.log(`CANDIDATE_B_TOKENS:                       ${indexB.metadata.tokenCount}`);
console.log(`CANDIDATE_B_BUILD_MS:                     ${buildDurationMsB}`);
console.log(`CANDIDATE_B_BYTES:                        ${physicalArtifactBytesB}`);
console.log(`CANDIDATE_B_LOAD_MS:                      ${loadDurationMsB}`);
console.log(`CANDIDATE_B_EXACT_MS:                     ${exactDurationMsB}`);
console.log(`CANDIDATE_B_PREFIX_MS:                    ${prefixDurationMsB}`);
console.log(`CANDIDATE_B_MULTI_MS:                     ${multiDurationMsB}`);
console.log(`CANDIDATE_B_PARTIAL_MS:                   ${partialDurationMsB}`);
console.log(`CANDIDATE_B_NO_RESULT_MS:                 ${noResDurationMsB}`);
console.log(`CANDIDATE_B_MEMORY_PEAK_MB:               ${memPeakB}`);
console.log(`CANDIDATE_B_EXACT_CANDIDATES:             ${exactCandidatesB}`);
console.log(`CANDIDATE_B_PREFIX_CANDIDATES:            ${prefixCandidatesB}`);
console.log(`CANDIDATE_B_MULTI_CANDIDATES:             ${multiCandidatesB}`);
console.log(`CANDIDATE_B_PARTIAL_CANDIDATES:           ${partialCandidatesB}`);
console.log(`CANDIDATE_B_NO_RESULT_CANDIDATES:         ${noResCandidatesB}`);
console.log(`CANDIDATE_B_TOP_K:                        ${TOP_K}`);
console.log('--------------------------------------------------');
console.log(`SIZE_RATIO_B_TO_A:                        ${sizeRatio}`);
console.log(`LOAD_RATIO_B_TO_A:                        ${loadRatio}`);
console.log(`EXACT_SPEEDUP:                            ${exactSpeedup}x`);
console.log(`PREFIX_SPEEDUP:                           ${prefixSpeedup}x`);
console.log(`MULTI_SPEEDUP:                            ${multiSpeedup}x`);
console.log(`NO_RESULT_SPEEDUP:                        ${noResultSpeedup}x`);
console.log(`MEMORY_RATIO_B_TO_A:                      ${memoryRatio}`);
console.log('--------------------------------------------------');
console.log(`SINGLE_GENERATION_BYTES_A:                ${singleGenA}`);
console.log(`SINGLE_GENERATION_BYTES_B:                ${singleGenB}`);
console.log(`ACTIVE_PLUS_STAGING_BYTES_A:              ${activeStagingA}`);
console.log(`ACTIVE_PLUS_STAGING_BYTES_B:              ${activeStagingB}`);
console.log(`ACTIVE_PLUS_PREVIOUS_PLUS_STAGING_BYTES_A: ${activePrevStagingA}`);
console.log(`ACTIVE_PLUS_PREVIOUS_PLUS_STAGING_BYTES_B: ${activePrevStagingB}`);
console.log('--------------------------------------------------');
console.log(`SEMANTIC_PARITY:                          ${semanticParity ? 'PASS' : 'FAIL'}`);
console.log('==================================================\n');

if (!semanticParity) {
  process.exit(1);
}
