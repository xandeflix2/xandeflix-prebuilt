import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const code = ts.transpileModule(fs.readFileSync(new URL('../src/playback/hero-playback.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;
const calls = [], records = [];
const launch = { success: true, state: 'NATIVE_PLAYER_OPENED' };
const player = { playMovie: async (...args) => { calls.push(['movie', ...args]); return launch; },
  playEpisode: async (...args) => { calls.push(['episode', ...args]); return launch; } };
const mod = { exports: {} };
new Function('require','module','exports',code)(name => name.endsWith('playback.service.ts') ? { defaultPlaybackService: player }
  : { watchFingerprint: () => 'current-fingerprint', watchHistory: { list: () => records, syncNativeProgress: async () => {} } }, mod, mod.exports);
const play = mod.exports.playHeroItem;
const first = { id: 'ep-1', seriesId:'s', seasonId:'season-1', episodeNumber:1, streamIds:['stream-1'] };
const later = { ...first, id:'ep-2', seasonId:'season-2', streamIds:['stream-2'] };
const model = { resolveMovieById: async id => ({ id }), resolveSeriesById: async id => ({ id }),
  loadEpisodesForSeries: async () => [later, { ...first, id:'missing', streamIds:[] }, first],
  seasonsById: new Map([['season-1',{seasonNumber:1}],['season-2',{seasonNumber:2}]]) };
assert.equal(await play({kind:'movie',id:'segmented-movie'}, model, () => true), launch);
assert.deepEqual(calls.pop(), ['movie','segmented-movie',model]);
await play({kind:'series',id:'s'}, model, () => true);
assert.deepEqual(calls.pop(), ['episode','s','ep-1',model]);
const saved = {kind:'series',itemId:'s',episodeId:'ep-2',fingerprint:'current-fingerprint',positionMs:120000,completed:false};
records.push(saved);await play({kind:'series',id:'s'},model,()=>true);assert.equal(calls.pop()[2],'ep-2');
for (const invalid of [{fingerprint:'old-source'},{completed:true},{episodeId:'deleted'},{positionMs:0},{itemId:'other'}]) {
  records[0] = {...saved,...invalid};await play({kind:'series',id:'s'},model,()=>true);assert.equal(calls.pop()[2],'ep-1');
}
await assert.rejects(play({kind:'movie',id:'missing'},{...model,resolveMovieById:async()=>undefined},()=>true), /HERO_TITLE_UNAVAILABLE/);
await assert.rejects(play({kind:'series',id:'s'},{...model,loadEpisodesForSeries:async()=>[{...first,seriesId:'other'}]},()=>true), /HERO_EPISODE_UNAVAILABLE/);
await assert.rejects(play({kind:'movie',id:'m'},{...model,resolveMovieById:async()=>{throw Error('I/O unavailable')}},()=>true), /I\/O unavailable/);
let active = true;
assert.equal(await play({kind:'movie',id:'m'},{...model,resolveMovieById:async()=>{active=false;return{id:'m'}}},()=>active), undefined);
assert.equal(await play({kind:'series',id:'s'},model,()=>false),undefined);
assert.equal(calls.length,0);
player.playMovie=async()=>({success:false,state:'NATIVE_PLAYER_ERROR',errorMessage:'Limite de sessões atingido.'});
assert.equal((await play({kind:'movie',id:'m'},model,()=>true)).success,false);
console.log('C94_DIRECT_PLAYBACK=PASS segmented movie, sorted first episode, valid resume, stale/deleted/completed history, unavailable, I/O, cancellation and refused launch');
