// Policy fixtures are synthetic and explicitly UNATTESTED. Never publish them.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {POLICY,PREBUILT_WORKFLOW,PrebuiltError,sha256,verifyPrebuiltWorkflow,
  contextFromEnvironment,verifyGitSource,validatePublicConfig,requireReadToken,
  selectProjectSettings,inspectOutput,readOutput,packTar,unpackTar,makePackage,
  inspectPackage,inspectVerifiedClaims,verifyAttestation} from './vercel-prebuilt-contract.mjs';

assert.equal(process.argv.length,2,'A22_TEST_ARGUMENTS_FORBIDDEN');
const repoRoot=fileURLToPath(new URL('..',import.meta.url));
const tmp=fs.realpathSync.native(os.tmpdir()),dir=fs.mkdtempSync(path.join(tmp,'xandeflix-a22a-'));
let controls=0;
const pass=(name,fn)=>{fn();controls++;console.log('PASS '+name)};
const reject=(name,code,fn)=>pass(name,()=>assert.throws(fn,e=>e instanceof PrebuiltError&&e.code===code));
const env={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_SERVER_URL:'https://github.com',
  GITHUB_REPOSITORY:POLICY.repository,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:POLICY.ref,
  EXPECTED_SOURCE_SHA:POLICY.receivedHead,GITHUB_SHA:POLICY.receivedHead,GITHUB_WORKFLOW_SHA:POLICY.receivedHead,
  GITHUB_WORKFLOW_REF:POLICY.repository+'/'+PREBUILT_WORKFLOW+'@'+POLICY.ref,
  GITHUB_RUN_ID:'123456',GITHUB_RUN_ATTEMPT:'1'};
const context=contextFromEnvironment(env);
const headers={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
const config={version:3,routes:[{src:'^/(.*)$',headers,continue:true},{handle:'filesystem'},
  ...[['/','/manager.html'],['/admin','/manager.html'],['/master','/manager.html'],['/manager','/manager.html'],['/manager-reset-password','/manager.html'],['/activate-device','/manager.html'],['/app','/app/app.html'],['/app/','/app/app.html']].map(([src,dest])=>({src:'^'+src+'$',dest,check:true}))]};
const files=new Map([['config.json',Buffer.from(JSON.stringify(config))],
  ['static/manager.html',Buffer.from('<html><script src="/assets/manager.js"></script>synthetic manager</html>')],
  ['static/app/app.html',Buffer.from('<html><script src="/app/assets/app.js"></script>synthetic app</html>')],
  ['static/assets/manager.js',Buffer.from('/* synthetic */')],
  ['static/app/assets/app.js',Buffer.from('/* synthetic */')]]);
const changeConfig=fn=>{const c=structuredClone(config);fn(c);return new Map([...files].map(([p,b])=>[p,p==='config.json'?Buffer.from(JSON.stringify(c)):b]));};
const project={id:POLICY.projectId,name:POLICY.projectName,accountId:POLICY.teamId,
  link:{type:'github',repo:'xandeflix-prebuilt',org:'xandeflix2'},framework:'vite',nodeVersion:'24.x',rootDirectory:null,
  buildCommand:'npm run site:build',installCommand:'npm ci',outputDirectory:'tmp/c154-web-production/site'};
try{
  pass('MANUAL_CONTEXT_POLICY_ONLY',()=>assert.equal(context.environment,'preview'));
  for(const[key,value,code]of [
    ['GITHUB_REPOSITORY','other/repository','A22_REPOSITORY_MISMATCH'],
    ['GITHUB_SERVER_URL','https://example.invalid','A22_REPOSITORY_MISMATCH'],
    ['GITHUB_SHA','0'.repeat(40),'A22_SOURCE_SHA_MISMATCH'],
    ['EXPECTED_SOURCE_SHA','0'.repeat(40),'A22_SOURCE_SHA_MISMATCH'],
    ['GITHUB_WORKFLOW_SHA','0'.repeat(40),'A22_SOURCE_SHA_MISMATCH'],
    ['GITHUB_WORKFLOW_REF','untrusted/workflow','A22_WORKFLOW_IDENTITY_MISMATCH'],
    ['GITHUB_RUN_ID','0','A22_RUN_ID_INVALID'],['GITHUB_RUN_ATTEMPT','0','A22_RUN_ID_INVALID'],
    ['GITHUB_REF','refs/heads/main','A22_MANUAL_REVIEW_BRANCH_REQUIRED'],
    ['GITHUB_EVENT_NAME','pull_request_target','A22_MANUAL_REVIEW_BRANCH_REQUIRED'],
    ['RUNNER_ENVIRONMENT','self-hosted','A22_HOSTED_ACTIONS_REQUIRED'],
    ['GITHUB_ACTIONS','false','A22_HOSTED_ACTIONS_REQUIRED'],
  ])reject('CONTEXT_REJECTS_'+key,code,()=>contextFromEnvironment({...env,[key]:value}));
  reject('NO_GIT_REJECTED','A22_GIT_OR_BASELINE_UNAVAILABLE',()=>verifyGitSource(dir,context));
  execFileSync('git',['-c','init.defaultBranch=a22-negative-fixture','init','--quiet',dir],{stdio:'pipe'});
  execFileSync('git',['remote','add','origin','https://github.com/'+POLICY.repository+'.git'],{cwd:dir,stdio:'pipe'});
  reject('BASELINE_ABSENT_REAL_GIT','A22_GIT_OR_BASELINE_UNAVAILABLE',()=>verifyGitSource(dir,context));
  reject('REAL_WRONG_HEAD_REJECTED','A22_GIT_SHA_MISMATCH',()=>verifyGitSource(repoRoot,{...context,sourceSha:'0'.repeat(40)}));
  const realContext={...context,sourceSha:execFileSync('git',['rev-parse','HEAD'],{cwd:repoRoot,encoding:'utf8'}).trim()};
  const dirty=execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:repoRoot,encoding:'utf8'}).trim();
  if(dirty)reject('REAL_DIRTY_SOURCE_BLOCKS','A22_DIRTY_SOURCE',()=>verifyGitSource(repoRoot,realContext));
  else pass('REAL_CLEAN_GIT_SOURCE',()=>assert.equal(verifyGitSource(repoRoot,realContext).result,'SOURCE_CONTEXT_ONLY'));
  const publicConfig={VITE_SUPABASE_URL:'https://cujbmyhitgomlgwfkaat.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_SYNTHETIC_TEST_ONLY_1234567890'};
  pass('PUBLIC_CONFIG_VALIDATION',()=>validatePublicConfig(publicConfig));
  for(const key of Object.keys(publicConfig))reject('MISSING_'+key,'A22_PUBLIC_CONFIG_REQUIRED',()=>validatePublicConfig({...publicConfig,[key]:''}));
  reject('WRONG_PUBLIC_PROJECT','A22_PUBLIC_CONFIG_REQUIRED',()=>validatePublicConfig({...publicConfig,VITE_SUPABASE_URL:'https://other.supabase.co'}));
  reject('MISSING_READ_TOKEN','A22_READ_TOKEN_REQUIRED',()=>requireReadToken({}));
  pass('EXISTING_PROJECT_LINK_WHITELIST',()=>assert.deepEqual(selectProjectSettings({...project,privateUnrelated:'never persisted'}),selectProjectSettings(project)));
  for(const[key,value,code]of [['id','prj_Wrong','A22_PROJECT_MISMATCH'],['accountId','team_Wrong','A22_PROJECT_MISMATCH'],['name','other-project','A22_PROJECT_MISMATCH'],['link',{},'A22_PROJECT_REPOSITORY_MISMATCH'],['buildCommand','echo PASS','A22_PROJECT_SETTINGS_MISMATCH'],['outputDirectory','dist','A22_PROJECT_SETTINGS_MISMATCH'],['rootDirectory','other','A22_PROJECT_SETTINGS_MISMATCH'],['nodeVersion','22.x','A22_PROJECT_SETTINGS_MISMATCH']])reject('PROJECT_REJECTS_'+key,code,()=>selectProjectSettings({...project,[key]:value}));
  const workflow=fs.readFileSync(path.join(repoRoot,PREBUILT_WORKFLOW),'utf8');
  pass('REVIEWED_WORKFLOW_REQUIRED',()=>verifyPrebuiltWorkflow(workflow));
  pass('WORKFLOW_CRLF_EQUIVALENT',()=>verifyPrebuiltWorkflow(workflow.replaceAll('\n','\r\n')));
  for(const[name,from,to]of [
    ['SHA_INPUT','ref: ${{ github.sha }}','ref: main'],['HISTORY','fetch-depth: 0','fetch-depth: 1'],
    ['MANUAL_ONLY','workflow_dispatch:','pull_request_target:'],['NO_SKIP','needs: build','needs: build\n    if: false'],
    ['NO_ALWAYS_GREEN','npm run canon:test','echo PASS'],['CANON_REQUIRED','npm run canon:check','echo PASS'],
    ['NO_DEPLOY','node scripts/vercel-prebuilt-contract.mjs build','vercel deploy --prebuilt'],
    ['NO_PROD','node scripts/vercel-prebuilt-contract.mjs build','vercel build --prod'],
    ['CLI_PIN','vercel@64.7.0','vercel@latest'],['ATTEST_REQUIRED','uses: actions/attest@','uses: other/attest@'],
    ['VERIFY_REQUIRED','node scripts/vercel-prebuilt-contract.mjs verify','echo PASS'],
    ['SIGNATURE_PERMISSION','attestations: write','attestations: read'],
  ]){const changed=workflow.replace(from,to);assert.notEqual(changed,workflow);reject('WORKFLOW_'+name,'A22_WORKFLOW_CHANGED',()=>verifyPrebuiltWorkflow(changed));}
  pass('ATTEST_ARTIFACT_METADATA_PERMISSION',()=>assert.match(workflow,/      attestations: write\n      artifact-metadata: write\n/));
  pass('PINNED_PREVIEW_TARGET_NO_PRIVATE_ENV_PULL',()=>{
    const source=fs.readFileSync(path.join(repoRoot,'scripts/vercel-prebuilt-contract.mjs'),'utf8');
    assert(source.includes("'build','--target=preview','--non-interactive'"));
    assert(source.includes('A22_PREVIEW_ENV_CACHE_NOT_AUTHORIZED'));
    assert(!/vercel\s+pull|['\"]pull['\"]/.test(source));
    assert(!/vercel\s+pull/.test(workflow));
  });
  pass('SYNTHETIC_OUTPUT_STRUCTURE_ONLY',()=>assert.equal(inspectOutput(files).publicationAuthorized,false));
  reject('WRONG_OUTPUT_VERSION','A22_BUILD_OUTPUT_V3_REQUIRED',()=>inspectOutput(changeConfig(c=>c.version=2)));
  pass('PINNED_CLI_INERT_METADATA',()=>inspectOutput(changeConfig(c=>{c.framework={slug:'vite',version:'6.4.3'};c.crons=[];})));
  reject('WRONG_FRAMEWORK','A22_FRAMEWORK_CHANGED',()=>inspectOutput(changeConfig(c=>c.framework={slug:'other',version:'1.0.0'})));
  reject('CRONS_FORBIDDEN','A22_CRONS_FORBIDDEN',()=>inspectOutput(changeConfig(c=>c.crons=[{path:'/api',schedule:'* * * * *'}])));
  reject('MISSING_ROUTE','A22_ROUTE_CONTRACT_CHANGED',()=>inspectOutput(changeConfig(c=>c.routes.pop())));
  reject('SHADOW_ROUTE','A22_ROUTE_CONTRACT_CHANGED',()=>inspectOutput(changeConfig(c=>c.routes.splice(2,0,{src:'/(.*)',dest:'/other.html'}))));
  reject('WRONG_ROUTE','A22_ROUTE_CONTRACT_CHANGED',()=>inspectOutput(changeConfig(c=>c.routes[8].dest='/manager.html')));
  reject('REWRITE_EXISTENCE_CHECK_REQUIRED','A22_ROUTE_CONTRACT_CHANGED',()=>inspectOutput(changeConfig(c=>delete c.routes[2].check)));
  reject('FILESYSTEM_PRECEDENCE','A22_FILESYSTEM_ROUTE_CHANGED',()=>inspectOutput(changeConfig(c=>c.routes[1]={handle:'miss'})));
  reject('MISSING_HEADER','A22_HEADER_CONTRACT_CHANGED',()=>inspectOutput(changeConfig(c=>delete c.routes[0].headers['X-Frame-Options'])));
  reject('UNSAFE_HEADER','A22_HEADER_CONTRACT_CHANGED',()=>inspectOutput(changeConfig(c=>c.routes[0].headers['X-Frame-Options']='ALLOWALL')));
  reject('SHADOW_OVERRIDE','A22_OVERRIDES_CHANGED',()=>inspectOutput(changeConfig(c=>c.overrides={'manager.html':{path:'other'}})));
  reject('HTML_REFERENCES_MISSING_ASSET','A22_HTML_ASSET_MISSING',()=>inspectOutput(new Map([...files,['static/manager.html',Buffer.from('<script src="/assets/missing.js"></script>')]])));
  reject('HTML_EXTERNAL_ENTRY','A22_HTML_ASSET_MISSING',()=>inspectOutput(new Map([...files,['static/manager.html',Buffer.from('<script src="https://example.invalid/app.js"></script>')]])));
  reject('SERVER_FUNCTIONS_FORBIDDEN','A22_UNEXPECTED_OUTPUT_FILE',()=>inspectOutput(new Map([...files,['functions/server.func/index.js',Buffer.from('unsafe')]])));
  for(const name of ['static/.env','static/assets/debug.map','static/private.key','static/data.sql'])reject('PRIVATE_PATH_'+name,'A22_SENSITIVE_FILE',()=>inspectOutput(new Map([...files,[name,Buffer.from('synthetic')]])));
  for(const bytes of ['-----BEGIN PRIVATE KEY-----','sb_secret_SYNTHETIC_PRIVATE_FOR_NEGATIVE_TEST','github_pat_SYNTHETIC_PRIVATE_FOR_NEGATIVE_TEST','http://example.invalid?password=synthetic-private'])reject('PRIVATE_CONTENT_'+controls,'A22_PRIVATE_CONTENT',()=>inspectOutput(new Map([...files,['static/assets/private.js',Buffer.from(bytes)]])));
  const tar=makePackage(files,context),report=inspectPackage(tar,context);
  pass('DETERMINISTIC_REGULAR_TAR',()=>assert.deepEqual(makePackage(files,context),tar));
  pass('PACKAGE_IS_EXPLICITLY_UNATTESTED',()=>assert.equal(report.remoteEvidenceVerified,false));
  const archivePath=path.join(dir,'prebuilt.tar');fs.writeFileSync(archivePath,tar);
  for(const[key,value]of [['sourceSha','0'.repeat(40)],['repository','other/repo'],['workflow','other.yml'],['projectId','prj_Other'],['teamId','team_Other'],['environment','production'],['runId','1'],['runAttempt','2']])reject('MANIFEST_REJECTS_'+key,'A22_MANIFEST_IDENTITY_MISMATCH',()=>inspectPackage(tar,{...context,[key]:value}));
  const changed=unpackTar(tar);changed.set('.vercel/output/static/assets/manager.js',Buffer.from('TAMPERED'));
  reject('ARTIFACT_BYTES_ADULTERATED','A22_PACKAGE_TAMPERED',()=>inspectPackage(packTar(changed),context));
  const padded=Buffer.from(tar);padded[148]^=1;
  reject('TAR_HEADER_TAMPERED','A22_UNSAFE_ARCHIVE',()=>unpackTar(padded));
  reject('TAR_TRAVERSAL','A22_UNSAFE_ARCHIVE',()=>packTar(new Map([['../escape',Buffer.from('x')]])));
  const linked=Buffer.from(tar);linked[156]=50;
  reject('TAR_SYMLINK','A22_UNSAFE_ARCHIVE',()=>unpackTar(linked));
  reject('TAR_DUPLICATE','A22_UNSAFE_ARCHIVE',()=>unpackTar(Buffer.concat([tar.subarray(0,tar.length-1024),tar])));
  reject('TAR_TRUNCATED','A22_UNSAFE_ARCHIVE',()=>unpackTar(tar.subarray(0,tar.length-512)));
  const outputDir=path.join(dir,'.vercel/output');fs.mkdirSync(outputDir,{recursive:true});
  for(const[name,b]of files){const p=path.join(outputDir,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}
  fs.writeFileSync(path.join(outputDir,'builds.json'),'{}');fs.mkdirSync(path.join(outputDir,'diagnostics'));
  pass('CLI_DIAGNOSTICS_EXPLICITLY_EXCLUDED',()=>assert.equal(readOutput(dir).size,5));
  if(process.platform!=='win32'){
    fs.symlinkSync('../manager.html',path.join(outputDir,'static/assets/link.html'));
    reject('REAL_FILESYSTEM_SYMLINK','A22_SYMLINK_REJECTED',()=>readOutput(dir));
    fs.unlinkSync(path.join(outputDir,'static/assets/link.html'));
  }
  const workflowURI='https://github.com/'+POLICY.repository+'/'+PREBUILT_WORKFLOW+'@'+POLICY.ref;
  const cert={issuer:'https://token.actions.githubusercontent.com',subjectAlternativeName:workflowURI,buildSignerURI:workflowURI,buildSignerDigest:context.sourceSha,
    sourceRepositoryURI:'https://github.com/'+POLICY.repository,sourceRepositoryDigest:context.sourceSha,sourceRepositoryRef:POLICY.ref,
    buildConfigURI:workflowURI,buildConfigDigest:context.sourceSha,buildTrigger:'workflow_dispatch',runnerEnvironment:'github-hosted',
    runInvocationURI:'https://github.com/'+POLICY.repository+'/actions/runs/'+context.runId+'/attempts/'+context.runAttempt};
  const claims=[{verificationResult:{signature:{certificate:cert},verifiedTimestamps:[{type:'synthetic policy fixture ONLY'}],
    statement:{_type:'https://in-toto.io/Statement/v1',predicateType:'https://slsa.dev/provenance/v1',subject:[{name:'prebuilt.tar',digest:{sha256:sha256(tar)}}]}}}];
  pass('CLAIM_POLICY_FIXTURE_NEVER_TRUSTED',()=>assert.equal(inspectVerifiedClaims(claims,sha256(tar),context).remoteEvidenceVerified,false));
  for(const field of Object.keys(cert)){
    const changed=structuredClone(claims);changed[0].verificationResult.signature.certificate[field]='untrusted';
    reject('CERTIFICATE_REJECTS_'+field,'A22_CERTIFICATE_IDENTITY_MISMATCH',()=>inspectVerifiedClaims(changed,sha256(tar),context));
  }
  reject('MISSING_VERIFICATION_EVIDENCE','A22_ATTESTATION_EVIDENCE_REQUIRED',()=>inspectVerifiedClaims([],sha256(tar),context));
  const noTime=structuredClone(claims);noTime[0].verificationResult.verifiedTimestamps=[];
  reject('MISSING_SIGNED_TIMESTAMP','A22_SIGNED_TIMESTAMP_REQUIRED',()=>inspectVerifiedClaims(noTime,sha256(tar),context));
  reject('WRONG_SIGNED_DIGEST','A22_ATTESTED_SUBJECT_MISMATCH',()=>inspectVerifiedClaims(claims,'0'.repeat(64),context));
  reject('MISSING_SIGNATURE_FAILS_CLOSED','A22_SIGNATURE_REQUIRED',()=>verifyAttestation(archivePath,undefined,context));
  // Invoke the actual cryptographic verifier, never a PATH shim or mocked PASS.
  const gh=spawnSync('gh',['--version'],{encoding:'utf8',timeout:10000});assert.ifError(gh.error);assert.equal(gh.status,0,'GH_VERIFIER_REQUIRED');
  const invalidBundle=path.join(dir,'invalid-signature.json');
  fs.writeFileSync(invalidBundle,JSON.stringify({mediaType:'application/vnd.dev.sigstore.bundle.v0.3+json',verificationMaterial:{},dsseEnvelope:{payloadType:'application/vnd.in-toto+json',payload:Buffer.from(JSON.stringify(claims)).toString('base64'),signatures:[{sig:Buffer.alloc(64).toString('base64')}]}}));
  reject('INVALID_SIGNATURE_REAL_GH_REJECTS','A22_SIGNATURE_VERIFICATION_FAILED',()=>verifyAttestation(archivePath,invalidBundle,context));
  const selfClaim=path.join(dir,'self-approved.json');fs.writeFileSync(selfClaim,JSON.stringify({approved:true,verificationResult:claims}));
  reject('SELF_APPROVAL_IS_NOT_A_SIGNATURE','A22_SIGNATURE_VERIFICATION_FAILED',()=>verifyAttestation(archivePath,selfClaim,context));
  for(const argument of ['deploy','redeploy','--prod','--skip']){
    const run=spawnSync(process.execPath,[path.join(repoRoot,'scripts/vercel-prebuilt-contract.mjs'),argument],{encoding:'utf8',timeout:10000});
    pass('CLI_REJECTS_'+argument,()=>{assert.equal(run.status,1);assert(run.stderr.includes('A22_UNSUPPORTED_COMMAND'));});
  }
  console.log(JSON.stringify({result:'PASS',controls,realGitHubAttestation:'PENDING_REMOTE_EXECUTION',syntheticFixturesTrusted:false,publicationAuthorized:false}));
  console.log('A22_PREBUILT_CONTRACT=PASS');
}finally{
  const resolved=fs.realpathSync(dir);assert.equal(path.dirname(resolved),tmp);assert(path.basename(resolved).startsWith('xandeflix-a22a-'));
  fs.rmSync(resolved,{recursive:true,force:true});
}
