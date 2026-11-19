import {open} from '../DEVICE_AUDIT_20261104/cdp.mjs';
const c=await open('192.168.3.106:5555');
try{console.log(await c.evaluate(String.raw`(()=>{
 if(window.__xfRecovery)throw Error('RECOVERY_OBSERVER_ALREADY_PRESENT');
 const cap=window.Capacitor,orig=cap.nativePromise,parse=JSON.parse,decode=TextDecoder.prototype.decode,OriginalError=window.Error;
 const started=Date.now(),state={startedUTC:new Date().toISOString(),events:[],codes:[],finished:false,restored:false};window.__xfRecovery=state;
 const add=v=>{if(state.events.length<500)state.events.push({...v,ms:Date.now()-started});};
 const code=s=>typeof s==='string'&&/^[A-Z][A-Z0-9_]{2,100}$/.test(s)?s:null;
 const classify=url=>{try{const u=new URL(url),a=u.searchParams.get('action');return ['get_live_categories','get_live_streams','get_vod_categories','get_vod_streams','get_series_categories','get_series','get_series_info','get_vod_info'].includes(a)?a:u.pathname.endsWith('/player_api.php')?'ACCOUNT_API':u.pathname.endsWith('/get.php')?'PLAYLIST':'OTHER_SOURCE';}catch{return'UNKNOWN'}};
 const shape=s=>{const p=s.trimStart();return p.startsWith('#EXTM3U')?'M3U':p.startsWith('[')?'JSON_ARRAY':p.startsWith('{')?'JSON_OBJECT':p.startsWith('<')?'HTML_OR_XML':'OTHER'};
 let n=0;const sessions=new Map();
 cap.nativePromise=function(plugin,method,options){
  const item=plugin==='LargeSourceTransport'&&method==='startDownload'?{n:++n,kind:classify(options.url),bytes:0,chunks:0}:null;
  if(item)add({event:'REQUEST',n:item.n,kind:item.kind,connectTimeoutMs:options.connectTimeoutMs,readTimeoutMs:options.readTimeoutMs});
  return orig.call(this,plugin,method,options).then(v=>{
   if(plugin!=='LargeSourceTransport')return v;
   if(item){if(v.downloadId)sessions.set(v.downloadId,item);add({event:'RESPONSE',n:item.n,kind:item.kind,success:v.success,status:v.httpStatusClass,error:code(v.errorCode),stage:v.stage});}
   if(method==='readChunk'){
    const s=sessions.get(options.downloadId);
    if(s){s.bytes+=Number(v.bytesRead)||0;
     if(v.bytesRead>0){s.chunks++;if(s.chunks===1){const prefix=typeof v.dataText==='string'?v.dataText.slice(0,64):typeof v.dataBase64==='string'?atob(v.dataBase64.slice(0,160)):'';add({event:'FIRST_CHUNK',n:s.n,kind:s.kind,shape:shape(prefix)});}}
     if(v.done||v.errorCode)add({event:'END',n:s.n,kind:s.kind,bytes:s.bytes,chunks:s.chunks,done:v.done,error:code(v.errorCode),stage:v.stage});
    }
   }
   return v;
  });
 };
 JSON.parse=function(text,...rest){try{const v=Reflect.apply(parse,this,[text,...rest]);if(typeof text==='string'&&text.length>100000&&Array.isArray(v)){const row=v.find(x=>x&&typeof x==='object');add({event:'JSON_ARRAY_PARSED',characters:text.length,rows:v.length,rowClass:row&&Object.hasOwn(row,'series_id')?'SERIES':row&&Object.hasOwn(row,'stream_id')?'STREAMS':'OTHER'});}return v}catch(e){add({event:'JSON_PARSE_FAILED',characters:typeof text==='string'?text.length:null,inputShape:typeof text==='string'?shape(text):'NON_STRING'});throw e;}};
 TextDecoder.prototype.decode=function(...args){try{return Reflect.apply(decode,this,args)}catch(e){add({event:'DECODE_FAILED',fatal:this.fatal,bytes:args[0]?.byteLength||0});throw e;}};
 window.Error=new Proxy(OriginalError,{construct(t,args,nt){const k=code(args[0]);if(k&&state.codes.length<100)state.codes.push(k);return Reflect.construct(t,args,nt)},apply(t,x,args){const k=code(args[0]);if(k&&state.codes.length<100)state.codes.push(k);return Reflect.apply(t,x,args)}});
 state.restore=()=>{cap.nativePromise=orig;JSON.parse=parse;TextDecoder.prototype.decode=decode;window.Error=OriginalError;state.restored=true;};
 if(typeof window.__XANDEFLIX_SYNC_CATALOG__!=='function'){state.restore();delete window.__xfRecovery;return{started:false,reason:'SYNC_ENTRY_UNAVAILABLE'}}
 Promise.resolve(window.__XANDEFLIX_SYNC_CATALOG__()).then(r=>{state.result={outcome:code(r?.outcome),syncState:code(r?.syncState),error:code(r?.error)};state.finished=true;state.restore();},()=>{state.result={error:'SYNC_PROMISE_REJECTED'};state.finished=true;state.restore();});
 return{started:true,observedUTC:new Date().toISOString(),visibility:document.visibilityState};
})()`));}finally{c.close();}
