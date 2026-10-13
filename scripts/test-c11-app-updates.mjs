import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
function compile(file, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={}; new Function('exports','require',code)(exports,name => {
    assert.ok(name in dependencies,`Unexpected import ${name}`); return dependencies[name];
  }); return exports;
}
const calls=[]; let response={data:{revision:1,enabled:false,release:null},error:null};
const api=compile('src/app-update/publication.ts',{'../integrations/supabase/client.ts':{getSupabaseBrowserClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return response;}})}});
const release={versionCode:15,versionName:'1.0.15',sha256:'A'.repeat(64),bytes:300,notes:'Fixture',mirrors:[{label:'First',url:'https://first.invalid/app.apk'}]};
assert.deepEqual(api.releaseIssues(release),{});
assert.equal(new URL(api.downloadUrl('https://www.dropbox.com/scl/fi/fixture/app.apk?dl=0&raw=1&rlkey=fixture')).searchParams.get('dl'),'1');
assert.equal(new URL(api.downloadUrl('https://www.dropbox.com/scl/fi/fixture/app.apk?dl=0&raw=1&rlkey=fixture')).searchParams.get('rlkey'),'fixture');
for (const url of ['http://first.invalid/apk','https://username:password@first.invalid/apk','https://first.invalid:8443/apk','https://first.invalid/apk#fragment']) assert.throws(()=>api.downloadUrl(url));
for (const [key,value] of [['versionCode',0],['bytes',268435457],['sha256','abc'],['mirrors',[]],['mirrors',Array(6).fill(release.mirrors[0])]]) assert.ok(Object.keys(api.releaseIssues({...release,[key]:value})).length);
assert.ok(api.releaseIssues({...release,mirrors:[release.mirrors[0],release.mirrors[0]]})['mirror-1']);
await api.publicationApi.read(); assert.equal(calls.at(-1).name,'rpc_manager_app_update_read');
await api.publicationApi.save({revision:3,enabled:true,release});assert.deepEqual(calls.at(-1).args,{p_revision:3,p_enabled:true,p_release:release});
response={data:null,error:{message:'APP_UPDATE_REVISION_CONFLICT secret fixture'}};
await assert.rejects(api.publicationApi.save({revision:3,enabled:true,release}),/outra sessão/);
response={data:null,error:{message:'APP_UPDATE_VERSION_REQUIRED secret fixture'}};
await assert.rejects(api.publicationApi.save({revision:3,enabled:true,release}),/código de versão maior/);
response={data:null,error:{message:'private provider fixture'}};
await assert.rejects(api.publicationApi.read(),error => !error.message.includes('private provider fixture'));
const access=compile('src/debug/manager/manager-access.ts',{});
assert.ok(access.managerSections({role:'MASTER'}).some(section=>section.id==='ATUALIZACOES'));
assert.ok(!access.managerSections({role:'ADMIN'}).some(section=>section.id==='ATUALIZACOES'));
assert.deepEqual(access.managerSections(null),[]);
console.log('C90_PUBLICATION_VALIDATION_API_PAYLOAD_ERRORS_MASTER_GATE_PASS');
