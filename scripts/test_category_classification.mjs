import { execSync } from 'child_process';
const adb = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const catStr = execSync(`"${adb}" -s G071CQ070344374G shell "run-as com.xandeflix.prebuilt cat files/prebuilt/snapshots/snap-muje31lb/catalog.json"`).toString();
const catalog = JSON.parse(catStr);

function classifyCategory(cat) {
  const isLive = /canais|live/i.test(cat.id) || /^canais\b|^ao vivo\b/i.test(cat.name);
  if (isLive) return 'live';
  const isMovie = /filmes|vod|movie/i.test(cat.id) || /^filmes?\b|^vod\b|^movie\b/i.test(cat.name);
  const isSeries = /series|novelas|programas/i.test(cat.id) || /^series?\b|^novelas?\b|^programas?\b/i.test(cat.name);
  if (isMovie && !isSeries) return 'movie';
  if (isSeries && !isMovie) return 'series';
  return 'unknown';
}

const movieCats = [];
const seriesCats = [];
const liveCats = [];
const unknownCats = [];

for (const c of catalog.categories) {
  const kind = classifyCategory(c);
  if (kind === 'movie') movieCats.push(c);
  else if (kind === 'series') seriesCats.push(c);
  else if (kind === 'live') liveCats.push(c);
  else unknownCats.push(c);
}

console.log('MOVIE_CATS_COUNT:', movieCats.length);
console.log('SERIES_CATS_COUNT:', seriesCats.length);
console.log('LIVE_CATS_COUNT:', liveCats.length);
console.log('UNKNOWN_CATS_COUNT:', unknownCats.length);
console.log('MOVIE_SAMPLE:', movieCats.slice(0, 3).map(c => c.name));
console.log('SERIES_SAMPLE:', seriesCats.slice(0, 3).map(c => c.name));
console.log('LIVE_SAMPLE:', liveCats.map(c => c.name));
