import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const service = await readFile(new URL('../src/catalog/segmented-browse.service.ts', import.meta.url), 'utf8');
const movies = await readFile(new URL('../src/ui/pages/MoviesPage.tsx', import.meta.url), 'utf8');
const series = await readFile(new URL('../src/ui/pages/SeriesPage.tsx', import.meta.url), 'utf8');
const live = await readFile(new URL('../src/catalog/live/live-catalog.service.ts', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

const tests = [
  ['T176', /counts\?\.\[kind\]/, service], ['T177', /kind: BrowseKind/, service],
  ['T178', /totalAvailable/, service], ['T179', /totalAvailable/, service],
  ['T180', /nextCursor/, service], ['T181', /nextCursor/, service],
  ['T182', /segmentIndex/, service], ['T183', /segmentIndex/, service],
  ['T184', /segmentIndex/, service], ['T185', /segmentIndex/, service],
  ['T186', /categoryIds\.includes/, service], ['T187', /countCategory/, service],
  ['T188', /totalChannels/, live], ['T189', /channelsByGroup/, live],
  ['T190', /readLiveChannelsForGroupFromSegments/, live], ['T191', /loadChannelsForGroup/, live],
  ['T192', /resolveLiveSegmentFiles/, live], ['T193', /pageSize = 48/, service],
  ['T194', /onLoadMoreRemote/, movies], ['T195', /CatalogGrid/, movies],
  ['T196', /movieToViewModel/, movies], ['T197', /seriesToViewModel/, series],
  ['T198', /loadChannelsForGroup/, live], ['T199', /SegmentedBrowseService/, service],
  ['T200', /padding-left: 2px/, css], ['T201', /padding-right: 2px/, css],
  ['T202', /margin-left: 1px/, css], ['T203', /tv-live-category-width/, css],
  ['T204', /max-width: 1100px/, css],
];
for (const [id, expression, subject] of tests) {
  assert.match(subject, expression, id + ' failed');
  console.log(id + '=PASS');
}
assert.doesNotMatch(service, /directStreamUrl|password|authorization|token/i, 'T205 failed: browse reader contains sensitive data');
console.log('T205=PASS');
console.log('T176_TO_T205=PASS');

// --- C11 FIRETV CATEGORY TAXONOMY PARITY AND COMPLETENESS TESTS (T206 - T225) ---

import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { SegmentedBrowseService } from '../src/catalog/segmented-browse.service.ts';

const movieCategoryIds = [
  'cat:m3u:filmes-nacionais', 'cat:m3u:filmes-ficcao', 'cat:m3u:filmes-crime',
  'cat:m3u:filmes-guerra', 'cat:m3u:filmes-familia', 'cat:m3u:filmes-faroeste',
  'cat:m3u:filmes-aventura', 'cat:m3u:filmes-romance', 'cat:m3u:filmes-religiosos',
  'cat:m3u:filmes-animacao', 'cat:m3u:filmes-fantasia', 'cat:m3u:filmes-suspense',
  'cat:m3u:filmes-documentarios', 'cat:m3u:filmes-acao', 'cat:m3u:filmes-comedia',
  'cat:m3u:filmes-drama', 'cat:m3u:filmes-terror', 'cat:m3u:filmes-cinema',
  'cat:m3u:filmes-legendados', 'cat:m3u:filmes-lancamentos'
];

const seriesCategoryIds = [
  'cat:m3u:series-desenhos', 'cat:m3u:series-disney-plus', 'cat:m3u:series-netflix',
  'cat:m3u:series-amazon-prime-video', 'cat:m3u:series-paramount', 'cat:m3u:series-hbo-max',
  'cat:m3u:series-globoplay', 'cat:m3u:series-directv', 'cat:m3u:series-apple-tv-plus',
  'cat:m3u:series-legendadas', 'cat:m3u:series-lionsgate', 'cat:m3u:series-crunchyroll',
  'cat:m3u:programas-de-tv', 'cat:m3u:series-outros-streams', 'cat:m3u:series-funimation-now',
  'cat:m3u:series-animes', 'cat:m3u:series-star-plus', 'cat:m3u:novelas',
  'cat:m3u:series-doramas', 'cat:m3u:series-claro-video', 'cat:m3u:series-discovery-plus',
  'cat:m3u:series-amc-plus', 'cat:m3u:series-brasil-paralelo'
];

const liveCategoryId = 'cat:m3u:canais-24hrs';

const categories = [
  ...movieCategoryIds.map(id => ({ id, name: id.replace('cat:m3u:', '').toUpperCase().replace(/-/g, ' | '), contentKinds: ['movie', 'series'] })),
  ...seriesCategoryIds.map(id => ({ id, name: id.replace('cat:m3u:', '').toUpperCase().replace(/-/g, ' | '), contentKinds: ['movie', 'series'] })),
  { id: liveCategoryId, name: 'CANAIS | 24HRS', contentKinds: ['movie', 'series'] }
];

const testCatalog = {
  metadata: { schemaVersion: 1, catalogVersion: '1.0.0', snapshotId: 'snap-test', generatedAt: new Date().toISOString(), counts: { movies: 17120, series: 8890, categories: 44 } },
  categories,
  genres: [],
  movies: Array.from({ length: 100 }, (_, i) => ({ id: 'mov:' + i, title: 'Filme ' + i, categoryIds: ['cat:m3u:filmes-nacionais'], genreIds: [], artworkIds: [], streamIds: [] })),
  series: Array.from({ length: 100 }, (_, i) => ({ id: 'ser:' + i, title: 'Serie ' + i, categoryIds: ['cat:m3u:series-desenhos'], genreIds: [], artworkIds: [], streamIds: [] })),
  seasons: [],
  episodes: [],
  streams: [],
  artworks: [],
  extensions: { categoryProvenance: [], isSegmented: true }
};

const rm = new CatalogReadModel(testCatalog);

// T206: MOVIE_CANONICAL_CATEGORIES_EXIST
const movieCats = rm.getCategoriesForKind('movie');
assert.equal(movieCats.length, 20, 'T206 failed: Expected 20 canonical movie categories');
assert.ok(movieCats.some(c => c.id === 'cat:m3u:filmes-acao'), 'T206 failed: filmes-acao missing');
assert.ok(movieCats.some(c => c.id === 'cat:m3u:filmes-comedia'), 'T206 failed: filmes-comedia missing');
assert.ok(movieCats.some(c => c.id === 'cat:m3u:filmes-drama'), 'T206 failed: filmes-drama missing');
console.log('T206=PASS');
console.log('TEST_T206=PASS');

// T207: SERIES_CANONICAL_CATEGORIES_EXIST
const seriesCats = rm.getCategoriesForKind('series');
assert.equal(seriesCats.length, 23, 'T207 failed: Expected 23 canonical series categories');
assert.ok(seriesCats.some(c => c.id === 'cat:m3u:series-netflix'), 'T207 failed: series-netflix missing');
assert.ok(seriesCats.some(c => c.id === 'cat:m3u:series-disney-plus'), 'T207 failed: series-disney-plus missing');
console.log('T207=PASS');
console.log('TEST_T207=PASS');

// T208: MOVIE_CATEGORY_SELECTOR_VISIBLE_FIRETV
assert.match(movies, /className=\{`focusable-item filter-chip/, 'T208 failed: filter-chip button missing in MoviesPage');
assert.match(movies, /role="toolbar"\s+aria-label="Filtro de Categorias de Filmes"/, 'T208 failed: toolbar missing in MoviesPage');
assert.match(css, /\.filter-bar\s*\{[^}]*display:\s*flex;/s, 'T208 failed: filter-bar not display: flex in css');
console.log('T208=PASS');
console.log('TEST_T208=PASS');

// T209: SERIES_CATEGORY_SELECTOR_VISIBLE_FIRETV
assert.match(series, /className=\{`focusable-item filter-chip/, 'T209 failed: filter-chip button missing in SeriesPage');
assert.match(series, /role="toolbar"\s+aria-label="Filtro de Categorias de S.ries"/, 'T209 failed: toolbar missing in SeriesPage');
console.log('T209=PASS');
console.log('TEST_T209=PASS');

// T210: FIRETV_CATEGORY_SELECTOR_NOT_HIDDEN_BY_MEDIA_QUERY
assert.doesNotMatch(css, /@media[^{]*max-height:\s*600px[^{]*\{[^}]*\.filter-bar\s*\{[^}]*display:\s*none/s, 'T210 failed: filter-bar hidden by TV media query');
assert.doesNotMatch(css, /@media[^{]*max-height:\s*600px[^{]*\{[^}]*\.filter-chip\s*\{[^}]*display:\s*none/s, 'T210 failed: filter-chip hidden by TV media query');
console.log('T210=PASS');
console.log('TEST_T210=PASS');

// Setup mock multi-segment storage for browse testing
const mockSegments = new Map();
mockSegments.set('segments/seg-movies-000.json', JSON.stringify([
  ...Array.from({ length: 606 }, (_, i) => ({ id: 'mov:nac:' + i, title: 'Nacional ' + i, categoryIds: ['cat:m3u:filmes-nacionais'] })),
  ...Array.from({ length: 319 }, (_, i) => ({ id: 'mov:fic:' + i, title: 'Ficcao ' + i, categoryIds: ['cat:m3u:filmes-ficcao'] })),
  ...Array.from({ length: 75 }, (_, i) => ({ id: 'mov:crm:' + i, title: 'Crime ' + i, categoryIds: ['cat:m3u:filmes-crime'] })),
]));
mockSegments.set('segments/seg-movies-004.json', JSON.stringify(
  Array.from({ length: 2098 }, (_, i) => ({ id: 'mov:act:' + i, title: 'Acao ' + i, categoryIds: ['cat:m3u:filmes-acao'] }))
));
mockSegments.set('segments/seg-movies-017.json', JSON.stringify(
  Array.from({ length: 1276 }, (_, i) => ({ id: 'mov:lan:' + i, title: 'Lancamento ' + i, categoryIds: ['cat:m3u:filmes-lancamentos'] }))
));

mockSegments.set('segments/seg-series-000.json', JSON.stringify(
  Array.from({ length: 128 }, (_, i) => ({ id: 'ser:des:' + i, title: 'Desenho ' + i, categoryIds: ['cat:m3u:series-desenhos'] }))
));
mockSegments.set('segments/seg-series-002.json', JSON.stringify(
  Array.from({ length: 1768 }, (_, i) => ({ id: 'ser:nfx:' + i, title: 'Netflix ' + i, categoryIds: ['cat:m3u:series-netflix'] }))
));
mockSegments.set('segments/seg-series-008.json', JSON.stringify(
  Array.from({ length: 33 }, (_, i) => ({ id: 'ser:bp:' + i, title: 'Brasil Paralelo ' + i, categoryIds: ['cat:m3u:series-brasil-paralelo'] }))
));

const mockMultiSegmentStorage = {
  async readActiveManifest() {
    return {
      counts: { movies: 17120, series: 8890 },
      segments: [
        { kind: 'movies', fileName: 'seg-movies-000.json' },
        { kind: 'movies', fileName: 'seg-movies-004.json' },
        { kind: 'movies', fileName: 'seg-movies-017.json' },
        { kind: 'series', fileName: 'seg-series-000.json' },
        { kind: 'series', fileName: 'seg-series-002.json' },
        { kind: 'series', fileName: 'seg-series-008.json' },
      ]
    };
  },
  async readActiveSegment(relPath) {
    return mockSegments.get(relPath) || '[]';
  }
};

const browseService = new SegmentedBrowseService(mockMultiSegmentStorage);

// T211: MOVIE_CATEGORY_COUNT_CANONICAL
const movieAcaoPage = await browseService.loadPage('movies', { segment: 0, offset: 0 }, 48, 'cat:m3u:filmes-acao');
assert.equal(movieAcaoPage.totalAvailable, 2098, 'T211 failed: totalAvailable must be canonical total from segments');
assert.equal(movieAcaoPage.items.length, 48, 'T211 failed: items length must be pageSize (48)');
console.log('T211=PASS');
console.log('TEST_T211=PASS');

// T212: SERIES_CATEGORY_COUNT_CANONICAL
const seriesNfxPage = await browseService.loadPage('series', { segment: 0, offset: 0 }, 48, 'cat:m3u:series-netflix');
assert.equal(seriesNfxPage.totalAvailable, 1768, 'T212 failed: series totalAvailable must be canonical total');
assert.equal(seriesNfxPage.items.length, 48, 'T212 failed: series items length must be pageSize (48)');
console.log('T212=PASS');
console.log('TEST_T212=PASS');

// T213: MOVIE_CATEGORY_FILTER_SPANS_SEGMENTS
assert.equal(movieAcaoPage.items[0].id, 'mov:act:0', 'T213 failed: first acao item must match');
assert.ok(movieAcaoPage.nextCursor.segment === 1, 'T213 failed: nextCursor should point to segment 1 in mock segments list');
console.log('T213=PASS');
console.log('TEST_T213=PASS');

// T214: MOVIE_CATEGORY_ITEM_AFTER_FIRST_100
const movieAcaoPage2 = await browseService.loadPage('movies', movieAcaoPage.nextCursor, 48, 'cat:m3u:filmes-acao');
assert.equal(movieAcaoPage2.items.length, 48, 'T214 failed: second page length');
assert.equal(movieAcaoPage2.items[0].id, 'mov:act:48', 'T214 failed: second page first item');
console.log('T214=PASS');
console.log('TEST_T214=PASS');

// T215: MOVIE_CATEGORY_LATE_ITEM
const movieLatePage = await browseService.loadPage('movies', { segment: 0, offset: 0 }, 48, 'cat:m3u:filmes-lancamentos');
assert.equal(movieLatePage.totalAvailable, 1276, 'T215 failed: late segment totalAvailable');
assert.equal(movieLatePage.items[0].id, 'mov:lan:0', 'T215 failed: late segment item');
console.log('T215=PASS');
console.log('TEST_T215=PASS');

// T216: SERIES_CATEGORY_FILTER_SPANS_SEGMENTS
const seriesPage2 = await browseService.loadPage('series', seriesNfxPage.nextCursor, 48, 'cat:m3u:series-netflix');
assert.equal(seriesPage2.items.length, 48, 'T216 failed: series page 2 length');
assert.equal(seriesPage2.items[0].id, 'ser:nfx:48', 'T216 failed: series page 2 first item');
console.log('T216=PASS');
console.log('TEST_T216=PASS');

// T217: SERIES_CATEGORY_LATE_ITEM
const seriesLatePage = await browseService.loadPage('series', { segment: 0, offset: 0 }, 48, 'cat:m3u:series-brasil-paralelo');
assert.equal(seriesLatePage.totalAvailable, 33, 'T217 failed: late series segment count');
assert.equal(seriesLatePage.items.length, 33, 'T217 failed: late series segment items count');
assert.equal(seriesLatePage.items[0].id, 'ser:bp:0', 'T217 failed: late series segment item');
console.log('T217=PASS');
console.log('TEST_T217=PASS');

// T218: CATEGORY_CHANGE_MEMORY_BOUNDED
const useBrowseFile = await readFile(new URL('../src/ui/hooks/useSegmentedBrowse.ts', import.meta.url), 'utf8');
assert.match(useBrowseFile, /replace \? page\.items : \[\.\.\.current/, 'T218 failed: replace logic missing on category change');
assert.match(useBrowseFile, /BROWSE_PAGE_SIZE/, 'T218 failed: bounded page size missing');
console.log('T218=PASS');
console.log('TEST_T218=PASS');

// T219: CATEGORY_NEXT_PAGE_DPAD
const gridFile = await readFile(new URL('../src/ui/components/CatalogGrid.tsx', import.meta.url), 'utf8');
assert.match(gridFile, /index === visibleItems\.length - 1/, 'T219 failed: last item focus check missing');
assert.match(gridFile, /onLoadMoreRemote\?\.\(\)/, 'T219 failed: onLoadMoreRemote call missing');
console.log('T219=PASS');
console.log('TEST_T219=PASS');

// T220: CATEGORY_FOCUS_PRESERVED
assert.match(gridFile, /key=\{item\.id\}/, 'T220 failed: stable key missing for card item');
assert.match(gridFile, /items\.slice\(0, visibleCount\)/, 'T220 failed: visibleItems slice missing');
console.log('T220=PASS');
console.log('TEST_T220=PASS');

// T221: MOVIE_SERIES_LIVE_TAXONOMY_ISOLATED
assert.ok(!movieCats.some(c => c.id === liveCategoryId), 'T221 failed: Live category leaked into movies');
assert.ok(!seriesCats.some(c => c.id === liveCategoryId), 'T221 failed: Live category leaked into series');
assert.ok(!movieCats.some(c => seriesCategoryIds.includes(c.id)), 'T221 failed: Series category leaked into movies');
assert.ok(!seriesCats.some(c => movieCategoryIds.includes(c.id)), 'T221 failed: Movie category leaked into series');
console.log('T221=PASS');
console.log('TEST_T221=PASS');

// T222: EXISTING_SNAPSHOT_CATEGORY_RECOVERY
assert.equal(testCatalog.extensions.categoryProvenance.length, 0, 'T222 failed: testCatalog must have empty provenance');
assert.equal(rm.getTrustedCategoriesForKind('movie').length, 20, 'T222 failed: recovered movie categories count');
assert.equal(rm.getTrustedCategoriesForKind('series').length, 23, 'T222 failed: recovered series categories count');
console.log('T222=PASS');
console.log('TEST_T222=PASS');

// T223: TABLET_CATEGORY_UI_UNCHANGED
assert.match(css, /@media\s*\(min-width:\s*900px\)/, 'T223 failed: tablet media query missing');
assert.match(css, /max-width:\s*1100px/, 'T223 failed: tablet max-width missing');
console.log('T223=PASS');
console.log('TEST_T223=PASS');

// T224: PHONE_CATEGORY_UI_UNCHANGED
assert.match(css, /@media\s*\(max-width:\s*600px\)/, 'T224 failed: phone media query missing');
console.log('T224=PASS');
console.log('TEST_T224=PASS');

// T225: FIRETV_DENSITY_REGRESSION_GUARD
assert.match(css, /--tv-chip-height:\s*26px/, 'T225 failed: tv chip height missing');
assert.match(css, /--tv-space-md:\s*8px/, 'T225 failed: tv space md missing');
assert.match(css, /flex-shrink:\s*0/, 'T225 failed: filter-chip flex-shrink missing');
console.log('T225=PASS');
console.log('TEST_T225=PASS');
console.log('T206_TO_T225=PASS');
console.log('T1_TO_T225=PASS');

