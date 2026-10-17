import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

function harness({detail=false,fallback=false,pageTop=100,bottom=520,scrollTop=0}={}){
 const props=new Map(),classes=new Set(),events=new Map(),windowEvents=new Map(),frames=new Map(),effects=[];let next=0,cleanup,sampleCount=0,valid=true,refs=0;
 const navProps=new Map(),shell={style:{setProperty:(k,v)=>navProps.set(k,v),removeProperty:k=>navProps.delete(k)}};
 const bounds={bottom},page={scrollTop,closest:selector=>selector==='.app-shell'?shell:null,getBoundingClientRect:()=>({top:pageTop}),style:{setProperty:(k,v)=>props.set(k,v),removeProperty:k=>props.delete(k)},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const image={complete:true,naturalWidth:1280,dataset:{immersiveArtwork:'backdrop'},getBoundingClientRect:()=>bounds};
 const surface={getBoundingClientRect:()=>bounds};
 const element={closest:()=>page,matches:()=>!detail,querySelector:()=>fallback?null:surface,querySelectorAll:()=>[image],getBoundingClientRect:()=>bounds,addEventListener:(k,v)=>events.set(k,v),removeEventListener:(k,v)=>{assert.equal(events.get(k),v);events.delete(k);}};
 let observer;
 class MutationObserver{constructor(fn){this.fn=fn;observer=this;}observe(){this.connected=true;}disconnect(){this.connected=false;}}
 const ports={MutationObserver,requestAnimationFrame:fn=>{const id=++next;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),window:{addEventListener:(k,v)=>windowEvents.set(k,v),removeEventListener:(k,v)=>{assert.equal(windowEvents.get(k),v);windowEvents.delete(k);}}};
 const module={exports:{}},code=ts.transpileModule(fs.readFileSync('src/ui/hooks/useImmersiveArtwork.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',...Object.keys(ports),code)(name=>name==='react'?{useEffect:fn=>effects.push(fn),useRef:initial=>({current:refs++===0?element:initial})}:{paletteForImage:()=>{sampleCount++;return valid?{base:'rgb(20,25,30)',ambient:'rgb(70,20,30)'}:undefined;}},module,module.exports,...Object.values(ports));
 module.exports.useImmersiveArtwork('fixture');const cleanups=effects.map(effect=>effect());cleanup=()=>cleanups.forEach(fn=>fn?.());
 const flush=()=>{const jobs=[...frames.values()];frames.clear();for(const fn of jobs)fn();};
 return{props,navProps,classes,events,windowEvents,frames,bounds,flush,cleanup,observer,get samples(){return sampleCount;},reject:()=>valid=false};
}
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS '+name);};
test('HALO_ENDS_AFTER_HERO_RELATIVE_TO_PAGE_NOT_ENTIRE_CATALOG',()=>{
 const h=harness();h.flush();assert.equal(h.props.get('--artwork-halo-height'),'452px');assert.equal(h.classes.has('immersive-background'),true);h.cleanup();
});
test('DETAIL_HERO_AND_DISPLAYED_IMAGE_FALLBACK_BOUND_HALO',()=>{
 for(const fallback of [false,true]){const h=harness({detail:true,fallback,pageTop:80,bottom:400});h.flush();assert.equal(h.props.get('--artwork-halo-height'),'352px');h.cleanup();}
});
test('ALREADY_SCROLLED_PAGE_RETAINS_UNSCROLLED_HERO_HALO_EXTENT',()=>{
 const h=harness({pageTop:100,bottom:220,scrollTop:300});h.flush();assert.equal(h.props.get('--artwork-halo-height'),'452px');h.cleanup();
});
test('LOAD_MUTATION_AND_ROTATION_RESIZE_COALESCE_AND_REMEASURE',()=>{
 const h=harness();h.flush();h.bounds.bottom=720;h.events.get('load')();h.observer.fn();h.windowEvents.get('resize')();assert.equal(h.frames.size,1);h.flush();assert.equal(h.props.get('--artwork-halo-height'),'652px');assert.equal(h.samples,2);h.cleanup();
});
test('UNREADABLE_ARTWORK_RESETS_PALETTE_HALO_AND_BACKGROUND_CLASS',()=>{
 const h=harness();h.flush();h.reject();h.events.get('error')();h.flush();assert.equal(h.props.size,0);assert.equal(h.classes.size,0);h.cleanup();
});
test('UNMOUNT_CLEANS_LISTENERS_PENDING_FRAME_AND_INLINE_PROPERTIES',()=>{
 const h=harness();h.flush();h.windowEvents.get('resize')();h.cleanup();assert.equal(h.events.size,0);assert.equal(h.windowEvents.size,0);assert.equal(h.frames.size,0);assert.equal(h.props.size,0);assert.equal(h.observer.connected,false);
});
test('NAVIGATION_RECEIVES_ONLY_AMBIENT_COLOR_AND_CLEANS_ON_LOSS_OR_UNMOUNT',()=>{
 const h=harness();h.flush();assert.equal(h.navProps.get('--navigation-ambient'),'rgb(70,20,30)');h.reject();h.events.get('error')();h.flush();assert.equal(h.navProps.size,0);h.cleanup();
});
console.log(JSON.stringify({tests,pass:true,fixtureOnly:true,networkRequests:0}));
