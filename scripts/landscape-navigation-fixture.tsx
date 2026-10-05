import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '../src/ui/components/AppShell.tsx';
import { Hero } from '../src/ui/components/Hero.tsx';
import { MediaRail } from '../src/ui/components/MediaRail.tsx';
import { MediaCard } from '../src/ui/components/MediaCard.tsx';
import { LiveTvPage } from '../src/ui/pages/LiveTvPage.tsx';
import { useDpadNavigation } from '../src/ui/hooks/useDpadNavigation.ts';
import { createInitialRoute, navigateBack, navigateTo, type AppView } from '../src/ui/navigation/route-state.ts';
import type { CatalogItemViewModel } from '../src/catalog/catalog-view-model.ts';
import '../src/index.css';

// No App, activation, source, storage or external network; actual UI/hook/routes.
const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
const add = window.addEventListener.bind(window);
const remove = window.removeEventListener.bind(window);
window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
  if (['keydown', 'resize', 'orientationchange'].includes(type)) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(listener);
  }
  add(type, listener, options);
}) as typeof window.addEventListener;
window.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
  listeners.get(type)?.delete(listener);
  remove(type, listener, options);
}) as typeof window.removeEventListener;
const items: CatalogItemViewModel[] = Array.from({ length: 24 }, (_, i) => ({
  id: `fixture-${i}`, kind: i % 2 ? 'series' : 'movie', title: `Conteúdo de teste ${i + 1}`,
  genreLabels: ['Exemplo'], categoryLabels: ['Teste local'],
}));

function Fixture() {
  const [navigation, setNavigation] = useState(createInitialRoute);
  const [overlay, setOverlay] = useState<'modal-content' | 'player-overlay' | null>(null);
  const onNavigate = useCallback((view: AppView) => { setNavigation(state => navigateTo(state, view)); window.scrollTo(0, 0); }, []);
  const onBack = useCallback(() => { setNavigation(navigateBack); window.scrollTo(0, 0); }, []);
  const onSelect = useCallback((item: CatalogItemViewModel) => {
    setNavigation(state => navigateTo(state, item.kind === 'movie' ? 'movie-detail' : 'series-detail', item.id));
    window.scrollTo(0, 0);
  }, []);
  useDpadNavigation({ onBack });
  const view = navigation.current.view;
  const Content = view === 'live' ? 'div' : 'main';
  return (
    <AppShell currentView={view} onNavigate={onNavigate} onBack={onBack} canGoBack={navigation.history.length > 0}
      snapshotId="synthetic-only" catalogVersion="Teste local">
      <Content className="page-container">
        <p data-testid="route" style={{ display: 'none' }}>Rota: {view}</p>
        {view === 'home' ? <>
          <Hero item={items[0]} onSelect={onSelect} />
          {Array.from({ length: 16 }, (_, i) => <MediaRail key={i} id={`fixture-${i}`} title={`Categoria de teste ${i + 1}`} items={items} onItemClick={onSelect} />)}
        </> : view === 'live' ? <LiveTvPage onBack={onBack} /> : view === 'movies' || view === 'series' ? <>
          <div className="page-header"><h1 className="page-title">{view === 'movies' ? 'Filmes' : 'Séries'}</h1><p className="page-subtitle">Catálogo de teste local</p></div>
          <div className="catalog-grid">
          {items.map(item => <MediaCard key={item.id} item={item} onClick={onSelect} />)}
        </div></> : view === 'search' ? <>
          <h1>Busca local de teste</h1>
          <input className="focusable-item" aria-label="Buscar teste" defaultValue="Teste" style={{ margin: 20, padding: 12 }} />
          <button className="focusable-item btn-secondary" onClick={() => {}}>Buscar</button>
        </> : <>
          <h1>{view === 'activation' ? 'Ativação — somente rota, sem dados reais' : 'Detalhes de teste'}</h1>
          <button className="focusable-item btn-secondary" onClick={() => {}}>Ação de teste</button>
        </>}
        <button id="open-modal" className="focusable-item btn-secondary" onClick={() => setOverlay('modal-content')}>Modal de teste</button>
        <button id="open-player-overlay" className="focusable-item btn-secondary" onClick={() => setOverlay('player-overlay')}>Overlay de teste</button>
        {overlay && <div className={overlay} style={{ position: 'fixed', top: 80, left: 300, padding: 32, background: '#151d30', zIndex: 1000 }}>
          <button id="overlay-first" className="focusable-item btn-secondary">Primeiro controle</button>
          <button className="focusable-item btn-secondary" onClick={() => setOverlay(null)}>Fechar</button>
        </div>}
      </Content>
    </AppShell>
  );
}

function Root() {
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    (window as any).__SIDE_NAV_FIXTURE__ = {
      unmount: () => setMounted(false),
      listenerCounts: () => Object.fromEntries(Array.from(listeners, ([key, callbacks]) => [key, callbacks.size])),
    };
  }, []);
  return mounted ? <Fixture /> : <p>Fixture desmontada</p>;
}
createRoot(document.getElementById('root')!).render(<Root />);
