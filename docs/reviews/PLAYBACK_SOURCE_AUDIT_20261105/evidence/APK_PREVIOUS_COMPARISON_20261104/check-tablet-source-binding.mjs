import fs from 'node:fs';
import {open} from '../DEVICE_AUDIT_20261104/cdp.mjs';
const c=await open('192.168.3.109:41761');
try{
 const result=await c.evaluate(String.raw`(async()=>{
  let stage='ACTIVE_POINTER';
  try{
  const call=(plugin,method,options)=>window.Capacitor.nativePromise(plugin,method,options);
  const read=async path=>{const st=await call('Filesystem','stat',{path,directory:'DATA'});if(st.type!=='file'||st.size>2*1024*1024)throw Error('BOUNDED_FILE_LIMIT');const r=await call('Filesystem','readFile',{path,directory:'DATA',encoding:'utf8'});return JSON.parse(r.data);};
  const p=await read('prebuilt/active.json');
  if(!/^[A-Za-z0-9_-]{1,120}$/.test(p.snapshotId)||!/^src_[a-z0-9]+$/.test(p.sourceId))return{status:'UNEXPECTED_ID_FORMAT'};
  stage='ACTIVE_MANIFEST';
  const m=await read('prebuilt/snapshots/'+p.snapshotId+'/manifest.json');
  stage='LOCAL_SECURE_RECORD';
  const secure=await call('LocalSecureSourceStore','secureGet',{sourceId:p.sourceId});
  const rec=secure?.record;
  if(!secure?.found||!rec)return{status:'LOCAL_RECORD_UNAVAILABLE',recordFound:!!secure?.found};
  let base;
  try{base=new URL(rec.protocol==='M3U'?rec.sourceConfig.playlistUrl:rec.sourceConfig.endpoint)}catch{return{status:'LOCAL_SOURCE_URL_UNPARSEABLE'}}
  const user=rec.protocol==='M3U'?base.searchParams.get('username'):rec.sourceConfig.username;
  const pass=rec.protocol==='M3U'?base.searchParams.get('password'):rec.sourceConfig.password;
  const expectedCredentialPair=typeof user==='string'&&typeof pass==='string';
  stage='RECOVERY_JOURNAL';
  const journal=await read('prebuilt/recovery.json');
  stage='STREAM_SEGMENT_SAMPLE';
  const segs=(Array.isArray(m.segments)?m.segments:[]).filter(x=>x.kind==='streams');
  const counts={sampled:0,withDirectUrl:0,withoutDirectUrl:0,sameOrigin:0,differentOrigin:0,invalidUrl:0,typedMovie:0,typedSeries:0,otherPath:0,credentialPairsCompared:0,credentialPairsMatch:0,credentialPairsDiffer:0};
  let segmentsRead=0;
  for(const s of segs.slice(0,2)){
   if(typeof s.fileName!=='string')return{status:'SEGMENT_PATH_REJECTED'};
   const leaf=s.fileName.startsWith('segments/')?s.fileName.slice(9):s.fileName;
   if(!/^[A-Za-z0-9_.-]{1,120}$/.test(leaf)||s.fileName.includes('..'))return{status:'SEGMENT_PATH_REJECTED'};
   const name=s.fileName.startsWith('segments/')?s.fileName:'segments/'+s.fileName;
   const rows=await read('prebuilt/snapshots/'+p.snapshotId+'/'+name);segmentsRead++;
   if(!Array.isArray(rows))return{status:'UNEXPECTED_STREAM_SEGMENT'};
   for(const r of rows){if(counts.sampled>=64)break;counts.sampled++;
    if(typeof r?.directStreamUrl!=='string'){counts.withoutDirectUrl++;continue}counts.withDirectUrl++;
    let u;try{u=new URL(r.directStreamUrl.split('|')[0])}catch{counts.invalidUrl++;continue}
    u.origin===base.origin?counts.sameOrigin++:counts.differentOrigin++;
    const parts=u.pathname.split('/').filter(Boolean);const k=parts[0];
    if(k==='movie')counts.typedMovie++;else if(k==='series')counts.typedSeries++;else counts.otherPath++;
    if(expectedCredentialPair&&['movie','series','live'].includes(k)&&parts.length>=4){counts.credentialPairsCompared++;let match=false;try{match=decodeURIComponent(parts[1])===user&&decodeURIComponent(parts[2])===pass}catch{}match?counts.credentialPairsMatch++:counts.credentialPairsDiffer++;}
   }
   if(counts.sampled>=64)break;
  }
  stage='POINTER_STABILITY';
  const end=await read('prebuilt/active.json');
  return{observedUTC:new Date().toISOString(),status:'READ_ONLY_BINDING_AUDIT',activePointerStable:end.snapshotId===p.snapshotId&&end.sourceId===p.sourceId&&end.sourceVersion===p.sourceVersion,localSecureRecord:{found:true,sourceIdentityMatches:rec.sourceId===p.sourceId,sourceVersionMatches:rec.sourceVersion===p.sourceVersion,protocol:['M3U','XTREAM'].includes(rec.protocol)?rec.protocol:'OTHER'},manifest:{sourceIdentityMatches:m.metadata?.sourceId===p.sourceId,sourceVersionMatches:m.metadata?.sourceVersion===p.sourceVersion,snapshotMatches:m.snapshotId===p.snapshotId},recoveryJournal:{activeMatches:journal.activeSnapshotId===p.snapshotId,previousPresent:!!journal.previousSnapshotId,lastKnownGoodMatches:journal.lastKnownGoodSnapshotId===p.snapshotId},sample:{totalStreamSegments:segs.length,segmentsRead,limitRows:64,counts},limitations:['Local sealed configuration only; remote assignment was not queried.','Bounded stream sample; no on-demand episode requests, HTTP playback or full stream inventory tested.','Different origin or credential pair alone would require review; no private value was exported.']};
  }catch(e){return{observedUTC:new Date().toISOString(),status:'READ_FAILED',stage,code:typeof e?.code==='string'&&/^[A-Z_0-9-]{1,80}$/.test(e.code)?e.code:'UNCLASSIFIED',boundedMessage:e?.message==='BOUNDED_FILE_LIMIT'?'BOUNDED_FILE_LIMIT':null};}
 })()`);
 fs.writeFileSync(new URL('TABLET_SOURCE_BINDING.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{c.close()}
