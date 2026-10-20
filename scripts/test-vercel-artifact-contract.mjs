// CANON-01 A2.1 synthetic negative controls. No network, no Git writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeLocalManifest,inspectManifest,inspectSiteRoutes,authorizePublication,ArtifactError,A2_REPOSITORY,A2_BASELINE} from './verify-vercel-artifact.mjs';

assert.equal(process.argv.length,2,'A2_UNSUPPORTED_TEST_ARGS');
const root=fs.mkdtempSync(path.join(fs.realpathSync.native(os.tmpdir()),'xandeflix-a21-'));
let checks=0;
const ok=(label,fn)=>{fn();checks++;console.log('PASS '+label)};
const reject=(label,fn,code)=>ok(label,()=>assert.throws(fn,e=>e instanceof ArtifactError && e.code===code));
const expected={sourceSha:'f96a4b615d7877211f0341bd89bdbc29e64a5c66',workflow:'site-build-validation.yml',runId:39480980387,projectId:'prj_OJcEZDNVPI3NV8Z1GfHOB02v20TF',teamId:'team_gHZGQz2zRhEWsyK2jfOLLD5t',environment:'preview'};
const identity={repository:A2_REPOSITORY,referenceCommit:A2_BASELINE,...expected};
const config={outputDirectory:'tmp/c154-web-production/site',rewrites:[
{source:'/',destination:'/manager.html'}, {source:'/admin',destination:'/manager.html'},
{source:'/master',destination:'/manager.html'}, {source:'/manager',destination:'/manager.html'},
{source:'/manager-reset-password',destination:'/manager.html'},
{source:'/activate-device',destination:'/manager.html'},
{source:'/app',destination:'/app/app.html'}, {source:'/app/',destination:'/app/app.html'}],headers:[{source:'/(.*)',headers:[
{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},
{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]}]};
const put=(file,bytes='synthetic')=>{const p=path.join(root,...file.split('/'));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes)};
try {
  put('manager.html','<html>synthetic manager</html>');
  put('app/app.html','<html>synthetic app</html>');
  put('assets/manager.css','/* synthetic */');
  put('app/assets/main.js','/* synthetic */');
  let manifest=makeLocalManifest(root,identity);
  ok('LOCAL_MANIFEST_VALID',()=>assert.equal(inspectManifest(root,manifest,expected).publicationAuthorized,false));
  ok('ROUTES_AND_HEADERS_PASS',()=>assert.equal(inspectSiteRoutes(root,config).routesChecked,8));
  ok('LOCAL_STATUS_EXPLICIT',()=>assert.equal(inspectManifest(root,manifest,expected).status,'LOCAL_INTEGRITY_ONLY'));
  reject('WRONG_SHA',()=>inspectManifest(root,manifest,{...expected,sourceSha:'0'.repeat(40)}),'A2_PROVENANCE_MISMATCH');
  reject('WRONG_PROJECT',()=>inspectManifest(root,manifest,{...expected,projectId:'prj_OtherProject'}),'A2_PROVENANCE_MISMATCH');
  reject('WRONG_TEAM',()=>inspectManifest(root,manifest,{...expected,teamId:'team_OtherTeam'}),'A2_PROVENANCE_MISMATCH');
  reject('WRONG_ENVIRONMENT',()=>inspectManifest(root,manifest,{...expected,environment:'production'}),'A2_PROVENANCE_MISMATCH');
  reject('WRONG_WORKFLOW',()=>inspectManifest(root,manifest,{...expected,workflow:'unapproved.yml'}),'A2_PROVENANCE_MISMATCH');
  reject('WRONG_RUN',()=>inspectManifest(root,manifest,{...expected,runId:1}),'A2_PROVENANCE_MISMATCH');
  reject('INVALID_BASELINE',()=>makeLocalManifest(root,{...identity,referenceCommit:'0'.repeat(40)}),'A2_PROVENANCE_CLAIM_INVALID');
  reject('MANIFEST_SELF_DECLARED_UNKNOWN',()=>inspectManifest(root,{...manifest,approval:'PASS'},expected),'A2_MANIFEST_SCHEMA_INVALID');
  put('manager.html','TAMPERED');
  reject('TAMPERED_FILE',()=>inspectManifest(root,manifest,expected),'A2_CONTENT_DIGEST_MISMATCH');
  put('manager.html','<html>synthetic manager</html>');
  put('app/assets/another.js','added');
  reject('NEW_FILE_NOT_IN_MANIFEST',()=>inspectManifest(root,manifest,expected),'A2_FILE_LIST_MISMATCH');
  fs.unlinkSync(path.join(root,'app/assets/another.js'));
  manifest=makeLocalManifest(root,identity);
  reject('DUPLICATED_PATH',()=>inspectManifest(root,{...manifest,files:[...manifest.files,manifest.files[0]]},expected),'A2_FILE_LIST_MISMATCH');
  reject('PATH_TRAVERSAL',()=>inspectManifest(root,{...manifest,files:[{...manifest.files[0],path:'../outside'},...manifest.files.slice(1)]},expected),'A2_FILE_RECORD_INVALID');
  reject('MISSING_MANAGER_ROUTE',()=>inspectSiteRoutes(root,{...config,rewrites:config.rewrites.filter(x=>x.source!=='/manager')}),'A2_REQUIRED_REWRITE_MISSING');
  reject('MISSING_ADMIN_ROUTE',()=>inspectSiteRoutes(root,{...config,rewrites:config.rewrites.filter(x=>x.source!=='/admin')}),'A2_REQUIRED_REWRITE_MISSING');
  reject('SHADOW_APP_ROUTE',()=>inspectSiteRoutes(root,{...config,rewrites:[{source:'/app',destination:'/fake.html'},...config.rewrites]}),'A2_REWRITE_CONTRACT_CHANGED');
  reject('UNAPPROVED_CATCH_ALL',()=>inspectSiteRoutes(root,{...config,rewrites:[{source:'/(.*)',destination:'/fake.html'},...config.rewrites]}),'A2_REWRITE_CONTRACT_CHANGED');
  reject('CONFLICTING_HEADER_RULE',()=>inspectSiteRoutes(root,{...config,headers:[{source:'/(.*)',headers:[{key:'X-Frame-Options',value:'ALLOWALL'}]},...config.headers]}),'A2_HEADER_CONTRACT_CHANGED');
  reject('MISSING_SECURITY_HEADER',()=>inspectSiteRoutes(root,{...config,headers:[]}), 'A2_SECURITY_HEADER_MISSING');
  reject('WRONG_OUTPUT_DIRECTORY',()=>inspectSiteRoutes(root,{...config,outputDirectory:'dist'}),'A2_OUTPUT_PATH_CHANGED');
  reject('FAKE_APPROVAL_REJECTED',()=>authorizePublication({approved:true,checks:'PASS'}),'A2_REMOTE_ATTESTATION_AND_APPROVAL_NOT_IMPLEMENTED');
  reject('MISSING_REMOTE_ATTESTATION_REJECTED',()=>authorizePublication(), 'A2_REMOTE_ATTESTATION_AND_APPROVAL_NOT_IMPLEMENTED');
  put('.env','not-a-real-secret');
  reject('PRIVATE_FILE_REJECTED',()=>makeLocalManifest(root,identity),'A2_UNSAFE_ARTIFACT_PATH');
  fs.unlinkSync(path.join(root,'.env'));
  put('assets/debug.map','synthetic');
  reject('SOURCEMAP_REJECTED',()=>makeLocalManifest(root,identity),'A2_UNSAFE_ARTIFACT_PATH');
  fs.unlinkSync(path.join(root,'assets/debug.map'));
  if(process.platform!=='win32') {
    fs.symlinkSync('manager.html',path.join(root,'link.html'));
    reject('SYMLINK_REJECTED',()=>makeLocalManifest(root,identity),'A2_SYMLINK_REJECTED');
    fs.unlinkSync(path.join(root,'link.html'));
  }
  console.log(JSON.stringify({result:'PASS',controls:checks,networkCalls:0,publishingAuthorized:false}));
  console.log('A2_ARTIFACT_CONTRACT=PASS');
}finally {
  const p=fs.realpathSync(root),tmp=fs.realpathSync.native(os.tmpdir());
  assert.equal(path.dirname(p),tmp);
  assert(path.basename(p).startsWith('xandeflix-a21-'));
  fs.rmSync(p,{recursive:true,force:true});
}
