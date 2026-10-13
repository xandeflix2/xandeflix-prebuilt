import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { webcrypto } from 'node:crypto';
function compile(path,ports={}) {
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>name.endsWith('.css')?{}:name in ports?ports[name]:(()=>{throw Error('Missing '+name)})(),module,module.exports);return module.exports;
}
let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name);}
const clientModule=compile('src/control-plane/client/manager-remote-control-plane-authority.ts');
const {SupabaseManagerRemoteControlPlaneAuthority:Authority}=clientModule;
const id='11111111-1111-4111-8111-111111111111',customer='22222222-2222-4222-8222-222222222222';
const ack={success:true,deviceId:'fixture',displayCode:'XF-AB12-CD34',customerId:customer,licenseId:id,sourceId:'src_fixture',deviceAuthorizationState:'AUTHORIZED',sourceBindingStatus:'ACTIVE',licenseStatus:'ACTIVE',sourceResolution:'SOURCE_READY'};
const input={displayCode:ack.displayCode,activationKey:'012345',flowMode:'EXISTING_CUSTOMER',customerId:customer,licenseId:id,existingDeviceCode:'XF-EF56-GH78',deviceLabel:'Quarto',deviceRole:'SECONDARY',primaryDisplayCode:'XF-EF56-GH78',maxDevices:3,maxConcurrentSessions:2};
await test('REAL_CLIENT_EXPLICIT_ROLE_CAPACITY_AND_FAIL_CLOSED',async()=>{
 const calls=[];let logged=true;
 const authority=new Authority({auth:{getSession:async()=>({data:{session:logged?{user:{id}}:null}})},functions:{invoke:async(name,{body})=>{calls.push({name,body});return {data:ack}}}});
 await authority.activateSourceForDevice(input);assert.equal(calls.at(-1).body.primaryDisplayCode,input.primaryDisplayCode);assert.equal(calls.at(-1).body.deviceRole,'SECONDARY');assert.equal(calls.at(-1).body.maxDevices,3);
 for(const [change,expected] of [[{deviceRole:undefined},'INVALID_DEVICE_ROLE'],[{primaryDisplayCode:''},'PRIMARY_DEVICE_REQUIRED'],[{primaryDisplayCode:ack.displayCode},'PRIMARY_DEVICE_INVALID'],[{maxDevices:1.5},'INVALID_MAX_DEVICES'],[{maxConcurrentSessions:51},'INVALID_MAX_CONCURRENT_SESSIONS'],[{maxConcurrentSessions:4},'CONCURRENT_LIMIT_EXCEEDS_DEVICES']]){
  const before=calls.length;await assert.rejects(authority.activateSourceForDevice({...input,...change}),new RegExp(expected));assert.equal(calls.length,before);
 }
 logged=false;const before=calls.length;await assert.rejects(authority.activateSourceForDevice(input),/MANAGER_AUTH_REQUIRED/);assert.equal(calls.length,before);
 logged=true;const legacy={...input};for(const k of ['deviceRole','primaryDisplayCode','deviceLabel','maxDevices','maxConcurrentSessions'])delete legacy[k];await authority.activateSourceForDevice(legacy);assert(!Object.hasOwn(calls.at(-1).body,'deviceRole'));
});
const {summarizeLicenseDevices}=compile('src/debug/manager/license-device-summary.ts');
const main={deviceId:'main',displayCode:'XF-EF56-GH78',deviceLabel:'Sala',deviceRole:'PRIMARY',status:'AUTHORIZED',deviceType:'TV',platform:'ANDROID',boundAt:'2026-10-12',licenseBindingStatus:'ACTIVE'};
const second={...main,deviceId:'fixture',displayCode:ack.displayCode,deviceLabel:'Quarto',deviceRole:'SECONDARY',primaryDisplayCode:main.displayCode};
const license={licenseId:id,customerId:customer,customerNickname:'Fixture',mode:'MANAGED',status:'ACTIVE',maxDevices:3,maxConcurrentSessions:2,activeDeviceCount:2,createdAt:'2026-10-12',devices:[main,second]};
await test('SCOPED_SOURCE_PEERS_COUNTS_AND_METADATA_NORMALIZATION',async()=>{
 const summary=summarizeLicenseDevices([license],[{deviceId:'main',sourceId:'one'},{deviceId:'fixture',sourceId:'one'},{deviceId:'outside',sourceId:'one'}],[]);
 assert.deepEqual(summary.peers.get('fixture'),[main]);assert.equal(summary.customerDevices.get(customer).size,2);assert.equal(summary.sourcesKnown,true);assert.equal(summarizeLicenseDevices([license]).sourcesKnown,false);
 const authority=new Authority({auth:{getSession:async()=>({data:{session:{user:{id}}}})},rpc:async name=>({data:name==='rpc_manager_list_licenses'?[license]:{success:true,license,devices:[main,second],managedSources:[],customerSources:[]}})});
 assert.equal((await authority.listLicenses())[0].devices[1].deviceRole,'SECONDARY');assert.equal((await authority.getLicenseDetail(id)).devices[1].primaryDisplayCode,main.displayCode);
 const {AdminLicensesView}=compile('src/debug/manager/AdminLicensesView.tsx',{'react':React,'./ManagerLicenseEditor.tsx':{ManagerLicenseEditor:()=>null},'./license-device-summary.ts':{summarizeLicenseDevices}});
 const html=renderToStaticMarkup(React.createElement(AdminLicensesView,{licenses:[license],sourceBindings:[{deviceId:'main',sourceId:'one'},{deviceId:'fixture',sourceId:'one'}],customerSources:[],onInspectLicense:async()=>null,onUpdateLimits:async()=>true,onSuspendLicense:async()=>true,onRevokeLicense:async()=>true}));
 for(const text of ['Local/Tipo','Vínculo / Mesma fonte','Aparelhos vinculados','Principal: XF-EF56-GH78','1 outro(s) na mesma fonte','Simultâneos: 2','Quarto'])assert(html.includes(text),text);
 assert.match(html, /aria-expanded="false"/);
 assert.match(html, new RegExp(`<tr\\b(?=[^>]*id="license-device-${id}-fixture")(?=[^>]*hidden="")[^>]*>`));
 assert.equal((html.match(/<th[ >]/g)||[]).length,12);
});
await test('FRIENDLY_ACTIVATION_FEEDBACK_NEVER_TECHNICAL_CODES',()=>{
 const {managerActivationFailure}=compile('src/debug/manager/manager-activation-feedback.ts',{'../../control-plane/client/manager-remote-control-plane-authority.ts':clientModule});
 for(const code of ['INVALID_DEVICE_ROLE','PRIMARY_DEVICE_REQUIRED','PRIMARY_DEVICE_INVALID','MANAGED_LICENSE_CAPACITY_EXHAUSTED','INVALID_ACTIVATION_KEY','MANAGER_SCOPE_DENIED','untrusted https://fixture.invalid/?secret=bad']){
  const message=managerActivationFailure(new Error(code));assert(!message.includes(code)&&!message.includes('https://')&&!message.includes('secret='),message);
 }
});
let handler;const calls=[];let logged=true,rpcError;
const edgeClient={auth:{getUser:async()=>({data:{user:logged?{id}:null}})},rpc:async(name,args)=>{calls.push({name,args});return rpcError?{error:{message:rpcError}}:{data:ack}}};
const code=ts.transpileModule(fs.readFileSync('supabase/functions/managed-source-vault-admin/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('Deno','crypto','require','exports',code)({env:{get:name=>name==='SOURCE_VAULT_KEY_V1'?Buffer.from(new Uint8Array(32).fill(7)).toString('base64'):'fixture'},serve:fn=>{handler=fn}},webcrypto,name=>name.startsWith('npm:')?{createClient:()=>edgeClient}:{},{});
const request=body=>new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({operation:'ACTIVATE_SOURCE_FOR_DEVICE',...body})});
await test('REAL_EDGE_CONFIGURED_RPC_HASH_AND_SANITIZED_ACK',async()=>{
 let response=await handler(request(input));assert.equal(response.status,200);const {name,args}=calls.at(-1);assert.equal(name,'rpc_manager_activate_device_configured');assert.equal(args.p_primary_display_code,input.primaryDisplayCode);assert.equal(args.p_device_role,'SECONDARY');assert.equal(args.p_device_label,'Quarto');assert.equal(args.p_max_devices,3);
 assert.equal(args.p_activation.p_activation_key_hash,Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode('012345'))).toString('hex'));assert.equal(Object.hasOwn(args.p_activation,'activationKey'),false);
 const result=await response.json();assert.equal(result.deviceAuthorizationState,'AUTHORIZED');for(const field of ['activationKey','ciphertext','nonce','authTag'])assert(!Object.hasOwn(result,field));
 for(const change of [{deviceRole:undefined},{primaryDisplayCode:''},{maxDevices:0},{maxConcurrentSessions:51},{maxConcurrentSessions:4}]){const before=calls.length;response=await handler(request({...input,...change}));assert(response.status>=400);assert.equal(calls.length,before);}
 logged=false;const before=calls.length;response=await handler(request(input));assert(response.status>=400);assert.equal(calls.length,before);logged=true;
 rpcError='MANAGER_SCOPE_DENIED';response=await handler(request(input));assert(response.status>=400);assert.equal((await response.json()).code,'MANAGER_SCOPE_DENIED');rpcError=undefined;
 const legacy={...input};for(const k of ['deviceRole','primaryDisplayCode','deviceLabel','maxDevices','maxConcurrentSessions'])delete legacy[k];response=await handler(request(legacy));assert.equal(response.status,200);assert.equal(calls.at(-1).name,'rpc_manager_complete_device_activation');
});
await test('NEW_CUSTOMER_PRIMARY_ENCRYPTED_SOURCE_USES_CONFIGURED_RPC',async()=>{
 const response=await handler(request({...input,flowMode:'NEW_CUSTOMER',customerId:undefined,licenseId:undefined,deviceRole:'PRIMARY',primaryDisplayCode:undefined,maxDevices:1,maxConcurrentSessions:1,newCustomerName:'Fixture',name:'Source',protocol:'M3U',sourceConfig:{playlistUrl:'https://fixture.invalid/list.m3u'}}));assert.equal(response.status,200);
 const args=calls.at(-1).args;assert.equal(args.p_device_role,'PRIMARY');assert.equal(args.p_primary_display_code,null);assert.equal(args.p_activation.p_flow_mode,'NEW_CUSTOMER');assert.match(args.p_activation.p_ciphertext,/^[a-f0-9]+$/);assert(!JSON.stringify(args).includes('playlistUrl'));assert(!JSON.stringify(await response.json()).includes('fixture.invalid'));
});
await test('REGISTERED_LINK_REAL_CLIENT_AND_EDGE_PRESERVE_KEY_BOUNDARY',async()=>{
 const link={licenseId:id,displayCode:ack.displayCode,deviceLabel:'Quarto',deviceRole:'SECONDARY',primaryDisplayCode:main.displayCode,maxDevices:3,maxConcurrentSessions:2,registered:true};
 const invoked=[];let session=true;
 const authority=new Authority({auth:{getSession:async()=>({data:{session:session?{user:{id}}:null}})},functions:{invoke:async(name,{body})=>{invoked.push(body);return {data:{success:true}}}}});
 await authority.linkLicenseDevice(link);assert.equal(invoked[0].operation,'LINK_LICENSE_DEVICE');assert(!Object.hasOwn(invoked[0],'activationKey'));
 for(const change of [{deviceRole:'PRIMARY'},{primaryDisplayCode:''},{primaryDisplayCode:link.displayCode},{maxDevices:0},{maxConcurrentSessions:4}]){const before=invoked.length;await assert.rejects(authority.linkLicenseDevice({...link,...change}));assert.equal(invoked.length,before);}
 const before=invoked.length;await assert.rejects(authority.updateLicenseLimits(id,3,4),/CONCURRENT_LIMIT_EXCEEDS_DEVICES/);assert.equal(invoked.length,before);
 session=false;await assert.rejects(authority.linkLicenseDevice(link),/MANAGER_AUTH_REQUIRED/);session=true;
 let response=await handler(request({...link,operation:'LINK_LICENSE_DEVICE'}));assert.equal(response.status,200);assert.equal(calls.at(-1).name,'rpc_manager_link_license_device');assert.equal(calls.at(-1).args.p_key_hash,null);assert.equal(calls.at(-1).args.p_registered,true);assert.deepEqual(await response.json(),{success:true});
 response=await handler(request({...link,operation:'LINK_LICENSE_DEVICE',registered:false,activationKey:'012345'}));assert.equal(response.status,200);assert.match(calls.at(-1).args.p_key_hash,/^[a-f0-9]{64}$/);assert(!JSON.stringify(calls.at(-1)).includes('012345'));
 rpcError='PRIMARY_HAS_SECONDARIES';response=await handler(request({...link,operation:'LINK_LICENSE_DEVICE'}));assert(response.status>=400);assert.equal((await response.json()).code,'PRIMARY_HAS_SECONDARIES');rpcError=undefined;
 for(const change of [{deviceRole:'PRIMARY'},{primaryDisplayCode:''},{maxDevices:0},{registered:false,activationKey:'bad'},{maxConcurrentSessions:4}]){const before=calls.length;response=await handler(request({...link,...change,operation:'LINK_LICENSE_DEVICE'}));assert(response.status>=400);assert.equal(calls.length,before);}
});
console.log(`C80_DEVICE_REGISTRATION_TESTS=${tests}_PASS`);
