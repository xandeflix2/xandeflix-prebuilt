import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as heroService from '../src/catalog/home-hero.service.ts';
import { MemoryHomeHeroRepository } from '../src/catalog/home-hero.repository.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';
import { seriesToViewModel } from '../src/catalog/catalog-selectors.ts';

const year = new Date().getFullYear();
const rows = kind => Array.from({length: 18}, (_, i) => ({id: `${kind}-${i}`, title: `${kind} fixture ${i}`,
  year, categoryIds: ['launch'], genreIds: [], artworkIds: [], streamIds: [], seasonIds: []}));
const model = new CatalogReadModel({metadata: {snapshotId: 'typed-hero', counts: {}}, movies: rows('movie'),
  series: rows('series'), seasons: [], episodes: [], streams: [], artworks: [], genres: [],
  categories: [{id: 'launch', name: 'Lançamentos', contentKinds: ['movie', 'series']}]});
let reads = 0;
const storage = {async readActiveManifest(){reads++; return {snapshotId: 'typed-hero'};},
  async readActivePointer(){return {snapshotId: 'typed-hero'};}};
const repository = new MemoryHomeHeroRepository(2000), picked = [];
const originalPick = repository.pick.bind(repository);
repository.pick = (...args) => {picked.push(args[3]); return originalPick(...args);};
const service = new heroService.HomeHeroService(repository, async()=>null, false);
await service.prepare(model, storage, year, new AbortController().signal);
for (const kind of ['movie','series']) {
  picked.length = 0;
  const first = await service.options(year, undefined, kind);
  assert.equal(first.length, 5);
  assert.ok(first.every(option=>option.item.kind===kind));
  assert.ok(picked.every(entry=>entry===kind), 'query only the requested kind');
  const second = await service.options(year, new Set(first.map(option=>option.key)), kind);
  assert.equal(second.length, 5);
  assert.ok(second.every(option=>option.item.kind===kind && !first.some(old=>old.key===option.key)));
}
const mixed = await service.options(year);
assert.equal(mixed.filter(option=>option.item.kind==='movie').length, 5);
assert.equal(mixed.filter(option=>option.item.kind==='series').length, 5);
await service.prepare(model, storage, year, new AbortController().signal);
assert.equal(reads, 2, 'reuses committed generation without rescanning rows');
console.log('PASS_TYPED_REPOSITORY_BATCHES_EXCLUSION_AND_HOME_MIXED_DEFAULT');

// Execute the actual selection hook/wrapper/carousel with isolated presentation ports.
const require = createRequire(import.meta.url), modules = new Map();
const recent = [seriesToViewModel(model, {...model.catalog.series[0], id: 'recent-episode'})];
let selectedProps, captured;
function load(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
  const module = {exports:{}};
  new Function('require','module','exports',code)(name=>{
    if(name.endsWith('home-hero.service.ts'))return heroService;
    if(name.endsWith('useSeriesHighlights.ts'))return {useSeriesHighlights:()=>recent};
    if(name.endsWith('useHeroLayout.ts'))return {useHeroLayout:()=>false};
    if(name.endsWith('useHeroPlayback.ts'))return {useHeroPlayback:()=>({onPlay(){},playbackBusy:false,playbackMessage:null})};
    if(name.endsWith('usePhoneLayout.ts'))return {usePhoneLayout:()=>false};
    if(name.endsWith('useHeroArtwork.ts'))return {useHeroArtwork:items=>({eligible:items.map(item=>({item,uri:'synthetic'})),revision:0,pending:false})};
    if(name.endsWith('CategoryHero.tsx'))return {HeroPreparing:()=>React.createElement('p',null,'empty')};
    if(name==='./Hero.tsx')return {Hero:props=>{selectedProps=props;return React.createElement('h'+props.headingLevel,null,props.item.title);}};
    if(name.endsWith('useHomeHero.ts'))return load('../src/ui/hooks/useHomeHero.ts');
    if(name.endsWith('HomeHero.tsx'))return load('../src/ui/components/HomeHero.tsx');
    return require(name);
  }, module, module.exports);
  modules.set(relative, module.exports);return module.exports;
}
const {useHomeHero} = load('../src/ui/hooks/useHomeHero.ts');
function Capture({kind}) {captured=useHomeHero(model,storage,kind);return null;}
for (const kind of ['movie','series']) {
  renderToStaticMarkup(React.createElement(Capture,{kind}));
  assert.ok(captured.candidates.length>=5);
  assert.ok(captured.candidates.every(option=>option.item.kind===kind));
  assert.equal(captured.candidates.some(option=>option.item.id==='recent-episode'),kind==='series');
}
renderToStaticMarkup(React.createElement(Capture));
assert.ok(captured.candidates.some(option=>option.item.kind==='movie')&&captured.candidates.some(option=>option.item.kind==='series'));
const {BrowseHero} = load('../src/ui/components/BrowseHero.tsx');
const markup = renderToStaticMarkup(React.createElement(BrowseHero,{readModel:model,storage,contentKind:'movie',onSelect(){}}));
assert.ok(markup.includes('aria-label="Destaques de filmes"'));
assert.equal(selectedProps.item.kind,'movie');assert.equal(selectedProps.headingLevel,2);
const {HomeHero} = load('../src/ui/components/HomeHero.tsx');
renderToStaticMarkup(React.createElement(HomeHero,{options:mixed,contentKind:'series',nextBatch:async()=>false,displayed(){},onSelect(){}}));
assert.equal(selectedProps.item.kind,'series','defensive filter before artwork/select');
console.log('PASS_REAL_HOOK_TYPED_FALLBACK_EXTRAS_SERIES_PRIORITY_WRAPPER_AND_DEFENSIVE_CAROUSEL');

const page=readFileSync(new URL('../src/ui/pages/CatalogBrowsePage.tsx',import.meta.url),'utf8');
assert.match(page,/!collection \? <BrowseHero/);assert.match(page,/contentKind=\{movie \? 'movie' : 'series'\}/);
assert.match(page,/: category && <CategoryHero/,'category filters stay scoped');
console.log('C91_BROWSE_DYNAMIC_HERO=PASS');
