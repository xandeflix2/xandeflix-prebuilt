import assert from 'node:assert/strict';
import { validateCreditsMarkers } from '../src/playback/credits-marker.ts';

const binding=()=>({seriesId:'series-a',seasonNumber:1,episodeId:'episode-1',episodeNumber:1,
  sourceIdLocal:'source-a',sourceGeneration:'generation-3',catalogSnapshotId:'snapshot-7',mediaEditionId:'edition-a'});
const context=()=>({...binding(),now:'2026-10-29T12:00:00.000Z',
  editionEvidence:{mediaEditionId:'edition-a',verification:'CONTENT_FINGERPRINT',evidenceRef:'verified-fingerprint-a'},
  mediaDuration:{seconds:2400,origin:'PLAYBACK_METADATA'},trustedAuthorities:[
    {provenance:'producer-a',origin:'SOURCE_MARKER',mediaEditionId:'edition-a',semantics:'CREDITS_START',conventionId:'producer-credits-v1'},
    {provenance:'record-a',origin:'EDITION_RECORD',mediaEditionId:'edition-a',semantics:'CREDITS_START',conventionId:'edition-registry-v1'},
  ]});
const marker=()=>({...binding(),creditsStartSeconds:2260,origin:'SOURCE_MARKER',semantics:'CREDITS_START',provenance:'producer-a',
  validatedAt:'2026-10-29T10:00:00.000Z',validUntil:'2026-10-30T12:00:00.000Z'});
const run=(m=marker(),c=context())=>validateCreditsMarkers(c,[m]);
const cases=[];function test(name,fn){fn();cases.push(name);console.log('PASS '+name);}
const savedFetch=globalThis.fetch,savedNow=Date.now;let networkCalls=0,clockReads=0;
globalThis.fetch=()=>{networkCalls++;throw Error('NETWORK_FORBIDDEN')};Date.now=()=>{clockReads++;throw Error('IMPLICIT_CLOCK_FORBIDDEN')};
try {
 test('VALID_SOURCE_MARKER',()=>{const r=run();assert.equal(r.status,'VALID');assert.equal(r.creditsStartSeconds,2260);assert.deepEqual(r.binding,binding());});
 test('VALID_EDITION_RECORD',()=>assert.equal(run({...marker(),origin:'EDITION_RECORD',provenance:'record-a'}).status,'VALID'));
 for(const [field,value]of [['episodeId','wrong-episode'],['seasonNumber',2],['seriesId','other-series'],['sourceIdLocal','other-source'],['sourceGeneration','generation-4'],['catalogSnapshotId','snapshot-8'],['mediaEditionId','edition-b']])
  test('REJECT_'+field,()=>assert.equal(run({...marker(),[field]:value}).status,'INVALID'));
 test('EXPIRED',()=>assert.equal(run({...marker(),validUntil:'2026-10-29T11:00:00.000Z'}).status,'EXPIRED'));
 test('MISSING_PROVENANCE',()=>assert.equal(run({...marker(),provenance:''}).status,'INVALID'));
 for(const [name,time]of [['NEGATIVE',-1],['NAN',NaN],['INFINITE',Infinity],['AFTER_DURATION',2401],['AT_MEDIA_END',2400]])
  test(name,()=>assert.equal(run({...marker(),creditsStartSeconds:time}).status,'INVALID'));
 test('UNKNOWN_DURATION',()=>{const c=context();delete c.mediaDuration;assert.equal(run(marker(),c).status,'INVALID');});
 test('TMDB_DURATION_IS_NOT_REAL',()=>assert.equal(run(marker(),{...context(),mediaDuration:{seconds:2400,origin:'TMDB'}}).status,'INVALID'));
 test('CONFLICTING_MARKERS',()=>assert.equal(validateCreditsMarkers(context(),[marker(),{...marker(),creditsStartSeconds:2250}]).status,'AMBIGUOUS'));
 test('CROSS_ORIGIN_CONFLICT',()=>assert.equal(validateCreditsMarkers(context(),[marker(),{...marker(),origin:'EDITION_RECORD',provenance:'record-a',creditsStartSeconds:2250}]).status,'AMBIGUOUS'));
 test('EQUIVALENT_DUPLICATES',()=>assert.equal(validateCreditsMarkers(context(),[marker(),{...marker()}]).status,'VALID'));
 test('DUPLICATE_EXPIRY_USES_EARLIEST',()=>assert.equal(validateCreditsMarkers(context(),[marker(),{...marker(),validUntil:'2026-10-29T13:00:00.000Z'}]).validUntil,'2026-10-29T13:00:00.000Z'));
 test('MISSING_MARKER',()=>assert.equal(validateCreditsMarkers(context(),[]).status,'MISSING'));
 test('ADVERTISING_IS_NOT_CREDITS',()=>assert.equal(run({...marker(),semantics:'ADVERTISEMENT'}).status,'INVALID'));
 test('GENERIC_ID3_IS_NOT_CREDITS',()=>assert.equal(validateCreditsMarkers(context(),[{type:'ID3',time:2260}]).status,'INVALID'));
 test('GENERIC_DATERANGE_IS_NOT_CREDITS',()=>assert.equal(validateCreditsMarkers(context(),[{tag:'EXT-X-DATERANGE',startSeconds:2260}]).status,'INVALID'));
 test('EDITION_SWITCH_INVALIDATES',()=>{const c=context();c.mediaEditionId='edition-b';c.editionEvidence.mediaEditionId='edition-b';for(const a of c.trustedAuthorities)a.mediaEditionId='edition-b';assert.equal(run(marker(),c).status,'INVALID');});
 test('UNVERIFIED_EDITION',()=>assert.equal(run(marker(),{...context(),editionEvidence:{mediaEditionId:'edition-a',verification:'TITLE_OR_TMDB',evidenceRef:'same-title'}}).status,'INVALID'));
 test('MISSING_EDITION_EVIDENCE',()=>assert.equal(run(marker(),{...context(),editionEvidence:undefined}).status,'INVALID'));
 test('UNTRUSTED_PROVENANCE',()=>assert.equal(run({...marker(),provenance:'unknown-producer'}).status,'INVALID'));
 test('GENERIC_AUTHORITY_NOT_ACCEPTED',()=>{const c=context();c.trustedAuthorities[0].semantics='GENERIC_ID3';assert.equal(run(marker(),c).status,'INVALID');});
 test('FUTURE_VALIDATION_REJECTED',()=>assert.equal(run({...marker(),validatedAt:'2026-10-29T13:00:00.000Z'}).status,'INVALID'));
 test('BROKEN_VALIDITY_INTERVAL',()=>assert.equal(run({...marker(),validUntil:'2026-10-29T09:00:00.000Z'}).status,'INVALID'));
 test('EXPIRY_BOUNDARY',()=>assert.equal(run({...marker(),validUntil:context().now}).status,'EXPIRED'));
 test('INVALID_CALENDAR_DATE',()=>assert.equal(run({...marker(),validatedAt:'2026-02-30T10:00:00.000Z'}).status,'INVALID'));
 test('BINDING_INVALIDATES_WITHOUT_EXPLICIT_EXPIRY',()=>{const m=marker();delete m.validUntil;assert.equal(run(m).status,'VALID');assert.equal(run(m,{...context(),sourceGeneration:'next'}).status,'INVALID');});
 test('MIXED_INVALID_BATCH_FAILS_CLOSED',()=>assert.equal(validateCreditsMarkers(context(),[marker(),{...marker(),provenance:''}]).status,'INVALID'));
 test('MIXED_EXPIRED_BATCH_FAILS_CLOSED',()=>assert.equal(validateCreditsMarkers(context(),[marker(),{...marker(),validUntil:'2026-10-29T11:00:00.000Z'}]).status,'EXPIRED'));
 test('PRIVATE_URL_FIELD_REJECTED',()=>assert.equal(run({...marker(),url:'https://media.example.invalid/video'}).status,'INVALID'));
 test('URL_AS_PROVENANCE_REJECTED',()=>assert.equal(run({...marker(),provenance:'https://media.example.invalid/record'}).status,'INVALID'));
 test('NEGATIVE_EPISODE_NUMBER',()=>assert.equal(run({...marker(),episodeNumber:-1}).status,'INVALID'));
 test('NO_MUTATION',()=>{const c=context(),m=marker();const freeze=v=>{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};const before=JSON.stringify({c,m});freeze(c);freeze(m);freeze([m]);assert.equal(run(m,c).status,'VALID');assert.equal(JSON.stringify({c,m}),before);});
 test('DETERMINISTIC_ORDER',()=>{const a=marker(),b={...marker(),origin:'EDITION_RECORD',provenance:'record-a'};assert.deepEqual(validateCreditsMarkers(context(),[a,b]),validateCreditsMarkers(context(),[b,a]));assert.deepEqual(run(),run());});
 test('NO_EXTERNAL_ACCESS_OR_CLOCK',()=>{assert.equal(networkCalls,0);assert.equal(clockReads,0);});
 console.log(JSON.stringify({result:'PASS',cases:cases.length,networkCalls,implicitClockReads:clockReads}));
} finally {globalThis.fetch=savedFetch;Date.now=savedNow;}
