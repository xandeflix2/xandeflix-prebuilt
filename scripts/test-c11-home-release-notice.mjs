import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { isReleaseCategory } from '../src/catalog/category-presentation.ts';
import { prioritizeSeries } from '../src/catalog/series-content-updates.ts';

function load(file, imports) {
  const module={exports:{}};
  const output=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
  new Function('require','module','exports','window','document','HTMLElement',output)(name=>{
    if(name.includes('useHeroPlayback'))return {useHeroPlayback:()=>({})};
    if(name.includes('FavoriteTitles'))return {FavoriteTitles:()=>null};
    if(name.includes('startup-catalog-preview'))return {selectStartupPosters:()=>[]};
    if(name.includes('useFeaturedRotation'))return {useFeaturedRotation:model=>({movies:model.catalog.movies.slice(0,20),series:model.catalog.series.slice(0,20)})};
    if(name==='@capacitor/browser')return {Browser:{}};
    if(name.includes('usePhoneLayout'))return {usePhoneLayout:()=>true};
    if(name.includes('playback-support-profile'))return {canUsePlaybackWhatsapp:()=>false};
    if(name.includes('google-cast'))return {hasGoogleCast:()=>false,GoogleCast:{}};
    if(['multi-device-contact.service','playback-support-diagnostic','playback-error-report.service','dpad-error-controls'].some(part=>name.includes(part)))return {};
    for(const [key,value] of Object.entries(imports))if(name.includes(key))return value;
    throw Error('Unexpected dependency: '+name);
  },module,module.exports,imports.window,{activeElement:null},class{});
  return module.exports;
}
const passive={...React,useMemo:fn=>fn(),useRef:()=>({current:null}),useState:value=>[value,()=>{}]};
const marker=name=>Object.assign(()=>null,{displayName:name}), Rail=marker('Rail'), Category=marker('Category'), Recent=marker('Recent');
const imports={react:passive,'category-presentation':{isReleaseCategory},'catalog-selectors':{movieToViewModel:(_,item)=>({...item,categoryLabels:[]}),seriesToViewModel:(_,item)=>({...item,categoryLabels:[]})},
  'segmented-browse.service':{SegmentedBrowseService:class{}},'bootstrap/client':{getClientBootstrapService:()=>({getStorage:()=>({})})},
  useCategoryPreviews:{useCategoryPreviews:()=>undefined},useHomeHero:{useHomeHero:()=>({})},HomeHero:{HomeHero:marker('Hero')},RecentTitles:{RecentTitles:Recent},
  useSeriesHighlights:{useSeriesHighlights:()=>[]},'series-content-updates':{prioritizeSeries},
  MediaRail:{MediaRail:Rail},AsyncCategoryRail:{AsyncCategoryRail:Category,SimpleRailQueue:class{}},EmptyState:{EmptyState:marker('Empty')},StartupArtworkPreparation:{StartupArtworkPreparation:marker('Startup')},
};
const {HomePage}=load('src/ui/pages/HomePage.tsx',imports);
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
const categories=[{id:'first',name:'Filmes | Acao'},{id:'other',name:'Filmes | Comedia'},{id:'release',name:'Filmes | Lan\u00e7amentos'},{id:'last',name:'Filmes | Drama'}];
function home(cats){const items=kind=>Array.from({length:30},(_,n)=>({id:String(n),kind,title:`Synthetic ${kind} ${n}`}));const model={catalog:{metadata:{snapshotId:'fixture'},movies:items('movie'),series:items('series')},moviesByCategoryId:new Map(),seriesByCategoryId:new Map(),getCategoriesForKind:kind=>kind==='movie'?cats:[{id:'series',name:'Series | Netflix'}]};return elements(HomePage({readModel:model,onSelectItem(){},onSelectCategory(){},onSelectCollection(){}}));}
const nodes=home(categories),rows=nodes.filter(n=>n.type===Rail||n.type===Category||n.type===Recent);
assert.equal(rows[0].props.categoryId,'release');
assert.equal(rows[1].type,Recent);
assert.equal(rows[2].props.title,'Filmes em Destaque');
assert.equal(rows[3].props.title,'S\u00e9ries em Destaque');
assert.deepEqual(rows.filter(n=>n.props.kind==='movies').map(n=>n.props.categoryId),['release','first','other','last']);
assert.equal(new Set(rows.filter(n=>n.props.kind==='movies').map(n=>n.props.categoryId)).size,categories.length);
assert.deepEqual(categories.map(c=>c.id),['first','other','release','last'],'canonical category array unchanged');
assert.equal(rows[2].props.items.length,20);assert.equal(rows[3].props.items.length,20);
assert.equal(rows[0].props.startupArtworkCount,0);
assert.deepEqual(home(categories.filter(c=>c.id!=='release')).filter(n=>n.props?.kind==='movies').map(n=>n.props.categoryId),['first','other','last']);
console.log('PASS_REAL_HOME_RELEASE_RECENT_MOVIE_SERIES_DESTAQUE_NO_DUPLICATES_CANONICAL_ORDER_AND_QUOTAS_PRESERVED');

let now=0,nextId=0,ri=0,ei=0;
const refs=[],effects=[],timers=new Map();
const window={addEventListener(){},removeEventListener(){},setTimeout(fn,delay){const id=++nextId;timers.set(id,{fn,at:now+delay,delay});return id;},clearTimeout(id){timers.delete(id);}};
const react={...React,useState:value=>[value,()=>{}],useRef(value){const n=ri++;return refs[n]??(refs[n]={current:value});},useEffect(fn,deps){const n=ei++,prior=effects[n];if(!prior||deps.some((v,i)=>!Object.is(v,prior.deps[i]))){prior?.cleanup?.();effects[n]={deps,fn,changed:true};}}};
const {PlaybackErrorNotice}=load('src/ui/components/PlaybackErrorNotice.tsx',{react,window});
function render(message,onDismiss){ri=ei=0;const tree=PlaybackErrorNotice({message,onDismiss});for(const effect of effects)if(effect.changed){effect.changed=false;effect.cleanup=effect.fn();}return tree;}
function advance(ms){now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}}
let first=0,latest=0;
assert.equal(render(null,()=>first++),null);assert.equal(timers.size,0);
let tree=render('Error one',()=>first++);assert.equal(timers.size,1);assert.equal([...timers.values()][0].delay,10000);
advance(9999);assert.equal(first,0);
render('Error one',()=>latest++);assert.equal(timers.size,1);assert.equal([...timers.values()][0].at,10000,'ordinary rerender does not postpone notice');
advance(1);assert.equal(first,0);assert.equal(latest,1,'timer uses current callback');
render('Error two',()=>latest++);advance(5000);render('Error three',()=>latest++);advance(5000);assert.equal(latest,1,'old timer cancelled for new message');
advance(4999);assert.equal(latest,1);advance(1);assert.equal(latest,2);
tree=render('Error four',()=>latest++);tree.props.children[1].props.onClick();assert.equal(latest,3,'manual close uses supplied callback');render(null,()=>latest++);advance(10000);assert.equal(latest,3);
render('Error five',()=>latest++);for(const effect of effects)effect.cleanup?.();advance(10000);assert.equal(latest,3,'unmount cancels timer');assert.equal(timers.size,0);
console.log('PASS_REAL_NOTICE_10_SECONDS_LATEST_CALLBACK_NO_RERENDER_EXTENSION_NEW_NOTICE_RESET_MANUAL_CLOSE_AND_UNMOUNT');
