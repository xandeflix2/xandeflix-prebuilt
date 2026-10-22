import assert from'node:assert/strict';
import{TmdbMetadataService,artworkIdentityKey,tmdbPosterPath}from'../src/artwork/tmdb-metadata.service.ts';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { displayArtworkUri, chooseArtworkUri } from '../src/artwork/artwork-uri.ts';
const picture=(file,language=null,width=1920,height=1080)=>({file_path:file,iso_639_1:language,width,height,aspect_ratio:width/height,vote_average:5});
const raw={id:701,title:'Synthetic Backdrop',original_title:'Synthetic Backdrop',release_date:'2020-01-01',poster_path:'/poster.jpg',backdrop_path:null,genres:[],images:{backdrops:[picture('/neutral.jpg'),picture('/portuguese.jpg','pt'),picture('/english.jpg','en'),picture('/portrait.jpg',null,500,900)],posters:[]}};
const fixture=(value=raw,storage)=>{const requests=[];const service=new TmdbMetadataService({credential:()=> 'synthetic-public-fixture',storage,fetchImpl:async input=>{const url=new URL(input);requests.push(url.pathname);assert.equal(url.origin,'https://api.themoviedb.org');return{ok:true,status:200,json:async()=>value};}});return{service,requests};};
const identity={kind:'movie',title:'Synthetic Backdrop',tmdbId:701,year:2020};
let f=fixture();const value=await f.service.resolve(identity);
assert.equal(value.backdropUri,'https://image.tmdb.org/t/p/w1280/neutral.jpg','missing primary must use a valid same-work horizontal alternative');
assert.equal(f.requests.length,1);
console.log('PASS_MISSING_PRIMARY_HORIZONTAL_ALTERNATIVE');

const{chooseDetailBackdropUri,isHorizontalDetailBackdrop}=await import('../src/artwork/detail-backdrop.ts');
assert.deepEqual(value.backdropUris,['https://image.tmdb.org/t/p/w1280/neutral.jpg','https://image.tmdb.org/t/p/w1280/portuguese.jpg','https://image.tmdb.org/t/p/w1280/english.jpg']);
const failed=new Set([value.backdropUri]);assert.equal(chooseDetailBackdropUri(value,failed),value.backdropUris[1]);
assert.equal(chooseDetailBackdropUri(value,new Set(value.backdropUris)),undefined);
for(const uri of ['https://private.synthetic.invalid/token.jpg','http://image.tmdb.org/t/p/w1280/unsafe.jpg','https://image.tmdb.org/t/p/w1280/../secret','https://user:secret@image.tmdb.org/t/p/w1280/unsafe.jpg'])assert.equal(chooseDetailBackdropUri({...value,backdropUri:uri,backdropUris:[uri]},new Set()),undefined);
assert.equal(isHorizontalDetailBackdrop(1280,720),true);for(const dims of [[500,900],[0,0],[50,20],[1280,1280],[Infinity,720],[1280,-1],[1920,100]])assert.equal(isHorizontalDetailBackdrop(...dims),false);
console.log('PASS_ALTERNATE_RETRY_UNSAFE_URLS_AND_GEOMETRY_NEGATIVES');

const bad={...raw,images:{backdrops:[picture('/../private.jpg'),picture('/tall.jpg',null,500,900),picture('/tiny.jpg',null,100,50)]}};
assert.equal((await fixture(bad).service.resolve(identity)).backdropUri,undefined);
const many={...raw,images:{backdrops:Array.from({length:40},(_,n)=>picture('/valid'+n+'.jpg'))}};
assert.equal((await fixture(many).service.resolve(identity)).backdropUris.length,8);
assert.equal(await fixture({...raw,id:999}).service.resolve(identity),null,'wrong identity cannot supply a backdrop');
console.log('PASS_BOUNDED_ALTERNATIVES_INVALID_PATHS_AND_WRONG_ID');

let persisted;const now=Date.now(),old={version:2,entries:[[artworkIdentityKey(identity),{expires:now+60000,value:{kind:'movie',tmdbId:701,posterUri:'https://image.tmdb.org/t/p/w342/poster.jpg',genres:[]}}]]};
f=fixture(raw,{getItem:()=>JSON.stringify(old),setItem:(_k,s)=>{persisted=s;}});
assert.equal(f.service.peek(identity).backdropUri,undefined);
const [a,b]=await Promise.all([f.service.resolveBackdrop(identity),f.service.resolveBackdrop(identity)]);
assert.equal(a.backdropUris.length,3);assert.equal(b,a);assert.equal(f.requests.length,1,'new purpose refreshes an old poster-only positive once');
assert.equal(f.service.peek(identity).tmdbId,701,'normal poster cache is preserved');
assert.equal(f.service.peekBackdrop(identity),a);
assert.equal((await f.service.resolveBackdrop(identity)),a);assert.equal(f.requests.length,1);
console.log('PASS_OLD_CACHE_PURPOSE_REFRESH_DEDUP_AND_WARM_CACHE');

f=fixture();await f.service.resolve(identity);const calls=f.requests.length;assert.equal((await f.service.resolveBackdrop(identity)).backdropUris.length,3);assert.equal(f.requests.length,calls,'already enriched normal result needs no duplicate query');
assert.equal(await fixture({...raw,id:702}).service.resolveBackdrop(identity),null);
const series={kind:'series',title:'Synthetic Backdrop',tmdbId:703};f=fixture({...raw,id:703,name:'Synthetic Backdrop',first_air_date:'2020-01-01'});assert.equal((await f.service.resolveBackdrop(series)).kind,'series');assert.match(f.requests[0],/^\/3\/tv\/703$/);
console.log('PASS_KIND_ISOLATION_AND_NO_DUPLICATE_ENRICHED_LOOKUP');

const poison={version:2,entries:[[artworkIdentityKey(identity),{expires:Date.now()+60000,value:{kind:'movie',tmdbId:701,posterUri:'https://image.tmdb.org/t/p/w342/poster.jpg',backdropUris:['https://private.synthetic.invalid/token.jpg','file:///private','https://image.tmdb.org/t/p/w1280/safe.jpg'],genres:[]}}]]};
f=fixture(raw,{getItem:()=>JSON.stringify(poison),setItem(){}});assert.deepEqual(f.service.peekBackdrop(identity).backdropUris,['https://image.tmdb.org/t/p/w1280/safe.jpg']);
console.log('PASS_PRIVATE_OR_ARBITRARY_CACHE_URLS_REJECTED');

// Execute the real TSX and effects with controlled image/metadata boundaries.
function harness() {
  const states=[],effects=[];let si=0,ei=0,dirty=false,tree,component,props;
  const hooks={...React,useState(initial){const i=si++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>{const next=typeof value==='function'?value(states[i]):value;if(!Object.is(next,states[i])){states[i]=next;dirty=true;}}];},
    useEffect(fn,deps){const i=ei++,old=effects[i];if(!old||deps.some((v,n)=>!Object.is(v,old.deps[n])))effects[i]={fn,deps,cleanup:old?.cleanup,changed:true};}};
  const render=()=>{for(let n=0;n<20;n++){dirty=false;si=ei=0;tree=component(props);for(const effect of effects)if(effect.changed){effect.cleanup?.();effect.changed=false;effect.cleanup=effect.fn();}if(!dirty)return tree;}throw Error('UNSETTLED_HOOKS');};
  return{hooks,mount(fn,p){component=fn;props=p;return render();},render,close(){for(const e of effects)e.cleanup?.();}};
}
function loadTsx(file,imports){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(name=>{for(const[key,value]of Object.entries(imports))if(name.includes(key))return value;throw Error('UNCONTROLLED_TEST_IMPORT '+name);},module,module.exports);return module.exports;}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const savedWindow=globalThis.window;globalThis.window={addEventListener(){},removeEventListener(){}};
try{
  const h=harness(),jobs=[],notifications=[];let meta={backdropUri:value.backdropUris[0],backdropUris:value.backdropUris};
  const {Artwork}=loadTsx('src/ui/components/Artwork.tsx',{
    react:{default:h.hooks,...h.hooks},'artwork-uri':{displayArtworkUri,chooseArtworkUri},'tmdb-metadata':{artworkIdentityKey,tmdbPosterPath},
    'detail-backdrop':{chooseDetailBackdropUri,isHorizontalDetailBackdrop},'series-poster-claims':{seriesPosterClaims:{watch(){return()=>{};}}},
    useArtworkMetadata:{useArtworkMetadataState:(_id,_enabled,_priority,detail)=>{assert.equal(detail,true);return{metadata:meta,pending:false};}},
    'image-load-queue':{isImageReady:()=>false,reserveHeroImageSlot:()=>()=>{},invalidateLoadedImage(){},loadImage:(uri,_priority,signal)=>new Promise(resolve=>jobs.push({uri,signal,resolve}))},
    'artwork-file-cache':{invalidateCachedArtworkUri(){}},'artwork-visibility':{observeArtwork:()=>()=>{}}
  });
  const element=Artwork.type({identity,title:identity.title,kind:'backdrop',priority:'high',tmdbBackdropOnly:true,detailBackdrop:true,hideEmpty:true,onReadyChange:ready=>notifications.push(ready)});
  let tree=h.mount(element.type,element.props);assert.match(tree.props.className,/artwork-empty/);assert.equal(notifications.at(-1),false);
  jobs[0].resolve({ok:false});await tick();h.render();assert.equal(jobs.at(-1).uri,value.backdropUris[1]);
  jobs.at(-1).resolve({ok:true,width:500,height:900,src:'https://localhost/portrait'});await tick();h.render();assert.equal(jobs.at(-1).uri,value.backdropUris[2],'decoded portrait rejected, next horizontal tried');
  jobs.at(-1).resolve({ok:true,width:1280,height:720,src:'https://localhost/horizontal'});await tick();tree=h.render();assert.equal(tree.type,'img');assert.equal(tree.props.src,'https://localhost/horizontal');assert.equal(notifications.at(-1),true);
  tree.props.onError();h.render();const pendingJob=jobs.at(-1);h.close();assert.equal(pendingJob.signal.aborted,true);
  pendingJob.resolve({ok:true,width:1280,height:720,src:'https://localhost/stale'});await tick();assert.equal(notifications.at(-1),false,'failed display restores composition and unmounted decode cannot publish');
  const m=harness();const FakeArtwork=()=>null;
  const{DetailBackdrop}=loadTsx('src/ui/components/DetailBackdrop.tsx',{react:{default:m.hooks,...m.hooks},'tmdb-metadata':{artworkIdentityKey},Artwork:{Artwork:FakeArtwork}});
  const outer=DetailBackdrop({identity,title:'Fixture',poster:'synthetic-poster'});let surface=m.mount(outer.type,outer.props);
  assert.equal(surface.props['data-detail-backdrop'],'poster-composition');assert.equal(surface.props.children[0].props.uri,'synthetic-poster');
  surface.props.children[1].props.onReadyChange(true);surface=m.render();assert.equal(surface.props['data-detail-backdrop'],'horizontal');assert.equal(surface.props.children[0],false);
  surface.props.children[1].props.onReadyChange(false);surface=m.render();assert.equal(surface.props['data-detail-backdrop'],'poster-composition');
  assert.notEqual(outer.key,DetailBackdrop({identity:{...identity,tmdbId:702},title:'Another',poster:'synthetic-poster'}).key,'route identity remount isolates images');m.close();
}finally{if(savedWindow===undefined)delete globalThis.window;else globalThis.window=savedWindow;}
console.log('PASS_REAL_TSX_ALTERNATE_DECODE_GEOMETRY_READY_FALLBACK_CANCEL_AND_ROUTE_IDENTITY');
console.log('DETAIL_BACKDROP_RECOVERY=PASS');
