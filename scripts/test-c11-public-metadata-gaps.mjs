import assert from 'node:assert/strict';
import { TmdbMetadataService, artworkIdentityKey, normalizeArtworkIdentity, selectTmdbMatch, tmdbPosterPath } from '../src/artwork/tmdb-metadata.service.ts';
import { samePoster, identityPosterPaths } from '../src/artwork/poster-identity.ts';

const combined = { kind: 'movie', title: 'Círculo de Fogo - Pacific Rim' };
const pacific = { id: 68726, title: 'Círculo de Fogo', original_title: 'Pacific Rim', release_date: '2013-07-11' };
const enemy = { id: 853, title: 'Círculo de Fogo', original_title: 'Enemy at the Gates', release_date: '2001-02-28' };
const subtitled = { kind: 'movie', title: 'Para Sempre Cinderela [L]' };
assert.equal(normalizeArtworkIdentity(subtitled).title, 'Para Sempre Cinderela');
assert.equal(normalizeArtworkIdentity({ ...subtitled, title: 'Para Sempre Cinderela [L] (1998)' }).year, 1998);
assert.equal(normalizeArtworkIdentity({ ...subtitled, title: 'Para Sempre Cinderela [l] 1998' }).title, 'Para Sempre Cinderela');
assert.equal(normalizeArtworkIdentity({ ...subtitled, title: 'L' }).title, 'L');
assert.equal(normalizeArtworkIdentity({ ...subtitled, title: '[L]' }).title, 'L');
assert.equal(normalizeArtworkIdentity({ ...subtitled, title: 'Death Note: L' }).title, 'Death Note: L');
assert.equal(normalizeArtworkIdentity({ ...subtitled, title: 'Filme [L] Parte Dois' }).title, 'Filme L Parte Dois');
assert.equal(normalizeArtworkIdentity({ ...subtitled, title: '[REC]' }).title, 'REC');
const cinderella = { id: 9454, title: 'Para Sempre Cinderela', original_title: 'EverAfter', release_date: '1998-07-31' };
assert.equal(selectTmdbMatch(subtitled, [cinderella])?.id, 9454);
assert.equal(selectTmdbMatch({ ...subtitled, year: 2007 }, [cinderella]), null);
assert.equal(selectTmdbMatch(subtitled, [cinderella, { ...cinderella, id: 2 }]), null);
assert.notEqual(artworkIdentityKey(subtitled), artworkIdentityKey({ ...subtitled, title: 'Para Sempre Cinderela L' }));
assert.equal(selectTmdbMatch(combined, [pacific, enemy])?.id, pacific.id);
assert.equal(selectTmdbMatch({ ...combined, title: 'Pacific Rim — Círculo de Fogo' }, [pacific, enemy])?.id, pacific.id);
assert.equal(selectTmdbMatch({ ...combined, title: 'Círculo de Fogo - Unknown Original' }, [pacific, enemy]), null);
assert.equal(selectTmdbMatch({ ...combined, year: 2001 }, [pacific]), null);
assert.equal(selectTmdbMatch({ ...combined, posterPath: '/wrong.jpg' }, [pacific]), null);
assert.equal(selectTmdbMatch(combined, [pacific, { ...pacific, id: 2 }]), null);
assert.equal(selectTmdbMatch({ ...combined, title: 'Círculo de Fogo' }, [pacific, enemy]), null);
assert.equal(selectTmdbMatch({ ...combined, kind: 'series' }, [pacific, enemy]), null);
console.log('PASS_COMPOSITE_BOTH_OFFICIAL_NAMES_YEAR_KIND_FILENAME_AND_AMBIGUITY');

const hint = 'uvDTyyRpM8MenTBZwtBnn93VSoh.jpg';
assert.equal(tmdbPosterPath('https://cdn.synthetic.invalid/covers/' + hint), '/' + hint);
for (const uri of ['https://user:password@cdn.synthetic.invalid/' + hint, 'https://cdn.synthetic.invalid/' + hint + '?auth=secret',
  'file:///covers/' + hint, 'https://cdn.synthetic.invalid/poster.jpg', 'https://cdn.synthetic.invalid/3937f9ab7ad0b189212ac4d8eecf2a19.jpg']) assert.equal(tmdbPosterPath(uri), undefined);
console.log('PASS_REHOSTED_FILENAME_HINT_NO_CREDENTIAL_QUERY_GENERIC_DIGEST_OR_FILE_URI');

const homonym = { kind: 'movie', title: 'Example', sourcePosterUri: 'https://source.synthetic.invalid/covers/one.jpg' };
const candidates = [1, 2].map(id => ({ id, title: 'Example', original_title: 'Original ' + id, release_date: '2001-01-01' }));
function fixture({ matchPoster = async (_uri, values) => values[1], rows = candidates, storage, now = () => Date.now() } = {}) {
  const calls = []; let compared = 0, uriUsed;
  const service = new TmdbMetadataService({ credential: () => 'synthetic-token', storage: storage || { getItem: () => null, setItem() {} }, now,
    matchPoster: async (uri, values) => { compared++; uriUsed = uri; return matchPoster(uri, values); },
    fetchImpl: async input => { const url = new URL(input); calls.push({ path: url.pathname, query: url.search });
      const id = Number(url.pathname.split('/').at(-1));
      return { ok: true, status: 200, json: async () => url.pathname.includes('/search/') ? { results: rows }
        : { ...rows.find(c => c.id === id), id, poster_path: '/p' + id + '.jpg', backdrop_path: '/b.jpg', overview: 'Verified public synopsis', genres: [] } };
    } });
  return { service, calls, compared: () => compared, uri: () => uriUsed };
}
const subtitleQuery = fixture({ rows: [cinderella] });
assert.equal((await subtitleQuery.service.resolve(subtitled))?.tmdbId, 9454);
assert.equal(new URLSearchParams(subtitleQuery.calls[0].query).get('query'), 'Para Sempre Cinderela');
console.log('PASS_SUBTITLE_SUFFIX_ONLY_PRESERVES_REAL_TITLES_YEAR_AMBIGUITY_AND_NORMALIZED_QUERY');
const recovered = fixture();
assert.equal((await recovered.service.resolve(homonym))?.tmdbId, 2);
assert.equal(recovered.compared(), 1); assert.equal(recovered.uri(), homonym.sourcePosterUri);
assert.ok(recovered.calls.every(c => !c.query.includes('source.synthetic') && !c.query.includes('one.jpg')));
await recovered.service.resolve(homonym); assert.equal(recovered.compared(), 1);
assert.equal(await fixture({ matchPoster: async () => ({ ...candidates[1] }) }).service.resolve(homonym), null, 'matcher cannot return unverified candidate object');
assert.equal(await fixture({ matchPoster: async () => null }).service.resolve(homonym), null);
const weak = fixture({ rows: candidates.map(c => ({ ...c, title: 'Unrelated', original_title: 'Unrelated' })) });
assert.equal(await weak.service.resolve(homonym), null); assert.equal(weak.compared(), 0);
const many = fixture({ rows: Array.from({ length: 7 }, (_, i) => ({ ...candidates[0], id: i + 1 })) });
assert.equal(await many.service.resolve(homonym), null); assert.equal(many.calls.length, 1); assert.equal(many.compared(), 0);
const pinned = fixture(); assert.equal(await pinned.service.resolve({ ...homonym, posterPath: '/missing.jpg' }), null); assert.equal(pinned.compared(), 0);
const wrongYear = fixture(); assert.equal(await wrongYear.service.resolve({ ...homonym, year: 1990 }), null); assert.equal(wrongYear.compared(), 0);
let transient = true;
const retry = fixture({ matchPoster: async (_uri, rows) => { if (transient) throw Error('synthetic transport'); return rows[1]; } });
assert.equal(await retry.service.resolve(homonym), null); transient = false;
assert.equal((await retry.service.resolve(homonym))?.tmdbId, 2, 'transport failure never pins negative cache');
console.log('PASS_BOUNDED_SOURCE_POSTER_RECOVERY_NO_SOURCE_TO_API_FILENAME_YEAR_AND_TRANSIENT_GUARDS');

const second = { ...homonym, sourcePosterUri: 'https://source.synthetic.invalid/covers/two.jpg' };
const firstKey = artworkIdentityKey(homonym), secondKey = artworkIdentityKey(second);
assert.notEqual(firstKey, secondKey); assert.ok(!firstKey.includes('https') && !firstKey.includes('source.synthetic') && !firstKey.includes('one.jpg'));
const independent = fixture({ matchPoster: async (uri, rows) => uri === homonym.sourcePosterUri ? rows[0] : rows[1] });
assert.equal((await independent.service.resolve(homonym))?.tmdbId, 1);
assert.equal((await independent.service.resolve(second))?.tmdbId, 2);
const clock = () => 1_700_000_000_000;
const oldKey = artworkIdentityKey({ kind: 'movie', title: homonym.title }).replace(':match6', ':match5');
const storage = { getItem: () => JSON.stringify({ version: 2, entries: [[oldKey, { expires: clock() + 60000, value: { kind: 'movie', tmdbId: 1, genres: [] } }]] }), setItem() {} };
const legacy = fixture({ storage, now: clock }); assert.equal(legacy.service.peek(homonym), null);
assert.equal((await legacy.service.resolve(homonym))?.tmdbId, 2);
assert.equal(artworkIdentityKey({ ...homonym, tmdbId: 2 }), 'movie:2:');
console.log('PASS_TWO_HOMONYMS_TWO_POSTERS_OPAQUE_CACHE_KEYS_AND_UNTRUSTED_LEGACY_NOT_REUSED');

const rgb = Array.from({ length: 24 * 36 * 3 }, (_, n) => n % 2 ? 200 : 35);
const sample = { ratio: 2 / 3, rgb }, compressed = { ratio: 2 / 3, rgb: rgb.map(n => n + 2) };
assert.equal(samePoster(sample, compressed), true);
assert.equal(samePoster(sample, { ...sample, rgb: rgb.map(n => 255 - n) }), false);
assert.equal(samePoster(sample, { ...sample, rgb: rgb.map(n => n + 20) }), false, 'related colors are insufficient');
assert.equal(samePoster(sample, { ...sample, rgb: rgb.map((n,i) => i < rgb.length / 4 ? 255 - n : n) }), false, 'partially replaced artwork is insufficient');
assert.equal(samePoster({ ...sample, rgb: rgb.map(() => 200) }, { ...sample, rgb: rgb.map(() => 200) }), false);
assert.equal(samePoster(sample, { ...sample, ratio: 1.8 }), false);
assert.equal(samePoster(sample, { ...sample, rgb: rgb.slice(1) }), false);
assert.equal(samePoster(sample, { ...sample, rgb: rgb.map(() => NaN) }), false);
const paths = identityPosterPaths({ poster_path: '/main.jpg', images: { posters: [
  { file_path: '/pt.jpg', iso_639_1: 'pt' }, { file_path: 'https://source.synthetic.invalid/secret', iso_639_1: 'pt' },
  ...Array.from({ length: 8 }, (_, n) => ({ file_path: '/p' + n + '.jpg', iso_639_1: 'en' }))] } });
assert.equal(paths.length, 8); assert.deepEqual(paths.slice(0, 2), ['/main.jpg', '/pt.jpg']); assert.ok(paths.every(p => !p.includes('http')));
console.log('PASS_STRICT_PIXEL_TEXTURE_ASPECT_CONTENT_VALIDATION_AND_EIGHT_OFFICIAL_THUMBNAILS_MAX');
