import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const read = path => fs.readFileSync(path, 'utf8');
function compile(path, ports = {}, extra = '') {
  const module = { exports: {} };
  const source = ts.transpileModule(read(path)+extra, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  new Function('require','module','exports', source)(name => name.endsWith('.css') ? {} : name in ports ? ports[name] : (()=>{throw Error('Missing port '+name)})(), module, module.exports);
  return module.exports;
}
let count=0; async function test(name, run){await run();console.log('PASS '+name);count++;}
const code=compile('src/ui/activation/device-code-input.ts');
const id='12345678-1234-4234-8234-123456789abc';
await test('CODE_BODY_PREFIX_PASTE_LOWERCASE_PARTIAL_AND_XF_IN_BODY',()=>{
  for(const raw of ['ab12cd34','XF-AB12-CD34','xfab12cd34','ab12-cd34',' ab12 cd34 '])assert.equal(code.formatDeviceCodeInput(raw),'XF-AB12-CD34');
  assert.equal(code.formatDeviceCodeInput('xf12ab34'),'XF-XF12-AB34');
  assert.equal(code.formatDeviceCodeInput('a'),'XF-A');assert.equal(code.formatDeviceCodeInput('ab12c'),'XF-AB12-C');
  assert.equal(code.formatDeviceCodeInput(''), '');assert.equal(code.validDeviceCode('XF-AB12-C'),false);
});
const shareCalls=[],copyCalls=[];let canShare=true,shareError;
const share=compile('src/ui/activation/activation-share.ts',{'@capacitor/share':{Share:{canShare:async()=>({value:canShare}),share:async payload=>{if(shareError)throw shareError;shareCalls.push(payload)}}},'./activation-clipboard.ts':{copyActivationText:async value=>copyCalls.push(value)},'./device-code-input.ts':code});
await test('SHARE_EXACT_CODE_KEY_NO_TOKEN_SOURCE_AND_HONEST_CANCEL_FALLBACK',async()=>{
 const payload=share.activationShareText('XF-AB12-CD34','012345');assert.equal(payload,'Ativação Xandeflix\nCódigo ID: XF-AB12-CD34\nChave de 6 dígitos: 012345');
 assert.throws(()=>share.activationShareText('XF-....-....',''));assert.throws(()=>share.activationShareText('XF-AB12-CD34','https://bad.invalid'));
 assert.equal(await share.shareActivation('XF-AB12-CD34','012345'),'shared');assert.equal(shareCalls[0].text,payload);assert.equal(shareCalls[0].url,undefined);
 shareError=Error('Share canceled');assert.equal(await share.shareActivation('XF-AB12-CD34','012345'),'cancelled');shareError=Error('Plugin failed');await assert.rejects(share.shareActivation('XF-AB12-CD34','012345'));
 canShare=false;assert.equal(await share.shareActivation('XF-AB12-CD34','012345'),'copied');assert.deepEqual(copyCalls,[payload]);
});
const {ActivationHandoffService}=compile('src/control-plane/client/activation-handoff.service.ts',{'../../integrations/supabase/client.ts':{getSupabaseBrowserClient:()=>undefined},'./device-activation-sync.service.ts':{},'./device-activation.service.ts':{},'../../ui/activation/device-code-input.ts':code});
await test('SUBMIT_PROOF_METADATA_ONLY_TIMEOUT_ABORT_AND_MALFORMED_ACK',async()=>{
 const calls=[],proof={activationId:id,deviceId:'fixture',activationStatusSecret:'fixture-status-capability'};
 let result={data:{success:true,notificationId:id}};
 const service=new ActivationHandoffService({rpc(name,args){calls.push({name,args});return Promise.resolve(result)}},async()=>proof,15);
 assert.equal(await service.send('TV sala','ANDROID_TV','a1b2c3d4'),id);assert.equal(calls[0].args.p_manager_code,'A1B2C3D4');assert.equal(calls[0].args.p_status_secret,proof.activationStatusSecret);
 for(const key of ['activationKey','activationKeyHash','sourceUrl','deviceToken'])assert.equal(Object.hasOwn(calls[0].args,key),false);
 await assert.rejects(service.send('https://bad.invalid','ANDROID_TV',''));await assert.rejects(service.send('TV sala','FAKE',''));assert.equal(calls.length,1);
 const controller=new AbortController();controller.abort();await assert.rejects(service.send('TV sala','WEBOS','',controller.signal));assert.equal(calls.length,1);
 result={data:{success:false,code:'HANDOFF_ROUTING_INVALID'}};await assert.rejects(service.send('TV sala','WEBOS',''),/HANDOFF_ROUTING_INVALID/);
 result={data:{success:true,notificationId:'bad'}};await assert.rejects(service.send('TV sala','WEBOS',''));
 const stalled=new ActivationHandoffService({rpc(){return new Promise(()=>{})}},async()=>proof,10);await assert.rejects(stalled.send('TV sala','TIZEN',''));
});
await test('INBOX_STRICT_FIELDS_CLAIM_NO_PIN_AND_STALE_FAILURE',async()=>{
 let result={data:{success:true,unreadCount:1,notifications:[{id,displayCode:'XF-AB12-CD34',nickname:'TV sala',platform:'FIRE_TV',receivedAt:new Date().toISOString(),read:false,available:true}],hasMore:false}};
 const service=new ActivationHandoffService({rpc(){return Promise.resolve(result)}},async()=>null);
 assert.equal((await service.inbox()).notifications[0].platform,'FIRE_TV');await assert.rejects(service.inbox('bad'));
 result.data.notifications[0].platform='OTHER';await assert.rejects(service.inbox());
 result={data:{success:true,id,displayCode:'XF-AB12-CD34',nickname:'TV sala',platform:'WEBOS',expiresAt:new Date(Date.now()+1000).toISOString()}};
 const claim=await service.open(id);assert.equal(Object.hasOwn(claim,'activationKey'),false);assert.equal(Object.hasOwn(claim,'activationKeyHash'),false);
 result={data:{success:false,code:'HANDOFF_EXPIRED'}};await assert.rejects(service.open(id),/HANDOFF_EXPIRED/);
});
const {SupabaseManagerRemoteControlPlaneAuthority}=compile('src/control-plane/client/manager-remote-control-plane-authority.ts');
await test('ACTUAL_MANAGER_MANUAL_AND_NOTIFICATION_PAYLOAD_NO_KEY_IN_HANDOFF',async()=>{
 const calls=[];const client={auth:{getSession:async()=>({data:{session:{user:{id}}}})},functions:{invoke:async(name,args)=>{calls.push(args.body);return {data:{success:true,deviceId:'fixture',displayCode:'XF-AB12-CD34',licenseId:id,sourceId:'opaque',deviceAuthorizationState:'AUTHORIZED',sourceBindingStatus:'ACTIVE',licenseStatus:'ACTIVE',sourceResolution:'SOURCE_READY'}}}}};
 const authority=new SupabaseManagerRemoteControlPlaneAuthority(client);const common={flowMode:'EXISTING_CUSTOMER',displayCode:'XF-AB12-CD34',customerId:id,existingDeviceCode:'XF-ZZ12-YY34'};
 await authority.activateSourceForDevice({...common,activationKey:'012345'});assert.equal(calls[0].activationKey,'012345');
 await authority.activateSourceForDevice({...common,activationKey:'',activationNotificationId:id});assert.equal(calls[1].activationNotificationId,id);assert.equal(Object.hasOwn(calls[1],'activationKey'),false);
 await assert.rejects(authority.activateSourceForDevice({...common,activationKey:'',activationNotificationId:'bad'}));assert.equal(calls.length,2);
});
await test('REAL_EDGE_AUTH_MANAGER_FROM_VERIFIED_USER_HASH_SERVER_ONLY',async()=>{
 const calls=[];let valid=true,authenticated=true;
 globalThis.Deno={env:{get:name=>({SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'fixture-anon',SUPABASE_SERVICE_ROLE_KEY:'fixture-service'})[name]},serve(){}};
 const edge=compile('supabase/functions/managed-source-vault-admin/index.ts',{'jsr:@supabase/functions-js/edge-runtime.d.ts':{},'npm:@supabase/supabase-js@2.116.0':{createClient:(_url,key)=> key==='fixture-service' ? {rpc:async(name,args)=>{calls.push({name,args});return {data:valid?{success:true,activationKeyHash:'a'.repeat(64)}:{success:false}}}} : {auth:{getUser:async()=>({data:{user:authenticated?{id}:null}})},rpc:async(name,args)=>{calls.push({name,args});return {data:{success:true,deviceId:'fixture',displayCode:'XF-AB12-CD34',customerId:id,licenseId:id,sourceId:'opaque',deviceAuthorizationState:'AUTHORIZED',sourceBindingStatus:'ACTIVE',licenseStatus:'ACTIVE',sourceResolution:'SOURCE_READY'}}}}}},'\nexport { handle };');
 const body={operation:'ACTIVATE_SOURCE_FOR_DEVICE',flowMode:'EXISTING_CUSTOMER',displayCode:'XF-AB12-CD34',activationNotificationId:id,managerId:'forged',customerId:id,existingDeviceCode:'XF-ZZ12-YY34'};
 const request=()=>new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture-token','Content-Type':'application/json'},body:JSON.stringify(body)});
 const response=await edge.handle(request());const result=await response.json();assert.equal(result.success,true);assert.equal(JSON.stringify(result).includes('activationKey'),false);
 assert.equal(calls[0].args.p_manager_id,id);assert.equal(calls[1].name,'rpc_manager_complete_device_activation');assert.equal(calls[1].args.p_activation_key_hash,'a'.repeat(64));
 valid=false;await assert.rejects(edge.handle(request()),/HANDOFF_EXPIRED/);authenticated=false;const before=calls.length;await assert.rejects(edge.handle(request()),/AUTH_REQUIRED/);assert.equal(calls.length,before);delete globalThis.Deno;
});
await test('STATIC_WIRING_FIRST_ACTIVATION_MANUAL_PRESERVED_AND_SQL_PRIVILEGES',()=>{
 const page=read('src/ui/pages/ActivationPage.tsx'),manager=read('src/debug/manager/ManagerPanelPage.tsx');assert.match(page,/<ActivationHandoff/);assert.match(page,/pending=\{authUiState !== 'AUTHORIZED'\}/);
 assert.equal((manager.match(/<DeviceCodeInput/g)||[]).length,4);assert.match(manager,/onOpenClaim=\{claim/);assert.match(manager,/setActiveTab\('ATIVACAO'\)/);assert.match(manager,/deviceActivationSession \|\| activationNotificationClaim/);
 const activationIcon=read('src/debug/manager/ManagerActivationRequests.tsx'),errorIcon=read('src/debug/manager/ManagerPlaybackErrors.tsx');
 assert.match(activationIcon,/title="Solicitações de ativação"/);assert.notEqual(activationIcon.match(/<path d="([^"]+)"/)[1],errorIcon.match(/<path d="([^"]+)"/)[1]);
 const sql=read('supabase/migrations/20261011221900_c11_activation_handoff.sql');assert.equal((sql.match(/ENABLE ROW LEVEL SECURITY/g)||[]).length,3);assert.match(sql,/resolve_hash\(UUID,UUID,TEXT\) TO service_role/);assert.match(sql,/activation_status_secret_hash IS DISTINCT FROM/);assert.match(sql,/15 minutes/);assert.match(sql,/o.manager_id IS DISTINCT FROM/);
 const input=compile('src/ui/components/DeviceCodeInput.tsx',{'react':React,'../activation/device-code-input.ts':code});
 const html=renderToStaticMarkup(React.createElement(input.DeviceCodeInput,{value:'XF-AB12-CD34',onValueChange(){},required:true}));assert.match(html,/XF-/);assert.match(html,/value="AB12-CD34"/);assert.match(html,/aria-label="Código ID"/);
});
console.log('C74_ACTIVATION_HANDOFF='+count+'_GROUPS_PASS (synthetic ports; no notifications sent to real users)');
