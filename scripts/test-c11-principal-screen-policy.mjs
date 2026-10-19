import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';
function compile(path, ports = {}, extras = {}) {
 const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 new Function('require', 'module', 'exports', 'Deno', 'crypto', code)(name => name in ports ? ports[name] : name.startsWith('jsr:') ? {} : (() => { throw Error('Missing port: ' + name); })(), module, module.exports, extras.Deno, webcrypto);
 return module.exports;
}
let groups=0;async function test(name,run){await run();groups++;console.log('PASS '+name);}
const client=compile('src/control-plane/client/manager-remote-control-plane-authority.ts');
const Authority=client.SupabaseManagerRemoteControlPlaneAuthority;
const id='11111111-1111-4111-8111-111111111111', principalCode='XF-AB12-CD34';
const registration=compile('supabase/functions/_shared/public-device-registration.ts');
await test('MANAGER_EDIT_RPC_VALIDATION_AUTH_AND_SAFE_ERRORS',async()=>{
 const calls=[];let logged=true,error;
 const authority=new Authority({auth:{getSession:async()=>({data:{session:logged?{user:{id}}:null}})},rpc:async(name,args)=>{calls.push({name,args});return error?{error:{code:'P0001',message:error}}:{data:{success:true}}}});
 const input={licenseId:id,principalCode,maxDevices:5,maxSessions:4,reason:'Upgrade fixture',paidExtraScreens:1,paymentReference:'C82-PROOF',paymentConfirmed:true};
 await authority.editLicenseScreens(input);assert.equal(calls[0].name,'rpc_manager_edit_license_screens');assert.equal(calls[0].args.p_payment_confirmed,true);assert.equal(calls[0].args.p_paid_extra_screens,1);
 for(const change of [{maxDevices:0},{maxDevices:1.2},{maxDevices:101},{maxSessions:6},{maxSessions:0},{principalCode:''},{reason:''},{paidExtraScreens:1.2},{paidExtraScreens:97}]){const count=calls.length;await assert.rejects(authority.editLicenseScreens({...input,...change}));assert.equal(calls.length,count);}
 logged=false;const count=calls.length;await assert.rejects(authority.editLicenseScreens(input),/MANAGER_AUTH_REQUIRED/);await assert.rejects(authority.promoteLicenseDevice(id,principalCode),/MANAGER_AUTH_REQUIRED/);assert.equal(calls.length,count);logged=true;
 await authority.promoteLicenseDevice(id,principalCode);assert.equal(calls.at(-1).name,'rpc_manager_promote_license_device');assert.deepEqual(calls.at(-1).args,{p_license_id:id,p_display_code:principalCode});
 const {managerActivationFailure}=compile('src/debug/manager/manager-activation-feedback.ts',{'../../control-plane/client/manager-remote-control-plane-authority.ts':client});
 for(const value of ['PRINCIPAL_REQUIRED','EXTRA_SCREENS_PAYMENT_REQUIRED','PAYMENT_REFERENCE_INVALID','PRIMARY_CANNOT_BECOME_SECONDARY','LICENSE_EDIT_REQUIRED']){error=value;try{await authority.editLicenseScreens(input);assert.fail('Expected denial');}catch(e){assert.equal(e.code,value);assert(!managerActivationFailure(e).includes(value));}}
});
await test('PUBLIC_CLIENT_SINGLE_DEVICE_AND_NO_NETWORK_FOR_ADDITIONAL_SCREENS',async()=>{
 const calls=[];const sdk={functions:{invoke:async(name,req)=>{calls.push(req.body);return{data:{success:true,deviceAuthorizationState:'AUTHORIZED'}}}}};
 const {PublicDeviceActivationService}=compile('src/control-plane/client/public-device-activation.service.ts',{'../../integrations/supabase/client.ts':{getSupabaseBrowserClient:()=>sdk,parseSanitizedFunctionError:async()=>({})},'./activation-timeout.ts':{activationDeadline:run=>run(new AbortController().signal)},'../../../supabase/functions/_shared/public-device-registration.ts':registration});
 const service=new PublicDeviceActivationService(),input={displayCode:principalCode,sessionToken:'synthetic',sourceName:'Fixture',sourceUrl:'https://fixture.invalid/list.m3u',customerFirstName:'Lu',deviceLabel:'TV sala',platform:'ANDROID'};
 assert.equal((await service.complete({...input,initialScreens:1})).success,true);assert.equal(calls[0].initialScreens,1);
 for(const initialScreens of [0,2,3,4,5,1.5,NaN]){assert.equal((await service.complete({...input,initialScreens})).code,'INITIAL_SCREEN_LIMIT');}assert.equal(calls.length,1);
});
await test('PUBLIC_EDGE_VALIDATE_BEFORE_BOOTSTRAP_AND_PROTECTED_SCREEN_RPC',async()=>{
 let handler;const calls=[];let created=0,deleted=0,fail;
 const sdk={auth:{admin:{createUser:async()=>{created++;return{data:{user:{id}}}},deleteUser:async()=>{deleted++}}},rpc:async(name,args)=>{calls.push({name,args});if(name==='rpc_public_check_device_activation_session'||name==='rpc_signal_public_check')return{data:{success:true}};return fail?{error:{message:fail}}:{data:{success:true,deviceAuthorizationState:'AUTHORIZED',licenseId:id,sourceId:args.p_source_id}}}};
 compile('supabase/functions/device-public-activation/index.ts',{'npm:@supabase/supabase-js@2.116.0':{createClient:()=>sdk},'../_shared/public-device-registration.ts':registration,'../_shared/signal-policy.ts':{ensureSignalIndex:async()=>{},signalFingerprint:async()=> 'f'.repeat(64),signalVaultKey:()=>new Uint8Array(32).fill(7)}},{Deno:{env:{get:name=>name==='SOURCE_VAULT_KEY_V1'?Buffer.from(new Uint8Array(32).fill(7)).toString('base64'):'fixture'},serve:fn=>{handler=fn}}});
 const input={operation:'COMPLETE',displayCode:principalCode,sessionToken:'a'.repeat(64),sourceName:'Fixture',sourceType:'M3U',sourceUrl:'https://fixture.invalid/list.m3u',initialScreens:1,customerFirstName:'Lu',deviceLabel:'TV sala',platform:'ANDROID'};
 const request=body=>new Request('https://fixture.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 for(const n of [0,2,3,4,5,1.1,'4']){const before=calls.length;const response=await handler(request({...input,initialScreens:n}));assert.equal((await response.json()).code,'INITIAL_SCREEN_LIMIT');assert.equal(calls.length,before);assert.equal(created,0);}
 let response=await handler(request(input));assert.equal(response.status,200);assert.equal(calls.at(-1).name,'rpc_public_complete_single_device');assert.equal(calls.at(-1).args.p_initial_screens,1);assert.equal(created,1);assert.equal(deleted,0);
 const dto=await response.json();assert.equal(dto.deviceAuthorizationState,'AUTHORIZED');assert(!JSON.stringify(dto).includes('ciphertext'));assert(!JSON.stringify(calls.at(-1).args).includes('fixture.invalid'));
 fail='LICENSE_EDIT_REQUIRED';response=await handler(request(input));assert(response.status>=400);const error=await response.json();assert.equal(error.code,fail);assert(!error.message.includes(fail));assert.equal(deleted,1);
});
console.log(`C82_PRINCIPAL_SCREEN_POLICY_TESTS=${groups}_PASS`);
