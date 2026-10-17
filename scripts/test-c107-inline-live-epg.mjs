import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name);}
const source=fs.readFileSync('src/ui/pages/LiveTvPage.tsx','utf8'),start=source.indexOf('{isMobile || squareLive ?'),end=source.indexOf('</div>}',start)+7;
assert.ok(start>0&&end>start);const expression=source.slice(start+1,end);
const channel={id:'synthetic',name:'Synthetic channel',groupId:'group',streamRef:{}};
await test('WIDE_GUIDE_EMBEDDED_OPEN_MOBILE_FOOTER_AND_SQUARE_UNCHANGED',()=>{
 for(const[isMobile,squareLive]of [[false,false],[true,false],[false,true],[true,true]]){
  const module={exports:{}},code=ts.transpileModule('module.exports=('+expression+');',{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
  const LiveEpgPanel=()=>null;new Function('React','module','isMobile','squareLive','selectedChannel','isEpgOpen','setIsEpgOpen','liveCatalog','LiveEpgPanel','favoriteButton','guideChannel','browsingGuide',code)(React,module,isMobile,squareLive,channel,false,()=>{}, {groups:[]},LiveEpgPanel,React.createElement('button',{type:'button','aria-label':'Favoritar canal'},'★'),channel,false);
  const find=n=>!n||typeof n!=='object'?undefined:n.type===LiveEpgPanel?n:Array.isArray(n)?n.map(find).find(Boolean):find(n.props?.children),panel=find(module.exports);assert.ok(panel);
  if(!isMobile&&!squareLive){assert.equal(panel.props.embedded,true);assert.equal(panel.props.inline,true);assert.equal(panel.props.open,true);}
  else{assert.equal(panel.props.embedded,undefined);assert.equal(panel.props.inline,squareLive);assert.equal(panel.props.open,squareLive);}
 }
 assert.equal(source.includes('Abrir guia de programação'),false);
});
function fixture(result){
 const effects=[],writes=[],content={scrollTop:0,clientHeight:100,scrollHeight:500,scrollBy({top}){this.scrollTop+=top;}},root={querySelector:()=>content};
 const hooks={useRef:v=>({current:v===null?root:v}),useState:v=>[v===null?result:typeof v==='function'?v():v,next=>writes.push(next)],useEffect:fn=>effects.push(fn),useLayoutEffect(){}};
 const module={exports:{}},file=fs.readFileSync('src/ui/components/LiveEpgPanel.tsx','utf8')+'\nexport {EpgSchedule};',code=ts.transpileModule(file,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
 let resolve,signal;
 new Function('require','module','exports','React','setInterval','clearInterval',code)(name=>name==='react'?hooks:{liveEpgService:{load:(_,s)=>{signal=s;return new Promise(r=>resolve=r);}}},module,module.exports,React,()=>1,()=>{});
 return{...module.exports,effects,writes,root,content,release:v=>resolve(v),signal:()=>signal};
}
await test('CURRENT_NEXT_PROGRAM_TIMES_PROGRESS_AND_MISSING_DATA_REAL_MESSAGES',()=>{
 const now=Date.now(),result={status:'ready',programs:[{id:'old',title:'Old synthetic',start:now-20000,end:now-1000},{id:'current',title:'Current synthetic',start:now-1000,end:now+10000},{id:'next',title:'Next synthetic',start:now+10000,end:now+20000}]};
 const f=fixture(result),html=renderToStaticMarkup(f.EpgSchedule({channel}));assert.equal(html.includes('Old synthetic'),false);assert.ok(html.includes('Current synthetic'));assert.ok(html.includes('Next synthetic'));assert.ok(html.includes('<progress'));assert.ok(html.includes('Agora'));assert.ok(html.includes('A seguir'));
 const missing=fixture({status:'unavailable',programs:[]}),text=renderToStaticMarkup(missing.EpgSchedule({channel}));assert.ok(text.includes('A fonte não forneceu uma grade compatível'));assert.equal(text.includes('<progress'),false);
});
await test('EMBEDDED_REMOTE_SCROLL_RETURNS_NAVIGATION_AT_EDGES_SQUARE_NO_OVERRIDE',()=>{
 const f=fixture(null),panel=f.LiveEpgPanel({channel,open:true,inline:true,embedded:true,onToggle(){}});assert.equal(panel.props.tabIndex,0);
 const event=key=>({key,target:f.root,currentTarget:f.root,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}});
 const down=event('ArrowDown');panel.props.onKeyDown(down);assert.equal(f.content.scrollTop,64);assert.equal(down.prevented,true);
 f.content.scrollTop=400;const end=event('ArrowDown');panel.props.onKeyDown(end);assert.equal(end.prevented,undefined);
 f.content.scrollTop=0;const up=event('ArrowUp');panel.props.onKeyDown(up);assert.equal(up.prevented,undefined);
 const square=f.LiveEpgPanel({channel,open:true,inline:true,onToggle(){}});assert.equal(square.props.onKeyDown,undefined);assert.equal(square.props.tabIndex,undefined);
});
await test('CHANNEL_UNMOUNT_ABORTS_EXISTING_LOADER_AND_IGNORES_LATE_PROGRAMS',async()=>{
 const f=fixture(null);f.EpgSchedule({channel});const cleanup=f.effects[0]();assert.equal(f.signal().aborted,false);const before=f.writes.length;cleanup();assert.equal(f.signal().aborted,true);f.release({status:'ready',programs:[]});await Promise.resolve();assert.equal(f.writes.length,before);
});
console.log(JSON.stringify({tests,pass:true,syntheticOnly:true,mediaRequests:0}));
