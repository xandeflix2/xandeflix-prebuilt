/**
 * Contrato estrutural da projeÃ§Ã£o da pÃ¡gina Series.
 * O hash nÃ£o inclui dados de catÃ¡logo, URLs ou segredos.
 */

export const SERIES_PAGE_TYPED_SCOPE_LOCK_ID = 'SERIES_PAGE_TYPED_SCOPE_LOCK_V1';

export const SERIES_PAGE_TYPED_SCOPE_LOCK_INVARIANTS = [
  'series-page-accepts-only-series',
  'movie-never-enters-series-page',
  'live-never-enters-series-page',
  'unresolved-never-enters-series-page',
  'mixed-category-does-not-contaminate-series-page',
  'series-categories-derive-from-typed-series-subset',
  'no-textual-kind-heuristic',
  'active-mixed-snapshot-does-not-contaminate-series-page',
] as const;

export const SERIES_PAGE_TYPED_SCOPE_LOCK_MATERIAL =
  `${SERIES_PAGE_TYPED_SCOPE_LOCK_ID}\n${SERIES_PAGE_TYPED_SCOPE_LOCK_INVARIANTS.join('\n')}`;

export const SERIES_PAGE_TYPED_SCOPE_LOCK_HASH =
  'BBF80DF7FAF65345C5366057D722E8F1A98B0C50913AAD90F1010A0D6D65041E';
