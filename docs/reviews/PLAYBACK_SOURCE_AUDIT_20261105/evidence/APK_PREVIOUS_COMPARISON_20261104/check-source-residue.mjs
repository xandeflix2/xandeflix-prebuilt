import fs from 'node:fs';
import {open} from '../DEVICE_AUDIT_20261104/cdp.mjs';
const serial=process.argv[2];
const label=process.argv[3];
if(!serial||!['FIRE','TABLET'].includes(label))throw Error('TARGET_REQUIRED');
const c=await open(serial);
try{
 const result=await c.evaluate(String.raw`(async()=>{
  const cap=window.Capacitor;
  if(!cap||typeof cap.nativePromise!=='function')return {status:'READ_INTERFACE_UNAVAILABLE'};
  const safeError=e=>typeof e?.code==='string'&&/^[A-Z_0-9-]{1,80}$/.test(e.code)?e.code:'READ_FAILED';
  const read=async path=>{
    try{
      const st=await cap.nativePromise('Filesystem','stat',{path,directory:'DATA'});
      if(st.type!=='file'||st.size>2*1024*1024)return {state:'UNSUPPORTED_OR_TOO_LARGE'};
      const r=await cap.nativePromise('Filesystem','readFile',{path,directory:'DATA',encoding:'utf8'});
      try{return {state:'PARSED',data:JSON.parse(r.data)}}catch{return {state:'INVALID_JSON'}}
    }catch(e){return {state:safeError(e)}}
  };
  const list=async path=>{try{const r=await cap.nativePromise('Filesystem','readdir',{path,directory:'DATA'});return{state:'LISTED',files:r.files||[]}}catch(e){return{state:safeError(e),files:[]}}};
  const pointer=await read('prebuilt/active.json');
  const journal=await read('prebuilt/recovery.json');
  const p=pointer.data;
  const files=await list('prebuilt/snapshots');
  const dirs=files.files.filter(f=>typeof f==='object'&&f.type==='directory'&&/^[A-Za-z0-9_-]{1,120}$/.test(f.name));
  const sources=new Set();const sourceVersions=new Set();
  const states={};let valid=0,sameSource=0,differentSource=0,activeSnapshotPresent=false,activeManifest=null;
  for(const f of dirs.slice(0,128)){
   const r=await read('prebuilt/snapshots/'+f.name+'/manifest.json');
   states[r.state]=(states[r.state]||0)+1;
   if(r.state!=='PARSED')continue;
   valid++;const m=r.data;const md=m.metadata||{};
   if(typeof md.sourceId==='string')sources.add(md.sourceId);
   if(Number.isSafeInteger(md.sourceVersion))sourceVersions.add(md.sourceVersion);
   if(p?.sourceId&&md.sourceId===p.sourceId)sameSource++;
   else if(p?.sourceId&&md.sourceId)differentSource++;
   if(p?.snapshotId===f.name){activeSnapshotPresent=true;activeManifest={snapshotMatches:m.snapshotId===p.snapshotId,sourceMatches:md.sourceId===p.sourceId,versionMatches:md.sourceVersion===p.sourceVersion,kind:md.kind==='REAL'?'REAL':md.kind==='DEMO'?'DEMO':'OTHER_OR_MISSING'};}
  }
  const history={};
  for(const [name,key]of Object.entries({recent:'xandeflix:recent-watched:v1',positions:'xandeflix:watch-positions:v1',sessions:'xandeflix:watch-sessions:v1'})){
   try{const raw=localStorage.getItem(key);if(!raw){history[name]={present:false};continue;}
    if(raw.length>300000){history[name]={present:true,state:'TOO_LARGE'};continue;}
    const j=JSON.parse(raw);history[name]={present:true,records:Array.isArray(j.records)?j.records.length:Array.isArray(j.sessions)?j.sessions.length:null};
   }catch{history[name]={state:'READ_OR_FORMAT_FAILED'}}
  }
  const stage=await list('prebuilt/staging');
  return{observedUTC:new Date().toISOString(),status:'READ_ONLY_METADATA',activePointer:{readState:pointer.state,present:!!p,kind:p?.kind==='REAL'?'REAL':p?.kind==='DEMO'?'DEMO':null,sourceIdentityPresent:typeof p?.sourceId==='string',sourceVersion:Number.isSafeInteger(p?.sourceVersion)?p.sourceVersion:null,snapshotIdentityPresent:typeof p?.snapshotId==='string'},recoveryJournal:{readState:journal.state,present:!!journal.data},snapshots:{listState:files.state,entries:files.files.length,safeDirectories:dirs.length,examined:Math.min(dirs.length,128),coverage:dirs.length<=128?'ALL_SAFE_LISTED_DIRECTORIES':'LIMITED_128',manifestStates:states,parsed:valid,distinctSourceIdentities:sources.size,sourceVersions:[...sourceVersions].sort((a,b)=>a-b),sameSourceAsActive:sameSource,differentSourceFromActive:differentSource,activeSnapshotPresent,activeManifest},staging:{listState:stage.state,entryCount:stage.files.length},history,temporaryObservers:{connection:!!window.__xfConnection,sync:!!window.__xfSyncAudit},startupErrorVisible:!![...document.querySelectorAll('h1,h2,p')].find(e=>e.getBoundingClientRect().height>0&&/Precisamos tentar mais uma vez/.test(e.textContent))};
 })()`);
 const out={label,...result};fs.writeFileSync(new URL(`${label}_SOURCE_RESIDUE.json`,import.meta.url),JSON.stringify(out,null,2));console.log(JSON.stringify(out));
}finally{c.close();}
