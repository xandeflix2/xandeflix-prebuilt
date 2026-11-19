import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';
const folder='C:/Xandeflix/Audits/SOURCE_SWITCH_ISOLATION_20261105',cwd=folder+'/workspace',results=[];
for(const[name,args]of[
 ['06_CANONICAL_AFTER',['scripts/verify-canonical-contract.mjs']],
 ['07_TYPECHECK',['node_modules/typescript/bin/tsc','--noEmit']],
 ['08_C11_AFTER',['scripts/test-c11-new-device-activation-lock.mjs']],
 ['09_TARGET_ISOLATION',['scripts/test-source-replacement-isolation.mjs']],
 ['10_TARGET_BOOTSTRAP',['scripts/test-source-replacement-bootstrap.mjs']],
 ['11_TARGET_UI',['scripts/test-source-replacement-ui.mjs']],
 ['12_NOVELTY',['scripts/test-c11-new-content-badge.mjs']],
 ['13_ARTWORK_RECOVERY',['scripts/test-c11-artwork-visible-recovery.mjs']],
 ['14_ARTWORK_PREPARATION',['scripts/test-c11-page-artwork-preparation.mjs']],
 ['15_FULL_REGRESSION',['scripts/test-canonical-regression.mjs']],
 ['16_CANONICAL_FINAL',['scripts/verify-canonical-contract.mjs']]]){
 const startedUTC=new Date().toISOString(),log=fs.createWriteStream(path.join(folder,'REVIEW_'+name+'.log'),{flags:'wx'});console.log(JSON.stringify({status:'STARTED',name,startedUTC}));
 const code=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,args,{cwd,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});p.stdout.pipe(log,{end:false});p.stderr.pipe(log,{end:false});p.on('error',reject);p.on('close',resolve)});await new Promise(r=>log.end(r));
 const row={name,args,startedUTC,finishedUTC:new Date().toISOString(),exitCode:code};results.push(row);fs.writeFileSync(folder+'/CACHE_REVIEW_VALIDATIONS.json',JSON.stringify(results,null,2));console.log(JSON.stringify(row));if(code!==0){process.exitCode=1;break;}
}
