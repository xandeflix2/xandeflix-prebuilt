import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {collectSnapshot,verifyCanonical,verifySiteBuildWorkflow,CanonError,AUTHORIZATION,LEGACY_AUTHORIZATION,HARDENING_AUTHORIZATION,SITE_BUILD_WORKFLOW,SITE_BUILD_TEST} from './verify-canonical-contract.mjs';

assert.equal(process.argv.length,2,'SITE_BUILD_CONTRACT_UNSUPPORTED_ARGUMENT');
const root=fileURLToPath(new URL('..',import.meta.url));
const snapshot=collectSnapshot(root),workflow=snapshot.read(SITE_BUILD_WORKFLOW).toString('utf8').replaceAll('\r\n','\n');
const controls=[];
const pass=name=>{controls.push(name);console.log('PASS '+name)};
const rejects=(name,run,code)=>{assert.throws(run,error=>error instanceof CanonError&&error.code===code,name);pass(name)};
const overlay=entries=>({...snapshot,read:file=>Object.hasOwn(entries,file)?entries[file]===null?null:Buffer.from(entries[file]):snapshot.read(file)});

assert.equal(verifyCanonical(snapshot).result,'PASS');pass('REAL_TREE_PASSES_CANONICAL_CHECK');
assert.equal(verifySiteBuildWorkflow(workflow).result,'PASS');pass('APPROVED_WORKFLOW_PASSES');
assert.equal(verifySiteBuildWorkflow(workflow.replaceAll('\n','\r\n')).result,'PASS');pass('CRLF_CHECKOUT_PRESERVES_EXACT_CONTRACT');

const mutations=[
 ['REMOVE_CANON_CHECK',s=>s.replace('      - run: npm run canon:check\n','')],
 ['REMOVE_CANON_TEST',s=>s.replace('      - run: npm run canon:test\n','')],
 ['SHALLOW_CHECKOUT',s=>s.replace('fetch-depth: 0','fetch-depth: 1')],
 ['PERSIST_CREDENTIALS',s=>s.replace('persist-credentials: false','persist-credentials: true')],
 ['PRODUCTION_SECRET',s=>s+'\n    env:\n      TOKEN: ${{ secrets.FIXTURE_SECRET }}\n'],
 ['PUBLIC_CONFIG_CANNOT_USE_SECRET',s=>s.replace('vars.VITE_SUPABASE_PUBLISHABLE_KEY','secrets.VITE_SUPABASE_PUBLISHABLE_KEY')],
 ['PUBLIC_CONFIG_CANNOT_BE_FAKE_KEY',s=>s.replace('${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY }}','sb_publishable_FIXTURE_NOT_FOR_CI')],
 ['PUBLIC_CONFIG_REQUIRED',s=>s.replace('          VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}\n','')],
 ['AUTOMATIC_DEPLOY',s=>s+'      - run: vercel deploy --prebuilt\n'],
 ['PUBLICATION_API',s=>s+'      - run: curl -X POST https://fixture.invalid/deploy\n'],
 ['REMOVE_SITE_BUILD',s=>s.replace('      - run: npm run site:build\n','')],
 ['CONTINUE_ON_ERROR',s=>s+'    continue-on-error: true\n'],
 ['CONDITIONAL_SKIP',s=>s+'    if: false\n'],
 ['WRITE_PERMISSION',s=>s.replace('contents: read','contents: write')],
 ['PR_TARGET',s=>s.replace('  pull_request:','  pull_request_target:')],
 ['UNREVIEWED_ACTION',s=>s.replace('actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38','fixture/unreviewed@main')],
 ['NODE_DOWNGRADE',s=>s.replace("node-version: '24'","node-version: '22'")],
 ['REMOVE_WINDOWS',s=>s.replace('ubuntu-latest, windows-latest','ubuntu-latest')],
 ['REMOVE_LINUX',s=>s.replace('ubuntu-latest, windows-latest','windows-latest')],
 ['COMMENTED_SITE_BUILD',s=>s.replace('      - run: npm run site:build','      # - run: npm run site:build')],
];
for(const[name,mutate]of mutations){
 const changed=mutate(workflow);assert.notEqual(changed,workflow,'MUTATION_MUST_CHANGE_WORKFLOW '+name);
 rejects(name,()=>verifySiteBuildWorkflow(changed),'CANON_SITE_BUILD_WORKFLOW_INVALID');
}
for(const file of [SITE_BUILD_WORKFLOW,SITE_BUILD_TEST]){
 rejects('MISSING_'+path.basename(file),()=>verifyCanonical(overlay({[file]:null})),'CANON_REQUIRED_FILE_MISSING');
 rejects('SILENT_CHANGE_'+path.basename(file),()=>verifyCanonical(overlay({[file]:snapshot.read(file).toString('utf8')+'\n// unapproved change\n'})),'CANON_PROTECTED_CONTENT_CHANGED');
}
for(const file of [AUTHORIZATION,LEGACY_AUTHORIZATION,HARDENING_AUTHORIZATION]){
 const receipt=JSON.parse(snapshot.read(file));receipt.reason+=' Unauthorized alteration.';
 rejects('HISTORICAL_RECEIPT_TAMPERING_'+path.basename(file),()=>verifyCanonical(overlay({[file]:JSON.stringify(receipt)})),file===HARDENING_AUTHORIZATION?'CANON_REGISTERED_RECEIPT_CHANGED':'CANON_RECEIPT_CONTENT_CHANGED');
}

// Real Git failures in disposable fixtures; no commits, fake baseline or network.
// Native resolution expands Windows 8.3 TEMP aliases before Git sees the path.
const temporaryRoot=fs.realpathSync.native(os.tmpdir());
const fixture=fs.mkdtempSync(path.join(temporaryRoot,'xandeflix-site-contract-'));
try{
 rejects('BUILD_CONTEXT_WITHOUT_GIT',()=>collectSnapshot(fixture),'CANON_GIT_OR_BASELINE_UNAVAILABLE');
 execFileSync('git',['-c','init.defaultBranch=site-build-negative-fixture','init','--quiet',fixture],{stdio:'pipe'});
 execFileSync('git',['remote','add','origin','https://github.com/xandeflix2/xandeflix-prebuilt.git'],{cwd:fixture,stdio:'pipe'});
 rejects('BASELINE_OBJECT_UNAVAILABLE',()=>collectSnapshot(fixture),'CANON_GIT_OR_BASELINE_UNAVAILABLE');
}finally{
 const resolved=fs.realpathSync(fixture);
 assert.equal(path.dirname(resolved),temporaryRoot,'FIXTURE_CLEANUP_MUST_STAY_IN_TEMP');
 assert(path.basename(resolved).startsWith('xandeflix-site-contract-'));
 fs.rmSync(resolved,{recursive:true,force:true});
}
console.log(JSON.stringify({result:'PASS',controls:controls.length,remoteWrites:0,publicationPerformed:false,officialBuildSubstituted:false}));
console.log('SITE_BUILD_CONTRACT=PASS');
