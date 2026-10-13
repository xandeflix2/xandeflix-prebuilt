import React, { useLayoutEffect, useMemo, useRef } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { CatalogGrid } from '../components/CatalogGrid.tsx';
import { RecentTitles } from '../components/RecentTitles.tsx';
import { useSeriesHighlights } from '../hooks/useSeriesHighlights.ts';
import { prioritizeSeries } from '../../catalog/series-content-updates.ts';

const titles = { 'recent-watched': 'Recentes', 'featured-movies': 'Filmes em Destaque', 'featured-series': 'Séries em Destaque' } as const;
export type HomeCollectionId = keyof typeof titles;
export function isHomeCollectionId(value: unknown): value is HomeCollectionId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(titles, value);
}

export function HomeCollectionPage({ collection, readModel, onSelectItem, onBack }: {
  collection: HomeCollectionId; readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void; onBack: () => void;
}): React.ReactElement {
  const root = useRef<HTMLElement>(null);
  const recentSeries = useSeriesHighlights();
  const items = useMemo(() => collection === 'featured-movies'
    ? readModel.catalog.movies.slice(0, 20).map(movie => movieToViewModel(readModel, movie))
    : collection === 'featured-series'
      ? prioritizeSeries(recentSeries, readModel.catalog.series.slice(0, 20).map(series => seriesToViewModel(readModel, series)), 20) : [], [collection, readModel, recentSeries]);
  useLayoutEffect(() => {
    const element = root.current; if (!element) return;
    const frame = requestAnimationFrame(() => {
      element.querySelector<HTMLElement>('.catalog-grid .media-card, .home-collection-back')?.focus({ preventScroll: true });
      for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) { ancestor.scrollTop = 0; ancestor.scrollLeft = 0; }
      if (document.scrollingElement) { document.scrollingElement.scrollTop = 0; document.scrollingElement.scrollLeft = 0; }
    });
    return () => cancelAnimationFrame(frame);
  }, [collection, readModel.catalog.metadata.snapshotId]);
  return <main ref={root} className="page-container home-collection-page" data-home-collection={collection}>
    <div className="page-header">
      <button type="button" className="focusable-item btn-secondary home-collection-back" onClick={onBack}>← Voltar</button>
      <h1 className="page-title">{titles[collection]}</h1>
      <p className="page-subtitle">{collection === 'recent-watched' ? 'Filmes e séries assistidos recentemente' : `${items.length} títulos em destaque`}</p>
    </div>
    {collection === 'recent-watched' ? <RecentTitles readModel={readModel} presentation="collection"/>
      : <CatalogGrid items={items} onItemClick={onSelectItem} autoLoadMore/>}
  </main>;
}
