import fs from 'node:fs';
import crypto from 'node:crypto';
const root='C:/Xandeflix/Audits/APK_PREVIOUS_COMPARISON_20261104';
const read=n=>JSON.parse(fs.readFileSync(`${root}/${n}`,'utf8').replace(/^\uFEFF/,''));
const a=read('v137-inventory.json'),b=read('v152-inventory.json');
const am=new Map(a.map(x=>[x.Path,x])),bm=new Map(b.map(x=>[x.Path,x]));
const same=[],changed=[],onlyOld=[],onlyNew=[];
for(const [p,x]of am){const y=bm.get(p);if(!y)onlyOld.push(p);else if(x.Sha256===y.Sha256&&x.Bytes===y.Bytes)same.push(p);else changed.push(p);}
for(const p of bm.keys())if(!am.has(p))onlyNew.push(p);
const exactPaths=['assets/capacitor.config.json','assets/capacitor.plugins.json','res/xml/network_security_config.xml','res/xml/backup_rules.xml','res/xml/data_extraction_rules.xml',...a.filter(x=>/^classes\d*\.dex$/.test(x.Path)).map(x=>x.Path)];
const result={scope:'ZIP member raw bytes, decompressed SHA-256. Matching paths only; renamed assets listed separately. No application runtime behavior inferred.',counts:{old:a.length,new:b.length,same:same.length,changed:changed.length,onlyOld:onlyOld.length,onlyNew:onlyNew.length},selected:exactPaths.map(p=>({path:p,old:am.get(p),new:bm.get(p),equal:same.includes(p)})),changed,onlyOld,onlyNew};
fs.writeFileSync(`${root}/ZIP_COMPARISON.json`,JSON.stringify(result,null,2));
const apks=[{label:'1.0.37',path:'C:/Users/Alexandre/Downloads/XANDEFLIX_RETORNO_EPISODIO_433a60d7 (1).apk'},{label:'1.0.52',path:'C:/Xandeflix/Audits/DEVICE_AUDIT_20261104/candidate-20261103.apk'}];
const identity=apks.map(x=>({...x,bytes:fs.statSync(x.path).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(x.path)).digest('hex')}));
fs.writeFileSync(`${root}/APK_IDENTITIES_FINAL.json`,JSON.stringify(identity,null,2));
console.log(JSON.stringify({counts:result.counts,selected:result.selected.map(x=>({path:x.path,equal:x.equal})),identity}));
