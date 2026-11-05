import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='C:/Xandeflix/xandeflix-prebuilt-c11-main';
const phase=root+'/tmp/tmdb-episode-metadata-enrichment-20261027';
const candidate=phase+'/NEXT_EPISODE_G2_A22_CANDIDATE/workspace';
const audit=JSON.parse(fs.readFileSync(new URL('REPOSITORY_AUDIT.json',import.meta.url)));
const snapshot=JSON.parse(fs.readFileSync(phase+'/NEXT_EPISODE_G3_EVIDENCE/CANDIDATE_SNAPSHOT.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const differences=audit.g3.differences.map(item=>{
 const p=path.join(candidate,item.path),s=fs.lstatSync(p);
 return {...item,currentSha256:s.isFile()?sha(fs.readFileSync(p)):null,expectedSha256:snapshot.files[item.path]?.sha256??null,size:s.size,nlink:s.nlink,modifiedUTC:s.mtime.toISOString(),category:item.path.startsWith('tmp/')?'TEST_OUTPUT':item.path.includes('.gradle/')?'GRADLE_CACHE':item.path.includes('build/reports/')?'GRADLE_REPORT':'UNCLASSIFIED'};
});
const modules=['src/playback/next-episode-resolver.ts','scripts/test-next-episode-resolver.mjs','src/playback/credits-marker.ts','scripts/test-credits-marker.mjs'];
const moduleCheck=modules.map(p=>({path:p,sha256:sha(fs.readFileSync(path.join(candidate,p))),matchesG3:sha(fs.readFileSync(path.join(candidate,p)))===snapshot.files[p].sha256}));
const result={observedUTC:new Date().toISOString(),baseline:'G3 prospective snapshot; no retrospective reconstruction',identicalSnapshotFiles:audit.g3.identicalFiles,changed: differences.filter(x=>x.kind==='CHANGED').length,extras:differences.filter(x=>x.kind==='EXTRA').length,differences,moduleCheck,gitSnapshotBytesChanged:audit.g3.differences.some(x=>x.path.startsWith('.git/')),managedProductDifferences:audit.g3.differences.filter(x=>!x.path.startsWith('tmp/')&&!x.path.startsWith('node_modules/')&&!x.path.startsWith('android/.gradle/')&&!x.path.startsWith('android/build/')),attribution:'NOT_PROVEN; current audit did not run Gradle or tests in this isolated candidate',installation:'NOT_EXECUTED',productPatch:'NOT_EXECUTED'};
fs.writeFileSync(new URL('G3_DIVERGENCE_REVIEW.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({changed:result.changed,extras:result.extras,moduleCheck,gitSnapshotBytesChanged:result.gitSnapshotBytesChanged,managedProductDifferences:result.managedProductDifferences,timestamps:[...new Set(differences.map(x=>x.modifiedUTC.slice(0,10)))]}));
