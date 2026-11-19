import type { NavigationState } from './route-state.ts';

const contentView = (view: string) => view === 'movie-detail' || view === 'series-detail' || view === 'live';

/** Only a direct search/content trail belongs to the same search visit. */
export function isSearchReturnRoute(state: NavigationState): boolean {
  if (state.current.view === 'search') return true;
  if (!contentView(state.current.view)) return false;
  for (let i = state.history.length - 1; i >= 0; i--) {
    if (state.history[i].view === 'search') return true;
    if (!contentView(state.history[i].view)) return false;
  }
  return false;
}

export interface SearchReturnPosition {
  target: HTMLElement | null;
  offsets: Array<{ node: HTMLElement; top: number; left: number }>;
}

/** DOM references live only as long as the mounted search visit. */
export function captureSearchPosition(root: HTMLElement, target: HTMLElement | null): SearchReturnPosition {
  const nodes = new Set<HTMLElement>();
  for (let node: HTMLElement | null = root; node; node = node.parentElement) nodes.add(node);
  const body = root.querySelector<HTMLElement>('.search-page-body');
  if (body) nodes.add(body);
  if (document.scrollingElement instanceof HTMLElement) nodes.add(document.scrollingElement);
  return {
    target: target && root.contains(target) ? target : null,
    offsets: [...nodes].map(node => ({ node, top: node.scrollTop, left: node.scrollLeft })),
  };
}

export function restoreSearchPosition(root: HTMLElement, position: SearchReturnPosition): void {
  const previous = position.target;
  const target = previous?.isConnected && root.contains(previous) && previous.getClientRects().length
    ? previous : root.querySelector<HTMLElement>('.search-results-grid .focusable-item:not([disabled])');
  target?.focus({ preventScroll: true });
  for (const { node, top, left } of position.offsets) {
    if (node.isConnected) { node.scrollTop = top; node.scrollLeft = left; }
  }
}
