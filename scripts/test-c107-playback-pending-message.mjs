import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

function callback(file,name,ports){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let fn;
 const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(source)===name&&ts.isCallExpression(node.initializer))fn=node.initializer.arguments[0];ts.forEachChild(node,visit);};visit(source);assert.ok(fn);
 const js=ts.transpileModule('const handler='+fn.getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 return new Function(...Object.keys(ports),js+';return handler;')(...Object.values(ports));
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function detailHarness(kind){
 const gate=deferred(),messages=[],busy=[],calls=[],model={fixture:true};
 const ports={readModel:model,defaultPlaybackService:{playMovie:(...a)=>{calls.push(a);return gate.promise;},playEpisode:(...a)=>{calls.push(a);return gate.promise;}},movieId:'movie-fixture',seriesId:'series-fixture',setIsResolving:v=>busy.push(v),setStatusKind(){},setStatusMessage:v=>messages.push(v),setResolvingEpisodeId:v=>busy.push(v),setEpisodeStatusNotice:v=>messages.push(v)};
 const fn=callback(kind==='movie'?'src/ui/pages/MovieDetailPage.tsx':'src/ui/pages/SeriesDetailPage.tsx',kind==='movie'?'handlePlayMovie':'handlePlayEpisode',ports);
 return{gate,messages,busy,calls,run:()=>fn('episode-fixture'),model};
}
let tests=0;async function test(name,fn){await fn();tests++;console.log('PASS '+name);}
for(const kind of ['movie','series']){
 await test(kind.toUpperCase()+'_PENDING_ONLY_IN_BUTTON_SUCCESS_CLEARS_BUSY',async()=>{
  const h=detailHarness(kind),done=h.run();assert.deepEqual(h.messages,[null]);assert.equal(h.busy[0],kind==='movie'?true:'episode-fixture');
  assert.deepEqual(h.calls[0],kind==='movie'?['movie-fixture',h.model]:['series-fixture','episode-fixture',h.model]);
  h.gate.resolve({state:'NATIVE_PLAYER_OPENED'});await done;assert.equal(h.messages.at(-1),null);assert.equal(h.busy.at(-1),kind==='movie'?false:null);
 });
 await test(kind.toUpperCase()+'_REFUSAL_AND_EXCEPTION_STILL_VISIBLE',async()=>{
  for(const failure of ['refused','throw']){const h=detailHarness(kind),done=h.run();assert.equal(h.messages[0],null);if(failure==='refused')h.gate.resolve({state:'NATIVE_PLAYER_ERROR',errorMessage:'Limite de sessões atingido.'});else h.gate.reject(Error('Falha de rede.'));await done;assert.equal(h.messages.at(-1),failure==='refused'?'Limite de sessões atingido.':'Falha de rede.');}
 });
}
await test('HERO_PENDING_NO_DUPLICATE_MESSAGE_STILL_BUSY_GUARDED_AND_ERROR_VISIBLE',async()=>{
 const code=ts.transpileModule(fs.readFileSync('src/ui/hooks/useHeroPlayback.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const gate=deferred(),states=[],refs=[];let si=0,ri=0,calls=0;
 const hooks={useState:v=>{const i=si++;if(!(i in states))states[i]=v;return[states[i],v=>states[i]=v];},useRef:v=>refs[ri++]||(refs[ri-1]={current:v}),useEffect(){},useCallback:fn=>fn};
 const module={exports:{}};new Function('require','module','exports',code)(name=>name==='react'?hooks:{playHeroItem:()=>{calls++;return gate.promise;}},module,module.exports);
 const model={},render=()=>{si=0;ri=0;return module.exports.useHeroPlayback(model);};const initial=render(),done=initial.onPlay({kind:'movie',id:'fixture'});
 const pending=render();assert.equal(pending.playbackBusy,true);assert.equal(pending.playbackMessage,null);await pending.onPlay({kind:'movie',id:'fixture'});assert.equal(calls,1);
 gate.resolve({state:'NATIVE_PLAYER_ERROR',errorMessage:'Não autorizado.'});await done;const failed=render();assert.equal(failed.playbackBusy,false);assert.equal(failed.playbackMessage,'Não autorizado.');
});
console.log(JSON.stringify({tests,pass:true,fixtureOnly:true,networkRequests:0}));
