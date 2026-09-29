import { execSync } from 'child_process';
const adb = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const manifestStr = execSync(`"${adb}" -s G071CQ070344374G shell "run-as com.xandeflix.prebuilt cat files/prebuilt/snapshots/snap-muje31lb/manifest.json"`).toString();
const manifest = JSON.parse(manifestStr);
const movieSegments = manifest.segments.filter(s => s.kind === 'movies');
console.log('MOVIE_SEGMENTS_COUNT:', movieSegments.length);

const catCounts = new Map();
let total = 0;
for (const seg of movieSegments) {
  const content = execSync(`"${adb}" -s G071CQ070344374G shell "run-as com.xandeflix.prebuilt cat files/prebuilt/snapshots/snap-muje31lb/segments/${seg.fileName}"`).toString();
  const list = JSON.parse(content);
  total += list.length;
  for (const m of list) {
    for (const c of m.categoryIds) {
      catCounts.set(c, (catCounts.get(c) || 0) + 1);
    }
  }
}
console.log('TOTAL_MOVIES:', total);
console.log('TOTAL_MOVIE_CATEGORIES:', catCounts.size);
for (const [k, v] of catCounts) {
  console.log(k, v);
}

const seriesSegments = manifest.segments.filter(s => s.kind === 'series');
console.log('SERIES_SEGMENTS_COUNT:', seriesSegments.length);
const seriesCatCounts = new Map();
let totalSeries = 0;
for (const seg of seriesSegments) {
  const content = execSync(`"${adb}" -s G071CQ070344374G shell "run-as com.xandeflix.prebuilt cat files/prebuilt/snapshots/snap-muje31lb/segments/${seg.fileName}"`).toString();
  const list = JSON.parse(content);
  totalSeries += list.length;
  for (const s of list) {
    for (const c of s.categoryIds) {
      seriesCatCounts.set(c, (seriesCatCounts.get(c) || 0) + 1);
    }
  }
}
console.log('TOTAL_SERIES:', totalSeries);
console.log('TOTAL_SERIES_CATEGORIES:', seriesCatCounts.size);
for (const [k, v] of seriesCatCounts) {
  console.log(k, v);
}
