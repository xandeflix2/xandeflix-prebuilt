import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prepareStartupArtwork, sampleStartupArtwork } from '../../artwork/startup-artwork-preparation.ts';

const completed = new Set<string>();

/** Fire-only startup presentation. The existing licensed catalog is already ready. */
export function StartupArtworkPreparation({ root, snapshot, onPreparing }: {
  root: React.RefObject<HTMLElement>; snapshot: string; onPreparing: (value: boolean) => void;
}) {
  const [active, setActive] = useState(false);
  const enter = useRef<HTMLButtonElement>(null);
  const finish = useRef<() => void>(() => {});
  useEffect(() => {
    const element = root.current;
    if (!element || completed.has(snapshot)) return;
    let stopped = false, started = false;
    let cancel = () => {};
    let observer: MutationObserver | undefined;
    const done = () => {
      if (stopped) return;
      stopped = true; cancel();
      completed.add(snapshot);
      while (completed.size > 8) completed.delete(completed.values().next().value!);
      onPreparing(false); setActive(false);
      element.querySelector<HTMLElement>('.hero-actions .focusable-item, .rail-view-all, .media-card')?.focus({ preventScroll: true });
    };
    const keydown = (event: KeyboardEvent) => {
      if (stopped) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
        event.preventDefault(); event.stopImmediatePropagation(); enter.current?.focus({ preventScroll: true });
      } else if (event.key === 'Escape' || event.key === 'BrowserBack') {
        event.preventDefault(); event.stopImmediatePropagation(); done();
      }
    };
    const start = () => {
      if (stopped || started || !element.closest('.app-shell--fire-stick')) return;
      started = true; observer?.disconnect();
      onPreparing(true); setActive(true);
      cancel = prepareStartupArtwork({ sample: () => sampleStartupArtwork(element), update: () => {}, finish: done });
      finish.current = done;
      document.addEventListener('keydown', keydown, true);
    };
    start();
    const shell = element.closest('.app-shell');
    if (!started && shell && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(start);
      observer.observe(shell, { attributes: true, attributeFilter: ['class'] });
    }
    return () => { stopped = true; cancel(); observer?.disconnect(); document.removeEventListener('keydown', keydown, true); if (started) onPreparing(false); };
  }, [root, snapshot, onPreparing]);
  useLayoutEffect(() => {
    if (active) enter.current?.focus({ preventScroll: true });
  }, [active]);
  if (!active) return null;
  return <div className="startup-artwork-preparation" role="dialog" aria-modal="true" aria-labelledby="startup-artwork-title" aria-describedby="startup-artwork-message">
    <div className="startup-artwork-content">
      <div className="startup-loading-symbol" aria-hidden="true"><span className="startup-loading-orbit"/><span className="startup-loading-play"><svg viewBox="0 0 32 32"><path d="M12 7v18l14-9Z"/></svg></span></div>
      <h2 id="startup-artwork-title">A diversão já vai começar</h2>
      <p id="startup-artwork-message" role="status" aria-live="polite">Estamos preparando tudo para você.<br/>Aguarde só mais um instante.</p>
      <button ref={enter} type="button" className="btn-primary focusable-item" onClick={() => finish.current()}>Entrar agora</button>
    </div>
  </div>;
}
