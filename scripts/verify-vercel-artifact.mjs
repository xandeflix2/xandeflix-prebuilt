// CANON-01 A2.1: local-only, non-publishing artefact integrity boundary.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const A2_SCHEMA = 1;
export const A2_REPOSITORY = 'xandeflix2/xandeflix-prebuilt';
export const A2_BASELINE = 'b3fc8d1e3844bc5601813ab1b298289af5b3f1fd';
export class ArtifactError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const requireA2 = (truth, code) => { if (!truth) throw new ArtifactError(code); };
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sha = value => typeof value === 'string' && /^[a-f\d]{64}$/.test(value);
const gitSha = value => typeof value === 'string' && /^[a-f\d]{40}$/.test(value);
const safePath = s => typeof s === 'string' && s.length > 0 && s.length <= 255 &&
  !s.includes('\\') && !s.includes('\\0') && !s.includes(':') &&
  !s.startsWith('/') && !s.endsWith('/') &&
  s.split('/').every(v => v && v !== '.' && v !== '..' && !v.startsWith('.'));

const forbiddenFile = file => /(?:^|\/)(?:\.env(?:\..*)?|\.git|node_modules|secrets|credentials|tmp)(?:\/|$)/i.test(file) ||
  /\.(?:jks|key|pem|apk|aab|map|log|zip)$/i.test(file);

function walkFiles(root) {
  const base = fs.realpathSync(root);
  const found = [];
  const visit = (relative, depth) => {
    requireA2(depth <= 16, 'A2_PATH_DEPTH_EXCEEDED');
    const where = relative ? path.join(base, ...relative.split('/')) : base;
    const items = fs.readdirSync(where, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'));
    for (const item of items) {
      const rel = relative ? `${relative}/${item.name}` : item.name;
      requireA2(safePath(rel) && !forbiddenFile(rel), 'A2_UNSAFE_ARTIFACT_PATH');
      const full = path.join(base, ...rel.split('/'));
      const st = fs.lstatSync(full);
      requireA2(!st.isSymbolicLink(), 'A2_SYMLINK_REJECTED');
      if (st.isDirectory()) visit(rel, depth + 1);
      else {
        requireA2(st.isFile(), 'A2_NON_REGULAR_FILE');
        requireA2(st.size <= 24*1024*1024, 'A2_FILE_SIZE_LIMIT');
        found.push({path:rel, size:st.size, sha256:sha256(fs.readFileSync(full))});
        requireA2(found.length <= 15000, 'A2_FILE_COUNT_LIMIT');
      }
    }
  };
  visit('',0);
  return found.sort((a,b)=>a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

export function makeLocalManifest(root, identity) {
  requireA2(identity && identity.repository === A2_REPOSITORY &&
    gitSha(identity.sourceSha) && identity.referenceCommit === A2_BASELINE &&
    identity.workflow && Number.isSafeInteger(identity.runId) && identity.runId > 0 &&
    /^prj_[A-Za-z0-9]+$/.test(identity.projectId||'') &&
    /^team_[A-Za-z0-9]+$/.test(identity.teamId||'') &&
    ['preview','production'].includes(identity.environment), 'A2_PROVENANCE_CLAIM_INVALID');
  const files=walkFiles(root);
  requireA2(files.length >= 3, 'A2_ARTIFACT_EMPTY');
  const manifest={schema:A2_SCHEMA, repository:A2_REPOSITORY,
    sourceSha:identity.sourceSha, referenceCommit:A2_BASELINE,
    workflow:identity.workflow, runId:identity.runId, projectId:identity.projectId,
    teamId:identity.teamId, environment:identity.environment, files};
  return Object.freeze(manifest);
}

export function inspectManifest(root, manifest, expected) {
  requireA2(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'A2_MANIFEST_INVALID');
  requireA2(Object.keys(manifest).sort().join('|') ===
    ['environment','files','projectId','referenceCommit','repository','runId','schema','sourceSha','teamId','workflow'].sort().join('|'), 'A2_MANIFEST_SCHEMA_INVALID');
  requireA2(manifest.schema===1 && manifest.repository===A2_REPOSITORY &&
    manifest.referenceCommit===A2_BASELINE && gitSha(manifest.sourceSha) &&
    typeof manifest.workflow==='string' && manifest.workflow.length>0 &&
    Number.isSafeInteger(manifest.runId) && manifest.runId>0 &&
    /^prj_[A-Za-z0-9]+$/.test(manifest.projectId) &&
    /^team_[A-Za-z0-9]+$/.test(manifest.teamId) &&
    ['preview','production'].includes(manifest.environment), 'A2_MANIFEST_INVALID');
  requireA2(expected && Object.keys(expected).sort().join('|') ===
    ['sourceSha','workflow','runId','projectId','teamId','environment'].sort().join('|'), 'A2_EXPECTED_IDENTITY_REQUIRED');
  for(const k of Object.keys(expected)) requireA2(manifest[k]===expected[k], 'A2_PROVENANCE_MISMATCH');
  requireA2(Array.isArray(manifest.files) && manifest.files.length>0, 'A2_ARTIFACT_EMPTY');
  const records=walkFiles(root);
  requireA2(records.length===manifest.files.length, 'A2_FILE_LIST_MISMATCH');
  for(let i=0;i<records.length;i++) {
    const a=records[i],b=manifest.files[i];
    requireA2(b && Object.keys(b).sort().join('|')==='path|sha256|size' &&
      safePath(b.path) && !forbiddenFile(b.path) && sha(b.sha256) && Number.isSafeInteger(b.size), 'A2_FILE_RECORD_INVALID');
    requireA2(a.path===b.path && a.size===b.size && a.sha256===b.sha256, 'A2_CONTENT_DIGEST_MISMATCH');
  }
  return {status:'LOCAL_INTEGRITY_ONLY', fileCount:records.length,
    contentDigest:sha256(Buffer.from(JSON.stringify(records))), publicationAuthorized:false,
    remoteEvidenceVerified:false};
}

export function inspectSiteRoutes(root, vercelConfig) {
  const filenames=walkFiles(root).map(x=>x.path);
  for(const f of ['manager.html','app/app.html']) requireA2(filenames.includes(f), 'A2_REQUIRED_ROUTE_ASSET_MISSING');
  requireA2(filenames.some(f=>/^assets\/.+\.(js|css)$/.test(f)) &&
    filenames.some(f=>/^app\/assets\/.+\.(js|css)$/.test(f)), 'A2_STATIC_ASSETS_MISSING');
  requireA2(vercelConfig && vercelConfig.outputDirectory==='tmp/c154-web-production/site', 'A2_OUTPUT_PATH_CHANGED');
  const approvedRewrites=[
    ['/','/manager.html'], ['/admin','/manager.html'], ['/master','/manager.html'],
    ['/manager','/manager.html'], ['/manager-reset-password','/manager.html'],
    ['/activate-device','/manager.html'], ['/app','/app/app.html'], ['/app/','/app/app.html']
  ];
  const rewrites=vercelConfig.rewrites;
  requireA2(Array.isArray(rewrites), 'A2_REWRITE_MISSING');
  for(const [source,destination] of approvedRewrites) {
    requireA2(rewrites.some(x=>x?.source===source && x?.destination===destination), 'A2_REQUIRED_REWRITE_MISSING');
  }
  requireA2(rewrites.length===approvedRewrites.length &&
    rewrites.every((x,i)=>x && Object.keys(x).sort().join('|')==='destination|source' &&
      x.source===approvedRewrites[i][0] && x.destination===approvedRewrites[i][1]),
    'A2_REWRITE_CONTRACT_CHANGED');
  const approvedHeaders=[
    ['X-Content-Type-Options','nosniff'], ['X-Frame-Options','DENY'],
    ['Referrer-Policy','no-referrer'], ['X-Robots-Tag','noindex, nofollow']
  ];
  const rules=vercelConfig.headers ?? [];
  const headers=Array.isArray(rules)?rules.flatMap(h=>h?.source==='/(.*)' && Array.isArray(h.headers)?h.headers:[]):[];
  for(const [name,value] of approvedHeaders) {
    requireA2(headers.some(x=>x?.key===name && x?.value===value), 'A2_SECURITY_HEADER_MISSING');
  }
  requireA2(rules.length===1 && rules[0]?.source==='/(.*)' &&
    Object.keys(rules[0]).sort().join('|')==='headers|source' &&
    headers.length===approvedHeaders.length &&
    headers.every((h,i)=>h && Object.keys(h).sort().join('|')==='key|value' &&
      h.key===approvedHeaders[i][0] && h.value===approvedHeaders[i][1]),
    'A2_HEADER_CONTRACT_CHANGED');
  return {status:'LOCAL_ROUTE_CONTRACT_ONLY', routesChecked:8, headersChecked:4};
}

// Deliberate hard stop: no local JSON, caller-supplied approval, or manifest can
// substitute for an authenticated GitHub API attestation plus deploy approval.
export function authorizePublication() {
  throw new ArtifactError('A2_REMOTE_ATTESTATION_AND_APPROVAL_NOT_IMPLEMENTED');
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    requireA2(process.argv.length===3 && process.argv[2]==='inspect', 'A2_UNSUPPORTED_CLI_ARGUMENT');
    const root=fileURLToPath(new URL('..', import.meta.url));
    const report=inspectSiteRoutes(path.join(root,'tmp/c154-web-production/site'),JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8')));
    console.log(JSON.stringify({result:'PASS',...report,prebuiltRealVerified:false,remoteWrites:0}));
    console.log('A2_LOCAL_ARTIFACT_INSPECTION=PASS');
  }catch(e) { console.error(e instanceof ArtifactError?e.code:'A2_LOCAL_INSPECTION_FAILED'); process.exitCode=1; }
}
