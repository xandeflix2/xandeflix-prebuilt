import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import ts from 'typescript';
import { parentalFixtureBindings } from './lib/parental-fixture-bindings.mjs';
import { sampleStartupArtwork, prepareStartupArtwork, STARTUP_ARTWORK_LIMIT, STARTUP_ARTWORK_WAIT_MS } from '../src/artwork/startup-artwork-preparation.ts';
globalThis.innerHeight=540;globalThis.innerWidth=960;
let layoutReads=0;
const card=(ready=false,unavailable=false)=>({getBoundingClientRect(){layoutReads++;return {top:10,bottom:100,left:10,right:80};},querySelector(selector){return selector.startsWith('img')?ready?{complete:true,naturalWidth:342}:null:unavailable?{}:null;}});
const marked=Array.from({length:100},()=>card(true));
const visible=Array.from({length:700},()=>card(false,true));
const root={querySelectorAll(selector){return selector.includes('data-startup')?marked:visible;},querySelector(selector){return selector.includes('home-hero')?{querySelector(s){return s.startsWith('img')?{complete:true,naturalWidth:1280}:null;}}:null;}};
const sample=sampleStartupArtwork(root);
assert.equal(sample.total,40);assert.equal(sample.ready,32);assert.equal(sample.unavailable,8);
assert.equal(layoutReads,40,'initial stage must never measure all catalog cards');
assert.equal(sample.heroSettled,true);
let time=0,job,updates=0,reason;
const options={sample:()=>({total:4,ready:3,unavailable:1,waitingRails:false,heroSettled:true}),update:()=>updates++,finish:r=>reason=r,now:()=>time,schedule:fn=>(job=fn),cancel:()=>{job=undefined;}};
const cancel=prepareStartupArtwork(options);
time=250;job();assert.equal(reason,undefined);
time=500;job();assert.equal(reason,undefined);
time=750;job();assert.equal(reason,'settled');assert.equal(updates,3);
cancel();assert.equal(job,undefined);
reason=undefined;time=0;updates=0;
const pending={...options,sample:()=>({total:4,ready:3,unavailable:0,waitingRails:true,heroSettled:false})};
const stop=prepareStartupArtwork(pending);time=STARTUP_ARTWORK_WAIT_MS;job();assert.equal(reason,'timeout');stop();
reason=undefined;time=0;updates=0;
const dispose=prepareStartupArtwork(options),late=job;dispose();time=50000;late();assert.equal(updates,0);assert.equal(reason,undefined);
console.log('PASS_STARTUP40_BOUNDED_LAYOUT_READS_REAL_READY_DISTINCT_FALLBACK_STABILITY_TIMEOUT_CANCEL');

const passive={...React,useRef:v=>({current:v}),useState:v=>[typeof v==='function'?v():v,()=>{}],useEffect:()=>{},useLayoutEffect:()=>{},useMemo:f=>f()};
function load(file,imports){const module={exports:{}};const code=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',code)(name=>{const parental=parentalFixtureBindings(name);if(parental)return parental;for(const [key,value]of Object.entries(imports))if(name.includes(key))return value;throw Error('Uncontrolled dependency '+name);},module,module.exports);return module.exports;}
function elements(tree){const result=[];function walk(n){if(!React.isValidElement(n))return;result.push(n);React.Children.forEach(n.props.children,walk);}walk(tree);return result;}
const Card=()=>null,Artwork=()=>null;
const {MediaRail}=load('src/ui/components/MediaRail.tsx',{react:{default:passive,...passive},'category-presentation':{createPresentationSeed:()=>1,orderCategoryItems:x=>x,isReleaseCategory:()=>false},MediaCard:{MediaCard:Card},useRailArtworkPreparation:{useRailArtworkPreparation:()=>({root:{current:null},prepare:false})}});
const items=Array.from({length:20},(_,id)=>({id:String(id),title:'Synthetic',kind:'movie',posterUri:'https://synthetic.invalid/poster.jpg',categoryLabels:[],genreLabels:[]}));
const props={id:'startup',title:'Synthetic',items,preserveOrder:true,onItemClick(){},startupArtworkCount:999};
const rail=elements(MediaRail.type(props)),cards=rail.filter(n=>n.type===Card);
assert.equal(cards.filter(n=>n.props.startupArtwork).length,8);
assert.equal(elements(MediaRail.type({...props,startupArtworkCount:0})).filter(n=>n.type===Card&&n.props.startupArtwork).length,0);
const {MediaCard}=load('src/ui/components/MediaCard.tsx',{react:{default:passive,...passive},Artwork:{Artwork},NewContentProvider:{useContentBadge:()=>undefined},useCardGenres:{useCardGenres:item=>({ref:{current:null},genres:item.genreLabels})},'artwork-uri':{displayArtworkUri:x=>x},'image-load-queue':{loadImage:()=>Promise.resolve({ok:true})}});
const node=MediaCard.type({item:items[0],onClick(){},startupArtwork:true});
assert.equal(node.props['data-startup-artwork'],true);assert.equal(elements(node).find(n=>n.type===Artwork).props.startup,true);
console.log('PASS_REAL_RAIL8_LIMIT_AND_CARD_TO_ARTWORK_PROP_AND_NORMAL_DEFAULT');

// C108 amends only presentation timing/one-document behavior; engine bounds above stay intact.
const effects=[],listeners=new Map();
const hookReact={...passive,useLayoutEffect:fn=>effects.push(fn)};
let preparing=[],cancelled=0,finishStage,updateStage;
const pendingSample={...sample,ready:sample.ready-1};
globalThis.document={addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:(type,fn)=>{if(listeners.get(type)===fn)listeners.delete(type);}};
function stage(){return load('src/ui/components/StartupArtworkPreparation.tsx',{'react-dom':{createPortal:()=>null},StartupLoadingScreen:{StartupLoadingScreen:()=>null},react:{default:hookReact,...hookReact},'startup-artwork-preparation':{sampleStartupArtwork:()=>pendingSample,isStartupArtworkSettled:s=>s.ready+s.unavailable===s.total,prepareStartupArtwork:opts=>{finishStage=opts.finish;updateStage=opts.update;return()=>cancelled++;}}}).StartupArtworkPreparation;}
const flush=()=>effects.splice(0).map(fn=>fn()).filter(fn=>typeof fn==='function');
stage()({root:{current:{closest:()=>null}},snapshot:'phone',onPreparing:v=>preparing.push(v)});
flush();assert.deepEqual(preparing,[]);assert.equal(listeners.size,0);
let heroFocused=0;const classes=new Set(),attributes=new Map();
const shell={getAttribute:key=>attributes.get(key)??null,hasAttribute:key=>attributes.has(key),setAttribute:(key,value)=>attributes.set(key,value),removeAttribute:key=>attributes.delete(key)};
stage()({root:{current:{closest:selector=>selector==='.app-shell'?shell:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},querySelector:()=>({focus:()=>heroFocused++})}},snapshot:'fire',onPreparing:v=>preparing.push(v)});
const cleanups=flush();assert.deepEqual(preparing,[true]);assert.ok(classes.has('home-page--startup-check'));
assert.equal(attributes.has('data-startup-isolated'),true);assert.equal(attributes.has('inert'),true);
updateStage(pendingSample);
for(const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Enter',' ','Escape','BrowserBack','Backspace','Unidentified']){
  let prevented=0,stopped=0;
  listeners.get('keydown')({key,keyCode:key==='Unidentified'?23:0,preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}});
  assert.equal(prevented,1,`consume ${key}`);assert.equal(stopped,1,`isolate ${key}`);
  assert.deepEqual(preparing,[true],`${key} must never release pending preparation`);
  assert.equal(cancelled,0);assert.equal(heroFocused,0);assert.equal(attributes.has('inert'),true);
}
finishStage();assert.deepEqual(preparing,[true,false]);assert.equal(heroFocused,1);assert.equal(classes.size,0);
assert.equal(listeners.size,0,'D-pad must be released immediately on entering, before React cleanup');
assert.equal(attributes.size,0,'Shell isolation must be restored on entering');
cleanups.forEach(fn=>fn());assert.equal(listeners.size,0);assert.ok(cancelled>=1);
console.log('PASS_REAL_COMPONENT_PHONE_SKIP_FIRE_PREPARE_FINISH_FOCUS_DPAD_RELEASE_LISTENER_CLEANUP');
console.log('PASS_PENDING_PREPARATION_NAVIGATION_OK_SPACE_BACK_CANNOT_ENTER_EARLY');

let fireClass=false,observers=0;
globalThis.MutationObserver=class {constructor(){observers++;}observe(){}disconnect(){}};
preparing=[];const LateStage=stage();
const lateRoot={current:{closest:()=>fireClass?{}:null,querySelector:()=>({focus(){}})}},onPreparing=v=>preparing.push(v);
LateStage({root:lateRoot,snapshot:'async-profile',onPreparing});flush().forEach(fn=>fn());
fireClass=true;LateStage({root:lateRoot,snapshot:'different-snapshot',onPreparing});flush().forEach(fn=>fn());
assert.deepEqual(preparing,[]);assert.equal(observers,0);
console.log('PASS_C108_LATE_PROFILE_AND_SNAPSHOT_NEVER_COVER_A_PRESENTED_HOME');
