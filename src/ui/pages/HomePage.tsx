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

import React, { useMemo, useState, useEffect } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { getHeroItem, movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { SegmentedBrowseService } from '../../catalog/segmented-browse.service.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { Hero } from '../components/Hero.tsx';
import { MediaRail } from '../components/MediaRail.tsx';
import { AsyncCategoryRail, SimpleRailQueue } from '../components/AsyncCategoryRail.tsx';
import { EmptyState } from '../components/EmptyState.tsx';

interface HomePageProps {
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ readModel, onSelectItem }) => {
  const browseService = useMemo(
    () => new SegmentedBrowseService(getClientBootstrapService().getStorage()),
    []
  );

  const queue = useMemo(() => new SimpleRailQueue(2), []);

  const [seriesPostersReady, setSeriesPostersReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    browseService.ensureSeriesPostersLoaded().then((posterMap) => {
      console.log('[HOME_PAGE] Series poster map received:', posterMap?.size);
      if (!cancelled && posterMap && posterMap.size > 0) {
        for (const s of readModel.catalog.series) {
          const uri = posterMap.get(s.id);
          if (uri) {
            (s as any).posterUri = uri;
            (s as any).posterUrl = uri;
          }
        }
        for (const list of readModel.seriesByCategoryId.values()) {
          for (const s of list) {
            const uri = posterMap.get(s.id);
            if (uri) {
              (s as any).posterUri = uri;
              (s as any).posterUrl = uri;
            }
          }
        }
        console.log('[HOME_PAGE] Hydrated series, setting seriesPostersReady = true');
        setSeriesPostersReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [browseService, readModel]);

  const heroItem = useMemo(() => getHeroItem(readModel), [readModel, seriesPostersReady]);

  // Faixas em destaque (first-fold imediato)
  const featuredMovies = useMemo(
    () =>
      readModel.catalog.movies
        .slice(0, 20)
        .map((m) => movieToViewModel(readModel, m)),
    [readModel]
  );

  const featuredSeries = useMemo(
    () =>
      readModel.catalog.series
        .slice(0, 20)
        .map((s) => seriesToViewModel(readModel, s)),
    [readModel, seriesPostersReady]
  );

  // Categorias canônicas por tipo
  const movieCategories = useMemo(
    () => readModel.getCategoriesForKind('movie'),
    [readModel]
  );

  const seriesCategories = useMemo(
    () => readModel.getCategoriesForKind('series'),
    [readModel]
  );

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
    <main className="page-container home-page">
      {heroItem && <Hero item={heroItem} onSelect={onSelectItem} />}

      <div className="home-rails-container">
        {/* 1º: Faixas de Destaque */}
        {featuredMovies.length > 0 && (
          <MediaRail
            id="rail-movies"
            title="Filmes em Destaque"
            items={featuredMovies}
            onItemClick={onSelectItem}
          />
        )}

        {featuredSeries.length > 0 && (
          <MediaRail
            id="rail-series"
            title="Séries em Destaque"
            items={featuredSeries}
            onItemClick={onSelectItem}
          />
        )}

        {/* 2º: Todas as 20 categorias de Filmes */}
        {movieCategories.map((cat) => {
          const initial = readModel.moviesByCategoryId
            .get(cat.id)
            ?.slice(0, 20)
            .map((m) => movieToViewModel(readModel, m));
          return (
            <AsyncCategoryRail
              key={`cat-movie-${cat.id}`}
              id={`rail-cat-${cat.id}-movie`}
              title={cat.name}
              kind="movies"
              categoryId={cat.id}
              initialItems={initial}
              readModel={readModel}
              browseService={browseService}
              queue={queue}
              onItemClick={onSelectItem}
            />
          );
        })}

        {/* 3º: Todas as 23 categorias de Séries */}
        {seriesCategories.map((cat) => {
          const initial = readModel.seriesByCategoryId
            .get(cat.id)
            ?.slice(0, 20)
            .map((s) => seriesToViewModel(readModel, s));
          return (
            <AsyncCategoryRail
              key={`cat-series-${cat.id}`}
              id={`rail-cat-${cat.id}-series`}
              title={cat.name}
              kind="series"
              categoryId={cat.id}
              initialItems={initial}
              readModel={readModel}
              browseService={browseService}
              queue={queue}
              onItemClick={onSelectItem}
            />
          );
        })}
      </div>
    </main>
  );
};
