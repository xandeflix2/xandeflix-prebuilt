import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {parentalFixtureBindings} from './lib/parental-fixture-bindings.mjs';

function fixture(view='home'){
 const frames=new Map(),timers=new Map(),listeners=new Map(),focus=[],expanded=[];let serial=0,observer;
 const document={activeElement:null,scrollingElement:null};
 class Element {
  constructor(classes='',attrs={}){this.classes=new Set(classes.split(' ').filter(Boolean));this.attrs=attrs;this.dataset={catalogItem:attrs.key};this.children=[];this.parentElement=null;this.scrollTop=0;this.scrollLeft=0;this.handlers=new Map();this.classList={contains:c=>this.classes.has(c)};}
  append(child){child.parentElement=this;this.children.push(child);return child;}
  all(){return this.children.flatMap(c=>[c,...c.all()]);}
  matches(selector){return selector.split(',').some(raw=>{const s=raw.trim();if(s==='main')return this.classes.has('page');if(s==='button')return this.classes.has('button');if(s==='[data-catalog-item]')return Boolean(this.attrs.key);if(s==='.media-card[data-catalog-item]')return this.classes.has('media-card')&&Boolean(this.attrs.key);return s.startsWith('.')&&this.classes.has(s.slice(1));});}
  closest(selector){if(selector==='.app-content main')return this.closest('main')?.closest('.app-content')?this.closest('main'):null;for(let e=this;e;e=e.parentElement)if(e.matches(selector))return e;return null;}
  querySelectorAll(selector){const nodes=this.all();if(selector==='[data-catalog-item]')return nodes.filter(n=>n.attrs.key);if(selector==='.catalog-grid [data-catalog-item]')return nodes.filter(n=>n.attrs.key&&n.closest('.catalog-grid'));if(selector==='.hero-actions button:not([disabled])')return nodes.filter(n=>n.classes.has('button')&&n.closest('.hero-actions')&&!n.disabled);return nodes.filter(n=>n.matches(selector));}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  getAttribute(name){return this.attrs[name]||null;}
  contains(node){return node===this||this.all().includes(node);}
  get isConnected(){return shell.contains(this);}
  focus(){document.activeElement=this;focus.push(this);}
  scrollIntoView(){this.visible=true;}
  addEventListener(name,fn){this.handlers.set(name,fn);}
  removeEventListener(name){this.handlers.delete(name);}
  dispatchEvent(event){if(event.type==='xandeflix:catalog-return-expand')expanded.push(event.detail.count);this.handlers.get(event.type)?.(event);return true;}
 }
 const shell=new Element('app-shell'),content=shell.append(new Element('app-content'));document.body=shell;document.scrollingElement=shell;
 const makePage=name=>{for(const node of content.children)node.parentElement=null;content.children=[];return content.append(new Element('page '+name+'-page'));};
 let root=makePage(view);
 const hero=root.append(new Element('hero-banner')),actions=hero.append(new Element('hero-actions')),play=actions.append(new Element('button')),details=actions.append(new Element('button'));
 function rail(id='row',keys=['movie:chosen']){const line=root.append(new Element('media-rail',{'aria-labelledby':'rail-'+id}));line.append(new Element('heading',{id:'rail-'+id}));const all=line.append(new Element('rail-view-all button')),track=line.append(new Element('media-rail-track'));const cards=keys.map(key=>track.append(new Element('media-card button',{key})));return{line,all,track,cards};}
 document.querySelector=s=>s==='.app-content main'?content.children[0]:s==='.app-content'?content:s.includes('dialog')?null:shell.querySelector(s);
 document.getElementById=id=>shell.all().find(n=>n.attrs.id===id)||null;
 class MutationObserver{constructor(fn){this.fn=fn;observer=this;}observe(){this.connected=true;}disconnect(){this.connected=false;}}
 const window={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),dispatchEvent:()=>true};
 const ports={document,window,Element,MutationObserver,requestAnimationFrame:fn=>{const id=++serial;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),setTimeout:fn=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),Event,CustomEvent};
 const module={exports:{}},code=ts.transpileModule(fs.readFileSync('src/ui/hooks/useCatalogReturnNavigation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',...Object.keys(ports),code)(()=>({}),module,module.exports,...Object.values(ports));
 const memory=new module.exports.CatalogReturnNavigation();memory.apply({view},'snapshot');
 const tick=()=>{for(let i=0;i<4&&frames.size;i++){const f=[...frames.values()];frames.clear();f.forEach(fn=>fn());}};
 return{memory,root,content,shell,play,details,document,focus,expanded,frames,timers,listeners,rail,tick,ports,get observer(){return observer;},replace:name=>{root=makePage(name);return root;},mutate:()=>observer.fn()};
}
let tests=0;const test=(name,run)=>{run();tests++;console.log('PASS '+name);};
test('EXPLICIT_HOME_ON_CURRENT_HOME_FOCUSES_HERO_AND_CLEARS_ALL_VERTICAL_SCROLL',()=>{
 const f=fixture();f.root.scrollTop=600;f.content.scrollTop=400;f.shell.scrollTop=200;f.memory.requestHome('snapshot');f.memory.apply({view:'home'},'snapshot');f.tick();assert.equal(f.document.activeElement,f.play);assert.equal(f.root.scrollTop+f.content.scrollTop+f.shell.scrollTop,0);assert.equal(f.listeners.size,0);assert.equal(f.observer.connected,false);
});
test('HOME_WAITS_FOR_HERO_AND_USES_DETAILS_WHILE_PLAY_IS_DISABLED',()=>{
 const f=fixture();f.play.disabled=true;f.memory.requestHome('snapshot');f.memory.apply({view:'home'},'snapshot');f.tick();assert.equal(f.document.activeElement,f.details);
});
test('BACK_RETURNS_TO_EXACT_ORIGINATING_RAIL_AND_CARD_WITH_HORIZONTAL_POSITION',()=>{
 const f=fixture(),wrong=f.rail('other'),chosen=f.rail('chosen');chosen.track.scrollLeft=420;f.root.scrollTop=680;f.memory.track(chosen.cards[0]);f.memory.remember({view:'home'},'snapshot');f.memory.requestBack({view:'home'},'snapshot');f.root.scrollTop=0;chosen.track.scrollLeft=0;f.memory.apply({view:'home'},'snapshot');f.tick();assert.equal(f.document.activeElement,chosen.cards[0]);assert.notEqual(f.document.activeElement,wrong.cards[0]);assert.equal(f.root.scrollTop,680);assert.equal(chosen.track.scrollLeft,420);
});
test('MOVIES_SERIES_AND_CATEGORY_KEYS_KEEP_INDEPENDENT_RETURN_POSITIONS',()=>{
 for(const view of ['movies','series']){const f=fixture(view),line=f.rail();f.memory.track(line.cards[0]);f.root.scrollTop=730;f.memory.remember({view,itemId:'category-A'},'snapshot');f.root.scrollTop=120;f.memory.remember({view,itemId:'category-B'},'snapshot');f.memory.requestBack({view,itemId:'category-A'},'snapshot');f.memory.apply({view,itemId:'category-A'},'snapshot');f.tick();assert.equal(f.root.scrollTop,730);assert.equal(f.document.activeElement,line.cards[0]);}
});
test('LATE_CARD_RESTORES_AFTER_SKELETON_WITHOUT_FOCUSING_WRONG_ITEM',()=>{
 const f=fixture(),line=f.rail();f.memory.track(line.cards[0]);f.memory.remember({view:'home'},'snapshot');line.track.children=[];line.line.classes.add('media-rail-skeleton');f.memory.requestBack({view:'home'},'snapshot');f.memory.apply({view:'home'},'snapshot');f.tick();assert.equal(f.document.activeElement,line.all);assert.equal(f.observer.connected,true);const card=line.track.append(new line.line.constructor('media-card button',{key:'movie:chosen'}));line.line.classes.delete('media-rail-skeleton');f.mutate();f.tick();assert.equal(f.document.activeElement,card);assert.equal(f.observer.connected,false);
});
test('USER_INPUT_CANCELS_LATE_RESTORE_WITHOUT_STEALING_FOCUS',()=>{
 const f=fixture(),line=f.rail();f.memory.track(line.cards[0]);f.memory.remember({view:'home'},'snapshot');line.track.children=[];f.memory.requestBack({view:'home'},'snapshot');f.memory.apply({view:'home'},'snapshot');f.tick();f.listeners.get('keydown')();const before=f.focus.length;f.mutate();f.tick();assert.equal(f.focus.length,before);assert.equal(f.listeners.size,0);assert.equal(f.timers.size,0);
});
test('NEW_SNAPSHOT_AND_NEW_NAVIGATION_CANCEL_OLD_CARD_RESTORE',()=>{
 const f=fixture(),line=f.rail();f.memory.track(line.cards[0]);f.memory.remember({view:'home'},'snapshot');f.memory.requestBack({view:'home'},'snapshot');f.memory.apply({view:'home'},'new-snapshot');f.tick();assert.equal(f.focus.length,0);f.memory.requestHome('new-snapshot');f.memory.apply({view:'home'},'new-snapshot');f.memory.clearRequest();f.tick();assert.equal(f.focus.length,0);
});
test('GRID_EXPANDS_ONLY_PREVIOUSLY_VISIBLE_COUNT_AND_DISPOSE_CLEANS_JOB',()=>{
 const f=fixture('movies'),grid=f.root.append(new f.root.constructor('catalog-grid'));for(let i=0;i<96;i++)grid.append(new f.root.constructor('media-card button',{key:'movie:'+i}));f.memory.track(grid.children[95]);f.memory.remember({view:'movies',itemId:'cat'},'snapshot');grid.children=[];f.memory.requestBack({view:'movies',itemId:'cat'},'snapshot');f.memory.apply({view:'movies',itemId:'cat'},'snapshot');f.tick();assert.deepEqual(f.expanded,[96]);f.mutate();f.tick();assert.deepEqual(f.expanded,[96]);f.memory.dispose();assert.equal(f.listeners.size+f.frames.size+f.timers.size,0);assert.equal(f.observer.connected,false);
});
test('MEMORY_IS_BOUNDED_AND_EVICTED_DESTINATION_CANNOT_RESTORE',()=>{
 const f=fixture(),line=f.rail();for(let i=0;i<17;i++){f.memory.track(line.cards[0]);f.memory.remember({view:'movies',itemId:'category:'+i},'snapshot');}f.memory.requestBack({view:'movies',itemId:'category:0'},'snapshot');f.memory.apply({view:'movies',itemId:'category:0'},'snapshot');f.tick();assert.equal(f.focus.length,0);
});
test('MOUNTED_APP_HANDLERS_DISTINGUISH_HOME_CLICK_FROM_BACK_AND_KEEP_HISTORY',()=>{
 const f=fixture(),source=fs.readFileSync('src/App.tsx','utf8'),start=source.indexOf('  const handleNavigate ='),end=source.indexOf('  const handleSelectItem =');
 const routeModule={exports:{}},routeJS=ts.transpileModule(fs.readFileSync('src/ui/navigation/route-state.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('module','exports',routeJS)(routeModule,routeModule.exports);
 let state={current:{view:'home'},history:[]};const routeStateRef={current:state};
 let refreshes=0;
 const ports={...f.ports,useCallback:fn=>fn,routeStateRef,catalogSnapshotRef:{current:'snapshot'},catalogReturn:f.memory,requestFeaturedRotation:()=>refreshes++,navigateTo:routeModule.exports.navigateTo,navigateBack:routeModule.exports.navigateBack,commitRoute:fn=>{state=fn(state);routeStateRef.current=state;}};
 const code=ts.transpileModule(source.slice(start,end)+'\nreturn {handleNavigate,handleBack};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const handlers=new Function(...Object.keys(ports),code)(...Object.values(ports));handlers.handleNavigate('home');f.tick();assert.equal(f.document.activeElement,f.play);assert.equal(state.history.length,0);
 const line=f.rail();f.memory.track(line.cards[0]);handlers.handleNavigate('movie-detail','fixture');assert.equal(state.current.view,'movie-detail');handlers.handleBack();assert.equal(state.current.view,'home');f.memory.apply(state.current,'snapshot');f.tick();assert.equal(f.document.activeElement,line.cards[0]);assert.equal(refreshes,1,'ONLY_EXPLICIT_HOME_REFRESHES_SUGGESTIONS');
});
async function gridReturnTest(){
 const f=fixture('movies'),states=[],refs=[],effects=[],layouts=[];let si=0,ri=0,calls=0,release;
 const gate=new Promise(resolve=>release=resolve);
 const hooks={...React,useState:initial=>{const index=si++;if(!(index in states))states[index]=typeof initial==='function'?initial():initial;return[states[index],next=>states[index]=typeof next==='function'?next(states[index]):next];},useRef:initial=>refs[ri++]||(refs[ri-1]={current:initial}),useMemo:fn=>fn(),useCallback:fn=>fn,useEffect:fn=>effects.push(fn),useLayoutEffect:fn=>layouts.push(fn)};
 const code=ts.transpileModule(fs.readFileSync('src/ui/components/CatalogGrid.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 const module={exports:{}};new Function('require','module','exports',code)(name=>parentalFixtureBindings(name)??(name==='react'?hooks:name.includes('catalog-view-model')?{GRID_BATCH_SIZE:48}:name.includes('MediaCard')?{MediaCard:()=>null}:{CATALOG_RETURN_EXPAND:'xandeflix:catalog-return-expand',CATALOG_RETURN_END:'xandeflix:catalog-return-end'}),module,module.exports);
 const items=Array.from({length:48},(_,id)=>({id:String(id),kind:'movie',title:'Fixture',genreLabels:[],categoryLabels:[]}));
 const render=(extra={})=>{si=0;ri=0;effects.length=0;layouts.length=0;return module.exports.CatalogGrid({items,onItemClick(){},hasMoreRemote:true,onLoadMoreRemote:async()=>{calls++;await gate;},...extra});};
 const tree=render(),root=f.root.append(new f.root.constructor('catalog-grid-container'));tree.ref.current=root;
 const cleanup=layouts[0]();effects[0]();effects[1]();
 f.root.dispatchEvent(new CustomEvent('xandeflix:catalog-return-expand',{detail:{count:96}}));render();const work=effects.find(fn=>fn.toString().includes('returnCount <= items.length'));assert.ok(work);work();work();await Promise.resolve();await Promise.resolve();assert.equal(calls,1,'RETURN_LOAD_MUST_NOT_OVERLAP');
 assert.equal(states[0],96,'PREVIOUS_VISIBLE_COUNT_RESTORED');release();for(let i=0;i<12;i++)await Promise.resolve();
 f.root.dispatchEvent(new Event('xandeflix:catalog-return-end'));render();effects.find(fn=>fn.toString().includes('returnCount <= items.length'))();await Promise.resolve();assert.equal(calls,1,'FINISHED_RETURN_MUST_STOP_LOADING');cleanup();assert.equal(f.root.handlers.size,0);
 tests++;console.log('PASS REAL_CATALOG_GRID_RETURN_RESTORES_COUNT_SEQUENTIAL_LOAD_AND_CANCEL_CLEANUP');
}
await gridReturnTest();
console.log(JSON.stringify({tests,pass:true,fixtureOnly:true,networkRequests:0}));
