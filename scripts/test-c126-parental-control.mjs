import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import React from 'react';
import ts from 'typescript';
import {ParentalControlStore,PARENTAL_KDF_ITERATIONS} from '../src/parental/parental-control.store.ts';
import {parentalContentKey,parseParentalAge,sourceParentalAge,parentalLiveCatalog} from '../src/parental/parental-content.ts';
let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name)}
function fixture(initial=null){let raw=initial,now=10000;const storage={read:async()=>raw,write:async value=>{raw=value}};
 const store=new ParentalControlStore({storage,crypto:()=>webcrypto,now:()=>now});return{store,storage,get raw(){return raw},set raw(v){raw=v},advance:ms=>now+=ms};}
const pin='135790',puk='Synthetic-PUK-Only-2026',nextPin='246801',nextPuk='Replacement-PUK-Only-2026';
const f=fixture(),s=f.store;
await test('UNCONFIGURED_NORMAL_CONTENT_ALLOWED_ADULT_CLOSED_NO_REMOTE',async()=>{
 await s.load();assert.equal(s.getSnapshot().status,'unconfigured');assert.equal(await s.authorize('fixture',undefined,false),true);
 await assert.rejects(s.authorize('fixture',18,true),/SETUP_REQUIRED/);assert.equal(s.adultVisible(),false);
});
await test('PIN_PUK_CONFIGURATION_RANDOM_SEPARATE_SALTS_KDF_NO_PLAINTEXT_DUPLICATE_DENIED',async()=>{
 await assert.rejects(s.configure('123',puk,{maxAge:12,allowAdult:true}),/INVALID_SECRET/);assert.equal(f.raw,null);
 assert.match(s.generatePuk(),/^[0-9A-F]{32}$/);assert.notEqual(s.generatePuk(),s.generatePuk());
 await s.configure(pin,puk,{maxAge:12,allowAdult:true});const r=JSON.parse(f.raw);
 assert.equal(r.iterations,600000);assert.equal(PARENTAL_KDF_ITERATIONS,600000);assert.notEqual(r.pin.salt,r.puk.salt);assert.equal(r.pin.hash.length,64);assert.ok(!f.raw.includes(pin)&&!f.raw.includes(puk));
 await assert.rejects(s.configure(pin,puk,{maxAge:18,allowAdult:true}),/ALREADY_CONFIGURED/);
});
await test('LOCAL_RULES_AUTH_REQUIRED_ALLOWLIST_NO_SOURCE_FIELDS_LIMIT_AND_DEFENSIVE_COPY',async()=>{
 const key=parentalContentKey('movie','Public title',2026,123);await s.setRule({key,minAge:16,alwaysPin:true,adult:false,title:'do-not-store',source:'do-not-store'});
 assert.ok(!f.raw.includes('do-not-store'));const copy=s.rule(key);copy.minAge=0;assert.equal(s.rule(key).minAge,16);
 await assert.rejects(s.setRule({key:'https://invalid',minAge:18,alwaysPin:false,adult:true}),/INVALID_RULE/);
 s.closeAdministration();await assert.rejects(s.removeRule(key),/PIN_REQUIRED/);assert.equal(await s.authenticate(pin),true);
});
await test('COOLDOWN_PERSISTS_RESTART_SIXTH_WRONG_ATTEMPT_THREE_HOURS_PUK_DOES_NOT_BYPASS',async()=>{
 for(let n=0;n<5;n++)assert.equal(await s.authenticate('000001'),false);
 await assert.rejects(s.authenticate('000001'),/COOLDOWN/);
 await assert.rejects(s.authenticate(pin),/COOLDOWN/);await assert.rejects(s.recoverPin(puk,nextPin),/COOLDOWN/);
 const restart=fixture(f.raw);await restart.store.load();await assert.rejects(restart.store.authenticate(pin),/COOLDOWN/);restart.store.lock();
 f.advance(3*60*60*1000-1);await assert.rejects(s.authenticate(pin),/COOLDOWN/);
 f.advance(2);assert.equal(await s.authenticate(pin),true);assert.equal(JSON.parse(f.raw).failures,0);
});
await test('PUK_RECOVERS_ONLY_PIN_PRESERVES_RULES_AND_POLICY_NEVER_AUTO_UNLOCKS',async()=>{
 const policy=s.getSnapshot().policy,rules=s.rules();assert.equal(await s.recoverPin('Wrong-PUK-Only-2026',nextPin),false);
 assert.equal(await s.recoverPin(puk,nextPin),true);assert.equal(s.getSnapshot().admin,false);assert.equal(s.adultVisible(),false);
 assert.deepEqual(s.rules(),rules);assert.deepEqual(s.getSnapshot().policy,policy);assert.equal(await s.authenticate(pin),false);assert.equal(await s.authenticate(nextPin),true);
});
await test('CHANGING_PUK_NEEDS_CURRENT_PUK_EVEN_WHEN_PIN_KNOWN',async()=>{
 const hash=JSON.parse(f.raw).puk.hash;assert.equal(await s.changePuk('Wrong-PUK-Only-2026',nextPuk),false);assert.equal(JSON.parse(f.raw).puk.hash,hash);
 assert.equal(await s.changePuk(puk,nextPuk),true);assert.notEqual(JSON.parse(f.raw).puk.hash,hash);
 assert.equal(await s.recoverPin(puk,pin),false);assert.equal(await s.recoverPin(nextPuk,pin),true);
});
await test('AGE_UNRATED_ALWAYS_PIN_GRANTS_ONLY_SELECTED_TITLE_SNAPSHOT_CANCEL_AND_LOCK',async()=>{
 const unsubscribe=s.subscribe(()=>{});assert.equal(await s.authorize('snapshot:A',10,false),true);
 let pending=s.authorize('snapshot:A',undefined,false);await new Promise(r=>setTimeout(r,0));let id=s.getSnapshot().prompt.id;
 assert.equal(await s.submitPrompt(id,'000002'),false);assert.ok(s.getSnapshot().prompt);assert.equal(await s.submitPrompt(id,pin),true);assert.equal(await pending,true);
 assert.equal(s.isGranted('snapshot:A'),true);assert.equal(s.isGranted('other-snapshot:A'),false);assert.equal(s.isGranted('snapshot:B'),false);
 pending=s.authorize('snapshot:B',0,false,true);await new Promise(r=>setTimeout(r,0));s.cancelPrompt();assert.equal(await pending,false);
 s.lock();assert.equal(s.isGranted('snapshot:A'),false);assert.equal(s.getSnapshot().admin,false);
 pending=s.authorize('snapshot:C',undefined,false);await new Promise(r=>setTimeout(r,0));s.lock();assert.equal(await pending,false);unsubscribe();
});
await test('ADULT_OPT_IN_PLUS_PIN_SESSION_REQUIRED_NOT_AGE18_ALONE_EXPIRY_AND_BACKGROUND',async()=>{
 assert.equal(await s.authenticate(pin),true);await s.updatePolicy({maxAge:18,allowAdult:false});await assert.rejects(s.authorize('adult',18,true),/ADULT_DISABLED/);
 await s.updatePolicy({maxAge:18,allowAdult:true});assert.equal(s.adultVisible(),false);assert.equal(await s.unlockAdult('000003'),false);assert.equal(await s.unlockAdult(pin),true);assert.equal(s.adultVisible(),true);
 f.advance(900001);assert.equal(s.adultVisible(),false);assert.equal(await s.unlockAdult(pin),true);s.lock();assert.equal(s.adultVisible(),false);
});
await test('CORRUPTION_DENIED_READ_WRITE_AND_CRYPTO_FAILURE_NEVER_REINITIALIZE',async()=>{
 const corrupt=fixture('{}');await corrupt.store.load();assert.equal(corrupt.store.getSnapshot().status,'error');await assert.rejects(corrupt.store.configure(pin,puk,{maxAge:18,allowAdult:true}),/STORAGE_UNAVAILABLE/);assert.equal(corrupt.raw,'{}');
 const denied=new ParentalControlStore({storage:{read:async()=>{throw Error('denied')},write:async()=>{throw Error('forbidden')}}});await denied.load();await assert.rejects(denied.authorize('any',0,false),/STORAGE_UNAVAILABLE/);
 const noCrypto=new ParentalControlStore({storage:fixture().storage,crypto:()=>undefined});await assert.rejects(noCrypto.configure(pin,puk,{maxAge:12,allowAdult:false}),/CRYPTO_UNAVAILABLE/);
 const storage={read:async()=>null,write:async()=>{}};const lostWrite=new ParentalControlStore({storage,crypto:()=>webcrypto});await assert.rejects(lostWrite.configure(pin,puk,{maxAge:12,allowAdult:false}),/STORAGE_UNAVAILABLE/);assert.equal(lostWrite.getSnapshot().status,'error');
});
await test('CONCURRENT_AUTH_SERIALIZED_BACKGROUND_DURING_KDF_NEVER_GRANTS_ADMIN',async()=>{
 const pending=s.authenticate(pin);await new Promise(r=>setTimeout(r,1));await assert.rejects(s.authenticate(pin),/BUSY/);s.lock();assert.equal(await pending,false);assert.equal(s.getSnapshot().admin,false);
});
await test('SOURCE_AGE_PARSER_DOES_NOT_TREAT_SCORE_OR_YEAR_AS_CERTIFICATION',()=>{
 for(const[v,want]of[['L',0],['Livre',0],['16+',16],['18 anos',18],[12,12],['7.8',undefined],['2026',undefined],['TV-MA',undefined]])assert.equal(parseParentalAge(v),want);
 assert.equal(sourceParentalAge({rating:'18',year:2026}),undefined);assert.equal(sourceParentalAge({metadata:{age_rating:'14'}}),14);
});
await test('DEFAULT_LIVE_PROJECTION_HIDES_ADULT_GROUP_CHANNEL_AND_NEVER_MUTATES_SOURCE',()=>{
 const normal={id:'a',name:'Public',groupId:'g',streamRef:{},metadata:{}},adult={id:'b',name:'Hidden',groupId:'adult',streamRef:{}},flagged={id:'c',name:'Flagged',groupId:'g',metadata:{adult:true},streamRef:{}};
 const raw={snapshotId:'fixture',groups:[{id:'g',name:'Abertos'},{id:'adult',name:'Adultos XXX'}],channels:[normal,adult,flagged],channelsByGroup:{g:[normal,flagged],adult:[adult]}};
 const copy=JSON.stringify(raw),visible=parentalLiveCatalog(raw);assert.deepEqual(visible.groups.map(g=>g.id),['g']);assert.deepEqual(visible.channels.map(c=>c.id),['a']);assert.equal(JSON.stringify(raw),copy);
});
await test('ACTUAL_PLAYBACK_GUARD_DENIAL_BEFORE_C9_OR_STREAM_AND_MANUAL_RULE_SURVIVES_RECOVERY',async()=>{
 const {parentalStorage}=await import('../src/parental/parental-storage.ts');let raw=null;parentalStorage.read=async()=>raw;parentalStorage.write=async value=>{raw=value};
 const {parentalControl}=await import('../src/parental/parental-control.store.ts');await parentalControl.configure(pin,puk,{maxAge:12,allowAdult:false});
 const {CatalogReadModel}=await import('../src/catalog/catalog-read-model.ts');const {PlaybackService}=await import('../src/playback/playback.service.ts');
 const movie={id:'movie-1',title:'Synthetic restricted',ageRating:18,genreIds:[],categoryIds:[],artworkIds:[],streamIds:[]};
 const model=new CatalogReadModel({metadata:{snapshotId:'synthetic-parental',counts:{}},categories:[],genres:[],artworks:[],movies:[movie],series:[{...movie,id:'series-1',seasonIds:[]}],seasons:[],episodes:[],streams:[]});
 let acquired=0,launched=0;const service=new PlaybackService({sessionGuard:{acquireSession:async()=>{acquired++;return{allowed:true}},releaseSession:async()=>{}},playerAdapter:{launch:async()=>{launched++;return{success:true,state:'NATIVE_PLAYER_OPENED'}}}});
 const unsubscribe=parentalControl.subscribe(()=>{});
 for(const operation of[()=>service.playMovie('movie-1',model),()=>service.playEpisode('series-1','episode-1',model)]){
  const result=await operation();assert.equal(parentalControl.getSnapshot().prompt,null);assert.equal(acquired,0);assert.equal(launched,0);assert.equal(result.success,false);
 }
 await parentalControl.setRule({key:parentalContentKey('movie',movie.title),minAge:18,alwaysPin:true,adult:false});
 assert.equal(await parentalControl.recoverPin(puk,nextPin),true);assert.equal(parentalControl.rules().length,1);assert.equal(acquired,0);assert.equal(launched,0);parentalControl.lock();unsubscribe();
});
await test('CURRENT_PIN_REQUIRED_TO_CHANGE_PIN_AND_LOCAL_RULE_CAP256',async()=>{
 const r=JSON.parse(f.raw);r.rules=Array.from({length:256},(_,i)=>({key:'movie:'+i.toString(16).padStart(32,'0'),minAge:16,alwaysPin:false,adult:false}));
 const bounded=fixture(JSON.stringify(r)),store=bounded.store;assert.equal(await store.authenticate(pin),true);
 const before=JSON.parse(bounded.raw).pin.hash;assert.equal(await store.changePin('000004',nextPin),false);assert.equal(JSON.parse(bounded.raw).pin.hash,before);
 await assert.rejects(store.setRule({key:'movie:'+'f'.repeat(32),minAge:18,alwaysPin:true,adult:false}),/RULE_LIMIT/);
 await store.removeRule('movie:'+'0'.repeat(32));await store.setRule({key:'movie:'+'f'.repeat(32),minAge:18,alwaysPin:true,adult:false});assert.equal(store.rules().length,256);
 assert.equal(await store.changePin(pin,nextPin),true);assert.equal(store.getSnapshot().admin,false);store.lock();
});
await test('ABORTED_ACCESS_AND_ABORT_DURING_PROMPT_NEVER_GRANT',async()=>{
 const abort=new AbortController();abort.abort();assert.equal(await s.authorize('aborted',undefined,false,false,abort.signal),false);
 const stop=new AbortController(),unsub=s.subscribe(()=>{}),result=s.authorize('pending-abort',undefined,false,false,stop.signal);await new Promise(r=>setTimeout(r,0));stop.abort();assert.equal(await result,false);assert.equal(s.isGranted('pending-abort'),false);unsub();
});
await test('LIVE_SEARCH_INVALIDATES_RESOLVED_ARTWORK_BEFORE_ASYNC_EFFECT_ON_RELOCK_RULE_ERROR',async()=>{
 let snapshot={status:'ready',contentRevision:0,lockRevision:0,adultSession:true,admin:false},cursor=0;const states=[],effects=[];
 const react={...React,useState:initial=>{const index=cursor++;if(!(index in states))states[index]=initial;return[states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value}]},useEffect:effect=>effects.push(effect)};
 const module={exports:{}},source=ts.transpileModule(readFileSync(new URL('../src/ui/components/SearchResults.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
 const require=name=>{
  if(name==='react')return{...react,default:react};
  if(name.includes('useParentalControl'))return{useParentalControl:()=>snapshot};
  if(name.includes('catalog-selectors'))return{};
  if(name.includes('parental-content'))return{canShowParentalItem:()=>true};
  if(name.includes('live-catalog.service'))return{LiveCatalogService:{loadChannelById:async()=>({channel:{id:'adult'}})}};
  if(name.includes('MediaCard'))return{MediaCard:()=>null};
  if(name.includes('Artwork'))return{Artwork:()=>null};
  throw Error('Uncontrolled parental search dependency '+name);
 };
 new Function('require','module','exports',source)(require,module,module.exports);
 const props={results:[{id:'adult',kind:'live',title:'Synthetic adult channel',posterUri:'https://fixture.invalid/art.svg'}],readModel:{catalog:{metadata:{snapshotId:'fixture'}},moviesById:new Map(),seriesById:new Map()},onSelectItem(){},onSelectLive(){}};
 const render=()=>{cursor=0;return module.exports.SearchResults(props)},buttons=tree=>{const result=[];function walk(n){if(!React.isValidElement(n))return;if(n.type==='button')result.push(n);React.Children.forEach(n.props.children,walk)}walk(tree);return result};
 const cleanups=[];
 async function hydrate(){render();for(const effect of effects.splice(0)){const cleanup=effect();if(cleanup)cleanups.push(cleanup)}await new Promise(r=>setTimeout(r,0));assert.equal(buttons(render()).length,1);effects.length=0;}
 await hydrate();snapshot={...snapshot,adultSession:false,lockRevision:1};assert.equal(buttons(render()).length,0,'relock must hide old live poster before the hydration effect runs');effects.length=0;
 for(const field of['contentRevision','status']){snapshot={...snapshot,adultSession:true};await hydrate();snapshot={...snapshot,[field]:field==='status'?'error':1};assert.equal(buttons(render()).length,0,'rules/storage change must invalidate approved IDs');effects.length=0;}
 for(const cleanup of cleanups)cleanup();
});
s.lock();console.log(JSON.stringify({result:'PASS',tests,backendRequests:0,physicalDevices:false}));
