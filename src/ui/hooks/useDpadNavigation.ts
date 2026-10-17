/**
 * Xandeflix Prebuilt — useDpadNavigation Hook (Cycle C11 Ultra High Performance)
 *
 * Motor de navegação direcional D-pad de altíssimo desempenho para Android TV / Fire Stick Lite.
 *
 * Princípios de Performance:
 * - O(1) HIERARCHY-AWARE FAST-PATHS: Navegação horizontal em trilhas e cabeçalhos usa siblings diretos
 *   sem NENHUMA leitura síncrona de getBoundingClientRect() e sem querySelectorAll na árvore inteira.
 * - O(1) INDEX-ALIGNED VERTICAL NAVIGATION: Ao navegar entre trilhas verticais, preserva a coluna pelo índice
 *   de posição direta no track, eliminando completamente reflows síncronos e layout thrashing.
 * - VERTICAL RAIL CENTERING: Ao migrar entre faixas (ArrowUp / ArrowDown), centraliza o rail alvo diretamente
 *   na viewport ('center'), garantindo visibilidade cinematográfica impecável da linha inteira na TV.
 * - HORIZONTAL TRACK SCROLLING: Ao navegar entre cards da mesma trilha (ArrowLeft / ArrowRight), rola apenas
 *   o eixo inline ('center') sem perturbar o scroll vertical.
 * - REPEAT THROTTLE: Cadência de ~55ms só para auto-repeat; pressões discretas permanecem imediatas.
 * - SINGLE SCROLL: Foco sem scroll implícito, seguido de uma rolagem agrupada por frame.
 */

import { useEffect, useCallback, useRef } from 'react';
import { parentalControls, parentalDpadTarget, parentalEntry } from '../parental-dpad-navigation.ts';

interface UseDpadNavigationOptions {
  onBack?: () => void;
  enabled?: boolean;
  autoFocusFirst?: boolean;
}

function isFocusable(el: Element | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (!el.classList.contains('focusable-item')) return false;
  if ((el as any).disabled) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  return true;
}

type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
interface GridNavigation { cards: HTMLElement[]; columns: number; }

function focusableSibling(current: HTMLElement, forward: boolean): HTMLElement | null {
  let sibling = forward ? current.nextElementSibling : current.previousElementSibling;
  while (sibling) {
    if (isFocusable(sibling)) return sibling;
    sibling = forward ? sibling.nextElementSibling : sibling.previousElementSibling;
  }
  return null;
}

function adjacentRailTarget(current: HTMLElement, forward: boolean, preferAction = false): HTMLElement | null {
  const rail = current.closest('.media-rail');
  const main = current.closest('main');
  if (!rail || !main) return null;
  const rails = Array.from(main.querySelectorAll('.media-rail'));
  const index = rails.indexOf(rail);
  if (index < 0) return null;
  const currentCards = Array.from(rail.querySelector('.media-rail-track')?.children || []).filter(isFocusable);
  const column = Math.max(0, currentCards.indexOf(current));
  for (let next = index + (forward ? 1 : -1); next >= 0 && next < rails.length; next += forward ? 1 : -1) {
    const cards = Array.from(rails[next].querySelector('.media-rail-track')?.children || []).filter(isFocusable);
    if (!cards.length) continue;
    const action = preferAction ? rails[next].querySelector('.rail-view-all') : null;
    return isFocusable(action) ? action : cards[Math.min(column, cards.length - 1)];
  }
  return null;
}

function pageHeroControls(scope: ParentNode): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>('.hero-actions .focusable-item, .detail-hero-wide .detail-actions .focusable-item'))
    .filter(control => isFocusable(control) && !control.closest('.modal-content, .player-overlay, [hidden], [aria-hidden="true"]')
      && control.getClientRects().length > 0);
}

function pageHeroTarget(current: HTMLElement): HTMLElement | null {
  return pageHeroControls(current.closest('main') || document)[0] || null;
}

function findNextDpadTarget(current: HTMLElement, key: Direction, previousContent: HTMLElement | null, grids: WeakMap<Element, GridNavigation>): HTMLElement | null {
  const sideShell = current.closest('.app-shell--side-nav');
  const sideMenu = sideShell && !current.closest('.modal-content, .player-overlay')
    ? sideShell.querySelector<HTMLElement>('.header-nav .nav-link.active') || sideShell.querySelector<HTMLElement>('.header-nav .focusable-item')
    : null;
  if (sideMenu && key === 'ArrowLeft' && current.closest('[data-dpad-region="live-categories"]')) return sideMenu;
  const pageBack = sideMenu ? sideShell?.querySelector<HTMLElement>('.page-back-row .focusable-item') : null;
  const parentalPage = !current.closest('.modal-content, .player-overlay')
    ? current.closest('.parental-page') : null;
  if (parentalPage && !current.closest('.catalog-grid')) return parentalDpadTarget(parentalPage, current, key, pageBack || null, sideMenu);
  if (pageBack && key === 'ArrowUp' && current.closest('.filter-bar, .hero-actions, .detail-hero-wide .detail-actions')) return pageBack;
  if (sideMenu && current.closest('.page-back-row')) {
    if (key === 'ArrowDown') {
      const content = sideShell?.querySelector('.app-content');
      const parental = content?.querySelector('.parental-page');
      if (parental) return parentalEntry(parental) || current;
      return (content ? pageHeroControls(content)[0] : null) || current;
    }
    if (key === 'ArrowLeft') return focusableSibling(current, false) || sideMenu;
    if (key === 'ArrowRight') return focusableSibling(current, true) || current;
  }
  // Episode actions can move horizontally when a resume notice is present.
  // Follow the mounted series hierarchy instead of comparing their geometry.
  const detail = !current.closest('.modal-content, .player-overlay') ? current.closest('.detail-page--wide') : null;
  const detailTabs = detail?.querySelector('.series-detail-tabs');
  if (detail && current.closest('.detail-hero-wide .detail-actions')) {
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const controls = pageHeroControls(detail), index = controls.indexOf(current);
      return controls[index + (key === 'ArrowRight' ? 1 : -1)] || (key === 'ArrowLeft' ? sideMenu : null) || current;
    }
    if (key === 'ArrowUp') return sideMenu || current;
  }
  if (detail && detailTabs) {
    const selectedTab = detailTabs.querySelector<HTMLElement>('.focusable-item[aria-selected="true"]:not([disabled])')
      || detailTabs.querySelector<HTMLElement>('.focusable-item:not([disabled])');
    const selectedSeason = detail.querySelector<HTMLElement>('.season-selector-tabs .active.focusable-item:not([disabled])')
      || detail.querySelector<HTMLElement>('.season-selector-tabs .focusable-item:not([disabled])');
    const episodes = Array.from(detail.querySelectorAll('.episodes-list .episode-card .focusable-item:not([disabled])')).filter(isFocusable);
    if (current.closest('.detail-hero-wide .detail-actions') && key === 'ArrowDown') return selectedTab || current;
    if (current.closest('.series-detail-tabs')) {
      if (key === 'ArrowLeft') return focusableSibling(current, false) || sideMenu || current;
      if (key === 'ArrowRight') return focusableSibling(current, true) || current;
      if (key === 'ArrowUp') return pageHeroTarget(current) || pageBack || sideMenu || current;
      if (key === 'ArrowDown') return selectedSeason || episodes[0]
        || detail.querySelector<HTMLElement>('.series-detail-panel .media-card:not([disabled])')
        || detail.querySelector<HTMLElement>('.series-detail-panel .focusable-item:not([disabled])') || current;
    }
    if (current.closest('.season-selector-tabs')) {
      if (key === 'ArrowUp') return selectedTab || pageHeroTarget(current) || current;
      if (key === 'ArrowDown') return episodes[0] || current;
      if (key === 'ArrowRight') return focusableSibling(current, true) || current;
      if (key === 'ArrowLeft') return focusableSibling(current, false) || sideMenu || current;
    }
    if (current.closest('.episodes-list')) {
      const index = episodes.indexOf(current);
      if (key === 'ArrowUp') return episodes[index - 1] || selectedSeason || selectedTab || pageHeroTarget(current) || current;
      if (key === 'ArrowDown') return episodes[index + 1] || current;
      if (key === 'ArrowLeft') return sideMenu || current;
      if (key === 'ArrowRight') return current;
    }
    if (current.closest('.series-detail-panel') && !current.closest('.media-rail')) {
      if (key === 'ArrowUp') return selectedTab || pageHeroTarget(current) || current;
      if (key === 'ArrowLeft') return sideMenu || current;
      if (key === 'ArrowRight' || key === 'ArrowDown') return current;
    }
    if (key === 'ArrowUp' && current.closest('.series-detail-panel .media-rail')) {
      return adjacentRailTarget(current, false) || selectedTab || pageHeroTarget(current) || current;
    }
  }
  // Category overview: the row action must be reachable without geometry scans.
  if (current.classList.contains('rail-view-all')) {
    const rail = current.closest('.media-rail');
    if (key === 'ArrowDown') return rail?.querySelector<HTMLElement>('.media-rail-track .focusable-item:not([disabled])') || null;
    if (key === 'ArrowLeft') return sideMenu || rail?.querySelector<HTMLElement>('.media-rail-track .focusable-item:not([disabled])') || null;
    if (key === 'ArrowUp') {
      return adjacentRailTarget(current, false, true) || pageHeroTarget(current) || sideMenu || null;
    }
  }
  // 1. FAST-PATH: Trilhas Horizontais de Mídia (.media-rail-track)
  const railTrack = current.closest('.media-rail-track');
  if (railTrack) {
    if (key === 'ArrowRight') return focusableSibling(current, true);
    if (key === 'ArrowLeft') return focusableSibling(current, false) || sideMenu;

    if (key === 'ArrowDown') {
      return adjacentRailTarget(current, true);
    }

    if (key === 'ArrowUp') {
      const currentRail = current.closest('.media-rail');
      if (currentRail) {
        const viewAll = currentRail.querySelector<HTMLElement>('.rail-view-all');
        if (isFocusable(viewAll)) return viewAll;
        const previous = adjacentRailTarget(current, false);
        if (previous) return previous;

        // Não há rail anterior: subida para o Hero ou Header
        const heroBtn = pageHeroTarget(current);
        if (heroBtn && isFocusable(heroBtn)) return heroBtn;

        const headerActive = document.querySelector<HTMLElement>('.header-nav .nav-link.active');
        if (headerActive && isFocusable(headerActive)) return headerActive;

        const headerFirst = document.querySelector<HTMLElement>('.header-nav .focusable-item:not([disabled])');
        if (headerFirst && isFocusable(headerFirst)) return headerFirst;
      }
      return null;
    }
  }

  // 2. FAST-PATH: Header / Navegação Superior (.header-nav, .app-header)
  const headerNav = current.closest('.header-nav, .app-header');
  if (headerNav) {
    if (sideShell) {
      const panel = sideShell.querySelector('.app-header');
      const items = Array.from(panel?.querySelectorAll('.focusable-item') || []).filter(isFocusable);
      const index = items.indexOf(current);
      if (key === 'ArrowUp') return index > 0 ? items[index - 1] : null;
      if (key === 'ArrowDown') return index >= 0 && index + 1 < items.length ? items[index + 1] : null;
      if (key === 'ArrowLeft') return null;
      const content = sideShell.querySelector('.app-content');
      const parental = content?.querySelector('.parental-page');
      if (parental) return previousContent && parentalControls(parental).includes(previousContent)
        ? previousContent : parentalEntry(parental) || pageBack || current;
      if (previousContent?.isConnected && isFocusable(previousContent) && content?.contains(previousContent)
        && previousContent.getClientRects().length > 0) return previousContent;
      return content?.querySelector<HTMLElement>('[data-dpad-region="live-categories"] .active-group.focusable-item:not([disabled])')
        || content?.querySelector<HTMLElement>('[data-dpad-region="live-categories"] .focusable-item:not([disabled])')
        || (content ? pageHeroControls(content)[0] : null)
        || content?.querySelector<HTMLElement>('.media-rail-track .focusable-item:not([disabled])')
        || content?.querySelector<HTMLElement>('main .focusable-item:not([disabled])')
        || content?.querySelector<HTMLElement>(':scope > :not(.page-back-row) .focusable-item:not([disabled])')
        || content?.querySelector<HTMLElement>('.focusable-item:not([disabled])') || null;
    }
    const items = Array.from(headerNav.querySelectorAll('.focusable-item')).filter(isFocusable);
    const idx = items.indexOf(current);

    if (key === 'ArrowRight') {
      if (idx >= 0 && idx + 1 < items.length) {
        return items[idx + 1];
      }
      return null;
    }

    if (key === 'ArrowLeft') {
      if (idx > 0) {
        return items[idx - 1];
      }
      return null;
    }

    if (key === 'ArrowDown') {
      const heroBtn = document.querySelector<HTMLElement>('.hero-actions .focusable-item:not([disabled])');
      if (heroBtn && isFocusable(heroBtn)) return heroBtn;

      const firstRailCard = document.querySelector<HTMLElement>('.media-rail-track .focusable-item:not([disabled])');
      if (firstRailCard && isFocusable(firstRailCard)) return firstRailCard;

      const firstMain = document.querySelector<HTMLElement>('main .focusable-item:not([disabled])');
      if (firstMain && isFocusable(firstMain)) return firstMain;
    }
    return null;
  }

  // 3. FAST-PATH: Hero Banner (.hero-banner)
  if (current.closest('.hero-banner')) {
    if (key === 'ArrowUp') {
      const headerActive = document.querySelector<HTMLElement>('.header-nav .nav-link.active');
      if (headerActive && isFocusable(headerActive)) return headerActive;

      const headerFirst = document.querySelector<HTMLElement>('.header-nav .focusable-item:not([disabled])');
      if (headerFirst && isFocusable(headerFirst)) return headerFirst;
    }

    if (key === 'ArrowDown') {
      const firstRailCard = document.querySelector<HTMLElement>('.media-rail-track .focusable-item:not([disabled])');
      if (firstRailCard && isFocusable(firstRailCard)) return firstRailCard;
    }
  }

  // 4. FAST-PATH: Grade de Catálogo (.catalog-grid)
  const grid = current.closest('.catalog-grid');
  if (grid) {
    let navigation = grids.get(grid);
    if (!navigation) {
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.focusable-item:not([disabled]):not([aria-hidden="true"])')).filter(isFocusable);
      const template = window.getComputedStyle(grid).gridTemplateColumns;
      const fallbackColumns = window.innerWidth >= 1280 ? 6 : window.innerWidth >= 1024 ? 5 : window.innerWidth >= 640 ? 4 : 2;
      const columns = template && template !== 'none' ? template.trim().split(/\s+/).length : fallbackColumns;
      navigation = { cards, columns };
      grids.set(grid, navigation);
    }
    const { cards, columns } = navigation;
    const index = cards.indexOf(current);

    if (index >= 0) {
      if (key === 'ArrowRight' && index + 1 < cards.length) {
        return cards[index + 1];
      }
      if (key === 'ArrowLeft') {
        if (sideMenu && index % columns === 0) return sideMenu;
        if (index - 1 >= 0) return cards[index - 1];
      }
      if (key === 'ArrowDown') {
        if (index + columns < cards.length) {
          return cards[index + columns];
        }
        const loadMore = document.querySelector<HTMLElement>('.btn-load-more.focusable-item');
        if (loadMore && isFocusable(loadMore)) return loadMore;
      }
      if (key === 'ArrowUp') {
        if (index - columns >= 0) {
          return cards[index - columns];
        }
        const firstFilter = document.querySelector<HTMLElement>('.filter-bar .focusable-item');
        if (firstFilter && isFocusable(firstFilter)) return firstFilter;
        if (pageBack && isFocusable(pageBack)) return pageBack;

        const headerFirst = document.querySelector<HTMLElement>('.header-nav .focusable-item');
        if (headerFirst && isFocusable(headerFirst)) return headerFirst;
      }
    }
  }

  // 5. FALLBACK: Busca Espacial Escopada (modais, formulários, telas avulsas)
  const scope = current.closest('.modal-content, .player-overlay, main')
    || (sideShell ? current.closest('.app-content') : null) || document.body;
  const currentRect = current.getBoundingClientRect();
  const cX = currentRect.left + currentRect.width / 2;
  const cY = currentRect.top + currentRect.height / 2;

  const candidates = Array.from(
    scope.querySelectorAll<HTMLElement>('.focusable-item:not([disabled]):not([aria-hidden="true"])')
  );

  let best: HTMLElement | null = null;
  let bestDist = Infinity;

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    if (cand === current) continue;

    const r = cand.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const tX = r.left + r.width / 2;
    const tY = r.top + r.height / 2;
    const dx = tX - cX;
    const dy = tY - cY;

    let valid = false;
    if (key === 'ArrowRight' && dx > 10 && Math.abs(dy) <= Math.abs(dx) * 1.5) valid = true;
    else if (key === 'ArrowLeft' && dx < -10 && Math.abs(dy) <= Math.abs(dx) * 1.5) valid = true;
    else if (key === 'ArrowDown' && dy > 10 && Math.abs(dx) <= Math.abs(dy) * 1.5) valid = true;
    else if (key === 'ArrowUp' && dy < -10 && Math.abs(dx) <= Math.abs(dy) * 1.5) valid = true;

    if (valid) {
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = cand;
      }
    }
  }

  return best || (key === 'ArrowLeft' && current.closest('.app-content') ? sideMenu : null);
}

export function useDpadNavigation(options: UseDpadNavigationOptions = {}): void {
  const { onBack, enabled = true, autoFocusFirst = true } = options;
  const lastKeyTimeRef = useRef<number>(0);
  const previousContentRef = useRef<HTMLElement | null>(null);
  const gridsRef = useRef(new WeakMap<Element, GridNavigation>());
  const scrollFrameRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const invalidate = () => { gridsRef.current = new WeakMap(); };
    const observer = new MutationObserver(invalidate);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-hidden', 'hidden', 'class', 'style'] });
    window.addEventListener('resize', invalidate);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', invalidate);
      invalidate();
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = 0;
      previousContentRef.current = null;
    };
  }, [enabled]);

  const scheduleScroll = useCallback((target: HTMLElement, key: Direction, current: HTMLElement | null) => {
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      if (!target.isConnected || document.activeElement !== target) return;
      const sideShell = target.closest('.app-shell--side-nav');
      if (sideShell && target.closest('.app-header')) {
        const panel = target.closest<HTMLElement>('.app-header')!;
        const bounds = panel.getBoundingClientRect(), rect = target.getBoundingClientRect();
        if (rect.top < bounds.top + 6) panel.scrollTop -= bounds.top + 6 - rect.top;
        else if (rect.bottom > bounds.bottom - 6) panel.scrollTop += rect.bottom - bounds.bottom + 6;
        return;
      }
      const pageHero = target.closest<HTMLElement>('.home-page .hero-banner, .movies-page .hero-banner, .series-page .hero-banner')
        || (!target.closest('.modal-content, .player-overlay') ? target.closest<HTMLElement>('.detail-page--wide .detail-hero-wide') : null);
      if (pageHero && target.closest('.app-shell--fire-stick')) {
        // Fire WebView can consume the page inset despite scroll-margin-top.
        const inset = parseFloat(getComputedStyle(pageHero).scrollMarginTop) || 0;
        window.scrollTo({ top: Math.max(0, window.scrollY + pageHero.getBoundingClientRect().top - inset), left: window.scrollX, behavior: 'auto' });
        return;
      }
      const track = target.closest<HTMLElement>('.media-rail-track');
      if ((key === 'ArrowLeft' || key === 'ArrowRight') && track && current?.closest('.media-rail-track') === track) {
        const bounds = track.getBoundingClientRect(), rect = target.getBoundingClientRect();
        if (rect.left < bounds.left + 6) track.scrollLeft -= bounds.left + 6 - rect.left;
        else if (rect.right > bounds.right - 6) track.scrollLeft += rect.right - bounds.right + 6;
        return;
      }
      if (sideShell && current?.closest('.app-header')) {
        target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
      } else if (key === 'ArrowDown' || key === 'ArrowUp') {
        (target.closest('.media-rail, .episode-card') || target).scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
      } else {
        target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
      }
    });
  }, []);

  // Release a departed page; one remembered control must not retain its DOM tree.
  useEffect(() => {
    if (previousContentRef.current && !previousContentRef.current.isConnected) previousContentRef.current = null;
  });

  // Foco inicial rápido
  useEffect(() => {
    if (!enabled || !autoFocusFirst) return;

    const timer = setTimeout(() => {
      const active = document.activeElement;
      const isAlreadyFocused = active && active.classList.contains('focusable-item');

      if (!isAlreadyFocused) {
        const first =
          document.querySelector<HTMLElement>('.header-nav .nav-link.active') ||
          document.querySelector<HTMLElement>('.hero-actions .focusable-item:not([disabled])') ||
          document.querySelector<HTMLElement>('.media-rail-track .focusable-item:not([disabled])') ||
          document.querySelector<HTMLElement>('.focusable-item:not([disabled]):not([aria-hidden="true"])');
        first?.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [enabled, autoFocusFirst]);

  // Manipulador de teclas direcionais de altíssimo desempenho
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || event.defaultPrevented) return;

      const { key } = event;

      // 1. Back / Escape
      if (key === 'Escape' || (key === 'Backspace' && !(event.target instanceof HTMLInputElement))) {
        if (onBack) {
          event.preventDefault();
          onBack();
          return;
        }
      }

      // 2. DPAD_CENTER / Enter / Espaço
      if (key === 'Enter' || (event as any).keyCode === 23 || key === ' ') {
        const active = document.activeElement as HTMLElement;
        // Preserve the trusted native activation/IME and spaces in a PUK.
        // The parental page separately rejects implicit submission from inputs.
        if (active instanceof HTMLInputElement && active.type !== 'checkbox'
          && active.closest('.parental-page')) return;
        if (active && active.classList.contains('focusable-item')) {
          active.click();
          event.preventDefault();
          return;
        }
      }

      // 3. Teclas direcionais
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        return;
      }

      const focused = document.activeElement as HTMLElement | null;
      if ((key === 'ArrowLeft' || key === 'ArrowRight') && focused?.closest('.app-shell--side-nav')
        && (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement || focused.isContentEditable)) {
        return;
      }

      // Interrompe imediatamente o scroll nativo concorrente do WebView!
      event.preventDefault();

      const now = performance.now();
      if (event.repeat && now - lastKeyTimeRef.current < 55) {
        return;
      }
      lastKeyTimeRef.current = now;

      const active = document.activeElement as HTMLElement | null;
      let current = isFocusable(active) ? active : null;

      if (!current) {
        const fallback =
          document.querySelector<HTMLElement>('.header-nav .nav-link.active') ||
          document.querySelector<HTMLElement>('.media-rail-track .focusable-item:not([disabled])') ||
          document.querySelector<HTMLElement>('.focusable-item:not([disabled])');
        if (fallback) {
          fallback.focus({ preventScroll: true });
          scheduleScroll(fallback, key as Direction, null);
        }
        return;
      }

      const sideShell = current.closest('.app-shell--side-nav');
      if (sideShell && current.closest('.app-content') && !current.closest('.modal-content, .player-overlay')) {
        previousContentRef.current = current;
      }
      const target = findNextDpadTarget(current, key as Direction, previousContentRef.current, gridsRef.current);
      if (target) {
        target.focus({ preventScroll: true });
        scheduleScroll(target, key as Direction, current);
      }
    },
    [enabled, onBack, scheduleScroll]
  );

  useEffect(() => {
    const handleHeroFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.closest('.app-shell--fire-stick')
        || !(target.closest('.home-page .hero-banner, .movies-page .hero-banner, .series-page .hero-banner')
          || (!target.closest('.modal-content, .player-overlay') && target.closest('.detail-page--wide .detail-hero-wide')))) return;
      scheduleScroll(target, 'ArrowUp', null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('focusin', handleHeroFocus);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('focusin', handleHeroFocus); };
  }, [handleKeyDown, scheduleScroll]);
}
