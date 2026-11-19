import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {createHash} from 'node:crypto';
import {collectObsoleteSnapshots,SnapshotOperationQueue,isSafeSnapshotId} from '../src/bootstrap/storage/snapshot-retention.ts';
const source=fileURLToPath(new URL('../src/bootstrap/storage/capacitor-filesystem.storage.ts',import.meta.url)),requireReal=createRequire(source);
const transpile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const hash=s=>createHash('sha256').update(s).digest('hex'),pause=()=>new Promise(r=>setTimeout(r,0));
let tests=0;const test=async(name,run)=>{await run();tests++;console.log('PASS '+name);};
function fixture(count=14){
 const files=new Map(),dirs=new Set(['prebuilt','prebuilt/snapshots','prebuilt/staging']),removed=[],calls=[],flags={};
 const put=(p,s)=>{files.set(p,s);let parent=p;while(parent.includes('/')){parent=parent.slice(0,parent.lastIndexOf('/'));dirs.add(parent);}};
 const seed=id=>{const prefix='prebuilt/snapshots/'+id,catalog={metadata:{snapshotId:id,catalogVersion:'v1'},movies:[],series:[],seasons:[],episodes:[],streams:[],artworks:[],genres:[],categories:[]};const segment='[]';put(prefix+'/catalog.json',JSON.stringify(catalog));put(prefix+'/segments/movies_0.json',segment);put(prefix+'/manifest.json',JSON.stringify({snapshotId:id,catalogVersion:'v1',schemaVersion:1,metadata:{kind:'REAL'},catalogSha256:'a'.repeat(64),packageContentHash:'a'.repeat(64),segments:[{fileName:'movies_0.json',kind:'movies',byteSize:Buffer.byteLength(segment),recordCount:0,sha256:hash(segment)}]}));};
 for(let i=1;i<=count;i++)seed('generation-'+i);
 const point=(active,previous)=>{put('prebuilt/active.json',JSON.stringify({snapshotId:active,catalogVersion:'v1',schemaVersion:1,packageContentHash:'a'.repeat(64),promotedAt:'2026-10-21T00:00:00Z',kind:'REAL'}));put('prebuilt/recovery.json',JSON.stringify({journalFormatVersion:1,activeSnapshotId:active,previousSnapshotId:previous,lastKnownGoodSnapshotId:active,updatedAt:'2026-10-21T00:00:00Z'}));};
 point('generation-'+count,count>1?'generation-'+(count-1):null);
 for(const p of ['device_identity.json','device_activation.json','device_activation_key.json','xandeflix_parental.xml','prebuilt/staging/in-progress/segment.json','source-import-current.m3u'])put(p,'private-synthetic-preserved');
 const bridge={
  async readFile(a){calls.push(['read',a.path]);if(flags.blockRead===a.path)await flags.readBarrier;if(!files.has(a.path))throw Error('MISSING');return{data:files.get(a.path)};},
  async getUri(){throw Error('USE_READFILE_FIXTURE');},
  async readdir(a){assert.equal(a.path,'prebuilt/snapshots');return{files:[...dirs].filter(p=>p.startsWith(a.path+'/')&&!p.slice(a.path.length+1).includes('/')).map(p=>({name:p.split('/').at(-1),type:'directory'})).concat(flags.extraEntries||[])};},
  async stat(a){if(dirs.has(a.path))return{type:'directory',size:0};if(files.has(a.path))return{type:'file',size:Buffer.byteLength(files.get(a.path))};throw Error('MISSING');},
  async rmdir(a){assert.match(a.path,/^prebuilt\/snapshots\/[A-Za-z0-9_-]+$/);assert.equal(a.directory,'DATA');assert.equal(a.recursive,true);if(flags.failRemove===removed.length)throw Error('private-synthetic-exception');removed.push(a.path);for(const p of [...files.keys()])if(p.startsWith(a.path+'/'))files.delete(p);for(const p of [...dirs])if(p===a.path||p.startsWith(a.path+'/'))dirs.delete(p);flags.afterRemove?.();},
  async writeFile(a){put(a.path,a.data);},
  async mkdir(a){dirs.add(a.path);},
  async rename(a){if(!dirs.has(a.from))throw Error('MISSING');for(const p of [...files.keys()])if(p.startsWith(a.from+'/')){put(a.to+p.slice(a.from.length),files.get(p));files.delete(p);}for(const p of [...dirs])if(p===a.from||p.startsWith(a.from+'/')){dirs.add(a.to+p.slice(a.from.length));dirs.delete(p);}},
  async copy(a){if(!files.has(a.from))throw Error('OPTIONAL_MISSING');put(a.to,files.get(a.from));},
 };
 const module={exports:{}};vm.runInNewContext(transpile(source),{module,exports:module.exports,Buffer,Uint8Array,console,setTimeout,clearTimeout,TextEncoder,require:id=>id==='@capacitor/filesystem'?{Filesystem:bridge,Directory:{Data:'DATA'},Encoding:{UTF8:'utf8'}}:requireReal(id)},{filename:source});
 const Storage=module.exports.CapacitorFilesystemStorage,storage=new Storage();
 const protectedBefore=new Map([...files].filter(([p])=>!p.startsWith('prebuilt/snapshots/')||p.startsWith('prebuilt/snapshots/generation-'+count+'/')||p.startsWith('prebuilt/snapshots/generation-'+(count-1)+'/')));
 const preserved=()=>{for(const[p,s]of protectedBefore)assert.equal(files.get(p),s,p);};
 return{files,dirs,put,seed,point,flags,removed,calls,Storage,storage,preserved};
}

await test('UPGRADE_FOURTEEN_TO_TWO_AND_IDEMPOTENT_WITH_ALL_PRIVATE_DATA_UNCHANGED',async()=>{const h=fixture();assert.deepEqual(await h.storage.maintainCatalogSnapshots(),{status:'COMPLETE',removed:12,preserved:2});h.preserved();assert.equal(h.removed.length,12);assert.equal((await h.storage.maintainCatalogSnapshots()).removed,0);});
await test('REPEATED_NEW_GENERATIONS_BOUNDED_TO_ACTIVE_AND_PREVIOUS',async()=>{const h=fixture(2);for(let i=3;i<=30;i++){h.seed('generation-'+i);h.point('generation-'+i,'generation-'+(i-1));const r=await h.storage.maintainCatalogSnapshots();assert.equal(r.status,'COMPLETE');assert.equal([...h.dirs].filter(p=>/^prebuilt\/snapshots\/[^/]+$/.test(p)).length,2);}assert.equal(JSON.parse(h.files.get('prebuilt/active.json')).snapshotId,'generation-30');});
for(const mutate of [
 h=>h.files.delete('prebuilt/active.json'),h=>h.files.set('prebuilt/active.json','{'),
 h=>h.files.delete('prebuilt/recovery.json'),h=>h.files.set('prebuilt/recovery.json','{'),
 h=>{const j=JSON.parse(h.files.get('prebuilt/recovery.json'));j.activeSnapshotId='generation-1';h.put('prebuilt/recovery.json',JSON.stringify(j));},
 h=>{const j=JSON.parse(h.files.get('prebuilt/recovery.json'));j.previousSnapshotId='../private';h.put('prebuilt/recovery.json',JSON.stringify(j));},
 h=>h.files.delete('prebuilt/snapshots/generation-13/manifest.json'),
 h=>h.files.delete('prebuilt/snapshots/generation-14/segments/movies_0.json'),
 h=>h.put('prebuilt/snapshots/generation-14/segments/movies_0.json','changed-size'),
 h=>h.put('prebuilt/snapshots/generation-14/segments/movies_0.json','{}'),
 h=>{const p=JSON.parse(h.files.get('prebuilt/active.json'));p.catalogVersion='wrong';h.put('prebuilt/active.json',JSON.stringify(p));},
 h=>{const p='prebuilt/snapshots/generation-14/catalog.json',c=JSON.parse(h.files.get(p));c.metadata.snapshotId='wrong';h.put(p,JSON.stringify(c));},
 h=>{const p='prebuilt/snapshots/generation-13/manifest.json',m=JSON.parse(h.files.get(p));m.segments[0].fileName='../outside';h.put(p,JSON.stringify(m));},
 h=>h.flags.extraEntries=[{name:'../outside',type:'directory'}],
 h=>h.flags.extraEntries=[{name:'unexpected-file',type:'file'}],
 h=>h.flags.extraEntries=[{name:'untrusted-link',type:'symlink'}],
])await test('FAIL_CLOSED_MALFORMED_OR_MISSING_PROTECTED_STATE_'+tests,async()=>{const h=fixture();mutate(h);assert.equal((await h.storage.maintainCatalogSnapshots()).status,'DEFERRED');assert.equal(h.removed.length,0);});
await test('FIRST_SINGLE_GENERATION_IS_PRESERVED',async()=>{const h=fixture(1);assert.equal((await h.storage.maintainCatalogSnapshots()).status,'DEFERRED');h.preserved();assert.equal(h.removed.length,0);});
await test('THIRD_LAST_KNOWN_GOOD_REFERENCE_IS_KEPT',async()=>{const h=fixture();const j=JSON.parse(h.files.get('prebuilt/recovery.json'));j.lastKnownGoodSnapshotId='generation-1';h.put('prebuilt/recovery.json',JSON.stringify(j));const r=await h.storage.maintainCatalogSnapshots();assert.equal(r.preserved,3);assert.ok(h.files.has('prebuilt/snapshots/generation-1/catalog.json'));});
await test('CONCURRENT_STORAGE_INSTANCES_COALESCE_COLLECTION',async()=>{const h=fixture(),other=new h.Storage();const [a,b]=await Promise.all([h.storage.maintainCatalogSnapshots(),other.maintainCatalogSnapshots()]);assert.equal(a.removed,12);assert.equal(b.removed,12);assert.equal(h.removed.length,12);h.preserved();});
await test('STATE_CHANGE_BETWEEN_DELETIONS_STOPS_REMAINING_WORK',async()=>{const h=fixture();h.flags.afterRemove=()=>h.point('generation-12','generation-11');const r=await h.storage.maintainCatalogSnapshots();assert.equal(r.status,'DEFERRED');assert.equal(r.removed,1);assert.ok(h.files.has('prebuilt/snapshots/generation-12/catalog.json'));assert.ok(h.files.has('prebuilt/snapshots/generation-11/catalog.json'));});
await test('PARTIAL_IO_FAILURE_IS_SAFE_AND_RETRYABLE',async()=>{const h=fixture();h.flags.failRemove=1;const r=await h.storage.maintainCatalogSnapshots();assert.equal(r.status,'DEFERRED');assert.equal(r.removed,1);h.preserved();h.flags.failRemove=undefined;assert.equal((await h.storage.maintainCatalogSnapshots()).removed,11);h.preserved();});
await test('IN_FLIGHT_READER_FINISHES_BEFORE_OTHER_INSTANCE_COLLECTS',async()=>{const h=fixture();let release;h.flags.blockRead='prebuilt/snapshots/generation-1/catalog.json';h.flags.readBarrier=new Promise(r=>release=r);const read=h.storage.readSnapshot('generation-1');await pause();const collecting=new h.Storage().maintainCatalogSnapshots();await pause();assert.equal(h.removed.length,0);release();assert.equal((await read).catalog.metadata.snapshotId,'generation-1');assert.equal((await collecting).status,'COMPLETE');h.preserved();});
await test('PROMOTION_POINTER_WRITE_DOES_NOT_DEADLOCK_AND_JOURNAL_GAP_DEFERS',async()=>{const h=fixture(2),id='generation-3';h.seed(id);for(const[p,s]of [...h.files])if(p.startsWith('prebuilt/snapshots/'+id+'/')){h.put(p.replace('snapshots','staging'),s);h.files.delete(p);}h.dirs.delete('prebuilt/snapshots/'+id);await h.storage.promoteStaging(id);assert.equal(JSON.parse(h.files.get('prebuilt/active.json')).snapshotId,id);assert.equal((await h.storage.maintainCatalogSnapshots()).status,'DEFERRED');const j={journalFormatVersion:1,activeSnapshotId:id,previousSnapshotId:'generation-2',lastKnownGoodSnapshotId:id,updatedAt:'2026-10-21T00:00:00Z'};await h.storage.writeRecoveryJournal(j);assert.equal((await h.storage.maintainCatalogSnapshots()).status,'COMPLETE');assert.ok(h.files.has('prebuilt/snapshots/generation-2/catalog.json'));});
await test('LEGACY_UNSEGMENTED_PROTECTED_HASH_IS_VERIFIED',async()=>{const h=fixture();for(const id of ['generation-13','generation-14']){const p='prebuilt/snapshots/'+id+'/manifest.json',m=JSON.parse(h.files.get(p));delete m.segments;m.catalogSha256=hash(JSON.stringify(JSON.parse(h.files.get('prebuilt/snapshots/'+id+'/catalog.json')),null,2));h.put(p,JSON.stringify(m));}assert.equal((await h.storage.maintainCatalogSnapshots()).status,'COMPLETE');});
await test('LEGACY_HASH_CORRUPTION_BLOCKS_DELETION',async()=>{const h=fixture();const p='prebuilt/snapshots/generation-13/manifest.json',m=JSON.parse(h.files.get(p));delete m.segments;h.put(p,JSON.stringify(m));assert.equal((await h.storage.maintainCatalogSnapshots()).status,'DEFERRED');assert.equal(h.removed.length,0);});
await test('QUEUE_RECOVERS_AFTER_FAILURE_AND_REJECTS_UNSAFE_IDS',async()=>{const q=new SnapshotOperationQueue();await assert.rejects(q.run(async()=>{throw Error('fixture');}));assert.equal(await q.run(async()=>42),42);for(const id of ['../x','a/b','a\\b','%2e%2e','C:x','','.','..','x'.repeat(161)])assert.equal(isSafeSnapshotId(id),false);});

// Real BootstrapService scheduler; importer outcome is a controlled boundary fixture.
await test('STARTUP_AND_SUCCESSFUL_PROMOTION_SCHEDULE_WITHOUT_BLOCKING_OR_FAILED_IMPORT_CLEANUP',async()=>{
 const h=fixture(),timers=[];let maintenance=0,outcome={success:false,status:'REJECTED'};
 class Importer{async promoteStagedPackage(){return outcome;}async importPackage(){return outcome;}}
 const p=fileURLToPath(new URL('../src/bootstrap/bootstrap.service.ts',import.meta.url)),module={exports:{}},req=createRequire(p);
 vm.runInNewContext(transpile(p),{module,exports:module.exports,console,Buffer,setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},require:id=>id==='./package-importer.ts'?{PackageImporter:Importer}:req(id)},{filename:p});
 const storage={...h.storage,readActivePointer:()=>h.storage.readActivePointer(),hasActiveCatalog:()=>h.storage.hasActiveCatalog(),maintainCatalogSnapshots:async()=>{maintenance++;return{status:'COMPLETE',removed:0,preserved:2};}};
 const service=new module.exports.BootstrapService(storage);assert.equal((await service.initialize()).isReady,true);assert.equal(maintenance,0);await service.initialize();assert.equal(timers.length,1);timers.shift()();for(let i=0;i<5;i++)await pause();assert.equal(maintenance,1);
 await service.importPackage('fixture');assert.equal(timers.length,0);outcome={success:true,status:'PROMOTED'};await service.promoteStagedSnapshot('generation-14');assert.equal(timers.length,1);timers.shift()();for(let i=0;i<5;i++)await pause();assert.equal(maintenance,2);
});
console.log('CATALOG_SNAPSHOT_RETENTION_TESTS='+tests);
console.log('CATALOG_SNAPSHOT_RETENTION=PASS');
