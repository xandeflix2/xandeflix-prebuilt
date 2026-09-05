/**
 * Xandeflix Prebuilt — useDpadNavigation Hook (Gate G6)
 *
 * Baseline de navegação por teclado e D-pad para Android TV, Fire Stick e Desktop.
 *
 * Princípios:
 * - DOM FOCUS FIRST: Utiliza foco nativo do navegador e tabIndex previsível.
 * - SPATIAL BASICS: Navegação direcional entre elementos com classe 'focusable-item'.
 * - INPUT MODES COEXISTENCE: Não interfere com interações de mouse, touch ou scroll.
 * - BACK_RETURNS_PREVIOUS_VIEW: Tecla Escape/Backspace retorna para a view anterior.
 */

import { useEffect, useCallback } from 'react';

interface UseDpadNavigationOptions {
  onBack?: () => void;
  enabled?: boolean;
  autoFocusFirst?: boolean;
}

export function useDpadNavigation(options: UseDpadNavigationOptions = {}): void {
  const { onBack, enabled = true, autoFocusFirst = true } = options;

  // Busca todos os elementos navegáveis no DOM
  const getFocusableElements = useCallback((): HTMLElement[] => {
    const selector = '.focusable-item:not([disabled]):not([aria-hidden="true"])';
    return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.offsetParent !== null // elemento visível
    );
  }, []);

  // Foco inicial
  useEffect(() => {
    if (!enabled || !autoFocusFirst) return;

    const timer = setTimeout(() => {
      const active = document.activeElement;
      const isAlreadyFocused = active && active.classList.contains('focusable-item');

      if (!isAlreadyFocused) {
        const elements = getFocusableElements();
        if (elements.length > 0) {
          elements[0].focus();
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [enabled, autoFocusFirst, getFocusableElements]);

  // Manipulador de teclas direcionais
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { key } = event;

      // 1. Trata Back / Escape
      if (key === 'Escape' || (key === 'Backspace' && !(event.target instanceof HTMLInputElement))) {
        if (onBack) {
          event.preventDefault();
          onBack();
          return;
        }
      }

      // 2. Teclas direcionais
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        return;
      }

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const current = (document.activeElement as HTMLElement) || elements[0];
      const currentIndex = elements.indexOf(current);

      if (currentIndex === -1) {
        elements[0].focus();
        event.preventDefault();
        return;
      }

      // Cálculo espacial simplificado baseado em retângulos do DOM
      const currentRect = current.getBoundingClientRect();
      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      for (let i = 0; i < elements.length; i++) {
        if (i === currentIndex) continue;
        const candidate = elements[i];
        const candRect = candidate.getBoundingClientRect();

        let isEligible = false;

        if (key === 'ArrowRight' && candRect.left >= currentRect.left + 5) {
          // Candidato à direita
          isEligible = true;
        } else if (key === 'ArrowLeft' && candRect.right <= currentRect.right - 5) {
          // Candidato à esquerda
          isEligible = true;
        } else if (key === 'ArrowDown' && candRect.top >= currentRect.top + 5) {
          // Candidato abaixo
          isEligible = true;
        } else if (key === 'ArrowUp' && candRect.bottom <= currentRect.bottom - 5) {
          // Candidato acima
          isEligible = true;
        }

        if (isEligible) {
          // Distância euclidiana entre centros dos retângulos
          const dx = candRect.left + candRect.width / 2 - (currentRect.left + currentRect.width / 2);
          const dy = candRect.top + candRect.height / 2 - (currentRect.top + currentRect.height / 2);
          const distance = Math.hypot(dx, dy);

          if (distance < minDistance) {
            minDistance = distance;
            bestCandidate = candidate;
          }
        }
      }

      // Fallback linear se não encontrar candidato espacial
      if (!bestCandidate) {
        if (key === 'ArrowRight' || key === 'ArrowDown') {
          const nextIdx = (currentIndex + 1) % elements.length;
          bestCandidate = elements[nextIdx];
        } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
          const prevIdx = (currentIndex - 1 + elements.length) % elements.length;
          bestCandidate = elements[prevIdx];
        }
      }

      if (bestCandidate) {
        event.preventDefault();
        bestCandidate.focus();
        bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    },
    [enabled, onBack, getFocusableElements]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
