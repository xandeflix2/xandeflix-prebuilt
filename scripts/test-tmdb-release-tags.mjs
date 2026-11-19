import assert from 'node:assert/strict';
import { TmdbMetadataService, normalizeArtworkIdentity, artworkIdentityKey, selectTmdbMatch } from '../src/artwork/tmdb-metadata.service.ts';

const movie = title => ({ kind: 'movie', title });
const cases = [
 ['Mayday 4K [DV][HDR]', 'Mayday'],
 ['Mayday [HDR10+][Dolby Vision] UHD', 'Mayday'],
 ['4K | Mayday [DV] [HDR]', 'Mayday'],
 ['Mayday (2026) 2160p [DV][HDR]', 'Mayday', 2026],
 ['Mayday [2026] [UHD HEVC HDR10+ DUAL AUDIO]', 'Mayday', 2026],
 ['Mayday - 4K [H.265][10bit][Dolby Atmos]', 'Mayday'],
 ['Mayday (HDR) {DV} WEB-DL', 'Mayday'],
 ['Mayday ４Ｋ ［ＤＶ］［ＨＤＲ］', 'Mayday'],
 ['Mayday\u00a04K\u200b [DV][HDR]', 'Mayday'],
 ['4x4 (2019) 4K [HDR]', '4x4', 2019],
 ['10x10 - O Cativeiro (2018) [4K HDR]', '10x10 - O Cativeiro', 2018],
 ['Blade Runner 2049 4K [HDR]', 'Blade Runner 2049'],
 ['2001: Uma Odisseia no Espaço (1968) UHD', '2001: Uma Odisseia no Espaço', 1968],
 ['Synthetic Fixture [L] 2020', 'Synthetic Fixture', 2020],
 ['Synthetic Fixture (L) (2020)', 'Synthetic Fixture', 2020],
 ['F1: O Filme (2025) HDR10+', 'F1: O Filme', 2025],
 ['[REC] 4: Apocalipse 4K [DV]', '[REC] 4: Apocalipse'],
 ["D'Artagnan & Os Três Mosqueteiros [4K]", "D'Artagnan & Os Três Mosqueteiros"],
];
for (const [title, expected, year] of cases) {
 const input = Object.freeze(movie(title)), normalized = normalizeArtworkIdentity(input);
 assert.equal(normalized.title, expected, title); assert.equal(normalized.year, year, title); assert.equal(input.title, title);
}
for (const title of ['1917','1984','4x4','10x10','Se7en','F1','HD','HDR','DV','4K','L','The L Word','Synthetic [L] Extended','Synthetic (L) Extended','[REC]','[REC] 2','A Vida de Hdrick','Adventureland','WALL·E','9-1-1']) assert.equal(normalizeArtworkIdentity(movie(title)).title,title,title);
assert.equal(normalizeArtworkIdentity({...movie('Synthetic Film 2020 4K [HDR]'),year:2020}).title,'Synthetic Film');
assert.equal(normalizeArtworkIdentity(movie('Blade Runner 2049')).year,undefined);
assert.equal(normalizeArtworkIdentity(movie('Mayday ' + 'x'.repeat(1000))).title.length,200);
console.log('PASS_RELEASE_TAGS_UNICODE_DELIMITED_YEAR_SUBTITLE_AND_SEMANTIC_TITLE_PRESERVATION');

const details = { id:101, title:'Operação de Teste',original_title:'Mayday',release_date:'2026-09-03',poster_path:'/official101.jpg',backdrop_path:'/backdrop101.jpg',overview:'Synthetic public synopsis',runtime:123,genres:[{name:'Ação'}],ignored_secret:'synthetic-must-not-persist' };
const candidate = {...details};
function fixture({candidates=[candidate],storage,now=()=>1700000000000,fetchImpl}={}) {
 const calls=[];
 const service=new TmdbMetadataService({credential:()=> 'synthetic-public-fixture',now,storage,fetchImpl:fetchImpl|| (async value=>{
  const u=new URL(value);assert.equal(u.origin,'https://api.themoviedb.org');assert.ok(!u.href.includes('private-source'));calls.push({path:u.pathname,query:u.searchParams.get('query'),year:u.searchParams.get('primary_release_year')});
  return {ok:true,status:200,json:async()=>u.pathname.startsWith('/3/search/')?{results:candidates}:{...details,id:Number(u.pathname.split('/').at(-1))}};
 })});return{service,calls};
}
const identity=Object.freeze({...movie('Mayday (2026) 4K [DV][HDR]'),posterPath:'/official101.jpg'});
let f=fixture();const meta=await f.service.resolve(identity,'high');
assert.equal(meta.tmdbId,101);assert.equal(meta.title,'Operação de Teste');assert.equal(meta.originalTitle,'Mayday');assert.equal(meta.durationFormatted,'2h 3min');assert.deepEqual(meta.genres,['Ação']);assert.equal(f.calls[0].query,'Mayday');assert.equal(f.calls[0].year,'2026');assert.equal(f.calls.length,2);assert.equal(identity.title,'Mayday (2026) 4K [DV][HDR]');
assert.equal((await f.service.resolve(identity)).tmdbId,101);assert.equal(f.calls.length,2);
assert.equal(selectTmdbMatch(movie('Mayday 4K [DV][HDR]'),[candidate,{...candidate,id:102}]),null);
assert.equal(selectTmdbMatch({...identity,year:1999},[candidate]),null);
assert.equal(selectTmdbMatch({...identity,posterPath:'/wrong.jpg'},[candidate]),null);
assert.equal(selectTmdbMatch({kind:'series',title:'Mayday [4K HDR]'},[candidate]),null);
f=fixture({candidates:Array.from({length:10},(_,n)=>({...candidate,id:100+n,poster_path:n===1?'/official101.jpg':'/other'+n+'.jpg'}))});assert.equal((await f.service.resolve(identity))?.tmdbId,101);assert.equal(f.calls.length,2,'public exact poster retains bounded homonym selection');
f=fixture({candidates:Array.from({length:10},(_,n)=>({...candidate,id:100+n,poster_path:'/other'+n+'.jpg'}))});assert.equal(await f.service.resolve(identity),null);assert.equal(f.calls.length,1,'ambiguous alternate-poster fallback remains bounded');
console.log('PASS_PUBLIC_QUERY_DETAILS_LOCALIZED_TITLE_KIND_YEAR_POSTER_AMBIGUITY_AND_DEDUP');

const now=()=>1700000000000,oldKey='movie:mayday dv hdr::match7:poster=/official101.jpg',repaired={...movie('Mayday 4K [DV][HDR]'),posterPath:'/official101.jpg'};
let raw=JSON.stringify({version:2,entries:[[oldKey,{value:null,expires:now()+60000}]]});
const storage={getItem:()=>raw,setItem:(_k,value)=>{raw=value}};
assert.notEqual(artworkIdentityKey(repaired),oldKey);f=fixture({now,storage});assert.equal((await f.service.resolve(repaired)).tmdbId,101);
await new Promise(r=>setTimeout(r,300));assert.ok(raw.includes('Operação de Teste'));assert.ok(!raw.includes('synthetic-must-not-persist'));
const saved=JSON.parse(raw),entry=saved.entries.find(([k])=>k===artworkIdentityKey(repaired));entry[1].value.privateUrl='https://private-source.invalid/credentials';entry[1].value.title='Operação de Teste';raw=JSON.stringify(saved);
const warm=fixture({now,storage});assert.equal(warm.service.peek(repaired).title,'Operação de Teste');assert.equal(Object.hasOwn(warm.service.peek(repaired),'privateUrl'),false);assert.equal((await warm.service.resolve(repaired)).title,'Operação de Teste');assert.equal(warm.calls.length,0);
delete entry[1].value.title;raw=JSON.stringify(saved);assert.equal(fixture({now,storage}).service.peek(repaired).tmdbId,101,'old positive metadata remains compatible without new title field');
console.log('PASS_OLD_DIRTY_MISS_ESCAPE_WARM_PUBLIC_TITLE_ALLOWLIST_AND_LEGACY_POSITIVE_COMPATIBILITY');

for(const title of ['https://private-source.invalid/user/password','ｈｔｔｐｓ://private-source.invalid/secret','tvg-lo\u200bgo="private-source"','movie\nprivate-source']) {
 const guarded=fixture();assert.equal(await guarded.service.resolve({...movie(title),tmdbId:101}),null);assert.equal(guarded.calls.length,0,'raw/normalized private-looking input never reaches TMDB');
}
let clock=1700000000000,count=0;const transient=new TmdbMetadataService({credential:()=> 'synthetic-public-fixture',now:()=>clock,fetchImpl:async()=>{count++;throw Error('synthetic transient')}});
assert.equal(await transient.resolve(repaired),null);clock+=6000;assert.equal(await transient.resolve(repaired),null);assert.equal(count,2,'transient failure not retained as a 24h miss');
console.log('PASS_RAW_NORMALIZED_PRIVATE_BOUNDARY_AND_TRANSIENT_FAILURE_NOT_NEGATIVE_CACHED');
console.log('TMDB_RELEASE_TAGS=PASS');
