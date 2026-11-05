import{open}from'../DEVICE_AUDIT_20261104/cdp.mjs';
const serial=process.argv[2];if(!serial)throw Error('TARGET_REQUIRED');const c=await open(serial);
try{console.log(await c.evaluate(String.raw`(()=>{
 if(window.__xfMediaAudit)throw Error('MEDIA_OBSERVER_PRESENT');
 const cap=window.Capacitor,orig=cap.nativePromise;
 const a={startedUTC:new Date().toISOString(),events:[],handles:[],lastRequest:null};window.__xfMediaAudit=a;
 const safe=v=>typeof v==='string'&&/^[A-Z_0-9-]{1,100}$/.test(v)?v:'UNKNOWN';
 const add=x=>{if(a.events.length<100)a.events.push({...x,observedUTC:new Date().toISOString()});};
 cap.nativePromise=function(plugin,method,options){
  if(plugin==='NativeAndroidPlayer'&&method==='open'){
   a.lastRequest=options;
   let info={};try{const u=new URL(options.uri.split('|')[0]),parts=u.pathname.split('/').filter(Boolean);info={scheme:u.protocol,typedPath:['movie','series','live'].includes(parts[0])?parts[0]:'OTHER',extension:u.pathname.match(/\.([a-zA-Z0-9]{1,12})$/)?.[1]||null,pathDepth:parts.length,hasQuery:!!u.search}}catch{info={urlParseFailed:true}}
   add({event:'OPEN',kind:options.kind,...info,headerNames:Object.keys(options.headers||{}),uaClass:options.headers?.['User-Agent']==='IPTVSmarters/1.0'?'IPTV_SMARTERS_DEFAULT':'OTHER_OR_MISSING'});
  }
  const r=orig.call(this,plugin,method,options);
  if(plugin==='NativeAndroidPlayer'&&method==='open')return r.then(v=>{add({event:'OPEN_RETURN',accepted:v?.accepted,candidateCount:v?.candidateCount});return v},e=>{add({event:'OPEN_REJECT',code:safe(e?.code)});throw e});
  if(plugin==='LargeSourceTransport'&&method==='startDownload')return r.then(v=>{let action;try{action=new URL(options.url).searchParams.get('action')}catch{}add({event:'SOURCE_RESPONSE',kind:['get_series_info','get_vod_info'].includes(action)?action:'OTHER',success:v?.success,status:v?.httpStatusClass,error:safe(v?.errorCode),stage:v?.stage});return v});
  return r;
 };
 const p=cap.Plugins.NativeAndroidPlayer;
 a.ready=Promise.all(['resume','progress'].map(event=>p.addListener(event,v=>{const e={event};for(const k of ['positionMs','durationMs','ended','errorCode','errorCategory','httpStatus','media3ErrorCode','checkpoint'])if(k in v)e[k]=v[k];if(event!=='progress'||a.events.filter(x=>x.event==='progress').length<10)add(e);}))).then(h=>a.handles=h);
 a.restore=async()=>{cap.nativePromise=orig;await a.ready;for(const h of a.handles)try{await h.remove()}catch{}a.lastRequest=null;};
 const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='Filmes'&&x.getBoundingClientRect().height>0);b?.click();
 return{hooked:true,moviesNavigationClicked:!!b,visibility:document.visibilityState};
})()`))}finally{c.close()}
