import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {meaningfulDetailGenres} from '../src/ui/detail-genres.ts';
import {devicePresentationModels} from '../src/ui/device-presentation.ts';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const nodes=tree=>{const values=[];function walk(node){if(!React.isValidElement(node))return;values.push(node);React.Children.forEach(node.props.children,walk)}walk(tree);return values};
const stub=tag=>()=>React.createElement(tag);
const savedNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
const agents={PHONE:'Android Mobile SM-S926B',FOLDABLE:'Android Mobile SM-FOLD',TABLET:'Android SM-X610',FIRE_TV:'Android AFTSSS',ANDROID_TV:'Android TV GoogleTV',ANDROID_BOX:'Android TV Box',TIZEN:'SMART-TV Tizen',WEBOS:'SmartTV webOS'};
let tests=0;function test(name,run){run();tests++;console.log('PASS '+name)}
function page(kind,model,source,metadata){
 let enabled;const phone=devicePresentationModels[model].type==='PHONE';
 const hooks={...React,useState:initial=>[typeof initial==='function'?initial():initial,()=>{}],useEffect:()=>{},useCallback:callback=>callback};
 const Phone=stub('phone-detail'),sourceRecord={id:source.id,title:source.title};
 const ports={
  react:{default:hooks,...hooks},
  '../../catalog/catalog-selectors.ts':{getMovieDetail:()=>source,getSeriesDetail:()=>source},
  '../hooks/usePhoneLayout.ts':{usePhoneLayout:()=>phone},
  '../hooks/useImmersiveArtwork.ts':{useImmersiveArtwork:()=>({current:null})},
  '../hooks/useDetailInitialFocus.ts':{useDetailInitialFocus:()=>{}},
  '../hooks/useArtworkMetadata.ts':{useArtworkMetadata:(_identity,on)=>{enabled=on;return metadata}},
  '../../artwork/tmdb-metadata.service.ts':{tmdbPosterPath:()=>undefined},
  '../detail-genres.ts':{meaningfulDetailGenres},
  '../components/Artwork.tsx':{Artwork:stub('artwork')},
  '../components/DetailTrailer.tsx':{DetailTrailer:stub('trailer')},
  '../components/RelatedTitles.tsx':{RelatedTitles:stub('related')},
  '../components/WatchProviders.tsx':{WatchProviders:stub('providers')},
  '../components/SeriesPersonalActions.tsx':{SeriesPersonalActions:stub('personal')},
  '../components/SeriesDetailSections.tsx':{SeriesDetailSections:stub('sections')},
  '../components/PhoneMovieDetail.tsx':{PhoneMovieDetail:Phone},
  '../components/PhoneSeriesDetail.tsx':{PhoneSeriesDetail:Phone},
  '../../playback/playback.service.ts':{defaultPlaybackService:{}},
  '../../playback/watch-history.ts':{watchFingerprint:()=> 'fixture-fingerprint',watchHistory:{list:()=>[]}},
 };
 const module={exports:{}};const file='src/ui/pages/'+(kind==='movie'?'Movie':'Series')+'DetailPage.tsx';
 new Function('require','module','exports',ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText)(name=>{assert.ok(ports[name],'UNBOUND_PORT '+name);return ports[name]},module,module.exports);
 const modelValue={moviesById:new Map([[source.id,sourceRecord]]),seriesById:new Map([[source.id,sourceRecord]])};
 const props={movieId:source.id,seriesId:source.id,readModel:modelValue,onBack:()=>{}};
 const Component=module.exports[kind==='movie'?'MovieDetailPage':'SeriesDetailPage'],tree=Component(props);
 const genres=phone?nodes(tree).find(node=>node.type===Phone).props.detail.genreLabels:nodes(tree).filter(node=>node.props.className==='genre-pill').map(node=>node.props.children);
 return{enabled,genres,html:renderToStaticMarkup(tree)};
}

test('DISPLAY_FILTER_TRIMS_REMOVES_GENERAL_AND_DEDUPES_WITHOUT_MUTATING_INPUT',()=>{
 const input=Object.freeze([' Geral ','','  ','Drama',' drama ','Ação','AÇÃO']);assert.deepEqual(meaningfulDetailGenres(input),['Drama','Ação']);assert.equal(input[0],' Geral ');
});
try{
 for(const model of Object.keys(devicePresentationModels))test(model+'_MOVIE_AND_SERIES_GENERAL_ENRICHMENT_REAL_GENRE_PRIORITY_AND_ABSENCE',()=>{
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:agents[model]}});
  for(const kind of['movie','series']){
   const source=Object.freeze({id:'fixture-'+kind,title:'Título público',originalTitle:'Public title',overview:'Sinopse completa',yearFormatted:'2026',durationFormatted:'1h 49min',genreLabels:Object.freeze([' Geral ']),categoryLabels:Object.freeze(['Filmes | Lançamentos','Netflix']),seasons:[],externalIds:{tmdbId:123}});
   const initial=page(kind,model,source,null);assert.equal(initial.enabled,true,'GENERAL_MUST_TRIGGER_ENRICHMENT');assert.deepEqual(initial.genres,[]);
   const enriched=page(kind,model,source,{genres:['Geral',' Ação ','Drama','DRAMA']});assert.equal(enriched.enabled,true);assert.deepEqual(enriched.genres,['Ação','Drama']);
   const genuine=page(kind,model,{...source,genreLabels:['Comédia','Geral']},{genres:['Terror']});assert.equal(genuine.enabled,false,'REAL_LOCAL_GENRE_IS_COMPLETE');assert.deepEqual(genuine.genres,['Comédia']);
   assert.deepEqual(page(kind,model,{...source,genreLabels:[]},null).genres,[]);assert.deepEqual(source.genreLabels,[' Geral ']);
  }
 });
}finally{if(savedNavigator)Object.defineProperty(globalThis,'navigator',savedNavigator);else delete globalThis.navigator}
console.log(JSON.stringify({result:'PASS',tests,models:Object.keys(devicePresentationModels),physicalDevices:false,networkRequests:0}));
