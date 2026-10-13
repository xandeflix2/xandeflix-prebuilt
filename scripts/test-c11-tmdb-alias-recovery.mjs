import assert from 'node:assert/strict';
import { TmdbMetadataService, artworkIdentityKey, selectTmdbMatch } from '../src/artwork/tmdb-metadata.service.ts';

const identity = { kind: 'series', title: 'Leadale no Daichi nite', year: 2022 };
const candidate = { id: 119335, name: 'In the Land of Leadale', original_name: 'リアデイルの大地にて', first_air_date: '2022-01-05' };
const details = id => ({ id, poster_path: '/synthetic.jpg', backdrop_path: '/synthetic-backdrop.jpg', first_air_date: '2022-01-05', genres: [{ name: 'Fantasy' }] });
function fixture({ candidates = [candidate], aliases, kind = 'tv', storage, now = () => Date.now(), wait } = {}) {
  const paths = []; let active = 0, peak = 0;
  const service = new TmdbMetadataService({ credential: () => 'synthetic-token', storage, now,
    fetchImpl: async value => {
      const url = new URL(value), path = url.pathname; paths.push(path); peak = Math.max(peak, ++active);
      try {
        if (wait) await wait();
        let result;
        if (path === `/3/search/${kind}`) result = { results: candidates };
        else if (path.endsWith('/alternative_titles')) {
          const id = Number(path.split('/').at(-2));
          result = aliases?.(id) ?? { id, [kind === 'tv' ? 'results' : 'titles']: [{ title: identity.title }] };
        } else result = details(Number(path.split('/').at(-1)));
        return { ok: true, status: 200, json: async () => result };
      } finally { active--; }
    } });
  return { service, paths, peak: () => peak };
}

assert.equal(selectTmdbMatch(identity, [candidate]), null, 'original conservative selector still rejects unrelated displayed names');
const exact = fixture();
const result = await exact.service.resolve(identity);
assert.equal(result.tmdbId, candidate.id);
assert.ok(result.posterUri.endsWith('/synthetic.jpg'));
assert.deepEqual(exact.paths, ['/3/search/tv', '/3/tv/119335/alternative_titles', '/3/tv/119335']);
await exact.service.resolve(identity);
assert.equal(exact.paths.length, 3, 'verified metadata reused');

for (const aliases of [
  id => ({ id, results: [{ title: 'Leadale no Daichi' }] }),
  id => ({ id: id + 1, results: [{ title: identity.title }] }),
  id => ({ id, results: null }),
  id => ({ id, results: Array.from({ length: 129 }, () => ({ title: identity.title })) }),
]) assert.equal(await fixture({ aliases }).service.resolve(identity), null);

const year = fixture();
assert.equal(await year.service.resolve({ ...identity, year: 1999 }), null);
assert.equal(year.paths.length, 1, 'wrong year rejected before extra IO');
const many = fixture({ candidates: [candidate, { ...candidate, id: 2 }, { ...candidate, id: 3 }] });
assert.equal(await many.service.resolve(identity), null);
assert.equal(many.paths.length, 1, 'no broad alias scan');
const duplicate = fixture({ candidates: [candidate, candidate] });
assert.equal((await duplicate.service.resolve(identity)).tmdbId, candidate.id);
assert.equal(duplicate.paths.filter(p => p.endsWith('alternative_titles')).length, 1);
const ambiguous = fixture({ candidates: [candidate, { ...candidate, id: 2 }] });
assert.equal(await ambiguous.service.resolve(identity), null, 'two exact official aliases still ambiguous');
assert.equal(ambiguous.paths.length, 3, 'no details request after ambiguity');
const unique = fixture({ candidates: [candidate, { ...candidate, id: 2 }], aliases: id => ({ id, results: [{ title: id === candidate.id ? identity.title : 'Another name' }] }) });
assert.equal((await unique.service.resolve(identity)).tmdbId, candidate.id);
assert.equal(unique.paths.filter(p => p.endsWith('alternative_titles')).length, 2);
const pathPinned = fixture();
assert.equal(await pathPinned.service.resolve({ ...identity, posterPath: '/other.jpg' }), null);
assert.equal(pathPinned.paths.length, 1, 'alias does not bypass source filename constraint');

const movie = fixture({ kind: 'movie', candidates: [{ id: 42, title: 'Different translated title', release_date: '2022-01-01' }] });
assert.equal((await movie.service.resolve({ ...identity, kind: 'movie' })).kind, 'movie');
assert.deepEqual(movie.paths, ['/3/search/movie', '/3/movie/42/alternative_titles', '/3/movie/42']);
const homonyms = fixture({ kind: 'movie', candidates: [{ id: 1, title: 'Suando Frio', release_date: '2018-01-01' }, { id: 2, title: 'Suando Frio', release_date: '1999-01-01' }] });
assert.equal(await homonyms.service.resolve({ kind: 'movie', title: 'Suando Frio' }), null);
assert.equal(homonyms.paths.length, 1, 'strong homonyms remain rejected without alias requests');
assert.equal(selectTmdbMatch({ kind: 'movie', title: 'Suando Frio', year: 2018 }, [{ id: 1, title: 'Suando Frio', release_date: '2018-01-01' }, { id: 2, title: 'Suando Frio', release_date: '1999-01-01' }]).id, 1);

const now = () => 1_700_000_000_000;
const storageFor = (key, value) => ({ getItem: () => JSON.stringify({ version: 2, entries: [[key, { expires: now() + 60000, value }]] }), setItem() {} });
const oldKey = artworkIdentityKey(identity).replace(':match6', ':match3');
const positive = fixture({ now, storage: storageFor(oldKey, result) });
assert.equal(positive.service.peek(identity).tmdbId, candidate.id);
assert.equal((await positive.service.resolve(identity)).tmdbId, candidate.id);
assert.equal(positive.paths.length, 0, 'old successful mapping remains available offline');
const negative = fixture({ now, storage: storageFor(oldKey, null) });
assert.equal((await negative.service.resolve(identity)).tmdbId, candidate.id, 'old negative mapping does not pin alias failure');
const pinnedIdentity = { ...identity, posterPath: '/synthetic.jpg' };
const pinnedKey = artworkIdentityKey(pinnedIdentity).replace(':match6', ':match3');
const pinnedPositive = fixture({ now, storage: storageFor(pinnedKey, result) });
assert.equal(pinnedPositive.service.peek(pinnedIdentity).tmdbId, candidate.id);
assert.equal((await pinnedPositive.service.resolve(pinnedIdentity)).tmdbId, candidate.id);
assert.equal(pinnedPositive.paths.length, 0);
assert.equal(artworkIdentityKey({ ...identity, tmdbId: candidate.id }), `series:${candidate.id}:2022`, 'explicit ID key unchanged');

const concurrent = fixture({ wait: () => new Promise(resolve => setTimeout(resolve, 3)) });
const jobs = Array.from({ length: 6 }, (_, n) => concurrent.service.resolve({ ...identity, year: n % 2 ? 2021 : 2022 }));
const values = await Promise.all(jobs);
assert.ok(values.every(v => v?.tmdbId === candidate.id));
assert.equal(concurrent.peak(), 2);
assert.equal(concurrent.paths.length, 6, 'six callers share two three-request jobs');
console.log('PASS_EXACT_OFFICIAL_ALIAS_RECOVERY_YEAR_KIND_ID_BOUNDS_AND_UNCHANGED_HOMONYM_REJECTION');
console.log('PASS_MATCH6_OLD_POSITIVE_OFFLINE_REUSE_NEGATIVE_RECOVERY_AND_EXPLICIT_ID_KEY');
console.log('PASS_ALIAS_LOOKUP_SHARED_DEDUP_AND_CONCURRENCY_TWO');
