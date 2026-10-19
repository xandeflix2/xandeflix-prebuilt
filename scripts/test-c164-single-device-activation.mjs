import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
function compile(file,ports={},extra={}){
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports','Deno','crypto',code)(name=>{if(name in ports)return ports[name];if(name.startsWith('jsr:'))return{};throw Error('UNCONTROLLED_PORT '+name);},module,module.exports,extra.Deno,webcrypto);
 return module.exports;
}
let tests=0;const test=async(name,run)=>{await run();tests++;console.log('PASS '+name);};
const registration=compile('supabase/functions/_shared/public-device-registration.ts');
const urls=compile('src/ui/activation/public-activation-url.ts');
const code='XF-AB12-CD34',token='a'.repeat(64),id='11111111-1111-4111-8111-111111111111';
const fields={customerFirstName:'João Silva',deviceLabel:' TV da sala ',platform:'ANDROID'};
await test('UNICODE_FIRST_NAME_ONLY_AND_STRICT_DEVICE_METADATA',()=>{
 for(const [input,expected]of [['João Silva','João'],['Lu','Lu'],['  María de Souza ','María'],['李 明','李'],["D’Ávila Santos","D’Ávila"]]){
  const result=registration.validatePublicDeviceRegistration({...fields,customerFirstName:input});assert.equal(result.success,true);assert.equal(result.value.customerFirstName,expected);assert.equal(result.value.deviceLabel,'TV da sala');
 }
 for(const change of [{customerFirstName:''},{customerFirstName:'123'},{customerFirstName:'<script>'},{customerFirstName:'a'.repeat(33)},{deviceLabel:''},{deviceLabel:'<sala>'},{deviceLabel:'sala\nquarto'},{platform:'ADMIN'}])assert.equal(registration.validatePublicDeviceRegistration({...fields,...change}).success,false);
});
function serviceHarness(){
 const calls=[];let response={success:true};
 const {PublicDeviceActivationService}=compile('src/control-plane/client/public-device-activation.service.ts',{
  '../../../supabase/functions/_shared/public-device-registration.ts':registration,
  '../../integrations/supabase/client.ts':{getSupabaseBrowserClient:()=>({functions:{invoke:async(name,request)=>{calls.push({name,body:request.body});return{data:response};}}}),parseSanitizedFunctionError:async()=>({})},
  './activation-timeout.ts':{activationDeadline:run=>run(new AbortController().signal)},
 });return{service:new PublicDeviceActivationService(),calls,respond:value=>{response=value;}};
}
await test('SERVICE_REJECTS_EXTRA_SCREENS_AND_FORGED_TARGETS_BEFORE_NETWORK',async()=>{
 const h=serviceHarness(),input={...fields,displayCode:code,sessionToken:token,sourceName:'Fixture',sourceUrl:'http://fixture.invalid/list.m3u'};
 for(const initialScreens of [0,2,3,4,5,NaN,1.5,'1'])assert.equal((await h.service.complete({...input,initialScreens})).code,'INITIAL_SCREEN_LIMIT');
 assert.equal(h.calls.length,0);
 assert.equal((await h.service.complete({...input,deviceId:'forged-other-device',maxDevices:99,licenseStatus:'ACTIVE'})).success,true);
 const body=h.calls[0].body;assert.equal(body.initialScreens,1);assert.equal(body.customerFirstName,'João');assert.equal(body.deviceLabel,'TV da sala');
 for(const name of ['deviceId','maxDevices','licenseStatus','activationKey'])assert.equal(Object.hasOwn(body,name),false);
 for(const change of [{customerFirstName:''},{deviceLabel:''},{platform:'FAKE'}])assert.equal((await h.service.complete({...input,...change})).success,false);
 assert.equal(h.calls.length,1);
});
await test('RESUME_REQUIRES_SERVER_CONFIRMED_SAME_DEVICE_AND_VALID_SESSION_RESPONSE',async()=>{
 const h=serviceHarness();h.respond({success:true,displayCode:code,sessionId:id,expiresAt:'2030-01-01T00:00:00Z'});
 const result=await h.service.resume(code,token);assert.equal(result.sessionToken,token);assert.equal(result.displayCode,code);assert.equal(h.calls[0].body.operation,'RESUME');
 h.respond({success:true,displayCode:'XF-ZZ99-XX88',sessionId:id,expiresAt:'2030-01-01T00:00:00Z'});assert.equal((await h.service.resume(code,token)).success,false);
 h.respond({success:false,code:'ACTIVATION_SESSION_EXPIRED'});assert.equal((await h.service.resume(code,token)).success,false);
});
await test('HANDOFF_CARRIES_ONLY_SHORT_CAPABILITY_AND_STRIPS_BEFORE_SDK',()=>{
 const url=new URL(urls.publicActivationHandoffUrl(urls.PUBLIC_DEVICE_ACTIVATION_URL,{displayCode:code,sessionToken:token}));
 assert.equal(url.search,'');assert.equal(url.origin,'https://xandeflix.vercel.app');assert(!url.href.includes('012345'));
 const replaced=[];const result=urls.consumePublicActivationHandoff({pathname:'/activate-device',search:'',hash:url.hash},{replaceState:(...args)=>replaced.push(args)});
 assert.deepEqual(result,{displayCode:code,sessionToken:token});assert.equal(replaced[0][2],'/activate-device');
 for(const hash of ['#device='+code+'&session=bad','#device=bad&session='+token]){
  const calls=[];assert.equal(urls.consumePublicActivationHandoff({pathname:'/activate-device',search:'',hash},{replaceState:(...args)=>calls.push(args)}),null);assert.equal(calls.length,1);
 }
 assert.equal(urls.consumePublicActivationHandoff({pathname:'/admin',search:'',hash:url.hash},{replaceState:()=>assert.fail()}),null);
 assert.throws(()=>urls.publicActivationHandoffUrl(url.origin,{displayCode:code,sessionToken:'permanent-key'}));
});
const source=fs.readFileSync('src/ui/pages/ActivationPage.tsx','utf8'),ast=ts.createSourceFile('ActivationPage.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),variables=new Map();
function visit(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name))variables.set(node.name.text,node);ts.forEachChild(node,visit);}visit(ast);
const callbackCode=ts.transpileModule(['publicActivationUrl','openExternalActivationPage'].map(name=>'const '+variables.get(name).getText(ast)+';').join('\n').replaceAll('import.meta','({env:{}})')+'\nexports.open=openExternalActivationPage;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
await test('REAL_NATIVE_CALLBACK_VALIDATES_OWN_KEY_AND_NEVER_PUTS_IT_IN_URL',async()=>{
 const calls=[],opened=[],feedback=[],exports={};let resolveStart;
 const context={exports,publicDeviceActivationUrl:urls.publicDeviceActivationUrl,publicActivationHandoffUrl:urls.publicActivationHandoffUrl,useCallback:fn=>fn,
  openingActivationRef:{current:false},localKeyState:'READY',deviceActivationKey:'012345',displayCode:code,
  setIsOpeningActivation:()=>{},setDeviceActivationFeedback:v=>feedback.push(v),
  getPublicDeviceActivationService:()=>({start:(...args)=>{calls.push(args);return new Promise(resolve=>{resolveStart=resolve;});}}),Browser:{open:async value=>opened.push(value)}};
 vm.runInNewContext(callbackCode,context);const first=exports.open();await exports.open();assert.equal(calls.length,1);assert.deepEqual(calls[0],[code,'012345']);
 resolveStart({displayCode:code,sessionToken:token,sessionId:id,expiresAt:'2030-01-01T00:00:00Z'});await first;
 assert.equal(opened.length,1);assert(!opened[0].url.includes('012345'));assert.equal(new URL(opened[0].url).search,'');assert.equal(context.openingActivationRef.current,false);
 const retry=exports.open();resolveStart({success:false,message:'Dados não conferem'});await retry;assert.equal(opened.length,1);assert.equal(feedback.at(-1),'Dados não conferem');
});
function edgeHarness(){
 let handler,created=0,deleted=0,deny=false,fail=false;const calls=[];
 const sdk={auth:{admin:{createUser:async()=>{created++;return{data:{user:{id}}};},deleteUser:async()=>{deleted++;}}},rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='rpc_public_check_device_activation_session')return{data:deny?{success:false}:{success:true,sessionId:id,expiresAt:'2030-01-01T00:00:00Z'}};
  if(name==='rpc_signal_public_check')return{data:{success:true}};
  return fail?{error:{message:'LICENSE_EDIT_REQUIRED'}}:{data:{success:true,deviceAuthorizationState:'AUTHORIZED',licenseId:id,sourceId:args.p_source_id}};
 }};
 compile('supabase/functions/device-public-activation/index.ts',{'npm:@supabase/supabase-js@2.116.0':{createClient:()=>sdk},'../_shared/public-device-registration.ts':registration,
  '../_shared/signal-policy.ts':{ensureSignalIndex:async()=>{},signalFingerprint:async()=> 'f'.repeat(64),signalVaultKey:()=>new Uint8Array(32).fill(7)}},
  {Deno:{env:{get:name=>name==='SOURCE_VAULT_KEY_V1'?Buffer.from(new Uint8Array(32).fill(7)).toString('base64'):'fixture'},serve:fn=>{handler=fn;}}});
 return{calls,stats:()=>({created,deleted}),deny:()=>{deny=true;},fail:()=>{fail=true;},request:body=>handler(new Request('https://fixture.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}))};
}
await test('EDGE_SINGLE_DEVICE_METADATA_AND_DENIAL_BEFORE_AUTH_OR_VAULT',async()=>{
 const h=edgeHarness(),input={operation:'COMPLETE',...fields,displayCode:code,sessionToken:token,sourceName:'Fixture',sourceType:'M3U',sourceUrl:'http://fixture.invalid/list.m3u',initialScreens:1};
 for(const n of [0,2,4,5,'1']){const response=await h.request({...input,initialScreens:n});assert.equal((await response.json()).code,'INITIAL_SCREEN_LIMIT');assert.equal(h.calls.length,0);assert.equal(h.stats().created,0);}
 assert.equal((await(await h.request({...input,customerFirstName:''})).json()).code,'CUSTOMER_FIRST_NAME_INVALID');assert.equal(h.calls.length,0);
 const response=await h.request({...input,deviceId:'another-device',maxDevices:99,licenseStatus:'ACTIVE'});assert.equal(response.status,200);
 const rpc=h.calls.at(-1);assert.equal(rpc.name,'rpc_public_complete_single_device');assert.equal(rpc.args.p_initial_screens,1);assert.equal(rpc.args.p_customer_first_name,'João');assert.equal(rpc.args.p_device_label,'TV da sala');
 assert(!JSON.stringify(rpc.args).includes('another-device'));assert(!JSON.stringify(rpc.args).includes('fixture.invalid'));assert.equal(h.stats().created,1);
 h.fail();const denied=await h.request(input);assert.equal((await denied.json()).code,'LICENSE_EDIT_REQUIRED');assert.equal(h.stats().deleted,1);
 const closed=edgeHarness();closed.deny();assert((await closed.request(input)).status>=400);assert.equal(closed.stats().created,0);
});
await test('EDGE_RESUME_CHECKS_CAPABILITY_WITHOUT_CUSTOMER_BOOTSTRAP',async()=>{
 const h=edgeHarness(),response=await h.request({operation:'RESUME',displayCode:code,sessionToken:token});const result=await response.json();
 assert.equal(result.success,true);assert.equal(result.displayCode,code);assert.equal(result.sessionId,id);assert.equal(h.calls.length,1);assert.equal(h.stats().created,0);assert.equal(Object.hasOwn(result,'sessionToken'),false);
 h.deny();assert((await h.request({operation:'RESUME',displayCode:code,sessionToken:token})).status>=400);
});
console.log(JSON.stringify({result:'PASS',tests,realBackendWrites:0,syntheticSourceOnly:true}));
