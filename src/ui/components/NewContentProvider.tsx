import React, { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { IndexedDbNewContentRepository, NewContentDisplayStore, newContentKey, scanNewContent } from '../../catalog/new-content-badge.ts';
import { loadRecentSeries } from '../../catalog/series-content-updates.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';

const emptyStore = new NewContentDisplayStore();
export const NewContentContext = createContext(emptyStore);
const notNew = () => false;
const noBadge = () => undefined;

export function useNewContentBadge(kind: 'movie' | 'series', title: string): boolean {
  const store = useContext(NewContentContext);
  const key = useMemo(() => newContentKey(kind, title), [kind, title]);
  const getSnapshot = useCallback(() => store.has(key), [store, key]);
  return useSyncExternalStore(store.subscribe, getSnapshot, notNew);
}

export function useContentBadge(kind: 'movie' | 'series', title: string) {
  const store = useContext(NewContentContext);
  const key = useMemo(() => newContentKey(kind, title), [kind, title]);
  const getSnapshot = useCallback(() => store.badge(key), [store, key]);
  return useSyncExternalStore(store.subscribe, getSnapshot, noBadge);
}

export function NewContentProvider({ model, children }: { model: CatalogReadModel | null; children: React.ReactNode }): React.JSX.Element {
  const store = useMemo(() => new NewContentDisplayStore(() => typeof document === 'undefined' ||
    !document.activeElement?.closest('.media-rail, .catalog-grid')), []);
  const repository = useMemo(() => new IndexedDbNewContentRepository(), []);
  useEffect(() => {
    store.publish(null);
    if (!model || typeof indexedDB === 'undefined') return;
    const controller = new AbortController();
    let pendingHighlights: CatalogItemViewModel[] | undefined;
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    const applyHighlights = () => {
      if (controller.signal.aborted || !pendingHighlights) return;
      // Do not replace a focused card with a different series while using D-pad.
      if (document.activeElement?.closest('.media-rail, .catalog-grid')) return;
      store.setSeriesHighlights(model.catalog.metadata.snapshotId, pendingHighlights);
      pendingHighlights = undefined;
    };
    const focusChanged = () => {
      clearTimeout(focusTimer);
      focusTimer = setTimeout(() => { store.expire(); applyHighlights(); }, 0);
    };
    document.addEventListener('focusin', focusChanged);
    document.addEventListener('focusout', focusChanged);
    const update = (inventory: Parameters<NewContentDisplayStore['publish']>[0]) => {
      if (!controller.signal.aborted) store.publish(inventory);
    };
    // Optional presentation work starts after the shell; never gates boot or images.
    const start = setTimeout(() => {
      void scanNewContent(model, getClientBootstrapService().getStorage(), repository, controller.signal, update)
        .then(async inventory => {
          update(inventory);
          if (controller.signal.aborted) return;
          const items = await loadRecentSeries(model, getClientBootstrapService().getStorage(), inventory, controller.signal);
          pendingHighlights = items;
          applyHighlights();
        }).catch(() => { /* Preserve previous valid display; no partial promotion. */ });
    }, 1000);
    return () => {
      clearTimeout(start); clearTimeout(focusTimer); controller.abort();
      document.removeEventListener('focusin', focusChanged);
      document.removeEventListener('focusout', focusChanged);
    };
  }, [model, repository, store]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      const next = store.nextExpiry();
      if (next !== undefined) timer = setTimeout(() => {
        store.expire(); schedule();
      }, Math.max(1, Math.min(60000, next - Date.now())));
    };
    const refresh = () => { store.expire(); schedule(); };
    const unsubscribe = store.subscribe(schedule);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    schedule();
    return () => { clearTimeout(timer); unsubscribe(); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); };
  }, [store]);
  return <NewContentContext.Provider value={store}>{children}</NewContentContext.Provider>;
}
