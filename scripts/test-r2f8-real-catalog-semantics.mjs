import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const { parseM3uExtInfLine, containsRawM3uAttributes } = await import('../src/source/m3u-extinf-parser.ts');
const { classifyCanonicalSourceContent } = await import('../src/source/content-kind-classifier.ts');
const { buildArtworkResolutionKey, isArtworkKindSafeMatch } = await import('../src/source/artwork-kind-safety.ts');
const { normalizeRawCatalog } = await import('../src/ingestion/normalize.ts');
const parserLock = await import('../src/source/m3u-extinf-parser.lock.ts');
const artworkLock = await import('../src/source/artwork-kind-isolation.lock.ts');
const integrityLock = await import('../src/catalog/catalog-kind-integrity.lock.ts');

const parserFixtures = [
  ['T01 normal EXTINF', '#EXTINF:-1,Canal Normal', 'Canal Normal', undefined, undefined],
  ['T02 tvg-logo', '#EXTINF:-1 tvg-logo="https://art.invalid/live.png",Canal Logo', 'Canal Logo', 'https://art.invalid/live.png', undefined],
  ['T03 group-title', '#EXTINF:-1 group-title="Ao Vivo",Canal Grupo', 'Canal Grupo', undefined, 'Ao Vivo'],
  ['T04 attributes reordered', '#EXTINF:-1 group-title="Filmes" tvg-logo="movie.png" tvg-id="m1",Filme', 'Filme', 'movie.png', 'Filmes'],
  ['T05 spaces', '#EXTINF:-1   tvg-name="Nome"   group-title="Geral"  ,  Título com espaços  ', 'Título com espaços', undefined, 'Geral'],
  ['T06 accented text', '#EXTINF:-1 group-title="Animação",Coração Azul', 'Coração Azul', undefined, 'Animação'],
  ['T07 quoted values', '#EXTINF:-1 tvg-name="Nome quoted" group-title="Filmes | Drama",Drama', 'Drama', undefined, 'Filmes | Drama'],
  ['T08 comma inside quoted attribute', '#EXTINF:-1 tvg-logo="https://art.invalid/a,b.png" group-title="Grupo, Com Vírgula",Título', 'Título', 'https://art.invalid/a,b.png', 'Grupo, Com Vírgula'],
  ['T09 no tvg-logo', '#EXTINF:-1 group-title="Filmes",Sem Logo', 'Sem Logo', undefined, 'Filmes'],
  ['T10 malformed fail-closed', '#EXTINF:-1 tvg-logo="unterminated,Item', undefined, undefined, undefined],
  ['T11 Bressan-shaped fixture', '#EXTINF:-1 tvg-name="Bressan" tvg-logo="poster.png" group-title="Filmes | Lançamentos",Bressan (2021)', 'Bressan (2021)', 'poster.png', 'Filmes | Lançamentos'],
  ['T12 raw attributes never enter title', '#EXTINF:-1 tvg-logo="poster.png" group-title="Filmes",Bressan (2021)', 'Bressan (2021)', 'poster.png', 'Filmes'],
];

for (const [label, line, expectedTitle, expectedLogo, expectedGroup] of parserFixtures) {
  const parsed = parseM3uExtInfLine(line);
  if (expectedTitle === undefined) {
    assert.equal(parsed, undefined, label);
    continue;
  }
  assert.ok(parsed, label);
  assert.equal(parsed.displayTitle, expectedTitle, label);
  assert.equal(parsed.tvgLogo, expectedLogo, label);
  assert.equal(parsed.groupTitle, expectedGroup, label);
  assert.equal(containsRawM3uAttributes(parsed.displayTitle), false, label);
}

const classifierFixtures = [
  ['A&E-like live', 'A&E FHD', 'Series', 'https://source.invalid/live/channel.ts', 'live'],
  ['AMC-like live', 'AMC FHD S01E01', 'Filmes | Terror', 'https://source.invalid/live/channel.ts', 'live'],
  ['It movie', 'It', 'Filmes | Terror', 'https://source.invalid/movie/it.mp4', 'movie'],
  ['Series episodic', 'Sobrenatural S01E01', 'Series | Drama', 'https://source.invalid/series/sobrenatural.ts', 'series'],
  ['Series explicit season', 'Sobrenatural temporada 1 episódio 2', 'Filmes', 'https://source.invalid/item.ts', 'series'],
  ['Ambiguous TS', 'Item sem evidência', 'Series', 'https://source.invalid/item.ts', 'unresolved'],
  ['Movie path wins over title noise', 'It S01E01', 'Series', 'https://source.invalid/movie/it.mp4', 'movie'],
];

for (const [label, title, groupName, streamUrl, expected] of classifierFixtures) {
  assert.equal(classifyCanonicalSourceContent({ title, groupName, streamUrl }), expected, label);
}

const { catalog } = normalizeRawCatalog({
  sourceName: 'R2F8 synthetic semantic fixture',
  movies: [{
    sourceItemId: 'movie-it',
    title: 'It',
    categories: ['Misturada', 'Filmes | Terror'],
    genres: ['Terror'],
    artworks: [{ kind: 'poster', url: 'movie-it-poster' }],
    streams: [{ sourceItemId: 'movie-it-stream', containerExtension: 'mp4' }],
  }],
  series: [{
    sourceItemId: 'series-sobrenatural',
    title: 'Sobrenatural',
    categories: ['Misturada', 'Series | Drama'],
    genres: ['Drama'],
    artworks: [{ kind: 'poster', url: 'series-sobrenatural-poster' }],
    seasons: [{
      seasonNumber: 1,
      episodes: [
        { title: 'Sobrenatural S01E01', episodeNumber: 1, streams: [{ sourceItemId: 'ep-1', containerExtension: 'mp4' }] },
        { title: 'Sobrenatural S01E02', episodeNumber: 2, streams: [{ sourceItemId: 'ep-2', containerExtension: 'mp4' }] },
      ],
    }],
  }],
}, { sourceNamespace: 'r2f8-semantic', deterministicGeneratedAt: '2026-09-13T00:00:00.000Z' });

assert.equal(catalog.movies.some((item) => item.title === 'It'), true, 'It must remain movie');
assert.equal(catalog.series.some((item) => item.title === 'It'), false, 'It must not become series');
assert.equal(catalog.series.find((item) => item.title === 'Sobrenatural')?.seasonIds.length, 1);
assert.equal(catalog.episodes.filter((episode) => episode.seriesId.includes('series-sobrenatural')).length, 2);
assert.equal(catalog.extensions?.categoryProvenance.some((entry) => entry.canonicalKind === 'series'), true);
assert.equal(catalog.extensions?.categoryProvenance.some((entry) => entry.categoryId.includes('misturada')), false);

const seriesArtworkKey = buildArtworkResolutionKey({ canonicalKind: 'series', title: 'Sobrenatural' });
const movieArtworkKey = buildArtworkResolutionKey({ canonicalKind: 'movie', title: 'Sobrenatural: Capítulo 2', year: 2014 });
assert.notEqual(seriesArtworkKey, movieArtworkKey, 'Series and Movie artwork keys must differ');
assert.equal(isArtworkKindSafeMatch(
  { canonicalKind: 'series', title: 'Sobrenatural' },
  { canonicalKind: 'movie', title: 'Sobrenatural: Capítulo 2', year: 2014 },
), false);

const importerSource = fs.readFileSync('src/source/real-source-importer.service.ts', 'utf8');
const tabletPipelineSource = fs.readFileSync('scripts/execute-r7c-r6d-tablet-pipeline.ts', 'utf8');
assert.match(importerSource, /parseM3uExtInfLine/);
assert.match(tabletPipelineSource, /parseM3uExtInfLine/);
assert.doesNotMatch(importerSource, /line\.match\(\/,\(\.\+\)\$\//);
assert.doesNotMatch(tabletPipelineSource, /line\.match\(\/,\(\.\+\)\$\//);
assert.match(importerSource, /categoryProvenance/);
assert.match(tabletPipelineSource, /categoryProvenance/);

function expectedHash(material) {
  return crypto.createHash('sha256').update(material).digest('hex').toUpperCase();
}

assert.equal(parserLock.M3U_EXTINF_STRUCTURAL_PARSE_LOCK_HASH, expectedHash(parserLock.M3U_EXTINF_STRUCTURAL_PARSE_LOCK_MATERIAL));
assert.equal(artworkLock.ARTWORK_KIND_ISOLATION_LOCK_HASH, expectedHash(artworkLock.ARTWORK_KIND_ISOLATION_LOCK_MATERIAL));
assert.equal(integrityLock.CATALOG_KIND_INTEGRITY_LOCK_HASH, expectedHash(integrityLock.CATALOG_KIND_INTEGRITY_LOCK_MATERIAL));

console.log('M3U_EXTINF_STRUCTURAL_PARSE_LOCK=PASS');
console.log('ARTWORK_KIND_ISOLATION_LOCK=PASS');
console.log('CATALOG_KIND_INTEGRITY_LOCK=PASS');
console.log('A_E_SENTINEL=LIVE_NOT_SERIES');
console.log('AMC_SENTINEL=LIVE_NOT_SERIES');
console.log('IT_SENTINEL=MOVIE_NO_SERIES_ENTITY');
console.log('BRESSAN_SENTINEL=TITLE_CLEAN');
console.log('SOBRENATURAL_SENTINEL=SERIES_ARTWORK_KIND_SAFE');
console.log('CATEGORY_PROVENANCE=PIPELINE_DERIVED_MIXED_FAIL_CLOSED');
console.log('R2F8_REAL_CATALOG_SEMANTICS_LOCK=PASS');

