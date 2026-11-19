import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { LocalCatalogStorage } from '../../bootstrap/storage/storage.interface.ts';
import { dailyTrendingHeroService } from '../../catalog/daily-trending-hero.service.ts';
import { initialHomeHeroItems, type HomeHeroOption } from '../../catalog/home-hero.service.ts';

const displayed = (_option: HomeHeroOption): void => {};
const hourNow = () => Math.floor(Date.now() / 3600000);
const EMPTY_OPTIONS: HomeHeroOption[] = [];

export function useHomeHero(readModel: CatalogReadModel, storage: LocalCatalogStorage, contentKind?: 'movie' | 'series') {
  const [hour, setHour] = useState(hourNow);
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(0);
  const fallback = useMemo(() => initialHomeHeroItems(readModel, 2026, 25)
    .filter(item => !contentKind || item.kind === contentKind)
    .map((item): HomeHeroOption => ({ key: `source:${readModel.catalog.metadata.snapshotId}:${item.kind}:${item.id}`, item, fresh: false })),
  [readModel, contentKind]);
  const [state, setState] = useState<{
    model: CatalogReadModel;
    storage: LocalCatalogStorage;
    hour: number;
    retry: number;
    kind?: 'movie' | 'series';
    options: HomeHeroOption[];
    loading: boolean;
  }>();

  useEffect(() => {
    const timer = setInterval(() => setHour(hourNow()), 60000);
    const online = () => setRetry(value => value + 1);
    window.addEventListener('online', online);
    return () => { clearInterval(timer); window.removeEventListener('online', online); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setPage(0);
    setState({ model: readModel, storage, hour, retry, kind: contentKind, options: [], loading: true });
    void dailyTrendingHeroService.availableByPriority(readModel, storage, contentKind ?? 'all', controller.signal)
      .then(options => { if (!controller.signal.aborted) setState({ model: readModel, storage, hour, retry, kind: contentKind, options, loading: false }); })
      .catch(() => { if (!controller.signal.aborted) setState({ model: readModel, storage, hour, retry, kind: contentKind, options: [], loading: false }); });
    return () => controller.abort();
  }, [readModel, storage, hour, retry, contentKind]);

  const current = state?.model === readModel && state.storage === storage && state.hour === hour
    && state.retry === retry && state.kind === contentKind ? state : undefined;
  const options = current?.options.length ? current.options : fallback.length ? fallback : EMPTY_OPTIONS;
  const candidates = useMemo(() => {
    const counts = { movie: 0, series: 0 };
    return options.filter(option => {
      const kind = option.item.kind;
      const index = counts[kind]++;
      return index >= page * 5 && index < (page + 1) * 5;
    });
  }, [options, page]);
  const nextBatch = useCallback(async () => {
    if (!current || current.loading) return false;
    const counts = { movie: 0, series: 0 };
    for (const option of options) counts[option.item.kind]++;
    if (Math.max(counts.movie, counts.series) > (page + 1) * 5) { setPage(page + 1); return true; }
    if (page > 0) { setPage(0); return true; }
    return false;
  }, [current, options, page]);
  return { options: candidates, candidates, nextBatch, displayed, selectionPending: !options.length && (!current || current.loading) };
}
