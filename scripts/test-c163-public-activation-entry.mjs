import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
const urlModule={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/ui/activation/public-activation-url.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:urlModule,URL});
const { PUBLIC_DEVICE_ACTIVATION_URL, publicDeviceActivationUrl, isPublicActivationLocation }=urlModule;

let tests=0;const test=async(name,run)=>{await run();tests++;console.log('PASS '+name);};
await test('DEFAULT_IS_PUBLIC_HTTPS_WITHOUT_WEBVIEW_ORIGIN_OR_SECRETS',()=>{
  for(const value of [undefined,null,'','  ','http://localhost:3000','https://localhost','https://sub.localhost','https://127.0.0.1','https://192.168.1.2','https://[::1]','https://device.local','javascript:alert(1)','https://fixture.invalid/?key=synthetic','https://u:p@fixture.invalid/','https://fixture.invalid/app','https://fixture.invalid/#token=synthetic'])assert.equal(publicDeviceActivationUrl(value),PUBLIC_DEVICE_ACTIVATION_URL);
  assert.equal(PUBLIC_DEVICE_ACTIVATION_URL,'https://xandeflix.vercel.app/activate-device');
});
await test('PUBLIC_BASE_FULL_URL_AND_LEGACY_HASH_ARE_NORMALIZED_ONCE',()=>{
  for(const value of ['https://activation.example','https://activation.example/','https://activation.example/activate-device','https://activation.example/activate-device/','https://activation.example/#/activate-device'])assert.equal(publicDeviceActivationUrl(value),'https://activation.example/activate-device');
});
await test('PUBLIC_ROUTE_MATCH_IS_EXACT_AND_DOES_NOT_REPLACE_ADMIN',()=>{
  for(const value of [{pathname:'/activate-device',hash:''},{pathname:'/',hash:'#/activate-device'}])assert.equal(isPublicActivationLocation(value),true);
  for(const value of [{pathname:'/admin',hash:'#/activate-device'},{pathname:'/activate-device-other',hash:''},{pathname:'/app',hash:''}])assert.equal(isPublicActivationLocation(value),false);
});

const source=fs.readFileSync('src/ui/pages/PublicDeviceActivationPage.tsx','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
const collect=(tree,predicate)=>{const out=[];const walk=node=>{if(Array.isArray(node)){node.forEach(walk);return;}if(!node?.props)return;if(predicate(node))out.push(node);walk(node.props.children);};walk(tree);return out;};
const text=node=>typeof node==='string'?node:Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):'';
function harness(){
  let cursor=0;const states=[],calls=[]; const registration={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('supabase/functions/_shared/public-device-registration.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:registration});let startOk=false,completeOk=false;
  const react={...React,useEffect:()=>{},useRef:()=>({current:null}),useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return[states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];}};
  const DeviceCodeInput=()=>null,service={start:async(...args)=>{calls.push(['START',...args]);return startOk?{displayCode:args[0],sessionToken:'synthetic-session',sessionId:'synthetic-session-id',expiresAt:'2030-01-01T00:00:00Z'}:{success:false,message:'Dados invalidos de teste'};},complete:async params=>{calls.push(['COMPLETE',params]);return completeOk?{success:true}:{success:false,message:'Falha controlada de teste'};}};
  const ports={'../../../supabase/functions/_shared/public-device-registration.ts':registration,'react':react,'@capacitor/core':{Capacitor:{isNativePlatform:()=>false}},'../components/DeviceCodeInput.tsx':{DeviceCodeInput},'../../control-plane/client/public-device-activation.service.ts':{getPublicDeviceActivationService:()=>service}};
  const module={exports:{}};new Function('require','module','exports',compiled)(name=>{assert.ok(Object.hasOwn(ports,name),'Uncontrolled dependency');return ports[name];},module,module.exports);
  return{render:()=>{cursor=0;return module.exports.PublicDeviceActivationPage({});},calls,states,DeviceCodeInput,start:()=>{startOk=true;},complete:()=>{completeOk=true;}};
}
await test('REAL_PUBLIC_FORM_NEEDS_CODE_KEY_THEN_SOURCE_AND_NEVER_MANAGER_LOGIN',async()=>{
  const h=harness();let tree=h.render();assert.match(text(tree),/Ative seu novo aparelho/);assert.ok(!text(tree).includes('Usuário do gestor'));
  collect(tree,n=>n.type===h.DeviceCodeInput)[0].props.onValueChange('XF-TEST-0001');collect(tree,n=>n.type==='input'&&n.props.pattern==='[0-9]{6}')[0].props.onChange({target:{value:'123456'}});
  await collect(h.render(),n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});tree=h.render();assert.match(text(tree),/Dados invalidos/);assert.ok(!text(tree).includes('URL da playlist M3U/M3U8'));
  h.start();await collect(tree,n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});tree=h.render();assert.match(text(tree),/URL da playlist M3U\/M3U8/);assert.equal(h.states[1],'');
  collect(tree,n=>n.type==='input'&&n.props.autoComplete==='given-name')[0].props.onChange({target:{value:'João Silva'}});collect(tree,n=>n.type==='input'&&n.props.placeholder==='Ex.: TV da sala')[0].props.onChange({target:{value:'TV da sala'}});
  collect(tree,n=>n.type==='input'&&n.props.type==='url')[0].props.onChange({target:{value:'http://synthetic.invalid/list.m3u'}});
  await collect(h.render(),n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});tree=h.render();assert.match(text(tree),/Falha controlada/);assert.ok(!text(tree).includes('Dispositivo pronto para sincronizar'));
  h.complete();await collect(tree,n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});tree=h.render();assert.match(text(tree),/Dispositivo pronto para sincronizar/);assert.equal(collect(tree,n=>n.type==='input').length,0);
  const result=h.calls.at(-1)[1];assert.equal(result.displayCode,'XF-TEST-0001');assert.equal(result.sessionToken,'synthetic-session');assert.equal(result.sourceUrl,'http://synthetic.invalid/list.m3u');assert.equal(result.initialScreens,1);assert.equal(result.customerFirstName,'João');assert.equal(result.deviceLabel,'TV da sala');assert.equal(result.platform,'ANDROID');
});
console.log(JSON.stringify({result:'PASS',tests,liveBackendWrites:0,realCallbackAndPublicForm:true}));

await import('./test-c164-single-device-activation.mjs');
