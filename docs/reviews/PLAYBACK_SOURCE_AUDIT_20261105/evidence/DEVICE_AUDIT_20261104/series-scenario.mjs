import fs from 'node:fs';
import {open} from './cdp.mjs';
const [serial,label,query]=process.argv.slice(2);
const c=await open(serial);
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await c.evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='Busca');b?.click();return !!b})()`);
 await pause(250);
 await c.evaluate(`(()=>{const i=document.querySelector('input[placeholder^="Buscar filmes"]');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,${JSON.stringify(query)});i.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
 const started=Date.now();let card=false;
 while(Date.now()-started<20000){card=await c.evaluate(`(()=>{const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return [...document.querySelectorAll('button')].some(x=>norm(x.getAttribute('aria-label')||'').includes(norm(${JSON.stringify(query)}))&&/Série/.test(x.getAttribute('aria-label')||''))})()`);if(card)break;await pause(500);}
 if(!card)throw Error('SERIES_RESULT_NOT_FOUND');
 await c.evaluate(`(()=>{const cap=window.Capacitor,orig=cap.nativePromise;const a={events:[],restore(){cap.nativePromise=orig;}};window.__xfScenario=a;cap.nativePromise=function(plugin,method,options){const r=orig.call(this,plugin,method,options);if(plugin!=='LargeSourceTransport')return r;return r.then(result=>{if(method!=='readChunk'||result?.errorCode||result?.done){const event={method};for(const k of ['success','errorCode','stage','httpStatusClass','httpResponseReceived','retryable','bytesWritten','bytesRead','done'])if(result&&k in result)event[k]=result[k];a.events.push(event);}return result;});};const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const b=[...document.querySelectorAll('button')].find(x=>norm(x.getAttribute('aria-label')||'').includes(norm(${JSON.stringify(query)}))&&/Série/.test(x.getAttribute('aria-label')||''));b.click();return true})()`);
 await pause(800);
 const detailsAt=Date.now();let state;
 while(Date.now()-detailsAt<45000){state=await c.evaluate(`({text:(document.querySelector('main')||document.body).innerText.slice(0,1800),loading:(document.querySelector('main')||document.body).innerText.includes('Carregando temporadas e episódios'),events:window.__xfScenario?.events||[],headings:[...document.querySelectorAll('h1,h2')].map(x=>x.textContent.trim()).slice(0,6)})`);if(!state.loading)break;await pause(500);}
 const result={observedUTC:new Date().toISOString(),label,query,elapsedMs:Date.now()-detailsAt,state};
 fs.writeFileSync(new URL(`./${label}-${query.replace(/[^a-zA-Z0-9]/g,'_')}-scenario.json`,import.meta.url),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}finally{await c.evaluate(`(()=>{window.__xfScenario?.restore();delete window.__xfScenario;return true})()`).catch(()=>{});c.close();}
