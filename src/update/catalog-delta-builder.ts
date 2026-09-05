/**
 * Xandeflix Prebuilt — Catalog Delta Builder (Gate G9)
 *
 * Gera o CatalogDelta canônico e determinístico externamente a partir de dois catálogos válidos.
 *
 * Princípios:
 * - DELTA_GENERATION = EXTERNAL_PREBUILT
 * - CATALOG_DELTA_ADDRESSING = CANONICAL_ID_BASED
 * - DELTA_UPSERT_SEMANTICS = FULL_ENTITY_REPLACEMENT
 * - DELTA_APPLICATION_DETERMINISTIC = REQUIRED
 */

import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import type { CatalogDelta, CollectionDelta } from './catalog-delta.types.ts';

function diffCollection<T extends { id: string }>(
  baseItems: T[] | undefined,
  targetItems: T[] | undefined
): CollectionDelta<T> {
  const baseMap = new Map<string, T>();
  for (const item of baseItems || []) {
    baseMap.set(item.id, item);
  }

  const targetMap = new Map<string, T>();
  for (const item of targetItems || []) {
    targetMap.set(item.id, item);
  }

  const upsert: T[] = [];
  const removeIds: string[] = [];

  // Itens em target: novos ou alterados
  for (const [id, targetItem] of targetMap.entries()) {
    const baseItem = baseMap.get(id);
    if (!baseItem) {
      upsert.push(targetItem);
    } else {
      if (JSON.stringify(baseItem) !== JSON.stringify(targetItem)) {
        upsert.push(targetItem);
      }
    }
  }

  // Itens em base ausentes em target: removidos
  for (const id of baseMap.keys()) {
    if (!targetMap.has(id)) {
      removeIds.push(id);
    }
  }

  // Ordenação determinística por ID
  upsert.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  removeIds.sort();

  return { upsert, removeIds };
}

export class CatalogDeltaBuilder {
  /**
   * Verifica se há diferenças substanciais entre o catálogo base e o target.
   */
  hasChanges(baseCatalog: PrebuiltCatalog, targetCatalog: PrebuiltCatalog): boolean {
    const collections = [
      diffCollection(baseCatalog.categories, targetCatalog.categories),
      diffCollection(baseCatalog.genres, targetCatalog.genres),
      diffCollection(baseCatalog.movies, targetCatalog.movies),
      diffCollection(baseCatalog.series, targetCatalog.series),
      diffCollection(baseCatalog.seasons, targetCatalog.seasons),
      diffCollection(baseCatalog.episodes, targetCatalog.episodes),
      diffCollection(baseCatalog.streams, targetCatalog.streams),
      diffCollection(baseCatalog.artworks, targetCatalog.artworks),
    ];

    for (const c of collections) {
      if (c.upsert.length > 0 || c.removeIds.length > 0) {
        return true;
      }
    }

    // Compara versão ou snapshot ID
    if (
      baseCatalog.metadata.catalogVersion !== targetCatalog.metadata.catalogVersion ||
      baseCatalog.metadata.snapshotId !== targetCatalog.metadata.snapshotId
    ) {
      return true;
    }

    return false;
  }

  /**
   * Constrói o objeto CatalogDelta determinístico.
   */
  build(baseCatalog: PrebuiltCatalog, targetCatalog: PrebuiltCatalog): CatalogDelta {
    const categories = diffCollection(baseCatalog.categories, targetCatalog.categories);
    const genres = diffCollection(baseCatalog.genres, targetCatalog.genres);
    const movies = diffCollection(baseCatalog.movies, targetCatalog.movies);
    const series = diffCollection(baseCatalog.series, targetCatalog.series);
    const seasons = diffCollection(baseCatalog.seasons, targetCatalog.seasons);
    const episodes = diffCollection(baseCatalog.episodes, targetCatalog.episodes);
    const streams = diffCollection(baseCatalog.streams, targetCatalog.streams);
    const artworks = diffCollection(baseCatalog.artworks, targetCatalog.artworks);

    return {
      deltaVersion: 1,
      baseSnapshotId: baseCatalog.metadata.snapshotId,
      targetSnapshotId: targetCatalog.metadata.snapshotId,
      baseCatalogVersion: baseCatalog.metadata.catalogVersion,
      targetCatalogVersion: targetCatalog.metadata.catalogVersion,
      targetMetadata: targetCatalog.metadata,
      categories,
      genres,
      movies,
      series,
      seasons,
      episodes,
      streams,
      artworks,
    };
  }
}
