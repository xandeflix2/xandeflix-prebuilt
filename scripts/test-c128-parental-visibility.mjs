import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import ts from 'typescript';
import {parentalControl} from '../src/parental/parental-control.store.ts';
import {parentalStorage} from '../src/parental/parental-storage.ts';
import {canShowParentalItem,parentalItemAge,parentalContentKey,canShowParentalLive,parentalLiveCatalog} from '../src/parental/parental-content.ts';
import {authorizeParentalItem} from '../src/parental/parental-access.ts';
import {moviePresentationService,seriesPresentationService,SeriesPresentationService,subscribePresentationAges} from '../src/artwork/series-presentation.service.ts';
let tests=0,raw=null;const test=async(name,fn)=>{await fn();tests++;console.log('PASS '+name)};
parentalStorage.read=async()=>raw;parentalStorage.write=async value=>{raw=value};
const pin='135790',puk='Synthetic-PUK-C128-Only',ages=[0,10,12,14,16,18];
const item=(age,kind='movie',id=String(age))=>({id,kind,title:'Synthetic '+id,categoryLabels:[],genreLabels:[],parental:{key:parentalContentKey(kind,'Synthetic '+id),age,adult:false}});
await test('DEFAULT_COMMON_VISIBLE_ADULT_HIDDEN_THEN_INCLUSIVE_AGE_MATRIX_ALL_KINDS',async()=>{
 await parentalControl.load();assert.equal(canShowParentalItem(item(18)),true);assert.equal(canShowParentalItem({...item(18),parental:{...item(18).parental,adult:true}}),false);
 await parentalControl.configure(pin,puk,{maxAge:12,allowAdult:true});
 for(const maxAge of ages){await parentalControl.updatePolicy({maxAge,allowAdult:true});for(const kind of['movie','series'])for(const age of[...ages,undefined])assert.equal(canShowParentalItem(item(age,kind)),age===undefined||age<=maxAge);}
 await parentalControl.updatePolicy({maxAge:12,allowAdult:true});
});
await test('UNRATED_PIN_GRANT_NEVER_BYPASSES_LATER_KNOWN_ABOVE_LIMIT',async()=>{
 const unsub=parentalControl.subscribe(()=>{}),key='snapshot:unrated';const pending=parentalControl.authorize(key,undefined,false);await new Promise(r=>setTimeout(r,0));const id=parentalControl.getSnapshot().prompt.id;
 await parentalControl.submitPrompt(id,pin);assert.equal(await pending,true);assert.equal(parentalControl.isGranted(key),true);
 assert.equal(await parentalControl.authorize(key,18,false),false);assert.equal(parentalControl.getSnapshot().prompt,null);assert.equal(await parentalControl.authorize('above',14,false),false);unsub();
 const local=parentalContentKey('movie','learned after PIN'),scoped='snapshot:'+local,stop=parentalControl.subscribe(()=>{}),wait=parentalControl.authorize(scoped,undefined,false);await new Promise(r=>setTimeout(r,0));await parentalControl.submitPrompt(parentalControl.getSnapshot().prompt.id,pin);assert.equal(await wait,true);
 parentalControl.rememberAge(local,18);assert.equal(parentalControl.isGranted(scoped),false,'learning an excluded age revokes the previous unknown-title grant');stop();
});
await test('MANUAL_RULE_CAN_HIDE_ALLOWED_SOURCE_WITHOUT_MUTATING_CARD_AND_ALWAYS_PIN_IS_PRESERVED',async()=>{
 const card=item(0),copy=JSON.stringify(card);await parentalControl.setRule({key:card.parental.key,minAge:16,alwaysPin:false,adult:false});assert.equal(canShowParentalItem(card),false);assert.equal(JSON.stringify(card),copy);
 await parentalControl.setRule({key:card.parental.key,minAge:12,alwaysPin:true,adult:false});assert.equal(canShowParentalItem(card),true);
 const unsub=parentalControl.subscribe(()=>{}),access=authorizeParentalItem(card,'manual');await new Promise(r=>setTimeout(r,0));assert.ok(parentalControl.getSnapshot().prompt);parentalControl.cancelPrompt();assert.equal(await access,false);unsub();
});
await test('TMDB_CACHE_AND_RAM_CLASSIFICATION_HIDE_IMMEDIATELY_AND_SOURCE_CANNOT_LOWER',async()=>{
 const a=item(undefined,'movie','tmdb'),b=item(0,'series','series-tmdb');a.externalIds={tmdbId:123};b.externalIds={tmdbId:456};
 const moviePeek=moviePresentationService.peek,seriesPeek=seriesPresentationService.peek;
 moviePresentationService.peek=id=>id===123?{tmdbId:123,ageRating:'16'}:null;seriesPresentationService.peek=id=>id===456?{tmdbId:456,ageRating:'18'}:null;
 try{assert.equal(parentalItemAge(a),16);assert.equal(canShowParentalItem(a),false);assert.equal(canShowParentalItem(b),false);assert.equal(await authorizeParentalItem(a,'cached'),false);assert.equal(parentalControl.getSnapshot().prompt,null);}finally{moviePresentationService.peek=moviePeek;seriesPresentationService.peek=seriesPeek;}
 const c=item(undefined,'movie','ram');assert.equal(canShowParentalItem(c),true);const revision=parentalControl.getSnapshot().revision,contentRevision=parentalControl.getSnapshot().contentRevision;
 parentalControl.rememberAge(c.parental.key,16);assert.equal(canShowParentalItem(c),false);assert.ok(parentalControl.getSnapshot().revision>revision);assert.equal(parentalControl.getSnapshot().contentRevision,contentRevision,'VOD metadata must not restart Live preview');
 parentalControl.rememberAge(c.parental.key,0);assert.equal(parentalItemAge(c),16);
});
await test('CLASSIFICATION_OVERLAY_BOUNDED512_NOT_SERIALIZED_IN_PIN_RECORD',()=>{
 const before=raw;for(let n=0;n<513;n++)parentalControl.rememberAge(parentalContentKey('movie','bounded'+n),16);
 assert.equal(parentalControl.knownAge(parentalContentKey('movie','bounded0')),undefined);assert.equal(parentalControl.knownAge(parentalContentKey('movie','bounded512')),16);assert.equal(raw,before);
});
await test('LIVE_CHANNEL_AGE_FILTER_KNOWN_HIDDEN_UNKNOWN_VISIBLE_IMMUTABLE',async()=>{
 const channels=[0,12,16,undefined].map((age,n)=>({id:'c'+n,name:'Channel '+n,groupId:'g',groupName:'Abertos',metadata:age===undefined?{}:{age_rating:age},streamRef:{}}));
 const catalog={snapshotId:'live',groups:[{id:'g',name:'Abertos'}],channels,channelsByGroup:{g:channels}},before=JSON.stringify(catalog);
 assert.deepEqual(channels.map(c=>canShowParentalLive(c,catalog)),[true,true,false,true]);assert.deepEqual(parentalLiveCatalog(catalog).channels.map(c=>c.id),['c0','c1','c3']);assert.equal(JSON.stringify(catalog),before);
});
await test('EXPLICIT_ADULT_REMAINS_CLOSED_UNTIL_RESPONSIBLE_PIN_SESSION',async()=>{
 const card={...item(18,'movie','adult'),parental:{...item(18,'movie','adult').parental,adult:true}};assert.equal(canShowParentalItem(card),false);
 await assert.rejects(parentalControl.unlockAdult(pin),/ADULT_AGE_LIMIT/);assert.equal(canShowParentalItem(card),false);await parentalControl.updatePolicy({maxAge:18,allowAdult:true});await parentalControl.unlockAdult(pin);assert.equal(canShowParentalItem(card),true);parentalControl.lock();assert.equal(canShowParentalItem(card),false);assert.equal(await parentalControl.authenticate(pin),true);await parentalControl.updatePolicy({maxAge:12,allowAdult:true});
});
await test('VISIBLE_CLASSIFICATION_HOOK_SKIPS_OFFSCREEN_UNCONFIGURED_KNOWN_AND_IGNORES_STALE_RESULT',async()=>{
 let visible=true,ready=true,calls=0,pending,remembered=0;const effects=[];
 const module={exports:{}},source=ts.transpileModule(readFileSync(new URL('../src/ui/hooks/useParentalClassification.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',source)(name=>{
  if(name==='react')return{useEffect:f=>effects.push(f)};
  if(name.includes('parental-content'))return{canShowParentalItem:()=>true,parentalItemAge:()=>visible?undefined:0,parentalViewKey:()=> 'fixture',parseParentalAge:()=>16};
  if(name.includes('parental-control.store'))return{parentalControl:{rememberAge:()=>remembered++}};
  if(name.includes('useParentalControl'))return{useParentalControl:()=>({status:ready?'ready':'unconfigured'})};
  if(name.includes('series-presentation'))return{resolveMoviePresentation:()=>{calls++;return new Promise(r=>pending=r)},resolveSeriesPresentation:()=>{throw Error('WRONG_KIND')}};
  if(name.includes('tmdb-metadata'))return{tmdbPosterPath:()=>undefined};throw Error(name);
 },module,module.exports);
 const hook=module.exports.useParentalClassification,card=item(undefined),run=(on)=>{hook(card,on);return effects.splice(0).map(f=>f()).filter(Boolean)};
 run(false);ready=false;run(true);ready=true;visible=false;run(true);assert.equal(calls,0);visible=true;const cleanup=run(true);assert.equal(calls,1);cleanup.forEach(f=>f());pending({ageRating:'16'});await new Promise(r=>setTimeout(r,0));assert.equal(remembered,0);
 run(true);pending({ageRating:'16'});await new Promise(r=>setTimeout(r,0));assert.equal(remembered,1);
});
await test('HOME_HERO_RECOMPUTES_CURRENT_ITEM_WHEN_ELIGIBILITY_CHANGES_WITHOUT_NEW_DOWNLOAD',()=>{
 const cells=[];let cursor=0;
 const react={...React,useMemo:(fn,deps)=>{const at=cursor++,old=cells[at];if(!old||deps.some((v,i)=>!Object.is(v,old.deps[i])))cells[at]={deps,value:fn()};return cells[at].value},useState:initial=>{const at=cursor++;if(!(at in cells))cells[at]={value:typeof initial==='function'?initial():initial};return[cells[at].value,()=>{}]},useRef:value=>{const at=cursor++;if(!(at in cells))cells[at]={current:value};return cells[at]},useEffect:()=>{cursor++}};
 const a=item(16,'movie','a'),b=item(12,'movie','b'),incoming=[{key:'a',item:a},{key:'b',item:b}],Hero=()=>null;
 let eligible=[{item:a,uri:'a'}],eligibilityKey='a';const module={exports:{}};
 const source=ts.transpileModule(readFileSync(new URL('../src/ui/components/HomeHero.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',source)(name=>{if(name==='react')return{...react,default:react};if(name.includes('useHeroLayout'))return{useHeroLayout:()=>false};if(name.includes('device-presentation'))return{isFireTvPresentation:()=>false};if(name.endsWith('/Hero.tsx'))return{Hero};if(name.includes('useHeroArtwork'))return{useHeroArtwork:()=>({eligible,eligibilityKey,revision:0,pending:false,reject(){}})};if(name.includes('CategoryHero'))return{HeroPreparing:()=>null};throw Error(name)},module,module.exports);
 const render=()=>{cursor=0;return module.exports.HomeHero({options:incoming,onSelect(){},nextBatch:async()=>false,displayed(){}})};
 const current=tree=>React.Children.toArray(tree.props.children).find(n=>React.isValidElement(n)&&n.type===Hero)?.props.item.id;
 assert.equal(current(render()),'a');eligible=[{item:b,uri:'b'}];eligibilityKey='b';assert.equal(current(render()),'b');
});
await test('UNRATED_ACTUAL_PLAYBACK_STILL_PROMPTS_BEFORE_C9_AND_CANCEL_DOES_NOT_LAUNCH',async()=>{
 const{CatalogReadModel}=await import('../src/catalog/catalog-read-model.ts'),{PlaybackService}=await import('../src/playback/playback.service.ts');
 const row={id:'unknown',title:'Unrated playback fixture',genreIds:[],categoryIds:[],artworkIds:[],streamIds:[]},model=new CatalogReadModel({metadata:{snapshotId:'test-unrated',counts:{}},movies:[row],series:[],seasons:[],episodes:[],streams:[],artworks:[],categories:[],genres:[]});
 let acquired=0,launched=0;const service=new PlaybackService({sessionGuard:{acquireSession:async()=>{acquired++;return{allowed:true}},releaseSession:async()=>{}},playerAdapter:{launch:async()=>{launched++;return{success:true}}}});
 const stop=parentalControl.subscribe(()=>{}),result=service.playMovie(row.id,model);for(let n=0;n<100&&!parentalControl.getSnapshot().prompt;n++)await new Promise(r=>setTimeout(r,2));assert.ok(parentalControl.getSnapshot().prompt);assert.equal(acquired,0);assert.equal(launched,0);parentalControl.cancelPrompt();assert.equal((await result).success,false);stop();
});
await test('PUBLIC_PRESENTATION_CACHE_NOTIFIES_PARENTAL_FILTER_WITHOUT_LIVE_OR_CATALOG_REVISION',async()=>{
 let calls=0;const stop=subscribePresentationAges(()=>calls++),before=parentalControl.getSnapshot();
 const service=new SeriesPresentationService({kind:'movie',credential:()=> '0'.repeat(32),fetchImpl:async()=>({ok:true,json:async()=>({id:987,release_dates:{results:[{iso_3166_1:'BR',release_dates:[{certification:'16'}]}]}})})});
 await service.resolve(987);assert.equal(calls,1);assert.ok(parentalControl.getSnapshot().revision>before.revision);assert.equal(parentalControl.getSnapshot().contentRevision,before.contentRevision);await service.resolve(987);assert.equal(calls,1,'cache hit must not notify again');stop();
});
parentalControl.lock();console.log(JSON.stringify({result:'PASS',tests,actualRemoteCalls:0,physicalDevices:false}));
