import fs from 'node:fs';
const [v,start,count]=process.argv.slice(2);
if(!['v137','v152'].includes(v))throw Error('invalid version');
const lines=fs.readFileSync(`C:/Xandeflix/Audits/APK_PREVIOUS_COMPARISON_20261104/${v}-main.formatted.js`,'utf8').split('\n');
console.log(lines.slice(Number(start)-1,Number(start)-1+Number(count)).map((s,i)=>`${Number(start)+i}: ${s}`).join('\n'));
