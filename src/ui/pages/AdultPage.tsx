import { useEffect, useRef, useState } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { AdultCatalogReader } from '../../catalog/adult-catalog-reader.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { parentalControl } from '../../parental/parental-control.store.ts';
import { parentalErrorMessage } from '../../parental/parental-access.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import { CatalogGrid } from '../components/CatalogGrid.tsx';
import './AdultPage.css';

export function AdultPage({ readModel, onSelectItem, onOpenParental }: { readModel: CatalogReadModel;
  onSelectItem: (item: CatalogItemViewModel) => void; onOpenParental: () => void }) {
  const state = useParentalControl(), root = useRef<HTMLElement>(null);
  const allowed = state.status === 'ready' && state.policy.allowAdult && state.policy.maxAge === 18 && state.adultSession;
  const [items, setItems] = useState<CatalogItemViewModel[]>([]), [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const reader = useRef<AdultCatalogReader>(), reading = useRef(false), controller = useRef<AbortController>();
  const prompt = useRef<AbortController>(), requested = useRef(false);
  const unlock = async () => {
    prompt.current?.abort(); const request = new AbortController(); prompt.current = request; setError('');
    try { await parentalControl.requestAdultSession(request.signal); }
    catch (e) { if (!request.signal.aborted) setError(parentalErrorMessage(e)); }
  };
  useEffect(() => {
    if (!requested.current && state.status !== 'loading') { requested.current = true; if (!allowed) void unlock(); }
  }, [state.status, allowed]);
  useEffect(() => () => prompt.current?.abort(), []);
  const load = async (active = reader.current, request = controller.current) => {
    if (!active || !request || request.signal.aborted || reading.current) return;
    reading.current = true; setLoading(true); setError('');
    try {
      const page = await active.loadNext(request.signal);
      if (!request.signal.aborted) { setItems(previous => [...previous, ...page.items]); setHasMore(page.hasMore); }
    } catch { if (!request.signal.aborted) setError('Não foi possível carregar esta parte do catálogo. Tente novamente.'); }
    finally { if (controller.current === request) { reading.current = false; if (!request.signal.aborted) setLoading(false); } }
  };
  useEffect(() => {
    setItems([]); setHasMore(false); setError(''); reading.current = false;
    if (!allowed) { setLoading(false); return; }
    const active = new AdultCatalogReader(readModel, getClientBootstrapService().getStorage()), request = new AbortController();
    reader.current = active; controller.current = request; void load(active, request);
    return () => { request.abort(); active.dispose(); };
  }, [allowed, readModel]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const first = root.current?.querySelector<HTMLElement>('.focusable-item:not([disabled])');
      if (first && !document.querySelector('.parental-dialog[open]')) first.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [allowed]);
  return <main ref={root} className="page-container adult-page"><h1>Área 18+</h1>
    {!allowed ? <section className="adult-gate"><p>Área protegida pelo controle parental deste aparelho.</p>
      <button type="button" className="focusable-item btn-primary" disabled={state.busy || state.status === 'loading'} onClick={() => void unlock()}>Entrar com PIN</button>
      <button type="button" className="focusable-item btn-secondary" onClick={onOpenParental}>Configurar controle parental</button>
      {error && <p role="alert">{error}</p>}</section>
      : <><div className="adult-actions"><p>Filmes e séries adultos da fonte ativa.</p><button type="button" className="focusable-item btn-secondary" onClick={() => parentalControl.lock()}>Bloquear área</button></div>
        {error && <p role="alert">{error}</p>}
        <CatalogGrid items={items} getItemKey={item => `${item.kind}:${item.id}`} onItemClick={onSelectItem}
          emptyMessage={loading ? 'Carregando conteúdo protegido…' : error || 'Nenhum filme ou série adulto encontrado na fonte ativa.'}
          hasMoreRemote={hasMore} isLoadingRemote={loading} onLoadMoreRemote={() => load()} loadMoreFailed={Boolean(error)}/>
        {error && <button type="button" className="focusable-item btn-secondary" onClick={() => void load()}>Tentar novamente</button>}</>}
  </main>;
}
