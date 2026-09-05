/**
 * Xandeflix Prebuilt — Catalog Delta Applier (Gate G9)
 *
 * Aplica um CatalogDelta sobre um catálogo base válido para produzir o catálogo target final.
 *
 * Princípios:
 * - IN_PLACE_ACTIVE_PATCH = PROHIBITED (opera puramente em memória)
 * - DELTA_UPSERT_SEMANTICS = FULL_ENTITY_REPLACEMENT
 * - CATALOG_DELTA_ADDRESSING = CANONICAL_ID_BASED
 * - DELTA_APPLICATION_DETERMINISTIC = REQUIRED
 */

import type { PrebuiltCatalog } from '../contracts/catalog.ts';
import type { CatalogDelta, CollectionDelta } from './catalog-delta.types.ts';

function applyCollectionDelta<T extends { id: string }>(
  baseItems: T[] | undefined,
  delta: CollectionDelta<T>
): T[] {
  const map = new Map<string, T>();
  for (const item of baseItems || []) {
    map.set(item.id, item);
  }

  for (const removeId of delta.removeIds || []) {
    map.delete(removeId);
  }

  for (const upsertItem of delta.upsert || []) {
    map.set(upsertItem.id, upsertItem);
  }

  return Array.from(map.values()).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export class CatalogDeltaApplier {
  apply(baseCatalog: PrebuiltCatalog, delta: CatalogDelta): PrebuiltCatalog {
    // 1. Verificação estrita de binding base
    if (baseCatalog.metadata.snapshotId !== delta.baseSnapshotId) {
      throw new Error(
        `[BASE_SNAPSHOT_MISMATCH] Snapshot base ativo '${baseCatalog.metadata.snapshotId}' diverge da base declarada no delta '${delta.baseSnapshotId}'`
      );
    }
    if (baseCatalog.metadata.catalogVersion !== delta.baseCatalogVersion) {
      throw new Error(
        `[BASE_CATALOG_VERSION_MISMATCH] Versão base ativa '${baseCatalog.metadata.catalogVersion}' diverge da versão base do delta '${delta.baseCatalogVersion}'`
      );
    }

    // 2. Aplicação determinística em cada coleção
    const categories = applyCollectionDelta(baseCatalog.categories, delta.categories);
    const genres = applyCollectionDelta(baseCatalog.genres, delta.genres);
    const movies = applyCollectionDelta(baseCatalog.movies, delta.movies);
    const series = applyCollectionDelta(baseCatalog.series, delta.series);
    const seasons = applyCollectionDelta(baseCatalog.seasons, delta.seasons);
    const episodes = applyCollectionDelta(baseCatalog.episodes, delta.episodes);
    const streams = applyCollectionDelta(baseCatalog.streams, delta.streams);
    const artworks = applyCollectionDelta(baseCatalog.artworks, delta.artworks);

    // 3. Verificação de contagens declaradas no targetMetadata
    const expectedCounts = delta.targetMetadata.counts;
    if (
      expectedCounts.movies !== movies.length ||
      expectedCounts.series !== series.length ||
      expectedCounts.seasons !== seasons.length ||
      expectedCounts.episodes !== episodes.length ||
      expectedCounts.categories !== categories.length ||
      expectedCounts.genres !== genres.length ||
      expectedCounts.streams !== streams.length ||
      expectedCounts.artworks !== artworks.length
    ) {
      throw new Error(
        `[TARGET_COUNT_MISMATCH_REJECTED] Contagens declaradas em targetMetadata não coincidem com o resultado: ` +
        `movies=${movies.length}/${expectedCounts.movies}, series=${series.length}/${expectedCounts.series}, ` +
        `seasons=${seasons.length}/${expectedCounts.seasons}, episodes=${episodes.length}/${expectedCounts.episodes}`
      );
    }

    // 4. Montagem do catálogo target final
    const targetCatalog: PrebuiltCatalog = {
      metadata: delta.targetMetadata,
      categories,
      genres,
      movies,
      series,
      seasons,
      episodes,
      streams,
      artworks,
    };

    return targetCatalog;
  }
}
