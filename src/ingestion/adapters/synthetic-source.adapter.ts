/**
 * Xandeflix Prebuilt — Synthetic Source Adapter
 *
 * Adaptador de ingestão para fontes sintéticas e artificiais controladas.
 * Não utiliza credenciais reais nem acessa rede externa.
 */

import type { SourceAdapter, SourceValidationResult } from '../source-adapter.ts';
import type { RawSourceCatalog, RawMovie, RawSeries, RawSeason, RawEpisode } from '../types.ts';

export class SyntheticSourceAdapter implements SourceAdapter {
  readonly name = 'synthetic';

  load(input: unknown): RawSourceCatalog {
    let data: unknown = input;

    if (typeof input === 'string') {
      try {
        data = JSON.parse(input);
      } catch (err) {
        throw new Error(`Falha ao realizar parse JSON da fonte sintética: ${(err as Error).message}`);
      }
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Payload da fonte sintética inválido: esperado um objeto raiz.');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.sourceName !== 'string' || !obj.sourceName.trim()) {
      throw new Error("Fonte sintética inválida: campo 'sourceName' é obrigatório.");
    }

    if (!Array.isArray(obj.movies)) {
      throw new Error("Fonte sintética inválida: campo 'movies' deve ser um array.");
    }

    if (!Array.isArray(obj.series)) {
      throw new Error("Fonte sintética inválida: campo 'series' deve ser um array.");
    }

    return data as RawSourceCatalog;
  }

  validate(raw: RawSourceCatalog): SourceValidationResult {
    const errors: string[] = [];

    if (!raw.sourceName || typeof raw.sourceName !== 'string' || !raw.sourceName.trim()) {
      errors.push("Campo 'sourceName' é obrigatório e não pode ser vazio.");
    }

    // 1. Validação de Filmes Brutos
    const movieIds = new Set<string>();
    for (let i = 0; i < raw.movies.length; i++) {
      const m = raw.movies[i] as RawMovie;
      const indexStr = `movies[${i}]`;

      if (m.sourceItemId === undefined || m.sourceItemId === null || String(m.sourceItemId).trim() === '') {
        errors.push(`${indexStr}: 'sourceItemId' é obrigatório.`);
      } else {
        const idKey = String(m.sourceItemId);
        if (movieIds.has(idKey)) {
          errors.push(`${indexStr}: 'sourceItemId' duplicado em filmes: '${idKey}'.`);
        }
        movieIds.add(idKey);
      }

      if (!m.title || typeof m.title !== 'string' || !m.title.trim()) {
        errors.push(`${indexStr}: 'title' é obrigatório.`);
      }

      if (m.year !== undefined && m.year !== null) {
        const parsedYear = Number(m.year);
        if (isNaN(parsedYear) || parsedYear < 1880 || parsedYear > 2100) {
          errors.push(`${indexStr}: 'year' inválido: '${m.year}'.`);
        }
      }

      if (!Array.isArray(m.categories)) {
        errors.push(`${indexStr}: 'categories' deve ser um array de nomes.`);
      }

      if (!Array.isArray(m.genres)) {
        errors.push(`${indexStr}: 'genres' deve ser um array de nomes.`);
      }

      for (const art of m.artworks || []) {
        if (art.url && /:\/\/.*:.*@/.test(art.url)) {
          errors.push(`${indexStr}: Credencial embutida proibida detectada na URI da artwork: '${art.url}'.`);
        }
      }
    }

    // 2. Validação de Séries Brutas
    const seriesIds = new Set<string>();
    for (let i = 0; i < raw.series.length; i++) {
      const s = raw.series[i] as RawSeries;
      const seriesIndexStr = `series[${i}]`;

      if (s.sourceItemId === undefined || s.sourceItemId === null || String(s.sourceItemId).trim() === '') {
        errors.push(`${seriesIndexStr}: 'sourceItemId' é obrigatório.`);
      } else {
        const idKey = String(s.sourceItemId);
        if (seriesIds.has(idKey)) {
          errors.push(`${seriesIndexStr}: 'sourceItemId' duplicado em séries: '${idKey}'.`);
        }
        seriesIds.add(idKey);
      }

      if (!s.title || typeof s.title !== 'string' || !s.title.trim()) {
        errors.push(`${seriesIndexStr}: 'title' é obrigatório.`);
      }

      if (s.year !== undefined && s.year !== null) {
        const parsedYear = Number(s.year);
        if (isNaN(parsedYear) || parsedYear < 1880 || parsedYear > 2100) {
          errors.push(`${seriesIndexStr}: 'year' inválido: '${s.year}'.`);
        }
      }

      if (!Array.isArray(s.categories)) {
        errors.push(`${seriesIndexStr}: 'categories' deve ser um array de nomes.`);
      }

      if (!Array.isArray(s.genres)) {
        errors.push(`${seriesIndexStr}: 'genres' deve ser um array de nomes.`);
      }

      if (!Array.isArray(s.seasons)) {
        errors.push(`${seriesIndexStr}: 'seasons' deve ser um array.`);
      } else {
        const seasonNumbers = new Set<number>();
        for (let j = 0; j < s.seasons.length; j++) {
          const season = s.seasons[j] as RawSeason;
          const seasonIndexStr = `${seriesIndexStr}.seasons[${j}]`;

          const sNum = Number(season.seasonNumber);
          if (isNaN(sNum) || sNum < 0) {
            errors.push(`${seasonIndexStr}: 'seasonNumber' inválido: '${season.seasonNumber}'.`);
          } else {
            if (seasonNumbers.has(sNum)) {
              errors.push(`${seasonIndexStr}: 'seasonNumber' duplicado na série: '${sNum}'.`);
            }
            seasonNumbers.add(sNum);
          }

          if (!Array.isArray(season.episodes)) {
            errors.push(`${seasonIndexStr}: 'episodes' deve ser um array.`);
          } else {
            const epNumbers = new Set<number>();
            for (let k = 0; k < season.episodes.length; k++) {
              const ep = season.episodes[k] as RawEpisode;
              const epIndexStr = `${seasonIndexStr}.episodes[${k}]`;

              const epNum = Number(ep.episodeNumber);
              if (isNaN(epNum) || epNum < 0) {
                errors.push(`${epIndexStr}: 'episodeNumber' inválido: '${ep.episodeNumber}'.`);
              } else {
                if (epNumbers.has(epNum)) {
                  errors.push(`${epIndexStr}: 'episodeNumber' duplicado na temporada: '${epNum}'.`);
                }
                epNumbers.add(epNum);
              }

              if (!ep.title || typeof ep.title !== 'string' || !ep.title.trim()) {
                errors.push(`${epIndexStr}: 'title' é obrigatório.`);
              }

              for (const art of ep.artworks || []) {
                if (art.url && /:\/\/.*:.*@/.test(art.url)) {
                  errors.push(`${epIndexStr}: Credencial embutida proibida detectada na URI da artwork.`);
                }
              }
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
