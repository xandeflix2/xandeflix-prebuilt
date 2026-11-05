import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';
const folder='C:/Xandeflix/Audits/SOURCE_SWITCH_ISOLATION_20261105',root=folder+'/workspace';
const checked=JSON.parse(fs.readFileSync(folder+'/CACHE_REVIEW_VALIDATIONS.json'));if(checked.length!==11||checked.some(r=>r.exitCode!==0)||checked.at(-1).name!=='16_CANONICAL_FINAL')throw Error('FINAL_GATES_NOT_COMPLETE');
const results=[],before=Object.fromEntries(['android/capacitor.settings.gradle','android/app/capacitor.build.gradle'].map(f=>[f,fs.readFileSync(root+'/'+f)]));
async function run(name,exe,args,cwd=root){
 const startedUTC=new Date().toISOString(),log=fs.createWriteStream(folder+'/'+name+'.log',{flags:'wx'});console.log(JSON.stringify({status:'STARTED',name,startedUTC}));
 const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,args,{cwd,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',ANDROID_HOME:'C:/Users/Alexandre/AppData/Local/Android/Sdk',ANDROID_SDK_ROOT:'C:/Users/Alexandre/AppData/Local/Android/Sdk'},windowsHide:true,stdio:['ignore','pipe','pipe']});p.stdout.pipe(log,{end:false});p.stderr.pipe(log,{end:false});p.on('error',reject);p.on('close',resolve)});
 await new Promise(r=>log.end(r));const row={name,startedUTC,finishedUTC:new Date().toISOString(),exitCode};results.push(row);fs.writeFileSync(folder+'/BUILD_RESULTS.json',JSON.stringify(results,null,2));console.log(JSON.stringify(row));if(exitCode!==0)throw Error('BUILD_STEP_FAILED_'+name);
}
await run('17_PUBLIC_WEB_BUILD',process.execPath,['scripts/build-isolated-public-config.mjs','C:/Xandeflix/xandeflix-prebuilt-c11-main']);
await run('18_CAPACITOR_SYNC',process.execPath,['node_modules/@capacitor/cli/bin/capacitor','sync','android']);
const generated=[];for(const[f,bytes]of Object.entries(before)){
 const after=fs.readFileSync(root+'/'+f),equal=after.equals(bytes),sameNormalized=after.toString('utf8').replaceAll('\r\n','\n')===bytes.toString('utf8').replaceAll('\r\n','\n');
 generated.push({path:f,byteIdentical:equal,normalizedIdentical:sameNormalized});if(!sameNormalized)throw Error('UNEXPECTED_GENERATED_GRADLE_CHANGE');
}
fs.writeFileSync(folder+'/GENERATED_GRADLE_COMPARISON.json',JSON.stringify(generated,null,2),{flag:'wx'});
fs.writeFileSync(root+'/android/local.properties',['sdk.dir=C:/Users/Alexandre/AppData/Local/Android/Sdk',''].join(String.fromCharCode(10)),{flag:'wx'});
await run('19_C11_PRE_GRADLE',process.execPath,['scripts/test-c11-new-device-activation-lock.mjs']);
await run('20_ANDROID_TEST_BUILD',process.env.ComSpec||'cmd.exe',['/d','/s','/c','gradlew.bat --offline --no-daemon :app:testDebugUnitTest :app:assembleDebug'],root+'/android');
await run('21_CANONICAL_POST_BUILD',process.execPath,['scripts/verify-canonical-contract.mjs']);
await run('22_C11_POST_BUILD',process.execPath,['scripts/test-c11-new-device-activation-lock.mjs']);
console.log('TEST_APK_BUILD_STEPS_COMPLETE');
