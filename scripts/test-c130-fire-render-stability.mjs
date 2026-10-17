import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {isFireTvPresentation} from '../src/ui/device-presentation.ts';
const read=file=>fs.readFileSync(file,'utf8');
function load(file,require,ports={}){
 const module={exports:{}};
 const code=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',...Object.keys(ports),code)(require,module,module.exports,...Object.values(ports));return module.exports;
}
let tests=0;
const test=(name,run)=>{run();tests++;console.log('PASS '+name);};
function carousel(fire=false,reduced=false){
 let stateIndex=0,refIndex=0;const states=[],refs=[],effects=[],animations=[];
 const hooks={...React,useMemo:fn=>fn(),useState:initial=>{const i=stateIndex++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:value=>refs[refIndex++]||(refs[refIndex-1]={current:value}),useEffect:(run,deps)=>effects.push({run,deps})};
 const {HomeHero}=load('src/ui/components/HomeHero.tsx',name=>name==='react'?hooks:name.endsWith('device-presentation.ts')?{isFireTvPresentation}:name.includes('useHeroLayout')?{useHeroLayout:()=>false}:name.includes('useHeroArtwork')?{useHeroArtwork:items=>({eligible:items.map(item=>({item,uri:'fixture'})),pending:false,revision:0,eligibilityKey:'fixture'})}:name.endsWith('Hero.tsx')?{Hero:()=>null}:{}, {navigator:{userAgent:fire?'Android AFTSS':'Android Mobile'},window:{matchMedia:()=>({matches:reduced})}});
 const options=[0,1].map(n=>({key:'option:'+n,item:{id:String(n),kind:'movie',title:'Fixture '+n}}));
 const render=()=>{stateIndex=refIndex=0;effects.length=0;const tree=HomeHero({options,onSelect(){},nextBatch:async()=>false,displayed(){}});refs[0].current={animate:(frames,settings)=>{const animation={frames,settings,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}};return tree;};
 return{render,animations,effect:()=>effects.find(e=>e.run.toString().includes('opacity')),rotate:tree=>tree.props.children.props.controls.props.children[1].props.onClick({detail:0})};
}
test('FIRE_CAROUSEL_NEVER_ANIMATES_WHOLE_HERO_TO_ZERO_ON_INITIAL_OR_NEXT_TITLE',()=>{
 const h=carousel(true);const first=h.render();assert.equal(h.effect().run(),undefined);h.rotate(first);const second=h.render();h.effect().run();assert.equal(h.animations.length,0);assert.notEqual(first.props.children.props.item.id,second.props.children.props.item.id);
});
test('NON_FIRE_FADE_AND_REDUCED_MOTION_KEEP_PREVIOUS_BEHAVIOR_AND_CLEANUP',()=>{
 const h=carousel(false);h.render();const dispose=h.effect().run();assert.equal(h.animations.length,1);assert.deepEqual(h.animations[0].frames,[{opacity:0},{opacity:1}]);assert.equal(h.animations[0].settings.duration,400);dispose();assert.equal(h.animations[0].cancelled,true);
 const reduced=carousel(false,true);reduced.render();reduced.effect().run();assert.equal(reduced.animations.length,0);
});
function halo(fire=true){
 const props=new Map(),nav=new Map(),classes=new Set(),frames=new Map(),listeners=new Map(),windows=new Map(),slots=[],refs=[],changes=[];let serial=0,hook=0,effect=0,images=[],valid=true,color='old';
 const style=map=>({setProperty:(k,v)=>{map.set(k,v);changes.push({key:k,value:v});},removeProperty:k=>{map.delete(k);changes.push({key:k,value:null});}});
 const shell={style:style(nav)},page={scrollTop:0,closest:s=>s==='.app-shell'||fire&&s==='.app-shell--fire-stick'?shell:null,style:style(props),classList:{add:s=>classes.add(s),remove:s=>classes.delete(s)},getBoundingClientRect:()=>({top:0})};
 const element={closest:()=>page,matches:()=>true,querySelectorAll:()=>images,getBoundingClientRect:()=>({bottom:300}),addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:(n,f)=>{assert.equal(listeners.get(n),f);listeners.delete(n);}};
 const hooks={useRef:initial=>{const i=hook++;return refs[i]||(refs[i]={current:i===0?element:initial});},useEffect:(run,deps)=>{const i=effect++,old=slots[i],changed=!old||deps.some((v,n)=>v!==old.deps[n]);if(changed){old?.cleanup?.();slots[i]={run,deps,queued:true};}}};
 const observers=[];
 const {useImmersiveArtwork}=load('src/ui/hooks/useImmersiveArtwork.ts',name=>name==='react'?hooks:{paletteForImage:()=>valid?{base:color+'-base',ambient:color+'-ambient'}:undefined},{MutationObserver:class{constructor(fn){this.fn=fn;observers.push(this);}observe(){this.active=true;}disconnect(){this.active=false;}},window:{addEventListener:(n,f)=>windows.set(n,f),removeEventListener:(n,f)=>{assert.equal(windows.get(n),f);windows.delete(n);}},requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id)});
 const render=identity=>{hook=effect=0;useImmersiveArtwork(identity);for(const slot of slots)if(slot.queued){slot.queued=false;slot.cleanup=slot.run();}};
 const flush=()=>{const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn());};
 const loaded=next=>{color=next;images=[{complete:true,naturalWidth:1280,dataset:{immersiveArtwork:'backdrop'}}];};
 const schedule=()=>observers.at(-1).fn();
 return{props,nav,classes,changes,listeners,frames,windows,render,flush,loaded,schedule,pending:()=>{images=[];},detach:()=>{refs[0].current=null;},invalid:()=>{valid=false;},unmount:()=>slots.forEach(slot=>slot.cleanup?.()),observers};
}
test('FIRE_PRESERVES_VALID_HALO_AND_NAVIGATION_PALETTE_ACROSS_IDENTITY_AND_PENDING_IMAGE',()=>{
 const h=halo();h.loaded('old');h.render('a');h.flush();assert.equal(h.nav.get('--navigation-ambient'),'old-ambient');const mark=h.changes.length;
 h.pending();h.render('b');h.flush();assert.equal(h.props.get('--artwork-ambient'),'old-ambient');assert.equal(h.classes.has('immersive-background'),true);assert.ok(!h.changes.slice(mark).some(c=>c.value===null));
 h.loaded('new');h.schedule();h.flush();assert.equal(h.props.get('--artwork-ambient'),'new-ambient');assert.equal(h.nav.get('--navigation-ambient'),'new-ambient');assert.equal(h.props.get('--artwork-halo-height'),'332px');h.unmount();assert.equal(h.props.size,0);assert.equal(h.nav.size,0);
});
test('FIRE_TERMINAL_ARTWORK_ERROR_CLEARS_OLD_PALETTE_BUT_PROVIDER_LOGO_ERROR_DOES_NOT',()=>{
 const h=halo();h.loaded('old');h.render('a');h.flush();h.listeners.get('error')({target:{matches:()=>false}});assert.equal(h.nav.get('--navigation-ambient'),'old-ambient');h.flush();h.pending();h.render('b');h.listeners.get('error')({target:{matches:()=>true}});h.flush();assert.equal(h.nav.size,0);h.unmount();
});
test('FIRE_TAINTED_READY_IMAGE_RESETS_AND_UNMOUNT_CANCELS_ALL_PENDING_WORK',()=>{
 const h=halo();h.loaded('old');h.render('a');h.flush();h.invalid();h.loaded('tainted');h.render('b');h.flush();assert.equal(h.props.size,0);h.schedule();assert.equal(h.frames.size,1);h.unmount();assert.equal(h.frames.size,0);assert.equal(h.listeners.size,0);assert.equal(h.windows.size,0);assert.ok(h.observers.every(o=>!o.active));
});
test('NON_FIRE_IDENTITY_LOADING_AND_READY_ERROR_RETAIN_EXISTING_RESET_SEMANTICS',()=>{
 const h=halo(false);h.loaded('old');h.render('a');h.flush();h.pending();h.render('b');h.flush();assert.equal(h.props.size,0);assert.equal(h.nav.size,0);h.loaded('new');h.schedule();h.flush();assert.equal(h.nav.get('--navigation-ambient'),'new-ambient');h.invalid();h.schedule();h.flush();assert.equal(h.nav.size,0);h.unmount();
});
test('FIRE_MISSING_HERO_REF_CLEARS_OLD_OWNER_WITHOUT_WAITING_FOR_PAGE_UNMOUNT',()=>{
 const h=halo();h.loaded('old');h.render('a');h.flush();h.detach();h.render('missing');assert.equal(h.props.size,0);assert.equal(h.nav.size,0);assert.equal(h.frames.size,0);h.unmount();
});
console.log(JSON.stringify({result:'PASS',tests,networkRequests:0,productionEffects:true,physicalUpdatedApk:false}));
