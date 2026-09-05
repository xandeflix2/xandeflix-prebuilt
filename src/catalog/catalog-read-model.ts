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

  constructor(catalog: PrebuiltCatalog) {
    this.catalog = catalog;
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
}
