import fs from'node:fs';import{open}from'./cdp-local.mjs';const[serial,label]=process.argv.slice(2);if(!['FIRE','TABLET'].includes(label))throw Error('INVALID_LABEL');const c=await open(serial);
try{const result=await c.evaluate(String.raw`(async()=>{
 let stage='CONTEXT',downloadId;
 const call=(p,m,o)=>window.Capacitor.nativePromise(p,m,o);
 const read=async path=>{const r=await call('Filesystem','readFile',{path,directory:'DATA',encoding:'utf8'});return JSON.parse(r.data)};
 const safe=x=>typeof x==='string'&&/^[A-Z0-9_-]{1,100}$/.test(x)?x:null;
 try{
  const a=window.__xfMediaAudit,req=a?.lastRequest;
  if(!req||req.kind!=='series')return{status:'NO_SELECTED_EPISODE'};
  const seriesId=req.episodeContext?.currentEpisodeId?.match(/^episode:([1-9][0-9]*):[1-9][0-9]*$/)?.[1];
  const media=new URL(req.uri.split('|')[0]);
  const mediaId=media.pathname.split('/').at(-1)?.match(/^([1-9][0-9]*)[.][A-Za-z0-9]{1,12}$/)?.[1];
  if(!seriesId||!mediaId)return{status:'SELECTED_CONTEXT_UNSUPPORTED',hasEpisodeContext:!!req.episodeContext,episodeContextFieldNames:Object.keys(req.episodeContext||{})};
  stage='LOCAL_BINDING';const pointer=await read('prebuilt/active.json');const sealed=await call('LocalSecureSourceStore','secureGet',{sourceId:pointer.sourceId});
  const record=sealed?.record;
  if(!sealed?.found||record.sourceId!==pointer.sourceId||record.sourceVersion!==pointer.sourceVersion)return{status:'BINDING_MISMATCH'};
  let src,username,password;
  if(record.protocol==='M3U'){src=new URL(record.sourceConfig.playlistUrl);if(!src.pathname.endsWith('/get.php'))return{status:'SOURCE_API_NOT_EXPLICIT'};username=src.searchParams.get('username');password=src.searchParams.get('password');}
  else if(record.protocol==='XTREAM'){src=new URL(record.sourceConfig.endpoint);username=record.sourceConfig.username;password=record.sourceConfig.password;}
  if(!src||!username||!password)return{status:'SOURCE_API_CONFIG_UNAVAILABLE'};
  const base=src.pathname.replace(/(?:get|player_api)[.]php$/i,'').replace(/[/]+$/,'');
  const u=new URL(src.origin+base+'/player_api.php');u.searchParams.set('username',username);u.searchParams.set('password',password);u.searchParams.set('action','get_series_info');u.searchParams.set('series_id',seriesId);
  stage='DETAILS_FETCH';const start=await call('LargeSourceTransport','startDownload',{url:u.href,headers:{Accept:'application/json'},progressive:true,maxSourceFileBytes:16*1024*1024,connectTimeoutMs:20000,readTimeoutMs:20000});downloadId=start.downloadId;
  if(!start.success||!downloadId)return{status:'DETAILS_FETCH_FAILED',httpClass:start.httpStatusClass,error:safe(start.errorCode)};
  const decoder=new TextDecoder('utf-8',{fatal:true});let bytes=0,text='';
  for(;;){const r=await call('LargeSourceTransport','readChunk',{downloadId,maxBytes:65536});if(r.errorCode)return{status:'DETAILS_CHUNK_FAILED',bytes,error:safe(r.errorCode)};if(r.pending){await new Promise(resolve=>setTimeout(resolve,100));continue}if(r.done)break;bytes+=r.bytesRead||0;if(bytes>16*1024*1024)return{status:'DETAILS_LIMIT'};if(typeof r.dataText==='string')text+=r.dataText;else if(r.dataBase64){const raw=atob(r.dataBase64),b=Uint8Array.from(raw,x=>x.charCodeAt(0));text+=decoder.decode(b,{stream:true})}}
  text+=decoder.decode();stage='DETAILS_COMPARE';const j=JSON.parse(text);
  const lists=j?.episodes&&typeof j.episodes==='object'?Object.values(j.episodes):[];let rows=0;const selected=[];
  for(const group of lists)if(Array.isArray(group))for(const ep of group){rows++;if(String(ep?.id)===mediaId)selected.push(ep);}
  if(selected.length!==1)return{status:'SELECTED_EPISODE_NOT_UNIQUE',matches:selected.length,episodeRows:rows,bytes};
  const ep=selected[0],candidates=[];
  for(const field of ['direct_source','stream_url','url','source'])for(const [location,obj]of [['episode',ep],['info',ep.info]]){
   const value=obj?.[field];if(typeof value!=='string'||!value.trim())continue;
   let parsed;try{parsed=new URL(value)}catch{}
   candidates.push({field,location,isHttpUrl:!!parsed&&['http:','https:'].includes(parsed.protocol),equalsSelectedRequest:value.trim()===req.uri.split('|')[0],sameOriginAsSource:parsed?.origin===src.origin,hasQuery:!!parsed?.search,extension:parsed?.pathname.match(/[.]([A-Za-z0-9]{1,12})$/)?.[1]||null});
  }
  const current=await read('prebuilt/active.json');
  a.episodeDetails={seriesId,mediaId,episode:ep,source:record,sourceOrigin:src.origin,selectedRequest:req};
  return{observedUTC:new Date().toISOString(),status:'DETAILS_COMPARED',sourceBindingStable:current.sourceId===pointer.sourceId&&current.sourceVersion===pointer.sourceVersion&&current.snapshotId===pointer.snapshotId,bytes,episodeRows:rows,selectedMatches:1,seasonsShape:Array.isArray(j.seasons)?'ARRAY':j.seasons&&typeof j.seasons==='object'?'OBJECT':'OTHER',declaredExtension:typeof ep.container_extension==='string'&&/^[.]?[A-Za-z0-9]{1,12}$/.test(ep.container_extension)?ep.container_extension:null,requestExtension:media.pathname.match(/[.]([A-Za-z0-9]{1,12})$/)?.[1]||null,hasInfo:!!ep.info,alternateReferenceFields:candidates};
 }catch(e){return{status:'AUDIT_READ_FAILED',stage,error:safe(e?.code)}}finally{if(downloadId)try{await call('LargeSourceTransport','cleanupDownload',{downloadId})}catch{}}
})()`);fs.writeFileSync(new URL(label+'_AFTER_CLEAN_EPISODE_REFERENCE.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result))}finally{c.close()}
