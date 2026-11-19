import fs from 'node:fs';import{execFileSync}from'node:child_process';
import{open}from'../HTTP_TRANSPORT_RECOVERY_20261105/cdp-local.mjs';
const adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe',serial='RX2X301Q3KY',pkg='com.xandeflix.prebuilt';
const result={startedUTC:new Date().toISOString(),scope:'TABLET_LOCAL_SOURCE_ONLY',states:[],result:'IN_PROGRESS'};
const save=()=>fs.writeFileSync(new URL('RESULT.json',import.meta.url),JSON.stringify(result,null,2));
const cmd=(args,timeout=20000)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout,stdio:['ignore','pipe','pipe'],maxBuffer:2*1024*1024}).trim();
const run=(...args)=>cmd(['shell','run-as',pkg,...args]);
const read=name=>JSON.parse(run('cat','files/'+name));
const files=['device_identity.json','device_activation_key.json','app_installation.json','device_activation.json'];
let before,localBefore,stateBefore,pointerBefore;
try{
 const version=cmd(['shell','dumpsys','package',pkg]);if(!/versionCode=53\b/.test(version)||!/versionName=1\.0\.53\b/.test(version))throw Error('VERSION_MISMATCH');
 before=files.map(read);if(before[3]?.status!=='AUTHORIZED')throw Error('ACTIVATION_NOT_AUTHORIZED');
 pointerBefore=read('prebuilt/active.json');
 const root=run('readlink','-f','.');if(!['/data/user/0/'+pkg,'/data/data/'+pkg].includes(root))throw Error('PACKAGE_ROOT_MISMATCH');
 const paths=['files/prebuilt','cache/artwork-v1'];
 for(const path of paths){
  const resolved=run('readlink','-f',path);if(resolved!==root+'/'+path)throw Error('UNSAFE_SOURCE_PATH');
  if(run('stat','-c','%F',path)!=='directory')throw Error('SOURCE_PATH_NOT_DIRECTORY');
  if(run('find',path,'-type','l'))throw Error('SOURCE_PATH_CONTAINS_LINK');
 }
 const allowed=new Set(['active.json','recovery.json','snapshots','staging']);
 if(run('ls','-1','files/prebuilt').split(/\r?\n/).some(p=>!allowed.has(p)))throw Error('UNEXPECTED_CATALOG_ENTRY');
 let c=await open(serial);
 try{
  const captured=await c.evaluate(`(()=>{const s=JSON.parse(localStorage.getItem('__xandeflix_source_replacement_v1__')||'null');return{state:s,entries:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))}})()`);
  stateBefore=captured.state;localBefore=captured.entries;
  if(stateBefore?.schema!==1||stateBefore.phase!=='ACTIVE'||stateBefore.snapshotId!==pointerBefore.snapshotId||stateBefore.target?.sourceId!==pointerBefore.sourceId||stateBefore.target?.sourceVersion!==pointerBefore.sourceVersion||!/^s_[A-Za-z0-9_-]{8,80}$/.test(stateBefore.epoch))throw Error('SOURCE_LIFECYCLE_MISMATCH');
  const stopped=await c.evaluate(`(async()=>{const cap=window.Capacitor;await cap.nativePromise('NativeAndroidPlayer','stopPreview',{});await cap.nativePromise('NativeAndroidPlayer','stopPlayback',{});if(window.__xfMediaAudit){await window.__xfMediaAudit.restore();delete window.__xfMediaAudit;}return{playersStopped:true,observerRemoved:!window.__xfMediaAudit}})()`);
  result.preflight={version:'1.0.53',authorized:true,pathsValidated:true,linksAbsent:true,lifecycleAndPointerMatch:true,...stopped};save();
  const prepared=await c.evaluate(`(()=>{const key='__xandeflix_source_replacement_v1__',s=JSON.parse(localStorage.getItem(key));if(s.phase!=='ACTIVE')throw Error('LIFECYCLE_CHANGED');const next={schema:1,target:s.target,epoch:s.epoch,phase:'PREPARED'};localStorage.setItem(key,JSON.stringify(next));if(localStorage.getItem(key)!==JSON.stringify(next))throw Error('PREPARE_WRITE_FAILED');for(const k of ['xandeflix:public-tmdb-metadata:v2','xandeflix:public-watch-providers:br:v1','xandeflix:public-startup-trends:v1','__xandeflix_source_content_v1__','__xandeflix_source_refresh_clock_v1__']){localStorage.removeItem(k);if(localStorage.getItem(k)!==null)throw Error('METADATA_REMOVE_FAILED')}return{phase:'PREPARED',metadataKeysRemoved:5}})()`);
  result.prepared=prepared;save();
 }finally{c.close()}
 cmd(['shell','am','force-stop',pkg]);
 for(const path of paths){if(run('readlink','-f',path)!==root+'/'+path)throw Error('PATH_CHANGED_BEFORE_REMOVAL');run('rm','-rf','--',root+'/'+path);}
 result.physicalRemoval={catalogRemoved:run('sh','-c',"'test ! -e files/prebuilt && echo ABSENT'")==='ABSENT',artworkRemoved:run('sh','-c',"'test ! -e cache/artwork-v1 && echo ABSENT'")==='ABSENT'};
 if(!Object.values(result.physicalRemoval).every(Boolean))throw Error('SOURCE_REMOVAL_INCOMPLETE');save();
 cmd(['shell','am','start','-n',pkg+'/.MainActivity']);
 for(let i=0;i<160;i++){
  await new Promise(r=>setTimeout(r,3000));let client;
  try{
   client=await open(serial);
   const s=await client.evaluate(`(()=>{const s=JSON.parse(localStorage.getItem('__xandeflix_source_replacement_v1__')||'null');return{phase:s?.phase||'ABSENT',cardsVisible:!!document.querySelector('[data-catalog-item]'),loading:!!document.querySelector('.startup-loading-screen')}})()`);
   if(!result.states.length||JSON.stringify(s)!==JSON.stringify({...result.states.at(-1),observedUTC:undefined})){result.states.push({...s,observedUTC:new Date().toISOString()});console.log(JSON.stringify({progress:s}));save();}
   if(s.phase==='ACTIVE'&&s.cardsVisible)break;
  }catch{result.connectionRetries=(result.connectionRetries||0)+1;}finally{client?.close()}
 }
 c=await open(serial);
 try{
  const after=files.map(read),pointer=read('prebuilt/active.json');
  const current=await c.evaluate(`(()=>({state:JSON.parse(localStorage.getItem('__xandeflix_source_replacement_v1__')||'null'),entries:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),cardsVisible:!!document.querySelector('[data-catalog-item]')}))()`);
  const ignored=new Set(['__xandeflix_source_replacement_v1__','xandeflix:public-tmdb-metadata:v2','xandeflix:public-watch-providers:br:v1','xandeflix:public-startup-trends:v1','__xandeflix_source_content_v1__','__xandeflix_source_refresh_clock_v1__']);
  const personal=/history|favorite|parental|personal|last.live|pin/i;
  const retained=Object.keys(localBefore).filter(k=>!ignored.has(k)&&personal.test(k));
  result.preservation={identity:JSON.stringify(before[0])===JSON.stringify(after[0]),activationKey:JSON.stringify(before[1])===JSON.stringify(after[1]),installation:JSON.stringify(before[2])===JSON.stringify(after[2]),activationFields:['deviceId','displayCode','deviceAuthToken','licenseId','licenseMode','licenseStatus'].every(k=>before[3][k]===after[3][k]),authorized:after[3]?.status==='AUTHORIZED',personalStorageKeysUnchanged:retained.every(k=>localBefore[k]===current.entries[k]),personalStorageKeysCompared:retained.length,sourceBindingUnchanged:pointer.sourceId===pointerBefore.sourceId&&pointer.sourceVersion===pointerBefore.sourceVersion,epochUnchanged:current.state?.epoch===stateBefore.epoch,newSnapshot:pointer.snapshotId!==pointerBefore.snapshotId&&current.state?.snapshotId===pointer.snapshotId};
  result.catalog={phase:current.state?.phase,cardsVisible:current.cardsVisible};
  const flags=Object.entries(result.preservation).filter(([k])=>k!=='personalStorageKeysCompared').every(([,v])=>v===true);
  result.result=flags&&current.state?.phase==='ACTIVE'&&current.cardsVisible?'PASS_LOCAL_SOURCE_CLEAN_AND_REIMPORT_NOT_PLAYBACK':'PENDING_OR_FAILED';
 }finally{c.close()}
 result.finishedUTC=new Date().toISOString();save();console.log(JSON.stringify(result));
}catch(e){result.result='FAILED';result.errorClass=/^[A-Z0-9_]+$/.test(e.message)?e.message:'UNCLASSIFIED';result.finishedUTC=new Date().toISOString();save();console.log(JSON.stringify(result));process.exitCode=1;}
