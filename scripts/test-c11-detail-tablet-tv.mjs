import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
function harness(path,bindings={}) {
  let cursor=0,updates=0;
  const values=[],refs=[],effects=new Map(),pending=[];
  const effect=(callback,deps)=>{
    const index=cursor++,old=effects.get(index);
    if(old&&deps&&deps.every((value,n)=>Object.is(value,old.deps[n])))return;
    pending.push(()=>{old?.cleanup?.();effects.set(index,{deps,cleanup:callback()});});
  };
  const hooks={...React,useState:initial=>{
    const index=cursor++;if(!(index in values))values[index]=typeof initial==='function'?initial():initial;
    return [values[index],next=>{updates++;values[index]=typeof next==='function'?next(values[index]):next;}];
  },useRef:initial=>{const index=cursor++;return refs[index]||= {current:initial};},useEffect:effect,useLayoutEffect:effect,useCallback:value=>value};
  const require=name=>name==='react'?{default:hooks,...hooks}:bindings[name]||(()=>{throw Error('Missing controlled port: '+name);})();
  const module={exports:{}};
  new Function('require','module','exports',ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText)(require,module,module.exports);
  return {exports:module.exports,render(name,props){cursor=0;return module.exports[name](props);},effects(){while(pending.length)pending.shift()();},cleanup(){for(const effect of effects.values())effect.cleanup?.();effects.clear();},get updates(){return updates;}};
}
const stub=tag=>props=>React.createElement(tag,{'data-kind':props.kind,'data-icon-only':props.iconOnly===true?'yes':undefined});
const nodes=tree=>{
  const list=[];const walk=node=>{if(!React.isValidElement(node))return;list.push(node);React.Children.forEach(node.props.children,walk);};walk(tree);return list;
};
const buttons=tree=>nodes(tree).filter(node=>node.type==='button');

let retry=0;
const sections=harness('src/ui/components/SeriesDetailSections.tsx',{
  './RelatedTitles.tsx':{RelatedTitles:stub('related')},
});
const props={seriesId:'series-one',readModel:{},episodes:React.createElement('p',null,'REAL EPISODE PANEL'),episodesFailed:false,onRetryEpisodes:()=>retry++,onSelectItem:()=>{}};
let tree=sections.render('SeriesDetailSections',props),html=renderToStaticMarkup(tree);
assert.ok(!html.includes('<personal')&&html.indexOf('role="tablist"')<html.indexOf('role="tabpanel"'));
assert.match(html,/REAL EPISODE PANEL/);assert.ok(!html.includes('<related'));assert.match(html,/aria-labelledby="series-detail-series-one-episodes"/);
buttons(tree)[1].props.onClick();tree=sections.render('SeriesDetailSections',props);html=renderToStaticMarkup(tree);
assert.match(html,/<related data-kind="series"/);assert.ok(!html.includes('REAL EPISODE PANEL'));
let prevented=0,stopped=0,focused=0;
buttons(tree)[0].ref.current={focus(){focused++;}};
buttons(tree)[1].props.onKeyDown({key:'ArrowLeft',preventDefault(){prevented++;},stopPropagation(){stopped++;}});
tree=sections.render('SeriesDetailSections',{...props,episodesFailed:true});html=renderToStaticMarkup(tree);
assert.equal(prevented,1);assert.equal(stopped,1);assert.equal(focused,1);assert.match(html,/Não foi possível carregar os episódios/);
buttons(tree).find(button=>button.props.children==='Tentar novamente').props.onClick();assert.equal(retry,1);
console.log('PASS_REAL_SERIES_TABS_DEFAULT_EPISODES_RELATED_ONLY_KEYBOARD_RETRY');

// Personal actions belong beside the trailer in the real non-phone hero.
const canonicalSeries={id:'series-one',title:'Public series'};
const detailPage=harness('src/ui/pages/SeriesDetailPage.tsx',{
  '../../catalog/catalog-selectors.ts':{getSeriesDetail:()=>({id:'series-one',title:'Public series',externalIds:{tmdbId:'1399'},genreLabels:[],seasons:[],overview:'Synopsis'})},
  '../components/Artwork.tsx':{Artwork:stub('artwork')},
  '../hooks/useArtworkMetadata.ts':{useArtworkMetadata:()=>undefined},
  '../../artwork/tmdb-metadata.service.ts':{tmdbPosterPath:()=>undefined},
  '../hooks/useImmersiveArtwork.ts':{useImmersiveArtwork:()=>({current:null})},
  '../components/DetailTrailer.tsx':{DetailTrailer:stub('trailer')},
  '../components/SeriesDetailSections.tsx':{SeriesDetailSections:stub('sections')},
  '../components/SeriesPersonalActions.tsx':{SeriesPersonalActions:stub('personal')},
  '../../playback/watch-history.ts':{watchFingerprint:(kind,row)=>{assert.equal(kind,'series');assert.equal(row,canonicalSeries);return '0123456789abcdef';},watchHistory:{list:()=>[],savedPosition:()=>0,subscribe:()=>()=>{},syncNativeProgress:async()=>{}}},
  '../components/PhoneSeriesDetail.tsx':{PhoneSeriesDetail:stub('phone')},
  '../hooks/usePhoneLayout.ts':{usePhoneLayout:()=>false},
  '../hooks/useDetailInitialFocus.ts':{useDetailInitialFocus:()=>{}},
  '../../playback/playback.service.ts':{defaultPlaybackService:{}},
});
tree=detailPage.render('SeriesDetailPage',{seriesId:'series-one',readModel:{seriesById:new Map([['series-one',canonicalSeries]])},onBack:()=>{}});
html=renderToStaticMarkup(tree);
const actions=nodes(tree).find(node=>node.props.className==='detail-actions series-detail-hero-actions');
assert.ok(actions);assert.equal(React.Children.toArray(actions.props.children).length,2);
assert.ok(html.indexOf('<trailer')<html.indexOf('<personal')&&html.indexOf('<personal')<html.indexOf('<sections'));
const personal=nodes(tree).filter(node=>node.props.fingerprint==='0123456789abcdef');
assert.equal(personal.length,1);assert.equal(personal[0].props.tmdbId,1399);
console.log('PASS_REAL_SERIES_HERO_TRAILER_PERSONAL_SIBLINGS_CANONICAL_IDENTITY_TABS_AFTER');

const canonicalMovie={id:'movie-one',title:'Public movie'};
const moviePage=harness('src/ui/pages/MovieDetailPage.tsx',{
  '../../catalog/catalog-selectors.ts':{getMovieDetail:()=>({id:'movie-one',title:'Public movie',externalIds:{tmdbId:'75802'},genreLabels:[],categoryLabels:[],overview:'Synopsis'})},
  '../components/Artwork.tsx':{Artwork:stub('artwork')},'../hooks/useArtworkMetadata.ts':{useArtworkMetadata:()=>undefined},
  '../../artwork/tmdb-metadata.service.ts':{tmdbPosterPath:()=>undefined},'../hooks/useImmersiveArtwork.ts':{useImmersiveArtwork:()=>({current:null})},
  '../components/DetailTrailer.tsx':{DetailTrailer:stub('trailer')},'../components/SeriesPersonalActions.tsx':{SeriesPersonalActions:stub('personal')},
  '../components/RelatedTitles.tsx':{RelatedTitles:stub('related')},'../components/PhoneMovieDetail.tsx':{PhoneMovieDetail:stub('phone')},
  '../hooks/usePhoneLayout.ts':{usePhoneLayout:()=>false},'../hooks/useDetailInitialFocus.ts':{useDetailInitialFocus:()=>{}},
  '../../playback/playback.service.ts':{defaultPlaybackService:{}},
  '../../playback/watch-history.ts':{watchFingerprint:(kind,row)=>{assert.equal(kind,'movie');assert.equal(row,canonicalMovie);return 'abcdef0123456789';}},
});
tree=moviePage.render('MovieDetailPage',{movieId:'movie-one',readModel:{moviesById:new Map([['movie-one',canonicalMovie]])},onBack:()=>{}});
const moviePersonal=nodes(tree).filter(node=>node.props.fingerprint==='abcdef0123456789');
assert.equal(moviePersonal.length,1);assert.equal(moviePersonal[0].props.kind,'movie');assert.equal(moviePersonal[0].props.tmdbId,75802);
assert.ok(nodes(tree).find(node=>node.props.className==='detail-actions series-detail-hero-actions'));
const heroCss=read('src/index.css');assert.match(heroCss, /detail-hero-wide \{[^}]*border-radius: 16px;[^}]*overflow: hidden;/);
assert.ok(!heroCss.includes('--fire-detail-height'));assert.match(heroCss,/detail-page--fire \.detail-layout \{ min-height: 0 !important/);
console.log('PASS_REAL_MOVIE_CANONICAL_PERSONAL_ACTIONS_ROUNDED_CONTENT_HEIGHT_HERO');

const previousNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
let landscape=true,portrait=false;
const shell=harness('src/ui/components/AppShell.tsx',{
  './Header.tsx':{Header:stub('header')},'../hooks/useLandscapeNavigation.ts':{useLandscapeNavigation:()=>landscape},
  '../hooks/useLivePresentation.ts':{useLivePresentation:()=>({tabletPortrait:portrait,stackedLive:false})},'./CastButton.tsx':{CastButton:stub('cast')},
});
for(const [ua,mobile,touch,isPortrait,cast] of [
  ['Android SM-X610',false,5,false,true],['Android SM-X610',false,5,true,true],
  ['AFTSSS Android',false,0,false,false],['AFTSS Android Mobile',true,0,false,false],
  ['Android Mobile SM-S926B',true,5,false,false],['Desktop',false,0,false,false],
]){
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:ua,maxTouchPoints:touch,userAgentData:{mobile}}});
  portrait=isPortrait;landscape=!isPortrait;
  html=renderToStaticMarkup(shell.render('AppShell',{currentView:'series-detail',canGoBack:true,onBack:()=>{},onNavigate:()=>{},children:'DETAIL'}));
  assert.equal(html.includes('<cast'),cast,ua);if(cast){assert.match(html,/data-icon-only="yes"/);assert.ok(html.indexOf('← Voltar')<html.indexOf('<cast'));}
}
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'Android SM-X610',maxTouchPoints:5}});
assert.ok(!renderToStaticMarkup(shell.render('AppShell',{currentView:'series',canGoBack:true,onBack:()=>{},onNavigate:()=>{}})).includes('<cast'));
if(previousNavigator)Object.defineProperty(globalThis,'navigator',previousNavigator);else delete globalThis.navigator;
console.log('PASS_REAL_SHELL_CAST_ONLY_TABLET_DETAIL_PORTRAIT_LANDSCAPE_NO_FIRE_PHONE_DESKTOP');

// Resolve only the current public title; never publish late metadata after close.
let resolveMetadata,selectedKind,closed=0,restored=0;
class Element {isConnected=true;focus(){restored++;}}
const saved={};for(const key of ['document','window','HTMLElement','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'])saved[key]=Object.getOwnPropertyDescriptor(globalThis,key);
globalThis.HTMLElement=Element;
const originalFocus=new Element();globalThis.document={activeElement:originalFocus};
const dialogNode={open:false,showModal(){this.open=true;},close(){this.open=false;},querySelector(){return {focus(){}};}};
const modal=harness('src/ui/components/DetailTrailer.tsx',{
  '../../artwork/tmdb-metadata.service.ts':{artworkIdentityKey:identity=>identity.kind+':'+identity.title},
  '../../artwork/series-presentation.service.ts':Object.fromEntries(['Movie','Series'].map(kind=>['resolve'+kind+'Presentation',()=>{selectedKind=kind;return new Promise(resolve=>{resolveMetadata=resolve;});}])),
  './SeriesTrailer.tsx':{SeriesTrailer:stub('trailer')},
});
const dialogProps={title:'Public Movie',identity:{kind:'movie',title:'Public Movie'},onClose:()=>closed++};
tree=modal.render('TrailerDialog',dialogProps);tree.ref.current=dialogNode;modal.effects();assert.equal(dialogNode.open,true);assert.equal(selectedKind,'Movie');
tree.props.onKeyDown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(dialogNode.open,false);tree.props.onClose();assert.equal(closed,1);
const before=modal.updates;modal.cleanup();resolveMetadata({tmdbId:603,trailer:{key:'abc_DEF-123'}});await flush();assert.equal(modal.updates,before);assert.equal(restored,1);
const seriesModal=harness('src/ui/components/DetailTrailer.tsx',{
  '../../artwork/tmdb-metadata.service.ts':{artworkIdentityKey:()=> 'series'},
  '../../artwork/series-presentation.service.ts':{resolveSeriesPresentation:()=>{selectedKind='Series';return Promise.resolve(null);},resolveMoviePresentation:()=>{throw Error('Wrong kind');}},
  './SeriesTrailer.tsx':{SeriesTrailer:stub('trailer')},
});
tree=seriesModal.render('TrailerDialog',{...dialogProps,identity:{kind:'series',title:'Series'}});tree.ref.current=dialogNode;seriesModal.effects();await flush();assert.equal(selectedKind,'Series');seriesModal.cleanup();
console.log('PASS_REAL_MODAL_CURRENT_KIND_CLOSE_FOCUS_RESTORE_NO_LATE_RESULT');

// Native geometry must ignore the Fire side header, and controls are session-bound.
const calls={open:[],close:[],control:[],removed:0};let listener;
globalThis.window={innerWidth:960,innerHeight:540,addEventListener(){},removeEventListener(){}};
globalThis.document={hidden:false,activeElement:originalFocus,querySelector:()=>({getBoundingClientRect:()=>({bottom:540,top:0})}),addEventListener(){},removeEventListener(){}};
globalThis.ResizeObserver=class {observe(){}disconnect(){}};
globalThis.requestAnimationFrame=callback=>{callback();return 1;};globalThis.cancelAnimationFrame=()=>{};
const trailer=harness('src/ui/components/SeriesTrailer.tsx',{
  '@capacitor/browser':{Browser:{open:()=>Promise.resolve()}},'./Artwork.tsx':{Artwork:stub('artwork')},
  '../../playback/public-trailer.bridge.ts':{hasPublicTrailer:()=>true,PublicTrailer:{
    addListener:async(_name,fn)=>{listener=fn;return {remove:async()=>{calls.removed++;}};},
    open:async value=>{calls.open.push(value);},bounds:async()=>{},close:async value=>{calls.close.push(value);},control:async value=>{calls.control.push(value);},
  }},
});
const trailerProps={title:'Public series',identity:{kind:'series',title:'Public series'},trailer:{key:'abc_DEF-123'},loading:false,presentation:'modal',autoPlay:true};
tree=trailer.render('SeriesTrailer',trailerProps);
nodes(tree).find(node=>node.props.className==='series-trailer-frame').ref.current={getBoundingClientRect:()=>({left:40,top:60,width:640,height:360,bottom:420})};
trailer.effects();await flush();assert.equal(calls.open.length,1);assert.equal(calls.open[0].visible,true);assert.equal(calls.open[0].presentation,'modal');
const sessionId=calls.open[0].sessionId;listener({sessionId,state:'ready'});listener({sessionId,state:'playing'});
tree=trailer.render('SeriesTrailer',trailerProps);buttons(tree).find(button=>button.props.children==='▶ Reproduzir').props.onClick();buttons(tree).find(button=>button.props.children==='Ⅱ Pausar').props.onClick();
assert.deepEqual(calls.control,[{sessionId,command:'play'},{sessionId,command:'pause'}]);
assert.ok(!renderToStaticMarkup(tree).includes('Não foi possível reproduzir'));trailer.cleanup();await flush();assert.equal(calls.removed,1);assert.ok(calls.close.some(value=>value.sessionId===sessionId));
for(const key of Object.keys(saved)){if(saved[key])Object.defineProperty(globalThis,key,saved[key]);else delete globalThis[key];}
console.log('PASS_REAL_NATIVE_MODAL_FIRE_BOUNDS_PLAY_PAUSE_PLAYING_EVENT_SESSION_CLEANUP');

// Back must close detail dialogs before route mutation; unrelated routing stays intact.
const app=read('src/App.tsx'),start=app.indexOf('  const handleBack = useCallback(() => {'),end=app.indexOf('  }, []);',start);
const body=app.slice(start+'  const handleBack = useCallback(() => {'.length,end);
let routes=0,closes=0,currentDialog={close(){closes++;}};
const back=new Function('document','setRouteState','navigateBack','window','Event',ts.transpileModule(body,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText);
back({querySelector:()=>currentDialog},()=>routes++,value=>value,{dispatchEvent:()=>true},Event);assert.equal(closes,1);assert.equal(routes,0);
currentDialog=null;back({querySelector:()=>currentDialog},()=>routes++,value=>value,{dispatchEvent:()=>true},Event);assert.equal(routes,1);
const series=read('src/ui/pages/SeriesDetailPage.tsx'),movie=read('src/ui/pages/MovieDetailPage.tsx'),plugin=read('android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPlugin.java');
for(const page of [series,movie]){assert.ok(page.includes('DetailTrailer'));assert.ok(page.includes('detail-hero-wide'));assert.ok(!page.includes('<CastButton'));}
assert.ok(series.includes('<SeriesDetailSections'));assert.ok(plugin.includes('PublicTrailerPolicy.presentation('));assert.ok(plugin.includes('PublicTrailerPolicy.controlScript('));assert.ok(plugin.includes('!nonce.equals(session) || !visible'));
assert.ok(!plugin.includes('addJavascriptInterface'));assert.ok(plugin.includes('MIXED_CONTENT_NEVER_ALLOW'));
const wiring=(series,movie,plugin)=>{for(const page of [series,movie])assert.ok(!page.includes('<CastButton'));assert.ok(plugin.includes('PublicTrailerPolicy.presentation('));};
wiring(series,movie,plugin);
assert.throws(()=>wiring(series+'<CastButton />',movie,plugin));
assert.throws(()=>wiring(series,movie,plugin.replace('PublicTrailerPolicy.presentation(','PublicTrailerPolicy.phone(')));
console.log('PASS_DETAIL_BACK_CLOSE_BEFORE_ROUTE_HERO_ACTIONS_AND_NATIVE_BOUNDARIES');
