import { useEffect, useMemo } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { LocalCatalogStorage } from '../../bootstrap/storage/storage.interface.ts';
import type { BrowseKind } from '../../catalog/segmented-browse.service.ts';
import { categoryPreviewIndex } from '../../catalog/category-preview-index.ts';

export function useCategoryPreviews(model: CatalogReadModel, storage: LocalCatalogStorage, kind?: BrowseKind) {
  const index = useMemo(() => categoryPreviewIndex(model, storage), [model, storage]);
  useEffect(() => { for (const type of kind ? [kind] : ['movies', 'series'] as const) void index.prepare(type).catch(() => {}); }, [index, kind]);
  return index;
}
