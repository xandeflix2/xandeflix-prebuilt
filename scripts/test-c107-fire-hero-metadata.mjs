import {parentalFixtureBindings} from './lib/parental-fixture-bindings.mjs';
import {meaningfulDetailGenres} from '../src/ui/detail-genres.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const load=(file,require,ports={})=>{const module={exports:{}};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',...Object.keys(ports),js)((name => parentalFixtureBindings(name) ?? (require)(name)),module,module.exports,...Object.values(ports));return module.exports;};
const presentation=load('src/ui/device-presentation.ts',()=>({}));
let choice='TV',ua='Android AFTSS',metadata=null,badge='NOVIDADE',request,landscape=true,tabletPortrait=false,squareLive=false;
const navigator={get userAgent(){return ua;},maxTouchPoints:0};
const hooks={...React,useRef:value=>({current:value}),useState:value=>[typeof value==='function'?value():value,()=>{}],useEffect(){}};
const {Hero}=load('src/ui/components/Hero.tsx',name=>{
 if(name.endsWith('detail-genres.ts'))return{meaningfulDetailGenres};
 if(name==='react')return hooks;
 if(name.includes('useDevicePresentation'))return{useDevicePresentation:()=>choice};
 if(name.endsWith('device-presentation.ts'))return presentation;
 if(name.includes('NewContentProvider'))return{useContentBadge:()=>badge};
 if(name.includes('useImmersiveArtwork'))return{useImmersiveArtwork:()=>null};
 if(name.includes('useCachedArtwork'))return{useCachedArtwork:src=>({src,handleCacheError:()=>false})};
 if(name.includes('useArtworkMetadata'))return{useArtworkMetadata:(identity,enabled)=>{request={identity,enabled};return metadata;}};
 if(name.includes('PlatformCategoryBadge'))return{PlatformCategoryLogo:({label})=>label};
 if(name.includes('tmdb-metadata.service'))return{tmdbPosterPath:()=>undefined};
 return{};
},{navigator});
const find=(tree,predicate)=>{if(!tree)return;if(Array.isArray(tree)){for(const child of tree){const hit=find(child,predicate);if(hit)return hit;}return;}if(typeof tree!=='object')return;if(predicate(tree))return tree;return find(tree.props?.children,predicate);};
const byClass=(tree,name)=>find(tree,n=>n.props?.className?.split(' ').includes(name));
const item=(kind='series',genres=['Geral'],categories=['NETFLIX'])=>Object.freeze({id:'fixture:'+kind,kind,title:'Título sintético',yearFormatted:'2026',durationFormatted:'42 min',overviewSnippet:'Sinopse local',genreLabels:Object.freeze(genres),categoryLabels:Object.freeze(categories)});
const render=(value,extra={})=>Hero({item:value,artworkUri:'data:image/svg+xml,synthetic',onSelect(){},onPlay(){},...extra});
let tests=0;
function test(name,run){run();tests++;console.log('PASS '+name);}
test('FIRE_GENERIC_GENRE_DOES_NOT_SUPPRESS_EXISTING_OPTIONAL_ENRICHMENT',()=>{
 for(const genres of [['Geral'],[' geral '],[]]){
  metadata={genres:['Drama','Comédia']};const value=item('series',genres),tree=render(value);
  assert.equal(request.enabled,true);assert.equal(request.identity.title,value.title);
  assert.equal(byClass(tree,'hero-genres').props.children,'Drama • Comédia');
  assert.deepEqual(value.genreLabels,genres);
 }
});
test('REAL_SOURCE_GENRE_REMAINS_AUTHORITATIVE_AND_GENERIC_VALUE_IS_REMOVED',()=>{
 metadata={genres:['Ação']};const tree=render(item('series',['Geral','Drama']));
 assert.equal(request.enabled,false);assert.equal(byClass(tree,'hero-genres').props.children,'Drama');
});
test('MISSING_REAL_GENRE_NEVER_INVENTS_DATA_OR_BLOCKS_ACTIONS',()=>{
 for(const value of [null,{genres:['Geral']}]){
  metadata=value;const row=item(),selected=[],played=[],tree=render(row,{onSelect:r=>selected.push(r),onPlay:r=>played.push(r)});
  assert.equal(byClass(tree,'hero-genres'),undefined);
  byClass(tree,'hero-btn-primary').props.onClick();byClass(tree,'hero-btn-play').props.onClick();
  assert.equal(selected[0],row);assert.equal(played[0],row);
  assert.equal(byClass(tree,'hero-backdrop-img').props.src,'data:image/svg+xml,synthetic');
 }
});
test('CONTENT_CATEGORY_IS_LOCAL_ADJACENT_TO_NOVELTY_FOR_SERIES_AND_MOVIES',()=>{
 metadata=null;badge='NOVIDADE';const tree=render(item('series',['Drama'],['','Geral','Prime Video']));
 const labels=byClass(tree,'hero-meta').props.children.filter(Boolean);
 assert.equal(labels[1].props.children,'NOVIDADE');assert.equal(labels[2].props['aria-label'],'Prime Video');
 assert.equal(byClass(render(item('movie')),'hero-category-badge').props['aria-label'],'NETFLIX');
 assert.equal(byClass(render(item('series',[],['Geral'])),'hero-category-badge'),undefined);
 badge=undefined;const noNovelty=render(item());assert.equal(byClass(noNovelty,'hero-category-badge').props['aria-label'],'NETFLIX');
 assert.equal(renderToStaticMarkup(noNovelty).includes('NOVIDADE'),false);badge='NOVIDADE';
});
test('CATEGORY_ESCAPED_BOUNDED_AND_CURRENT_ITEM_REPLACES_OLD_VALUES',()=>{
 const one=render(item('series',[],['<b>NETFLIX</b>']));assert.ok(renderToStaticMarkup(one).includes('&lt;b&gt;NETFLIX&lt;/b&gt;'));
 assert.equal(byClass(render(item('series',[],['A'.repeat(150)])),'hero-category-badge').props['aria-label'].length,100);
 const two=render(item('series',['Comédia'],['Prime Video']));assert.equal(byClass(two,'hero-category-badge').props['aria-label'],'Prime Video');assert.equal(byClass(two,'hero-genres').props.children,'Comédia');
});
test('ALL_PROFILES_SHOW_CATEGORY_AND_REPLACE_GENERAL_WITH_REAL_GENRES',()=>{
 metadata={genres:['Drama']};
 for(const [profile,agent]of [['PHONE','Android Mobile'],['TABLET','Android Tablet'],['TV','Android TV'],[null,'Tizen'],[null,'webOS'],['TABLET','Android AFTSS']]){
  choice=profile;ua=agent;const tree=render(item());assert.equal(request.enabled,true);
  assert.equal(byClass(tree,'hero-genres').props.children,'Drama');assert.equal(byClass(tree,'hero-category-badge').props['aria-label'],'NETFLIX');
  assert.equal(byClass(render(item('movie')),'hero-category-badge').props['aria-label'],'NETFLIX');
 }
});
test('SERIES_PREFIX_REMOVED_WITHOUT_MUTATING_LOCAL_CATEGORY_OR_INVENTING_PLATFORM',()=>{
 for(const [profile,agent]of [['PHONE','Android Mobile'],['TABLET','Android Tablet'],['TV','Android AFTSS'],['TV','Android TV'],[null,'Tizen'],[null,'webOS']]){
  choice=profile;ua=agent;
  for(const [raw,expected]of [['SERIES | NETFLIX','NETFLIX'],[' Séries | Prime Video ','Prime Video'],['series|HBO','HBO'],['Netflix','Netflix'],['Outras séries | HBO','Outras séries | HBO']]){
   const value=item('series',['Drama'],['SÉRIES |','series | Geral',raw]),tree=render(value);
   assert.equal(byClass(tree,'hero-category-badge').props['aria-label'],expected);
   assert.deepEqual(value.categoryLabels,['SÉRIES |','series | Geral',raw]);
  }
  assert.equal(byClass(render(item('series',[],['Séries |','series | Geral'])),'hero-category-badge'),undefined);
 }
});
test('MOVIE_PREFIX_REMOVED_AND_SHARED_PLATFORM_COMPONENT_USED_WITHOUT_GUESS',()=>{
 for(const kind of ['movie','series'])for(const [raw,expected]of [['FILMES | NETFLIX','NETFLIX'],['Filmes|Prime Video','Prime Video'],['Séries | HBO','HBO'],['Filmes | Lançamentos','Lançamentos']]){
  const value=item(kind,['Drama'],[raw]),tree=render(value),category=byClass(tree,'hero-category-badge');
  assert.equal(category.props['aria-label'],expected);assert.equal(category.props.children.props.label,expected);assert.deepEqual(value.categoryLabels,[raw]);
 }
 assert.equal(byClass(render(item('movie',[],['Filmes |','Filmes | Geral'])),'hero-category-badge'),undefined);
});

const header=load('src/ui/components/Header.tsx',name=>name==='react'?React:{});
const {AppShell}=load('src/ui/components/AppShell.tsx',name=>{
 if(name==='react')return{...React,useEffect:()=>{}};
 if(name.includes('Header.tsx'))return header;
 if(name.includes('useLandscapeNavigation'))return{useLandscapeNavigation:()=>landscape};
 if(name.includes('useDevicePresentation'))return{useDevicePresentation:()=>choice};
 if(name.includes('useLivePresentation'))return{useLivePresentation:()=>({tabletPortrait,stackedLive:false,squareLive})};
 if(name.endsWith('device-presentation.ts'))return presentation;
 if(name.includes('CastButton'))return{CastButton:()=>React.createElement('span',{'data-cast-fixture':true})};
 return{};
},{navigator});
const shell=view=>AppShell({currentView:view,onNavigate(){},onBack(){},canGoBack:true,children:React.createElement('main',null,'Fixture')});
test('REMOTE_TV_DOMAIN_HAS_NO_TOP_BACK_BUTTON_ALL_SUPPORTED_TV_PROFILES',()=>{
 for(const [profile,agent]of [['TV','Android AFTSS'],['TV','Android TV'],[null,'Tizen'],[null,'webOS']]){
  choice=profile;ua=agent;landscape=true;tabletPortrait=false;
  for(const route of ['movies','series','movie-detail','series-detail']){
   const html=renderToStaticMarkup(shell(route));assert.equal(html.includes('Voltar para a tela anterior'),false);assert.equal(html.includes('page-back-row'),false);
  }
  assert.equal(renderToStaticMarkup(shell('search')).includes('Voltar para a tela anterior'),true);
 }
});
test('TOUCH_BACK_RETAINED_AND_EXISTING_BACK_CALLBACK_STILL_PASSED',()=>{
 for(const profile of ['PHONE','TABLET']){
  choice=profile;ua='Android Mobile';landscape=profile==='TABLET';tabletPortrait=false;
  for(const route of ['movies','series','movie-detail','series-detail'])assert.equal(renderToStaticMarkup(shell(route)).includes('Voltar para a tela anterior'),true);
 }
 choice='TV';ua='Android AFTSS';landscape=true;const tree=shell('movie-detail');
 const headerElement=find(tree,n=>n.type===header.Header);assert.equal(typeof headerElement.props.onBack,'function');
});
test('EXISTING_SQUARE_DECISION_MARKS_HERO_PAGES_WITHOUT_CHANGING_LIVE_RULE',()=>{
 choice='PHONE';ua='Android Mobile';squareLive=true;
 for(const route of ['home','movies','series']){const tree=shell(route);assert.ok(tree.props.className.includes('app-shell--square-display'));assert.equal(tree.props.className.includes('app-shell--live-square'),false);}
 assert.ok(shell('live').props.className.includes('app-shell--live-square'));
 squareLive=false;assert.equal(shell('home').props.className.includes('app-shell--square-display'),false);
});
console.log(JSON.stringify({tests,pass:true,fixtureOnly:true,networkRequests:0}));
