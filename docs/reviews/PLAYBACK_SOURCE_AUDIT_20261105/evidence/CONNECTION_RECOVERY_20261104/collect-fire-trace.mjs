import fs from 'node:fs';
import {open} from '../DEVICE_AUDIT_20261104/cdp.mjs';
const c=await open('192.168.3.106:5555');
try{const r=await c.evaluate(`(()=>{const a=window.__xfRecovery;return a?{observedUTC:new Date().toISOString(),startedUTC:a.startedUTC,finished:a.finished,restored:a.restored,result:a.result||null,codes:a.codes,events:a.events}:{observerPresent:false}})()`);fs.writeFileSync(new URL('FIRE_DEEP_TRACE.json',import.meta.url),JSON.stringify(r,null,2));console.log(JSON.stringify({...r,events:r.events?.slice(-12),eventCount:r.events?.length}));}finally{c.close();}
