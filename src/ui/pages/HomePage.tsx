/**
 * Xandeflix Prebuilt — HomePage Component (Pre-Gate B Dynamic Expansion)
 *
 * Tela inicial com suporte a expansão dinâmica de todas as categorias de filmes e séries,
 * combinando renderização imediata do first-fold e carregamento assíncrono em fila com parada rápida.
 *
 * Princípios:
 * - BOUNDED MEMORY: Limite estrito de 20 itens por faixa horizontal (evita sobrecarga de heap).
 * - NON-BLOCKING IO: Concorrência controlada de I/O em fila para hardware restrito (1 GB RAM).
 * - ZERO REDE: Consumo estritamente local do catálogo segmentado.
 * - FOCUS SAFETY: Sem focus traps; classes .focusable-item preservadas em todas as faixas carregadas.
 */

import React, { useMemo, useRef, useState } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { SegmentedBrowseService, type BrowseKind } from '../../catalog/segmented-browse.service.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { HomeHero } from '../components/HomeHero.tsx';
import { useHeroPlayback } from '../hooks/useHeroPlayback.ts';
import { RecentTitles } from '../components/RecentTitles.tsx';
import { useHomeHero } from '../hooks/useHomeHero.ts';
import { MediaRail } from '../components/MediaRail.tsx';
import { AsyncCategoryRail, SimpleRailQueue } from '../components/AsyncCategoryRail.tsx';
import { EmptyState } from '../components/EmptyState.tsx';
import { useCategoryPreviews } from '../hooks/useCategoryPreviews.ts';
import { StartupArtworkPreparation } from '../components/StartupArtworkPreparation.tsx';
import { isReleaseCategory } from '../../catalog/category-presentation.ts';
import type { HomeCollectionId } from './HomeCollectionPage.tsx';
import { useSeriesHighlights } from '../hooks/useSeriesHighlights.ts';
import { prioritizeSeries } from '../../catalog/series-content-updates.ts';

interface HomePageProps {
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
  onSelectCategory: (kind: BrowseKind, id: string) => void;
  onSelectCollection: (id: HomeCollectionId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ readModel, onSelectItem, onSelectCategory, onSelectCollection }) => {
  const root = useRef<HTMLElement>(null);
  const [preparingArtwork, setPreparingArtwork] = useState(false);
  const browseService = useMemo(
    () => new SegmentedBrowseService(getClientBootstrapService().getStorage()),
    [readModel.catalog.metadata.snapshotId]
  );

  const queue = useMemo(() => new SimpleRailQueue(2), []);

  const storage = getClientBootstrapService().getStorage();
  const previewIndex = useCategoryPreviews(readModel, storage);
  const hero = useHomeHero(readModel, storage);
  const heroPlayback = useHeroPlayback(readModel);
  const recentSeries = useSeriesHighlights();

  // Faixas em destaque (first-fold imediato)
  const featuredMovies = useMemo(
    () =>
      readModel.catalog.movies
        .slice(0, 20)
        .map((m) => movieToViewModel(readModel, m)),
    [readModel]
  );

  const featuredSeries = useMemo(
    () => prioritizeSeries(recentSeries,
      readModel.catalog.series
        .slice(0, 20)
        .map((s) => seriesToViewModel(readModel, s)), 20),
    [readModel, recentSeries]
  );

  // Categorias canônicas por tipo
  const movieCategories = useMemo(
    () => {
      const categories = readModel.getCategoriesForKind('movie');
      return [
        ...categories.filter(category => isReleaseCategory(category.name)),
        ...categories.filter(category => !isReleaseCategory(category.name)),
      ];
    },
    [readModel]
  );

  const seriesCategories = useMemo(
    () => readModel.getCategoriesForKind('series'),
    [readModel]
  );

  const renderMovieCategory = (cat: (typeof movieCategories)[number], index: number) => {
    const initial = readModel.moviesByCategoryId
      .get(cat.id)
      ?.slice(0, 20)
      .map((m) => movieToViewModel(readModel, m));
    return (
      <AsyncCategoryRail
        key={`${readModel.catalog.metadata.snapshotId}-cat-movie-${cat.id}`}
        id={`rail-cat-${cat.id}-movie`}
        title={cat.name}
        kind="movies"
        categoryId={cat.id}
        initialItems={initial}
        readModel={readModel}
        browseService={browseService}
        queue={queue}
        loadWhenVisible
        previewIndex={previewIndex}
        onItemClick={onSelectItem}
        onViewAll={() => onSelectCategory('movies', cat.id)}
        startupArtworkCount={preparingArtwork && index === 0 ? 8 : 0}
      />
    );
  };

  const isEmpty =
    readModel.catalog.movies.length === 0 &&
    readModel.catalog.series.length === 0;

  if (isEmpty) {
    return (
      <main className="page-container">
        <EmptyState message="Nenhum filme ou série disponível no catálogo ativo atual." />
      </main>
    );
  }

  return (
    <main ref={root} className="page-container home-page">
      <StartupArtworkPreparation root={root} snapshot={readModel.catalog.metadata.snapshotId} onPreparing={setPreparingArtwork}/>
      <HomeHero {...hero} {...heroPlayback} options={hero.candidates} onSelect={onSelectItem} />

      <div className="home-rails-container">
        {movieCategories.map((cat, index) =>
          isReleaseCategory(cat.name) ? renderMovieCategory(cat, index) : null
        )}

        <RecentTitles readModel={readModel} onViewAll={() => onSelectCollection('recent-watched')}/>

        {featuredMovies.length > 0 && (
          <MediaRail
            id="rail-movies"
            title="Filmes em Destaque"
            items={featuredMovies}
            onItemClick={onSelectItem}
            onViewAll={() => onSelectCollection('featured-movies')}
            startupArtworkCount={preparingArtwork ? 8 : 0}
          />
        )}

        {featuredSeries.length > 0 && (
          <MediaRail
            id="rail-series"
            title="Séries em Destaque"
            items={featuredSeries}
            preserveOrder
            onItemClick={onSelectItem}
            onViewAll={() => onSelectCollection('featured-series')}
            startupArtworkCount={preparingArtwork ? 8 : 0}
          />
        )}

        {/* Demais categorias de filmes na ordem relativa existente. */}
        {movieCategories.map((cat, index) =>
          !isReleaseCategory(cat.name) ? renderMovieCategory(cat, index) : null
        )}

        {/* Categorias de séries na ordem relativa existente. */}
        {seriesCategories.map((cat, index) => {
          const initial = readModel.seriesByCategoryId
            .get(cat.id)
            ?.slice(0, 20)
            .map((s) => seriesToViewModel(readModel, s));
          return (
            <AsyncCategoryRail
              key={`${readModel.catalog.metadata.snapshotId}-cat-series-${cat.id}`}
              id={`rail-cat-${cat.id}-series`}
              title={cat.name}
              kind="series"
              categoryId={cat.id}
              initialItems={initial}
              readModel={readModel}
              browseService={browseService}
              queue={queue}
              loadWhenVisible
              previewIndex={previewIndex}
              onItemClick={onSelectItem}
              onViewAll={() => onSelectCategory('series', cat.id)}
              startupArtworkCount={preparingArtwork && index === 0 ? 8 : 0}
            />
          );
        })}
      </div>
    </main>
  );
};
