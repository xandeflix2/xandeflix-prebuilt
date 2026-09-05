/**
 * Xandeflix Prebuilt — HomePage Component (Gate G6)
 *
 * Tela inicial do aplicativo consumindo exclusivamente o catálogo local ativo.
 *
 * Princípios:
 * - ACTIVE_LOCAL_CATALOG_ONLY: Zero requisições de rede.
 * - BOUNDED RENDERING: Limite explícito de itens por faixa (HOME_RAIL_MAX_ITEMS_INITIAL).
 */

import React from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { getHeroItem, getHomeRails } from '../../catalog/catalog-selectors.ts';
import { Hero } from '../components/Hero.tsx';
import { MediaRail } from '../components/MediaRail.tsx';
import { EmptyState } from '../components/EmptyState.tsx';

interface HomePageProps {
  readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ readModel, onSelectItem }) => {
  const heroItem = getHeroItem(readModel);
  const rails = getHomeRails(readModel);

  const isEmpty = readModel.catalog.movies.length === 0 && readModel.catalog.series.length === 0;

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
        {rails.map((rail) => (
          <MediaRail
            key={rail.id}
            id={rail.id}
            title={rail.title}
            items={rail.items}
            onItemClick={onSelectItem}
          />
        ))}
      </div>
    </main>
  );
};
