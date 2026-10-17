import fs from 'node:fs'; import assert from 'node:assert/strict'; import ts from 'typescript'; import vm from 'node:vm';
const source=fs.readFileSync('src/ui/components/HomeHero.tsx','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture({web=false,fire=false,reduced=false,hidden=false,busy=false,count=3}={}) {
 const state=[],refs=[],timers=new Map(),rootElement={dataset:{},contains:()=>false};let stateId=0,refId=0,serial=0,effects=[],dispose=[];
 const react={createElement:(type,props,...children)=>({type,props:props||{},children}),useMemo:fn=>fn(),
  useState:initial=>{const id=stateId++;if(!(id in state))state[id]=typeof initial==='function'?initial():initial;return[state[id],value=>{state[id]=typeof value==='function'?value(state[id]):value}];},
  useRef:initial=>refs[refId++]||=( {current:initial} ),useEffect:fn=>effects.push(fn)};
 const rows=Array.from({length:count},(_,n)=>({key:'movie:'+n,item:{id:String(n),kind:'movie',title:'Synthetic '+n}}));
 const Hero=()=>null,exported={};
 vm.runInNewContext(code,{exports:exported,navigator:{userAgent:fire?'AFTMM':'Desktop'},document:{hidden,activeElement:null,addEventListener(){},removeEventListener(){}},
  window:{matchMedia:()=>({matches:reduced,addEventListener(){},removeEventListener(){}})},performance:{now:()=>0},
  setTimeout:(fn,delay)=>{const id=++serial;timers.set(id,{fn,delay});return id},clearTimeout:id=>timers.delete(id),
  require:name=> name==='react'?{default:react,...react}: name.endsWith('useHeroLayout.ts')?{useHeroLayout:()=>false}:
   name.endsWith('device-presentation.ts')?{isFireTvPresentation:()=>fire}: name.endsWith('web/validation.ts')?{isWebValidation:()=>web}:
   name.endsWith('useHeroArtwork.ts')?{useHeroArtwork:()=>({eligible:rows.map(r=>({item:r.item,uri:'https://fixture.invalid/art.jpg'})),revision:1,eligibilityKey:'ready',pending:false})}:
   name.endsWith('/Hero.tsx')?{Hero}:{HeroPreparing:()=>null},
 });
 const props={options:rows,onSelect(){},nextBatch:async()=>false,displayed(){},playbackBusy:busy};
 function render(){dispose.forEach(fn=>fn());dispose=[];stateId=refId=0;effects=[];const tree=exported.HomeHero(props);tree.props.ref.current=rootElement;for(const effect of effects){const cleanup=effect();if(cleanup)dispose.push(cleanup)}return tree}
 let tree=render();tree=render();
 return {state,timers,props,render,Hero,rootElement,focusAndHover(){tree.props.onFocusCapture();tree.props.onPointerEnter({pointerType:'mouse'});tree=render();},
  activeId:()=>{const hero=tree.children.find(child=>child?.type===Hero);return hero?.props.item.id},
  advance(){assert.equal(timers.size,1);const timer=[...timers.values()][0];assert.equal(timer.delay,10000);timer.fn();tree=render()},
  close(){dispose.forEach(fn=>fn())}};
}
let tests=0;function test(name,run){run();tests++;console.log('PASS '+name)}
test('WEB_HOVER_AND_FOCUS_DO_NOT_STALL_READY_ARTWORK_TEN_SECOND_TIMER',()=>{const f=fixture({web:true});f.focusAndHover();assert.equal(f.rootElement.dataset.webHeroTimer,'ARMED');assert.equal(f.activeId(),'0');f.advance();assert.equal(f.activeId(),'1');f.advance();assert.equal(f.activeId(),'2');assert.equal(f.rootElement.dataset.webHeroTicks,'2');f.close();assert.equal(f.timers.size,0);assert.equal(f.rootElement.dataset.webHeroTimer,'STOPPED')});
test('OTHER_DEVICES_KEEP_HOVER_FOCUS_POLICY_AND_FIRE_KEEP_EXISTING_ROTATION',()=>{const normal=fixture();normal.focusAndHover();assert.equal(normal.timers.size,0);normal.close();const fire=fixture({fire:true});fire.focusAndHover();fire.advance();assert.equal(fire.activeId(),'1');fire.close()});
test('WEB_EXPLICIT_ROTATION_KEEPS_TEN_SECONDS_WITH_REDUCED_MOTION_NATIVE_STILL_PAUSES',()=>{const web=fixture({web:true,reduced:true});web.focusAndHover();web.advance();assert.equal(web.activeId(),'1');web.close();const native=fixture({reduced:true});assert.equal(native.timers.size,0);native.close()});
test('HIDDEN_BUSY_SINGLE_OPTION_STILL_PAUSE_WEB',()=>{for(const options of[{hidden:true},{busy:true},{count:1}]){const f=fixture({web:true,...options});f.focusAndHover();assert.equal(f.timers.size,0,JSON.stringify(options));f.close()}});
test('OFFSCREEN_AND_ACTIVE_GESTURE_STILL_CANCEL_ROTATION',()=>{for(const index of[4,1]){const f=fixture({web:true});f.state[index]=index===4?false:true;f.render();assert.equal(f.timers.size,0);f.close()}});
fs.writeFileSync('tmp/c136-browser-web/hero-tests.json',JSON.stringify({result:'PASS',tests,actualComponentHooksAndClockSynthetic:true,noNetwork:true},null,2));
