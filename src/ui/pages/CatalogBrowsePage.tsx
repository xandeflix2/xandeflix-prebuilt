import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Movie, Series } from '../../contracts/catalog.ts';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { SegmentedBrowseService, type BrowseKind } from '../../catalog/segmented-browse.service.ts';
import { createPresentationSeed, orderCategoryItems, isReleaseCategory } from '../../catalog/category-presentation.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { prefetchCatalogArtwork } from '../../artwork/artwork-preload.service.ts';
import { useSegmentedBrowse } from '../hooks/useSegmentedBrowse.ts';
import { AsyncCategoryRail, SimpleRailQueue } from '../components/AsyncCategoryRail.tsx';
import { MediaRail } from '../components/MediaRail.tsx';
import { CategoryHero } from '../components/CategoryHero.tsx';
import { useHeroPlayback } from '../hooks/useHeroPlayback.ts';
import { BrowseHero } from '../components/BrowseHero.tsx';
import { CatalogGrid } from '../components/CatalogGrid.tsx';
import { useCategoryPreviews } from '../hooks/useCategoryPreviews.ts';
import type { HomeCollectionId } from './HomeCollectionPage.tsx';
import { useSeriesHighlights } from '../hooks/useSeriesHighlights.ts';
import { prioritizeSeries } from '../../catalog/series-content-updates.ts';

export interface CatalogBrowsePageProps {
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
  categoryId?: string;
  onSelectCategory: (id: string) => void;
  onSelectCollection?: (id: HomeCollectionId) => void;
}

/** Overview rails and one exact category collection share the same local reader. */
export function CatalogBrowsePage({ kind, readModel, onSelectItem, categoryId, onSelectCategory, onSelectCollection }: CatalogBrowsePageProps & { kind: BrowseKind }): React.ReactElement {
  const movie = kind === 'movies';
  const heroPlayback = useHeroPlayback(readModel);
  const title = movie ? 'Filmes' : 'Séries';
  const snapshot = readModel.catalog.metadata.snapshotId;
  const categories = useMemo(() => readModel.getCategoriesForKind(movie ? 'movie' : 'series'), [readModel, movie]);
  const category = categories.find(row => row.id === categoryId);
  const collection = categoryId !== undefined;
  const latestSourceFirst = movie && Boolean(category && isReleaseCategory(category.name));
  const heading = collection ? category?.name || 'Categoria indisponível' : title;
  const [seed] = useState(createPresentationSeed);
  const root = useRef<HTMLElement | null>(null);
  const initial = useMemo(() => latestSourceFirst ? [] : (movie ? readModel.catalog.movies : readModel.catalog.series)
    .filter(row => !collection || row.categoryIds.includes(categoryId!)).slice(0, 48), [readModel, movie, collection, categoryId, latestSourceFirst]);
  const browse = useSegmentedBrowse(kind, categoryId, snapshot, initial, latestSourceFirst ? 'source-desc' : 'source');
  const toViewModel = useCallback((row: Movie | Series) => movie
    ? movieToViewModel(readModel, row as Movie) : seriesToViewModel(readModel, row as Series), [readModel, movie]);
  const items = useMemo(() => orderCategoryItems(browse.items.map(toViewModel), heading, seed), [browse.items, toViewModel, heading, seed]);
  const recentSeries = useSeriesHighlights();
  const heroItems = useMemo(() => movie ? items : prioritizeSeries(recentSeries, items, 48, category?.name), [movie, recentSeries, items, category?.name]);
  const railService = useMemo(() => new SegmentedBrowseService(getClientBootstrapService().getStorage(), snapshot), [snapshot]);
  const previewIndex = useCategoryPreviews(readModel, getClientBootstrapService().getStorage(), kind);
  const [queue] = useState(() => new SimpleRailQueue(2));
  const disposal = useRef<{ service: SegmentedBrowseService; timer: ReturnType<typeof setTimeout> }>();
  const warming = useRef<AbortController>();
  useEffect(() => {
    const controller = new AbortController();
    warming.current = controller;
    return () => controller.abort();
  }, [kind, categoryId, snapshot]);
  useEffect(() => {
    if (disposal.current?.service === railService) clearTimeout(disposal.current.timer);
    return () => { disposal.current = { service: railService, timer: setTimeout(() => railService.dispose(), 0) }; };
  }, [railService]);
  const rails = useMemo(() => categories.map(cat => ({
    category: cat,
    initialItems: (movie ? readModel.moviesByCategoryId.get(cat.id) : readModel.seriesByCategoryId.get(cat.id))
      ?.slice(0, 20).map(toViewModel),
  })), [categories, movie, readModel, toViewModel]);
  const featured = useMemo(() => {
    if (collection) return [];
    const initial = (movie ? readModel.catalog.movies : readModel.catalog.series).slice(0, 20).map(toViewModel);
    return movie ? initial : prioritizeSeries(recentSeries, initial, 20);
  }, [collection, movie, readModel, toViewModel, recentSeries]);
  const renderRail = ({ category: cat, initialItems }: typeof rails[number]) => <AsyncCategoryRail key={`${snapshot}:${kind}:${cat.id}`}
    id={`browse-${kind}-${cat.id}`} title={cat.name} kind={kind} categoryId={cat.id} initialItems={initialItems}
    readModel={readModel} browseService={railService} queue={queue} maxItems={20} loadWhenVisible
    previewIndex={previewIndex}
    onItemClick={onSelectItem} onViewAll={() => onSelectCategory(cat.id)} onViewAllFocus={() => warmCategory(cat.id)}/>;
  const warmCategory = useCallback((id: string) => {
    const signal = warming.current?.signal;
    void browse.prefetchCategory(id, movie && isReleaseCategory(readModel.categoryById.get(id)?.name || '') ? 'source-desc' : 'source').then(rows => {
      if (signal?.aborted) return;
      prefetchCatalogArtwork(orderCategoryItems(rows.map(toViewModel), readModel.categoryById.get(id)?.name || '', seed), signal);
    }).catch(() => {});
  }, [browse.prefetchCategory, toViewModel, readModel, seed, movie]);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const frame = requestAnimationFrame(() => {
      const target = collection ? element.querySelector<HTMLElement>('.hero-actions .focusable-item, .rail-view-all, .media-card') : element;
      (target || element).focus({ preventScroll: true });
      for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
        ancestor.scrollTop = 0; ancestor.scrollLeft = 0;
      }
      if (document.scrollingElement) { document.scrollingElement.scrollTop = 0; document.scrollingElement.scrollLeft = 0; }
    });
    return () => cancelAnimationFrame(frame);
  }, [kind, categoryId, snapshot]);

  const noun = movie ? 'filme' : 'série';
  const plural = movie ? 'filmes' : 'séries';
  const subtitle = browse.totalIsExact !== false
    ? `${browse.totalAvailable} ${browse.totalAvailable === 1 ? `${noun} disponível` : `${plural} disponíveis`} no catálogo local`
    : items.length ? `${items.length} ${plural} carregados` : 'Carregando categoria…';

  return <main ref={root} tabIndex={-1} className={`page-container ${movie ? 'movies-page' : 'series-page'} ${collection ? 'category-collection-page' : 'category-rails-page'}`}
    data-browse-kind={kind} data-category-id={categoryId}>
    <div className="page-header"><h1 className="page-title">{heading}</h1><p className="page-subtitle">{collection && !category ? 'Esta categoria não está disponível no catálogo ativo.' : subtitle}</p></div>
    {!collection ? <BrowseHero key={`${snapshot}:${kind}`} readModel={readModel} storage={getClientBootstrapService().getStorage()}
      contentKind={movie ? 'movie' : 'series'} onSelect={onSelectItem}/>
      : category && <CategoryHero key={`${snapshot}:${categoryId}`} items={heroItems} onSelect={onSelectItem} {...heroPlayback}/>}
    {collection ? category && <CatalogGrid key={`${snapshot}:${kind}:${categoryId}`} items={items} onItemClick={onSelectItem}
      emptyMessage={browse.failed ? 'Não foi possível carregar esta categoria.' : browse.loading ? 'Preparando catálogo…' : `Nenhum ${noun} encontrado nesta categoria.`}
      hasMoreRemote={browse.hasMore} isLoadingRemote={browse.loading} onLoadMoreRemote={browse.loadNext} autoLoadMore loadMoreFailed={browse.failed}/>
      : <div className="category-rails-container">
        {movie && rails.filter(rail => isReleaseCategory(rail.category.name)).map(renderRail)}
        {featured.length > 0 && <MediaRail id={`browse-featured-${kind}`} title={movie ? 'Filmes em Destaque' : 'Séries em Destaque'}
          items={featured} preserveOrder onItemClick={onSelectItem}
          onViewAll={onSelectCollection ? () => onSelectCollection(movie ? 'featured-movies' : 'featured-series') : undefined}/>}
        {rails.filter(rail => !movie || !isReleaseCategory(rail.category.name)).map(renderRail)}
        {!categories.length && <p className="catalog-grid-empty">Nenhuma categoria disponível neste catálogo.</p>}
      </div>}
  </main>;
}
