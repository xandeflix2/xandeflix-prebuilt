import fs from 'node:fs';import{open}from'./cdp-local.mjs';
const c=await open('RX2X301Q3KY');
try{
const r=await c.evaluate(String.raw`(async()=>{
 const a=window.__xfMediaAudit,request=a?.lastRequest;if(!request||request.kind!=='series')return{status:'CURRENT_SERIES_REQUEST_REQUIRED'};
 let stage='ORIGINAL_HEAD';
 try{
  const original=new URL(request.uri);if(original.protocol!=='http:'||original.username||original.password)return{status:'UNEXPECTED_ORIGIN'};
  const head=url=>window.Capacitor.nativePromise('CapacitorHttp','request',{method:'HEAD',url,headers:{...request.headers},disableRedirects:true,connectTimeout:8000,readTimeout:8000,responseType:'text'});
  const first=await head(original.href),location=Object.entries(first.headers||{}).find(([k])=>k.toLowerCase()==='location')?.[1];
  if(![301,302,303,307,308].includes(first.status)||typeof location!=='string')return{status:'NO_EXPLICIT_REDIRECT',httpStatus:first.status};
  const target=new URL(location,original);if(target.protocol!=='http:'||target.username||target.password)return{status:'UNEXPECTED_REDIRECT_SCHEME_OR_USERINFO',httpStatus:first.status};
  const secure=new URL(target);secure.protocol='https:';
  stage='REDIRECT_DESTINATION_HTTPS_HEAD';const reply=await head(secure.href);
  const type=String(Object.entries(reply.headers||{}).find(([k])=>k.toLowerCase()==='content-type')?.[1]||'').toLowerCase();
  const stable=a.lastRequest===request;
  a.redirectHttpsProof={originalUri:original.href,secureUri:secure.href,verifiedHead:reply.status>=200&&reply.status<300&&stable};
  return{status:'REDIRECT_HTTPS_TESTED',originalHeadStatus:first.status,httpsHeadStatus:reply.status,sameRedirectHost:secure.hostname===target.hostname,samePathAndQuery:secure.pathname===target.pathname&&secure.search===target.search,portChangedOnlyByScheme:secure.port===target.port,requestUnchanged:stable,videoType:type.startsWith('video/'),htmlType:type.includes('text/html'),certificateValidation:'NORMAL',redirectsFollowed:false};
 }catch(e){const message=String(e?.message||'').toLowerCase();return{status:'REDIRECT_HTTPS_PROBE_FAILED',stage,errorClass:/^[A-Za-z0-9_]{1,80}$/.test(e?.code||'')?e.code:'UNCLASSIFIED',trustAnchor:message.includes('trust anchor'),hostname:message.includes('hostname'),timedOut:message.includes('timed out'),certificateValidationBypassed:false}}
})()`);
const out={observedUTC:new Date().toISOString(),...r};fs.writeFileSync(new URL('TABLET_5G_REDIRECT_HTTPS.json',import.meta.url),JSON.stringify(out,null,2),{flag:'wx'});console.log(JSON.stringify(out));
}finally{c.close()}
