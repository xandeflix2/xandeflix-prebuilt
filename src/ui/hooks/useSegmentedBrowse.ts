import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Movie, Series } from '../../contracts/catalog.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { BROWSE_PAGE_SIZE, SegmentedBrowseService, type BrowseKind, type BrowsePage, type BrowseOrder } from '../../catalog/segmented-browse.service.ts';

type RecordForKind<K extends BrowseKind> = K extends 'movies' ? Movie : Series;
export function useSegmentedBrowse<K extends BrowseKind>(kind: K, categoryId?: string, snapshotId?: string, initialItems: RecordForKind<K>[] = [], order: BrowseOrder = 'source') {
  const service = useMemo(() => new SegmentedBrowseService(getClientBootstrapService().getStorage(), snapshotId), [snapshotId]);
  const selection = `${snapshotId || ''}:${kind}:${categoryId || 'all'}:${order}`;
  const [state, setState] = useState<{ selection: string; page: BrowsePage<RecordForKind<K>>; loading: boolean; failed?: boolean }>();
  const requestId = useRef(0), fetching = useRef(false);
  const disposal = useRef<{ service: SegmentedBrowseService; timer: ReturnType<typeof setTimeout> }>();
  const current = state?.selection === selection ? state : undefined;
  const cached = service.cachedPage<RecordForKind<K>>(kind, categoryId, order);
  const items = current?.page.items || cached?.items || initialItems;
  const totalAvailable = current?.page.totalAvailable ?? cached?.totalAvailable ?? items.length;
  const totalIsExact = current?.page.totalIsExact ?? cached?.totalIsExact ?? false;
  const loading = current?.loading ?? !cached;
  useEffect(() => {
    if (disposal.current?.service === service) clearTimeout(disposal.current.timer);
    return () => { disposal.current = { service, timer: setTimeout(() => service.dispose(), 0) }; };
  }, [service]);
  useEffect(() => {
    const id = ++requestId.current, controller = new AbortController(); fetching.current = false;
    if (cached) setState({ selection, page: cached, loading: false });
    void (async () => {
      try {
        const page = await service.loadPage<RecordForKind<K>>(kind, { segment: 0, offset: 0 }, BROWSE_PAGE_SIZE, categoryId, { count: false, signal: controller.signal, order });
        if (id !== requestId.current || controller.signal.aborted) return;
        setState({ selection, page, loading: false });
        const total = await service.countItems(kind, categoryId, controller.signal);
        if (id === requestId.current && !controller.signal.aborted) setState(current => current?.selection === selection ? { ...current, page: { ...current.page, totalAvailable: total, totalIsExact: true } } : current);
      } catch {
        if (id === requestId.current && !controller.signal.aborted) setState(current => current?.selection === selection ? { ...current, loading: false, failed: true }
          : { selection, page: { items: initialItems, totalAvailable: initialItems.length, nextCursor: null, totalIsExact: false }, loading: false, failed: true });
      }
    })();
    return () => { controller.abort(); requestId.current++; };
  }, [service, kind, categoryId, selection, order]);
  const loadNext = useCallback(async () => {
    if (!current?.page.nextCursor || loading || fetching.current) return;
    const id = requestId.current; fetching.current = true;
    setState(current => current?.selection === selection ? { ...current, loading: true, failed: false } : current);
    try {
      const page = await service.loadPage<RecordForKind<K>>(kind, current.page.nextCursor, BROWSE_PAGE_SIZE, categoryId, { count: false, order });
      if (id !== requestId.current) return;
      setState(current => current?.selection === selection ? { ...current, loading: false, page: { ...page,
        items: [...current.page.items, ...page.items.filter(item => !current.page.items.some(known => known.id === item.id))],
        totalAvailable: current.page.totalIsExact ? current.page.totalAvailable : page.totalAvailable,
        totalIsExact: current.page.totalIsExact || page.totalIsExact,
      } } : current);
    } catch { if (id === requestId.current) setState(current => current?.selection === selection ? { ...current, loading: false, failed: true } : current); }
    finally { if (id === requestId.current) fetching.current = false; }
  }, [current, loading, kind, categoryId, service, selection, order]);
  const prefetchCategory = useCallback(async (category?: string, requestedOrder: BrowseOrder = 'source') => {
    const cached = service.cachedPage<RecordForKind<K>>(kind, category, requestedOrder);
    if (cached) return cached.items;
    return (await service.loadPage<RecordForKind<K>>(kind, { segment: 0, offset: 0 }, BROWSE_PAGE_SIZE, category, { count: false, order: requestedOrder })).items;
  }, [kind, service]);
  const hasMore = current ? current.page.nextCursor !== null : cached ? cached.nextCursor !== null : loading;
  return { items, totalAvailable, totalIsExact, loadedCount: items.length, hasMore, loading, failed: current?.failed, loadNext, prefetchCategory };
}
