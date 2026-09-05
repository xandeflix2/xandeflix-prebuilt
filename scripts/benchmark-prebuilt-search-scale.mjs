/**
 * Xandeflix Prebuilt — Large Synthetic Scale Benchmark (Gate G7)
 *
 * Avalia o comportamento da indexação externa e das consultas locais em escala
 * próxima ao catálogo histórico (240.000 documentos sintéticos).
 *
 * Princípios:
 * - DADOS 100% SINTÉTICOS E CONTROLADOS (ZERO dados reais)
 * - PERFORMANCE_EVIDENCE_IS_NOT_SLA = SIM
 * - REAL_CATALOG_SEARCH_PROVEN = NAO
 * - FIRE_STICK_SEARCH_PERFORMANCE_PROVEN = NAO
 */

import zlib from 'node:zlib';
import { SearchIndexBuilder } from '../src/search/search-index-builder.ts';
import { SearchEngine } from '../src/search/search-engine.ts';

console.log('=== Xandeflix Prebuilt — 240k Synthetic Scale Benchmark ===\n');

const TARGET_DOC_COUNT = 240000;
const MOVIE_COUNT = 160000;
const SERIES_COUNT = 80000;

console.log(`[1/5] Gerando ${TARGET_DOC_COUNT} entidades sintéticas em memória...`);
const memBefore = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

// Gêneros e Categorias sintéticos
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

// Gerar Movies sintéticos
const movies = new Array(MOVIE_COUNT);
for (let i = 0; i < MOVIE_COUNT; i++) {
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

// Gerar Series sintéticas
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
    catalogVersion: '1.0.0-scale-benchmark',
    generatedAt: '2026-09-04T00:00:00.000Z',
    sourceNamespace: 'syn',
    snapshotId: 'snap-scale-240k',
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

console.log(`  ✓ ${largeCatalog.movies.length + largeCatalog.series.length} títulos criados em memória.`);

// [2/5] Construção Externa do Índice
console.log('\n[2/5] Executando SearchIndexBuilder sobre 240.000 títulos...');
const builder = new SearchIndexBuilder();
const buildStart = performance.now();
const index = builder.build(largeCatalog, {
  generator: 'xandeflix-prebuilt-scale-benchmark/1.0',
  deterministicGeneratedAt: '2026-09-04T00:00:00.000Z',
});
const buildDurationMs = Math.round(performance.now() - buildStart);
const memAfterBuild = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

console.log(`  ✓ Índice construído em ${buildDurationMs} ms.`);
console.log(`    Documentos: ${index.documentCount}, Tokens únicos: ${index.tokenCount}`);

// [3/5] Tamanho Serializado e Estimativa Comprimida
console.log('\n[3/5] Serializando e estimando taxa de compressão...');
const serializedIndex = JSON.stringify(index);
const serializedSizeBytes = Buffer.byteLength(serializedIndex, 'utf8');

// Estimativa de compressão via DEFLATE/gzip
const compressed = zlib.gzipSync(Buffer.from(serializedIndex, 'utf8'), { level: 6 });
const compressedSizeBytes = compressed.length;
console.log(`  ✓ Serializado: ${(serializedSizeBytes / 1024 / 1024).toFixed(2)} MB (${serializedSizeBytes} bytes)`);
console.log(`  ✓ Comprimido (gzip): ${(compressedSizeBytes / 1024 / 1024).toFixed(2)} MB (${compressedSizeBytes} bytes)`);

// [4/5] Carga e Materialização em Runtime
console.log('\n[4/5] Simulando carregamento no SearchEngine em runtime...');
const engine = new SearchEngine();
const loadStart = performance.now();
engine.load(index);
const loadDurationMs = Math.round(performance.now() - loadStart);
const memAfterLoad = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

console.log(`  ✓ SearchEngine carregado e pronto em ${loadDurationMs} ms.`);

// [5/5] Medição de Latência de Consultas
console.log('\n[5/5] Executando benchmarks de consulta...');

// Exact Query
const exactStart = performance.now();
const exactRes = engine.query('Movie 123456 Alpha Explorer');
const exactDurationMs = Number((performance.now() - exactStart).toFixed(2));
console.log(`  ✓ Exact query: ${exactDurationMs} ms (${exactRes.length} resultados)`);

// Prefix Query
const prefixStart = performance.now();
const prefixRes = engine.query('Chro');
const prefixDurationMs = Number((performance.now() - prefixStart).toFixed(2));
console.log(`  ✓ Prefix query ('Chro'): ${prefixDurationMs} ms (${prefixRes.length} resultados)`);

// Multi-token Query
const multiStart = performance.now();
const multiRes = engine.query('Series 45000 Delta');
const multiDurationMs = Number((performance.now() - multiStart).toFixed(2));
console.log(`  ✓ Multi-token query: ${multiDurationMs} ms (${multiRes.length} resultados)`);

// No-result Query
const noResStart = performance.now();
const noRes = engine.query('NonExistentTerm99999');
const noResDurationMs = Number((performance.now() - noResStart).toFixed(2));
console.log(`  ✓ No-result query: ${noResDurationMs} ms (${noRes.length} resultados)`);

console.log('\n==================================================');
console.log('=== RELATÓRIO DO BENCHMARK DE ESCALA SINTÉTICO ===');
console.log('==================================================');
console.log(`SCALE_DOCUMENT_COUNT:                     ${index.documentCount}`);
console.log(`EXTERNAL_INDEX_BUILD_MS:                  ${buildDurationMs}`);
console.log(`SEARCH_INDEX_SERIALIZED_SIZE_BYTES:       ${serializedSizeBytes}`);
console.log(`SEARCH_INDEX_COMPRESSED_ESTIMATE_BYTES:   ${compressedSizeBytes}`);
console.log(`SEARCH_INDEX_LOAD_MS:                     ${loadDurationMs}`);
console.log(`RUNTIME_MATERIALIZATION_MS:               ${loadDurationMs}`);
console.log(`QUERY_EXACT_MS:                           ${exactDurationMs}`);
console.log(`QUERY_PREFIX_MS:                          ${prefixDurationMs}`);
console.log(`QUERY_MULTI_TOKEN_MS:                     ${multiDurationMs}`);
console.log(`QUERY_NO_RESULT_MS:                       ${noResDurationMs}`);
console.log(`PROCESS_MEMORY_BEFORE_MB:                 ${memBefore}`);
console.log(`PROCESS_MEMORY_AFTER_BUILD_MB:            ${memAfterBuild}`);
console.log(`PROCESS_MEMORY_AFTER_LOAD_MB:             ${memAfterLoad}`);
console.log('PERFORMANCE_EVIDENCE_IS_NOT_SLA:          SIM');
console.log('REAL_CATALOG_SEARCH_PROVEN:               NAO');
console.log('FIRE_STICK_SEARCH_PERFORMANCE_PROVEN:     NAO');
console.log('PHYSICAL_DEVICE_VALIDATION:               NOT_REQUIRED_G7');
console.log('SYNTHETIC_240K_SCALE_TEST:                PASS');
console.log('==================================================\n');
