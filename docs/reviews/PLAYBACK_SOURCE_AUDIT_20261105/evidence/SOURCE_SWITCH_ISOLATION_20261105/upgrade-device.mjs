import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {open} from '../DEVICE_AUDIT_20261104/cdp.mjs';
const folder='C:/Xandeflix/Audits/SOURCE_SWITCH_ISOLATION_20261105',adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe',apk=folder+'/Xandeflix-v1.0.53-Source-Isolation-20261105.apk';
const [serial,label]=process.argv.slice(2);if(!['TABLET','PHONE','FIRE'].includes(label)||!serial)throw Error('EXACT_DEVICE_REQUIRED');
const audit=JSON.parse(fs.readFileSync(folder+'/APK_AUDIT.json'));if(audit.result!=='PASS'||!fs.existsSync(apk))throw Error('VERIFIED_ARTIFACT_REQUIRED');
function cmd(args,timeout=20000){return execFileSync(adb,['-s',serial,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout,maxBuffer:1024*1024});}
function read(file){try{return JSON.parse(cmd(['shell','run-as','com.xandeflix.prebuilt','cat','files/'+file]));}catch{return null;}}
function version(){const value=cmd(['shell','dumpsys','package','com.xandeflix.prebuilt']);return{code:Number(value.match(/versionCode=(\d+)/)?.[1]||0),name:value.match(/versionName=([^\r\n ]+)/)?.[1]||null};}
function capture(){return{identity:read('device_identity.json'),key:read('device_activation_key.json'),installation:read('app_installation.json'),activation:read('device_activation.json'),pointer:read('prebuilt/active.json'),version:version()};}
const before=capture();if(!before.identity||!before.key||before.activation?.status!=='AUTHORIZED')throw Error('EXISTING_ACTIVATION_REQUIRED');
const result={label,startedUTC:new Date().toISOString(),beforeVersion:before.version,updateMode:'IN_PLACE_PRESERVE_DATA',states:[],preservation:null,result:'IN_PROGRESS'};
const save=()=>fs.writeFileSync(folder+'/'+label+'_UPGRADE.json',JSON.stringify(result,null,2));save();
cmd(['shell','am','force-stop','com.xandeflix.prebuilt']);
const install=cmd(['install','-r','-t',apk],120000);if(!/Success/.test(install))throw Error('INSTALL_NOT_SUCCESS');result.installation='SUCCESS';save();
cmd(['shell','am','start','-n','com.xandeflix.prebuilt/.MainActivity']);
for(let attempt=0;attempt<80;attempt++){
 await new Promise(r=>setTimeout(r,3000));
 let c;try{
  c=await open(serial);
  const state=await c.evaluate(`(()=>{let s;try{s=JSON.parse(localStorage.getItem('__xandeflix_source_replacement_v1__')||'null')}catch{}return{phase:s?.phase||'ABSENT',schema:s?.schema||null,hasEpoch:typeof s?.epoch==='string',bodyHasCards:!!document.querySelector('[data-catalog-item]'),loadingScreen:!!document.querySelector('.startup-loading-screen'),visibility:document.visibilityState}})()`);
  if(!result.states.length||JSON.stringify({...result.states.at(-1),observedUTC:undefined})!==JSON.stringify(state))result.states.push({...state,observedUTC:new Date().toISOString()});
  if(state.phase==='ACTIVE'&&state.bodyHasCards){result.catalog='ACTIVE_AND_RENDERED';save();break;}
 }catch{result.connectionRetries=(result.connectionRetries||0)+1;}finally{c?.close();}
 save();
}
const after=capture(),same=(a,b)=>a!==null&&b!==null&&JSON.stringify(a)===JSON.stringify(b);
const stable=['deviceId','displayCode','deviceAuthToken','licenseId','licenseMode','licenseStatus'].every(k=>before.activation[k]===after.activation?.[k]);
result.afterVersion=after.version;result.preservation={identity:same(before.identity,after.identity),activationKey:same(before.key,after.key),installationIdentity:same(before.installation,after.installation),activationFields:stable,authorized:after.activation?.status==='AUTHORIZED',sourceBindingSame:before.pointer?.sourceId===after.pointer?.sourceId&&before.pointer?.sourceVersion===after.pointer?.sourceVersion,newSnapshot:!!after.pointer?.snapshotId&&after.pointer.snapshotId!==before.pointer?.snapshotId};
result.finishedUTC=new Date().toISOString();result.result=after.version.code===53&&result.catalog==='ACTIVE_AND_RENDERED'&&Object.values(result.preservation).every(Boolean)?'PASS_MIGRATION_AND_PRESERVATION_NOT_PLAYBACK':'PENDING_OR_FAILED';save();
console.log(JSON.stringify(result));if(result.result!=='PASS_MIGRATION_AND_PRESERVATION_NOT_PLAYBACK')process.exitCode=1;
