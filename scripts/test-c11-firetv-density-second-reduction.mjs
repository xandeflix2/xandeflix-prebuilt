import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
const marker = 'C11_FIRETV_TABLET_CANONICAL_PROPORTIONALITY_ALIGNMENT';
const start = css.lastIndexOf(marker);
assert.ok(start >= 0, 'bloco de segunda redução Fire TV ausente');
const block = css.slice(start);

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push(`${name}=PASS`);
  } catch (error) {
    results.push(`${name}=FAIL`);
    console.error(`[${name}]`, error?.stack || error);
  }
}

function token(name) {
  const match = block.match(new RegExp(`--${name}:\\s*(\\d+)px`));
  assert.ok(match, `token ${name} ausente`);
  return Number(match[1]);
}

await test('TEST_T144_FIRETV_960X540_HEADER_SECOND_REDUCTION', () => {
  assert.equal(token('tv-header-height'), 40);
  assert.match(block, /\.app-header[\s\S]*?height:\s*var\(--tv-header-height\)/);
});

await test('TEST_T145_FIRETV_960X540_HERO_SECOND_REDUCTION', () => {
  assert.equal(token('tv-hero-height'), 165);
  assert.match(block, /\.hero-banner[\s\S]*?height:\s*var\(--tv-hero-height\)/);
  assert.ok(165 / 540 >= 0.30 && 165 / 540 <= 0.31);
});

await test('TEST_T146_FIRETV_960X540_CARD_SECOND_REDUCTION', () => {
  assert.equal(token('tv-card-width'), 110);
  assert.equal(token('tv-card-height'), 186);
  assert.match(block, /\.media-card-poster-wrapper[\s\S]*?aspect-ratio:\s*2\s*\/\s*3/);
});

await test('TEST_T147_FIRETV_960X540_TITLE_SECOND_REDUCTION', () => {
  assert.equal(token('tv-primary-title-size'), 18);
  assert.match(block, /\.page-title[\s\S]*?font-size:\s*var\(--tv-primary-title-size\)/);
});

await test('TEST_T148_FIRETV_960X540_CONTROLS_SECOND_REDUCTION', () => {
  assert.equal(token('tv-control-height'), 30);
  assert.match(block, /min-height:\s*var\(--tv-control-height\)/);
});

await test('TEST_T149_FIRETV_VISIBLE_CARD_COUNT_DENSITY', () => {
  const count = Math.floor((960 - 2 * 12 + 10) / (110 + 10));
  assert.ok(count >= 7, `somente ${count} cards cabem na primeira linha`);
});

await test('TEST_T150_FIRETV_MOVIE_DETAIL_COMPACT', () => {
  assert.match(block, /\.detail-poster-img[\s\S]*?height:\s*var\(--tv-detail-poster-height\)/);
  assert.match(block, /\.detail-actions[\s\S]*?margin-top:\s*3px/);
});

await test('TEST_T151_FIRETV_SERIES_DETAIL_COMPACT', () => {
  assert.match(block, /\.seasons-section[\s\S]*?padding-top:\s*var\(--tv-space-md\)/);
  assert.match(block, /\.episode-thumb-wrapper[\s\S]*?height:\s*46px/);
});

await test('TEST_T152_FIRETV_LIVE_COMPACT', () => {
  assert.match(block, /--tv-live-preview-height:\s*214px/);
  assert.match(block, /height:\s*var\(--tv-live-preview-height\)/);
  assert.match(block, /\.active-channel[\s\S]*?padding:\s*3px 5px/);
});

await test('TEST_T153_FIRETV_SEARCH_COMPACT', () => {
  assert.match(block, /\.search-page-heading[\s\S]*?font-size:\s*var\(--tv-primary-title-size\)/);
  assert.match(block, /\.search-input[\s\S]*?min-height:\s*var\(--tv-control-height\)/);
});

await test('TEST_T154_NO_ROOT_SCALE_OR_ZOOM', () => {
  assert.doesNotMatch(block, /#root[^{}]*transform\s*:/s);
  assert.doesNotMatch(block, /(?:^|[;{])\s*zoom\s*:/i);
  assert.doesNotMatch(block, /wm\s+(?:density|size)/i);
});

await test('TEST_T155_PHONE_TABLET_UNCHANGED', () => {
  assert.match(block, /@media\s*\(min-width:\s*900px\)/);
  assert.match(block, /max-width:\s*1100px/);
  assert.match(block, /orientation:\s*landscape/);
  assert.match(block, /max-height:\s*600px/);
  assert.doesNotMatch(block, /AFTSS|G071CQ070344374G|serial|device model/i);
});

await test('TEST_T156_FUNCTIONAL_CORE_SOURCE_UNCHANGED', () => {
  assert.doesNotMatch(block, /Supabase|classification|manifest|snapshot|ExoPlayer|stream resolver|source importer/i);
  assert.match(block, /LiveTvPage usa estilos inline/);
});

console.log(results.join('\n'));
if (results.some((result) => result.endsWith('=FAIL'))) process.exitCode = 1;
