import {open} from './cdp.mjs';
import fs from 'node:fs';
const results=[];
for(const [label,serial] of [['fire','G071CQ070344374G'],['tablet','RX2X301Q3KY'],['phone','RXGYB03FL4W']]) {
 const c=await open(serial);
 try {results.push({label,temporaryAuditGlobals:await c.evaluate(`Object.keys(window).filter(k=>/^__xf(?:Audit|TransportAudit|CompareTransport|BaseApiAudit|UserAgentAudit|PlayerAudit|HttpStatusAudit|BaseApiNetwork2|Scenario)$/.test(k))`)});}
 finally {c.close();}
}
const result={observedUTC:new Date().toISOString(),results};
fs.writeFileSync(new URL('CLEANUP_CHECK.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
