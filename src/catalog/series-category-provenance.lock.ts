export const SERIES_CATEGORY_PROVENANCE_LOCK_ID = 'SERIES_CATEGORY_PROVENANCE_LOCK_V1';

export const SERIES_CATEGORY_PROVENANCE_LOCK_INVARIANTS = [
  'category-name-is-never-kind-authority',
  'content-kinds-alone-is-insufficient-provenance',
  'linked-series-alone-is-insufficient-provenance',
  'untrusted-categories-fail-closed',
  'series-cards-remain-available',
  'carousel-hidden-when-no-trusted-categories-exist',
  'trusted-structural-metadata-may-enable-categories',
  'no-source-or-catalog-mutation-required',
] as const;

export const SERIES_CATEGORY_PROVENANCE_LOCK_MATERIAL =
  `${SERIES_CATEGORY_PROVENANCE_LOCK_ID}\n${SERIES_CATEGORY_PROVENANCE_LOCK_INVARIANTS.join('\n')}`;

export const SERIES_CATEGORY_PROVENANCE_LOCK_HASH =
  '862E193339D6E8B0E732A23424B7F43501DDA0FDCBD9C1C3BBB51FE66B0208AA';
