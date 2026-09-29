/**
 * Xandeflix Prebuilt — Route State (Gate G6)
 *
 * Gerenciador de rotas interno e leve sem dependências externas pesadas.
 *
 * Princípios:
 * - DEPENDENCY_SCOPE_MINIMAL: Implementado sobre React State sem React Router.
 * - BACK_RETURNS_PREVIOUS_VIEW: Pilha de histórico para suporte a voltar/Escape/D-pad Back.
 */

export type AppView =
  | 'home'
  | 'movies'
  | 'series'
  | 'live'
  | 'search'
  | 'movie-detail'
  | 'series-detail'
  | 'debug-source-setup'
  | 'activation'
  | 'activate-device'
  | 'manager-panel'
  | 'portal';

export interface RouteLocation {
  view: AppView;
  itemId?: string;
}

export interface NavigationState {
  current: RouteLocation;
  history: RouteLocation[];
}

export function createInitialRoute(): NavigationState {
  if (typeof window !== 'undefined' && window.location && window.location.hash) {
    const raw = window.location.hash.replace(/^#\/?/, '').trim();
    const validViews: AppView[] = [
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
      return {
        current: { view: 'portal' },
        history: [],
      };
    }
    if (validViews.includes(raw as AppView)) {
      return {
        current: { view: raw as AppView },
        history: [],
      };
    }
  }

  return {
    current: { view: 'home' },
    history: [],
  };
}

export function navigateTo(
  state: NavigationState,
  view: AppView,
  itemId?: string
): NavigationState {
  // Se for a mesma rota, não duplica histórico
  if (state.current.view === view && state.current.itemId === itemId) {
    return state;
  }

  return {
    current: { view, itemId },
    history: [...state.history, state.current],
  };
}

export function navigateBack(state: NavigationState): NavigationState {
  if (state.history.length === 0) {
    // Se não há histórico, volta para home
    if (state.current.view !== 'home') {
      return {
        current: { view: 'home' },
        history: [],
      };
    }
    return state;
  }

  const newHistory = [...state.history];
  const previous = newHistory.pop()!;

  return {
    current: previous,
    history: newHistory,
  };
}
