export const ARTWORK_KIND_ISOLATION_LOCK_ID = 'ARTWORK_KIND_ISOLATION_LOCK_V1';

export const ARTWORK_KIND_ISOLATION_LOCK_INVARIANTS = [
  'canonical-kind-is-part-of-artwork-resolution-key',
  'normalized-title-is-part-of-artwork-resolution-key',
  'year-is-part-of-artwork-resolution-key-when-available',
  'explicit-identity-is-preferred-over-fuzzy-title',
  'movie-artwork-never-binds-to-series-without-explicit-proof',
  'series-artwork-never-binds-to-movie-without-explicit-proof',
  'sobrenatural-series-and-movie-are-distinct-fixtures',
] as const;

export const ARTWORK_KIND_ISOLATION_LOCK_MATERIAL =
  `${ARTWORK_KIND_ISOLATION_LOCK_ID}\n${ARTWORK_KIND_ISOLATION_LOCK_INVARIANTS.join('\n')}`;

export const ARTWORK_KIND_ISOLATION_LOCK_HASH =
  '23DA17462298F00A30A68151B2CB374C9AE5F3C9004CE24E13D3118C1EC8FF5C';
