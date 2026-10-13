/**
 * Xandeflix Prebuilt — AsyncCategoryRail Component (Cycle C11)
 *
 * Faixa temática horizontal de itens carregados sob demanda a partir do catálogo segmentado.
 *
 * Princípios:
 * - BOUNDED MEMORY: Lê apenas a cota estrita de itens para a faixa (maxItems = 20) com early-exit.
 * - INSTANT FIRST-FOLD: Se já houver itens no readModel, renderiza imediatamente.
 * - NON-BLOCKING IO: Utiliza fila de concorrência controlada para evitar sobrecarga no armazenamento.
 * - FOCUS SAFETY: Renderiza MediaRail com classes .focusable-item apenas quando os itens estão disponíveis.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import type { SegmentedBrowseService, BrowseKind } from '../../catalog/segmented-browse.service.ts';
import type { Movie, Series } from '../../contracts/catalog.ts';
import { MediaRail } from './MediaRail.tsx';
import { observeArtwork } from '../../artwork/artwork-visibility.ts';
import { isReleaseCategory } from '../../catalog/category-presentation.ts';
import type { CategoryPreviewIndex } from '../../catalog/category-preview-index.ts';

export interface RailLoadQueue {
  add<T>(fn: () => Promise<T>, priority?: boolean): Promise<T>;
}

export class SimpleRailQueue implements RailLoadQueue {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly maxConcurrency = 2) {}

  add<T>(fn: () => Promise<T>, priority = false): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.running++;
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.running--;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            next?.();
          }
        }
      };

      if (this.running < this.maxConcurrency) {
        void execute();
      } else {
        if (priority) this.queue.unshift(() => void execute());
        else this.queue.push(() => void execute());
      }
    });
  }
}

interface AsyncCategoryRailProps {
  id: string;
  title: string;
  kind: BrowseKind;
  categoryId: string;
  initialItems?: CatalogItemViewModel[];
  readModel: CatalogReadModel;
  browseService: SegmentedBrowseService;
  queue?: RailLoadQueue;
  onItemClick: (item: CatalogItemViewModel) => void;
  maxItems?: number;
  onViewAll?: () => void;
  onViewAllFocus?: () => void;
  loadWhenVisible?: boolean;
  previewIndex?: CategoryPreviewIndex;
  startupArtworkCount?: number;
}

export const AsyncCategoryRail = React.memo<AsyncCategoryRailProps>(function AsyncCategoryRail({
  id,
  title,
  kind,
  categoryId,
  initialItems,
  readModel,
  browseService,
  queue,
  onItemClick,
  maxItems = 20,
  onViewAll,
  onViewAllFocus,
  loadWhenVisible = false,
  previewIndex,
  startupArtworkCount = 0,
}) {
  const latestSourceFirst = kind === 'movies' && isReleaseCategory(title);
  const pendingRoot = useRef<HTMLElement | null>(null);
  const [nearViewport, setNearViewport] = useState(() => !loadWhenVisible || Boolean(initialItems?.length));
  const [onscreen, setOnscreen] = useState(false);
  const hasSufficientInitial = Boolean(
    !latestSourceFirst && initialItems &&
    initialItems.length >= 10 &&
    initialItems.some((item) => Boolean(item.posterUri))
  );
  const [items, setItems] = useState<CatalogItemViewModel[]>(() => latestSourceFirst ? [] : initialItems || []);
  const [loaded, setLoaded] = useState<boolean>(hasSufficientInitial);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!loadWhenVisible) return;
    const root = pendingRoot.current;
    if (!root) return;
    return observeArtwork(root, state => { setNearViewport(state.near || state.visible); setOnscreen(state.visible); });
  }, [loadWhenVisible, loaded]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!latestSourceFirst && initialItems && initialItems.length > 0 && initialItems.some((item) => Boolean(item.posterUri))) {
      setItems(initialItems);
      setLoaded(true);
    }
  }, [initialItems, latestSourceFirst]);

  useEffect(() => {
    if (hasSufficientInitial || (loadWhenVisible && !nearViewport && !startupArtworkCount)) {
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        const fetcher = async (): Promise<CatalogItemViewModel[]> => {
          if (controller.signal.aborted) return [];
          if (previewIndex) {
            try { return await previewIndex.load(kind, categoryId, controller.signal); }
            catch { if (controller.signal.aborted) return []; }
          }
          const records = await (loadWhenVisible
            ? (await browseService.loadPage<Movie | Series>(kind, { segment: 0, offset: 0 }, maxItems, categoryId,
                { count: false, signal: controller.signal, order: latestSourceFirst ? 'source-desc' : 'source' })).items
            : browseService.loadRailItems<Movie | Series>(kind, categoryId, maxItems, latestSourceFirst ? 'source-desc' : 'source'));
          return records.map((record) => {
            const vm =
              kind === 'movies'
                ? movieToViewModel(readModel, record as Movie)
                : seriesToViewModel(readModel, record as Series);

            const resolvedPoster =
              (record as any).posterUri ||
              (record as any).posterUrl ||
              (record as any).logo ||
              (record as any).cover ||
              (record as any).poster ||
              (record as any).stream_icon ||
              vm.posterUri;

            return {
              ...vm,
              posterUri: resolvedPoster,
            };
          });
        };
        const viewModels = queue ? await queue.add(fetcher, onscreen) : await fetcher();
        if (isCancelled || !mountedRef.current) return;
        if (viewModels.length > 0) {
          setItems(viewModels.slice(0, maxItems));
        } else if (!initialItems || initialItems.length === 0) {
          setItems([]);
        }
      } catch {
        // Falha pontual na leitura não quebra a interface da Home
      } finally {
        if (!isCancelled && mountedRef.current) {
          setLoaded(true);
        }
      }
    };

    void fetchItems();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [browseService, categoryId, hasSufficientInitial, initialItems, kind, maxItems, queue, readModel, loadWhenVisible, nearViewport, onscreen, previewIndex, startupArtworkCount, latestSourceFirst]);

  // Se já finalizou a busca e não há itens, não ocupa espaço na Home
  if (loaded && items.length === 0) {
    return null;
  }

  // Enquanto carrega sem nenhum item prévio, exibe cabeçalho transitório discreto
  if (!loaded && items.length === 0) {
    return (
      <section ref={pendingRoot} className="media-rail media-rail-skeleton" id={id} aria-labelledby={`rail-title-${id}`} data-startup-rail={startupArtworkCount > 0 || undefined}>
        <div className="media-rail-header">
          <h2 id={`rail-title-${id}`} className="media-rail-title" style={{ opacity: 0.5 }}>
            {title}
          </h2>
          {onViewAll && <div className="media-rail-controls"><button type="button" className="focusable-item rail-view-all"
            onClick={onViewAll} onFocus={onViewAllFocus} onMouseEnter={onViewAllFocus} onTouchStart={onViewAllFocus}
            aria-label={`Ver todos: ${title}`}>Ver todos</button></div>}
        </div>
        <div className="media-rail-track" style={{ opacity: 0.15, pointerEvents: 'none' }}>
          {[0, 1, 2].map(index => <div key={index} className="media-card" aria-hidden="true">
            <div className="media-card-poster-wrapper artwork-placeholder"/>
            <div className="media-card-info"><h3 className="media-card-title">&nbsp;</h3></div>
          </div>)}
        </div>
      </section>
    );
  }

  return (
    <MediaRail
      id={id}
      title={title}
      items={items}
      onItemClick={onItemClick}
      onViewAll={onViewAll}
      onViewAllFocus={onViewAllFocus}
      startupArtworkCount={startupArtworkCount}
    />
  );
});
