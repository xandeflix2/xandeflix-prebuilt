import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { webcrypto } from 'node:crypto';
const read = path => fs.readFileSync(path, 'utf8');
function compile(path, ports = {}, extra = '') {
 const module = { exports: {} };
 const code = ts.transpileModule(read(path)+extra,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name => name.endsWith('.css') ? {} : name in ports ? ports[name] : (()=>{throw Error('Missing '+name)})(),module,module.exports);
 return module.exports;
}
let tests=0; async function test(name,run){await run();tests++;console.log('PASS '+name);}
const id='11111111-1111-4111-8111-111111111111', device={deviceId:'fixture',displayCode:'XF-AB12-CD34',deviceLabel:'TV Sala',deviceType:'TV',platform:'ANDROID',status:'AUTHORIZED',lastSeenAt:'2026-10-11T20:00:00Z',boundAt:'2026-10-10'};
const license={licenseId:id,customerId:id,customerNickname:'Fixture',mode:'MANAGED',status:'ACTIVE',maxDevices:2,maxConcurrentSessions:1,activeDeviceCount:1,createdAt:'2026-10-10',devices:[device]};
const {SupabaseManagerRemoteControlPlaneAuthority:Authority}=compile('src/control-plane/client/manager-remote-control-plane-authority.ts');
await test('REAL_AUTHORITY_METADATA_COMMANDS_AND_AUTH_FAIL_CLOSED',async()=>{
 const calls=[];let logged=true,result,edgeError;
 const client={auth:{getSession:async()=>({data:{session:logged?{user:{id}}:null}})},rpc:async(name,args)=>{calls.push({name,args});return {data:result}},functions:{invoke:async(name,{body})=>{calls.push({name,body});return edgeError?{error:edgeError}:{data:{success:true}}}}};
 const authority=new Authority(client);
 result=[license];const list=await authority.listLicenses();assert.deepEqual(list[0].devices,[device]);
 await authority.updateLicenseDevice(id,device.displayCode,'New','012345');assert.equal(calls.at(-1).body.operation,'LICENSE_DEVICE');
 await authority.updateLicenseDevice(id,device.displayCode,'Rename');assert.equal(Object.hasOwn(calls.at(-1).body,'activationKey'),false);
 await authority.replaceLicenseSource(id,[],'New','M3U',{playlistUrl:'https://fixture.invalid/list.m3u'});assert.equal(calls.at(-1).body.operation,'REPLACE_LICENSE_SOURCE');
 result={customerId:id,nickname:'Fixture',snapshot:'fixture',licenses:[id],devices:[device]};assert.equal((await authority.previewCustomerDeletion(id)).devices[0].displayCode,device.displayCode);
 result={success:true};await authority.deleteLicenseCustomer(id,'fixture','EXCLUIR Fixture');assert.equal(calls.at(-1).name,'rpc_manager_delete_license_customer');
 logged=false;const before=calls.length;await assert.rejects(authority.updateLicenseDevice(id,device.displayCode,'New','012345'),/MANAGER_AUTH_REQUIRED/);assert.equal(calls.length,before);
 logged=true;edgeError={message:'MANAGER_SCOPE_DENIED'};await assert.rejects(authority.replaceLicenseSource(id,[],'New','M3U',{playlistUrl:'https://fixture.invalid/list.m3u'}),/MANAGER_SCOPE_DENIED/);
});
const {AdminLicensesView}=compile('src/debug/manager/AdminLicensesView.tsx',{'react':React,'./ManagerLicenseEditor.tsx':{ManagerLicenseEditor:()=>null},'./license-device-summary.ts':compile('src/debug/manager/license-device-summary.ts')});
await test('TABLE_COLUMNS_ACCESSIBLE_ICON_ACTIONS_AND_MASTER_ONLY_DELETE',()=>{
 const props={licenses:[license],authority:{},onUpdated:async()=>{},onInspectLicense:async()=>null,onUpdateLimits:async()=>true,onSuspendLicense:async()=>true,onRevokeLicense:async()=>true};
 const master=renderToStaticMarkup(React.createElement(AdminLicensesView,{...props,isMaster:true}));
 assert(!master.includes('ID da Licença'));for(const value of ['Código do dispositivo','Plataforma / Tipo','Visto pela última vez','XF-AB12-CD34','ANDROID / TV','aria-label="Editar licença"','aria-label="Excluir cliente'])assert(master.includes(value));
 const actions=master.match(/<button[^>]*>[\s\S]*?<\/button>/g);assert.equal(actions.length,5);assert(!master.includes('aria-label="Ajustar limites"'));for(const action of actions){assert(action.includes('aria-label=')&&action.includes('title='));assert(!/>[^<]*(Limites|Renovar|Suspender|Revogar)[^<]*</.test(action));}
 assert(!renderToStaticMarkup(React.createElement(AdminLicensesView,{...props,isMaster:false})).includes('aria-label="Excluir cliente'));
});
let handler;const rpcCalls=[];let mode='MANAGED',authenticated=true,denied=false;
const syntheticKey=new Uint8Array(32).fill(7);
const edgeClient={auth:{getUser:async()=>({data:{user:authenticated?{id}:null},error:null})},rpc:async(name,args)=>{
 rpcCalls.push({name,args});if(denied)return {error:{message:'MANAGER_SCOPE_DENIED'}};
 if(name==='rpc_manager_get_license_detail')return {data:{success:true,license:{mode}}};
 return {data:{success:true}};
}};
const edgeCode=ts.transpileModule(read('supabase/functions/managed-source-vault-admin/index.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('Deno','crypto','require','exports',edgeCode)({env:{get:name=>name==='SOURCE_VAULT_KEY_V1'?Buffer.from(syntheticKey).toString('base64'):'fixture'},serve:callback=>{handler=callback}},webcrypto,name=>name.startsWith('npm:')?{createClient:()=>edgeClient}:{},{});
const request=body=>new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify(body)});
await test('REAL_EDGE_HASH_KEY_AUTH_AND_SANITIZED_RESPONSE',async()=>{
 let response=await handler(request({operation:'LICENSE_DEVICE',licenseId:id,displayCode:device.displayCode,label:'TV',activationKey:'012345'}));assert.equal(response.status,200);
 const args=rpcCalls.at(-1).args;assert.equal(args.p_key_hash,Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode('012345'))).toString('hex'));assert.equal(Object.hasOwn(args,'activationKey'),false);
 assert.deepEqual(await response.json(),{success:true});
 let before=rpcCalls.length;response=await handler(request({operation:'LICENSE_DEVICE',licenseId:id,displayCode:device.displayCode,label:'TV',activationKey:'bad'}));assert(response.status>=400);assert.equal(rpcCalls.length,before);
 authenticated=false;before=rpcCalls.length;response=await handler(request({operation:'LICENSE_DEVICE',licenseId:id,displayCode:device.displayCode,label:'TV'}));assert(response.status>=400);assert.equal(rpcCalls.length,before);authenticated=true;
});
await test('REAL_EDGE_ENCRYPTS_BOTH_VAULT_PREFIXES_WITH_DELIVERY_AAD_AND_NO_PLAINTEXT_ACK',async()=>{
 for(mode of ['MANAGED','SELF_SERVICE']){
 const config={playlistUrl:'https://fixture.invalid/list.m3u?synthetic=1'};
 const response=await handler(request({operation:'REPLACE_LICENSE_SOURCE',licenseId:id,expectedSources:[],name:'Fixture',protocol:'M3U',sourceConfig:config}));assert.equal(response.status,200);
 const params=rpcCalls.at(-1).args;assert.match(params.p_source_id,mode==='MANAGED'?/^src_/:/^csrc_/);
 const key=await webcrypto.subtle.importKey('raw',syntheticKey,{name:'AES-GCM'},false,['decrypt']);
 const clear=await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(params.p_nonce,'hex'),additionalData:new TextEncoder().encode(`${params.p_source_id}\0${1}\0M3U`),tagLength:128},key,Buffer.concat([Buffer.from(params.p_ciphertext,'hex'),Buffer.from(params.p_auth_tag,'hex')]));
 assert.deepEqual(JSON.parse(new TextDecoder().decode(clear)),config);
 const ack=JSON.stringify(await response.json());assert(!ack.includes('playlistUrl')&&!ack.includes('ciphertext')&&!ack.includes('fixture.invalid'));
 }
 denied=true;const response=await handler(request({operation:'REPLACE_LICENSE_SOURCE',licenseId:id,expectedSources:[],name:'Fixture',protocol:'M3U',sourceConfig:{playlistUrl:'https://fixture.invalid'}}));assert(response.status>=400);assert.equal((await response.json()).code,'MANAGER_SCOPE_DENIED');
});
console.log(`C78_LICENSE_CONSOLE_TESTS=${tests}_PASS`);
