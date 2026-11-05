import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Xandeflix/Audits/APK_PREVIOUS_COMPARISON_20261104';
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('LINK_REJECTED');if(e.isDirectory())walk(p);else if(e.isFile()){if(p===path.join(root,'CLOSURE.json'))continue;const b=fs.readFileSync(p);files.push({path:path.relative(root,p).replaceAll('\\','/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}else throw Error('SPECIAL_FILE_REJECTED');}}
walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
const result={observedUTC:new Date().toISOString(),scope:'Files of this external audit folder only. Prospective closure; not a retrospective snapshot or product canonical approval.',files};
fs.writeFileSync(path.join(root,'CLOSURE.json'),JSON.stringify(result,null,2));
let checked=0;for(const f of files){const b=fs.readFileSync(path.join(root,f.path));if(b.length!==f.bytes||crypto.createHash('sha256').update(b).digest('hex')!==f.sha256)throw Error('CLOSURE_MISMATCH');checked++;}
console.log(JSON.stringify({closureFiles:files.length,verified:checked,report:fs.existsSync(path.join(root,'REPORT.md')),result:JSON.parse(fs.readFileSync(path.join(root,'RESULT.json'),'utf8')).result}));
