import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CatalogReadModel} from '../src/catalog/catalog-read-model.ts';
import {getSeriesDetail} from '../src/catalog/catalog-selectors.ts';
import {WatchHistory,watchFingerprint} from '../src/playback/watch-history.ts';

const values=new Map();
const history=new WatchHistory({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},async()=>[]);
const series={id:'series-fixture',title:'Fixture series',year:2016,categoryIds:[],genreIds:[],artworkIds:[],seasonIds:['season-fixture']};
const episodes=[1,2,3].map(n=>({id:'episode-'+n,seriesId:series.id,seasonId:'season-fixture',episodeNumber:n,title:'Episode '+n,artworkIds:[],streamIds:[]}));
const model=new CatalogReadModel({metadata:{snapshotId:'fixture'},series:[series],seasons:[{id:'season-fixture',seriesId:series.id,seasonNumber:1,episodeIds:episodes.map(e=>e.id)}],episodes,movies:[],streams:[],artworks:[],categories:[],genres:[]});
const canonical=model.seriesById.get(series.id),fingerprint=watchFingerprint('series',canonical);
let phone=false,played=[];
const port={
 '../../catalog/catalog-selectors.ts':{getSeriesDetail},
 '../components/Artwork.tsx':{Artwork:()=>null},
 '../hooks/useArtworkMetadata.ts':{useArtworkMetadata:()=>undefined},
 '../../artwork/tmdb-metadata.service.ts':{tmdbPosterPath:()=>undefined},
 '../hooks/useImmersiveArtwork.ts':{useImmersiveArtwork:()=>({current:null})},
 '../components/DetailTrailer.tsx':{DetailTrailer:()=>null},
 '../components/SeriesPersonalActions.tsx':{SeriesPersonalActions:()=>null},
 '../components/SeriesDetailSections.tsx':{SeriesDetailSections:p=>p.episodes},
 '../components/PhoneSeriesDetail.tsx':{PhoneSeriesDetail:p=>p.episodes},
 '../hooks/usePhoneLayout.ts':{usePhoneLayout:()=>phone},
 '../hooks/useDetailInitialFocus.ts':{useDetailInitialFocus:()=>{}},
 '../../playback/watch-history.ts':{watchFingerprint,watchHistory:history},
 '../../playback/playback.service.ts':{defaultPlaybackService:{playEpisode:async(...args)=>{played.push(args);return {state:'NATIVE_PLAYER_OPENED'};}}},
};
function page(){
 let cursor=0,updates=0;const states=[],effects=new Map(),pending=[];
 const hooks={...React,useState:initial=>{const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{updates++;states[i]=typeof value==='function'?value(states[i]):value;}];},useCallback:fn=>fn,useEffect:(fn,deps)=>{const i=cursor++,old=effects.get(i);if(old&&deps.every((v,n)=>Object.is(v,old.deps[n])))return;pending.push(()=>{old?.cleanup?.();effects.set(i,{deps,cleanup:fn()});});}};
 const module={exports:{}};
 const require=name=>name==='react'?{default:hooks,...hooks}:port[name]||(()=>{throw Error('Missing port '+name);})();
 const code=ts.transpileModule(readFileSync(new URL('../src/ui/pages/SeriesDetailPage.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
 new Function('require','module','exports',code)(require,module,module.exports);
 return {render(){cursor=0;return module.exports.SeriesDetailPage({seriesId:series.id,readModel:model,onBack:()=>{}});},effects(){while(pending.length)pending.shift()();},cleanup(){for(const e of effects.values())e.cleanup?.();effects.clear();},get updates(){return updates;}};
}
const walk=tree=>{const nodes=[];const visit=node=>{if(!React.isValidElement(node))return;nodes.push(node);React.Children.forEach(node.props.children,visit);if(node.props.episodes)visit(node.props.episodes);};visit(tree);return nodes;};
const rows=tree=>walk(tree).filter(n=>n.type==='li'&&n.props.className?.startsWith('episode-card'));
const html=row=>renderToStaticMarkup(row);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const event=(nonce,positionMs,observedAt,ended=false)=>history.observe({playbackId:nonce,positionMs,durationMs:3000000,observedAt,ended});
const nonce=history.begin('series',series.id,episodes[2].id,fingerprint);
let observed=1000;
for(const mobile of [false,true]){
 event(nonce,725243,observed++);
 phone=mobile;const ui=page();let tree=ui.render();ui.effects();await tick();tree=ui.render();
 let list=rows(tree);assert.equal(list.length,3);
 assert.match(html(list[2]),/episode-card--selected/);assert.match(html(list[2]),/Continuar assistindo/);assert.match(html(list[2]),/▶ Continuar/);
 assert.ok(!html(list[0]).includes('Continuar'));assert.equal(history.savedPosition('series',series.id,fingerprint,episodes[2].id),725243);
 assert.ok(list.every(row=>row.props.tabIndex===undefined));
 list[1].props.onFocusCapture();list=rows(ui.render());assert.match(html(list[1]),/episode-card--selected/);assert.ok(!list[2].props.className.includes('--selected'));
 const before=played.length;list[0].props.onClickCapture();assert.equal(played.length,before);
 list=rows(ui.render());assert.match(html(list[0]),/episode-card--selected/);
 const button=walk(list[2]).find(n=>n.type==='button');await button.props.onClick();
 assert.deepEqual(played.at(-1),[series.id,episodes[2].id,model]);
 const updates=ui.updates;event(nonce,726243,observed++);assert.ok(ui.updates>updates);
 ui.cleanup();const after=ui.updates;event(nonce,727243,observed++);assert.equal(ui.updates,after);
}
console.log('PASS_REAL_PAGE_SHARED_PHONE_TABLET_TV_RESUME_IDENTITY_ROW_FOCUS_CALLBACK_CLEANUP');

event(nonce,3000000,observed++,true);phone=false;let ui=page();
assert.ok(!html(rows(ui.render())[2]).includes('Continuar'));ui.cleanup();
const old=history.begin('series',series.id,episodes[1].id,fingerprint);event(old,123456,observed++);
model.seriesById.set(series.id,{...canonical,title:'Replacement series',year:2025});
ui=page();assert.ok(rows(ui.render()).every(row=>!html(row).includes('Continuar')&&!row.props.className.includes('--selected')));ui.cleanup();
model.seriesById.set(series.id,canonical);
console.log('PASS_COMPLETED_EPISODE_AND_RECYCLED_SERIES_ID_DO_NOT_RESUME');
console.log('ALL_C11_EPISODE_CONTINUE_ROW_TESTS_PASSED');
