import fs from 'node:fs';
import{execFileSync}from'node:child_process';
import{open}from'./cdp-local.mjs';
const serial='RX2X301Q3KY',adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const start=Date.parse('2026-11-05T17:27:58Z')/1000;
const pid=execFileSync(adb,['-s',serial,'shell','pidof','com.xandeflix.prebuilt'],{encoding:'utf8'}).trim().split(/\s+/)[0];
const raw=execFileSync(adb,['-s',serial,'logcat','-d','--pid='+pid,'-s','NativePlayerActivity:I','-v','epoch'],{encoding:'utf8',maxBuffer:8*1024*1024});
const events=[];
for(const line of raw.split(/\r?\n/)){
 const epoch=Number(line.trim().split(/\s+/)[0]);if(!Number.isFinite(epoch)||epoch<start)continue;
 const time=new Date(epoch*1000).toISOString();
 if(line.includes('RENDERED_FIRST_FRAME'))events.push({time,event:'FIRST_FRAME'});
 if(line.includes('MOVIE_POSITION_ADVANCED=SIM'))events.push({time,event:'POSITION_ADVANCED'});
 const state=line.match(/PLAYBACK_STATE_([A-Z_]+)/);if(state)events.push({time,event:'STATE',value:state[1]});
 if(line.includes('PLAYER_ERROR playAttemptId='))events.push({time,event:'ERROR',category:line.match(/category=([A-Z_]+)/)?.[1],httpStatus:line.match(/httpStatus=([0-9]+)/)?.[1]});
}
const c=await open(serial);
try{
 const current=await c.evaluate(`(()=>{const a=window.__xfMediaAudit;return{sameUriAsBefore5G:!!a?.before5G&&a.lastRequest?.uri===a.before5G.uri,sameHeadersAsBefore5G:!!a?.before5G&&JSON.stringify(a.lastRequest?.headers||{})===a.before5G.headers,events:a?.events||[]}})()`);
 const out={observedUTC:new Date().toISOString(),startUTC:new Date(start*1000).toISOString(),network:'5G per user',nativeEvents:events,...current};
 fs.writeFileSync(new URL('TABLET_5G_MOVIE_PROOF.json',import.meta.url),JSON.stringify(out,null,2),{flag:'wx'});console.log(JSON.stringify(out));
}finally{c.close()}
