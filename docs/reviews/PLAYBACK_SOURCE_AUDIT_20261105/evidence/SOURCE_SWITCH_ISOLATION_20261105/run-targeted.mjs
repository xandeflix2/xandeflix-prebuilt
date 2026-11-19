import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';
const folder='C:/Xandeflix/Audits/SOURCE_SWITCH_ISOLATION_20261105',cwd=path.join(folder,'workspace'),results=[];
for(const script of ['test-source-replacement-isolation.mjs','test-source-replacement-bootstrap.mjs','test-source-replacement-ui.mjs','test-c11-p5b-boot-sync-coordinator.mjs','test-c11-automatic-source-refresh.mjs','test-c11-new-content-badge.mjs','test-c11-artwork-visible-recovery.mjs','test-c11-page-artwork-preparation.mjs']){
 const name='04_'+script.replace('.mjs',''),startedUTC=new Date().toISOString(), log=fs.createWriteStream(path.join(folder,name+'.log'),{flags:'wx'});
 const code=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/'+script],{cwd,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});p.stdout.pipe(log,{end:false});p.stderr.pipe(log,{end:false});p.on('error',reject);p.on('close',resolve)});
 await new Promise(r=>log.end(r));const row={script,startedUTC,finishedUTC:new Date().toISOString(),exitCode:code};results.push(row);fs.writeFileSync(path.join(folder,'TARGETED_VALIDATIONS.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(row));if(code!==0){process.exitCode=1;break;}
}
