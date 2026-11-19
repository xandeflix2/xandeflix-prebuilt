import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root='C:/Xandeflix/Audits/APK_PREVIOUS_COMPARISON_20261104';
const require=createRequire('C:/Xandeflix/xandeflix-prebuilt-c11-main/package.json');
const esbuild=require('esbuild');
for(const v of ['v137','v152']) {
 const dir=path.join(root,v,'assets/public/assets');
 const f=fs.readdirSync(dir).find(n=>/^main-.+\.js$/.test(n));
 const code=fs.readFileSync(path.join(dir,f),'utf8');
 const result=esbuild.transformSync(code,{loader:'js',minify:false,legalComments:'none',target:'esnext',format:'esm'});
 fs.writeFileSync(path.join(root,`${v}-main.formatted.js`),result.code);
 console.log(JSON.stringify({v,file:f,bytes:Buffer.byteLength(code),formattedLines:result.code.split('\n').length}));
}
