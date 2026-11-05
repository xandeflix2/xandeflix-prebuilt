import fs from'node:fs';import{execFileSync}from'node:child_process';import{open}from'./cdp-local.mjs';
const [serial,label]=process.argv.slice(2);if(!/^(TABLET|FIRE)_[A-Z0-9_]+$/.test(label))throw Error('INVALID_LABEL');
const adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe',c=await open(serial);
try{
 const observation=await c.evaluate(`(()=>{const a=window.__xfMediaAudit;return{events:a?.events||[],visibility:document.visibilityState}})()`);
 const opened=observation.events.filter(e=>e.event==='OPEN').at(-1);if(!opened)throw Error('NO_CURRENT_ATTEMPT');const start=Date.parse(opened.observedUTC)/1000;
 const pid=execFileSync(adb,['-s',serial,'shell','pidof','com.xandeflix.prebuilt'],{encoding:'utf8'}).trim().split(/\s+/)[0];
 const raw=execFileSync(adb,['-s',serial,'logcat','-d','--pid='+pid,'-s','NativePlayerActivity:I','-v','epoch'],{encoding:'utf8',maxBuffer:8*1024*1024});
 const events=[];
 for(const line of raw.split(/\r?\n/)){
  const epoch=Number(line.trim().split(/\s+/)[0]);if(!Number.isFinite(epoch)||epoch<start)continue;const time=new Date(epoch*1000).toISOString();
  for(const [needle,event]of[['RENDERED_FIRST_FRAME','FIRST_FRAME'],['MOVIE_POSITION_ADVANCED=SIM','POSITION_ADVANCED'],['DATASOURCE_OPEN_SUCCESS','DATASOURCE_OPEN_SUCCESS']])if(line.includes(needle))events.push({time,event});
  const state=line.match(/PLAYBACK_STATE_([A-Z_]+)/);if(state)events.push({time,event:'STATE',value:state[1]});
  if(line.includes('PLAYER_ERROR playAttemptId='))events.push({time,event:'ERROR',category:line.match(/category=([A-Z_]+)/)?.[1],httpStatus:line.match(/httpStatus=([0-9]+)/)?.[1]});
 }
 const out={observedUTC:new Date().toISOString(),kind:opened.kind,startUTC:opened.observedUTC,nativeEvents:events,...observation,audibleOutputVerified:false};fs.writeFileSync(new URL(label+'.json',import.meta.url),JSON.stringify(out,null,2),{flag:'wx'});console.log(JSON.stringify(out));
}finally{c.close()}
