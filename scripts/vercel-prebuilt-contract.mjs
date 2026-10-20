// CANON-01-VERCEL-A22A. Build/attest only: no publication entry point.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const PREBUILT_GATE='CANON-01-VERCEL-A22A';
export const PREBUILT_WORKFLOW='.github/workflows/vercel-prebuilt-attested.yml';
export const PREBUILT_SCRIPT='scripts/vercel-prebuilt-contract.mjs';
export const PREBUILT_TEST='scripts/test-vercel-prebuilt-contract.mjs';
export const PREBUILT_WORKFLOW_SHA256='537b97b586af931d76797df7314083c206e5dc03da259283cf8e3195824a3326';
export const POLICY=Object.freeze({repository:'xandeflix2/xandeflix-prebuilt',
  baseline:'b3fc8d1e3844bc5601813ab1b298289af5b3f1fd',
  receivedHead:'a27d7cd4a74bd447221bba2851ee0af033d0a2fd',
  ref:'refs/heads/governance/canon-01-hardening',
  projectId:'prj_OJcEZDNVPI3NV8Z1GfHOB02v20TF',
  projectName:'xandeflix-prebuilt-nm3x',teamId:'team_gHZGQz2zRhEWsyK2jfOLLD5t',
  environment:'preview',cliVersion:'64.7.0'});
const PACKAGE_DIR='tmp/canon-01-a22a-package';
const ARCHIVE='prebuilt.tar';
const MAX_FILE=24*1024*1024,MAX_TOTAL=128*1024*1024;
export class PrebuiltError extends Error {constructor(code){super(code);this.code=code;}}
const need=(value,code)=>{if(!value)throw new PrebuiltError(code)};
export const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const gitSha=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const positive=v=>typeof v==='string'&&/^[1-9][0-9]{0,15}$/.test(v)&&Number.isSafeInteger(Number(v));
const exactKeys=(value,keys)=>value&&same(Object.keys(value).sort(),keys.sort());
const json=bytes=>{try{return JSON.parse(Buffer.from(bytes).toString('utf8'))}catch{throw new PrebuiltError('A22_JSON_INVALID')}};
const run=(command,args,options={})=>{try{return execFileSync(command,args,{encoding:'utf8',maxBuffer:16*1024*1024,timeout:60000,stdio:['ignore','pipe','pipe'],...options})}catch{throw new PrebuiltError('A22_COMMAND_FAILED')}};

export function verifyPrebuiltWorkflow(bytes){
  need(sha256(Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n'))===PREBUILT_WORKFLOW_SHA256,'A22_WORKFLOW_CHANGED');
  return {result:'PASS',publicationAuthorized:false};
}

// Claims alone are never signature evidence. The runtime derives these only
// from GitHub's event context, not from an artifact or a caller-supplied JSON.
export function contextFromEnvironment(env){
  need(env.GITHUB_ACTIONS==='true'&&env.RUNNER_ENVIRONMENT==='github-hosted','A22_HOSTED_ACTIONS_REQUIRED');
  need(env.GITHUB_SERVER_URL==='https://github.com'&&env.GITHUB_REPOSITORY===POLICY.repository,'A22_REPOSITORY_MISMATCH');
  need(env.GITHUB_EVENT_NAME==='workflow_dispatch'&&env.GITHUB_REF===POLICY.ref,'A22_MANUAL_REVIEW_BRANCH_REQUIRED');
  need(gitSha(env.EXPECTED_SOURCE_SHA)&&env.GITHUB_SHA===env.EXPECTED_SOURCE_SHA&&env.GITHUB_WORKFLOW_SHA===env.GITHUB_SHA,'A22_SOURCE_SHA_MISMATCH');
  const workflowRef=POLICY.repository+'/'+PREBUILT_WORKFLOW+'@'+POLICY.ref;
  need(env.GITHUB_WORKFLOW_REF===workflowRef,'A22_WORKFLOW_IDENTITY_MISMATCH');
  need(positive(env.GITHUB_RUN_ID)&&positive(env.GITHUB_RUN_ATTEMPT),'A22_RUN_ID_INVALID');
  return {schema:1,repository:POLICY.repository,sourceSha:env.GITHUB_SHA,
    referenceCommit:POLICY.baseline,workflow:PREBUILT_WORKFLOW,ref:POLICY.ref,
    runId:env.GITHUB_RUN_ID,runAttempt:env.GITHUB_RUN_ATTEMPT,
    projectId:POLICY.projectId,teamId:POLICY.teamId,
    environment:POLICY.environment,cliVersion:POLICY.cliVersion};
}

export function verifyGitSource(root,context){
  const git=args=>{try{return execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']}).trim()}catch{throw new PrebuiltError('A22_GIT_OR_BASELINE_UNAVAILABLE')}};
  need(fs.realpathSync(git(['rev-parse','--show-toplevel']))===fs.realpathSync(root),'A22_WORKSPACE_MISMATCH');
  need(git(['remote','get-url','origin']).replace(/\.git$/,'')==='https://github.com/'+POLICY.repository,'A22_GIT_REPOSITORY_MISMATCH');
  need(git(['rev-parse',POLICY.baseline+'^{commit}'])===POLICY.baseline&&git(['rev-parse',POLICY.receivedHead+'^{commit}'])===POLICY.receivedHead,'A22_BASELINE_MISMATCH');
  need(git(['rev-parse','HEAD'])===context.sourceSha,'A22_GIT_SHA_MISMATCH');
  need(git(['rev-parse','--is-shallow-repository'])==='false','A22_FULL_HISTORY_REQUIRED');
  git(['merge-base','--is-ancestor',POLICY.baseline,context.sourceSha]);
  git(['merge-base','--is-ancestor',POLICY.receivedHead,context.sourceSha]);
  need(git(['status','--porcelain','--untracked-files=all'])==='','A22_DIRTY_SOURCE');
  verifyPrebuiltWorkflow(fs.readFileSync(path.join(root,PREBUILT_WORKFLOW)));
  return {result:'SOURCE_CONTEXT_ONLY',publicationAuthorized:false};
}

export function validatePublicConfig(env){
  need(env.VITE_SUPABASE_URL==='https://cujbmyhitgomlgwfkaat.supabase.co'&&
    /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(env.VITE_SUPABASE_PUBLISHABLE_KEY||''),'A22_PUBLIC_CONFIG_REQUIRED');
}
export function requireReadToken(env){need(typeof env.VERCEL_TOKEN==='string'&&env.VERCEL_TOKEN.trim().length>0,'A22_READ_TOKEN_REQUIRED');}

// Raw project JSON (which may contain other settings) never reaches a file/log.
export function selectProjectSettings(project){
  need(project?.id===POLICY.projectId&&project.accountId===POLICY.teamId&&project.name===POLICY.projectName,'A22_PROJECT_MISMATCH');
  need(project.link?.type==='github'&&project.link.repo==='xandeflix-prebuilt'&&project.link.org==='xandeflix2','A22_PROJECT_REPOSITORY_MISMATCH');
  need(project.framework==='vite'&&project.nodeVersion==='24.x'&&
    (project.rootDirectory===null||project.rootDirectory==='')&&
    [null,'npm run site:build'].includes(project.buildCommand)&&[null,'npm ci'].includes(project.installCommand)&&
    [null,'tmp/c154-web-production/site'].includes(project.outputDirectory),'A22_PROJECT_SETTINGS_MISMATCH');
  return {orgId:POLICY.teamId,projectId:POLICY.projectId,projectName:POLICY.projectName,
    settings:{framework:'vite',nodeVersion:'24.x',rootDirectory:null,
      buildCommand:'npm run site:build',installCommand:'npm ci',outputDirectory:'tmp/c154-web-production/site'}};
}

const safeName=name=>typeof name==='string'&&name.length<=255&&/^[A-Za-z0-9_.\/-]+$/.test(name)&&
  !name.startsWith('/')&&name.split('/').every(p=>p&&p!=='.'&&p!=='..');
function scanPayload(name,bytes){
  need(safeName(name),'A22_UNSAFE_PATH');
  need(!/(?:^|\/)(?:\.env[^/]*|\.git|node_modules|secrets?|credentials?|project\.json)(?:\/|$)/i.test(name)&&
    !/\.(?:map|pem|key|jks|p12|apk|aab|log|zip|sql|ts|tsx)$/i.test(name),'A22_SENSITIVE_FILE');
  need(/\.(?:json|html|js|css|txt|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf)$/.test(name),'A22_UNREVIEWED_FILE_TYPE');
  need(bytes.length<=MAX_FILE,'A22_FILE_TOO_LARGE');
  if(/\.(?:json|html|js|css|txt|svg)$/.test(name)){
    const s=bytes.toString('utf8');
    need(!/-----BEGIN [A-Z ]*PRIVATE KEY-----|sb_secret_[A-Za-z0-9_-]+|(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{16,}|AKIA[A-Z0-9]{16}|\bvc[prk]_[A-Za-z0-9_-]{16,}/.test(s),'A22_PRIVATE_CONTENT');
    for(const token of s.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)||[]){
      let claim;try{claim=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'))}catch{throw new PrebuiltError('A22_PRIVATE_CONTENT')}
      need(claim.role==='anon','A22_PRIVATE_CONTENT');
    }
    need(!/https?:\/\/[^\s"'<>]*[?&](?:password|token|username)=[^\s"'<>]{3,}|https?:\/\/[^\s/"'<>]+:[^\s/"'<>]+@/i.test(s),'A22_PRIVATE_CONTENT');
  }
}

const REWRITES=[['/','/manager.html'],['/admin','/manager.html'],['/master','/manager.html'],['/manager','/manager.html'],['/manager-reset-password','/manager.html'],['/activate-device','/manager.html'],['/app','/app/app.html'],['/app/','/app/app.html']];
const HEADERS={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
export function inspectOutput(files){
  need(files instanceof Map&&files.size>=5,'A22_OUTPUT_INCOMPLETE');
  let total=0;
  for(const[name,bytes]of files){
    need(name==='config.json'||name.startsWith('static/'),'A22_UNEXPECTED_OUTPUT_FILE');
    need(Buffer.isBuffer(bytes),'A22_NON_REGULAR_FILE');scanPayload(name,bytes);total+=bytes.length;
  }
  need(total<=MAX_TOTAL,'A22_OUTPUT_TOO_LARGE');
  const config=json(files.get('config.json')||Buffer.alloc(0));
  need(config&&Object.keys(config).every(k=>['version','routes','overrides','framework','crons'].includes(k)),'A22_OUTPUT_CONFIG_CHANGED');
  need(!Object.hasOwn(config,'framework')||same(config.framework,{slug:'vite',version:'6.4.3'}),'A22_FRAMEWORK_CHANGED');
  need(!Object.hasOwn(config,'crons')||same(config.crons,[]),'A22_CRONS_FORBIDDEN');
  need(config.version===3&&Array.isArray(config.routes),'A22_BUILD_OUTPUT_V3_REQUIRED');
  // Vercel's high-level headers/rewrites are compiled by routing-utils into
  // this low-level contract. Only reviewed equivalents of each regex pass.
  const routes=config.routes;
  need(routes.length===10,'A22_ROUTE_CONTRACT_CHANGED');
  const h=routes[0];
  need(exactKeys(h,['src','headers','continue'])&&['^(?:/(.*))$','^/(.*)$','/(.*)'].includes(h.src)&&
    h.continue===true&&same(h.headers,HEADERS),'A22_HEADER_CONTRACT_CHANGED');
  need(same(routes[1],{handle:'filesystem'}),'A22_FILESYSTEM_ROUTE_CHANGED');
  for(let i=0;i<REWRITES.length;i++){
    const [source,destination]=REWRITES[i],r=routes[i+2];
    need(exactKeys(r,['src','dest','check'])&&r.src==='^'+source+'$'&&r.dest===destination&&r.check===true,'A22_ROUTE_CONTRACT_CHANGED');
  }
  need(!config.overrides||Object.keys(config.overrides).length===0,'A22_OVERRIDES_CHANGED');
  for(const f of ['static/manager.html','static/app/app.html'])need(files.has(f),'A22_ROUTE_ASSET_MISSING');
  for(const htmlPath of ['static/manager.html','static/app/app.html']){
    const html=files.get(htmlPath).toString('utf8');
    const tags=html.match(/<(?:script|link)\b[^>]*>/gi)||[];
    need(tags.some(tag=>/^<script\b/i.test(tag)&&/\bsrc=/.test(tag)),'A22_HTML_ENTRY_REQUIRED');
    for(const tag of tags){
      const match=tag.match(/\b(?:src|href)=["']([^"']+)["']/i);if(!match)continue;
      const url=new URL(match[1],'https://artifact.invalid/'+htmlPath.slice('static/'.length));
      need(url.origin==='https://artifact.invalid'&&!url.search&&!url.hash&&
        files.has('static'+url.pathname),'A22_HTML_ASSET_MISSING');
    }
  }
  need([...files.keys()].some(f=>/^static\/assets\/.+\.js$/.test(f))&&
    [...files.keys()].some(f=>/^static\/app\/assets\/.+\.js$/.test(f)),'A22_BUNDLE_MISSING');
  const records=[...files].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([name,b])=>({path:name,size:b.length,sha256:sha256(b)}));
  return {records,routes:8,headers:4,payloadSha256:sha256(JSON.stringify(records)),publicationAuthorized:false};
}

export function readOutput(root){
  const output=path.join(root,'.vercel/output'),files=new Map();
  need(fs.existsSync(output)&&!fs.lstatSync(output).isSymbolicLink(),'A22_OUTPUT_MISSING');
  const visit=(relative,depth)=>{
    need(depth<=16&&files.size<15000,'A22_OUTPUT_LIMIT');
    const full=path.join(output,relative),st=fs.lstatSync(full);
    need(!st.isSymbolicLink(),'A22_SYMLINK_REJECTED');
    if(st.isDirectory())for(const name of fs.readdirSync(full).sort())visit(relative?relative+'/'+name:name,depth+1);
    else {need(st.isFile(),'A22_NON_REGULAR_FILE');need(st.size<=MAX_FILE,'A22_FILE_TOO_LARGE');files.set(relative,fs.readFileSync(full));}
  };
  // Explicitly exclude CLI diagnostics/builds.json, never configuration/static.
  visit('config.json',0);visit('static',0);
  need(fs.readdirSync(output).every(f=>['config.json','static','builds.json','diagnostics'].includes(f)),'A22_UNEXPECTED_OUTPUT_FILE');
  inspectOutput(files);return files;
}

// Deterministic, bounded ustar: regular files only, no external tar extraction.
export function packTar(entries){
  const chunks=[];
  for(const[name,bytes]of [...entries].sort(([a],[b])=>a<b?-1:a>b?1:0)){
    need(safeName(name)&&bytes.length<=MAX_FILE,'A22_UNSAFE_ARCHIVE');
    const header=Buffer.alloc(512);let leaf=name,prefix='';
    if(name.length>100){const at=name.lastIndexOf('/');prefix=name.slice(0,at);leaf=name.slice(at+1);}
    need(leaf.length<=100&&prefix.length<=155,'A22_UNSAFE_ARCHIVE');
    header.write(leaf,0);header.write('0000644\0',100);header.write('0000000\0',108);header.write('0000000\0',116);
    header.write(bytes.length.toString(8).padStart(11,'0')+'\0',124);header.write('00000000000\0',136);header.fill(32,148,156);
    header[156]=48;header.write('ustar\0',257);header.write('00',263);header.write(prefix,345);
    const sum=header.reduce((a,b)=>a+b,0);header.write(sum.toString(8).padStart(6,'0')+'\0 ',148);
    chunks.push(header,bytes,Buffer.alloc((512-bytes.length%512)%512));
  }
  chunks.push(Buffer.alloc(1024));const tar=Buffer.concat(chunks);need(tar.length<=MAX_TOTAL,'A22_OUTPUT_TOO_LARGE');return tar;
}
export function unpackTar(bytes){
  need(Buffer.isBuffer(bytes)&&bytes.length<=MAX_TOTAL&&bytes.length%512===0,'A22_UNSAFE_ARCHIVE');
  const entries=new Map();let offset=0;
  const str=(b,start,end)=>b.subarray(start,end).toString('ascii').split('\0')[0];
  while(offset+1024<=bytes.length){
    const h=bytes.subarray(offset,offset+512);
    if(h.every(b=>b===0)){need(bytes.subarray(offset).every(b=>b===0),'A22_UNSAFE_ARCHIVE');break;}
    const leaf=str(h,0,100),prefix=str(h,345,500),name=prefix?prefix+'/'+leaf:leaf;
    need(safeName(name)&&!entries.has(name)&&h[156]===48&&str(h,257,263)==='ustar','A22_UNSAFE_ARCHIVE');
    const sizeText=str(h,124,136),sumText=str(h,148,156).trim();
    need(/^[0-7]+$/.test(sizeText)&&/^[0-7]+$/.test(sumText),'A22_UNSAFE_ARCHIVE');
    const size=parseInt(sizeText,8),sum=parseInt(sumText,8),copy=Buffer.from(h);copy.fill(32,148,156);
    need(copy.reduce((a,b)=>a+b,0)===sum&&size<=MAX_FILE,'A22_UNSAFE_ARCHIVE');
    const start=offset+512,end=start+size;need(end<=bytes.length,'A22_UNSAFE_ARCHIVE');
    entries.set(name,bytes.subarray(start,end));need(entries.size<=15000,'A22_OUTPUT_LIMIT');offset=start+Math.ceil(size/512)*512;
  }
  need(entries.size>0&&offset+1024<=bytes.length&&bytes.subarray(offset).every(b=>b===0),'A22_UNSAFE_ARCHIVE');
  // Also rejects noncanonical headers, hidden data/padding, modes and duplicates.
  need(packTar(entries).equals(bytes),'A22_NONCANONICAL_ARCHIVE');return entries;
}
export function makePackage(files,context){
  const inspected=inspectOutput(files);
  const manifest={...context,files:inspected.records,payloadSha256:inspected.payloadSha256};
  return packTar(new Map([['manifest.json',Buffer.from(JSON.stringify(manifest)+'\n')],
    ...[...files].map(([name,bytes])=>['.vercel/output/'+name,bytes])]));
}
export function inspectPackage(bytes,context){
  const entries=unpackTar(bytes),manifest=json(entries.get('manifest.json')||Buffer.alloc(0));
  need(exactKeys(manifest,[...Object.keys(context),'files','payloadSha256']),'A22_MANIFEST_SCHEMA_CHANGED');
  for(const[key,value]of Object.entries(context))need(manifest[key]===value,'A22_MANIFEST_IDENTITY_MISMATCH');
  const files=new Map();
  for(const[name,b]of entries)if(name!=='manifest.json'){
    need(name.startsWith('.vercel/output/'),'A22_UNEXPECTED_ARCHIVE_FILE');files.set(name.slice('.vercel/output/'.length),b);
  }
  const inspected=inspectOutput(files);
  need(same(manifest.files,inspected.records)&&manifest.payloadSha256===inspected.payloadSha256,'A22_PACKAGE_TAMPERED');
  return {status:'UNATTESTED_PACKAGE_INTEGRITY_ONLY',artifactSha256:sha256(bytes),
    fileCount:files.size,publicationAuthorized:false,remoteEvidenceVerified:false};
}

// This function checks policy ONLY. It cannot validate a signature or grant
// trust to caller-supplied JSON. verifyAttestation always calls gh first.
export function inspectVerifiedClaims(results,digest,context){
  need(Array.isArray(results)&&results.length===1,'A22_ATTESTATION_EVIDENCE_REQUIRED');
  const result=results[0]?.verificationResult,cert=result?.signature?.certificate;
  const workflowURI='https://github.com/'+POLICY.repository+'/'+PREBUILT_WORKFLOW+'@'+POLICY.ref;
  const expected={issuer:'https://token.actions.githubusercontent.com',
    subjectAlternativeName:workflowURI,buildSignerURI:workflowURI,
    buildSignerDigest:context.sourceSha,sourceRepositoryURI:'https://github.com/'+POLICY.repository,
    sourceRepositoryDigest:context.sourceSha,sourceRepositoryRef:POLICY.ref,
    buildConfigURI:workflowURI,buildConfigDigest:context.sourceSha,
    buildTrigger:'workflow_dispatch',runnerEnvironment:'github-hosted',
    runInvocationURI:'https://github.com/'+POLICY.repository+'/actions/runs/'+context.runId+'/attempts/'+context.runAttempt};
  for(const[k,v]of Object.entries(expected))need(cert?.[k]===v,'A22_CERTIFICATE_IDENTITY_MISMATCH');
  need(Array.isArray(result.verifiedTimestamps)&&result.verifiedTimestamps.length>0,'A22_SIGNED_TIMESTAMP_REQUIRED');
  const statement=result.statement;
  need(statement?._type==='https://in-toto.io/Statement/v1'&&statement.predicateType==='https://slsa.dev/provenance/v1'&&
    Array.isArray(statement.subject)&&statement.subject.length===1&&
    statement.subject[0].name===ARCHIVE&&exactKeys(statement.subject[0].digest,['sha256'])&&
    statement.subject[0].digest.sha256===digest,'A22_ATTESTED_SUBJECT_MISMATCH');
  return {status:'CLAIM_POLICY_ONLY',publicationAuthorized:false,remoteEvidenceVerified:false};
}
export function verifyAttestation(archivePath,bundlePath,context){
  need(typeof bundlePath==='string'&&bundlePath.length>0&&fs.existsSync(bundlePath)&&
    fs.lstatSync(bundlePath).isFile()&&!fs.lstatSync(bundlePath).isSymbolicLink(),'A22_SIGNATURE_REQUIRED');
  const bytes=fs.readFileSync(archivePath);inspectPackage(bytes,context);
  let verified;
  try{verified=execFileSync('gh',['attestation','verify',archivePath,'--bundle',bundlePath,
    '--repo',POLICY.repository,'--signer-workflow',POLICY.repository+'/'+PREBUILT_WORKFLOW,
    '--signer-digest',context.sourceSha,'--source-digest',context.sourceSha,
    '--source-ref',POLICY.ref,'--cert-oidc-issuer','https://token.actions.githubusercontent.com',
    '--deny-self-hosted-runners','--format','json'],{encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});
  }catch{throw new PrebuiltError('A22_SIGNATURE_VERIFICATION_FAILED')}
  inspectVerifiedClaims(json(verified),sha256(bytes),context);
  return {status:'GITHUB_SIGNATURE_AND_PACKAGE_VERIFIED',artifactSha256:sha256(bytes),
    repository:POLICY.repository,workflow:PREBUILT_WORKFLOW,sourceSha:context.sourceSha,
    runId:context.runId,runAttempt:context.runAttempt,projectId:POLICY.projectId,
    teamId:POLICY.teamId,environment:'preview',publicationAuthorized:false};
}

function cliPath(){
  need(process.env.RUNNER_TEMP&&path.isAbsolute(process.env.RUNNER_TEMP),'A22_CLI_REQUIRED');
  const base=path.join(process.env.RUNNER_TEMP,'xandeflix-vercel/node_modules/vercel');
  need(json(fs.readFileSync(path.join(base,'package.json'))).version===POLICY.cliVersion,'A22_CLI_VERSION_MISMATCH');
  return path.join(base,'dist/vc.js');
}
async function main(){
  need(process.argv.length===3&&['context','link','build','package','check-package','verify'].includes(process.argv[2]),'A22_UNSUPPORTED_COMMAND');
  const root=fileURLToPath(new URL('..',import.meta.url)),context=contextFromEnvironment(process.env);
  verifyGitSource(root,context);
  const command=process.argv[2],dir=path.join(root,PACKAGE_DIR),archivePath=path.join(dir,ARCHIVE);
  if(command==='context'){validatePublicConfig(process.env);}
  if(command==='link'){
    requireReadToken(process.env);validatePublicConfig(process.env);
    need(!fs.existsSync(path.join(root,'.vercel')),'A22_EXISTING_LINK_REJECTED');
    const info=json(run(process.execPath,[cliPath(),'project','inspect',POLICY.projectId,'--scope',POLICY.teamId,'--json','--non-interactive'],{cwd:root}));
    need(info.id===POLICY.projectId&&info.name===POLICY.projectName&&info.owner?.slug==='xandeflix2','A22_PROJECT_MISMATCH');
    // CLI inspect omits immutable account ID and Git link. Read just this
    // existing project via GET; never fetch environment values or write APIs.
    let remote;
    try{const response=await fetch('https://api.vercel.com/v9/projects/'+POLICY.projectId+'?teamId='+POLICY.teamId,
      {headers:{Authorization:'Bearer '+process.env.VERCEL_TOKEN},signal:AbortSignal.timeout(30000),redirect:'error'});
      need(response.ok,'A22_PROJECT_READ_PERMISSION_REQUIRED');remote=await response.json();
    }catch(e){if(e instanceof PrebuiltError)throw e;throw new PrebuiltError('A22_PROJECT_READ_FAILED')}
    const settings=selectProjectSettings(remote);
    fs.mkdirSync(path.join(root,'.vercel'));
    fs.writeFileSync(path.join(root,'.vercel/project.json'),JSON.stringify(settings)+'\n',{flag:'wx',mode:0o600});
  }
  if(command==='build'){
    need(!process.env.VERCEL_TOKEN&&!process.env.GH_TOKEN&&!process.env.GITHUB_TOKEN,'A22_BUILD_CREDENTIALS_REJECTED');validatePublicConfig(process.env);
    const link=json(fs.readFileSync(path.join(root,'.vercel/project.json')));
    need(same(link,selectProjectSettings({id:POLICY.projectId,name:POLICY.projectName,accountId:POLICY.teamId,
      link:{type:'github',repo:'xandeflix-prebuilt',org:'xandeflix2'},...link.settings})),'A22_LOCAL_LINK_CHANGED');
    need(!fs.existsSync(path.join(root,'.vercel/output'))&&!fs.existsSync(path.join(root,'.vercel/.env.preview.local')),'A22_STALE_BUILD_REJECTED');
    // Offline preparation cannot download or retain private preview variables in this gate.
    need(!fs.existsSync(path.join(root,'.vercel','.env.preview.local')),'A22_PREVIEW_ENV_CACHE_NOT_AUTHORIZED');
    run(process.execPath,[cliPath(),'build','--target=preview','--non-interactive'],{cwd:root,timeout:30*60*1000,stdio:['ignore','inherit','inherit']});
    const build=json(fs.readFileSync(path.join(root,'.vercel/output/builds.json')));
    need(build.cliVersion===POLICY.cliVersion&&build.target==='preview'&&!build.error,'A22_REAL_CLI_BUILD_REQUIRED');
    verifyGitSource(root,context);inspectOutput(readOutput(root));
  }
  if(command==='package'){
    need(!fs.existsSync(dir),'A22_STALE_PACKAGE_REJECTED');
    const build=json(fs.readFileSync(path.join(root,'.vercel/output/builds.json')));
    need(build.cliVersion===POLICY.cliVersion&&build.target==='preview'&&!build.error,'A22_REAL_CLI_BUILD_REQUIRED');
    const tar=makePackage(readOutput(root),context);inspectPackage(tar,context);
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(archivePath,tar,{flag:'wx'});
  }
  if(command==='check-package')inspectPackage(fs.readFileSync(archivePath),context);
  if(command==='verify'){
    need(process.env.GH_TOKEN,'A22_GITHUB_PERMISSION_REQUIRED');
    const bundle=process.env.PREBUILT_ATTESTATION_BUNDLE;
    const report=verifyAttestation(archivePath,bundle,context);
    fs.copyFileSync(bundle,path.join(dir,'attestation.sigstore.json'),fs.constants.COPYFILE_EXCL);
    fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    fs.writeFileSync(path.join(dir,'SHA256SUMS'),report.artifactSha256+'  '+ARCHIVE+'\n',{flag:'wx'});
  }
  console.log('A22_'+command.toUpperCase().replaceAll('-','_')+'=PASS; PUBLICATION_AUTHORIZED=NAO');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e instanceof PrebuiltError?e.code:'A22_FAIL_CLOSED');process.exitCode=1});
