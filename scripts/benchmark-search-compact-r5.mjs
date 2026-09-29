/**
 * Xandeflix Prebuilt — R5 Early Termination & Top-K Pruning Benchmark
 *
 * Compara rigorosamente:
 * Candidato C: CompactSearchEngineV2 (Full Candidate Scoring)
 * Candidato D: CompactSearchEngineV2Pruned (Tiered Processing + Upper Bound Pruning + Min-Heap)
 *
 * Princípios:
 * - EXACT_PARITY_REQUIRED: top-K set and ordering must be 100% identical.
 * - METRICS: Query latency, raw candidates, scored candidates, pruned percent, speedup.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompactSearchEngineV2 } from '../src/experiments/search-compact-v2/compact-search-v2-engine.ts';
import { CompactSearchEngineV2Pruned } from '../src/experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { CompactSearchIndexV2Builder } from '../src/experiments/search-compact-v2/compact-search-v2-builder.ts';
import { serializeCompactIndexV2 } from '../src/experiments/search-compact-v2/compact-search-v2-serializer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TMP_DIR = path.join(ROOT_DIR, 'tmp');
const ARTIFACT_PATH = path.join(TMP_DIR, 'compact-search-index-v2.bin');

const TARGET_DOC_COUNT = 240000;
const MOVIE_COUNT = 160000;
const SERIES_COUNT = 80000;
const TOP_K = 50;

console.log('=== Xandeflix Prebuilt — R5 Early Termination & Top-K Pruning Benchmark ===\n');

// 1. Obter ou gerar artefato binário V2 240k
let binaryBuffer;
if (fs.existsSync(ARTIFACT_PATH) && fs.statSync(ARTIFACT_PATH).size >= 32000000) {
  console.log(`[1/5] Reutilizando artefato existente: ${ARTIFACT_PATH} (${fs.statSync(ARTIFACT_PATH).size} bytes)`);
  binaryBuffer = fs.readFileSync(ARTIFACT_PATH);
} else {
  console.log(`[1/5] Construindo catálogo sintético determinístico com ${TARGET_DOC_COUNT} títulos...`);
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  const genres = [
    { id: 'g-action', name: 'Ação' },
    { id: 'g-comedy', name: 'Comédia' },
    { id: 'g-drama', name: 'Drama' },
    { id: 'g-scifi', name: 'Ficção Científica' },
    { id: 'g-romance', name: 'Romance' },
  ];
  const categories = [
    { id: 'c-movies-top', name: 'Top Filmes' },
    { id: 'c-movies-action', name: 'Filmes de Ação' },
    { id: 'c-series-top', name: 'Top Séries' },
    { id: 'c-series-drama', name: 'Séries de Drama' },
  ];

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

  const catalog = {
    metadata: {
      schemaVersion: 1,
      catalogVersion: '1.0.0-scale-benchmark-r5',
      generatedAt: '2026-09-06T00:00:00.000Z',
      sourceNamespace: 'syn',
      snapshotId: 'snap-scale-240k-r5',
      counts: {
        movies: MOVIE_COUNT,
        series: SERIES_COUNT,
        seasons: 0,
        episodes: 0,
        categories: categories.length,
        genres: genres.length,
        streams: 0,
      },
    },
    categories,
    genres,
    movies,
    series,
  };

  const builder = new CompactSearchIndexV2Builder();
  const index = builder.build(catalog, {
    generator: 'xandeflix-prebuilt-r5-compact-v2/1.0',
    deterministicGeneratedAt: '2026-09-06T00:00:00.000Z',
  });
  const serialized = serializeCompactIndexV2(index);
  binaryBuffer = serialized.buffer;
  fs.writeFileSync(ARTIFACT_PATH, binaryBuffer);
  console.log(`  ✓ Artefato gerado e salvo: ${binaryBuffer.length} bytes`);
}

// 2. Inicializar ambos os engines com o mesmo artefato
console.log('\n[2/5] Carregando índices nos motores C (Full) e D (Pruned)...');
const engineC = new CompactSearchEngineV2();
engineC.load(binaryBuffer);

const engineD = new CompactSearchEngineV2Pruned();
engineD.load(binaryBuffer);

console.log('  ✓ Ambos os motores inicializados e prontos.');

// 3. Funções de medição
function measureC(queryStr) {
  // 1 warmup
  engineC.query(queryStr, { topK: TOP_K });

  // 5 execuções medidas
  const times = [];
  let res;
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    res = engineC.query(queryStr, { topK: TOP_K });
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const medianMs = Number(times[2].toFixed(2));
  return {
    medianMs,
    candidateCount: res.candidateCount,
    scoredCount: res.candidateCount,
    items: res.items,
  };
}

function measureD(queryStr) {
  // 1 warmup
  engineD.query(queryStr, { topK: TOP_K });

  // 5 execuções medidas
  const times = [];
  let res;
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    res = engineD.query(queryStr, { topK: TOP_K });
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const medianMs = Number(times[2].toFixed(2));
  return {
    medianMs,
    rawCandidateCount: res.rawCandidateCount,
    scoredCandidateCount: res.scoredCandidateCount,
    prunedCandidateCount: res.prunedCandidateCount,
    items: res.items,
    earlyTerminated: res.earlyTerminated,
    terminationTier: res.terminationTier,
  };
}

function compareResults(itemsC, itemsD) {
  if (itemsC.length !== itemsD.length) {
    return { setMatch: false, orderMatch: false, reason: `Length mismatch: C=${itemsC.length}, D=${itemsD.length}` };
  }

  // Set match
  const setC = new Set(itemsC.map((it) => it.id));
  const setD = new Set(itemsD.map((it) => it.id));
  for (const id of setC) {
    if (!setD.has(id)) {
      return { setMatch: false, orderMatch: false, reason: `ID ${id} present in C but missing in D` };
    }
  }

  // Order match
  for (let i = 0; i < itemsC.length; i++) {
    const c = itemsC[i];
    const d = itemsD[i];
    if (c.id !== d.id || c.score !== d.score || c.matchClass !== d.matchClass) {
      return {
        setMatch: true,
        orderMatch: false,
        reason: `Item ${i} mismatch: C=(${c.id}, score=${c.score}, class=${c.matchClass}) vs D=(${d.id}, score=${d.score}, class=${d.matchClass})`,
      };
    }
  }

  return { setMatch: true, orderMatch: true };
}

// 4. Bateria de Testes Comparativos
console.log('\n[3/5] Executando queries de caracterização C vs D...');

const queriesToTest = [
  { name: 'EXACT_TITLE', q: 'Movie 123456 Alpha Explorer' },
  { name: 'PREFIX_HIGH_CARD', q: 'Chro' },
  { name: 'MULTI_HIGH_CARD', q: 'Series 45000 Delta' },
  { name: 'PARTIAL', q: 'Matrix Adventure' },
  { name: 'NO_RESULT', q: 'NonExistentTerm99999' },
  { name: 'PARITY_SILO', q: 'Silo' },
  { name: 'PARITY_SILO2', q: 'Silo 2' },
  { name: 'PARITY_TA_CHOVENDO', q: 'ta chovendo' },
  { name: 'PARITY_QUESTAO', q: 'Questão de Tempo' },
  { name: 'PARITY_MATRIX', q: 'Matrix' },
  { name: 'PARITY_MATRIX_RELOADED', q: 'Matrix Reloaded' },
  { name: 'PREFIX_LOW_CARD', q: 'Silo' },
  { name: 'PREFIX_MED_CARD', q: 'Mat' },
];

let allParityPass = true;
let allOrderPass = true;
const queryMetrics = [];

for (const tc of queriesToTest) {
  const resC = measureC(tc.q);
  const resD = measureD(tc.q);
  const comparison = compareResults(resC.items, resD.items);

  if (!comparison.setMatch) allParityPass = false;
  if (!comparison.orderMatch) allOrderPass = false;

  const speedup = (resC.medianMs / Math.max(0.01, resD.medianMs)).toFixed(2);
  const prunedPct = resD.rawCandidateCount > 0 ? ((resD.prunedCandidateCount / resD.rawCandidateCount) * 100).toFixed(1) : '0.0';

  console.log(`  Query [${tc.name}] "${tc.q}":`);
  console.log(`    C: ${resC.medianMs}ms (cands: ${resC.candidateCount})`);
  console.log(`    D: ${resD.medianMs}ms (raw: ${resD.rawCandidateCount}, scored: ${resD.scoredCandidateCount}, pruned: ${resD.prunedCandidateCount} [${prunedPct}%]) | Term: ${resD.terminationTier || 'NO'}`);
  console.log(`    Speedup: ${speedup}x | SetParity: ${comparison.setMatch ? 'PASS' : 'FAIL'} | OrderParity: ${comparison.orderMatch ? 'PASS' : 'FAIL'}`);
  if (!comparison.orderMatch) {
    console.error(`    ✗ Divergência: ${comparison.reason}`);
  }

  queryMetrics.push({
    name: tc.name,
    query: tc.q,
    resC,
    resD,
    speedup,
    prunedPct,
    comparison,
  });
}

// 5. Relatório Resumido Desktop
console.log('\n[4/5] Verificação de Integridade e Paridade...');
console.log(`  TOP_K_RESULT_SET_PARITY: ${allParityPass ? 'PASS' : 'FAIL'}`);
console.log(`  TOP_K_ORDERING_PARITY:   ${allOrderPass ? 'PASS' : 'FAIL'}`);

if (!allParityPass || !allOrderPass) {
  console.error('\n✗ ERRO: Paridade violada entre C e D!');
  process.exit(1);
}

const prefixMetric = queryMetrics.find((m) => m.name === 'PREFIX_HIGH_CARD');
const multiMetric = queryMetrics.find((m) => m.name === 'MULTI_HIGH_CARD');

console.log('\n==================================================');
console.log('=== RESUMO DO BENCHMARK R5 (DESKTOP) ===');
console.log('==================================================');
console.log(`PREFIX_RAW_CANDIDATES:        ${prefixMetric.resD.rawCandidateCount}`);
console.log(`PREFIX_SCORED_CANDIDATES_C:   ${prefixMetric.resC.candidateCount}`);
console.log(`PREFIX_SCORED_CANDIDATES_D:   ${prefixMetric.resD.scoredCandidateCount}`);
console.log(`PREFIX_PRUNED_PERCENT:        ${prefixMetric.prunedPct}%`);
console.log(`PREFIX_C_MEDIAN_MS:           ${prefixMetric.resC.medianMs}ms`);
console.log(`PREFIX_D_MEDIAN_MS:           ${prefixMetric.resD.medianMs}ms`);
console.log(`PREFIX_SPEEDUP:               ${prefixMetric.speedup}x`);
console.log('--------------------------------------------------');
console.log(`MULTI_RAW_CANDIDATES:         ${multiMetric.resD.rawCandidateCount}`);
console.log(`MULTI_SCORED_CANDIDATES_C:    ${multiMetric.resC.candidateCount}`);
console.log(`MULTI_SCORED_CANDIDATES_D:    ${multiMetric.resD.scoredCandidateCount}`);
console.log(`MULTI_PRUNED_PERCENT:         ${multiMetric.prunedPct}%`);
console.log(`MULTI_C_MEDIAN_MS:            ${multiMetric.resC.medianMs}ms`);
console.log(`MULTI_D_MEDIAN_MS:            ${multiMetric.resD.medianMs}ms`);
console.log(`MULTI_SPEEDUP:                ${multiMetric.speedup}x`);
console.log('--------------------------------------------------');
console.log(`RESULT_SET_PARITY:            ${allParityPass ? 'PASS' : 'FAIL'}`);
console.log(`ORDERING_PARITY:              ${allOrderPass ? 'PASS' : 'FAIL'}`);
console.log('==================================================\n');
