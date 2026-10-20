import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash, generateKeyPairSync} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {registerHooks} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const reference='b3fc8d1e3844bc5601813ab1b298289af5b3f1fd';
const mode=process.argv[2]||'current';
assert(['current','legacy-builder','legacy-reader'].includes(mode),'Unknown compatibility test mode');
assert.equal(process.argv.length,mode==='current'?2:3);

// Historical modules are read from Git only in isolated compatibility workers.
// The main test and official G9/G10 suites use the real, unmodified module loader.
if(mode!=='current'){
 const files=mode==='legacy-builder'?['src/update/catalog-delta-builder.ts']:
  ['src/update/catalog-delta-applier.ts','schemas/prebuilt-catalog-delta.schema.json'];
 const originals=new Map(files.map(file=>[file,execFileSync('git',['show',reference+':'+file],{cwd:root,encoding:'utf8'})]));
 registerHooks({load(url,context,nextLoad){
  const loaded=nextLoad(url,context);
  if(!url.startsWith('file:'))return loaded;
  const file=path.relative(root,fileURLToPath(url)).replaceAll('\\','/');
  return originals.has(file)?{...loaded,source:originals.get(file)}:loaded;
 }});
}

const [pipelineModule,adapterModule,builderModule,applierModule,validatorModule,deltaModule,packageModule,searchModule,storageModule,secureModule,verifierModule,keysModule,signerModule]=await Promise.all([
 import('../src/ingestion/pipeline.ts'),import('../src/ingestion/adapters/synthetic-source.adapter.ts'),
 import('../src/update/catalog-delta-builder.ts'),import('../src/update/catalog-delta-applier.ts'),
 import('../src/update/catalog-delta-validator.ts'),import('../src/update/delta-package-builder.ts'),
 import('../src/provisioning/package-builder.ts'),import('../src/search/search-index-builder.ts'),
 import('../src/bootstrap/storage/in-memory.storage.ts'),import('../src/security/secure-artifact-import.service.ts'),
 import('../src/security/artifact-verifier.ts'),import('../src/security/trusted-public-key-store.ts'),
 import('../src/security/artifact-signer.ts'),
]);
const {IngestionPipeline}=pipelineModule,{SyntheticSourceAdapter}=adapterModule;
const {CatalogDeltaBuilder}=builderModule,{CatalogDeltaApplier}=applierModule,{CatalogDeltaValidator}=validatorModule;
const {DeltaPackageBuilder}=deltaModule,{PackageBuilder}=packageModule,{SearchIndexBuilder}=searchModule;
const {InMemoryCatalogStorage}=storageModule,{SecureArtifactImportService}=secureModule;
const {ArtifactVerifier}=verifierModule,{TrustedPublicKeyStore}=keysModule,{signArtifact}=signerModule;
const ingestion=await new IngestionPipeline(new SyntheticSourceAdapter()).execute(
 fs.readFileSync(path.join(root,'fixtures/source/synthetic-source.valid.json'),'utf8'),
 {sourceNamespace:'sec',catalogVersion:'1.0.0',deterministicGeneratedAt:'2026-01-01T00:00:00.000Z'},
);
assert.equal(ingestion.success,true);
const original=ingestion.catalog;
const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const privateKeyPem=pair.privateKey.export({type:'pkcs8',format:'pem'});
const verifier=new ArtifactVerifier(new TrustedPublicKeyStore([{
 keyId:'test-g10-extensions',algorithm:'ECDSA_P256_SHA256',
 publicKeyPem:pair.publicKey.export({type:'spki',format:'pem'}),status:'ACTIVE',
}]));
const hash=value=>createHash('sha256').update(JSON.stringify(value,null,2)).digest('hex');
const pass=name=>console.log('PASS '+name);
function fixtures(name){
 const base=structuredClone(original),target=structuredClone(original);
 Object.assign(target.metadata,{snapshotId:'snap-extensions-'+name,catalogVersion:'1.1.0',generatedAt:'2026-01-02T00:00:00.000Z'});
 if(name==='add'||name==='absent')delete base.extensions;
 if(name==='replace'||name==='add')target.extensions={categoryProvenance:[],syntheticMarker:{revision:2}};
 if(name==='remove'||name==='absent')delete target.extensions;
 if(name==='empty')target.extensions={};
 return {base,target};
}
function envelope(bytes,type,catalog,base){
 return signArtifact({artifactBytes:bytes,artifactType:type,keyId:'test-g10-extensions',privateKeyPem,
  ...(type==='DELTA_PACKAGE_V1'?{baseSnapshotId:base.metadata.snapshotId,targetSnapshotId:catalog.metadata.snapshotId}:{snapshotId:catalog.metadata.snapshotId})}).envelope;
}
async function transition(name,format,expected,expectedCode){
 const {base,target}=fixtures(name),before=JSON.stringify(base);
 const search=new SearchIndexBuilder(),packager=new PackageBuilder();
 const baseSearch=format===2?search.build(base,{deterministicGeneratedAt:'2026-01-01T00:00:00.000Z'}):undefined;
 const targetSearch=format===2?search.build(target,{deterministicGeneratedAt:'2026-01-02T00:00:00.000Z'}):undefined;
 const full=await packager.build(base,{packageFormatVersion:format,searchIndex:baseSearch,deterministicCreatedAt:'2026-01-01T00:00:00.000Z'});
 const delta=await new DeltaPackageBuilder().build(base,target,baseSearch,targetSearch,{deterministicGeneratedAt:'2026-01-02T00:00:00.000Z'});
 assert.equal(full.success,true);assert.equal(delta.success,true);
 assert.equal(delta.manifest.targetCatalogSha256,hash(target));
 const storage=new InMemoryCatalogStorage(),secure=new SecureArtifactImportService(storage,verifier);
 const initial=await secure.importPackage(full.packageBuffer,envelope(full.packageBuffer,'FULL_PACKAGE_V'+format,base));
 assert.equal(initial.success,true,initial.errorMessage);
 const pointer=await storage.readActivePointer(),active=await storage.readActiveCatalog();
 const applied=await secure.applyDelta(delta.zipBuffer,envelope(delta.zipBuffer,'DELTA_PACKAGE_V1',target,base));
 assert.equal(applied.success,expected,applied.errorMessage);
 if(!expected){
  assert.match(applied.errorMessage,expectedCode);
  assert.equal(applied.innerResult.state,'UPDATE_FAILED_ACTIVE_PRESERVED');
  assert.deepEqual(await storage.readActivePointer(),pointer);
  assert.deepEqual(await storage.readActiveCatalog(),active);
  // Explicit full-package fallback through the existing secure import API.
  // There is no claim of automatic download/capability negotiation in production.
  const recovery=await packager.build(target,{packageFormatVersion:format,searchIndex:targetSearch,deterministicCreatedAt:'2026-01-02T00:00:00.000Z'});
  assert.equal(recovery.success,true);
  const unsigned=await secure.importPackage(recovery.packageBuffer);
  assert.equal(unsigned.success,false);
  assert.deepEqual(await storage.readActivePointer(),pointer);
  const recovered=await secure.importPackage(recovery.packageBuffer,envelope(recovery.packageBuffer,'FULL_PACKAGE_V'+format,target));
  assert.equal(recovered.success,true,recovered.errorMessage);
  assert(await storage.readSnapshot(base.metadata.snapshotId),'Previous generation lost');
 }
 assert.equal(hash(await storage.readActiveCatalog()),hash(target));
 assert.equal((await storage.readActivePointer()).snapshotId,target.metadata.snapshotId);
 if(format===2)assert.deepEqual(await storage.readActiveSearchIndex(),targetSearch);
 assert.equal(JSON.stringify(base),before,'Base mutated');
 return {storage,secure,delta,base,target};
}

if(mode!=='current'){
 for(const format of [1,2]){
  await transition('absent',format,true);
  await transition('remove',format,true);
  await transition('preserve',format,false,mode==='legacy-builder'?/TARGET_CATALOG_HASH_MISMATCH_REJECTED/:/CATALOG_DELTA_SCHEMA_ERROR/);
  pass(mode.toUpperCase().replaceAll('-','_')+'_FULL_V'+format+'_FALLBACK_AND_ACTIVE_PRESERVED');
 }
 console.log('G10_COMPATIBILITY_WORKER=PASS '+mode);
}else{
 const builder=new CatalogDeltaBuilder(),applier=new CatalogDeltaApplier(),validator=new CatalogDeltaValidator();
 for(const[name,label]of [['preserve','PRESERVE_EXTENSIONS'],['replace','REPLACE_EXTENSIONS'],['add','ADD_EXTENSIONS'],['remove','REMOVE_EXTENSIONS'],['absent','ABSENT_EXTENSIONS'],['empty','EMPTY_EXTENSIONS']]){
  const {base,target}=fixtures(name),before=JSON.stringify(base);
  const delta=JSON.parse(JSON.stringify(builder.build(base,target)));
  assert.equal(validator.validate(delta).valid,true);
  const reconstructed=applier.apply(base,delta);
  assert.deepEqual(reconstructed,target);
  assert.equal(Object.hasOwn(reconstructed,'extensions'),Object.hasOwn(target,'extensions'));
  assert.equal(hash(reconstructed),hash(target));
  assert.equal(JSON.stringify(base),before);
  await transition(name,2,true);
  pass(label);
 }
 const {base,target}=fixtures('preserve'),valid=builder.build(base,target);
 for(const value of [null,[],42,'invalid',false])assert.equal(validator.validate({...valid,targetExtensions:value}).valid,false);
 pass('INVALID_EXTENSIONS_TYPE');
 assert.equal(validator.validate({...valid,unknownTopLevelField:true}).valid,false);
 pass('UNKNOWN_FIELD_REJECTED');pass('TARGET_HASH_MATCH');pass('BASE_CATALOG_UNCHANGED');pass('SCHEMA_VALIDATION');
 // Preserve fail-closed pointer promotion when storage refuses a write.
 const state=await transition('preserve',2,true);
 const pointer=await state.storage.readActivePointer(),active=await state.storage.readActiveCatalog();
 const {base:ignored,target:next}=fixtures('replace');
 next.metadata.catalogVersion='1.2.0';
 const search=new SearchIndexBuilder();
 const nextDelta=await new DeltaPackageBuilder().build(state.target,next,await state.storage.readActiveSearchIndex(),search.build(next,{deterministicGeneratedAt:'2026-01-02T00:00:00.000Z'}));
 state.storage.simulatePointerWriteFailure=true;
 const denied=await state.secure.applyDelta(nextDelta.zipBuffer,envelope(nextDelta.zipBuffer,'DELTA_PACKAGE_V1',next,state.target));
 assert.equal(denied.success,false);assert.match(denied.errorMessage,/SIMULATED_POINTER_WRITE_FAILURE/);
 assert.deepEqual(await state.storage.readActivePointer(),pointer);assert.deepEqual(await state.storage.readActiveCatalog(),active);
 pass('STAGING_PROMOTION_FAILURE_PRESERVES_ACTIVE');
 for(const worker of ['legacy-builder','legacy-reader']){
  const result=spawnSync(process.execPath,[fileURLToPath(import.meta.url),worker],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
  assert.ifError(result.error);assert.equal(result.signal,null);assert.equal(result.status,0,result.stdout+result.stderr);
  assert(result.stdout.includes('G10_COMPATIBILITY_WORKER=PASS '+worker));
  process.stdout.write(result.stdout);
 }
 pass('OLD_NEW_DELTA_COMPATIBILITY');
 console.log('G10_DELTA_EXTENSIONS_REGRESSION=PASS');
}
