/**
 * Xandeflix Prebuilt — Normalization Pipeline
 *
 * Transforma o modelo intermediário (RawSourceCatalog) no formato canônico
 * PrebuiltCatalog v1 com garantia de determinismo e integridade referencial.
 *
 * Princípios:
 * - INGESTION_ID_STRATEGY=DETERMINISTIC
 * - STREAM_CREDENTIAL_EMBEDDING=PROHIBITED
 * - FAIL_CLOSED=SIM
 */

import { createHash } from 'node:crypto';
import type {
  PrebuiltCatalog,
  Movie,
  Series,
  Season,
  Episode,
  Category,
  Genre,
  ArtworkRef,
  StreamRef,
  SnapshotCounts,
} from '../contracts/catalog.ts';
import type { RawSourceCatalog, IngestionOptions, IngestionMetrics } from './types.ts';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeRawCatalog(
  raw: RawSourceCatalog,
  options?: IngestionOptions
): { catalog: PrebuiltCatalog; metrics: IngestionMetrics } {
  const startTime = Date.now();
  const ns = options?.sourceNamespace || 'syn';

  const categoryMap = new Map<string, { id: string; name: string; contentKinds: Set<'movie' | 'series'> }>();
  const genreMap = new Map<string, { id: string; name: string }>();

  const artworks: ArtworkRef[] = [];
  const artworkIds = new Set<string>();

  const streams: StreamRef[] = [];
  const streamIds = new Set<string>();

  function registerArtwork(kind: 'poster' | 'backdrop' | 'thumbnail' | 'logo', uri: string, entityId: string): string {
    const cleanUri = uri.trim();
    if (/:\/\/.*:.*@/.test(cleanUri)) {
      throw new Error(`Credencial embutida proibida detectada em URI de artwork para ${entityId}: '${cleanUri}'`);
    }
    const artId = `${ns}:art:${entityId}:${kind}`;
    if (!artworkIds.has(artId)) {
      artworks.push({
        id: artId,
        kind,
        uri: cleanUri,
      });
      artworkIds.add(artId);
    }
    return artId;
  }

  function registerStream(contentKind: 'movie' | 'series' | 'episode', sourceItemId: string | number, containerExtension?: string, qualityLabel?: string): string {
    const cleanSourceId = String(sourceItemId).trim();
    const streamId = `${ns}:stream:${contentKind}:${cleanSourceId}`;
    if (!streamIds.has(streamId)) {
      streams.push({
        id: streamId,
        sourceItemId: cleanSourceId,
        contentKind,
        ...(containerExtension ? { containerExtension: containerExtension.trim() } : {}),
        ...(qualityLabel ? { qualityLabel: qualityLabel.trim() } : {}),
      });
      streamIds.add(streamId);
    }
    return streamId;
  }

  function getOrRegisterCategory(name: string, kind: 'movie' | 'series'): string {
    const cleanName = name.trim();
    const slug = slugify(cleanName);
    const catId = `${ns}:cat:${slug}`;

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        id: catId,
        name: cleanName,
        contentKinds: new Set([kind]),
      });
    } else {
      categoryMap.get(catId)!.contentKinds.add(kind);
    }

    return catId;
  }

  function getOrRegisterGenre(name: string): string {
    const cleanName = name.trim();
    const slug = slugify(cleanName);
    const genreId = `${ns}:genre:${slug}`;

    if (!genreMap.has(genreId)) {
      genreMap.set(genreId, {
        id: genreId,
        name: cleanName,
      });
    }

    return genreId;
  }

  // 1. Normalizar Filmes
  const movies: Movie[] = [];
  for (const rawMovie of raw.movies) {
    const cleanSourceId = String(rawMovie.sourceItemId).trim();
    const movieId = `${ns}:movie:${cleanSourceId}`;

    const catIds = rawMovie.categories
      .filter((c) => c && c.trim())
      .map((c) => getOrRegisterCategory(c, 'movie'));

    const genIds = rawMovie.genres
      .filter((g) => g && g.trim())
      .map((g) => getOrRegisterGenre(g));

    const movieArtworkIds: string[] = [];
    for (const art of rawMovie.artworks || []) {
      if (art.url && art.url.trim()) {
        movieArtworkIds.push(registerArtwork(art.kind, art.url, movieId));
      }
    }

    const movieStreamIds: string[] = [];
    for (const st of rawMovie.streams || []) {
      if (st.sourceItemId !== undefined && st.sourceItemId !== null) {
        movieStreamIds.push(registerStream('movie', st.sourceItemId, st.containerExtension, st.qualityLabel));
      }
    }

    let parsedYear: number | undefined;
    if (rawMovie.year !== undefined && rawMovie.year !== null) {
      const y = Number(rawMovie.year);
      if (isNaN(y) || y < 1880 || y > 2100) {
        throw new Error(`Ano inválido para o filme '${rawMovie.title}': ${rawMovie.year}`);
      }
      parsedYear = y;
    }

    let parsedDuration: number | undefined;
    if (rawMovie.durationSeconds !== undefined && rawMovie.durationSeconds !== null) {
      const d = Number(rawMovie.durationSeconds);
      if (!isNaN(d) && d > 0) {
        parsedDuration = d;
      }
    }

    movies.push({
      id: movieId,
      title: rawMovie.title.trim(),
      ...(rawMovie.originalTitle ? { originalTitle: rawMovie.originalTitle.trim() } : {}),
      ...(parsedYear !== undefined ? { year: parsedYear } : {}),
      ...(rawMovie.overview ? { overview: rawMovie.overview.trim() } : {}),
      ...(parsedDuration !== undefined ? { durationSeconds: parsedDuration } : {}),
      categoryIds: [...new Set(catIds)].sort(),
      genreIds: [...new Set(genIds)].sort(),
      artworkIds: [...new Set(movieArtworkIds)].sort(),
      streamIds: [...new Set(movieStreamIds)].sort(),
      ...(rawMovie.tmdbId || rawMovie.imdbId
        ? {
            externalIds: {
              ...(rawMovie.tmdbId ? { tmdbId: rawMovie.tmdbId } : {}),
              ...(rawMovie.imdbId ? { imdbId: rawMovie.imdbId } : {}),
              sourceItemId: cleanSourceId,
            },
          }
        : { externalIds: { sourceItemId: cleanSourceId } }),
    });
  }

  // 2. Normalizar Séries, Temporadas e Episódios
  const seriesList: Series[] = [];
  const seasonsList: Season[] = [];
  const episodesList: Episode[] = [];

  for (const rawSeries of raw.series) {
    const cleanSeriesSourceId = String(rawSeries.sourceItemId).trim();
    const seriesId = `${ns}:series:${cleanSeriesSourceId}`;

    const catIds = rawSeries.categories
      .filter((c) => c && c.trim())
      .map((c) => getOrRegisterCategory(c, 'series'));

    const genIds = rawSeries.genres
      .filter((g) => g && g.trim())
      .map((g) => getOrRegisterGenre(g));

    const seriesArtworkIds: string[] = [];
    for (const art of rawSeries.artworks || []) {
      if (art.url && art.url.trim()) {
        seriesArtworkIds.push(registerArtwork(art.kind, art.url, seriesId));
      }
    }

    let parsedYear: number | undefined;
    if (rawSeries.year !== undefined && rawSeries.year !== null) {
      const y = Number(rawSeries.year);
      if (isNaN(y) || y < 1880 || y > 2100) {
        throw new Error(`Ano inválido para a série '${rawSeries.title}': ${rawSeries.year}`);
      }
      parsedYear = y;
    }

    const seasonIds: string[] = [];

    for (const rawSeason of rawSeries.seasons) {
      const sNum = Number(rawSeason.seasonNumber);
      const seasonId = `${ns}:season:${cleanSeriesSourceId}:${sNum}`;
      seasonIds.push(seasonId);

      const seasonArtworkIds: string[] = [];
      for (const art of rawSeason.artworks || []) {
        if (art.url && art.url.trim()) {
          seasonArtworkIds.push(registerArtwork(art.kind, art.url, seasonId));
        }
      }

      const episodeIds: string[] = [];

      for (const rawEp of rawSeason.episodes) {
        const epNum = Number(rawEp.episodeNumber);
        const epId = `${ns}:episode:${cleanSeriesSourceId}:${sNum}:${epNum}`;
        episodeIds.push(epId);

        const epArtworkIds: string[] = [];
        for (const art of rawEp.artworks || []) {
          if (art.url && art.url.trim()) {
            epArtworkIds.push(registerArtwork(art.kind, art.url, epId));
          }
        }

        const epStreamIds: string[] = [];
        for (const st of rawEp.streams || []) {
          if (st.sourceItemId !== undefined && st.sourceItemId !== null) {
            epStreamIds.push(registerStream('episode', st.sourceItemId, st.containerExtension, st.qualityLabel));
          }
        }

        let epDuration: number | undefined;
        if (rawEp.durationSeconds !== undefined && rawEp.durationSeconds !== null) {
          const d = Number(rawEp.durationSeconds);
          if (!isNaN(d) && d > 0) {
            epDuration = d;
          }
        }

        episodesList.push({
          id: epId,
          seriesId,
          seasonId,
          episodeNumber: epNum,
          title: rawEp.title.trim(),
          ...(rawEp.overview ? { overview: rawEp.overview.trim() } : {}),
          ...(epDuration !== undefined ? { durationSeconds: epDuration } : {}),
          artworkIds: [...new Set(epArtworkIds)].sort(),
          streamIds: [...new Set(epStreamIds)].sort(),
          ...(rawEp.tmdbId || rawEp.imdbId
            ? {
                externalIds: {
                  ...(rawEp.tmdbId ? { tmdbId: rawEp.tmdbId } : {}),
                  ...(rawEp.imdbId ? { imdbId: rawEp.imdbId } : {}),
                },
              }
            : undefined),
        });
      }

      seasonsList.push({
        id: seasonId,
        seriesId,
        seasonNumber: sNum,
        ...(rawSeason.title ? { title: rawSeason.title.trim() } : {}),
        episodeIds: [...new Set(episodeIds)].sort(),
        ...(seasonArtworkIds.length > 0 ? { artworkIds: [...new Set(seasonArtworkIds)].sort() } : {}),
      });
    }

    seriesList.push({
      id: seriesId,
      title: rawSeries.title.trim(),
      ...(rawSeries.originalTitle ? { originalTitle: rawSeries.originalTitle.trim() } : {}),
      ...(parsedYear !== undefined ? { year: parsedYear } : {}),
      ...(rawSeries.overview ? { overview: rawSeries.overview.trim() } : {}),
      categoryIds: [...new Set(catIds)].sort(),
      genreIds: [...new Set(genIds)].sort(),
      artworkIds: [...new Set(seriesArtworkIds)].sort(),
      seasonIds: [...new Set(seasonIds)].sort(),
      ...(rawSeries.tmdbId || rawSeries.imdbId
        ? {
            externalIds: {
              ...(rawSeries.tmdbId ? { tmdbId: rawSeries.tmdbId } : {}),
              ...(rawSeries.imdbId ? { imdbId: rawSeries.imdbId } : {}),
              sourceItemId: cleanSeriesSourceId,
            },
          }
        : { externalIds: { sourceItemId: cleanSeriesSourceId } }),
    });
  }

  // 3. Montar Categorias e Gêneros Ordenados
  const categories: Category[] = Array.from(categoryMap.values())
    .map((c) => ({
      id: c.id,
      name: c.name,
      contentKinds: Array.from(c.contentKinds).sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const genres: Genre[] = Array.from(genreMap.values())
    .map((g) => ({
      id: g.id,
      name: g.name,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  // 4. Ordenação Determinística das Coleções
  movies.sort((a, b) => a.id.localeCompare(b.id));
  seriesList.sort((a, b) => a.id.localeCompare(b.id));
  seasonsList.sort((a, b) => a.id.localeCompare(b.id));
  episodesList.sort((a, b) => a.id.localeCompare(b.id));
  streams.sort((a, b) => a.id.localeCompare(b.id));
  artworks.sort((a, b) => a.id.localeCompare(b.id));

  // 5. Contagens
  const counts: SnapshotCounts = {
    movies: movies.length,
    series: seriesList.length,
    seasons: seasonsList.length,
    episodes: episodesList.length,
    categories: categories.length,
    genres: genres.length,
    streams: streams.length,
    artworks: artworks.length,
  };

  // 6. SnapshotId Determinístico
  // O snapshotId é gerado como o SHA-256 do conteúdo estável ordenado (sem timestamp)
  const deterministicContent = JSON.stringify({
    schemaVersion: 1,
    catalogVersion: options?.catalogVersion || '1.0.0',
    counts,
    categories,
    genres,
    movies,
    series: seriesList,
    seasons: seasonsList,
    episodes: episodesList,
    streams,
    artworks,
  });

  const snapshotId = `snap-${createHash('sha256').update(deterministicContent).digest('hex').substring(0, 16)}`;
  const generatedAt = options?.deterministicGeneratedAt || new Date().toISOString();

  const catalog: PrebuiltCatalog = {
    metadata: {
      schemaVersion: 1,
      catalogVersion: options?.catalogVersion || '1.0.0',
      snapshotId,
      generatedAt,
      counts,
      generator: 'xandeflix-prebuilt-ingestion/1.0',
    },
    categories,
    genres,
    movies,
    series: seriesList,
    seasons: seasonsList,
    episodes: episodesList,
    streams,
    artworks,
  };

  const duration = Date.now() - startTime;
  const metrics: IngestionMetrics = {
    sourceItemsTotal: raw.movies.length + raw.series.length,
    moviesNormalized: movies.length,
    seriesNormalized: seriesList.length,
    seasonsNormalized: seasonsList.length,
    episodesNormalized: episodesList.length,
    categoriesNormalized: categories.length,
    genresNormalized: genres.length,
    streamsNormalized: streams.length,
    artworksNormalized: artworks.length,
    pipelineDurationMs: duration,
  };

  return { catalog, metrics };
}
