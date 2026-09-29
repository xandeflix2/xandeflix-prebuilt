export const CATALOG_KIND_INTEGRITY_LOCK_ID = 'CATALOG_KIND_INTEGRITY_LOCK_V1';

export const CATALOG_KIND_INTEGRITY_LOCK_INVARIANTS = [
  'live-never-becomes-series',
  'movie-never-becomes-series',
  'series-never-becomes-movie',
  'raw-m3u-attributes-never-enter-title',
  'ambiguous-items-are-unresolved',
  'category-provenance-is-produced-by-the-pipeline',
  'mixed-category-never-receives-false-single-kind-provenance',
  'artwork-match-is-kind-safe',
] as const;

export const CATALOG_KIND_INTEGRITY_LOCK_MATERIAL =
  `${CATALOG_KIND_INTEGRITY_LOCK_ID}\n${CATALOG_KIND_INTEGRITY_LOCK_INVARIANTS.join('\n')}`;

export const CATALOG_KIND_INTEGRITY_LOCK_HASH =
  'E8F2F4D02C9C6854762B6DB9133DEC0019F2267302DC389814886EDC26D48514';
