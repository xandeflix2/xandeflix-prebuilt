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
await test('OPTIONAL_HOOKS_DEFER_REQUESTS_AND_IGNORE_STALE_OR_UNMOUNTED_RESULTS',async()=>{
 const states=[],effects=[],timers=[];let index=0,requested=0,releaseA,releaseB;
 const react={useState:initial=>{const i=index++;return[states[i]??initial,next=>states[i]=next];},useEffect:fn=>effects.push(fn)};
 const service={peek:()=>null,resolve:i=>{requested++;return new Promise(r=>i.tmdbId===1?releaseA=r:releaseB=r);},logo:async()=>{requested++;return 'synthetic-logo';}};
 const hooks=load('src/ui/hooks/useWatchProviders.ts',name=>name==='react'?react:name.includes('tmdb-watch-providers')?{tmdbWatchProvidersService:service}:{artworkIdentityKey:i=>i.kind+':'+i.tmdbId},{setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){}});
 index=0;hooks.useWatchProviders({...identity,tmdbId:1});const cleanupA=effects.pop()();assert.equal(requested,0);assert.equal(timers.at(-1).ms,250);timers.at(-1).fn();cleanupA();
 index=0;hooks.useWatchProviders({...identity,tmdbId:2});const cleanupB=effects.pop()();timers.at(-1).fn();releaseA({groups:[{mode:'buy',providers:[]}]});await Promise.resolve();assert.equal(states[0],undefined);releaseB({groups:[]});await Promise.resolve();index=0;assert.deepEqual(hooks.useWatchProviders({...identity,tmdbId:2}),{groups:[]});cleanupB();
 index=1;hooks.usePlatformLogo('Netflix');const cleanupLogo=effects.pop()();assert.equal(timers.at(-1).ms,2000);timers.at(-1).fn();cleanupLogo();await Promise.resolve();assert.equal(states[1],undefined);
});
console.log(JSON.stringify({tests,pass:true,syntheticOnly:true,liveApiRequests:0}));
