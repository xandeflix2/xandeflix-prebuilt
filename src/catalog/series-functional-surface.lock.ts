/**
 * Xandeflix Prebuilt — Series Functional Surface Lock (Gate S7)
 *
 * Contrato canônico consolidado que protege a superfície funcional de Séries,
 * a integridade referencial de temporadas, episódios, categorias confiáveis,
 * handoff de player e busca derivada, impedindo regressões em relação aos
 * baselines protegidos de Filmes e Canais ao Vivo.
 *
 * Princípios:
 * - TYPED_SERIES_SCOPE_ONLY: Somente entidades canônicas de série entram na superfície de séries.
 * - CATEGORY_PROVENANCE_FAIL_CLOSED: Categorias sem proveniência confiável nunca são expostas.
 * - CLEAN_EPISODE_ATTRIBUTES: Títulos de episódios nunca contêm atributos EXTINF brutos.
 * - CROSS_KIND_ISOLATION: Obras homônimas (ex: Sobrenatural Filme vs Série) mantêm identidade e artwork isolados.
 * - SEARCH_REFERENTIAL_INTEGRITY: Índice derivado de busca referencia estritamente IDs canônicos do catálogo.
 * - SEMANTIC_NOT_STATIC: Protege contratos e semântica; não congela contagens transitórias de instâncias.
 */

export const SERIES_FUNCTIONAL_SURFACE_LOCK_ID = 'SERIES_FUNCTIONAL_SURFACE_LOCK_V1';

export const SERIES_FUNCTIONAL_SURFACE_LOCK_INVARIANTS = [
  'series-typed-scope-only',
  'live-never-enters-series-scope',
  'movie-never-enters-series-scope',
  'unresolved-never-enters-series-scope',
  'series-category-provenance-required',
  'untrusted-series-category-fails-closed',
  'series-category-carousel-contract-valid',
  'series-detail-resolution-by-canonical-id',
  'season-relationship-strictly-bound-to-series',
  'episode-relationship-strictly-bound-to-season-and-series',
  'episode-player-handoff-contract-valid',
  'raw-extinf-attributes-never-leak-to-series-or-episodes',
  'cross-kind-artwork-collision-prevented',
  'search-series-reference-contract-valid',
  'dead-series-search-reference-forbidden',
  'movies-and-live-baselines-protected-from-series-mutations',
] as const;

export const SERIES_FUNCTIONAL_SURFACE_LOCK_MATERIAL =
  `${SERIES_FUNCTIONAL_SURFACE_LOCK_ID}\n${SERIES_FUNCTIONAL_SURFACE_LOCK_INVARIANTS.join('\n')}`;

export const SERIES_FUNCTIONAL_SURFACE_LOCK_HASH =
  '54B1CB861FC3797F81F49E78AFFF157D07366EC62F93FBF2C2183E7694BC4BEF';
