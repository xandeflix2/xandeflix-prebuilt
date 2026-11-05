import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
const load=(file,require,ports={})=>{const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText.replaceAll('import.meta.env','({})');new Function('require','module','exports',...Object.keys(ports),code)(require,module,module.exports,...Object.values(ports));return module.exports;};
const metadata={peek:i=>({tmdbId:Number(i.tmdbId)}),resolve:async()=>null};
const {TmdbWatchProvidersService,watchAvailability,matchPlatform}=load('src/artwork/tmdb-watch-providers.service.ts',()=>({tmdbMetadataService:metadata}));
const row=(id,name='Netflix')=>({provider_id:id,provider_name:name,logo_path:'/synthetic.png'}),identity={kind:'movie',title:'Synthetic',tmdbId:123,sourcePosterUri:'https://private.invalid/never-sent?secret=synthetic'};
const response=data=>({ok:true,status:200,json:async()=>data});
const options={credential:()=> 'synthetic-api-token',identify:async()=>({tmdbId:123})};
let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name);}
await test('BR_ONLY_AND_SEPARATE_SUBSCRIPTION_FREE_RENT_BUY_WITH_VALIDATED_LOGOS',async()=>{
 let sent;const service=new TmdbWatchProvidersService({...options,fetchImpl:async url=>{sent=new URL(url);return response({results:{US:{flatrate:[row(8,'Other country')]},BR:{flatrate:[row(1),row(1),row(-1)],rent:[row(2,'Rental')],buy:[row(3,'Purchase')],free:[row(4,'Free')]}}});}});
 const value=await service.resolve(identity);assert.deepEqual(value.groups.map(g=>g.mode),['flatrate','free','rent','buy']);assert.equal(value.groups[0].providers.length,1);assert.equal(value.groups[0].providers[0].logo,'https://image.tmdb.org/t/p/w45/synthetic.png');assert.equal(sent.pathname,'/3/movie/123/watch/providers');assert.equal(sent.href.includes('private.invalid'),false);assert.equal(sent.href.includes('secret='),false);
});
await test('AMBIGUOUS_ID_NO_REQUEST_REGION_MISSING_NO_FABRICATED_PLATFORM',async()=>{
 let requests=0;const fetchImpl=async()=>{requests++;return response({results:{US:{flatrate:[row(1)]}}});};
 const noMatch=new TmdbWatchProvidersService({...options,identify:async()=>null,fetchImpl});assert.equal(await noMatch.resolve(identity),null);assert.equal(requests,0);
 const other=new TmdbWatchProvidersService({...options,fetchImpl});assert.deepEqual(await other.resolve(identity),{groups:[]});
 assert.deepEqual(watchAvailability({flatrate:[{provider_id:1,provider_name:'Safe',logo_path:'https://private.invalid/key'}]}).groups[0].providers,[{id:1,name:'Safe'}]);
});
await test('DEDUPE_AND_PUBLIC_PERSISTENT_CACHE_TTL_WITHOUT_SOURCE_IDENTITY_FIELDS',async()=>{
 let requests=0,stored='',clock=1000;const storage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
 const opts={...options,storage,now:()=>clock,fetchImpl:async()=>{requests++;return response({results:{BR:{flatrate:[row(1)]}}});}};
 const service=new TmdbWatchProvidersService(opts);await Promise.all([service.resolve(identity),service.resolve(identity)]);assert.equal(requests,1);assert.equal(stored.includes('private.invalid'),false);assert.equal(stored.includes('Synthetic'),false);assert.equal(stored.includes('synthetic-api-token'),false);
 const restored=new TmdbWatchProvidersService(opts);assert.equal(restored.peek(identity).groups[0].providers[0].name,'Netflix');await restored.resolve(identity);assert.equal(requests,1);clock+=86400001;await restored.resolve(identity);assert.equal(requests,2);
});
await test('LOGO_DIRECTORY_REGIONAL_CACHED_EXACT_ALIAS_UNKNOWN_NO_GUESS',async()=>{
 let requests=0;const service=new TmdbWatchProvidersService({...options,fetchImpl:async url=>{requests++;assert.equal(new URL(url).searchParams.get('watch_region'),'BR');return response({results:[row(1),row(2,'Amazon Prime Video'),row(3,'HBO Max')]});}});
 assert.equal(await service.logo('Netflix'),'https://image.tmdb.org/t/p/w45/synthetic.png');await service.logo('Prime Video');await service.logo('HBO');assert.equal(requests,1);assert.equal(await service.logo('Lançamentos'),undefined);
 assert.equal(matchPlatform('Netflix',[{id:1,name:'Netflix with Ads',logo:'x'}]),undefined);
});
await test('TRANSIENT_TIMEOUT_RATE_LIMIT_AND_MISSING_CREDENTIAL_NEVER_BLOCK_OR_CACHE_FALSE_SUCCESS',async()=>{
 const hung=new TmdbWatchProvidersService({...options,timeoutMs:5,fetchImpl:()=>new Promise(()=>{})});assert.equal(await hung.resolve(identity),null);assert.equal(hung.peek(identity),null);
 let calls=0;const rate=new TmdbWatchProvidersService({...options,fetchImpl:async()=>{calls++;return{ok:false,status:429};}});assert.equal(await rate.logo('Netflix'),undefined);assert.equal(await rate.logo('Netflix'),undefined);assert.equal(calls,1);
 const absent=new TmdbWatchProvidersService({...options,credential:()=>'',fetchImpl:async()=>{throw Error('UNEXPECTED');}});assert.equal(await absent.logo('Netflix'),undefined);
});
await test('CACHE_BOUNDED_AND_RELOADED_URLS_RECONSTRUCTED_FROM_ALLOWLIST',async()=>{
 let saved;const storage={getItem:()=>undefined,setItem:(_,v)=>{saved=JSON.parse(v);}};const service=new TmdbWatchProvidersService({...options,storage,identify:async i=>({tmdbId:Number(i.tmdbId)}),fetchImpl:async()=>response({results:{BR:{flatrate:[row(1)]}}})});
 for(let i=1;i<270;i++)await service.resolve({...identity,tmdbId:i});assert.ok(saved.entries.length<=256);
 const bad=new TmdbWatchProvidersService({...options,storage:{getItem:()=>JSON.stringify({version:1,entries:[['movie:123',{expires:Date.now()+1000,value:{groups:[{mode:'flatrate',providers:[{id:1,name:'Safe',logo:'https://private.invalid/key'}]}]}}]]}),setItem(){}}});assert.equal(bad.peek(identity).groups[0].providers[0].logo,undefined);
});
let availability={groups:[{mode:'flatrate',providers:[{id:1,name:'Netflix',logo:'https://image.tmdb.org/t/p/w45/synthetic.png'}]},{mode:'rent',providers:[{id:1,name:'Netflix',logo:'https://image.tmdb.org/t/p/w45/synthetic.png'},{id:2,name:'Variant',logo:'https://image.tmdb.org/t/p/w45/synthetic.png'},{id:3,name:' netflix ',logo:'https://image.tmdb.org/t/p/w45/alternate.png'},{id:4,name:'No logo'}]}]};
const {WatchProviders,uniqueWatchProviders}=load('src/ui/components/WatchProviders.tsx',name=>name==='react'?React:name.includes('useWatchProviders')?{useWatchProviders:()=>availability}:{});
await test('PRIME_COMMERCIAL_VARIANTS_ONE_BRAND_GLOBOPLAY_AND_UNKNOWN_SERVICES_DISTINCT',()=>{
 const provider=(id,name)=>({id,name,logo:`https://image.tmdb.org/t/p/w45/synthetic-${id}.png`});
 const rows=[provider(119,'Amazon Prime Video with Ads'),provider(10,'Amazon Video'),provider(9,'Amazon Prime Video'),provider(307,'Globoplay')];
 assert.deepEqual(uniqueWatchProviders(rows).map(p=>p.name),['Amazon Prime Video','Globoplay']);
 assert.deepEqual(uniqueWatchProviders([provider(1,'Prime Video'),...rows]).map(p=>p.name),['Prime Video','Globoplay']);
 assert.equal(uniqueWatchProviders([provider(1,'Unknown'),provider(2,'Unknown Amazon Channel'),provider(3,'Paramount+ Amazon Channel'),...rows]).length,5);
 assert.equal(uniqueWatchProviders([provider(1,'Netflix with Ads'),provider(2,'Netflix'),provider(3,'HBO Max Amazon Channel'),provider(4,'Max'),provider(5,'Globoplay Amazon Channel'),provider(6,'Globoplay')]).length,3);
});
await test('ONLY_UNIQUE_LOGOS_NO_VISIBLE_TEXT_MODES_OR_DUPLICATES_CREDITS_IN_SETTINGS',()=>{
 const html=renderToStaticMarkup(React.createElement(WatchProviders,{identity}));assert.equal((html.match(/<img/g)||[]).length,1);assert.ok(html.includes('alt="Netflix"'));assert.equal(html.replace(/<[^>]*>/g,''),'');assert.equal(html.includes('Disponibilidade'),false);assert.equal(html.includes('Assinatura'),false);assert.equal(html.includes('<button'),false);assert.ok(fs.readFileSync('src/ui/pages/SettingsPage.tsx','utf8').includes('JustWatch · TMDB'));availability=null;assert.equal(WatchProviders({identity}),null);
});
let uri,loadedUri;
const logoReact={...React,useState:()=>[loadedUri,value=>{loadedUri=value;} ]};
const {PlatformCategoryLogo}=load('src/ui/components/PlatformCategoryBadge.tsx',name=>name==='react'?logoReact:{usePlatformLogo:()=>({uri,failed:()=>{uri=undefined;}})});
await test('HERO_PLATFORM_NEVER_SHOWS_NAME_PENDING_FAILED_UNKNOWN_OR_BEFORE_IMAGE_LOAD',()=>{
 assert.equal(PlatformCategoryLogo({label:'Netflix'}),null);
 uri='https://image.tmdb.org/t/p/w45/synthetic.png';let image=PlatformCategoryLogo({label:'Netflix'});assert.equal(image.props.alt,'Netflix');assert.equal(image.props.style.visibility,'hidden');assert.equal(renderToStaticMarkup(image).replace(/<[^>]*>/g,''),'');
 image.props.onLoad({currentTarget:{currentSrc:uri}});image=PlatformCategoryLogo({label:'Netflix'});assert.equal(image.props.style.visibility,'visible');
 const previousUri=uri;uri='https://image.tmdb.org/t/p/w45/other.png';image=PlatformCategoryLogo({label:'Prime Video'});assert.equal(image.props.style.visibility,'hidden');image.props.onLoad({currentTarget:{currentSrc:previousUri}});assert.equal(PlatformCategoryLogo({label:'Prime Video'}).props.style.visibility,'hidden');
 image.props.onLoad({currentTarget:{currentSrc:uri}});assert.equal(PlatformCategoryLogo({label:'Prime Video'}).props.style.visibility,'visible');image.props.onError();assert.equal(PlatformCategoryLogo({label:'Prime Video'}),null);assert.equal(PlatformCategoryLogo({label:'Unknown platform'}),null);
});
await test('OPTIONAL_AVAILABILITY_DEFERRED_LOGO_IMMEDIATE_AND_UNMOUNTED_RESULTS_IGNORED',async()=>{
 const states=[],effects=[],timers=[];let index=0,requested=0,releaseA,releaseB;
 const react={useState:initial=>{const i=index++;return[states[i]??initial,next=>states[i]=next];},useEffect:fn=>effects.push(fn)};
 const service={peek:()=>null,peekLogo:()=>undefined,resolve:i=>{requested++;return new Promise(r=>i.tmdbId===1?releaseA=r:releaseB=r);},logo:async()=>{requested++;return 'synthetic-logo';}};
 const hooks=load('src/ui/hooks/useWatchProviders.ts',name=>name==='react'?react:name.includes('tmdb-watch-providers')?{tmdbWatchProvidersService:service}:{artworkIdentityKey:i=>i.kind+':'+i.tmdbId},{setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){}});
 index=0;hooks.useWatchProviders({...identity,tmdbId:1});const cleanupA=effects.pop()();assert.equal(requested,0);assert.equal(timers.at(-1).ms,250);timers.at(-1).fn();cleanupA();
 index=0;hooks.useWatchProviders({...identity,tmdbId:2});const cleanupB=effects.pop()();timers.at(-1).fn();releaseA({groups:[{mode:'buy',providers:[]}]});await Promise.resolve();assert.equal(states[0],undefined);releaseB({groups:[]});await Promise.resolve();index=0;assert.deepEqual(hooks.useWatchProviders({...identity,tmdbId:2}),{groups:[]});cleanupB();
 index=1;hooks.usePlatformLogo('Netflix');const beforeLogo=requested,timerCount=timers.length;const cleanupLogo=effects.pop()();assert.equal(requested,beforeLogo+1);assert.equal(timers.length,timerCount);cleanupLogo();await Promise.resolve();assert.equal(states[1],undefined);
});
await test('LOGO_PEEK_SYNCHRONOUS_PERSISTED_VALIDATED_AND_EXPIRES_WITH_DIRECTORY',async()=>{
 let clock=1000,stored='',requests=0;const opts={...options,now:()=>clock,storage:{getItem:()=>stored,setItem:(_,v)=>{stored=v;}},fetchImpl:async()=>{requests++;return response({results:[row(1)]});}};
 const service=new TmdbWatchProvidersService(opts);assert.equal(service.peekLogo('Netflix'),undefined);assert.equal(requests,0);
 await service.logo('Netflix');assert.equal(service.peekLogo('Netflix'),'https://image.tmdb.org/t/p/w45/synthetic.png');assert.equal(requests,1);
 const restored=new TmdbWatchProvidersService(opts);assert.equal(restored.peekLogo('Netflix'),'https://image.tmdb.org/t/p/w45/synthetic.png');assert.equal(restored.peekLogo('Not a platform'),undefined);assert.equal(requests,1);
 clock+=7*86400000+1;assert.equal(restored.peekLogo('Netflix'),undefined);assert.equal(requests,1);
});
await test('CACHED_LOGO_FIRST_RENDER_FAILURE_AND_STALE_LABEL_NEVER_REINTRODUCE_OLD_LOGO',async()=>{
 let state,releaseA,releaseB,calls=0;const effects=[],timers=[];
 const url='https://image.tmdb.org/t/p/w45/';const service={peekLogo:label=>url+(label==='Netflix'?'a.png':'b.png'),logo:label=>{calls++;return new Promise(r=>label==='Netflix'?releaseA=r:releaseB=r);}};
 const react={useState:()=>[state,v=>{state=v;}],useEffect:fn=>effects.push(fn)};
 const hook=load('src/ui/hooks/useWatchProviders.ts',name=>name==='react'?react:name.includes('tmdb-watch-providers')?{tmdbWatchProvidersService:service}:{artworkIdentityKey:()=>''},{setTimeout:(fn,ms)=>{timers.push({fn,ms});},clearTimeout(){}});
 let a=hook.usePlatformLogo('Netflix');assert.equal(a.uri,url+'a.png');const cleanupA=effects.pop()();assert.equal(calls,1);assert.equal(timers.length,0);
 cleanupA();let b=hook.usePlatformLogo('Prime');const cleanupB=effects.pop()();assert.equal(b.uri,url+'b.png');releaseA(url+'old.png');await Promise.resolve();assert.equal(state,undefined);
 releaseB(url+'b.png');await Promise.resolve();b=hook.usePlatformLogo('Prime');assert.equal(b.uri,url+'b.png');b.failed();assert.equal(hook.usePlatformLogo('Prime').uri,undefined);cleanupB();
});
await test('WARMUP_DEDUPES_VALIDATED_SMALL_IMAGES_AND_NEVER_WAITS_ON_CONTENT',async()=>{
 const images=[],timers=new Map();let serial=0,lookups=0;
 class Image{naturalWidth=45;set src(value){this.uri=value;images.push(this);}}
 const service={logo:async label=>{lookups++;return label==='Unsafe'?'https://private.invalid/key':'https://image.tmdb.org/t/p/w45/'+(label==='Alias'?'Netflix':label)+'.png';}};
 const hook=load('src/ui/hooks/useWatchProviders.ts',name=>name==='react'?{}:name.includes('tmdb-watch-providers')?{tmdbWatchProvidersService:service}:{},{Image,setTimeout:(fn,ms)=>{assert.equal(ms,8000);const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
 const one=hook.warmPlatformLogos(['Netflix','Netflix','Alias','Unsafe']);await Promise.resolve();await Promise.resolve();assert.equal(images.length,1);assert.equal(lookups,3);assert.equal(images[0].fetchPriority,'low');assert.equal(images[0].referrerPolicy,'no-referrer');
 const two=hook.warmPlatformLogos(['Netflix']);await Promise.resolve();assert.equal(images.length,1);images[0].onload();await Promise.all([one,two]);assert.equal(timers.size,0);
 await hook.warmPlatformLogos(['Netflix']);assert.equal(images.length,1);
});
await test('WARMUP_BOUNDS_CONCURRENT_IMAGES_AND_CLEANS_ERROR_TIMEOUT',async()=>{
 const images=[],timers=new Map();let serial=0;
 class Image{naturalWidth=45;set src(v){this.uri=v;images.push(this);}removeAttribute(name){assert.equal(name,'src');this.cancelled=true;}}
 const hook=load('src/ui/hooks/useWatchProviders.ts',name=>name==='react'?{}:name.includes('tmdb-watch-providers')?{tmdbWatchProvidersService:{logo:async label=>'https://image.tmdb.org/t/p/w45/'+label+'.png'}}:{},{Image,setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
 const a=hook.warmPlatformLogos(Array.from({length:100},(_,i)=>'p'+i));await Promise.resolve();await Promise.resolve();assert.equal(images.length,8);
 const b=hook.warmPlatformLogos(['different']);await Promise.resolve();await Promise.resolve();assert.equal(images.length,8);await b;
 images[0].onerror();for(const callback of [...timers.values()])callback();await a;assert.equal(timers.size,0);assert.ok(images.every(i=>i.onload===null&&i.onerror===null&&i.cancelled));
});
await test('WARMUP_RETAINS_ONLY_SIXTEEN_SMALL_DECODED_LOGOS',async()=>{
 const images=[];class Image{naturalWidth=45;set src(v){this.uri=v;images.push(this);}}
 const hook=load('src/ui/hooks/useWatchProviders.ts',name=>name==='react'?{}:name.includes('tmdb-watch-providers')?{tmdbWatchProvidersService:{logo:async label=>'https://image.tmdb.org/t/p/w45/'+label+'.png'}}:{} ,{Image});
 for(let i=0;i<17;i++){const p=hook.warmPlatformLogos(['brand'+i]);await Promise.resolve();await Promise.resolve();images.at(-1).onload();await p;}
 assert.equal(images.length,17);const evicted=hook.warmPlatformLogos(['brand0']);await Promise.resolve();await Promise.resolve();assert.equal(images.length,18);images.at(-1).onload();await evicted;
});
console.log(JSON.stringify({tests,pass:true,syntheticOnly:true,liveApiRequests:0}));

console.log("HERO_PLATFORM_LOGOS=PASS");
