import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const REFERENCE='b3fc8d1e3844bc5601813ab1b298289af5b3f1fd';
export const PHASED='docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md';
export const PHYSICAL='docs/evidence/ANDROID_V1_0_37_PHYSICAL_HOMOLOGATION.md';
export const AUTHORIZATION='docs/governance/CANON_CHANGE_AUTHORIZATION.json';
export const LEGACY_AUTHORIZATION='docs/governance/CANON_01_LEGACY_TESTS_AUTHORIZATION.json';
export const HARDENING_GATE='CANON-01-AUTHORIZATION-HARDENING';
export const HARDENING_AUTHORIZATION='docs/governance/CANON_01_AUTHORIZATION_HARDENING.json';
export const AUTHORIZATION_DIRECTORY='docs/governance/authorizations/';
export const SITE_BUILD_GATE='CANON-01-VERCEL-BUILD-A1';
export const SITE_BUILD_AUTHORIZATION=AUTHORIZATION_DIRECTORY+SITE_BUILD_GATE+'.json';
export const SITE_BUILD_WORKFLOW='.github/workflows/site-build-validation.yml';
export const SITE_BUILD_TEST='scripts/test-site-build-contract.mjs';
const SITE_BUILD_WORKFLOW_TEXT=[
 'name: Site build validation','',
 'on:','  push:','  pull_request:','',
 'permissions:','  contents: read','',
 'jobs:','  site-build:','    strategy:','      fail-fast: false',
 '      matrix:','        os: [ubuntu-latest, windows-latest]',
 '    runs-on: ${{ matrix.os }}','    timeout-minutes: 30','    steps:',
 '      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6',
 '        with:','          fetch-depth: 0','          persist-credentials: false',
 '      - uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6',
 "        with:","          node-version: '24'",'          cache: npm',
 '      - run: npm ci','      - run: npm run canon:check',
 '      - run: npm run canon:test','      - run: npm run c11:new-device:lock',
 '      - run: npm run typecheck','      - run: npm run site:build',
 '        env:',
 '          VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}',
 '          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY }}','',
].join('\n');
const HISTORICAL_RECEIPTS=[
 [AUTHORIZATION,'CANON-01-G10FIX','e73152f228cbb625c508062d70ef810e8342059a'],
 [LEGACY_AUTHORIZATION,'CANON-01-LEGACYTESTS','e59e2d328db3d0dfd8c1d873b154e2e3f7900a0c'],
];
const GOVERNANCE_BEFORE={'scripts/verify-canonical-contract.mjs':'6e50851dd36becd0ccf90e827c23d144b4bfcebe','scripts/test-canonical-regression.mjs':'01e43c3e2fec97378b60bae9298712c208147c37'};
const LEGACY_TESTS=['scripts/test-c11-phone-ui-orientation.mjs','scripts/validate-direct-playback.mjs'];
const CANON_FILES=['scripts/verify-canonical-contract.mjs','scripts/test-canonical-regression.mjs'];
const APPEND_ONLY=['AGENTS.md','docs/architecture/XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md','docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md','docs/governance/GATE_EXECUTION_RULES.md','docs/STATUS.md','docs/EVOLUTION_REPORT.md','docs/ERRORS_AND_BLOCKERS.md'];
const C11='scripts/test-c11-new-device-activation-lock.mjs';
const BOUNDARY='docs/architecture/XANDEFLIX_PREBUILT_SOURCE_DATA_BOUNDARY.md';
const SPECIAL=['package-lock.json','capacitor.config.ts','tsconfig.json','vite.config.ts','vite.app.config.ts','vite.manager.config.ts','android/variables.gradle',BOUNDARY];
const ROOTS=['src/','scripts/','android/app/src/','supabase/','fixtures/','schemas/'];
const GRADLE='android/app/build.gradle';
const PACKAGE_ID='com.xandeflix.prebuilt';
export const SUITES=[
 ['scripts/validate-device-bootstrap.mjs','BOOTSTRAP_CHECK:'],
 ['scripts/test-c105-complete-root-search.mjs','PASS_ACTIVE_DIRECTORY_CHANGE_REJECTS_MIXED_GENERATION_BEFORE_PERSIST'],
 ['scripts/test-c107-catalog-return-navigation.mjs','"pass":true'],
 ['scripts/test-c11-vod-direct-stream-contract.mjs','C11_VOD_DIRECT_STREAM_CONTRACT_TESTS=PASS'],
 ['scripts/test-c11-playback-session-c9-runtime-wiring.mjs','C11/C9 runtime wiring: 10/10 PASS'],
 ['scripts/validate-security-recovery.mjs','ALL SECURITY & RECOVERY VERIFICATIONS PASSED'],
 ['scripts/test-c11-phone-ui-orientation.mjs','C11_PHONE_UI_ORIENTATION=PASS_STATIC_CALL_SITES_AND_5_NEGATIVES'],
 ['scripts/test-c11-landscape-navigation.mjs','C11_LANDSCAPE_NAVIGATION_POLICY=PASS_18_CASES_AND_REAL_HOOK'],
 ['scripts/validate-direct-playback.mjs','RESULT=PASS_PREBUILT_G8_SOURCE_AND_DIRECT_PLAYBACK'],
 ['scripts/test-c126-parental-control.mjs','"result":"PASS"'],
];
const DECISIONS={PRODUCT_VISION:'MULTIPLATFORM',CURRENT_PRIORITY:'ANDROID_AND_FIRE_OS',ANDROID_MOBILE_GOOGLE_PLAY:'PLANNED',ANDROID_TABLET_GOOGLE_PLAY:'PLANNED',ANDROID_TV_GOOGLE_PLAY:'PLANNED',FIRE_STICK_EXTERNAL_APK:'PLANNED',GOOGLE_PLAY_RELEASE_READY:'NAO',ANDROID_TV_PHYSICAL_VALIDATION:'PENDING',SAMSUNG_TIZEN:'FUTURE_ROADMAP',LG_WEBOS:'FUTURE_ROADMAP',TIZEN_DEVELOPMENT_AUTHORIZED:'NAO',WEBOS_DEVELOPMENT_AUTHORIZED:'NAO',PILOT_MAX_PARTICIPANTS:60,PILOT_EXECUTED:'NAO',ANALYTICS_PANEL:'PLANNED'};
const PHASES=['CANONICAL_CONSOLIDATION','ANDROID_FIRE_OS_FINAL_ADJUSTMENTS_GATE','ANDROID_DISTRIBUTION_READINESS_GATE','PILOT_60_ANALYTICS_GATE','PILOT_EVALUATION_AND_CAPACITY_DECISION','TIZEN_WEBOS_FUTURE_GATE'];
const CLASSES=['DECISAO_CANONICA','EVIDENCIA_DE_TESTE','HIPOTESE_NAO_VALIDADA','PENDENCIA','EXPANSAO_FUTURA'];
export const SCRIPT_CHANGES={'canon:check':'node scripts/verify-canonical-contract.mjs','canon:test':'node scripts/test-canonical-regression.mjs',pretypecheck:'npm run canon:check','presite:build':'npm run canon:check',build:'npm run canon:check && tsc && vite build'};

export class CanonError extends Error {constructor(code,file=''){super(code+(file?' '+file:''));this.code=code;}}
const ensure=(condition,code,file)=>{if(!condition)throw new CanonError(code,file)};
const text=bytes=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
export function blobHash(file,bytes){let b=Buffer.from(bytes);if(/\.(?:[cm]?[jt]sx?|json|xml|java|css|md|gradle|properties|rules|ya?ml|html|txt)$/.test(file))b=Buffer.from(text(b));return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');}
const protectedFile=file=>ROOTS.some(r=>file.startsWith(r))||SPECIAL.includes(file)||file===SITE_BUILD_WORKFLOW;
const safeFile=file=>typeof file==='string'&&file.length>0&&!file.startsWith('/')&&!file.includes('\\')&&!file.split('/').some(p=>p==='..'||p==='.'||!p)&&!file.includes(':');
const json=(value,code)=>{try{return JSON.parse(value)}catch{throw new CanonError(code)}};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

// Exact approved validation-only workflow. Hash grants cannot add execution paths.
export function verifySiteBuildWorkflow(bytes){
 ensure(text(bytes)===SITE_BUILD_WORKFLOW_TEXT,'CANON_SITE_BUILD_WORKFLOW_INVALID',SITE_BUILD_WORKFLOW);
 return{result:'PASS',workflow:SITE_BUILD_WORKFLOW};
}

/** Real CLI adapter: no environment flag, fake baseline, skip switch or remote write. */
export function collectSnapshot(root){
 const git=args=>{try{return execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']})}catch{throw new CanonError('CANON_GIT_OR_BASELINE_UNAVAILABLE')}};
 ensure(fs.realpathSync(git(['rev-parse','--show-toplevel']).trim())===fs.realpathSync(root),'CANON_WORKSPACE_MISMATCH');
 const origin=git(['remote','get-url','origin']).trim().replace(/\.git$/,'');
 ensure(origin==='https://github.com/xandeflix2/xandeflix-prebuilt'||origin==='git@github.com:xandeflix2/xandeflix-prebuilt','CANON_REPOSITORY_MISMATCH');
 ensure(git(['rev-parse',REFERENCE+'^{commit}']).trim()===REFERENCE,'CANON_BASELINE_MISMATCH');
 const baseline=new Map(git(['ls-tree','-r','-z',REFERENCE]).split('\0').filter(Boolean).map(line=>{const cut=line.indexOf('\t'),parts=line.slice(0,cut).split(' ');return[line.slice(cut+1),{mode:parts[0],hash:parts[2]}]}));
 // Both sides must use the same text normalization: old Git blobs may mix LF/CRLF.
 const protectedEntries=Array.from(baseline).filter(([file])=>protectedFile(file)||file===GRADLE);
 let blobs;try{blobs=execFileSync('git',['cat-file','--batch'],{cwd:root,input:protectedEntries.map(([,e])=>e.hash+'\n').join(''),maxBuffer:64*1024*1024,stdio:['pipe','pipe','pipe']})}catch{throw new CanonError('CANON_GIT_OR_BASELINE_UNAVAILABLE')}
 let offset=0;for(const[file,entry]of protectedEntries){const end=blobs.indexOf(10,offset),header=blobs.subarray(offset,end).toString('ascii').split(' '),size=Number(header[2]);ensure(end>=offset&&header[0]===entry.hash&&header[1]==='blob'&&Number.isSafeInteger(size)&&size>=0&&end+1+size<blobs.length,'CANON_BASELINE_BLOB_INVALID',file);entry.rawHash=entry.hash;entry.hash=blobHash(file,blobs.subarray(end+1,end+1+size));offset=end+size+2}
 const baselineText=new Map([...APPEND_ONLY,'package.json',GRADLE].map(file=>[file,git(['show',REFERENCE+':'+file])]));
 const files=git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean);
 const read=file=>{ensure(safeFile(file),'CANON_UNSAFE_PATH');const target=path.join(root,...file.split('/'));try{const stat=fs.lstatSync(target);ensure(stat.isFile()&&!stat.isSymbolicLink(),'CANON_NON_REGULAR_FILE',file);return fs.readFileSync(target)}catch(e){if(e.code==='ENOENT')return null;throw e}};
 return{baseline,baselineText,files,read,nodeMajor:Number(process.versions.node.split('.')[0])};
}

export function verifyCanonical(snapshot){
 const {baseline,baselineText,files,read}=snapshot;
 const required=file=>{const b=read(file);ensure(b!==null&&b!==undefined,'CANON_REQUIRED_FILE_MISSING',file);return text(b)};
 ensure(snapshot.nodeMajor>=24,'CANON_NODE_24_REQUIRED');
 for(const file of ['node_modules/typescript/package.json','node_modules/vite/package.json','node_modules/jszip/package.json','node_modules/react/package.json'])ensure(read(file),'CANON_DEPENDENCY_MISSING',file);
 for(const f of [...APPEND_ONLY,PHASED,PHYSICAL,BOUNDARY,'docs/architecture/C11_NEW_DEVICE_ACTIVATION_LOCK.md','docs/evidence/CANON_01_EXECUTION.md',...CANON_FILES,C11,'.github/workflows/canonical-regression.yml',SITE_BUILD_WORKFLOW,SITE_BUILD_TEST,...SUITES.map(x=>x[0])])required(f);
 for(const f of APPEND_ONLY)ensure(required(f).startsWith(text(baselineText.get(f))),'CANON_HISTORY_REWRITTEN',f);
 for(const f of APPEND_ONLY.slice(0,4)){const doc=required(f);ensure(doc.includes('XANDEFLIX_PREBUILT_PHASED_EXPANSION')&&doc.includes('canon:check')&&doc.includes('canon:test'),'CANON_NORMATIVE_REFERENCE_MISSING',f)}
 const contract=required(PHASED),blocks=Array.from(contract.matchAll(/<!-- CANON-01:POLICY -->\s*```json\s*([\s\S]*?)```/g));
 ensure(blocks.length===1,'CANON_POLICY_BLOCK_REQUIRED');const policy=json(blocks[0][1],'CANON_POLICY_JSON_INVALID');
 ensure(policy.schema===1&&policy.gate==='CANON-01'&&policy.referenceCommit===REFERENCE,'CANON_POLICY_IDENTITY_CHANGED');
 ensure(same(policy.historicalAndroid,{versionName:'1.0.37',versionCode:37,physicalStatus:'PASS',permanentVersionCeiling:false}),'CANON_HISTORICAL_BASELINE_CHANGED');
 ensure(Object.keys(policy.decisions||{}).length===Object.keys(DECISIONS).length&&Object.entries(DECISIONS).every(([k,v])=>policy.decisions[k]===v),'CANON_DECISION_CHANGED');
 ensure(same(policy.phaseOrder,PHASES),'CANON_PHASE_ORDER_CHANGED');ensure(same(policy.evidenceClasses,CLASSES),'CANON_EVIDENCE_CLASSES_CHANGED');
 const physical=required(PHYSICAL);for(const marker of ['EVIDENCE_ORIGIN=LOCAL_TESTS_AND_OPERATOR_MANUAL_CONFIRMATION','BASELINE_VERSION_NAME=1.0.37','BASELINE_VERSION_CODE=37','TOTAL_FUNCTIONAL=20/20','TOTAL_RESISTANCE_CAPTURES=21/21','TOTAL_MONITORED_DURATION=90_MIN','PHYSICAL_BASELINE_STATUS=PASS','HISTORICAL_BASELINE_IS_PERMANENT_VERSION_CEILING=NAO'])ensure(physical.includes(marker),'CANON_PHYSICAL_RECORD_INCOMPLETE',marker);
 for(const marker of ['BACKEND_CONTROL_PLANE_ONLY=SIM','LOCAL_CATALOG_SYNC_TO_BACKEND=NAO','CONTENT_SEARCH=DEVICE_LOCAL'])ensure(required(BOUNDARY).includes(marker),'CANON_SOURCE_BOUNDARY_MISSING',marker);

 // Registrations are appended to the contract; historical paths never enter this registry.
 const registrations=Array.from(contract.matchAll(/<!-- CANON-01:AUTHORIZATION -->\s*```json\s*([\s\S]*?)```/g),m=>json(m[1],'CANON_AUTHORIZATION_REGISTRY_INVALID'));
 ensure(registrations.length>0&&registrations[0].gate===HARDENING_GATE&&registrations[0].path===HARDENING_AUTHORIZATION,'CANON_HARDENING_REGISTRATION_REQUIRED');
 ensure(registrations.some(r=>r.gate===SITE_BUILD_GATE&&r.path===SITE_BUILD_AUTHORIZATION),'CANON_SITE_BUILD_AUTHORIZATION_REQUIRED');
 const registeredPaths=new Set(),registeredGates=new Set(HISTORICAL_RECEIPTS.map(r=>r[1]));
 for(const entry of registrations){
  ensure(same(Object.keys(entry).sort(),['gate','hash','path','schema'])&&entry.schema===1&&/^[A-Z][A-Z0-9_-]{2,64}$/.test(entry.gate||'')&&entry.gate!=='CANON-01'&&/^[a-f0-9]{40}$/.test(entry.hash||''),'CANON_AUTHORIZATION_REGISTRY_INVALID');
  ensure(!registeredPaths.has(entry.path)&&!registeredGates.has(entry.gate),'CANON_AUTHORIZATION_REGISTRY_DUPLICATE');
  ensure(entry.path===(entry.gate===HARDENING_GATE?HARDENING_AUTHORIZATION:AUTHORIZATION_DIRECTORY+entry.gate+'.json'),'CANON_AUTHORIZATION_REGISTRY_PATH');
  registeredPaths.add(entry.path);registeredGates.add(entry.gate);
  ensure(blobHash(entry.path,required(entry.path))===entry.hash,'CANON_REGISTERED_RECEIPT_CHANGED',entry.path);
 }
 for(const file of files)if(file.startsWith(AUTHORIZATION_DIRECTORY))ensure(registeredPaths.has(file),'CANON_UNREGISTERED_AUTHORIZATION',file);
 const authorizations=[],approved=new Map();
 for(const receipt of [AUTHORIZATION,LEGACY_AUTHORIZATION,...registrations.map(r=>r.path)]){
  const authorization=json(required(receipt),'CANON_CHANGE_AUTHORIZATION_INVALID');ensure(authorization.schema===1&&authorization.referenceCommit===REFERENCE&&/^[A-Z][A-Z0-9_-]{2,64}$/.test(authorization.gate||'')&&authorization.gate!=='CANON-01'&&authorization.status==='APPROVED_BY_CHAT_MASTER','CANON_CHANGE_NOT_AUTHORIZED');
  if(receipt===AUTHORIZATION)ensure(authorization.gate==='CANON-01-G10FIX','CANON_HISTORICAL_AUTHORIZATION_IDENTITY');
  const registration=registrations.find(r=>r.path===receipt),additional=Boolean(registration);
  if(registration)ensure(authorization.gate===registration.gate,'CANON_ADDITIONAL_AUTHORIZATION_IDENTITY');
  const fields=['schema','gate','parentGate','status','referenceCommit','authorizationOrigin','authorizationRequestSha256','reason','physicalImpact','physicalImpactJustification','requiredTests','mandatoryCommands','evidence','compatibilityRisk','changes','gitCommitAuthorized','gitPushAuthorized','androidBuildAuthorized','supabaseWriteAuthorized','nextGateStarted','testChangesReviewed','amendment','restrictions','previousGovernanceHashes','supersedes'];
  ensure(Object.keys(authorization).every(k=>fields.includes(k)),'CANON_AUTHORIZATION_UNKNOWN_FIELD');
  ensure(typeof authorization.reason==='string'&&authorization.reason.length>=32&&['REQUIRED','NOT_REQUIRED_JUSTIFIED'].includes(authorization.physicalImpact),'CANON_IMPACT_REVIEW_REQUIRED');
  ensure(Array.isArray(authorization.requiredTests)&&authorization.requiredTests.length>0&&authorization.requiredTests.every(f=>SUITES.some(s=>s[0]===f)),'CANON_REGRESSION_PLAN_REQUIRED');
  ensure(safeFile(authorization.evidence)&&authorization.evidence.startsWith('docs/evidence/')&&required(authorization.evidence).includes(authorization.gate),'CANON_REVIEW_EVIDENCE_REQUIRED');
  ensure(Array.isArray(authorization.changes)&&authorization.changes.length>0,'CANON_CHANGE_SCOPE_REQUIRED');
  if(receipt===LEGACY_AUTHORIZATION){
   ensure(authorization.gate==='CANON-01-LEGACYTESTS'&&authorization.parentGate==='CANON-01'&&authorization.amendment==='CANON-01-LEGACYTESTS','CANON_LEGACY_AUTHORIZATION_IDENTITY');
   ensure(authorization.testChangesReviewed===true,'CANON_TEST_WEAKENING_REVIEW_REQUIRED');
   ensure(authorization.changes.length===LEGACY_TESTS.length&&authorization.changes.every(item=>LEGACY_TESTS.includes(item.path)),'CANON_LEGACY_AUTHORIZATION_SCOPE');
   ensure([...LEGACY_TESTS,'scripts/test-c126-parental-control.mjs','scripts/test-c11-playback-session-c9-runtime-wiring.mjs'].every(f=>authorization.requiredTests.includes(f)),'CANON_REGRESSION_PLAN_REQUIRED');
   ensure(authorization.authorizationRequestSha256==='6db32f1cc2bb81913434dc13bd558843b405543e8660f7b91525f55ec1ef34f1'&&authorization.gitCommitAuthorized===false&&authorization.gitPushAuthorized===false&&authorization.androidBuildAuthorized===false&&authorization.supabaseWriteAuthorized===false&&authorization.nextGateStarted===false,'CANON_LEGACY_AUTHORIZATION_RESTRICTIONS');
  }
  if(receipt===HARDENING_AUTHORIZATION){
   ensure(authorization.parentGate==='CANON-01'&&authorization.amendment===HARDENING_GATE&&authorization.testChangesReviewed===true&&same(authorization.previousGovernanceHashes,GOVERNANCE_BEFORE),'CANON_HARDENING_AUTHORIZATION_REQUIRED');
   ensure(authorization.changes.length===CANON_FILES.length&&authorization.changes.every(item=>CANON_FILES.includes(item.path)&&item.before===null),'CANON_HARDENING_AUTHORIZATION_SCOPE');
   ensure(authorization.gitCommitAuthorized===false&&authorization.gitPushAuthorized===false&&authorization.androidBuildAuthorized===false&&authorization.supabaseWriteAuthorized===false&&authorization.nextGateStarted===false,'CANON_HARDENING_AUTHORIZATION_RESTRICTIONS');
  }
  if(receipt===SITE_BUILD_AUTHORIZATION){
   ensure(authorization.parentGate==='CANON-01'&&authorization.amendment===SITE_BUILD_GATE&&authorization.testChangesReviewed===true,'CANON_SITE_BUILD_AUTHORIZATION_REQUIRED');
   const scope=[...CANON_FILES,SITE_BUILD_WORKFLOW,SITE_BUILD_TEST];
   ensure(authorization.changes.length===scope.length&&authorization.changes.every(item=>scope.includes(item.path)),'CANON_SITE_BUILD_AUTHORIZATION_SCOPE');
   ensure(authorization.gitCommitAuthorized===false&&authorization.gitPushAuthorized===false&&authorization.androidBuildAuthorized===false&&authorization.supabaseWriteAuthorized===false&&authorization.nextGateStarted===false,'CANON_SITE_BUILD_AUTHORIZATION_RESTRICTIONS');
  }
  const supersedes=authorization.supersedes??{};
  ensure(typeof supersedes==='object'&&supersedes!==null&&!Array.isArray(supersedes)&&Object.keys(supersedes).every(f=>authorization.changes.some(c=>c.path===f)),'CANON_AUTHORIZATION_CHAIN_INVALID');
  const receiptPaths=new Set();
  for(const item of authorization.changes){
   ensure(same(Object.keys(item).sort(),['after','before','path'])&&safeFile(item.path)&&!receiptPaths.has(item.path)&&/^[a-f0-9]{40}$/.test(item.after||'')&&(item.before===null||/^[a-f0-9]{40}$/.test(item.before||'')),'CANON_CHANGE_SCOPE_INVALID');
   ensure(protectedFile(item.path)||item.path===GRADLE,'CANON_CHANGE_SCOPE_UNSUPPORTED',item.path);
   const previous=approved.get(item.path);
   if(previous){ensure(additional,'CANON_CHANGE_SCOPE_INVALID');ensure(supersedes[item.path]===previous.authorizationGate&&item.before===previous.after,'CANON_AUTHORIZATION_CHAIN_INVALID',item.path)}
   else ensure(!Object.hasOwn(supersedes,item.path),'CANON_AUTHORIZATION_CHAIN_INVALID',item.path);
   approved.set(item.path,{...item,before:previous?previous.before:item.before,reviewRequired:Boolean(previous),testChangesReviewed:authorization.testChangesReviewed===true,authorizationGate:authorization.gate});receiptPaths.add(item.path);
  }
  authorizations.push(authorization);
 }
 let protectedCount=0;const observed=new Set();
 const checkFile=(file,expected)=>{const bytes=read(file);ensure(bytes!==null,'CANON_PROTECTED_FILE_MISSING',file);const current=blobHash(file,bytes);protectedCount++;if(current===expected)return;const grant=approved.get(file);ensure(grant&&grant.before===expected&&grant.after===current,'CANON_PROTECTED_CONTENT_CHANGED',file);if(file.startsWith('scripts/')&&(expected!==null||grant.reviewRequired))ensure(grant.testChangesReviewed===true,'CANON_TEST_WEAKENING_REVIEW_REQUIRED',file);observed.add(file)};
 for(const[f,entry]of baseline)if(protectedFile(f)){ensure(entry.mode==='100644'||entry.mode==='100755','CANON_BASELINE_MODE_UNSUPPORTED',f);checkFile(f,entry.hash)}
 for(const f of files)if(protectedFile(f)&&!baseline.has(f))checkFile(f,null);

 const pkg=json(required('package.json'),'CANON_PACKAGE_JSON_INVALID'),basePackage=json(baselineText.get('package.json'),'CANON_BASE_PACKAGE_INVALID');
 ensure(pkg.scripts?.prebuild==='npm run c11:new-device:lock'&&pkg.scripts['c11:new-device:lock']==='node scripts/test-c11-new-device-activation-lock.mjs','CANON_C11_HOOK_WEAKENED');
 const expectedPackage=structuredClone(basePackage);Object.assign(expectedPackage.scripts,SCRIPT_CHANGES);ensure(same(pkg,expectedPackage),'CANON_PACKAGE_OR_DEPENDENCIES_CHANGED');
 const gradle=required(GRADLE),baseGradle=text(baselineText.get(GRADLE));
 const version=value=>{const codes=Array.from(value.matchAll(/\bversionCode\s+(\d+)\b/g)),names=Array.from(value.matchAll(/\bversionName\s+"([^"]+)"/g));ensure(codes.length===1&&names.length===1,'CANON_ANDROID_VERSION_INVALID');const code=Number(codes[0][1]);ensure(Number.isSafeInteger(code)&&code>=37&&code<=2100000000&&/^\d+(?:\.\d+){1,3}(?:[-+][\w.-]+)?$/.test(names[0][1]),'CANON_ANDROID_VERSION_INVALID');return{code,name:names[0][1]}};
 const actualVersion=version(gradle);ensure((gradle.match(/\bapplicationId\s+"([^"]+)"/)||[])[1]===PACKAGE_ID&&(gradle.match(/\bnamespace\s+"([^"]+)"/)||[])[1]===PACKAGE_ID,'CANON_ANDROID_PACKAGE_CHANGED');
 ensure((required('capacitor.config.ts').match(/\bappId:\s*['"]([^'"]+)['"]/)||[])[1]===PACKAGE_ID,'CANON_CAPACITOR_PACKAGE_CHANGED');
 if(!same(actualVersion,version(baseGradle))||gradle!==baseGradle){const grant=approved.get(GRADLE);ensure(grant&&grant.before===baseline.get(GRADLE)?.hash&&grant.after===blobHash(GRADLE,gradle),'CANON_VERSION_GATE_REQUIRED');observed.add(GRADLE)}
 for(const f of approved.keys())ensure(observed.has(f),'CANON_STALE_OR_UNUSED_AUTHORIZATION',f);
 // Unconditional path-bound pins: no identifier or future registration can disable them.
 for(const [receipt,,hash]of HISTORICAL_RECEIPTS)ensure(blobHash(receipt,required(receipt))===hash,'CANON_RECEIPT_CONTENT_CHANGED',receipt);
 const workflow=required('.github/workflows/canonical-regression.yml');
 ensure(workflow.includes('fetch-depth: 0')&&workflow.includes('persist-credentials: false')&&/contents:\s*read/.test(workflow)&&workflow.includes('ubuntu-latest')&&workflow.includes('windows-latest'),'CANON_CI_HISTORY_AND_SCOPE_REQUIRED');
 const runSteps=Array.from(workflow.matchAll(/^      - run: ([^\r\n]+)$/gm),m=>m[1]);
 ensure(same(runSteps,['npm ci','npm run canon:test','npm run canon:check','npm run c11:new-device:lock','npm run typecheck','npm run build']),'CANON_CI_STEP_MISSING');
 const actions=Array.from(workflow.matchAll(/^      - uses: ([a-zA-Z0-9_/-]+@[a-f0-9]{40})(?:\s+#.*)?$/gm),m=>m[1]);
 ensure(same(actions,['actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803','actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38']),'CANON_CI_ACTION_CHANGED');
 ensure(!/^\s*(?:if|continue-on-error|working-directory|shell|env|defaults|container|services|environment|needs|exclude):/m.test(workflow)&&!/\|\|\s*true|pull_request_target|supabase\s+(?:db|functions)|gradlew|cap\s+(?:copy|sync)|git\s+push/.test(workflow),'CANON_CI_UNSAFE_OR_WEAKENED');
 verifySiteBuildWorkflow(required(SITE_BUILD_WORKFLOW));
 return{result:'PASS',referenceCommit:REFERENCE,protectedFiles:protectedCount,canonicalContract:'PASS',protectedIntegrity:'PASS',packageId:PACKAGE_ID,currentVersion:actualVersion,historicalVersion:{code:37,name:'1.0.37'},authorizedEvolution:authorizations[0].gate,authorizedAmendments:authorizations.map(a=>a.gate),physicalEvidenceOrigin:'OPERATOR_REPORT',physicalRetestPerformed:false};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{ensure(process.argv.length===2,'CANON_UNSUPPORTED_ARGUMENT');const root=fileURLToPath(new URL('..',import.meta.url));const result=verifyCanonical(collectSnapshot(root));console.log(JSON.stringify(result));console.log('CANONICAL_CONTRACT=PASS\nCANON_INTEGRITY=PASS')}
 catch(error){console.error(error instanceof CanonError?error.message:'CANON_CHECK_FAILED');process.exitCode=1}
}
