import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { LocalCatalogStorage } from '../../bootstrap/storage/storage.interface.ts';
import { createHomeHeroService, initialHomeHeroItems, completeHomeHeroOptions, type HomeHeroOption } from '../../catalog/home-hero.service.ts';
import { useSeriesHighlights } from './useSeriesHighlights.ts';

export function useHomeHero(readModel: CatalogReadModel, storage: LocalCatalogStorage, contentKind?: 'movie' | 'series') {
  const recentSeries = useSeriesHighlights();
  const [year, setYear] = useState(() => new Date().getFullYear());
  useEffect(() => { const timer = setInterval(() => setYear(new Date().getFullYear()), 60000); return () => clearInterval(timer); }, []);
  const snapshotId = readModel.catalog.metadata.snapshotId;
  const service = useMemo(() => createHomeHeroService(), [snapshotId, year]);
  const fallback = useMemo(() => initialHomeHeroItems(readModel, year).filter(item => !contentKind || item.kind === contentKind)
    .map((item): HomeHeroOption => ({ key: `${item.kind}:${item.id}`, item, fresh: false })), [readModel, year, contentKind]);
  const [state, setState] = useState<{ snapshotId: string; year: number; contentKind?: 'movie' | 'series'; options: HomeHeroOption[]; ready: boolean }>({ snapshotId: '', year, options: [], ready: false });
  const controller = useRef<AbortController>();
  const pending = useRef(false);
  useEffect(() => {
    const scan = new AbortController(); controller.current = scan; pending.current = false;
    void (async () => {
      try {
        await service.prepare(readModel, storage, year, scan.signal);
        const options = await service.options(year, undefined, contentKind);
        if (!scan.signal.aborted) setState({ snapshotId, year, contentKind, options, ready: true });
      } catch { /* Optional presentation never blocks the catalog or boot. */ }
    })();
    return () => scan.abort();
  }, [readModel, storage, service, snapshotId, year, contentKind]);
  const current = state.snapshotId === snapshotId && state.year === year && state.contentKind === contentKind ? state : undefined;
  const options = useMemo(() => {
    const normal = completeHomeHeroOptions(current?.ready ? current.options : [], fallback);
    const priority = (contentKind === 'movie' ? [] : recentSeries).slice(0, 20).map((item): HomeHeroOption => ({ key: `series-update:${item.id}`, item, fresh: true }));
    const seen = new Set(priority.map(option => `${option.item.kind}:${option.item.id}`));
    return [...priority, ...normal.filter(option => !seen.has(`${option.item.kind}:${option.item.id}`))];
  }, [current?.ready, current?.options, fallback, recentSeries, contentKind]);
  const candidates = useMemo(()=>{
    const extra=initialHomeHeroItems(readModel,year,25).filter(item=>!contentKind || item.kind===contentKind),seen=new Set(options.map(option=>`${option.item.kind}:${option.item.id}`));
    return [...options,...extra.filter(item=>!seen.has(`${item.kind}:${item.id}`)).map(item=>({key:`${item.kind}:${item.id}`,item,fresh:false}))].slice(0,70);
  },[options,readModel,year,contentKind]);
  const nextBatch = useCallback(async () => {
    const scan = controller.current;
    if (!current?.ready || !scan || scan.signal.aborted || pending.current) return false;
    pending.current = true;
    try {
      const batch = await service.options(year, new Set(options.map((option) => option.key)), contentKind);
      if (scan.signal.aborted || !batch.length) return false;
      setState({ snapshotId, year, contentKind, options: batch, ready: true }); return true;
    } catch { return false; } finally { if (controller.current === scan) pending.current = false; }
  }, [current?.ready, options, service, snapshotId, year, contentKind]);
  const displayed = useCallback((option: HomeHeroOption) => {
    if (current?.ready && current.options.some((entry) => entry.key === option.key)) void service.displayed(option).catch(() => {});
  }, [current?.ready, current?.options, service]);
  return { options, candidates, nextBatch, displayed };
}
