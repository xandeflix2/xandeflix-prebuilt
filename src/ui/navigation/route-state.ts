/**
 * Xandeflix Prebuilt — Route State (Gate G6)
 *
 * Gerenciador de rotas interno e leve sem dependências externas pesadas.
 *
 * Princípios:
 * - DEPENDENCY_SCOPE_MINIMAL: Implementado sobre React State sem React Router.
 * - BACK_RETURNS_PREVIOUS_VIEW: Pilha de histórico para suporte a voltar/Escape/D-pad Back.
 */

export type AppView = 'home' | 'movies' | 'series' | 'movie-detail' | 'series-detail';

export interface RouteLocation {
  view: AppView;
  itemId?: string;
}

export interface NavigationState {
  current: RouteLocation;
  history: RouteLocation[];
}

export function createInitialRoute(): NavigationState {
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
