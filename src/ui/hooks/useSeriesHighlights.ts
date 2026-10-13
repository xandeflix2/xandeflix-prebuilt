import { useContext, useSyncExternalStore } from 'react';
import { NewContentContext } from '../components/NewContentProvider.tsx';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';

const empty: CatalogItemViewModel[] = [];
const serverSnapshot = () => empty;
export function useSeriesHighlights(): CatalogItemViewModel[] {
  const store = useContext(NewContentContext);
  return useSyncExternalStore(store.subscribe, store.getSeriesHighlights, serverSnapshot);
}
