import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {collectSnapshot,verifyCanonical,verifySiteBuildWorkflow,blobHash,CanonError,REFERENCE,PHASED,PHYSICAL,AUTHORIZATION,LEGACY_AUTHORIZATION,HARDENING_GATE,HARDENING_AUTHORIZATION,AUTHORIZATION_DIRECTORY,SUITES,SITE_BUILD_GATE,SITE_BUILD_AUTHORIZATION,SITE_BUILD_WORKFLOW,SITE_BUILD_TEST,A2_ARTIFACT_GATE,A2_ARTIFACT_AUTHORIZATION,A2_ARTIFACT_SCRIPT,A2_ARTIFACT_TEST,PREBUILT_AUTHORIZATION} from './verify-canonical-contract.mjs';

import {PREBUILT_GATE,PREBUILT_WORKFLOW,PREBUILT_SCRIPT,PREBUILT_TEST} from './vercel-prebuilt-contract.mjs';

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
const gradle='android/app/build.gradle',next=current(gradle).replace(/\bversionCode\s+\d+\b/,'versionCode 38').replace(/\bversionName\s+"[^"]+"/,'versionName "1.0.38"');
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
const versionPredecessor=Array.from(current(PHASED).matchAll(/<!-- CANON-01:AUTHORIZATION -->\s*```json\s*([\s\S]*?)```/g),m=>JSON.parse(current(JSON.parse(m[1]).path))).reverse().find(record=>record.changes.some(item=>item.path===gradle));
const versionBefore=versionPredecessor?versionPredecessor.changes.find(item=>item.path===gradle).after:original.baseline.get(gradle).hash;
const approval={schema:1,gate:'ANDROID-38',status:'APPROVED_BY_CHAT_MASTER',referenceCommit:REFERENCE,reason:'Synthetic control for a future explicitly approved version evolution.',physicalImpact:'REQUIRED',requiredTests:[SUITES[0][0]],evidence:'docs/evidence/SYNTHETIC_APPROVAL.md',supersedes:versionPredecessor?{[gradle]:versionPredecessor.gate}:{},changes:[{path:gradle,before:versionBefore,after:blobHash(gradle,next)}]};
const approved=additionalAuthorization(approval,{[gradle]:next});
const future=verifyCanonical(overlay(approved));assert.deepEqual(future.currentVersion,{code:38,name:'1.0.38'});assert.equal(future.historicalVersion.code,37);pass('VERSION_38_ACCEPTED_WITH_SPECIFIC_GATE_HISTORY_STAYS_37');
rejects('THIS_GATE_CANNOT_AUTHORIZE_RUNTIME','CANON_CHANGE_NOT_AUTHORIZED',overlay(additionalAuthorization({...approval,gate:'CANON-01'},{[gradle]:next})));
rejects('UNAPPROVED_CHANGE_RECORD_BLOCKS','CANON_CHANGE_NOT_AUTHORIZED',overlay(additionalAuthorization({...approval,status:'DRAFT'},{[gradle]:next})));
rejects('EMPTY_IMPACT_TEST_PLAN_BLOCKS','CANON_REGRESSION_PLAN_REQUIRED',overlay(additionalAuthorization({...approval,requiredTests:[]},{[gradle]:next})));
rejects('EXTRA_UNREVIEWED_VERSION_BYTES_BLOCK','CANON_VERSION_GATE_REQUIRED',overlay({...approved,[gradle]:next.replace('versionCode 38','versionCode 39')}));
rejects('STALE_GRADLE_APPROVAL_BLOCKS','CANON_STALE_OR_UNUSED_AUTHORIZATION',overlay({...approved,[gradle]:original.baselineText.get(gradle)}));
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
assert.deepEqual(future.authorizedAmendments,['CANON-01-G10FIX','CANON-01-LEGACYTESTS',HARDENING_GATE,SITE_BUILD_GATE,A2_ARTIFACT_GATE,PREBUILT_GATE,'CANON-01-A22A-CI-DIAG','CANON-01-A22A-WINDOWS-EOL','CANON-01-SOURCE-OUTPUT','CANON-01-CATALOG-READ-DIAG','CANON-01-XUI-OPAQUE-RECOVERY','CANON-01-CATALOG-PHYSICAL-FIXES','CANON-01-SERIES-POSTER-COMPOSITION','CANON-01-TMDB-CONTEXT-IDENTITY','CANON-01-TMDB-SUBTITLE-PREVIEW','CANON-01-CATALOG-RETENTION','CANON-01-DETAIL-BACKDROP-UI','CANON-01-DETAIL-BACKDROP-TYPES','CANON-01-TV-SIDEBAR-COMPOSITION','CANON-01-A22A-WINDOWS-METADATA-EOL','CANON-01-VERCEL-PREBUILT-RECOVERY-01','CANON-01-OPAQUE-HLS-MIME-RECOVERY','CANON-01-STREAMED-VOD-INVENTORY-RECOVERY','CANON-01-TABLET-SIDEBAR-TRANSPARENCY','CANON-01-HERO-PLATFORM-COMPOSITION','CANON-01-HERO-PLATFORM-ALIGNMENT','CANON-01-LIVE-SINGLE-TRANSPORT','CANON-01-NETWORK-DIAGNOSTICS','CANON-01-NETWORK-UI-POLISH','CANON-01-LIVE-NETWORK-ACTIONS','CANON-01-TV-CAST-SENDER-HIDDEN','CANON-01-TMDB-RELEASE-TAGS','CANON-01-VOD-DPAD-HIDDEN-CONTROLS','CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01','CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02','CANON-01-DPAD-CARD-SCOPE-SEEALL-GRID-01','CANON-01-XANDEFLIX-UI-PERFORMANCE-RECOVERY-03','CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07','CANON-01-XANDEFLIX-INTRO-VIDEO-ONLY-07-R1','CANON-01-MOBILE-CATALOG-HEADER-SPACING','CANON-01-PHONE-HEADER-REFINEMENT','CANON-01-SERIES-EPISODE-RETURN','CANON-01-TRAILER-CONTAINMENT-R4','CANON-01-TMDB-EPISODE-METADATA-ENRICHMENT','CANON-01-P250-V139-CANONICAL-RECOVERY','CANON-01-TMDB-EPISODE-RUNTIME-RECOVERY','CANON-01-EPISODE-ROW-ALIGNMENT','CANON-01-EPISODE-GENERAL-IDENTITY','CANON-01-DETAIL-HERO-REFINEMENT','CANON-01-ACTOR-PROFILE','CANON-01-IDENTITY-HERO-RECOVERY','CANON-01-TABLET-HERO-SPACING','CANON-01-MOBILE-HEADER-ALIGNMENT','CANON-01-MOBILE-DETAIL-HEADER-ALIGNMENT','CANON-01-CARD-TRAILER-AUDIO','CANON-01-NEXT-EPISODE-G2-R2','CANON-01-NEXT-EPISODE-G2-R4-REGRESSION-RECOVERY','CANON-01-NEXT-EPISODE-G3-MARKERS','CANON-01-NEXT-EPISODE-G3-REGRESSION-EXPECTATION','CANON-01-PERF-PARENTAL-HERO-REFINEMENT','CANON-01-SOURCE-SWITCH-ISOLATION','CANON-01-SOURCE-SWITCH-ISOLATION-CACHE-REVIEW','TABLET-CATALOG-HERO-BACK-01','SEARCH-RETURN-01','LIVE-AUTO-RECOVERY-01','LIVE-AUTO-RECOVERY-01-VALIDATION','HERO-TRENDS-TODAY-01','HERO-TRENDS-TODAY-01-CACHE','HERO-TRENDS-TODAY-01-R1','TABLET-PIP-LIVE-01','TABLET-PIP-LIVE-01-VALIDATION','TABLET-PIP-LIVE-01-CONTINUOUS','ANDROID-38']);pass('FUTURE_38_PRESERVES_BOTH_HISTORICAL_RECEIPTS');
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
const governanceApproval={...approval,gate:'GOVERNANCE-02',testChangesReviewed:true,supersedes:{[governance]:PREBUILT_GATE},evidence:'docs/evidence/SYNTHETIC_GOVERNANCE_02.md',changes:[{path:governance,before:blobHash(governance,current(governance)),after:blobHash(governance,governanceNext)}]};
assert.equal(verifyCanonical(overlay(additionalAuthorization(governanceApproval,{[governance]:governanceNext},'GOVERNANCE-02'))).result,'PASS');pass('GOVERNANCE_EVOLUTION_REQUIRES_NEW_LINKED_REVIEWED_RECEIPT');
rejects('GOVERNANCE_CHAIN_CANNOT_INHERIT_TEST_REVIEW','CANON_TEST_WEAKENING_REVIEW_REQUIRED',overlay(additionalAuthorization({...governanceApproval,testChangesReviewed:false},{[governance]:governanceNext},'GOVERNANCE-02')));
rejects('GOVERNANCE_CHAIN_PREDECESSOR_REQUIRED','CANON_AUTHORIZATION_CHAIN_INVALID',overlay(additionalAuthorization({...governanceApproval,supersedes:{}},{[governance]:governanceNext},'GOVERNANCE-02')));
rejects('GOVERNANCE_CHAIN_BEFORE_HASH_MUST_MATCH','CANON_AUTHORIZATION_CHAIN_INVALID',overlay(additionalAuthorization({...governanceApproval,changes:[{...governanceApproval.changes[0],before:'0'.repeat(40)}]},{[governance]:governanceNext},'GOVERNANCE-02')));
rejects('FUTURE_CANNOT_BORROW_HISTORICAL_GRANTS','CANON_AUTHORIZATION_CHAIN_INVALID',overlay(additionalAuthorization({...approval,changes:[...primary.changes,...approval.changes]},{[gradle]:next})));
// A1 keeps every previous control and adds validation-only workflow protection.
assert.equal(cases.length,95,'PREVIOUS_95_CONTROLS_MUST_RUN');
for(const file of [SITE_BUILD_WORKFLOW,SITE_BUILD_TEST]){
 rejects('SITE_BUILD_REQUIRED_'+path.basename(file),'CANON_REQUIRED_FILE_MISSING',overlay({[file]:null}));
 rejects('SITE_BUILD_SILENT_CHANGE_'+path.basename(file),'CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n// unapproved change\n'}));
}
rejects('SITE_BUILD_RECEIPT_MISSING_BLOCKS','CANON_REQUIRED_FILE_MISSING',overlay({[SITE_BUILD_AUTHORIZATION]:null}));
rejects('SITE_BUILD_RECEIPT_UNREGISTERED_CHANGE_BLOCKS','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[SITE_BUILD_AUTHORIZATION]:current(SITE_BUILD_AUTHORIZATION)+'\n'}));
for(const[name,from,to]of [
 ['CHECK_REQUIRED','      - run: npm run canon:check\n',''],
 ['REGRESSION_REQUIRED','      - run: npm run canon:test\n',''],
 ['FULL_HISTORY_REQUIRED','fetch-depth: 0','fetch-depth: 1'],
 ['NO_SECRETS','contents: read','contents: read\n    env: ${{ secrets.FIXTURE_SECRET }}'],
 ['NO_DEPLOY','npm run site:build','vercel deploy --prebuilt'],
 ['SITE_BUILD_REQUIRED','      - run: npm run site:build\n',''],
]){
 const changed=current(SITE_BUILD_WORKFLOW).replaceAll('\r\n','\n').replace(from,to);
 assert.notEqual(changed,current(SITE_BUILD_WORKFLOW).replaceAll('\r\n','\n'));
 assert.throws(()=>verifySiteBuildWorkflow(changed),error=>error instanceof CanonError&&error.code==='CANON_SITE_BUILD_WORKFLOW_INVALID');pass('SITE_BUILD_'+name);
}
// Even a matching synthetic grant cannot turn the validation workflow into deploy.
const deploymentWorkflow=current(SITE_BUILD_WORKFLOW).replace('npm run site:build','vercel deploy --prebuilt');
const deploymentApproval={...approval,gate:'SITE-WORKFLOW-NEGATIVE',testChangesReviewed:true,supersedes:{[SITE_BUILD_WORKFLOW]:SITE_BUILD_GATE},changes:[{path:SITE_BUILD_WORKFLOW,before:blobHash(SITE_BUILD_WORKFLOW,current(SITE_BUILD_WORKFLOW)),after:blobHash(SITE_BUILD_WORKFLOW,deploymentWorkflow)}]};
rejects('SITE_BUILD_HASH_GRANT_CANNOT_AUTHORIZE_DEPLOY','CANON_SITE_BUILD_WORKFLOW_INVALID',overlay(additionalAuthorization(deploymentApproval,{[SITE_BUILD_WORKFLOW]:deploymentWorkflow},deploymentApproval.gate)));
// A2.1 preserves all previous A1 controls prior to new named regressions.
assert.equal(cases.length,108,'PREVIOUS_108_CONTROLS_MUST_RUN');
for(const file of [A2_ARTIFACT_SCRIPT,A2_ARTIFACT_TEST]){
 rejects('A2_REQUIRED_'+path.basename(file),'CANON_REQUIRED_FILE_MISSING',overlay({[file]:null}));
 rejects('A2_SILENT_MUTATION_'+path.basename(file),'CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n// unauthorized\n'}));
}
rejects('A2_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[A2_ARTIFACT_AUTHORIZATION]:null}));
rejects('A2_RECEIPT_MUTATION','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[A2_ARTIFACT_AUTHORIZATION]:current(A2_ARTIFACT_AUTHORIZATION)+'\n'}));
rejects('A2_REGISTRATION_REQUIRED','CANON_A2_AUTHORIZATION_REQUIRED',overlay({[PHASED]:current(PHASED).replace(/<!-- CANON-01:AUTHORIZATION -->\s*```json\s*\{\s*"schema": 1,\s*"gate": "CANON-01-VERCEL-A2-ARTIFACT"[\s\S]*?```\s*/,'')}));
// A2.2A preserves all 115 preceding controls and the 13 previous suites.
assert.equal(cases.length,115,'PREVIOUS_115_CONTROLS_MUST_RUN');
for(const file of [PREBUILT_WORKFLOW,PREBUILT_SCRIPT,PREBUILT_TEST]){
 rejects('A22_REQUIRED_'+path.basename(file),'CANON_REQUIRED_FILE_MISSING',overlay({[file]:null}));
 rejects('A22_SILENT_MUTATION_'+path.basename(file),'CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n// unauthorized\n'}));
}
rejects('A22_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[PREBUILT_AUTHORIZATION]:null}));
rejects('A22_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[PREBUILT_AUTHORIZATION]:current(PREBUILT_AUTHORIZATION)+'\n'}));
rejects('A22_REGISTRATION_REQUIRED','CANON_A22_AUTHORIZATION_REQUIRED',overlay({[PHASED]:current(PHASED).replace(/<!-- CANON-01:AUTHORIZATION -->\s*```json\s*\{\s*"schema": 1,\s*"gate": "CANON-01-VERCEL-A22A"[\s\S]*?```\s*/,'')}));
const unsafePrebuilt=current(PREBUILT_WORKFLOW).replace('node scripts/vercel-prebuilt-contract.mjs build','vercel deploy --prebuilt');
const unsafeApproval={...approval,gate:'A22-NEGATIVE',testChangesReviewed:true,supersedes:{[PREBUILT_WORKFLOW]:PREBUILT_GATE},changes:[{path:PREBUILT_WORKFLOW,before:blobHash(PREBUILT_WORKFLOW,current(PREBUILT_WORKFLOW)),after:blobHash(PREBUILT_WORKFLOW,unsafePrebuilt)}]};
rejects('A22_HASH_GRANT_CANNOT_AUTHORIZE_DEPLOY','CANON_A22_WORKFLOW_INVALID',overlay(additionalAuthorization(unsafeApproval,{[PREBUILT_WORKFLOW]:unsafePrebuilt},unsafeApproval.gate)));
// CANON-01 diagnostic grant is immutable; keep the preceding 125 controls.
assert.equal(cases.length,125,'PREVIOUS_125_CONTROLS_MUST_RUN');
const ciDiagnosticReceipt='docs/governance/authorizations/CANON-01-A22A-CI-DIAG.json';
rejects('CI_DIAG_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[ciDiagnosticReceipt]:null}));
rejects('CI_DIAG_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[ciDiagnosticReceipt]:current(ciDiagnosticReceipt)+'\n'}));
rejects('CI_DIAG_RUNNER_SILENT_CHANGE','CANON_PROTECTED_CONTENT_CHANGED',overlay({'scripts/test-canonical-regression.mjs':current('scripts/test-canonical-regression.mjs')+'\n// unapproved logging change\n'}));
// L1 adds receipt-specific protection after every preceding named control.
assert.equal(cases.length,128,'PREVIOUS_128_CONTROLS_MUST_RUN');
const recoveryGate='CANON-01-VERCEL-PREBUILT-RECOVERY-01';
const recoveryReceipt=AUTHORIZATION_DIRECTORY+recoveryGate+'.json';
function recoveryReceiptChange(mutate){
 const record=JSON.parse(current(recoveryReceipt));mutate(record);const content=JSON.stringify(record);
 const contract=current(PHASED).replace(/(<!-- CANON-01:AUTHORIZATION -->\s*```json\s*)([\s\S]*?)(```)/g,(full,start,body,end)=>{
  const entry=JSON.parse(body);return entry.gate===recoveryGate?start+JSON.stringify({...entry,hash:blobHash(recoveryReceipt,content)})+'\n'+end:full;
 });
 return overlay({[PHASED]:contract,[recoveryReceipt]:content});
}
rejects('RECOVERY_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[recoveryReceipt]:null}));
rejects('RECOVERY_RECEIPT_UNREGISTERED_CHANGE_BLOCKS','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[recoveryReceipt]:current(recoveryReceipt)+'\n'}));
rejects('RECOVERY_RECEIPT_IDENTITY_SWAP_BLOCKS','CANON_ADDITIONAL_AUTHORIZATION_IDENTITY',recoveryReceiptChange(a=>a.gate='ANDROID-38'));
rejects('RECOVERY_PREDECESSOR_REQUIRED','CANON_AUTHORIZATION_CHAIN_INVALID',recoveryReceiptChange(a=>delete a.supersedes[PREBUILT_SCRIPT]));
rejects('RECOVERY_BEFORE_HASH_REQUIRED','CANON_AUTHORIZATION_CHAIN_INVALID',recoveryReceiptChange(a=>a.changes.find(c=>c.path===PREBUILT_SCRIPT).before='0'.repeat(40)));
rejects('RECOVERY_TEST_REVIEW_CANNOT_BE_INHERITED','CANON_TEST_WEAKENING_REVIEW_REQUIRED',recoveryReceiptChange(a=>a.testChangesReviewed=false));
rejects('RECOVERY_POLICY_SILENT_CHANGE_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({[PREBUILT_SCRIPT]:current(PREBUILT_SCRIPT).replace("ref:'refs/heads/fix/source-output-format-recovery'","ref:'refs/heads/governance/canon-01-hardening'")}));
// Preserve every preceding L1 control and add protection for this isolated recovery.
assert.equal(cases.length,135,'PREVIOUS_135_CONTROLS_MUST_RUN');
const opaqueHlsReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-OPAQUE-HLS-MIME-RECOVERY.json';
rejects('OPAQUE_HLS_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[opaqueHlsReceipt]:null}));
rejects('OPAQUE_HLS_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[opaqueHlsReceipt]:current(opaqueHlsReceipt)+'\n'}));
for(const file of ['android/app/src/main/java/com/xandeflix/prebuilt/player/NativeStreamRequest.java','android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java','android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java']){
 rejects('OPAQUE_HLS_NATIVE_TAMPER_'+file.split('/').at(-1),'CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n// unapproved native mutation\n'}));
}
// Preserve every preceding control and protect the streaming exception.
assert.equal(cases.length,140,'PREVIOUS_140_CONTROLS_MUST_RUN');
const streamedVodReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-STREAMED-VOD-INVENTORY-RECOVERY.json';
rejects('STREAMED_VOD_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[streamedVodReceipt]:null}));
rejects('STREAMED_VOD_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[streamedVodReceipt]:current(streamedVodReceipt)+'\n'}));
for(const file of ["src/source/source-streamed-vod-inventory.ts","src/source/real-source-importer.service.ts","scripts/test-streamed-vod-inventory.mjs","src/ui/pages/ActivationPage.tsx","src/ui/pages/ActivationPage.css"]){
 rejects('STREAMED_VOD_UNAPPROVED_CONTENT_'+file.split('/').at(-1),'CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n// unapproved streaming mutation\n'}));
}
// Preserve all preceding controls and protect the single-transport amendment.
assert.equal(cases.length,147,'PREVIOUS_147_CONTROLS_MUST_RUN');
const singleTransportReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-LIVE-SINGLE-TRANSPORT.json';
rejects('SINGLE_TRANSPORT_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[singleTransportReceipt]:null}));
rejects('SINGLE_TRANSPORT_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[singleTransportReceipt]:current(singleTransportReceipt)+'\n'}));
for(const file of ["android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java","android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java","scripts/test-live-single-transport.mjs"]){
 rejects('SINGLE_TRANSPORT_SILENT_TAMPER_'+file.split('/').at(-1),'CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n// unapproved transport mutation\n'}));
}
// Network diagnostics preserves every preceding control and adds protection.
assert.equal(cases.length,152,'PREVIOUS_152_CONTROLS_MUST_RUN');
const networkReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-NETWORK-DIAGNOSTICS.json';
rejects('NETWORK_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[networkReceipt]:null}));
rejects('NETWORK_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[networkReceipt]:current(networkReceipt)+'\n'}));
for(const file of ["src/network/diagnostic-policy.ts","src/network/network-status.ts","src/network/source-connections.ts","src/ui/components/ConnectionIndicator.tsx","src/ui/components/NetworkSettings.tsx","src/ui/components/NetworkDiagnostics.css","src/ui/pages/SettingsPage.tsx","src/ui/pages/LiveTvPage.tsx","src/ui/pages/LiveTvPage.css","android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java","android/app/src/main/java/com/xandeflix/prebuilt/network/NetworkStatusPlugin.java","scripts/test-network-diagnostics.mjs","android/app/src/test/java/com/xandeflix/prebuilt/network/NetworkStatusPluginTest.java","scripts/test-canonical-regression.mjs"]){
 rejects('NETWORK_UNAPPROVED_CONTENT_'+file,'CANON_PROTECTED_CONTENT_CHANGED',overlay({[file]:current(file)+'\n// unapproved diagnostics mutation\n'}));
}
// Visual amendment retains every preceding control and all suites.
assert.equal(cases.length,168,'PREVIOUS_168_CONTROLS_MUST_RUN');
const networkUiReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-NETWORK-UI-POLISH.json';
rejects('NETWORK_UI_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[networkUiReceipt]:null}));
rejects('NETWORK_UI_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[networkUiReceipt]:current(networkUiReceipt)+'\n'}));
// Live network actions retain all earlier cases and add receipt/new-module guards.
assert.equal(cases.length,170,'PREVIOUS_170_CONTROLS_MUST_RUN');
const liveNetworkReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-LIVE-NETWORK-ACTIONS.json';
rejects('LIVE_NETWORK_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[liveNetworkReceipt]:null}));
rejects('LIVE_NETWORK_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[liveNetworkReceipt]:current(liveNetworkReceipt)+'\n'}));
rejects('LIVE_NETWORK_BUTTON_SILENT_MUTATION','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/ui/components/NetworkConnectionButton.tsx':current('src/ui/components/NetworkConnectionButton.tsx')+'\n// unapproved modal change\n'}));
// TV Cast sender visibility keeps the existing 173 controls and all suites.
assert.equal(cases.length,173,'PREVIOUS_173_CONTROLS_MUST_RUN');
const tvCastReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-TV-CAST-SENDER-HIDDEN.json';
rejects('TV_CAST_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[tvCastReceipt]:null}));
rejects('TV_CAST_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[tvCastReceipt]:current(tvCastReceipt)+'\n'}));
rejects('TV_CAST_LIVE_SILENT_CHANGE','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/ui/pages/LiveTvPage.tsx':current('src/ui/pages/LiveTvPage.tsx')+'\n// unapproved sender UI mutation\n'}));
// Release-label metadata recovery preserves all 176 earlier controls.
assert.equal(cases.length,176,'PREVIOUS_176_CONTROLS_MUST_RUN');
const releaseTagsReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-TMDB-RELEASE-TAGS.json';
rejects('RELEASE_TAGS_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[releaseTagsReceipt]:null}));
rejects('RELEASE_TAGS_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[releaseTagsReceipt]:current(releaseTagsReceipt)+'\n'}));
rejects('RELEASE_TAGS_UNAPPROVED_NORMALIZER','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/artwork/tmdb-metadata.service.ts':current('src/artwork/tmdb-metadata.service.ts')+'\n// unapproved normalization change\n'}));
// Hidden VOD shortcuts preserve every preceding control and visible-navigation suite.
assert.equal(cases.length,179,'PREVIOUS_179_CONTROLS_MUST_RUN');
const vodDpadReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-VOD-DPAD-HIDDEN-CONTROLS.json';
rejects('VOD_DPAD_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[vodDpadReceipt]:null}));
rejects('VOD_DPAD_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[vodDpadReceipt]:current(vodDpadReceipt)+'\n'}));
rejects('VOD_DPAD_CONTROLLER_UNAPPROVED','CANON_PROTECTED_CONTENT_CHANGED',overlay({'android/app/src/main/java/com/xandeflix/prebuilt/player/VodDpadController.java':current('android/app/src/main/java/com/xandeflix/prebuilt/player/VodDpadController.java')+'\n// unapproved hidden shortcut change\n'}));
// Expanded-card previews preserve every previous case and suite.
assert.equal(cases.length,182,'PREVIOUS_182_CONTROLS_MUST_RUN');
const expandedReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01.json';
rejects('EXPANDED_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[expandedReceipt]:null}));
rejects('EXPANDED_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[expandedReceipt]:current(expandedReceipt)+'\n'}));
rejects('EXPANDED_SESSION_UNAPPROVED','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/ui/card-preview-session.ts':current('src/ui/card-preview-session.ts')+'\n// unapproved preview mutation\n'}));
// Preserve every preceding control and suite.
assert.equal(cases.length,185,'PREVIOUS_185_CONTROLS_MUST_RUN');
const homeCarouselReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02.json';
rejects('HOME_CAROUSEL_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[homeCarouselReceipt]:null}));
rejects('HOME_CAROUSEL_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[homeCarouselReceipt]:current(homeCarouselReceipt)+'\n'}));
rejects('HOME_PAGINATION_UNAPPROVED','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/ui/rail-pagination.ts':current('src/ui/rail-pagination.ts')+'\n// silent mutation\n'}));
// Scope/grid amendment preserves every preceding control and all31 suites.
assert.equal(cases.length,188,'PREVIOUS_188_CONTROLS_MUST_RUN');
const cardScopeReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-DPAD-CARD-SCOPE-SEEALL-GRID-01.json';
rejects('CARD_SCOPE_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[cardScopeReceipt]:null}));
rejects('CARD_SCOPE_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[cardScopeReceipt]:current(cardScopeReceipt)+'\n'}));
rejects('CARD_SCOPE_UNAPPROVED_CONTROLLER','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/ui/expanded-card-controller.ts':current('src/ui/expanded-card-controller.ts')+'\n// unauthorized scope\n'}));
rejects('SEEALL_UNAPPROVED_GRID','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/ui/components/VirtualCatalogGrid.tsx':current('src/ui/components/VirtualCatalogGrid.tsx')+'\n// unauthorized grid\n'}));
assert.equal(cases.length,192,'PREVIOUS_192_CONTROLS_MUST_RUN');
const uiRecoveryReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-XANDEFLIX-UI-PERFORMANCE-RECOVERY-03.json';
rejects('UI_RECOVERY_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[uiRecoveryReceipt]:null}));
rejects('UI_RECOVERY_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[uiRecoveryReceipt]:current(uiRecoveryReceipt)+'\n'}));
rejects('UI_RECOVERY_SILENT_REPEAT_CHANGE','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/ui/dpad-repeat.ts':current('src/ui/dpad-repeat.ts')+'\n// unauthorized change\n'}));
rejects('UI_RECOVERY_SILENT_SEARCH_CHANGE','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/ui/search-dpad-navigation.ts':current('src/ui/search-dpad-navigation.ts')+'\n// unauthorized change\n'}));
assert.equal(cases.length,196,'PREVIOUS_196_CONTROLS_MUST_RUN');
const introReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07.json';
rejects('INTRO_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[introReceipt]:null}));
rejects('INTRO_RECEIPT_IMMUTABLE','CANON_REGISTERED_RECEIPT_CHANGED',overlay({[introReceipt]:current(introReceipt)+'\n'}));
rejects('INTRO_NATIVE_SILENT_MUTATION','CANON_PROTECTED_CONTENT_CHANGED',overlay({'android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroController.java':current('android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroController.java')+'\n// unauthorized change\n'}));
const corruptedIntro=Buffer.from(original.read('android/app/src/main/res/raw/intro_horizontal.mp4'));corruptedIntro[0]^=1;
rejects('INTRO_LOCAL_VIDEO_TAMPER_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({'android/app/src/main/res/raw/intro_horizontal.mp4':corruptedIntro}));
rejects('INTRO_BOOT_GATE_BYPASS_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({'src/intro-main.ts':current('src/intro-main.ts').replace('waitForAppIntro()','Promise.resolve()')}));
assert.equal(cases.length,201,'PREVIOUS_201_CONTROLS_MUST_RUN');
const videoOnlyReceipt=AUTHORIZATION_DIRECTORY+'CANON-01-XANDEFLIX-INTRO-VIDEO-ONLY-07-R1.json';
rejects('VIDEO_ONLY_RECEIPT_REQUIRED','CANON_REQUIRED_FILE_MISSING',overlay({[videoOnlyReceipt]:null}));
rejects('VIDEO_ONLY_LAYOUT_TAMPER_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({'android/app/src/main/res/layout/app_intro.xml':current('android/app/src/main/res/layout/app_intro.xml').replace('</FrameLayout>','<Button android:id="@+id/intro_skip" /></FrameLayout>')}));
rejects('VIDEO_ONLY_LAUNCH_RESOURCE_TAMPER_BLOCKS','CANON_PROTECTED_CONTENT_CHANGED',overlay({'android/app/src/main/res/drawable/intro_launch_blank.xml':current('android/app/src/main/res/drawable/intro_launch_blank.xml').replace('#00000000','#FFFFFFFF')}));
const results=[];
const suites=[...SUITES,['scripts/test-g10-delta-extensions-regression.mjs','G10_DELTA_EXTENSIONS_REGRESSION=PASS'],[SITE_BUILD_TEST,'SITE_BUILD_CONTRACT=PASS'],[A2_ARTIFACT_TEST,'A2_ARTIFACT_CONTRACT=PASS'],[PREBUILT_TEST,'A22_PREBUILT_CONTRACT=PASS'],['scripts/test-c105-directory-import.mjs','SOURCE_OUTPUT_FORMAT_REGRESSION=PASS'],['scripts/test-catalog-read-diagnostic.mjs','CATALOG_READ_DIAGNOSTIC=PASS'],['scripts/test-xui-m3u-kind-recovery.mjs','XUI_M3U_RECOVERY=PASS'],['scripts/test-catalog-physical-regressions.mjs','CATALOG_PHYSICAL_REGRESSIONS=PASS'],['scripts/test-series-poster-composition.mjs','SERIES_POSTER_COMPOSITION=PASS'],['scripts/test-tmdb-context-identity.mjs','TMDB_CONTEXT_IDENTITY=PASS'],['scripts/test-tmdb-subtitle-preview-recovery.mjs','TMDB_SUBTITLE_PREVIEW_RECOVERY=PASS'],['scripts/test-catalog-snapshot-retention.mjs','CATALOG_SNAPSHOT_RETENTION=PASS'],['scripts/test-detail-backdrop-recovery.mjs','DETAIL_BACKDROP_RECOVERY=PASS'],['scripts/test-streamed-vod-inventory.mjs','STREAMED_VOD_INVENTORY=PASS'],['scripts/test-c107-fire-hero-metadata.mjs','HERO_PLATFORM_METADATA=PASS'],['scripts/test-c107-watch-providers.mjs','HERO_PLATFORM_LOGOS=PASS'],['scripts/test-live-single-transport.mjs','SINGLE_TRANSPORT_PLAYBACK=PASS'],['scripts/test-network-diagnostics.mjs','NETWORK_DIAGNOSTICS=PASS'],['scripts/test-tmdb-release-tags.mjs','TMDB_RELEASE_TAGS=PASS'],['scripts/test-dpad-expanded-cards.mjs','DPAD_EXPANDED_CARDS=PASS'],['scripts/test-home-dpad-carousel-preview-pagination.mjs','HOME_DPAD_CAROUSEL_PREVIEW_PAGINATION=PASS'],['scripts/test-dpad-card-scope-seeall-grid.mjs','DPAD_CARD_SCOPE_SEEALL_GRID=PASS'],['scripts/test-ui-performance-recovery-03.mjs','UI_PERFORMANCE_RECOVERY_03=PASS'],['scripts/test-app-intro-branding-07.mjs','APP_INTRO_BRANDING_07=PASS'],['scripts/test-series-episode-return.mjs','SERIES_EPISODE_RETURN=PASS'],['scripts/test-trailer-containment-r4.mjs','TRAILER_CONTAINMENT_R4=PASS'],['scripts/test-tmdb-episode-enrichment.mjs','TMDB_EPISODE_ENRICHMENT=PASS'],['scripts/test-tmdb-episode-runtime-recovery.mjs','TMDB_EPISODE_RUNTIME_RECOVERY=PASS'],['scripts/test-episode-general-identity.mjs','EPISODE_GENERAL_IDENTITY=PASS'],['scripts/test-detail-hero-refinement.mjs','DETAIL_HERO_REFINEMENT=PASS'],['scripts/test-actor-profile.mjs','ACTOR_PROFILE=PASS'],['scripts/test-identity-hero-recovery.mjs','IDENTITY_HERO_RECOVERY=PASS'],['scripts/test-source-replacement-isolation.mjs','SOURCE_REPLACEMENT_ISOLATION=PASS'],['scripts/test-source-replacement-bootstrap.mjs','SOURCE_REPLACEMENT_BOOTSTRAP=PASS'],['scripts/test-source-replacement-ui.mjs','SOURCE_REPLACEMENT_UI=PASS'],['scripts/test-daily-trending-hero.mjs','HERO_TRENDS_TODAY=PASS']];
for(const[file,marker]of suites){
 const run=spawnSync(process.execPath,[path.join(root,file)],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
 fs.writeFileSync(path.join(dir,path.basename(file)+'.log'),(run.stdout||'')+(run.stderr||''));
 if(run.error||run.signal||run.status!==0||!run.stdout?.includes(marker)){
  fs.writeFileSync(path.join(dir,'regression-result.json'),JSON.stringify({result:'FAIL',controls:cases,suites:results,failedSuite:file,exitCode:run.status,signal:run.signal,remainingSuites:suites.slice(results.length+1).map(x=>({file:x[0],result:'NOT_RUN'})),physicalTestPerformed:false,remoteWrites:0},null,2));console.error('REGRESSION_LOCK=FAIL '+file);
  // Safe CI telemetry: no arbitrary child stdout/stderr, tokens, source URLs or private values.
  const lastPassed=(run.stdout||'').split(/\r?\n/).filter(line=>/^PASS [A-Z][A-Z0-9_]*$/.test(line)).slice(-12);
  const errorCodes=[...new Set(((run.stderr||'')+'\n'+(run.stdout||'')).match(/\b(?:A22|CANON|ERR|GH)_[A-Z0-9_]+\b/g)||[])].slice(0,12);
  const errorKinds=[...new Set((run.stderr||'').match(/\b(?:AssertionError|TypeError|RangeError|ReferenceError|SyntaxError|ENOENT|EPERM|EACCES|ETIMEDOUT|ENOTDIR)\b/g)||[])].slice(0,8);
  console.error('CI_DIAG_FAILED_SUITE='+file);
  console.error('CI_DIAG_EXIT_CODE='+(Number.isInteger(run.status)?run.status:'NONE'));
  console.error('CI_DIAG_SIGNAL='+(run.signal||'NONE'));
  console.error('CI_DIAG_LAST_PASS='+lastPassed.join('|'));
  console.error('CI_DIAG_ERROR_CODES='+errorCodes.join('|'));
  console.error('CI_DIAG_ERROR_KINDS='+errorKinds.join('|'));
 }
 assert.ifError(run.error);assert.equal(run.signal,null,'SUITE_TIMEOUT '+file);assert.equal(run.status,0,'SUITE_FAILED '+file);assert(run.stdout.includes(marker),'SUITE_MARKER_MISSING '+file);results.push({file,result:'PASS'});console.log('SUITE_PASS '+file);
}
const result={result:'PASS',negativeAndEvolutionControls:cases.length-1,controls:cases,suites:results,physicalTestPerformed:false,remoteWrites:0};
fs.writeFileSync(path.join(dir,'regression-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({result:'PASS',controls:cases.length,suites:results.length}));console.log('CANON_REGRESSION_TESTS=PASS\nREGRESSION_LOCK=PASS');
