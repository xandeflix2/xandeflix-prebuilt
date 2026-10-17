import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const module={exports:{}},code=ts.transpileModule(fs.readFileSync('src/ui/hooks/useFeaturedRotation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('require','module','exports',code)(()=>({}),module,module.exports);
const {selectFeatured,FeaturedRotationMemory,sampleFeaturedSegments}=module.exports;
const pool=Array.from({length:200},(_,i)=>({id:'synthetic:'+i,kind:'movie',title:'Synthetic'}));
let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name);}
await test('TWENTY_DISTINCT_TITLES_RECENT_EXCLUDED_WHEN_ALTERNATIVES_EXIST_NO_MUTATION',()=>{
 const original=JSON.stringify(pool),seen=pool.slice(30,70).map(i=>i.id),selected=selectFeatured(pool,seen,()=>.2);assert.equal(selected.length,20);assert.equal(new Set(selected.map(i=>i.id)).size,20);assert.ok(selected.every(i=>!seen.includes(i.id)));assert.equal(JSON.stringify(pool),original);
 assert.equal(selectFeatured(pool.slice(0,4),pool.slice(0,4).map(i=>i.id)).length,4);
});
await test('BACK_REUSES_EXACT_BATCH_EXPLICIT_HOME_REFRESH_NEW_BATCH_AND_SNAPSHOT_ISOLATED',()=>{
 const memory=new FeaturedRotationMemory(),first=memory.batch('a','movies',()=>pool);
 assert.equal(memory.batch('a','movies',()=>{throw Error('BACK_MUST_REUSE');}),first);
 memory.refresh();const second=memory.batch('a','movies',()=>pool);assert.notEqual(first,second);assert.ok(second.items.every(i=>!first.items.some(p=>p.id===i.id)));
 assert.equal(memory.commit('a','movies',first,pool,true),false);
 memory.batch('b','movies',()=>pool);assert.equal(memory.commit('a','movies',second,pool,true),false);
});
await test('RECENT_HISTORY_BOUNDED_FORTY_AND_FOCUSED_RAIL_NEVER_REPLACED',()=>{
 const memory=new FeaturedRotationMemory();let current;
 for(let i=0;i<8;i++){memory.refresh();current=memory.batch('a','movies',()=>pool);assert.ok(current.recent.length<=40);}
 const before=current.items;assert.equal(memory.commit('a','movies',current,pool,false),false);assert.equal(current.items,before);assert.equal(current.ready,true);
});
await test('TWO_DISTRIBUTED_TEN_ITEM_LOCAL_PAGES_NO_COUNTS_NO_FULL_SCAN',async()=>{
 const calls=[],storage={readActiveManifest:async()=>({snapshotId:'a',segments:Array.from({length:10},()=>({kind:'movies',fileName:'synthetic.json'}))})};
 const browse={loadPage:async(kind,cursor,size,category,options)=>{calls.push({kind,cursor,size,category,options});return{items:pool.slice(cursor.segment*10,cursor.segment*10+size)};}};
 const controller=new AbortController(),items=await sampleFeaturedSegments('movies',storage,browse,3,'a',controller.signal);assert.equal(items.length,20);assert.equal(calls.length,2);assert.deepEqual(calls.map(c=>c.cursor.segment),[3,8]);assert.ok(calls.every(c=>c.size===10&&c.category===undefined&&c.options.count===false&&c.options.signal===controller.signal));
});
await test('GENERATION_AND_CANCEL_GUARDS_REJECT_STALE_SELECTION_TYPES_SEPARATE',async()=>{
 const controller=new AbortController(),storage={readActiveManifest:async()=>({snapshotId:'b',segments:[{kind:'series',fileName:'s.json'}]})},browse={loadPage:async()=>{throw Error('STALE_REQUEST');}};
 assert.deepEqual(await sampleFeaturedSegments('series',storage,browse,0,'a',controller.signal),[]);controller.abort();assert.deepEqual(await sampleFeaturedSegments('series',storage,browse,0,'b',controller.signal),[]);
 const memory=new FeaturedRotationMemory(),movies=memory.batch('a','movies',()=>pool),series=memory.batch('a','series',()=>pool.map(i=>({...i,kind:'series',id:'s'+i.id})));assert.ok(movies.items.every(i=>i.kind==='movie'));assert.ok(series.items.every(i=>i.kind==='series'));
});
await test('SINGLE_SEGMENT_ROTATES_INTERNAL_OFFSET_INSTEAD_OF_SAME_FIRST_TWENTY',async()=>{
 const storage={readActiveManifest:async()=>({snapshotId:'a',segments:[{kind:'movies',fileName:'a.json',recordCount:200}]})},calls=[];
 const browse={loadPage:async(kind,cursor,size)=>{calls.push(cursor.offset);return{items:pool.slice(cursor.offset,cursor.offset+size)};}};
 const signal=new AbortController().signal,a=await sampleFeaturedSegments('movies',storage,browse,1,'a',signal),b=await sampleFeaturedSegments('movies',storage,browse,2,'a',signal);assert.deepEqual(calls,[20,40]);assert.equal(a.length,20);assert.equal(b.length,20);assert.equal(a.some(i=>b.some(j=>i.id===j.id)),false);
});
console.log(JSON.stringify({tests,pass:true,syntheticOnly:true,networkRequests:0}));
