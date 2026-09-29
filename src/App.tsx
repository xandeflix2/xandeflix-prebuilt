/**
 * Xandeflix Prebuilt — Main Application Entry (Cycles G6, C11-P5B, C11-P5B1)
 *
 * Interface funcional de catálogo consumindo exclusivamente o catálogo local ativo.
 *
 * Princípios:
 * - NON_BLOCKING_FIRST_INSTALL: Shell interativo em segundos no primeiro boot;
 *   sincronização do catálogo comercial real ocorre em segundo plano.
 * - ZERO_SYNTHETIC_LEAK: Fixture sintética nunca é apresentada como conteúdo comercial.
 * - LOCAL_FIRST_RETURNING: Dispositivos com catálogo REAL válido abrem instantaneamente.
 * - ACTIVE_LOCAL_CATALOG_ONLY: Zero chamadas remotas no path de renderização da UI.
 * - DPAD / TV NAVIGATION: Suporte a teclado/D-pad com retorno via Back/Escape.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
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
import {
  FirstRealSyncState,
  type FirstRealSyncCatalogState,
} from './ui/components/FirstRealSyncState.tsx';
import {
  getBootSyncCoordinator,
  type BootSyncState,
  type BootSyncProgress,
} from './bootstrap/boot-sync-coordinator.ts';
import { HomePage } from './ui/pages/HomePage.tsx';
import { MoviesPage } from './ui/pages/MoviesPage.tsx';
import { SeriesPage } from './ui/pages/SeriesPage.tsx';
import { SearchPage } from './ui/pages/SearchPage.tsx';
import { MovieDetailPage } from './ui/pages/MovieDetailPage.tsx';
import { SeriesDetailPage } from './ui/pages/SeriesDetailPage.tsx';
import { LocalSourceProvisioningPage } from './ui/pages/LocalSourceProvisioningPage.tsx';
import { ActivationPage } from './ui/pages/ActivationPage.tsx';
import { PublicDeviceActivationPage } from './ui/pages/PublicDeviceActivationPage.tsx';
import { ManagerPanelPage } from './debug/manager/ManagerPanelPage.tsx';
import { LiveTvPage } from './ui/pages/LiveTvPage.tsx';
import { CustomerPortalPage } from './ui/portal/CustomerPortalPage.tsx';
import {
  addNativeAndroidBackButtonListener,
  addNativePlayerResumeListener,
  finishNativeAndroidApp,
} from './playback/native-android-player.bridge.ts';
import { defaultPlaybackService } from './playback/playback.service.ts';
import { InstallationRegistryService } from './control-plane/client/installation-registry.service.ts';
import { DeviceIdentityService } from './device/device-identity.service.ts';
import { bootTelemetry } from './diagnostics/boot-telemetry.ts';
import { ensurePendingDeviceActivationRequest, syncPendingDeviceActivation } from './control-plane/client/device-activation-sync.service.ts';
import { installViewportMetricsDiagnostic } from './ui/layout/viewport-metrics.ts';

declare const __XANDEFLIX_DEBUG_BUILD__: boolean;

if (typeof __XANDEFLIX_DEBUG_BUILD__ !== 'undefined' && __XANDEFLIX_DEBUG_BUILD__) {
  import('./debug/debug-import.ts').then(({ initDebugImport }) => {
    initDebugImport();
  });
  import('./debug/debug-compact-search-v2.ts').then(({ initDebugCompactSearchV2 }) => {
    initDebugCompactSearchV2();
  });
  import('./debug/debug-pending-device-reactivation.ts').then(({ initDebugPendingDeviceReactivation }) => {
    initDebugPendingDeviceReactivation();
  });
}

export default function App(): React.JSX.Element {
  const {
    activeCatalog,
    readModel,
    isLoading,
    isNoActiveCatalog,
    isValidEmptyCatalog,
    importWarning,
    summary,
    refresh,
  } = useActiveCatalog();

  const [bootSyncState, setBootSyncState] = useState<BootSyncState>(() => getBootSyncCoordinator().getState());
  const [bootSyncProgress, setBootSyncProgress] = useState<BootSyncProgress | undefined>(() =>
    getBootSyncCoordinator().getProgress()
  );
  const [bootSyncError, setBootSyncError] = useState<string | undefined>();

  const [routeState, setRouteState] = useState<NavigationState>(createInitialRoute());
  const [authorizationGate, setAuthorizationGate] = useState<'CHECKING' | 'UNAUTHORIZED' | 'AUTHORIZED'>('CHECKING');
  const routeStateRef = useRef(routeState);
  routeStateRef.current = routeState;

  useEffect(() => {
    installViewportMetricsDiagnostic();
  }, []);

  useEffect(() => {
    let disposed = false;
    const reconcileAuthorization = async () => {
      const state = await DeviceIdentityService.loadActivationState();
      if (!disposed) {
        setAuthorizationGate(state?.status === 'AUTHORIZED' ? 'AUTHORIZED' : 'UNAUTHORIZED');
      }
    };
    void reconcileAuthorization();
    const handleActivationUpdated = () => {
      if (!disposed) setAuthorizationGate('AUTHORIZED');
    };
    window.addEventListener('xandeflix:activation-updated', handleActivationUpdated);
    return () => {
      disposed = true;
      window.removeEventListener('xandeflix:activation-updated', handleActivationUpdated);
    };
  }, []);

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

  const handleCatalogImported = useCallback(async () => {
    await refresh();
    handleNavigate('home');
  }, [handleNavigate, refresh]);

  const canGoBack = routeState.history.length > 0 || routeState.current.view !== 'home';

  // Instrumentação cronológica de marcos de boot
  useEffect(() => {
    bootTelemetry.mark('T2_REACT_MOUNT');
    void DeviceIdentityService.getOrCreateInstallationIdentity().then(() => {
      bootTelemetry.mark('T3_IDENTITY_READY');
    });
    void DeviceIdentityService.loadActivationState().then(() => {
      bootTelemetry.mark('T4_AUTHORIZATION_READY');
    });
  }, []);

  // O BACK físico Android chega por uma única ponte nativa e é adjudicado pelo
  // estado central de rotas. O keydown permanece apenas como suporte de teclado.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    void addNativeAndroidBackButtonListener(() => {
      const current = routeStateRef.current;
      const hasInternalRoute = current.history.length > 0 || current.current.view !== 'home';
      if (hasInternalRoute) {
        handleBack();
        return;
      }
      void finishNativeAndroidApp();
    })
      .then((handle) => {
        if (disposed) {
          void handle.remove();
        } else {
          listenerHandle = handle;
        }
      })
      .catch(() => {
        // Sem fallback que antecipe o fechamento da Activity.
      });

    return () => {
      disposed = true;
      if (listenerHandle) {
        void listenerHandle.remove();
      }
    };
  }, [handleBack]);

  // A NativePlayerActivity comunica fim, Back e erro de mídia sem transportar
  // URL ou credenciais. O mesmo evento fecha o lease C9 no runtime web.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let listenerHandle: { remove: () => Promise<void> } | null = null;
    void addNativePlayerResumeListener((event) => {
      if (disposed) return;
      void defaultPlaybackService.stopPlayback(event.errorCode ? 'MEDIA_ERROR' : event.ended ? 'COMPLETION' : 'USER_EXIT');
    })
      .then((handle) => {
        if (disposed) {
          void handle.remove();
        } else {
          listenerHandle = handle;
        }
      })
      .catch(() => {
        // Em web ou bridge antigo, o cleanup do componente continua válido.
      });

    return () => {
      disposed = true;
      if (listenerHandle) void listenerHandle.remove();
    };
  }, []);

  // Registro best-effort de instalação no boot (C2 Installation Registry)
  useEffect(() => {
    void InstallationRegistryService.reportInstallationBestEffort().catch(() => {});
  }, []);

  // A página externa conclui a ativação enquanto o app pode estar em qualquer
  // tela. O app observa a capability pendente e reconcilia o estado sem
  // reinstalação, sem nova URL e sem exigir login.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const sync = () => {
      if (!disposed) void syncPendingDeviceActivation().catch(() => {});
    };
    void ensurePendingDeviceActivationRequest().then(sync).catch(() => {});
    const interval = window.setInterval(sync, 5000);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, []);

  // Sincronização e promoção automática do catálogo comercial real no boot (P5B1)
  // Princípio Fundamental: Dispara em SEGUNDO PLANO sem bloquear o boot da UI.
  useEffect(() => {
    if (authorizationGate !== 'AUTHORIZED') return;
    const coordinator = getBootSyncCoordinator();
    const unsubscribe = coordinator.subscribe((state, result, progress) => {
      setBootSyncState(state);
      if (progress) {
        setBootSyncProgress(progress);
      }
      if (result?.error) {
        setBootSyncError(result.error);
      }
      if (result?.outcome === 'PROMOTED') {
        void refresh();
      }
    });

    // Início assíncrono não-bloqueante
    coordinator.startNonBlockingSync();

    return () => {
      unsubscribe();
    };
  }, [authorizationGate, refresh]);

  // Registra pontes globais para navegação e testes de automação
  useEffect(() => {
    (window as any).__XANDEFLIX_OPEN_ACTIVATION__ = () => {
      handleNavigate('activation');
    };
    (window as any).__XANDEFLIX_OPEN_LIVE__ = () => {
      handleNavigate('live');
    };
    (window as any).__XANDEFLIX_OPEN_PORTAL__ = () => {
      handleNavigate('portal');
    };
    (window as any).__XANDEFLIX_SYNC_CATALOG__ = () => {
      return getBootSyncCoordinator().coordinateBootSync().then((res) => {
        if (res.outcome === 'PROMOTED') {
          void refresh();
        }
        return res;
      });
    };
    if (typeof __XANDEFLIX_DEBUG_BUILD__ !== 'undefined' && __XANDEFLIX_DEBUG_BUILD__) {
      (window as any).__XANDEFLIX_DEBUG_OPEN_SOURCE_SETUP__ = () => {
        handleNavigate('debug-source-setup');
      };
      (window as any).__XANDEFLIX_DEBUG_OPEN_MANAGER__ = () => {
        handleNavigate('manager-panel');
      };
    }

    const handleHash = () => {
      const raw = window.location.hash.replace(/^#\/?/, '').trim();
      const valid: AppView[] = [
        'home',
        'movies',
        'series',
        'live',
        'search',
        'activation',
        'activate-device',
        'debug-source-setup',
        'manager-panel',
        'portal',
      ];
      if (raw.startsWith('portal')) {
        handleNavigate('portal');
        return;
      }
      if (valid.includes(raw as AppView)) {
        handleNavigate(raw as AppView);
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
    };
  }, [handleNavigate, refresh]);

  // Habilita navegação D-pad / teclado
  useDpadNavigation({
    onBack: handleBack,
    enabled: true,
    autoFocusFirst: true,
  });

  // Instrumenta marcos T5 e T6 imediatamente na montagem do shell
  useEffect(() => {
    if (!isLoading) {
      bootTelemetry.mark('T5_HOME_SHELL_VISIBLE');
      bootTelemetry.mark('T6_NAV_INTERACTIVE');
    }
  }, [isLoading]);

  // 1. Estado transitório mínimo de leitura do ponteiro local inicial
  if (isLoading) {
    return <LoadingState message="Lendo catálogo local ativo..." />;
  }

  if (authorizationGate === 'CHECKING') {
    return <LoadingState message="Verificando autorizaÃ§Ã£o do dispositivo..." />;
  }

  const isDebugManagerRoute =
    routeState.current.view === 'manager-panel' &&
    typeof __XANDEFLIX_DEBUG_BUILD__ !== 'undefined' &&
    __XANDEFLIX_DEBUG_BUILD__;
  const isPublicActivationRoute = routeState.current.view === 'activate-device';

  if (authorizationGate === 'UNAUTHORIZED' && !isDebugManagerRoute && !isPublicActivationRoute) {
    return (
      <ActivationPage
        onBack={() => undefined}
        onOpenSourceSetup={() => undefined}
        onCatalogImported={async () => undefined}
      />
    );
  }

  const isExistingRealCatalog = summary?.activePointer?.kind === 'REAL';

  // 2. Determinação de estado de catálogo da primeira sincronização real
  const getFirstRealSyncCatalogState = (): FirstRealSyncCatalogState => {
    if (bootSyncState === 'OFFLINE') {
      return 'OFFLINE_WAITING_FOR_SYNC';
    }
    if (bootSyncState === 'ERROR' || bootSyncState === 'CATALOG_SYNC_ERROR') {
      return 'CATALOG_SYNC_ERROR';
    }
    return 'SYNCING_FIRST_REAL_CATALOG';
  };

  // 3. Renderização da View Ativa
  const renderCurrentView = () => {
    const { view, itemId } = routeState.current;

    switch (view) {
      case 'home':
        if (!isExistingRealCatalog) {
          return (
            <FirstRealSyncState
              catalogState={getFirstRealSyncCatalogState()}
              progressText={bootSyncProgress?.progressText}
              errorMessage={bootSyncError}
              onOpenActivation={() => handleNavigate('activation')}
              onOpenPortal={() => handleNavigate('portal')}
              onRetry={() => {
                setBootSyncError(undefined);
                getBootSyncCoordinator().startNonBlockingSync();
              }}
            />
          );
        }
        if (!readModel) {
          return <EmptyState message="Preparando catálogo..." />;
        }
        return <HomePage readModel={readModel} onSelectItem={handleSelectItem} />;

      case 'movies':
        if (!isExistingRealCatalog) {
          return (
            <FirstRealSyncState
              catalogState={getFirstRealSyncCatalogState()}
              progressText="Filmes comerciais serão exibidos após a conclusão da sincronização."
              errorMessage={bootSyncError}
              onOpenActivation={() => handleNavigate('activation')}
              onOpenPortal={() => handleNavigate('portal')}
            />
          );
        }
        if (!readModel) return <EmptyState />;
        return <MoviesPage readModel={readModel} onSelectItem={handleSelectItem} />;

      case 'series':
        if (!isExistingRealCatalog) {
          return (
            <FirstRealSyncState
              catalogState={getFirstRealSyncCatalogState()}
              progressText="Séries comerciais serão exibidas após a conclusão da sincronização."
              errorMessage={bootSyncError}
              onOpenActivation={() => handleNavigate('activation')}
              onOpenPortal={() => handleNavigate('portal')}
            />
          );
        }
        if (!readModel) return <EmptyState />;
        return <SeriesPage readModel={readModel} onSelectItem={handleSelectItem} />;

      case 'live':
        return <LiveTvPage onBack={handleBack} onOpenSourceSetup={() => handleNavigate('debug-source-setup')} />;

      case 'search':
        if (!isExistingRealCatalog) {
          return (
            <FirstRealSyncState
              catalogState={getFirstRealSyncCatalogState()}
              progressText="A busca estará disponível assim que a indexação for concluída."
              errorMessage={bootSyncError}
              onOpenActivation={() => handleNavigate('activation')}
              onOpenPortal={() => handleNavigate('portal')}
            />
          );
        }
        if (!readModel) return <EmptyState />;
        return <SearchPage readModel={readModel} onSelectItem={handleSelectItem} />;

      case 'activation':
        return (
          <ActivationPage
            onBack={handleBack}
            onOpenSourceSetup={() => handleNavigate('debug-source-setup')}
            onCatalogImported={handleCatalogImported}
          />
        );

      case 'activate-device':
        return <PublicDeviceActivationPage onBack={handleBack} />;

      case 'debug-source-setup':
        if (typeof __XANDEFLIX_DEBUG_BUILD__ !== 'undefined' && __XANDEFLIX_DEBUG_BUILD__) {
          return <LocalSourceProvisioningPage authorizationMetadata={null} onBack={handleBack} />;
        }
        return <HomePage readModel={readModel!} onSelectItem={handleSelectItem} />;

      case 'manager-panel':
        if (typeof __XANDEFLIX_DEBUG_BUILD__ !== 'undefined' && __XANDEFLIX_DEBUG_BUILD__) {
          return <ManagerPanelPage onBack={handleBack} />;
        }
        return <HomePage readModel={readModel!} onSelectItem={handleSelectItem} />;

      case 'portal':
        return <CustomerPortalPage onBack={handleBack} />;

      case 'movie-detail':
        if (!readModel) return <EmptyState />;
        return (
          <MovieDetailPage
            movieId={itemId || ''}
            readModel={readModel}
            onBack={handleBack}
          />
        );

      case 'series-detail':
        if (!readModel) return <EmptyState />;
        return (
          <SeriesDetailPage
            seriesId={itemId || ''}
            readModel={readModel}
            onBack={handleBack}
          />
        );

      default:
        if (!isExistingRealCatalog) {
          return (
            <FirstRealSyncState
              catalogState={getFirstRealSyncCatalogState()}
              progressText={bootSyncProgress?.progressText}
              errorMessage={bootSyncError}
              onOpenActivation={() => handleNavigate('activation')}
              onOpenPortal={() => handleNavigate('portal')}
            />
          );
        }
        return <HomePage readModel={readModel!} onSelectItem={handleSelectItem} />;
    }
  };

  // Se já há catálogo REAL ativo mas legitimamente vazio
  if (isExistingRealCatalog && isValidEmptyCatalog) {
    return (
      <AppShell
        currentView={routeState.current.view}
        onNavigate={handleNavigate}
        onBack={handleBack}
        canGoBack={canGoBack}
        snapshotId={activeCatalog?.metadata.snapshotId}
        catalogVersion={activeCatalog?.metadata.catalogVersion}
        warningNotice={importWarning}
      >
        <EmptyState />
      </AppShell>
    );
  }

  // Se o catálogo estiver ausente e não for primeira sincronização
  if (isExistingRealCatalog && (isNoActiveCatalog || !activeCatalog || !readModel)) {
    return (
      <NoActiveCatalogState
        onRefresh={refresh}
        onOpenPortal={() => handleNavigate('portal')}
        onOpenDebugSource={() => handleNavigate('debug-source-setup')}
        onOpenActivation={() => handleNavigate('activation')}
        onOpenManager={() => handleNavigate('manager-panel')}
      />
    );
  }

  return (
    <AppShell
      currentView={routeState.current.view}
      onNavigate={handleNavigate}
      onBack={handleBack}
      canGoBack={canGoBack}
      snapshotId={isExistingRealCatalog ? activeCatalog?.metadata.snapshotId : undefined}
      catalogVersion={isExistingRealCatalog ? activeCatalog?.metadata.catalogVersion : 'Sincronizando...'}
      warningNotice={importWarning}
    >
      {renderCurrentView()}
    </AppShell>
  );
}
