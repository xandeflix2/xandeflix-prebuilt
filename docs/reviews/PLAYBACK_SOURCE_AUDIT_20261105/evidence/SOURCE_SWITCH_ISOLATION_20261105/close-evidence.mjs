import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawnSync,execFileSync}from'node:child_process';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')),workspace=path.join(root,'workspace'),env={...process.env,GIT_OPTIONAL_LOCKS:'0'};
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{cwd:workspace,env,encoding:'utf8'}).trim();
if(git('branch','--show-current')!=='main'||git('rev-parse','HEAD')!=='d8a74102124fbb8a3f013f6fd8a502519c1db4b8'||git('remote','get-url','origin')!=='https://github.com/xandeflix2/xandeflix-prebuilt.git')throw Error('GIT_CONTEXT_MISMATCH');
const canonical=spawnSync(process.execPath,['scripts/verify-canonical-contract.mjs'],{cwd:workspace,env,encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024,windowsHide:true});
fs.writeFileSync(path.join(root,'CANONICAL_CLOSING.log'),String(canonical.stdout||'')+String(canonical.stderr||''),{flag:'wx'});
fs.writeFileSync(path.join(root,'CANONICAL_CLOSING.json'),JSON.stringify({observedUTC:new Date().toISOString(),exitCode:canonical.status,error:canonical.error?.code||null},null,2),{flag:'wx'});
if(canonical.status!==0)throw Error('CANONICAL_FAILED');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function inventory(base,exclude=()=>false){const files=[];function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,ent.name),rel=path.relative(base,abs).replaceAll('\\','/');if(exclude(rel))continue;const stat=fs.lstatSync(abs);if(stat.isSymbolicLink()||!stat.isFile()&&!stat.isDirectory())throw Error('UNSAFE_INVENTORY_ENTRY');if(stat.isDirectory())walk(abs);else files.push({path:rel,bytes:stat.size,nlink:stat.nlink,sha256:hash(abs)});}}walk(base);return files.sort((a,b)=>a.path.localeCompare(b.path));}
const snap={observedUTC:new Date().toISOString(),root:workspace,scope:'All files including own Git, dependencies and identified generated build/test outputs; no exclusions',files:inventory(workspace)};
fs.writeFileSync(path.join(root,'CANDIDATE_SNAPSHOT_FINAL.json'),JSON.stringify(snap,null,2),{flag:'wx'});
for(const base of[root,path.resolve(root,'../HTTP_TRANSPORT_RECOVERY_20261105'),path.resolve(root,'../TABLET_SOURCE_CLEANUP_20261105')]){
 const files=inventory(base,p=>p==='workspace'||p==='CLOSURE.json');
 const out={observedUTC:new Date().toISOString(),scope:base===root?'External evidence files; workspace covered completely by CANDIDATE_SNAPSHOT_FINAL.json':'All evidence files, except this self-referential closure',files};
 fs.writeFileSync(path.join(base,'CLOSURE.json'),JSON.stringify(out,null,2),{flag:'wx'});
 console.log(JSON.stringify({evidenceFolder:path.basename(base),files:files.length,closureHash:hash(path.join(base,'CLOSURE.json'))}));
}
console.log(JSON.stringify({canonicalExitCode:canonical.status,candidateFiles:snap.files.length,candidateLinks:snap.files.filter(f=>f.nlink!==1).length,apkHash:hash(path.join(root,'Xandeflix-v1.0.53-Source-Isolation-20261105.apk'))}));
