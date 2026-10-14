import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const load=(file,require,ports={})=>{const module={exports:{}};const code=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',...Object.keys(ports),code)(require,module,module.exports,...Object.values(ports));return module.exports;};
const presentation=load('src/ui/device-presentation.ts',()=>({}));
let choice='PHONE',refs=[],refIndex=0,now=0;
const hooks={...React,useRef:value=>refs[refIndex++]||(refs[refIndex-1]={current:value}),useState:value=>[typeof value==='function'?value():value,()=>{}],useEffect:()=>{}};
const hero=load('src/ui/components/Hero.tsx',name=>{
 if(name==='react')return hooks;
 if(name.includes('useDevicePresentation'))return{useDevicePresentation:()=>choice};
 if(name.endsWith('device-presentation.ts'))return presentation;
 if(name.includes('NewContentProvider'))return{useContentBadge:()=>undefined};
 if(name.includes('useImmersiveArtwork'))return{useImmersiveArtwork:()=>undefined};
 if(name.includes('useCachedArtwork'))return{useCachedArtwork:uri=>({src:uri,handleCacheError:()=>false})};
 if(name.includes('useArtworkMetadata'))return{useArtworkMetadata:()=>null};
 if(name.includes('tmdb-metadata.service'))return{tmdbPosterPath:()=>undefined};
 return{};
},{performance:{now:()=>now}});
const item=(id,kind='movie')=>({id,kind,title:'Fixture '+id,yearFormatted:'2026',genreLabels:[],categoryLabels:[]});
const find=(tree,predicate)=>{if(!tree)return;if(Array.isArray(tree)){for(const node of tree){const found=find(node,predicate);if(found)return found;}return;}if(typeof tree!=='object')return;if(predicate(tree))return tree;return find(tree.props?.children,predicate);};
const selected=[],played=[];
function render(value){refIndex=0;return hero.Hero({item:value,artworkUri:'data:image/svg+xml,synthetic',onSelect:row=>selected.push(row),onPlay:row=>played.push(row)});}
const action=tree=>find(tree,node=>node.props?.className?.includes('hero-artwork-link'));
const event=(detail=1)=>({detail,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}});
const pointer=(x=10,y=10)=>({pointerId:1,isPrimary:true,clientX:x,clientY:y});
let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name);}
await test('PROFILE_PHONE_TABLET_INDEPENDENT_OF_ORIENTATION_TV_AND_DESKTOP_EXCLUDED',()=>{
 for(const selected of ['PHONE','TABLET'])assert.equal(hero.canOpenHeroArtworkDetails(selected,'Desktop',0),true);
 assert.equal(hero.canOpenHeroArtworkDetails('TV','Android Mobile',5),false);
 for(const ua of ['Android Mobile','Android Tablet','iPhone','iPad'])assert.equal(hero.canOpenHeroArtworkDetails(null,ua,1),true);
 assert.equal(hero.canOpenHeroArtworkDetails(null,'Macintosh',5),true);
 for(const ua of ['Windows Chrome','Macintosh','Android AFTSS','Android TV','Tizen','webOS'])assert.equal(hero.canOpenHeroArtworkDetails(null,ua,0),false);
 choice='TV';assert.equal(action(render(item('tv'))),undefined);choice='PHONE';
});
await test('ARTWORK_TAP_AND_DETAILS_BUTTON_OPEN_EXACT_DISPLAYED_ITEM_ONCE_WITH_ACCESSIBLE_ACTION',()=>{
 for(const profile of ['PHONE','TABLET'])for(const kind of ['movie','series']){
  choice=profile;refs=[];selected.length=0;played.length=0;const value=item(profile+kind,kind),tree=render(value),button=action(tree);
  assert.equal(button.type,'button');assert.equal(button.props.type,'button');assert.equal(button.props['aria-label'],'Ver detalhes de '+value.title);
  button.props.onPointerDown(pointer());button.props.onPointerUp(pointer());button.props.onClick(event());assert.deepEqual(selected,[value]);
  const details=find(tree,node=>node.type==='button'&&node.props.children==='Ver Detalhes');details.props.onClick();assert.deepEqual(selected,[value,value]);
  const play=find(tree,node=>node.props?.className?.includes('hero-btn-play'));play.props.onClick();assert.deepEqual(played,[value]);assert.equal(selected.length,2);
 }
});
await test('STATIC_IMAGE_DRAG_CANCEL_STALE_ITEM_REJECTED_KEYBOARD_STILL_AVAILABLE',()=>{
 choice='TABLET';refs=[];selected.length=0;now=0;let button=action(render(item('before')));
 button.props.onPointerDown(pointer());button.props.onPointerUp(pointer(11,65));const drag=event();button.props.onClick(drag);assert.equal(selected.length,0);assert.equal(drag.prevented,true);
 button.props.onPointerDown(pointer());button.props.onPointerCancel();button.props.onClick(event());assert.equal(selected.length,0);
 button.props.onClick(event(0));assert.equal(selected.length,1);
 now=1000;button.props.onPointerDown(pointer());button=action(render(item('after')));button.props.onClick(event());assert.equal(selected.length,1);
 button.props.onPointerDown(pointer());button.props.onPointerUp(pointer());button.props.onClick(event());assert.equal(selected.at(-1).id,'after');
});

function carouselHarness(count=2,fire=false){const states=[],values=[],effects=[],timers=[];let stateIndex=0,refIndex=0,time=0;
 const hooks={...React,useMemo:fn=>fn(),useEffect:(run,deps)=>effects.push({run,deps}),useState:value=>{const index=stateIndex++;if(!(index in states))states[index]=typeof value==='function'?value():value;return[states[index],next=>{states[index]=typeof next==='function'?next(states[index]):next;}];},useRef:value=>values[refIndex++]||(values[refIndex-1]={current:value})};
 const options=Array.from({length:count},(_,i)=>({key:'key:'+i,item:item('row:'+i),fresh:false}));
 const {HomeHero}=load('src/ui/components/HomeHero.tsx',name=>name==='react'?hooks:name.includes('useHeroLayout')?{useHeroLayout:()=>false}:name.includes('useHeroArtwork')?{useHeroArtwork:items=>({eligible:items.map(item=>({item,uri:'synthetic'})),revision:0,pending:false})}:name.endsWith('Hero.tsx')?{Hero:()=>null}:{},{document:{activeElement:null},performance:{now:()=>time},navigator:{userAgent:fire?'Android AFTSS':'Android Mobile'},setTimeout:(fn,delay)=>{timers.push({fn,delay});return 1;},clearTimeout:()=>{}});
 const render=(extra={})=>{stateIndex=0;refIndex=0;effects.length=0;return HomeHero({options,onSelect(){},nextBatch:async()=>false,displayed(){},...extra});};
 const target={closest:()=>target,classList:{contains:name=>name==='hero-artwork-link'}};
 const root={clientWidth:400,contains:()=>false,hasPointerCapture:()=>false,setPointerCapture(){}};
 const pointer=(x,y,stamp)=>({pointerId:1,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,timeStamp:stamp,currentTarget:root,target});
 return{render,pointer,setTime:value=>{time=value;},target,states,timers,timerEffect:()=>effects.find(effect=>effect.run.toString().includes('advanceRef.current')),addOption:()=>options.push({key:'key:2',item:item('row:2'),fresh:false})};
}
await test('CAROUSEL_IMAGE_ACCEPTS_TAP_AND_HORIZONTAL_SWIPE_WITHOUT_RESIDUAL_NAVIGATION',()=>{
 const h=carouselHarness(),root=h.render();root.props.onPointerDown(h.pointer(200,20,0));root.props.onPointerUp(h.pointer(200,20,100));const tap=event();root.props.onClickCapture(tap);assert.equal(tap.prevented,undefined);
 root.props.onPointerDown(h.pointer(200,20,200));root.props.onPointerMove(h.pointer(100,22,300));root.props.onPointerUp(h.pointer(100,22,400));const after=h.render();assert.equal(after.props.children.props.item.id,'row:1');const click=event();after.props.onClickCapture(click);assert.equal(click.prevented,true);assert.equal(click.stopped,true);
 h.setTime(500);const next=h.render();next.props.onPointerDown(h.pointer(100,20,500));next.props.onPointerMove(h.pointer(200,20,600));next.props.onPointerUp(h.pointer(200,20,700));assert.equal(h.render().props.children.props.item.id,'row:0');
});
await test('VERTICAL_SLOW_CANCELLED_AND_SINGLE_OPTION_DRAGS_DO_NOT_OPEN_DETAILS',()=>{
 for(const [count,dx,dy,elapsed] of [[2,0,70,200],[2,100,0,1800],[1,0,70,200]]){
  const h=carouselHarness(count),root=h.render();root.props.onPointerDown(h.pointer(200,20,0));root.props.onPointerMove(h.pointer(200+dx,20+dy,100));root.props.onPointerUp(h.pointer(200+dx,20+dy,elapsed));const click=event();h.render().props.onClickCapture(click);assert.equal(click.prevented,true);assert.equal(h.render().props.children.props.item.id,'row:0');
 }
 const h=carouselHarness(),root=h.render();root.props.onPointerDown(h.pointer(200,20,0));root.props.onPointerCancel();const click=event();root.props.onClickCapture(click);assert.equal(click.prevented,true);
});
await test('OTHER_BUTTONS_DOTS_AND_TEN_SECOND_TIMER_PRESERVED',()=>{
 const h=carouselHarness(),root=h.render();h.target.classList.contains=()=>false;root.props.onPointerDown(h.pointer(200,20,0));root.props.onPointerUp(h.pointer(100,20,200));assert.equal(h.render().props.children.props.item.id,'row:0');
 const source=read('src/ui/components/HomeHero.tsx');assert.ok(source.includes('}, 10000)'));assert.ok(source.includes('hero-carousel-dot'));assert.ok(source.includes('onPlay={onPlay}'));
});
await test('FIRE_FOCUSED_HERO_ROTATES_AT_TEN_SECONDS_WHILE_OTHER_PROFILES_KEEP_FOCUS_PAUSE',()=>{
 for(const fire of [false,true]){const h=carouselHarness(2,fire);h.states[4]=true;const root=h.render();root.props.onFocusCapture();h.render();h.timerEffect().run();assert.equal(h.timers.length,fire?1:0);if(fire){assert.equal(h.timers[0].delay,10000);h.timers[0].fn();assert.equal(h.render().props.children.props.item.id,'row:1');}}
});
await test('ARTWORK_ARRIVAL_KEEPS_DEADLINE_AND_PLAYBACK_HIDDEN_GESTURE_REDUCED_STILL_PAUSE',()=>{
 const h=carouselHarness(2,true);h.states[4]=true;h.render();const before=h.timerEffect().deps;h.addOption();h.render();assert.deepEqual(h.timerEffect().deps,before);
 for(const index of [1,5,6,7]){const fixture=carouselHarness(2,true);fixture.states[4]=true;fixture.states[index]=true;fixture.render();fixture.timerEffect().run();assert.equal(fixture.timers.length,0);}
 const busy=carouselHarness(2,true);busy.states[4]=true;busy.render({playbackBusy:true});busy.timerEffect().run();assert.equal(busy.timers.length,0);
 const css=read('src/index.css');assert.ok(css.includes('.app-shell--fire-stick .live-continuous-name { font-size: var(--tv-font-xs, 0.85rem)'));
});
console.log(JSON.stringify({tests,pass:true,fixtureOnly:true,networkRequests:0}));
