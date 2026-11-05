import {open} from './cdp.mjs';
import fs from 'node:fs';
for (const [label,serial] of [['fire','G071CQ070344374G'],['tablet','RX2X301Q3KY'],['phone','RXGYB03FL4W']]) {
  const c = await open(serial);
  try {
    const value = await c.evaluate(`(() => {
      const rect = e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e); return {tag:e.tagName,className:e.className,top:r.top,height:r.height,width:r.width,display:s.display,visibility:s.visibility}; };
      return {
        viewport:{width:innerWidth,height:innerHeight},
        headings:[...document.querySelectorAll('h1,h2')].map(e=>e.textContent.trim()).slice(0,5),
        headers:[...document.querySelectorAll('header')].map(rect),
        hero:[...document.querySelectorAll('[class*=hero]')].map(rect).slice(0,12),
        controls:[...document.querySelectorAll('button')].filter(e=>/voltar|transmitir|cast/i.test((e.getAttribute('aria-label')||'')+e.textContent)).map(e=>({label:(e.getAttribute('aria-label')||e.textContent).trim(),...rect(e)}))
      };
    })()`);
    fs.writeFileSync(new URL(label+'-layout-runtime.json',import.meta.url),JSON.stringify({observedUTC:new Date().toISOString(),...value},null,2));
    console.log(JSON.stringify({label,...value}));
  } finally {c.close();}
}
