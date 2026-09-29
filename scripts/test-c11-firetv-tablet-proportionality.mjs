import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const css = await fs.readFile(new URL('../src/index.css', import.meta.url), 'utf8');
const marker = 'C11_FIRETV_TABLET_CANONICAL_PROPORTIONALITY_ALIGNMENT';
const start = css.lastIndexOf(marker);
assert.ok(start >= 0, 'bloco de proporcionalidade tablet/Fire TV ausente');
const block = css.slice(start);

const viewport = { width: 960, height: 540 };
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

function ratio(value, dimension) {
  return value / dimension;
}

await test('TEST_T157_FIRETV_TABLET_DENSITY_TOKEN_SYSTEM', () => {
  for (const name of [
    'tv-font-xs', 'tv-font-sm', 'tv-font-md', 'tv-font-lg',
    'tv-space-xs', 'tv-space-sm', 'tv-space-md', 'tv-space-lg',
    'tv-control-height', 'tv-chip-height', 'tv-page-gutter',
    'tv-card-width', 'tv-card-height', 'tv-header-height',
    'tv-detail-poster-width', 'tv-detail-poster-height',
    'tv-live-category-width', 'tv-live-channel-width',
  ]) token(name);
});

await test('TEST_T158_FIRETV_LIVE_THREE_PANE_PROPORTIONS', () => {
  const category = ratio(token('tv-live-category-width'), viewport.width);
  const channel = ratio(token('tv-live-channel-width'), viewport.width);
  const content = 1 - category - channel;
  assert.ok(category >= 0.16 && category <= 0.18, `categoria=${category}`);
  assert.ok(channel >= 0.23 && channel <= 0.25, `canais=${channel}`);
  assert.ok(content >= 0.57 && content <= 0.61, `conteúdo=${content}`);
});

await test('TEST_T159_FIRETV_COMMON_CATEGORY_LABELS_NOT_CLIPPED', () => {
  const pane = token('tv-live-category-width');
  const horizontalPadding = 12;
  const counterWidth = 18;
  const gap = 4;
  const availableTextWidth = pane - horizontalPadding - counterWidth - gap;
  const labels = [
    'CANAIS | GLOBO',
    'CANAIS | ESPORTES',
    'CANAIS | DOCUMENTARIOS',
    'CANAIS | NOTICIAS',
    'CANAIS | VARIEDADES',
    'CANAIS | ABERTOS',
    'CANAIS | RELIGIOSO',
  ];
  const conservativeGlyphWidth = 5.5;
  for (const label of labels) {
    assert.ok(label.length * conservativeGlyphWidth <= availableTextWidth, `${label} excede ${availableTextWidth}px`);
  }
  assert.match(block, /min-width:\s*18px/);
  assert.match(block, /font-size:\s*var\(--tv-font-xs\)/);
});

await test('TEST_T160_FIRETV_LIVE_ROW_DENSITY_TABLET_EQUIVALENT', () => {
  const row = token('tv-live-category-row-height');
  const availableHeight = viewport.height - token('tv-header-height') - token('tv-toolbar-height');
  assert.ok(Math.floor(availableHeight / (row + 2)) >= 14);
});

await test('TEST_T161_FIRETV_CHANNEL_ROW_DENSITY_TABLET_EQUIVALENT', () => {
  const row = token('tv-live-channel-row-height');
  const availableHeight = viewport.height - token('tv-header-height') - token('tv-toolbar-height') - 42;
  assert.ok(Math.floor(availableHeight / (row + 2)) >= 10);
  assert.match(block, /width:\s*24px/);
  assert.match(block, /height:\s*24px/);
});

await test('TEST_T162_FIRETV_PREVIEW_TABLET_PROPORTIONAL', () => {
  const width = token('tv-live-preview-width');
  const height = token('tv-live-preview-height');
  assert.ok(Math.abs(width / height - 16 / 9) < 0.02);
  assert.ok(ratio(width, viewport.width) < 0.42);
  assert.ok(ratio(height, viewport.height) < 0.41);
  assert.match(block, /aspect-ratio:\s*16\s*\/\s*9/);
});

await test('TEST_T163_FIRETV_DOUBLE_HEADER_COMPACT', () => {
  assert.equal(token('tv-header-height'), 40);
  assert.equal(token('tv-toolbar-height'), 38);
  assert.ok(ratio(40 + 38, viewport.height) <= 0.15);
});

await test('TEST_T164_FIRETV_EPG_FIRST_FOLD_DENSITY', () => {
  const fixedHeight = token('tv-header-height') + token('tv-toolbar-height') + 34 + token('tv-live-preview-height');
  assert.ok(fixedHeight < viewport.height - 120, `EPG não começa na primeira dobra: ${fixedHeight}px`);
  assert.match(block, /div:nth-child\(3\) > div:nth-child\(2\) \{[\s\S]*?padding:\s*6px 8px/);
});

await test('TEST_T165_FIRETV_HOME_TABLET_PROPORTIONAL', () => {
  assert.equal(token('tv-hero-height'), 165);
  assert.ok(ratio(token('tv-hero-height'), viewport.height) <= 0.31);
  assert.equal(token('tv-card-width'), 110);
  assert.equal(token('tv-card-height'), 186);
});

await test('TEST_T166_FIRETV_MOVIES_TABLET_PROPORTIONAL', () => {
  const visible = Math.floor((viewport.width - 2 * token('tv-page-gutter') + token('tv-space-md')) / (token('tv-card-width') + token('tv-space-md')));
  assert.ok(visible >= 7, `${visible} cards visíveis`);
  assert.match(block, /grid-template-columns:\s*repeat\(auto-fill,\s*var\(--tv-card-width\)\)/);
});

await test('TEST_T167_FIRETV_SERIES_TABLET_PROPORTIONAL', () => {
  assert.match(block, /\.media-card-title \{ font-size:\s*var\(--tv-font-xs\)/);
  assert.match(block, /\.filter-chip,[\s\S]*?min-height:\s*var\(--tv-chip-height\)/);
});

await test('TEST_T168_FIRETV_MOVIE_DETAIL_TABLET_PROPORTIONAL', () => {
  assert.equal(token('tv-detail-poster-width'), 110);
  assert.equal(token('tv-detail-poster-height'), 165);
  assert.ok(ratio(token('tv-detail-poster-height'), viewport.height) <= 0.31);
});

await test('TEST_T169_FIRETV_SERIES_DETAIL_TABLET_PROPORTIONAL', () => {
  assert.match(block, /\.episode-thumb-wrapper \{ flex:\s*0 0 82px/);
  assert.match(block, /\.episode-thumb-wrapper[\s\S]*?height:\s*46px/);
  assert.match(block, /\.seasons-section \{ padding-top:\s*var\(--tv-space-md\)/);
});

await test('TEST_T170_FIRETV_SEARCH_TABLET_PROPORTIONAL', () => {
  assert.match(block, /\.search-input \{ font-size:\s*var\(--tv-font-md\)[\s\S]*?min-height:\s*var\(--tv-control-height\)/);
  assert.match(block, /\.search-state-container \{ padding:\s*18px/);
});

await test('TEST_T171_FIRETV_FOCUS_WITHOUT_LAYOUT_INFLATION', async () => {
  const livePage = await fs.readFile(new URL('../src/ui/pages/LiveTvPage.tsx', import.meta.url), 'utf8');
  assert.match(livePage, /focusable-item/);
  assert.doesNotMatch(block, /\.focusable-item[^{}]*\{[^}]*transform\s*:/s);
  assert.doesNotMatch(block, /\.focusable-item[^{}]*\{[^}]*scale\s*\(/s);
});

await test('TEST_T172_FIRETV_NO_ROOT_SCALE_ZOOM', () => {
  assert.doesNotMatch(block, /#root[^{}]*\{[^}]*transform\s*:/s);
  assert.doesNotMatch(block, /(?:^|[;{])\s*zoom\s*:/i);
  assert.doesNotMatch(block, /wm\s+(?:density|size)/i);
});

await test('TEST_T173_TABLET_LAYOUT_BYTE_OR_SEMANTIC_REGRESSION_GUARD', () => {
  assert.match(block, /@media\s*\(min-width:\s*900px\)/);
  assert.match(block, /max-width:\s*1100px/);
  assert.match(block, /max-height:\s*600px/);
  assert.match(block, /min-aspect-ratio:\s*16\/10/);
});

await test('TEST_T174_PHONE_LAYOUT_REGRESSION_GUARD', () => {
  assert.doesNotMatch(block, /max-width:\s*600px/);
  assert.doesNotMatch(block, /AFTSS|G071CQ070344374G|serial|device model/i);
});

await test('TEST_T175_FUNCTIONAL_CORE_UNCHANGED', async () => {
  const livePage = await fs.readFile(new URL('../src/ui/pages/LiveTvPage.tsx', import.meta.url), 'utf8');
  assert.match(livePage, /DPAD_NAVIGATION_READY/);
  assert.match(livePage, /getPreviewBounds/);
  assert.doesNotMatch(block, /Supabase|classification|manifest|snapshot|source importer|stream resolver/i);
});

console.log(results.join('\n'));
if (results.some((result) => result.endsWith('=FAIL'))) process.exitCode = 1;
