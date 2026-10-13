import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SeriesPresentationService, parseMoviePresentation } from '../src/artwork/series-presentation.service.ts';
import { seriesSharePayload } from '../src/ui/share-series.ts';
import { SeriesPersonalStore } from '../src/ui/series-personal.store.ts';
import { watchFingerprint } from '../src/playback/watch-history.ts';
import { isPhoneHeroProfile } from '../src/catalog/home-hero.service.ts';

const raw = { id: 603, runtime: 136, release_dates: { results: [
  { iso_3166_1: 'US', release_dates: [{ certification: 'R' }] },
  { iso_3166_1: 'BR', release_dates: [{ certification: '' }, { certification: '14' }] },
] }, videos: { results: [{ site: 'YouTube', type: 'Trailer', key: 'abc_DEF-123', iso_639_1: 'pt', official: true }] }, sourceURL: 'must-not-survive' };
const parsed = parseMoviePresentation(raw, 603);
assert.equal(parsed.runtimeMinutes, 136); assert.equal(parsed.ageRating, '14'); assert.equal(parsed.trailer.key, 'abc_DEF-123');
assert.ok(!JSON.stringify(parsed).includes('must-not-survive'));
assert.equal(parseMoviePresentation(raw, 604), null);
assert.deepEqual(parseMoviePresentation({ id: 603, runtime: -1, content_ratings: { results: [{ iso_3166_1: 'BR', rating: '18' }] } }, 603), { tmdbId: 603, runtimeMinutes: undefined, ageRating: undefined, trailer: undefined });
assert.equal(parseMoviePresentation({ id: 603, release_dates: { results: [{ iso_3166_1: 'BR', release_dates: [{ certification: 'Livre' }] }] } }, 603).ageRating, 'L');
let calls = 0, now = 1000;
const service = new SeriesPresentationService({ kind: 'movie', credential: () => 'synthetic-only', now: () => now, fetchImpl: async url => {
  calls++; const request = new URL(url); assert.equal(request.pathname, '/3/movie/603');
  assert.equal(request.searchParams.get('append_to_response'), 'videos,release_dates');
  assert.equal(request.searchParams.get('language'), 'pt-BR');
  return new Response(JSON.stringify(raw));
} });
const one = service.resolve(603); assert.equal(one, service.resolve(603)); await one;
await service.resolve(603); assert.equal(calls, 1); now += 7 * 60 * 60 * 1000; await service.resolve(603); assert.equal(calls, 2);
let attempts = 0;
const throttled = new SeriesPresentationService({ kind: 'movie', credential: () => 'synthetic-only', now: () => now, fetchImpl: async () => { attempts++; return new Response('', { status: 429 }); } });
assert.equal(await throttled.resolve(603), null); assert.equal(await throttled.resolve(604), null); assert.equal(attempts, 1);
now += 30001; await throttled.resolve(603); assert.equal(attempts, 2);
assert.equal(await new SeriesPresentationService({ kind: 'movie', credential: () => '', fetchImpl: () => { throw Error('No credential must not fetch'); } }).resolve(603), null);
assert.equal(await new SeriesPresentationService({ kind: 'movie', credential: () => 'synthetic-only', fetchImpl: async () => { throw Error('offline'); } }).resolve(603), null);
assert.equal(await new SeriesPresentationService({ kind: 'movie', credential: () => 'synthetic-only', timeoutMs: 10, fetchImpl: () => new Promise(() => {}) }).resolve(603), null);
console.log('PASS_MOVIE_BR_CERTIFICATION_TOTAL_RUNTIME_TRAILER_TYPE_ID_DEDUP_TTL_THROTTLE_OFFLINE_TIMEOUT');

const share = seriesSharePayload('Matrix https://source.invalid/private?token=secret', 603, 'movie');
assert.equal(share.url, 'https://www.themoviedb.org/movie/603'); assert.equal(share.dialogTitle, 'Compartilhar filme'); assert.ok(!JSON.stringify(share).includes('secret'));
assert.equal(seriesSharePayload('Series', 603).url, 'https://www.themoviedb.org/tv/603');
assert.equal(seriesSharePayload('Movie', NaN, 'movie').url, undefined);
let stored;
const port = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
const store = new SeriesPersonalStore(port), identity = { title: 'Same public title', year: 2026 };
const movieKey = watchFingerprint('movie', identity), seriesKey = watchFingerprint('series', identity);
assert.notEqual(movieKey, seriesKey); store.set(movieKey, { favorite: true, rating: 'love' });
assert.deepEqual(new SeriesPersonalStore(port).get(movieKey), { favorite: true, rating: 'love' });
assert.deepEqual(new SeriesPersonalStore(port).get(seriesKey), { favorite: false });
for (const [ua, mobile, width, expected] of [['Android Mobile', true, 390, true], ['Android Mobile', true, 844, true], ['Android SM-X610', false, 500, false], ['AFTSSS', false, 960, false], ['iPad', false, 390, false]]) assert.equal(isPhoneHeroProfile(ua, mobile, width), expected);
console.log('PASS_MOVIE_PUBLIC_SHARE_PERSONAL_KIND_ISOLATION_PERSISTENCE_PHONE_ONLY');

// Execute the real component while controlling optional enrichment and cleanup.
let cleanup, fulfill, updates = 0, extra = parsed;
const react = { ...React, useState: () => [{ key: 'identity', data: extra }, () => updates++], useEffect: effect => { cleanup = effect(); } };
const stub = tag => props => React.createElement(tag, { 'data-kind': props.kind, 'data-layout': props.layout });
const require = name => name === 'react' ? { default: react, ...react }
  : name.includes('tmdb-metadata') ? { artworkIdentityKey: () => 'identity' }
  : name.includes('series-presentation') ? { resolveMoviePresentation: () => new Promise(resolve => { fulfill = resolve; }) }
  : name.includes('watch-history') ? { watchFingerprint }
  : name.includes('SeriesTrailer') ? { SeriesTrailer: stub('trailer') }
  : name.includes('SeriesPersonalActions') ? { SeriesPersonalActions: stub('personal') }
  : name.includes('CastButton') ? { CastButton: stub('cast') }
  : { RelatedTitles: stub('related') };
const module = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(new URL('../src/ui/components/PhoneMovieDetail.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText)(require, module, module.exports);
let played = 0, backed = 0;
const props = { detail: { id: 'movie-one', title: 'Public Movie', yearFormatted: '2026', overview: 'Movie synopsis', genreLabels: [], categoryLabels: ['Ação'] }, identity: { kind: 'movie', title: 'Public Movie' }, readModel: { moviesById: new Map([['movie-one', identity]]) }, resolving: false, statusMessage: null, statusKind: null, onPlay: () => played++, onBack: () => backed++, onSelectItem: () => {} };
const tree = module.exports.PhoneMovieDetail(props), html = renderToStaticMarkup(tree);
for (const [before, after] of [['<trailer', '<h1'], ['<h1', 'Informações do filme'], ['Informações do filme', 'Movie synopsis'], ['Movie synopsis', 'movie-phone-watch'], ['movie-phone-watch', '<personal'], ['<personal', '<related']]) assert.ok(html.indexOf(before) < html.indexOf(after));
assert.match(html, /14\+/); assert.match(html, /136min/); assert.match(html, /Ação/); assert.match(html, /data-kind="movie" data-layout="grid"/); assert.ok(!html.includes('episódios'));
const elements = [];
function walk(node) { if (!React.isValidElement(node)) return; elements.push(node); React.Children.forEach(node.props.children, walk); }
walk(tree); elements.find(node => node.props.className?.includes('movie-phone-watch')).props.onClick(); elements.find(node => node.type === 'button' && node.props.children === '← Voltar').props.onClick(); assert.equal(played, 1); assert.equal(backed, 1);
cleanup(); fulfill(parsed); await new Promise(resolve => setTimeout(resolve, 0)); assert.equal(updates, 0);
extra = null;
const fallback = renderToStaticMarkup(module.exports.PhoneMovieDetail({ ...props, detail: { ...props.detail, overview: undefined }, resolving: true, statusMessage: 'Falha ao iniciar', statusKind: 'error' }));
assert.match(fallback, /Sinopse indisponível para este filme/); assert.match(fallback, /movie-phone-watch" disabled/); assert.match(fallback, /role="status"/); assert.ok(!fallback.includes('14+') && !fallback.includes('136min'));
cleanup(); fulfill(null);
console.log('PASS_REAL_PHONE_MOVIE_ORDER_ACTIONS_GRID_OPTIONAL_FAILURE_RESOLVING_NO_STALE_UPDATE');
