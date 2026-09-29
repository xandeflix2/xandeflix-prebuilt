import { execSync } from 'child_process';
const adb = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const catStr = execSync(adb + ' -s G071CQ070344374G shell run-as com.xandeflix.prebuilt cat files/prebuilt/snapshots/snap-muje31lb/catalog.json').toString();
const catalog = JSON.parse(catStr);

function isCategoryForKind(category, kind, categoryProvenanceById, moviesByCategoryId, seriesByCategoryId) {
  if (/canais|live/i.test(category.id) || /^canais\b|^ao vivo\b/i.test(category.name)) {
    return false;
  }
  const prov = categoryProvenanceById.get(category.id);
  if (prov) {
    return prov.canonicalKind === kind;
  }
  if (category.contentKinds && category.contentKinds.length === 1) {
    return category.contentKinds[0] === kind;
  }
  const hasMovies = (moviesByCategoryId.get(category.id)?.length || 0) > 0;
  const hasSeries = (seriesByCategoryId.get(category.id)?.length || 0) > 0;
  if (hasMovies && !hasSeries) return kind === 'movie';
  if (hasSeries && !hasMovies) return kind === 'series';

  const isMovie = /filmes|vod|movie/i.test(category.id) || /^filmes?\b|^vod\b|^movie\b/i.test(category.name);
  const isSeries = /series|novelas|programas/i.test(category.id) || /^series?\b|^novelas?\b|^programas?\b/i.test(category.name);

  if (kind === 'movie') return isMovie && !isSeries;
  if (kind === 'series') return isSeries && !isMovie;

  return false;
}

const provMap = new Map();
const moviesByCat = new Map();
const seriesByCat = new Map();

for (const m of catalog.movies) {
  for (const c of m.categoryIds) {
    let list = moviesByCat.get(c);
    if (!list) { list = []; moviesByCat.set(c, list); }
    list.push(m);
  }
}
for (const s of catalog.series) {
  for (const c of s.categoryIds) {
    let list = seriesByCat.get(c);
    if (!list) { list = []; seriesByCat.set(c, list); }
    list.push(s);
  }
}

const movieCats = [];
const seriesCats = [];
for (const cat of catalog.categories) {
  if (isCategoryForKind(cat, 'movie', provMap, moviesByCat, seriesByCat)) movieCats.push(cat);
  if (isCategoryForKind(cat, 'series', provMap, moviesByCat, seriesByCat)) seriesCats.push(cat);
}

console.log('MOVIE_CATS:', movieCats.length, movieCats.map(c => c.name));
console.log('SERIES_CATS:', seriesCats.length, seriesCats.map(c => c.name));
