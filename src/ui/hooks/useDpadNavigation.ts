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
 * - ANTI-BUFFERING THROTTLE: Cadência de ~55ms com preventDefault() imediato, eliminando concorrência
 *   com o scroll nativo do WebView e descartando acúmulo de eventos em rajada.
 */

import { useEffect, useCallback, useRef } from 'react';

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

function findNextDpadTarget(current: HTMLElement, key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'): HTMLElement | null {
  // 1. FAST-PATH: Trilhas Horizontais de Mídia (.media-rail-track)
  const railTrack = current.closest('.media-rail-track');
  if (railTrack) {
    const currentCards = Array.from(railTrack.children).filter(isFocusable);
    const currentIdx = currentCards.indexOf(current);

    if (key === 'ArrowRight') {
      if (currentIdx >= 0 && currentIdx + 1 < currentCards.length) {
        return currentCards[currentIdx + 1];
      }
      return null;
    }

    if (key === 'ArrowLeft') {
      if (currentIdx > 0) {
        return currentCards[currentIdx - 1];
      }
      return null;
    }

    if (key === 'ArrowDown') {
      const currentRail = current.closest('.media-rail');
      if (currentRail) {
        const currentCards = Array.from(railTrack.children).filter(isFocusable) as HTMLElement[];
        const currentIdx = currentCards.indexOf(current);

        let nextRail = currentRail.nextElementSibling as HTMLElement | null;
        while (nextRail) {
          if (nextRail.classList.contains('media-rail')) {
            const track = nextRail.querySelector('.media-rail-track');
            if (track) {
              const cards = Array.from(track.children).filter(isFocusable) as HTMLElement[];
              if (cards.length > 0) {
                const targetIdx = Math.max(0, Math.min(currentIdx >= 0 ? currentIdx : 0, cards.length - 1));
                return cards[targetIdx];
              }
            }
          }
          nextRail = nextRail.nextElementSibling as HTMLElement | null;
        }
      }
      return null;
    }

    if (key === 'ArrowUp') {
      const currentRail = current.closest('.media-rail');
      if (currentRail) {
        const currentCards = Array.from(railTrack.children).filter(isFocusable) as HTMLElement[];
        const currentIdx = currentCards.indexOf(current);

        let prevRail = currentRail.previousElementSibling as HTMLElement | null;
        while (prevRail) {
          if (prevRail.classList.contains('media-rail')) {
            const track = prevRail.querySelector('.media-rail-track');
            if (track) {
              const cards = Array.from(track.children).filter(isFocusable) as HTMLElement[];
              if (cards.length > 0) {
                const targetIdx = Math.max(0, Math.min(currentIdx >= 0 ? currentIdx : 0, cards.length - 1));
                return cards[targetIdx];
              }
            }
          }
          prevRail = prevRail.previousElementSibling as HTMLElement | null;
        }

        // Não há rail anterior: subida para o Hero ou Header
        const heroBtn = document.querySelector<HTMLElement>('.hero-actions .focusable-item:not([disabled])');
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
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.focusable-item:not([disabled])'));
    const index = cards.indexOf(current);

    if (index >= 0) {
      const columns = window.innerWidth >= 1280 ? 6 : window.innerWidth >= 1024 ? 5 : window.innerWidth >= 640 ? 4 : 2;

      if (key === 'ArrowRight' && index + 1 < cards.length) {
        return cards[index + 1];
      }
      if (key === 'ArrowLeft' && index - 1 >= 0) {
        return cards[index - 1];
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

        const headerFirst = document.querySelector<HTMLElement>('.header-nav .focusable-item');
        if (headerFirst && isFocusable(headerFirst)) return headerFirst;
      }
    }
  }

  // 5. FALLBACK: Busca Espacial Escopada (modais, formulários, telas avulsas)
  const scope = current.closest('.modal-content, .player-overlay, main, body') || document.body;
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

  return best;
}

export function useDpadNavigation(options: UseDpadNavigationOptions = {}): void {
  const { onBack, enabled = true, autoFocusFirst = true } = options;
  const lastKeyTimeRef = useRef<number>(0);

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
      if (!enabled) return;

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

      // Interrompe imediatamente o scroll nativo concorrente do WebView!
      event.preventDefault();

      const now = performance.now();
      if (now - lastKeyTimeRef.current < 55) {
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
          fallback.focus();
          const fallbackRail = fallback.closest('.media-rail');
          if (fallbackRail) {
            fallbackRail.scrollIntoView({ behavior: 'auto', block: 'center' });
          } else {
            fallback.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
          }
        }
        return;
      }

      const target = findNextDpadTarget(current, key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight');
      if (target) {
        target.focus();

        if (key === 'ArrowDown' || key === 'ArrowUp') {
          const targetRail = target.closest('.media-rail');
          if (targetRail) {
            // A LINHA/CATEGORIA FICA PERFEITAMENTE CENTRALIZADA VERTICALMENTE NA TELA:
            targetRail.scrollIntoView({ behavior: 'auto', block: 'center' });
          } else {
            target.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
          }
        } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
          // ROLAGEM HORIZONTAL DO TRACK SEM MOVER O EIXO VERTICAL:
          target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
        }
      }
    },
    [enabled, onBack]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
