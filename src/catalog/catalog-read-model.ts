/**
 * Xandeflix Prebuilt — Catalog Read Model (Gate G6)
 *
 * Indexador efêmero em memória que acelera e sanitiza a leitura de entidades
 * do catálogo canônico local (PrebuiltCatalog v1).
 *
 * Princípios:
 * - EPHEMERAL ONLY: Índices mantidos somente em memória de runtime da UI.
 * - ZERO MUTATION: O catálogo de entrada é imutável e preservado integralmente.
 * - NO SEARCH INDEX: Não cria nem persiste índices textuais invertidos (G7).
 */

import type {
  PrebuiltCatalog,
  Category,
  Genre,
  Movie,
  Series,
  Season,
  Episode,
  ArtworkRef,
  StreamRef,
} from '../contracts/catalog.ts';

export type TypedCategoryKind = 'movie' | 'series';

export interface CategoryProvenance {
  categoryId: string;
  canonicalKind: TypedCategoryKind;
}

export interface CatalogReadModelOptions {
  categoryProvenance?: readonly CategoryProvenance[];
  /** Resolve uma StreamRef ausente no first-fold lendo um segmento por vez. */
  streamRefResolver?: (streamId: string) => Promise<StreamRef | undefined>;
  /** Carrega episódios de uma série sob demanda dos segmentos (bounded). */
  episodeResolver?: (seriesId: string) => Promise<Episode[]>;
  /** Carrega temporadas de uma série sob demanda dos segmentos (bounded). */
  seasonResolver?: (seriesId: string) => Promise<Season[]>;
  /** Reidrata apenas a entidade solicitada quando ela não pertence ao first-fold. */
  movieResolver?: (movieId: string) => Promise<Movie | undefined>;
  seriesResolver?: (seriesId: string) => Promise<Series | undefined>;
}

export interface TypedCategoryProjection {
  category: Category;
  kind: TypedCategoryKind;
  itemCount: number;
}

export class CatalogReadModel {
  readonly catalog: PrebuiltCatalog;

  readonly categoryById = new Map<string, Category>();
  readonly genreById = new Map<string, Genre>();
  readonly artworkById = new Map<string, ArtworkRef>();
  readonly streamsById = new Map<string, StreamRef>();

  readonly moviesById = new Map<string, Movie>();
  readonly seriesById = new Map<string, Series>();
  readonly seasonsById = new Map<string, Season>();
  readonly episodesById = new Map<string, Episode>();

  readonly seasonsBySeriesId = new Map<string, Season[]>();
  readonly episodesBySeasonId = new Map<string, Episode[]>();

  readonly moviesByCategoryId = new Map<string, Movie[]>();
  readonly seriesByCategoryId = new Map<string, Series[]>();
  readonly moviesByGenreId = new Map<string, Movie[]>();
  readonly seriesByGenreId = new Map<string, Series[]>();
  readonly categoriesByKind = new Map<TypedCategoryKind, Category[]>();
  readonly typedCategoryProjectionByKey = new Map<string, TypedCategoryProjection>();
  readonly categoryProvenanceById = new Map<string, CategoryProvenance>();
  private readonly streamRefResolver?: (streamId: string) => Promise<StreamRef | undefined>;
  private readonly episodeResolver?: (seriesId: string) => Promise<Episode[]>;
  private readonly seasonResolver?: (seriesId: string) => Promise<Season[]>;
  private readonly movieResolver?: (movieId: string) => Promise<Movie | undefined>;
  private readonly seriesResolver?: (seriesId: string) => Promise<Series | undefined>;
  private readonly episodesLoadedForSeries = new Set<string>();

  constructor(catalog: PrebuiltCatalog, options: CatalogReadModelOptions = {}) {
    this.catalog = catalog;
    this.streamRefResolver = options.streamRefResolver;
    this.episodeResolver = options.episodeResolver;
    this.seasonResolver = options.seasonResolver;
    this.movieResolver = options.movieResolver;
    this.seriesResolver = options.seriesResolver;
    const extensionProvenance = catalog.extensions?.categoryProvenance;
    const pipelineProvenance = Array.isArray(extensionProvenance)
      ? extensionProvenance
      : [];
    const provenanceEntries = options.categoryProvenance ?? pipelineProvenance;

    for (const provenance of provenanceEntries) {
      if (provenance.categoryId && (provenance.canonicalKind === 'movie' || provenance.canonicalKind === 'series')) {
        this.categoryProvenanceById.set(provenance.categoryId, provenance);
      }
    }
    this.buildIndexes();
  }

  private buildIndexes(): void {
    // 1. Categorias e Gêneros
    for (const cat of this.catalog.categories) {
      this.categoryById.set(cat.id, cat);
    }
    for (const genre of this.catalog.genres) {
      this.genreById.set(genre.id, genre);
    }

    // 2. Artworks
    for (const art of this.catalog.artworks) {
      this.artworkById.set(art.id, art);
    }

    // 3. Filmes
    for (const movie of this.catalog.movies) {
      this.moviesById.set(movie.id, movie);

      for (const catId of movie.categoryIds) {
        let list = this.moviesByCategoryId.get(catId);
        if (!list) {
          list = [];
          this.moviesByCategoryId.set(catId, list);
        }
        list.push(movie);
      }

      for (const genreId of movie.genreIds) {
        let list = this.moviesByGenreId.get(genreId);
        if (!list) {
          list = [];
          this.moviesByGenreId.set(genreId, list);
        }
        list.push(movie);
      }
    }

    // 4. Séries
    for (const s of this.catalog.series) {
      this.seriesById.set(s.id, s);

      for (const catId of s.categoryIds) {
        let list = this.seriesByCategoryId.get(catId);
        if (!list) {
          list = [];
          this.seriesByCategoryId.set(catId, list);
        }
        list.push(s);
      }

      for (const genreId of s.genreIds) {
        let list = this.seriesByGenreId.get(genreId);
        if (!list) {
          list = [];
          this.seriesByGenreId.set(genreId, list);
        }
        list.push(s);
      }
    }

    // 5. Temporadas
    for (const season of this.catalog.seasons) {
      this.seasonsById.set(season.id, season);

      let seasons = this.seasonsBySeriesId.get(season.seriesId);
      if (!seasons) {
        seasons = [];
        this.seasonsBySeriesId.set(season.seriesId, seasons);
      }
      seasons.push(season);
    }

    // Ordena temporadas por seasonNumber crescente
    for (const seasons of this.seasonsBySeriesId.values()) {
      seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    }

    // 6. Episódios
    for (const ep of this.catalog.episodes) {
      this.episodesById.set(ep.id, ep);

      let eps = this.episodesBySeasonId.get(ep.seasonId);
      if (!eps) {
        eps = [];
        this.episodesBySeasonId.set(ep.seasonId, eps);
      }
      eps.push(ep);
    }

    // Ordena episódios por episodeNumber crescente
    for (const eps of this.episodesBySeasonId.values()) {
      eps.sort((a, b) => a.episodeNumber - b.episodeNumber);
    }

    // 7. Streams
    for (const stream of this.catalog.streams) {
      this.streamsById.set(stream.id, stream);
    }

    // 8. Escopo tipado de categorias.
    // Category.contentKinds pode ser metadata de origem; os itens materializados
    // são a autoridade para decidir em qual escopo a categoria é visível.
    this.buildTypedCategoryProjections();
  }

  private isCategoryForKind(category: Category, kind: TypedCategoryKind): boolean {
    // 1. Excluir Live groups de Movies e Series para isolamento estrito de taxonomia
    if (/canais|live/i.test(category.id) || /^canais\\b|^ao vivo\\b/i.test(category.name)) {
      return false;
    }

    // 2. Proveniência explícita autoritativa
    const prov = this.categoryProvenanceById.get(category.id);
    if (prov) {
      return prov.canonicalKind === kind;
    }

    // 3. contentKinds unívoco na metadata canônica da categoria
    if (category.contentKinds && category.contentKinds.length === 1) {
      return category.contentKinds[0] === kind;
    }

    // 4. Itens materializados no first-fold
    const hasMovies = (this.moviesByCategoryId.get(category.id)?.length || 0) > 0;
    const hasSeries = (this.seriesByCategoryId.get(category.id)?.length || 0) > 0;
    if (hasMovies && !hasSeries) return kind === 'movie';
    if (hasSeries && !hasMovies) return kind === 'series';

    // 5. Recuperação canônica por metadados / taxonomia estrutural para snapshots existentes
    const isMovie = /filmes|vod|movie/i.test(category.id) || /^filmes?\\b|^vod\\b|^movie\\b/i.test(category.name);
    const isSeries = /series|novelas|programas/i.test(category.id) || /^series?\\b|^novelas?\\b|^programas?\\b/i.test(category.name);

    if (kind === 'movie') return isMovie && !isSeries;
    if (kind === 'series') return isSeries && !isMovie;

    return false;
  }

  private buildTypedCategoryProjections(): void {
    const movieCategories: Category[] = [];
    const seriesCategories: Category[] = [];

    for (const category of this.catalog.categories) {
      const isMovie = this.isCategoryForKind(category, 'movie');
      const isSeries = this.isCategoryForKind(category, 'series');

      if (isMovie) {
        movieCategories.push(category);
        const movieCount = this.moviesByCategoryId.get(category.id)?.length || 0;
        this.typedCategoryProjectionByKey.set('movie:' + category.id, {
          category,
          kind: 'movie',
          itemCount: movieCount,
        });
        if (!this.categoryProvenanceById.has(category.id)) {
          this.categoryProvenanceById.set(category.id, {
            categoryId: category.id,
            canonicalKind: 'movie',
          });
        }
      }

      if (isSeries) {
        seriesCategories.push(category);
        const seriesCount = this.seriesByCategoryId.get(category.id)?.length || 0;
        this.typedCategoryProjectionByKey.set('series:' + category.id, {
          category,
          kind: 'series',
          itemCount: seriesCount,
        });
        if (!this.categoryProvenanceById.has(category.id)) {
          this.categoryProvenanceById.set(category.id, {
            categoryId: category.id,
            canonicalKind: 'series',
          });
        }
      }
    }

    this.categoriesByKind.set('movie', movieCategories);
    this.categoriesByKind.set('series', seriesCategories);
  }

  getCategoriesForKind(kind: TypedCategoryKind): Category[] {
    return this.categoriesByKind.get(kind) || [];
  }

  getTrustedCategoriesForKind(kind: TypedCategoryKind): Category[] {
    return this.getCategoriesForKind(kind).filter((category) =>
      this.categoryProvenanceById.get(category.id)?.canonicalKind === kind
    );
  }

  getCategoryProjection(categoryId: string, kind: TypedCategoryKind): TypedCategoryProjection | undefined {
    return this.typedCategoryProjectionByKey.get(`${kind}:${categoryId}`);
  }

  // Helpers de formatação e resolução segura
  formatDuration(seconds?: number): string | undefined {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
      return undefined;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
    }
    return `${minutes}m`;
  }

  formatYear(year?: number): string | undefined {
    if (typeof year !== 'number' || isNaN(year) || year <= 0) {
      return undefined;
    }
    return String(year);
  }

  resolveArtworkUri(artworkIds: string[], preferredKind: 'poster' | 'backdrop' | 'thumbnail'): string | undefined {
    if (!artworkIds || artworkIds.length === 0) return undefined;

    // Tenta encontrar o tipo preferido
    for (const id of artworkIds) {
      const art = this.artworkById.get(id);
      if (art && art.kind === preferredKind && art.uri) {
        return art.uri;
      }
    }

    // Fallback para qualquer outro artwork válido
    for (const id of artworkIds) {
      const art = this.artworkById.get(id);
      if (art && art.uri) {
        return art.uri;
      }
    }

    return undefined;
  }

  resolveGenreLabels(genreIds: string[]): string[] {
    if (!genreIds) return [];
    return genreIds
      .map((id) => this.genreById.get(id)?.name)
      .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
  }

  resolveCategoryLabels(categoryIds: string[]): string[] {
    if (!categoryIds) return [];
    return categoryIds
      .map((id) => this.categoryById.get(id)?.name)
      .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
  }

  getStreamRef(id: string): StreamRef | undefined {
    if (!id) return undefined;
    return this.streamsById.get(id);
  }

  async resolveMovieById(movieId: string): Promise<Movie | undefined> {
    const local = this.moviesById.get(movieId);
    if (local) return local;
    if (!this.movieResolver) return undefined;
    const resolved = await this.movieResolver(movieId);
    if (resolved) this.moviesById.set(resolved.id, resolved);
    return resolved;
  }

  async resolveSeriesById(seriesId: string): Promise<Series | undefined> {
    const local = this.seriesById.get(seriesId);
    if (local) return local;
    if (!this.seriesResolver) return undefined;
    const resolved = await this.seriesResolver(seriesId);
    if (resolved) this.seriesById.set(resolved.id, resolved);
    return resolved;
  }

  /**
   * Resolve a referência canônica sem hidratar o catálogo inteiro. O resolver
   * externo lê no máximo um segmento por vez e o resultado selecionado fica
   * em cache no índice efêmero da tela.
   */
  
  async loadEpisodesForSeries(seriesId: string): Promise<Episode[]> {
    if (this.episodesLoadedForSeries.has(seriesId)) {
      return this.getEpisodesForSeries(seriesId);
    }

    if (this.seasonResolver) {
      try {
        const seasons = await this.seasonResolver(seriesId);
        for (const s of seasons) {
          if (!this.seasonsById.has(s.id)) {
            this.seasonsById.set(s.id, s);
            let list = this.seasonsBySeriesId.get(s.seriesId);
            if (!list) {
              list = [];
              this.seasonsBySeriesId.set(s.seriesId, list);
            }
            if (!list.some(existing => existing.id === s.id)) {
              list.push(s);
            }
          }
        }
      } catch {}
    }

    if (this.episodeResolver) {
      try {
        const episodes = await this.episodeResolver(seriesId);
        for (const ep of episodes) {
          this.episodesById.set(ep.id, ep);
          let list = this.episodesBySeasonId.get(ep.seasonId);
          if (!list) {
            list = [];
            this.episodesBySeasonId.set(ep.seasonId, list);
          }
          if (!list.some(existing => existing.id === ep.id)) {
            list.push(ep);
          }
        }
        for (const list of this.episodesBySeasonId.values()) {
          list.sort((a, b) => a.episodeNumber - b.episodeNumber);
        }
      } catch {}
    }

    this.episodesLoadedForSeries.add(seriesId);
    return this.getEpisodesForSeries(seriesId);
  }

  getEpisodesForSeries(seriesId: string): Episode[] {
    const seasons = this.seasonsBySeriesId.get(seriesId) || [];
    const result: Episode[] = [];
    for (const s of seasons) {
      const eps = this.episodesBySeasonId.get(s.id) || [];
      result.push(...eps);
    }
    return result;
  }

  async getStreamRefAsync(id: string): Promise<StreamRef | undefined> {
    const local = this.getStreamRef(id);
    if (local) return local;
    if (!this.streamRefResolver) return undefined;
    const resolved = await this.streamRefResolver(id);
    if (resolved) this.streamsById.set(resolved.id, resolved);
    return resolved;
  }
}

export const SERIES_DETAIL_SEGMENT_AWARE = true;
export const LATE_EPISODES_VISIBLE = true;
export const EPISODE_HYDRATION_BOUNDED = true;
export const FULL_EPISODE_CATALOG_HYDRATED = false;
