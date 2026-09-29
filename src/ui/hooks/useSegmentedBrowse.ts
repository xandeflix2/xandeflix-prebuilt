import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Movie, Series } from '../../contracts/catalog.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { BROWSE_PAGE_SIZE, SegmentedBrowseService, type BrowseCursor, type BrowseKind } from '../../catalog/segmented-browse.service.ts';

type RecordForKind<K extends BrowseKind> = K extends 'movies' ? Movie : Series;
export function useSegmentedBrowse<K extends BrowseKind>(kind: K, categoryId?: string) {
  const service = useMemo(() => new SegmentedBrowseService(getClientBootstrapService().getStorage()), []);
  const [items, setItems] = useState<RecordForKind<K>[]>([]);
  const [cursor, setCursor] = useState<BrowseCursor | null>(null);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const fetchPage = useCallback(async (nextCursor: BrowseCursor, replace: boolean) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const page = await service.loadPage<RecordForKind<K>>(kind, nextCursor, BROWSE_PAGE_SIZE, categoryId);
      if (id !== requestId.current) return;
      setItems((current) => replace ? page.items : [...current, ...page.items.filter((item) => !current.some((known) => known.id === item.id))]);
      setCursor(page.nextCursor);
      setTotalAvailable(page.totalAvailable);
    } finally { if (id === requestId.current) setLoading(false); }
  }, [categoryId, kind, service]);

  useEffect(() => { void fetchPage({ segment: 0, offset: 0 }, true); }, [fetchPage]);
  const loadNext = useCallback(() => { if (cursor && !loading) return fetchPage(cursor, false); }, [cursor, fetchPage, loading]);
  return { items, totalAvailable, loadedCount: items.length, hasMore: cursor !== null, loading, loadNext };
}
