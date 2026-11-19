import fs from 'node:fs';
import vm from 'node:vm';
const file=new URL('check-tablet-source-binding.mjs',import.meta.url);
const s=fs.readFileSync(file,'utf8').match(/String\.raw`([\s\S]*?)`/)[1];
try{new vm.Script(s,{filename:'local-audit-expression.js'});console.log('PARSE_PASS')}catch(e){console.log(e.stack.split('\n').slice(0,6).join('\n'));}
