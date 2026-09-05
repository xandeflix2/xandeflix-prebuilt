/**
 * Xandeflix Prebuilt — Main Application Entry (Gate G6)
 *
 * Interface funcional de catálogo consumindo exclusivamente o catálogo local ativo.
 *
 * Princípios:
 * - ACTIVE_LOCAL_CATALOG_ONLY: Zero chamadas remotas de catálogo.
 * - BOOTSTRAP GATING: Estados explícitos para NO_ACTIVE_CATALOG, IMPORT_IN_PROGRESS,
 *   ACTIVE_CATALOG_READY e IMPORT_FAILED_ACTIVE_PRESERVED.
 * - DPAD / TV NAVIGATION: Suporte a teclado/D-pad com retorno via Back/Escape.
 */

import React, { useState, useCallback } from 'react';
import { useActiveCatalog } from './ui/hooks/useActiveCatalog.ts';
import { useDpadNavigation } from './ui/hooks/useDpadNavigation.ts';
import {
  type NavigationState,
  type AppView,
  createInitialRoute,
  navigateTo,
  navigateBack,
} from './ui/navigation/route-state.ts';
import type { CatalogItemViewModel } from './catalog/catalog-view-model.ts';
import { AppShell } from './ui/components/AppShell.tsx';
import { LoadingState } from './ui/components/LoadingState.tsx';
import { NoActiveCatalogState } from './ui/components/NoActiveCatalogState.tsx';
import { EmptyState } from './ui/components/EmptyState.tsx';
import { HomePage } from './ui/pages/HomePage.tsx';
import { MoviesPage } from './ui/pages/MoviesPage.tsx';
import { SeriesPage } from './ui/pages/SeriesPage.tsx';
import { MovieDetailPage } from './ui/pages/MovieDetailPage.tsx';
import { SeriesDetailPage } from './ui/pages/SeriesDetailPage.tsx';

export default function App(): React.JSX.Element {
  const {
    activeCatalog,
    readModel,
    isLoading,
    isNoActiveCatalog,
    isValidEmptyCatalog,
    importWarning,
    refresh,
  } = useActiveCatalog();

  const [routeState, setRouteState] = useState<NavigationState>(createInitialRoute());

  const handleNavigate = useCallback((view: AppView, itemId?: string) => {
    setRouteState((prev) => navigateTo(prev, view, itemId));
  }, []);

  const handleBack = useCallback(() => {
    setRouteState((prev) => navigateBack(prev));
  }, []);

  const handleSelectItem = useCallback(
    (item: CatalogItemViewModel) => {
      if (item.kind === 'movie') {
        handleNavigate('movie-detail', item.id);
      } else {
        handleNavigate('series-detail', item.id);
      }
    },
    [handleNavigate]
  );

  const canGoBack = routeState.history.length > 0 || routeState.current.view !== 'home';

  // Habilita navegação D-pad / teclado
  useDpadNavigation({
    onBack: handleBack,
    enabled: true,
    autoFocusFirst: true,
  });

  // 1. Estado de carregamento local
  if (isLoading) {
    return <LoadingState message="Lendo catálogo local ativo..." />;
  }

  // 2. Proteção contra falso vazio: ausência de catálogo ativo é NO_ACTIVE_CATALOG
  if (isNoActiveCatalog || !activeCatalog || !readModel) {
    return <NoActiveCatalogState onRefresh={refresh} />;
  }

  // 3. Catálogo validamente vazio
  if (isValidEmptyCatalog) {
    return (
      <AppShell
        currentView={routeState.current.view}
        onNavigate={handleNavigate}
        onBack={handleBack}
        canGoBack={canGoBack}
        snapshotId={activeCatalog.metadata.snapshotId}
        catalogVersion={activeCatalog.metadata.catalogVersion}
        warningNotice={importWarning}
      >
        <EmptyState />
      </AppShell>
    );
  }

  // 4. Renderização da View Ativa
  const renderCurrentView = () => {
    const { view, itemId } = routeState.current;

    switch (view) {
      case 'home':
        return <HomePage readModel={readModel} onSelectItem={handleSelectItem} />;
      case 'movies':
        return <MoviesPage readModel={readModel} onSelectItem={handleSelectItem} />;
      case 'series':
        return <SeriesPage readModel={readModel} onSelectItem={handleSelectItem} />;
      case 'movie-detail':
        return (
          <MovieDetailPage
            movieId={itemId || ''}
            readModel={readModel}
            onBack={handleBack}
          />
        );
      case 'series-detail':
        return (
          <SeriesDetailPage
            seriesId={itemId || ''}
            readModel={readModel}
            onBack={handleBack}
          />
        );
      default:
        return <HomePage readModel={readModel} onSelectItem={handleSelectItem} />;
    }
  };

  return (
    <AppShell
      currentView={routeState.current.view}
      onNavigate={handleNavigate}
      onBack={handleBack}
      canGoBack={canGoBack}
      snapshotId={activeCatalog.metadata.snapshotId}
      catalogVersion={activeCatalog.metadata.catalogVersion}
      warningNotice={importWarning}
    >
      {renderCurrentView()}
    </AppShell>
  );
}
