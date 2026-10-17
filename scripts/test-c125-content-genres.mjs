import {parentalFixtureBindings} from './lib/parental-fixture-bindings.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import ts from 'typescript';
import * as tmdb from '../src/artwork/tmdb-metadata.service.ts';
import {TmdbSimilarService,similarGenreLookup} from '../src/artwork/tmdb-similar.service.ts';
import {meaningfulDetailGenres} from '../src/ui/detail-genres.ts';
import {selectRelatedTitles,loadRelatedTitles} from '../src/catalog/related-titles.service.ts';
import {CatalogReadModel} from '../src/catalog/catalog-read-model.ts';
import * as presentation from '../src/ui/device-presentation.ts';

let tests=0;async function test(name,run){await run();tests++;console.log('PASS '+name)}
const row=(id,title='Title '+id)=>({id,title,year:2026,genreIds:['general'],categoryIds:['releases'],artworkIds:[],streamIds:[]});
const descriptor=(id,genre_ids=[18])=>({id,title:'Title '+id,original_title:'Title '+id,release_date:'2026-01-01',genre_ids,poster_path:'/poster'+id+'.jpg'});
let now=1000,calls=[];
const service=new TmdbSimilarService({credential:()=> 'synthetic-test',now:()=>now,fetchImpl:async(raw,options)=>{
 const url=new URL(raw);calls.push({url,options});
 return new Response(JSON.stringify(url.pathname.includes('/genre/')?{genres:[{id:18,name:'Drama'},{id:28,name:'Ação'}]}:{total_pages:99,results:Array.from({length:30},(_,i)=>descriptor(Number(url.searchParams.get('page'))*100+i))}));
}});
let suggestions;
await test('PUBLIC_SIMILAR_DEDUP_KIND_LIMIT60_THREE_PAGES_ALLOWLIST_NO_SOURCE_TRANSPORT',async()=>{
 const[a,b]=await Promise.all([service.resolve('movie',1),service.resolve('movie',1)]);suggestions=a;
 assert.equal(a,b);assert.equal(a.length,60);assert.equal(calls.length,4);
 assert.ok(a.every(x=>x.genres.join()==='Drama'&&!('genre_ids'in x)));
 for(const {url,options}of calls){assert.equal(url.origin,'https://api.themoviedb.org');assert.equal(url.searchParams.get('language'),'pt-BR');assert.equal(options.body,undefined);assert.equal(options.referrerPolicy,'no-referrer');}
 await service.resolve('movie',1);assert.equal(calls.length,4);await service.resolve('series',1);assert.equal(calls.length,8);assert.ok(calls.some(x=>x.url.pathname==='/3/tv/1/similar'));
});
await test('CACHE_EXPIRES_BUT_GENRE_DICTIONARY_REUSED',async()=>{now+=1800001;const before=calls.length;await service.resolve('movie',1);assert.equal(calls.length-before,3)});
await test('NO_CREDENTIAL_INVALID_ID_OR_FAILED_NETWORK_NEVER_FETCHES_CATALOG',async()=>{
 let count=0;const fetchImpl=async()=>{count++;return new Response('',{status:429})};
 const unavailable=new TmdbSimilarService({credential:()=>'',fetchImpl});assert.deepEqual(await unavailable.resolve('movie',1),[]);assert.equal(count,0);
 const failed=new TmdbSimilarService({credential:()=> 'synthetic',fetchImpl});assert.deepEqual(await failed.resolve('movie',NaN),[]);assert.equal(count,0);
 assert.deepEqual(await failed.resolve('movie',1),[]);assert.deepEqual(await failed.resolve('movie',2),[]);assert.equal(count,1);
});
await test('PUBLIC_ADULT_INVALID_AND_UNKNOWN_GENRES_FILTERED',async()=>{
 const s=new TmdbSimilarService({credential:()=> 'synthetic',fetchImpl:async raw=>new Response(JSON.stringify(String(raw).includes('/genre/')?{genres:[{id:18,name:'Drama'}]}:{results:[{...descriptor(1),adult:true},descriptor(2,[999]),{id:'wrong'},descriptor(3)]}))});
 const values=await s.resolve('movie',10);assert.deepEqual(values.map(x=>x.id),[2,3]);assert.deepEqual(values[0].genres,[]);
});
await test('SIMILAR_QUEUE_ONE_ACTIVE_EIGHT_PENDING_AND_RAM_CACHE64',async()=>{
 let release,active=0,max=0,total=0;const gate=new Promise(r=>release=r);
 const s=new TmdbSimilarService({credential:()=> 'synthetic',fetchImpl:async raw=>{active++;max=Math.max(max,active);total++;await gate;active--;return new Response(JSON.stringify(String(raw).includes('/genre/')?{genres:[{id:18,name:'Drama'}]}:{results:[descriptor(500)]}));}});
 const queued=Array.from({length:8},(_,i)=>s.resolve('movie',i+1));assert.deepEqual(await s.resolve('movie',9),[]);
 release();await Promise.all(queued);assert.equal(max,1);assert.equal(total,9);
 for(let id=9;id<=65;id++)await s.resolve('movie',id);const before=total;await s.resolve('movie',65);assert.equal(total,before);
 await s.resolve('movie',1);assert.equal(total,before+1,'oldest entry evicted after 64');
});
await test('STRONG_LOCAL_IDENTITY_MATCH_NO_SUBSTRING_YEAR_OR_DECLARED_ID_FALLBACK',()=>{
 const lookup=similarGenreLookup(suggestions);assert.deepEqual(lookup({kind:'movie',title:'Anything',tmdbId:100}),['Drama']);
 assert.deepEqual(lookup({kind:'movie',title:'Title 100',year:2026}),['Drama']);
 assert.deepEqual(lookup({kind:'movie',title:'Title 100',year:2000}),[]);
 assert.deepEqual(lookup({kind:'movie',title:'Title 100 extra',year:2026}),[]);
 assert.deepEqual(lookup({kind:'movie',title:'Title 100',year:2026,tmdbId:99999}),[]);
 assert.deepEqual(lookup({kind:'movie',title:'Title 100',year:2026,posterPath:'/different.jpg'}),[]);
});
const reference=row('ref'),labels=new Map([['ref',['Geral','Drama']],['same',['Drama']],['best',['Drama','Ação']],['wrong',['Terror']],['generic',['Geral']]]);
const context={referenceGenres:['Drama','Ação'],genresFor:r=>labels.get(r.id)||[]};
await test('RELATED_GENERIC_CATEGORY_NEVER_COUNTS_REAL_GENRES_RANK_DEDUP_LIMIT',()=>{
 const candidates=['generic','wrong','same','best','same','ref'].map(id=>row(id));
 assert.deepEqual(selectRelatedTitles(reference,candidates,context).map(x=>x.id),['best','same']);
 assert.deepEqual(selectRelatedTitles(reference,candidates,{...context,referenceGenres:['Geral']}),[]);
 const many=Array.from({length:100},(_,i)=>row(String(i)));assert.equal(selectRelatedTitles(reference,many,{referenceGenres:['Drama'],genresFor:()=>['Drama']}).length,20);
 assert.deepEqual(reference.genreIds,['general']);
});
const catalog={metadata:{snapshotId:'fixture',schemaVersion:1,counts:{}},movies:[reference,row('generic')],series:[],genres:[{id:'general',name:'Geral'}],categories:[{id:'releases',name:'Lançamentos'}],artworks:[],streams:[],episodes:[],seasons:[]};
await test('GENRE_MATCH_FROM_LOCAL_SEGMENTS_ONLY_NO_MODEL_MUTATION_SNAPSHOT_ABORT',async()=>{
 const model=new CatalogReadModel(catalog);let snapshot='fixture',reads=[];
 const storage={readActiveManifest:async()=>({snapshotId:snapshot,segments:[{kind:'series',fileName:'series_1.json'},{kind:'movies',fileName:'movies_1.json'}]}),readActiveSegment:async file=>{reads.push(file);return JSON.stringify([row('wrong'),row('best'),row('same')])},readActivePointer:async()=>({snapshotId:snapshot})};
 const result=await loadRelatedTitles(model,'movie',reference,storage,new AbortController().signal,context);
 assert.deepEqual(result.map(x=>x.id),['best','same']);assert.equal(reads.length,1);assert.equal(model.moviesById.has('best'),false);
 snapshot='new';await assert.rejects(loadRelatedTitles(model,'movie',reference,storage,new AbortController().signal,context),/SNAPSHOT/);
 const abort=new AbortController();abort.abort();await assert.rejects(loadRelatedTitles(model,'movie',reference,storage,abort.signal,context),/CANCELLED/);
});
await test('ALL_EIGHT_HERO_PROFILES_BOTH_KINDS_USE_SAME_REAL_GENRE_FALLBACK',()=>{
 let choice,metadata,enabled;const hooks={...React,useState:v=>[typeof v==='function'?v():v,()=>{}],useRef:v=>({current:v}),useEffect:()=>{}};
 const ports={'react':{default:hooks,...hooks},'../detail-genres.ts':{meaningfulDetailGenres},'../device-presentation.ts':presentation,
 '../hooks/useDevicePresentation.ts':{useDevicePresentation:()=>choice},'../hooks/useArtworkMetadata.ts':{useArtworkMetadata:(_i,e)=>{enabled=e;return metadata}},
 '../hooks/useCachedArtwork.ts':{useCachedArtwork:src=>({src})},'../hooks/useImmersiveArtwork.ts':{useImmersiveArtwork:()=>null},
 '../../artwork/tmdb-metadata.service.ts':tmdb,'./NewContentProvider.tsx':{useContentBadge:()=>null},'./PlatformCategoryBadge.tsx':{PlatformCategoryLogo:()=>null},'./Artwork.tsx':{Artwork:()=>null}};
 const module={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync('src/ui/components/Hero.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText)((name => parentalFixtureBindings(name) ?? (n=>{assert.ok(ports[n],n);return ports[n]})(name)),module,module.exports);
 const find=tree=>{if(!React.isValidElement(tree))return; if(tree.props.className==='hero-genres')return tree.props.children;for(const child of React.Children.toArray(tree.props.children)){const v=find(child);if(v!==undefined)return v;}};
 for(const model of Object.keys(presentation.devicePresentationModels))for(const kind of['movie','series']){
  choice=presentation.devicePresentationModels[model].type;const item={...row('fixture'),kind,genreLabels:['Geral'],categoryLabels:[],overviewSnippet:'Overview',yearFormatted:'2026',durationFormatted:'1h'};
  metadata={genres:['Drama','Geral','Ação']};assert.equal(find(module.exports.Hero({item,onSelect(){},mobilePoster:model==='PHONE'})),'Drama • Ação');assert.equal(enabled,true);
  assert.equal(find(module.exports.Hero({item:{...item,genreLabels:['Comédia']},onSelect(){}})),'Comédia');metadata=null;assert.equal(find(module.exports.Hero({item,onSelect(){}})),undefined);assert.deepEqual(item.genreLabels,['Geral']);
 }
});
console.log(JSON.stringify({result:'PASS',tests,physicalDevices:false,realApiCalls:0}));
