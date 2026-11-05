import fs from 'node:fs';
import {createHash} from 'node:crypto';
const dir=new URL('./',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,dir),'utf8'));
const validation=read('validation-results.json');
if(validation.results.length!==4 || validation.results.some(x=>x.exitCode!==0))throw Error('VALIDATION_NOT_COMPLETE');
const regression=read('validation-regression-result.json');
if(regression.result!=='PASS' || regression.controls.length!==204 || regression.suites.length!==42)throw Error('REGRESSION_RESULT_UNEXPECTED');
const devices=read('DEVICES_FINAL.json'),integrity=read('G3_DIVERGENCE_REVIEW.json'),cleanup=read('CLEANUP_CHECK.json');
if(cleanup.results.some(x=>x.temporaryAuditGlobals.length))throw Error('TEMPORARY_HOOK_REMAINS');
if(fs.existsSync(new URL('FIRE_UPDATE.json',dir)))throw Error('UNEXPECTED_INSTALL_RECORD');
const scopePath=new URL('INSTALL_SCOPE.md',dir),scope=fs.readFileSync(scopePath);
const prefix='STATUS=SUPERSEDED_INSTALLATION_NOT_EXECUTED\n\nPlano operacional anterior, preparado pelo executor; não é recibo de aprovação independente. Nova divergência do preflight suspendeu a instalação. Nenhum hash privado foi coletado e nenhum instalador foi executado. O helper está desabilitado. Consulte REPORT.md, seção13. O texto anterior é preservado abaixo.\n\n';
if(!scope.toString('utf8').startsWith('STATUS=SUPERSEDED'))fs.writeFileSync(scopePath,Buffer.concat([Buffer.from(prefix,'utf8'),scope]));
const result={observedUTC:new Date().toISOString(),RESULT:'DEVICE_AUDIT_COMPLETE_CORRECTIONS_BLOCKED_PREFLIGHT_AND_SOURCE',devices:devices.devices.map(({label,versionName,versionCode,apkSha256,sameAsCandidate})=>({label,versionName,versionCode,apkSha256,sameAsCandidate})),verification:{canonical:'PASS_970',c11:'PASS',typecheck:'PASS',regression:{status:regression.result,controls:regression.controls.length,suites:regression.suites.length}},g3Snapshot:{identical:integrity.identicalSnapshotFiles,changed:integrity.changed,extras:integrity.extras,gitSnapshotBytesChanged:integrity.gitSnapshotBytesChanged,moduleHashesPreserved:integrity.moduleCheck.every(x=>x.matchesG3),provenance:'UNRESOLVED'},sourceApi:'FAILURES_OBSERVED_404_OR_NO_HTTP_RESPONSE',playback:'NOT_CERTIFIED_ERRORS_OBSERVED',productPatch:false,apkInstall:false,build:false,supabaseWrite:false,existingRepositoryGitWrite:false,privateDataExport:false,creditsEngine:'FUTURE_SPEC_ONLY',nextGateStarted:false};
fs.writeFileSync(new URL('RESULT.json',dir),JSON.stringify(result,null,2));
const files={};
for(const name of fs.readdirSync(dir).sort()){
 if(name==='CLOSURE.json')continue;
 const p=new URL(name,dir),s=fs.lstatSync(p);
 if(!s.isFile()||s.isSymbolicLink())throw Error('UNEXPECTED_EVIDENCE_ENTRY');
 files[name]={sha256:createHash('sha256').update(fs.readFileSync(p)).digest('hex'),bytes:s.size};
}
fs.writeFileSync(new URL('CLOSURE.json',dir),JSON.stringify({createdUTC:new Date().toISOString(),scope:'external audit artifacts only; does not retroactively prove historical workspace preservation',files},null,2));
console.log(JSON.stringify({result:result.RESULT,evidenceFiles:Object.keys(files).length,controls:regression.controls.length,suites:regression.suites.length,installed:false}));
