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

export interface RailLoadQueue {
  add<T>(fn: () => Promise<T>): Promise<T>;
}

export class SimpleRailQueue implements RailLoadQueue {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly maxConcurrency = 2) {}

  add<T>(fn: () => Promise<T>): Promise<T> {
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
        this.queue.push(() => void execute());
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
}) {
  const hasSufficientInitial = Boolean(
    initialItems &&
    initialItems.length >= 10 &&
    initialItems.some((item) => Boolean(item.posterUri))
  );
  const [items, setItems] = useState<CatalogItemViewModel[]>(() => initialItems || []);
  const [loaded, setLoaded] = useState<boolean>(hasSufficientInitial);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (initialItems && initialItems.length > 0 && initialItems.some((item) => Boolean(item.posterUri))) {
      setItems(initialItems);
      setLoaded(true);
    }
  }, [initialItems]);

  useEffect(() => {
    if (hasSufficientInitial) {
      return;
    }

    let isCancelled = false;

    const fetchItems = async () => {
      try {
        const fetcher = () => browseService.loadRailItems<Movie | Series>(kind, categoryId, maxItems);
        const records = queue ? await queue.add(fetcher) : await fetcher();

        if (isCancelled || !mountedRef.current) return;

        if (records && records.length > 0) {
          const viewModels: CatalogItemViewModel[] = records.map((record) => {
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
          setItems(viewModels);
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
    };
  }, [browseService, categoryId, hasSufficientInitial, initialItems, kind, maxItems, queue, readModel]);

  // Se já finalizou a busca e não há itens, não ocupa espaço na Home
  if (loaded && items.length === 0) {
    return null;
  }

  // Enquanto carrega sem nenhum item prévio, exibe cabeçalho transitório discreto
  if (!loaded && items.length === 0) {
    return (
      <section className="media-rail media-rail-skeleton" id={id} aria-labelledby={`rail-title-${id}`}>
        <div className="media-rail-header">
          <h2 id={`rail-title-${id}`} className="media-rail-title" style={{ opacity: 0.5 }}>
            {title}
          </h2>
        </div>
        <div className="media-rail-track" style={{ opacity: 0.15, pointerEvents: 'none' }}>
          <div style={{ flex: '0 0 160px', height: 240, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
          <div style={{ flex: '0 0 160px', height: 240, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
          <div style={{ flex: '0 0 160px', height: 240, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
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
    />
  );
});
