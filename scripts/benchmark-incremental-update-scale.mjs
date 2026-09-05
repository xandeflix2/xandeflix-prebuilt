/**
 * Xandeflix Prebuilt — Incremental Update 240k Scale Benchmark (Gate G9)
 *
 * Avalia o comportamento de geração e aplicação de deltas em escala sintética (240.000 documentos).
 * Perfis avaliados: SPARSE_1_PERCENT (1% alterado) e MODERATE_5_PERCENT (5% alterado).
 *
 * Princípios:
 * - 100% SINTÉTICO E CONTROLADO (ZERO dados reais)
 * - PERFORMANCE_EVIDENCE_IS_NOT_SLA = SIM
 * - REAL_CATALOG_INCREMENTAL_UPDATE_PROVEN = NAO
 * - FIRE_STICK_UPDATE_FAST = NAO
 */

import zlib from 'node:zlib';
import { CatalogDeltaBuilder } from '../src/update/catalog-delta-builder.ts';
import { CatalogDeltaApplier } from '../src/update/catalog-delta-applier.ts';
import { SearchIndexBuilder } from '../src/search/search-index-builder.ts';
import { SearchDeltaBuilder } from '../src/update/search-delta-builder.ts';
import { SearchDeltaApplier } from '../src/update/search-delta-applier.ts';

console.log('=== Xandeflix Prebuilt — 240k Synthetic Scale Incremental Update Benchmark ===\n');

const TARGET_DOC_COUNT = 240000;
const MOVIE_COUNT = 160000;
const SERIES_COUNT = 80000;

console.log(`[1/5] Gerando base sintética com ${TARGET_DOC_COUNT} documentos em memória...`);
const memBefore = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

const genres = [
  { id: 'g-action', name: 'Ação' },
  { id: 'g-comedy', name: 'Comédia' },
  { id: 'g-drama', name: 'Drama' },
  { id: 'g-scifi', name: 'Ficção Científica' },
  { id: 'g-thriller', name: 'Suspense' },
];

const categories = [
  { id: 'c-movies', name: 'Filmes' },
  { id: 'c-series', name: 'Séries' },
];

const baseMovies = new Array(MOVIE_COUNT);
for (let i = 0; i < MOVIE_COUNT; i++) {
  const padded = String(i).padStart(6, '0');
  baseMovies[i] = {
    id: `syn:movie:${padded}`,
    title: `Movie ${i} Explorer`,
    year: 1980 + (i % 45),
    genreIds: [genres[i % genres.length].id],
    categoryIds: [categories[0].id],
    streamIds: [`syn:stream:movie:${padded}`],
    artworkIds: [`syn:art:movie:${padded}`],
  };
}

const baseSeries = new Array(SERIES_COUNT);
for (let i = 0; i < SERIES_COUNT; i++) {
  const padded = String(i).padStart(6, '0');
  baseSeries[i] = {
    id: `syn:series:${padded}`,
    title: `Series ${i} Chronicles`,
    year: 1990 + (i % 35),
    genreIds: [genres[(i + 2) % genres.length].id],
    categoryIds: [categories[1].id],
    seasonIds: [`syn:season:${padded}`],
    artworkIds: [`syn:art:series:${padded}`],
  };
}

const baseCatalog = {
  metadata: {
    schemaVersion: 1,
    catalogVersion: '1.0.0',
    snapshotId: 'snap-240k-base',
    generatedAt: '2026-01-01T00:00:00.000Z',
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
  categories,
  genres,
  movies: baseMovies,
  series: baseSeries,
  seasons: [],
  episodes: [],
  streams: [],
  artworks: [],
};

console.log('  ✓ Base catalog construído.');

// Amostra representativa para SearchIndex (50.000 docs para medição de busca sem estourar heap do Node em teste de CI)
const SAMPLE_SEARCH_DOCS = 50000;
console.log(`[2/5] Construindo SearchIndex amostral (${SAMPLE_SEARCH_DOCS} docs) para avaliação de search delta...`);
const sampleBaseCatalog = {
  ...baseCatalog,
  movies: baseMovies.slice(0, SAMPLE_SEARCH_DOCS),
  series: [],
};
const searchBuilder = new SearchIndexBuilder();
const baseSearchIndex = searchBuilder.build(sampleBaseCatalog, {
  deterministicGeneratedAt: '2026-01-01T00:00:00.000Z',
});
console.log(`  ✓ SearchIndex base construído com ${baseSearchIndex.documentCount} documentos e ${baseSearchIndex.tokenCount} tokens.`);

// -----------------------------------------------------------------------------
// Função de Execução de Benchmark por Perfil
// -----------------------------------------------------------------------------
async function runProfileBenchmark(profileName, changePercent) {
  console.log(`\n=======================================================`);
  console.log(`[BENCHMARK PROFILE: ${profileName}] (${changePercent}% de alterações)...`);
  console.log(`=======================================================`);

  const changedEntityCount = Math.round((TARGET_DOC_COUNT * changePercent) / 100);

  // 1. Gera catálogo target com modificações esparsas
  const targetMovies = [...baseMovies];
  for (let i = 0; i < changedEntityCount; i++) {
    const idx = (i * 37) % MOVIE_COUNT; // Distribuição esparsa
    const old = targetMovies[idx];
    targetMovies[idx] = {
      ...old,
      title: `${old.title} Updated G9`,
      year: old.year ? old.year + 1 : 2026,
    };
  }

  const targetCatalog = {
    ...baseCatalog,
    metadata: {
      ...baseCatalog.metadata,
      snapshotId: `snap-240k-${profileName.toLowerCase()}`,
      catalogVersion: '1.1.0',
    },
    movies: targetMovies,
  };

  // 2. Catalog Delta Build
  const catDeltaBuilder = new CatalogDeltaBuilder();
  const catStart = Date.now();
  const catalogDelta = catDeltaBuilder.build(baseCatalog, targetCatalog);
  const catalogDeltaBuildMs = Date.now() - catStart;

  // 3. Search Delta Build na amostra
  const changedSearchSampleCount = Math.round((SAMPLE_SEARCH_DOCS * changePercent) / 100);
  const targetSampleMovies = [...sampleBaseCatalog.movies];
  for (let i = 0; i < changedSearchSampleCount; i++) {
    const idx = (i * 19) % SAMPLE_SEARCH_DOCS;
    const old = targetSampleMovies[idx];
    targetSampleMovies[idx] = {
      ...old,
      title: `${old.title} Updated G9`,
    };
  }
  const targetSampleCatalog = {
    ...sampleBaseCatalog,
    movies: targetSampleMovies,
    metadata: { ...sampleBaseCatalog.metadata, snapshotId: `snap-search-${profileName.toLowerCase()}` },
  };

  const targetSearchIndex = searchBuilder.build(targetSampleCatalog, {
    deterministicGeneratedAt: '2026-01-02T00:00:00.000Z',
  });

  const searchDeltaBuilder = new SearchDeltaBuilder();
  const searchStart = Date.now();
  const searchDelta = searchDeltaBuilder.build(baseSearchIndex, targetSearchIndex);
  const searchDeltaBuildMs = Date.now() - searchStart;

  // 4. Medição de tamanhos de transferência (Gzip)
  const catDeltaStr = JSON.stringify(catalogDelta);
  const searchDeltaStr = JSON.stringify(searchDelta);
  const compressedDelta = zlib.gzipSync(Buffer.from(catDeltaStr + searchDeltaStr, 'utf8'));
  const deltaPackageSizeBytes = compressedDelta.length;

  const fullTargetStr = JSON.stringify(targetCatalog) + JSON.stringify(targetSearchIndex);
  const compressedFullTarget = zlib.gzipSync(Buffer.from(fullTargetStr, 'utf8'));
  const fullTargetPackageSizeBytes = compressedFullTarget.length;

  const deltaToFullRatio = deltaPackageSizeBytes / fullTargetPackageSizeBytes;

  // 5. Medição de aplicação no device (apply delta)
  const applyStart = Date.now();
  const catApplier = new CatalogDeltaApplier();
  const appliedCat = catApplier.apply(baseCatalog, catalogDelta);
  const deviceDeltaApplyMs = Date.now() - applyStart;

  const searchApplyStart = Date.now();
  const searchApplier = new SearchDeltaApplier();
  const appliedSearch = searchApplier.apply(baseSearchIndex, searchDelta);
  const deviceSearchApplyMs = Date.now() - searchApplyStart;

  const totalUpdateMs = deviceDeltaApplyMs + deviceSearchApplyMs;
  const memPeak = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

  console.log(`  DOCUMENT_COUNT:                   ${TARGET_DOC_COUNT}`);
  console.log(`  CHANGE_PERCENT:                   ${changePercent}%`);
  console.log(`  CHANGED_ENTITY_COUNT:             ${changedEntityCount}`);
  console.log(`  CATALOG_DELTA_BUILD_MS:           ${catalogDeltaBuildMs} ms`);
  console.log(`  SEARCH_DELTA_BUILD_MS:            ${searchDeltaBuildMs} ms`);
  console.log(`  DELTA_PACKAGE_SIZE_BYTES:         ${deltaPackageSizeBytes} bytes (${(deltaPackageSizeBytes / 1024).toFixed(1)} KB)`);
  console.log(`  FULL_TARGET_PACKAGE_SIZE_BYTES:   ${fullTargetPackageSizeBytes} bytes (${(fullTargetPackageSizeBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  DELTA_TO_FULL_RATIO:              ${deltaToFullRatio.toFixed(4)}`);
  console.log(`  DEVICE_DELTA_APPLY_MS:            ${deviceDeltaApplyMs} ms`);
  console.log(`  TOTAL_UPDATE_MS:                  ${totalUpdateMs} ms`);
  console.log(`  MEMORY_PEAK_MB:                   ${memPeak} MB`);

  return {
    documentCount: TARGET_DOC_COUNT,
    changePercent,
    changedEntityCount,
    catalogDeltaBuildMs,
    searchDeltaBuildMs,
    deltaPackageSizeBytes,
    fullTargetPackageSizeBytes,
    deltaToFullRatio,
    deviceDeltaApplyMs,
    totalUpdateMs,
    memoryPeakMb: memPeak,
  };
}

// Executar SPARSE_1_PERCENT (1%)
const sparseResults = await runProfileBenchmark('SPARSE_1_PERCENT', 1);

// Executar MODERATE_5_PERCENT (5%)
const moderateResults = await runProfileBenchmark('MODERATE_5_PERCENT', 5);

const memAfter = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

console.log('\n=======================================================');
console.log('RESUMO FINAL DO BENCHMARK DE ESCALA G9');
console.log('=======================================================');
console.log(`SPARSE_1_PERCENT_DELTA_TO_FULL_RATIO:    ${sparseResults.deltaToFullRatio.toFixed(4)} (< 1.0 = PASS)`);
console.log(`MODERATE_5_PERCENT_DELTA_TO_FULL_RATIO:  ${moderateResults.deltaToFullRatio.toFixed(4)}`);
console.log(`MEMORY_BEFORE_MB:                        ${memBefore} MB`);
console.log(`MEMORY_PEAK_MB:                          ${Math.max(sparseResults.memoryPeakMb, moderateResults.memoryPeakMb)} MB`);
console.log(`MEMORY_AFTER_MB:                         ${memAfter} MB`);
console.log(`PERFORMANCE_EVIDENCE_IS_NOT_SLA:         SIM`);

if (sparseResults.deltaToFullRatio >= 1.0) {
  console.error('\nFAIL: SPARSE_1_PERCENT delta package não é menor que o pacote full!');
  process.exit(1);
}

console.log('\nRESULT: PASS_PREBUILT_G9_INCREMENTAL_SCALE_BENCHMARK');
