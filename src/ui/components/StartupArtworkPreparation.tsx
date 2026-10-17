import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isStartupArtworkSettled, prepareStartupArtwork, sampleStartupArtwork, type StartupArtworkSample } from '../../artwork/startup-artwork-preparation.ts';
import type { StartupPoster } from '../../artwork/startup-catalog-preview.ts';
import { StartupLoadingScreen } from './StartupLoadingScreen.tsx';

let homePresented = false;

/** Fire-only startup presentation. The existing licensed catalog is already ready. */
export function StartupArtworkPreparation({ root, onPreparing, posters }: {
  root: React.RefObject<HTMLElement>; snapshot: string; posters?: readonly StartupPoster[]; onPreparing: (value: boolean) => void;
}) {
  const [active, setActive] = useState(false);
  const [sample, setSample] = useState<StartupArtworkSample | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const ownsPresentation = useRef(false);
  const finished = useRef(false);
  useLayoutEffect(() => {
    if (finished.current || (homePresented && !ownsPresentation.current)) return;
    // The child's layout effect can precede assignment of the parent's main ref.
    const element = anchor.current?.closest<HTMLElement>('.home-page') || root.current;
    if (!element) return;
    homePresented = true;
    ownsPresentation.current = true;
    if (!element.closest('.app-shell--fire-stick') || isStartupArtworkSettled(sampleStartupArtwork(element))) {
      finished.current = true;
      return;
    }
    const shell = element.closest<HTMLElement>('.app-shell');
    const previousIsolation = shell?.getAttribute('data-startup-isolated') ?? null;
    const wasInert = shell?.hasAttribute('inert');
    shell?.setAttribute('data-startup-isolated', '');
    shell?.setAttribute('inert', '');
    let restored = false;
    const restoreShell = () => {
      if (restored) return;
      restored = true;
      if (previousIsolation === null) shell?.removeAttribute('data-startup-isolated');
      else shell?.setAttribute('data-startup-isolated', previousIsolation);
      if (!wasInert) shell?.removeAttribute('inert');
    };
    let stopped = false, checked = false, shown = false;
    let cancel = () => {};
    const done = () => {
      if (stopped) return;
      stopped = true; cancel();
      finished.current = true;
      document.removeEventListener('keydown', keydown, true);
      element.classList.remove('home-page--startup-check');
      restoreShell();
      onPreparing(false); setActive(false);
      if (shown) element.querySelector<HTMLElement>('.hero-actions .focusable-item, .rail-view-all, .media-card')?.focus({ preventScroll: true });
    };
    const keydown = (event: KeyboardEvent) => {
      if (stopped) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ' ', 'Escape', 'BrowserBack', 'Backspace'].includes(event.key)
        || event.keyCode === 23) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    // Reserve the first paint, letting a fast Home skip the animation at 250 ms.
    // Mounted artwork keeps its geometry and the existing bounded eager loading.
    element.classList.add('home-page--startup-check');
    onPreparing(true);
    document.addEventListener('keydown', keydown, true);
    cancel = prepareStartupArtwork({
      sample: () => sampleStartupArtwork(element),
      update: sample => {
        setSample(previous => previous && previous.total === sample.total && previous.ready === sample.ready
          && previous.unavailable === sample.unavailable && previous.heroSettled === sample.heroSettled
          && previous.waitingRails === sample.waitingRails ? previous : sample);
        if (checked) return;
        checked = true;
        if (isStartupArtworkSettled(sample)) { done(); return; }
        shown = true; setActive(true);
      },
      finish: done,
    });
    return () => {
      stopped = true; cancel();
      element.classList.remove('home-page--startup-check');
      restoreShell();
      document.removeEventListener('keydown', keydown, true);
      onPreparing(false);
    };
  }, [root, onPreparing]);
  useLayoutEffect(() => {
    if (active) document.getElementById('startup-artwork-title')?.closest<HTMLElement>('[role="dialog"]')?.focus({ preventScroll: true });
  }, [active]);
  const percentage = sample && sample.total > 0 ? Math.min(sample.waitingRails ? 99 : 100,
    Math.round(100 * (sample.ready + sample.unavailable + Number(sample.heroSettled)) / (sample.total + 1))) : undefined;
  return <><span ref={anchor} hidden aria-hidden="true"/>{active && createPortal(<StartupLoadingScreen stage="artwork" modal
    className="startup-artwork-preparation modal-content" posters={posters} percentage={percentage}
    titleId="startup-artwork-title" messageId="startup-artwork-message"/>, document.body)}</>;
}
