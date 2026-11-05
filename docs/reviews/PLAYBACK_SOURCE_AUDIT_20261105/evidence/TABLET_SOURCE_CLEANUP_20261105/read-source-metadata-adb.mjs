import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const [serial,label]=process.argv.slice(2);
if(!serial||!['TABLET','FIRE'].includes(label))throw Error('TARGET_REQUIRED');
function shell(...args){return execFileSync(adb,['-s',serial,'shell','run-as','com.xandeflix.prebuilt',...args],{encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:12000,maxBuffer:3*1024*1024}).trim();}
function exists(p){try{shell('stat','-c','%s',p);return true}catch{return false}}
function read(p){try{const size=Number(shell('stat','-c','%s',p));if(!Number.isSafeInteger(size)||size>2*1024*1024)return{state:'TOO_LARGE_OR_INVALID_SIZE'};return{state:'PARSED',data:JSON.parse(shell('cat',p))}}catch{return{state:'ABSENT_OR_UNREADABLE'}}}
function list(p){try{return{state:'LISTED',names:shell('ls','-1',p).split(/\r?\n/).filter(Boolean)}}catch{return{state:'ABSENT_OR_UNREADABLE',names:[]}}}
const pointer=read('files/prebuilt/active.json'),journal=read('files/prebuilt/recovery.json');
const p=pointer.data;
const roots=list('files/prebuilt/snapshots');
const dirs=roots.names.filter(n=>/^[A-Za-z0-9_-]{1,120}$/.test(n));
const sources=new Set(),versions=new Set();let same=0,different=0,parsed=0;const states={};let activeManifest=null;
for(const name of dirs.slice(0,128)){
 const r=read(`files/prebuilt/snapshots/${name}/manifest.json`);states[r.state]=(states[r.state]||0)+1;
 if(r.state!=='PARSED')continue;parsed++;
 const m=r.data,md=m.metadata||{};
 if(typeof md.sourceId==='string')sources.add(md.sourceId);
 if(Number.isSafeInteger(md.sourceVersion))versions.add(md.sourceVersion);
 if(p?.sourceId&&md.sourceId===p.sourceId)same++;
 else if(p?.sourceId&&md.sourceId)different++;
 if(name===p?.snapshotId)activeManifest={snapshotMatches:m.snapshotId===p.snapshotId,sourceMatches:md.sourceId===p.sourceId,versionMatches:md.sourceVersion===p.sourceVersion,kind:md.kind==='REAL'?'REAL':md.kind==='DEMO'?'DEMO':'OTHER_OR_MISSING'};
}
const stage=list('files/prebuilt/staging');
const out={observedUTC:new Date().toISOString(),label,method:'READ_ONLY_ADB_RUN_AS_FILESYSTEM_METADATA',package:'com.xandeflix.prebuilt',prebuiltDirectoryExists:exists('files/prebuilt'),activePointer:{readState:pointer.state,present:!!p,kind:['REAL','DEMO'].includes(p?.kind)?p.kind:null,sourceIdentityPresent:typeof p?.sourceId==='string',sourceVersion:Number.isSafeInteger(p?.sourceVersion)?p.sourceVersion:null,snapshotIdentityPresent:typeof p?.snapshotId==='string'},recoveryJournal:{readState:journal.state,present:!!journal.data},snapshots:{listState:roots.state,entries:roots.names.length,safeNames:dirs.length,examined:Math.min(128,dirs.length),parsed,coverage:dirs.length<=128&&dirs.length===roots.names.length?'ALL_LISTED_SAFE_NAMES':'LIMITED',manifestStates:states,distinctSourceIdentities:sources.size,sourceVersions:[...versions].sort((a,b)=>a-b),sameSourceAsActive:same,differentSourceFromActive:different,activeManifest},staging:{listState:stage.state,entries:stage.names.length},limitations:['Reads metadata only; no media URLs or credentials exported.','Source identity/version equivalence is local; no remote authorization query performed.','No historical device snapshot or old source identity supplied for comparison.','Does not inspect encrypted source records, WebView history or live in-memory context.']};
fs.writeFileSync(new URL(`${label}_SOURCE_RESIDUE.json`,import.meta.url),JSON.stringify(out,null,2));console.log(JSON.stringify(out));
