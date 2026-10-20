import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {collectSnapshot,verifyCanonical,blobHash,CanonError,REFERENCE,PHASED,PHYSICAL,AUTHORIZATION,LEGACY_AUTHORIZATION,HARDENING_GATE,HARDENING_AUTHORIZATION,AUTHORIZATION_DIRECTORY,SUITES} from './verify-canonical-contract.mjs';

const root=fileURLToPath(new URL('..',import.meta.url)),dir=path.join(root,'tmp/canon-01');
fs.mkdirSync(dir,{recursive:true});const original=collectSnapshot(root);
const current=file=>original.read(file).toString('utf8');
const overlay=(entries={},extra={})=>({...original,...extra,files:[...original.files,...Object.keys(entries).filter(f=>!original.files.includes(f))],read:f=>Object.hasOwn(entries,f)?entries[f]===null?null:Buffer.from(entries[f]):original.read(f)});
const cases=[];const pass=name=>{cases.push(name);console.log('PASS '+name)};
function rejects(name,code,snapshot){assert.throws(()=>verifyCanonical(snapshot),error=>error instanceof CanonError&&error.code===code,name);pass(name)}
const editPackage=mutate=>{const pkg=JSON.parse(current('package.json'));mutate(pkg);return JSON.stringify(pkg)};
function policyChange(mutate){return current(PHASED).replace(/(<!-- CANON-01:POLICY -->\s*```json\s*)([\s\S]*?)(```)/,(_,a,b,c)=>{const p=JSON.parse(b);mutate(p);return a+JSON.stringify(p)+c})}
const registrationBlock=(gate,file,content)=>'\n<!-- CANON-01:AUTHORIZATION -->\n```json\n'+JSON.stringify({schema:1,gate,path:file,hash:blobHash(file,content)})+'\n```\n';
function additionalAuthorization(record,entries={},gate='ANDROID-38'){
 const file=AUTHORIZATION_DIRECTORY+gate+'.json',content=JSON.stringify(record);
 return{[PHASED]:current(PHASED)+registrationBlock(gate,file,content),[file]:content,[record.evidence]:'Synthetic test only. Gate '+record.gate+'.',...entries};
}
assert.equal(verifyCanonical(original).result,'PASS');pass('REAL_GIT_ANCHORED_TREE_AND_CONTRACTS');
assert.equal(verifyCanonical(overlay({'scripts/patch-read-model.mjs':current('scripts/patch-read-model.mjs').replaceAll('\r\n','\n').replaceAll('\n','\r\n')})).result,'PASS');pass('LF_CRLF_ONLY_NORMALIZATION_IS_SYMMETRIC');
rejects('MISSING_CONTRACT_BLOCKS','CANON_REQUIRED_FILE_MISSING',overlay({[PHASED]:null}));
rejects('MISSING_DEPENDENCY_BLOCKS','CANON_DEPENDENCY_MISSING',overlay({'node_modules/typescript/package.json':null}));
rejects('OLD_NODE_BLOCKS','CANON_NODE_24_REQUIRED',overlay({}, {nodeMajor:22}));
rejects('OLD_HISTORY_CANNOT_BE_REWRITTEN','CANON_HISTORY_REWRITTEN',overlay({'AGENTS.md':current('AGENTS.md').replace('NO_AUTOMATIC_COMMIT=SIM','NO_AUTOMATIC_COMMIT=NAO')}));
rejects('REMOVED_NEW_NORMATIVE_REFERENCE_BLOCKS','CANON_NORMATIVE_REFERENCE_MISSING',overlay({'AGENTS.md':current('AGENTS.md').replace('`npm run canon:check`','removed-command')}));
rejects('TIZEN_CANNOT_BECOME_AUTHORIZED','CANON_DECISION_CHANGED',overlay({[PHASED]:policyChange(p=>p.decisions.TIZEN_DEVELOPMENT_AUTHORIZED='SIM')}));
rejects('WEBOS_CANNOT_BECOME_AUTHORIZED','CANON_DECISION_CHANGED',overlay({[PHASED]:policyChange(p=>p.decisions.WEBOS_DEVELOPMENT_AUTHORIZED='SIM')}));
rejects('PILOT_CANNOT_BECOME_EXECUTED','CANON_DECISION_CHANGED',overlay({[PHASED]:policyChange(p=>p.decisions.PILOT_EXECUTED='SIM')}));
rejects('PHASE_ORDER_CANNOT_BE_SKIPPED','CANON_PHASE_ORDER_CHANGED',overlay({[PHASED]:policyChange(p=>p.phaseOrder.reverse())}));
rejects('EVIDENCE_CANNOT_BECOME_A_VERSION_CEILING','CANON_HISTORICAL_BASELINE_CHANGED',overlay({[PHASED]:policyChange(p=>p.historicalAndroid.permanentVersionCeiling=true)}));
rejects('PHYSICAL_COUNTS_CANNOT_BE_INVENTED','CANON_PHYSICAL_RECORD_INCOMPLETE',overlay({[PHYSICAL]:current(PHYSICAL).replace('TOTAL_FUNCTIONAL=20/20','TOTAL_FUNCTIONAL=19/20')}));
rejects('MISSING_C11_RUNNER_BLOCKS','CANON_REQUIRED_FILE_MISSING',overlay({'scripts/test-c11-new-device-activation-lock.mjs':null}));
rejects('ALWAYS_GREEN_SUITE_REPLACEMENT_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({'scripts/test-c11-new-device-activation.mjs':'console.log("RESULT=26_TESTS_PASSED");'}));
rejects('REMOVED_C11_NEGATIVES_BLOCK','CANON_PROTECTED_CONTENT_CHANGED',overlay({'scripts/test-c11-new-device-activation-lock.mjs':current('scripts/test-c11-new-device-activation-lock.mjs').replace('assert.throws(run); negatives++;','negatives++;')}));
rejects('PREBUILD_BYPASS_BLOCKS','CANON_C11_HOOK_WEAKENED',overlay({'package.json':editPackage(p=>p.scripts.prebuild='echo PASS')}));
rejects('PLATFORM_DEPENDENCY_ADD_BLOCKS','CANON_PACKAGE_OR_DEPENDENCIES_CHANGED',overlay({'package.json':editPackage(p=>p.dependencies['fictional-tizen-sdk']='1.0.0')}));
for(const[file,name]of [['src/device/device-identity.service.ts','IDENTITY'],['src/bootstrap/active-snapshot.ts','CATALOG'],['src/search/search-engine.ts','SEARCH'],['src/playback/playback.service.ts','PLAYBACK'],['src/security/artifact-verifier.ts','SIGNATURE'],['android/app/src/main/res/xml/backup_rules.xml','BACKUP']]){
 rejects(name+'_SILENT_MUTATION_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n/* unapproved change */\n'}));
}
rejects('MISSING_IDENTITY_FILE_BLOCKS','CANON_PROTECTED_FILE_MISSING',overlay({'src/device/device-identity.service.ts':null}));
rejects('NEW_SERVER_MIGRATION_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({'supabase/migrations/20990101000000_unapproved.sql':'select 1;'}));
rejects('DELTA_SCHEMA_SILENT_CHANGE_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({'schemas/prebuilt-catalog-delta.schema.json':current('schemas/prebuilt-catalog-delta.schema.json').replace('"additionalProperties": false','"additionalProperties": true')}));
const gradle='android/app/build.gradle',next=current(gradle).replace('versionCode 37','versionCode 38').replace('versionName "1.0.37"','versionName "1.0.38"');
rejects('VERSION_38_WITHOUT_NEW_GATE_BLOCKS','CANON_VERSION_GATE_REQUIRED',overlay({[gradle]:next}));
rejects('SILENT_PACKAGE_ID_SWAP_BLOCKS','CANON_ANDROID_PACKAGE_CHANGED',overlay({[gradle]:current(gradle).replaceAll('com.xandeflix.prebuilt','com.example.unapproved')}));
// Receipts remain separate: overlays are synthetic inputs to the real verifier.
const primary=JSON.parse(current(AUTHORIZATION)),legacy=JSON.parse(current(LEGACY_AUTHORIZATION));
assert.deepEqual(verifyCanonical(original).authorizedAmendments.slice(0,2),['CANON-01-G10FIX','CANON-01-LEGACYTESTS']);pass('INDEPENDENT_RECEIPTS_BOTH_RECOGNIZED');
const editReceipt=(file,mutate)=>{const value=JSON.parse(current(file));mutate(value);return overlay({[file]:JSON.stringify(value)})};
rejects('MISSING_G10_RECEIPT_BLOCKS','CANON_REQUIRED_FILE_MISSING',overlay({[AUTHORIZATION]:null}));
rejects('MISSING_LEGACY_RECEIPT_BLOCKS','CANON_REQUIRED_FILE_MISSING',overlay({[LEGACY_AUTHORIZATION]:null}));
rejects('CORRUPT_LEGACY_RECEIPT_BLOCKS','CANON_CHANGE_AUTHORIZATION_INVALID',overlay({[LEGACY_AUTHORIZATION]:'{'}));
rejects('ALTERED_G10_APPROVAL_BLOCKS','CANON_CHANGE_NOT_AUTHORIZED',editReceipt(AUTHORIZATION,a=>a.status='DRAFT'));
rejects('ALTERED_LEGACY_APPROVAL_BLOCKS','CANON_CHANGE_NOT_AUTHORIZED',editReceipt(LEGACY_AUTHORIZATION,a=>a.status='DRAFT'));
rejects('LEGACY_WRONG_BASELINE_BLOCKS','CANON_CHANGE_NOT_AUTHORIZED',editReceipt(LEGACY_AUTHORIZATION,a=>a.referenceCommit='0'.repeat(40)));
rejects('LEGACY_WRONG_PARENT_BLOCKS','CANON_LEGACY_AUTHORIZATION_IDENTITY',editReceipt(LEGACY_AUTHORIZATION,a=>a.parentGate='G11'));
rejects('LEGACY_CANNOT_REPLACE_G10','CANON_LEGACY_AUTHORIZATION_IDENTITY',editReceipt(LEGACY_AUTHORIZATION,a=>{a.gate=primary.gate;a.evidence=primary.evidence}));
rejects('LEGACY_REVIEW_REQUIRED','CANON_TEST_WEAKENING_REVIEW_REQUIRED',editReceipt(LEGACY_AUTHORIZATION,a=>a.testChangesReviewed=false));
rejects('LEGACY_REVIEW_MUST_BE_BOOLEAN','CANON_TEST_WEAKENING_REVIEW_REQUIRED',editReceipt(LEGACY_AUTHORIZATION,a=>a.testChangesReviewed='true'));
rejects('LEGACY_BEFORE_HASH_MISMATCH_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',editReceipt(LEGACY_AUTHORIZATION,a=>a.changes[0].before='0'.repeat(40)));
rejects('LEGACY_AFTER_HASH_MISMATCH_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',editReceipt(LEGACY_AUTHORIZATION,a=>a.changes[0].after='0'.repeat(40)));
rejects('G10_BEFORE_HASH_MISMATCH_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',editReceipt(AUTHORIZATION,a=>a.changes[0].before='0'.repeat(40)));
rejects('G10_AFTER_HASH_MISMATCH_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',editReceipt(AUTHORIZATION,a=>a.changes[0].after='0'.repeat(40)));
rejects('DUPLICATED_GRANT_ACROSS_RECEIPTS_BLOCKS','CANON_CHANGE_SCOPE_INVALID',editReceipt(AUTHORIZATION,a=>a.changes.push(legacy.changes[0])));
rejects('DUPLICATED_LEGACY_GRANT_BLOCKS','CANON_CHANGE_SCOPE_INVALID',editReceipt(LEGACY_AUTHORIZATION,a=>a.changes[1]=a.changes[0]));
rejects('LEGACY_RUNTIME_GRANT_BLOCKS','CANON_LEGACY_AUTHORIZATION_SCOPE',editReceipt(LEGACY_AUTHORIZATION,a=>a.changes[0]={...primary.changes[0]}));
rejects('LEGACY_EXTRA_FUTURE_GRANT_BLOCKS','CANON_LEGACY_AUTHORIZATION_SCOPE',editReceipt(LEGACY_AUTHORIZATION,a=>a.changes.push({...primary.changes[0]})));
rejects('LEGACY_CANNOT_REAUTHORIZE_G10_GRANT','CANON_LEGACY_AUTHORIZATION_SCOPE',editReceipt(LEGACY_AUTHORIZATION,a=>a.changes=primary.changes));
rejects('RECEIPT_GENERIC_BYPASS_FIELD_BLOCKS','CANON_AUTHORIZATION_UNKNOWN_FIELD',editReceipt(LEGACY_AUTHORIZATION,a=>a.skipIntegrity=true));
rejects('GRANT_CANNOT_INJECT_REVIEW_PERMISSION','CANON_CHANGE_SCOPE_INVALID',editReceipt(AUTHORIZATION,a=>a.changes[0].testChangesReviewed=true));
rejects('LEGACY_PERMISSION_ESCALATION_BLOCKS','CANON_LEGACY_AUTHORIZATION_RESTRICTIONS',editReceipt(LEGACY_AUTHORIZATION,a=>a.gitPushAuthorized=true));
rejects('LEGACY_UNKNOWN_APPROVAL_ORIGIN_BLOCKS','CANON_LEGACY_AUTHORIZATION_RESTRICTIONS',editReceipt(LEGACY_AUTHORIZATION,a=>a.authorizationRequestSha256='0'.repeat(64)));
rejects('LEGACY_CANNOT_REMOVE_PARENTAL_SUITE','CANON_REGRESSION_PLAN_REQUIRED',editReceipt(LEGACY_AUTHORIZATION,a=>a.requiredTests=a.requiredTests.filter(f=>!f.includes('c126'))));
rejects('LEGACY_EVIDENCE_MISSING_BLOCKS','CANON_REQUIRED_FILE_MISSING',overlay({[legacy.evidence]:null}));
rejects('LEGACY_EVIDENCE_WITHOUT_NOMINAL_GATE_BLOCKS','CANON_REVIEW_EVIDENCE_REQUIRED',overlay({[legacy.evidence]:'Unrelated evidence.'}));
rejects('G10_RECEIPT_REWORDING_BLOCKS','CANON_RECEIPT_CONTENT_CHANGED',editReceipt(AUTHORIZATION,a=>a.reason+=' Unauthorized rewording.'));
rejects('LEGACY_RECEIPT_REWORDING_BLOCKS','CANON_RECEIPT_CONTENT_CHANGED',editReceipt(LEGACY_AUTHORIZATION,a=>a.reason+=' Unauthorized rewording.'));
// Future approvals add a new receipt/registration; historical bytes remain untouched.
const approval={schema:1,gate:'ANDROID-38',status:'APPROVED_BY_CHAT_MASTER',referenceCommit:REFERENCE,reason:'Synthetic control for a future explicitly approved version evolution.',physicalImpact:'REQUIRED',requiredTests:[SUITES[0][0]],evidence:'docs/evidence/SYNTHETIC_APPROVAL.md',changes:[{path:gradle,before:original.baseline.get(gradle).hash,after:blobHash(gradle,next)}]};
const approved=additionalAuthorization(approval,{[gradle]:next});
const future=verifyCanonical(overlay(approved));assert.deepEqual(future.currentVersion,{code:38,name:'1.0.38'});assert.equal(future.historicalVersion.code,37);pass('VERSION_38_ACCEPTED_WITH_SPECIFIC_GATE_HISTORY_STAYS_37');
rejects('THIS_GATE_CANNOT_AUTHORIZE_RUNTIME','CANON_CHANGE_NOT_AUTHORIZED',overlay(additionalAuthorization({...approval,gate:'CANON-01'},{[gradle]:next})));
rejects('UNAPPROVED_CHANGE_RECORD_BLOCKS','CANON_CHANGE_NOT_AUTHORIZED',overlay(additionalAuthorization({...approval,status:'DRAFT'},{[gradle]:next})));
rejects('EMPTY_IMPACT_TEST_PLAN_BLOCKS','CANON_REGRESSION_PLAN_REQUIRED',overlay(additionalAuthorization({...approval,requiredTests:[]},{[gradle]:next})));
rejects('EXTRA_UNREVIEWED_VERSION_BYTES_BLOCK','CANON_VERSION_GATE_REQUIRED',overlay({...approved,[gradle]:next.replace('versionCode 38','versionCode 39')}));
rejects('STALE_GRADLE_APPROVAL_BLOCKS','CANON_STALE_OR_UNUSED_AUTHORIZATION',overlay({...approved,[gradle]:current(gradle)}));
const weakened='console.log("RESULT=26_TESTS_PASSED");',suite='scripts/test-c11-new-device-activation.mjs';
rejects('SUITE_CHANGE_NEEDS_SEPARATE_REVIEW','CANON_TEST_WEAKENING_REVIEW_REQUIRED',overlay(additionalAuthorization({...approval,changes:[...approval.changes,{path:suite,before:original.baseline.get(suite).hash,after:blobHash(suite,weakened)}]},{[gradle]:next,[suite]:weakened})));
const workflow='.github/workflows/canonical-regression.yml';
rejects('SHALLOW_CI_CHECKOUT_BLOCKS','CANON_CI_HISTORY_AND_SCOPE_REQUIRED',overlay({[workflow]:current(workflow).replace('fetch-depth: 0','fetch-depth: 1')}));
rejects('CI_CONTINUE_ON_ERROR_BLOCKS','CANON_CI_UNSAFE_OR_WEAKENED',overlay({[workflow]:current(workflow)+'\n    continue-on-error: true\n'}));
rejects('CI_CONDITIONAL_SKIP_BLOCKS','CANON_CI_UNSAFE_OR_WEAKENED',overlay({[workflow]:current(workflow)+'\n    if: false\n'}));
rejects('COMMENTED_CI_TEST_IS_NOT_A_STEP','CANON_CI_STEP_MISSING',overlay({[workflow]:current(workflow).replace('- run: npm run canon:test','# - run: npm run canon:test')}));
rejects('MISSING_CI_TEST_STEP_BLOCKS','CANON_CI_STEP_MISSING',overlay({[workflow]:current(workflow).replace('run: npm run canon:test','run: echo skipped')}));
const entry=path.join(root,'scripts/verify-canonical-contract.mjs');
for(const[name,args,env,expected]of [['MISSING_GIT_FAILS_CLI',[],{...process.env,PATH:''},'CANON_GIT_OR_BASELINE_UNAVAILABLE'],['SKIP_FLAG_FAILS_CLI',['--skip'],process.env,'CANON_UNSUPPORTED_ARGUMENT']]){
 const run=spawnSync(process.execPath,[entry,...args],{cwd:root,env,encoding:'utf8',timeout:30000});assert.ifError(run.error);assert.notEqual(run.status,0);assert(run.stderr.includes(expected));pass(name);
}
// Hardening additions preserve the 72 preceding named controls and all suites.
for(const file of [AUTHORIZATION,LEGACY_AUTHORIZATION])assert.deepEqual(overlay(approved).read(file),original.read(file));
assert.deepEqual(future.authorizedAmendments,['CANON-01-G10FIX','CANON-01-LEGACYTESTS',HARDENING_GATE,'ANDROID-38']);pass('FUTURE_38_PRESERVES_BOTH_HISTORICAL_RECEIPTS');
rejects('G10_IDENTITY_SWAP_TO_ANDROID_38_BLOCKS','CANON_HISTORICAL_AUTHORIZATION_IDENTITY',overlay({...approved,[AUTHORIZATION]:JSON.stringify({...primary,gate:'ANDROID-38',evidence:approval.evidence})}));
rejects('LEGACY_IDENTITY_SWAP_TO_ANDROID_38_BLOCKS','CANON_LEGACY_AUTHORIZATION_IDENTITY',overlay({...approved,[LEGACY_AUTHORIZATION]:JSON.stringify({...legacy,gate:'ANDROID-38',evidence:approval.evidence})}));
rejects('G10_IDENTITY_SWAP_TO_LEGACY_BLOCKS','CANON_HISTORICAL_AUTHORIZATION_IDENTITY',editReceipt(AUTHORIZATION,a=>{a.gate=legacy.gate;a.evidence=legacy.evidence}));
rejects('OLD_ANDROID_38_RECEIPT_REPLACEMENT_BLOCKS','CANON_HISTORICAL_AUTHORIZATION_IDENTITY',overlay({...approved,[AUTHORIZATION]:JSON.stringify(approval)}));
rejects('FUTURE_APPROVAL_CANNOT_REMOVE_G10','CANON_REQUIRED_FILE_MISSING',overlay({...approved,[AUTHORIZATION]:null}));
rejects('FUTURE_APPROVAL_CANNOT_REMOVE_LEGACY','CANON_REQUIRED_FILE_MISSING',overlay({...approved,[LEGACY_AUTHORIZATION]:null}));
rejects('UNREGISTERED_FUTURE_RECEIPT_BLOCKS','CANON_UNREGISTERED_AUTHORIZATION',overlay({...approved,[PHASED]:current(PHASED)}));
const futurePath=AUTHORIZATION_DIRECTORY+'ANDROID-38.json';
rejects('REGISTERED_RECEIPT_MISSING_BLOCKS','CANON_REQUIRED_FILE_MISSING',overlay({...approved,[futurePath]:null}));
rejects('REGISTERED_RECEIPT_HASH_MISMATCH_BLOCKS','CANON_REGISTERED_RECEIPT_CHANGED',overlay({...approved,[futurePath]:JSON.stringify({...approval,reason:approval.reason+' Changed.'})}));
rejects('DUPLICATED_FUTURE_REGISTRATION_BLOCKS','CANON_AUTHORIZATION_REGISTRY_DUPLICATE',overlay({...approved,[PHASED]:approved[PHASED]+registrationBlock('ANDROID-38',futurePath,approved[futurePath])}));
rejects('HISTORICAL_GATE_CANNOT_REGISTER_AGAIN','CANON_AUTHORIZATION_REGISTRY_DUPLICATE',overlay({[PHASED]:current(PHASED)+registrationBlock(primary.gate,AUTHORIZATION,current(AUTHORIZATION))}));
rejects('HISTORICAL_PATH_CANNOT_BE_REGISTRY_TARGET','CANON_AUTHORIZATION_REGISTRY_PATH',overlay({[PHASED]:current(PHASED)+registrationBlock('ANDROID-38',AUTHORIZATION,current(AUTHORIZATION))}));
rejects('MISSING_HARDENING_RECEIPT_BLOCKS','CANON_REQUIRED_FILE_MISSING',overlay({[HARDENING_AUTHORIZATION]:null}));
rejects('HARDENING_RECEIPT_CHANGE_WITHOUT_REGISTRATION_BLOCKS','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[HARDENING_AUTHORIZATION]:current(HARDENING_AUTHORIZATION)+'\n'}));
rejects('MISSING_HARDENING_REGISTRATION_BLOCKS','CANON_HARDENING_REGISTRATION_REQUIRED',overlay({[PHASED]:current(PHASED).replace(/<!-- CANON-01:AUTHORIZATION -->\s*```json\s*[\s\S]*?```\s*/,'')}));
for(const file of ['scripts/verify-canonical-contract.mjs','scripts/test-canonical-regression.mjs']){
 rejects('GOVERNANCE_SILENT_CHANGE_BLOCKS_'+path.basename(file),'CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n// unapproved governance change\n'}));
}
const governance='scripts/verify-canonical-contract.mjs',governanceNext=current(governance)+'\n// synthetic reviewed governance evolution\n';
const governanceApproval={...approval,gate:'GOVERNANCE-02',testChangesReviewed:true,supersedes:{[governance]:HARDENING_GATE},evidence:'docs/evidence/SYNTHETIC_GOVERNANCE_02.md',changes:[{path:governance,before:blobHash(governance,current(governance)),after:blobHash(governance,governanceNext)}]};
assert.equal(verifyCanonical(overlay(additionalAuthorization(governanceApproval,{[governance]:governanceNext},'GOVERNANCE-02'))).result,'PASS');pass('GOVERNANCE_EVOLUTION_REQUIRES_NEW_LINKED_REVIEWED_RECEIPT');
rejects('GOVERNANCE_CHAIN_CANNOT_INHERIT_TEST_REVIEW','CANON_TEST_WEAKENING_REVIEW_REQUIRED',overlay(additionalAuthorization({...governanceApproval,testChangesReviewed:false},{[governance]:governanceNext},'GOVERNANCE-02')));
rejects('GOVERNANCE_CHAIN_PREDECESSOR_REQUIRED','CANON_AUTHORIZATION_CHAIN_INVALID',overlay(additionalAuthorization({...governanceApproval,supersedes:{}},{[governance]:governanceNext},'GOVERNANCE-02')));
rejects('GOVERNANCE_CHAIN_BEFORE_HASH_MUST_MATCH','CANON_AUTHORIZATION_CHAIN_INVALID',overlay(additionalAuthorization({...governanceApproval,changes:[{...governanceApproval.changes[0],before:'0'.repeat(40)}]},{[governance]:governanceNext},'GOVERNANCE-02')));
rejects('FUTURE_CANNOT_BORROW_HISTORICAL_GRANTS','CANON_AUTHORIZATION_CHAIN_INVALID',overlay(additionalAuthorization({...approval,changes:[...primary.changes,...approval.changes]},{[gradle]:next})));
const results=[];
const suites=[...SUITES,['scripts/test-g10-delta-extensions-regression.mjs','G10_DELTA_EXTENSIONS_REGRESSION=PASS']];
for(const[file,marker]of suites){
 const run=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
 fs.writeFileSync(path.join(dir,path.basename(file)+'.log'),(run.stdout||'')+(run.stderr||''));
 if(run.error||run.signal||run.status!==0||!run.stdout?.includes(marker)){
  fs.writeFileSync(path.join(dir,'regression-result.json'),JSON.stringify({result:'FAIL',controls:cases,suites:results,failedSuite:file,exitCode:run.status,signal:run.signal,remainingSuites:suites.slice(results.length+1).map(x=>({file:x[0],result:'NOT_RUN'})),physicalTestPerformed:false,remoteWrites:0},null,2));console.error('REGRESSION_LOCK=FAIL '+file);
 }
 assert.ifError(run.error);assert.equal(run.signal,null,'SUITE_TIMEOUT '+file);assert.equal(run.status,0,'SUITE_FAILED '+file);assert(run.stdout.includes(marker),'SUITE_MARKER_MISSING '+file);results.push({file,result:'PASS'});console.log('SUITE_PASS '+file);
}
const result={result:'PASS',negativeAndEvolutionControls:cases.length-1,controls:cases,suites:results,physicalTestPerformed:false,remoteWrites:0};
fs.writeFileSync(path.join(dir,'regression-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({result:'PASS',controls:cases.length,suites:results.length}));console.log('CANON_REGRESSION_TESTS=PASS\nREGRESSION_LOCK=PASS');
