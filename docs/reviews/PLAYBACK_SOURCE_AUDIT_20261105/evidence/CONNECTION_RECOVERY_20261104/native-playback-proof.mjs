import fs from 'node:fs';import{execFileSync}from'node:child_process';
const[serial,label]=process.argv.slice(2);if(!serial||!/^(FIRE|TABLET)_[A-Z0-9_]+$/.test(label))throw Error('TARGET_REQUIRED');
const adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const shell=(...args)=>execFileSync(adb,['-s',serial,'shell',...args],{encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:20000,maxBuffer:8*1024*1024});
const pid=shell('pidof','com.xandeflix.prebuilt').trim().split(/\s+/)[0];
const log=execFileSync(adb,['-s',serial,'logcat','-d','--pid='+pid,'-s','NativePlayerActivity:I','-v','brief'],{encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:20000,maxBuffer:8*1024*1024});
const lines=log.split(/\r?\n/);const events=[];
for(const line of lines){
 const checkpoint=line.match(/LAST_PLAYBACK_CHECKPOINT=([A-Z_]+)/);
 const state=line.match(/PLAYBACK_STATE_([A-Z_]+)/);
 if(checkpoint)events.push({event:'CHECKPOINT',value:checkpoint[1]});
 if(state)events.push({event:'STATE',value:state[1]});
 if(line.includes('MOVIE_POSITION_ADVANCED=SIM'))events.push({event:'POSITION_ADVANCED'});
 if(line.includes('RENDERED_FIRST_FRAME'))events.push({event:'RENDERED_FIRST_FRAME'});
 if(line.includes('PLAYER_ERROR playAttemptId='))events.push({event:'PLAYER_ERROR',category:line.match(/category=([A-Z_]+)/)?.[1],code:line.match(/code=(\d+)/)?.[1],http:line.match(/httpStatus=([0-9]+)/)?.[1],checkpoint:line.match(/LAST_PLAYBACK_CHECKPOINT=([A-Z_]+)/)?.[1]});
}
let audio={};try{const dump=shell('dumpsys','media.audio_flinger');const nums=[...dump.matchAll(/AudioStreamOut[^\n]*|Output thread[^\n]*|Standby:\s*(yes|no)|Master volume:\s*([\d.]+)/g)].map(m=>m[1]??m[2]).filter(Boolean);audio={dumpAvailable:true,standbyNo:nums.includes('no'),standbyYes:nums.includes('yes')};}catch{audio={dumpAvailable:false}}
let metrics={};try{const dump=shell('dumpsys','media.metrics');const items=dump.split(/\r?\n/).filter(l=>/audio|decoder|codec|frames|output/i.test(l));const types=[...new Set(items.flatMap(l=>l.match(/(?:OMX|c2)\.[A-Za-z0-9_.-]+|audio\/[A-Za-z0-9_.+-]+|video\/[A-Za-z0-9_.+-]+/g)||[]))];metrics={available:true,codecTypes:types.slice(-20),scope:'Device-wide codec type observations, not proof of audible output or current session attribution'};}catch{metrics={available:false}}
const out={observedUTC:new Date().toISOString(),label,scope:'Current app PID recent log window; event order retained. Previous attempts in same PID may be included; correlate with observer timestamps.',events:events.slice(-60),audio,metrics};fs.writeFileSync(new URL(label+'_NATIVE.json',import.meta.url),JSON.stringify(out,null,2));console.log(JSON.stringify(out));
