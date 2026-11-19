import fs from 'node:fs';
import {open} from './cdp-local.mjs';
const c=await open('RX2X301Q3KY');
try {
 const r=await c.evaluate(String.raw`(()=>{
  const a=window.__xfMediaAudit;
  if(!a?.before5G)throw Error('REFERENCE_NOT_HELD');
  const b=[...document.querySelectorAll('button')].find(b=>b.getBoundingClientRect().height>0&&!b.disabled&&/^\s*(?:▶\s*)?Assistir\s*$/.test(b.textContent));
  const episodes=[...document.querySelectorAll('[data-series-episode-id]')].filter(b=>b.getBoundingClientRect().height>0);
  if(document.visibilityState!=='visible'||!b)return{clicked:false,visibility:document.visibilityState,episodeButtons:episodes.length};
  a.events=[];b.click();return{clicked:true,visibility:document.visibilityState,episodeButtons:episodes.length};
 })()`);
 fs.writeFileSync(new URL('TABLET_5G_ACTION.json',import.meta.url),JSON.stringify({observedUTC:new Date().toISOString(),...r},null,2),{flag:'wx'});
 console.log(JSON.stringify(r));
}finally{c.close()}
