import fs from 'node:fs';
import {open} from '../DEVICE_AUDIT_20261104/cdp.mjs';
const c=await open('192.168.3.109:41761');
try{
 const r=await c.evaluate(String.raw`(async()=>{
  const a=window.__xfConnection;const before=!!a;
  if(a){if(typeof a.restore!=='function')return {status:'UNKNOWN_OBSERVER_PRESERVED',before};a.restore();for(const h of a.handles||[])try{await h.remove()}catch{}delete window.__xfConnection;}
  const counts={};
  for(const [name,key]of Object.entries({recent:'xandeflix:recent-watched:v1',positions:'xandeflix:watch-positions:v1',sessions:'xandeflix:watch-sessions:v1'})){
   try{const raw=localStorage.getItem(key);if(!raw){counts[name]={present:false};continue}if(raw.length>300000){counts[name]={present:true,state:'TOO_LARGE'};continue}const j=JSON.parse(raw);counts[name]={present:true,records:Array.isArray(j.records)?j.records.length:Array.isArray(j.sessions)?j.sessions.length:null}}catch{counts[name]={state:'UNREADABLE'}}
  }
  return{observedUTC:new Date().toISOString(),status:'COMPLETE',previousObserverPresent:before,observerRemoved:!window.__xfConnection,syncObserverPresent:!!window.__xfSyncAudit,history:counts};
 })()`);
 fs.writeFileSync(new URL('TABLET_OBSERVER_CLEANUP_AND_HISTORY.json',import.meta.url),JSON.stringify(r,null,2));console.log(JSON.stringify(r));
}finally{c.close()}
