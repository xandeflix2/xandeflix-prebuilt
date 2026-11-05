import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='C:/Xandeflix/xandeflix-prebuilt-c11-main';
const phase=root+'/tmp/tmdb-episode-metadata-enrichment-20261027';
const candidate=phase+'/NEXT_EPISODE_G2_A22_CANDIDATE/workspace';
const snapshotPath=phase+'/NEXT_EPISODE_G3_EVIDENCE/CANDIDATE_SNAPSHOT.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(cwd,...args)=>execFileSync('git',['--no-optional-locks','-C',cwd,...args],{encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},maxBuffer:10*1024*1024}).trim();
const repositories=[];
for(const cwd of ['C:/Xandeflix/xandeflix-prebuilt',root,candidate]){
  const origin=git(cwd,'remote','get-url','origin');
  if(origin!=='https://github.com/xandeflix2/xandeflix-prebuilt.git')throw Error('UNEXPECTED_ORIGIN_STOP');
  repositories.push({cwd,topLevel:git(cwd,'rev-parse','--show-toplevel'),origin,branch:git(cwd,'branch','--show-current'),head:git(cwd,'rev-parse','HEAD'),status:git(cwd,'status','--short','--branch')});
}
const raw=fs.readFileSync(snapshotPath),snapshot=JSON.parse(raw),differences=[],seen=new Set(),links=[];
let identical=0;
function walk(dir,rel=''){
  for(const name of fs.readdirSync(dir)){
    const r=rel?rel+'/'+name:name,p=path.join(dir,name),s=fs.lstatSync(p);
    if(s.isSymbolicLink()){links.push(r);continue;}
    if(s.isDirectory())walk(p,r);
    else if(s.isFile()){
      seen.add(r);const expected=snapshot.files[r];
      if(!expected)differences.push({path:r,kind:'EXTRA'});
      else if(s.nlink!==1 || s.size!==expected.size || sha(fs.readFileSync(p))!==expected.sha256)differences.push({path:r,kind:'CHANGED',nlink:s.nlink});
      else identical++;
    }else differences.push({path:r,kind:'SPECIAL'});
  }
}
walk(candidate);
for(const r of Object.keys(snapshot.files))if(!seen.has(r))differences.push({path:r,kind:'MISSING'});
const sourceChanges=[];
for(const [r,expected] of Object.entries(snapshot.files)){
  if(r.startsWith('.git/')||r.startsWith('node_modules/')||r.startsWith('tmp/'))continue;
  const p=path.join(root,r);
  if(!fs.existsSync(p))sourceChanges.push({path:r,kind:'ABSENT_AT_ROOT'});
  else if(sha(fs.readFileSync(p))!==expected.sha256)sourceChanges.push({path:r,kind:'DIFFERS_FROM_G3'});
}
const result={observedUTC:new Date().toISOString(),gitOptionalLocks:0,repositories,g3:{snapshotSha256:sha(raw),expectedFiles:Object.keys(snapshot.files).length,identicalFiles:identical,differences,links},rootVsG3ManagedHistoricalFiles:sourceChanges};
fs.writeFileSync(new URL('REPOSITORY_AUDIT.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({g3:result.g3,rootVsG3Differences:sourceChanges.length,repositories:repositories.map(({status,...r})=>({...r,statusLines:status.split('\n').length}))}));
