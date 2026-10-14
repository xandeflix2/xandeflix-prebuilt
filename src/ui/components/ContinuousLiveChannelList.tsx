import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LiveChannel } from '../../catalog/live/live-tv.types.ts';
import type { LiveChannelPage } from '../../catalog/live/live-catalog.service.ts';

export const LIVE_ROW_HEIGHT = 64;
const PAGE_SIZE = 48;
export function liveVisibleWindow(top: number, height: number, total: number) {
  const start = Math.min(Math.max(0, total - 1), Math.max(0, Math.floor(top / LIVE_ROW_HEIGHT) - 6));
  const end = Math.min(total, start + Math.min(48, Math.ceil(height / LIVE_ROW_HEIGHT) + 12));
  return { start, end, offsets: Array.from(new Set(Array.from({ length: Math.max(0, end - start) }, (_, i) => Math.floor((start + i) / PAGE_SIZE) * PAGE_SIZE))) };
}

interface Props {
  total: number;
  seed?: LiveChannelPage;
  selectedId?: string;
  request: { offset: number; nonce: number; focus: boolean };
  loadPage: (offset: number, signal: AbortSignal) => Promise<LiveChannelPage>;
  onSelect: (channel: LiveChannel) => void;
  onWindowPage?: (page: LiveChannelPage) => void;
}

/** Continuous scroll over local pages; only the visible rows and three pages live in RAM. */
export function ContinuousLiveChannelList({ total, seed, selectedId, request, loadPage, onSelect, onWindowPage }: Props) {
  const list = useRef<HTMLDivElement>(null);
  const pages = useRef(new Map<number, LiveChannelPage>());
  const controller = useRef<AbortController | null>(null);
  const worker = useRef<symbol | null>(null);
  const pendingFocus = useRef<number | null>(null);
  const appliedRequest = useRef(-1);
  const [revision, setRevision] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(400);
  const [count, setCount] = useState(total);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const range = useMemo(() => liveVisibleWindow(scrollTop, height, count), [scrollTop, height, count]);
  const desired = useRef(range); desired.current = range;
  const loader = useRef(loadPage); loader.current = loadPage;

  useEffect(() => {
    const active = new AbortController(); controller.current = active;
    return () => { active.abort(); worker.current = null; pages.current.clear(); };
  }, []);
  useEffect(() => {
    if (!seed?.channels.length || pages.current.get(seed.offset) === seed) return;
    pages.current.set(seed.offset, seed);
    while (pages.current.size > 3) pages.current.delete(pages.current.keys().next().value!);
    setCount(seed.totalAvailable); setRevision(value => value + 1);
  }, [seed]);
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const measure = () => setHeight(element.clientHeight || 400);
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined;
    observer?.observe(element); window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  useEffect(() => {
    const element = list.current;
    if (!element || appliedRequest.current === request.nonce) return;
    const position = seed?.offset === request.offset ? seed.channels.findIndex(channel => channel.id === selectedId) : -1;
    const index = request.offset + Math.max(0, position);
    if (index > 0 && count === 0) return;
    appliedRequest.current = request.nonce;
    if (request.focus) pendingFocus.current = index;
    element.scrollTop = index * LIVE_ROW_HEIGHT;
    setScrollTop(element.scrollTop);
  }, [request.nonce, count]);

  useEffect(() => {
    const active = controller.current;
    if (!active || active.signal.aborted || worker.current) return;
    const token = Symbol(); worker.current = token;
    const current = () => !active.signal.aborted && controller.current === active && worker.current === token;
    void (async () => {
      try {
        while (current()) {
          const offsets = desired.current.offsets.length ? desired.current.offsets : [0];
          const offset = offsets.find(value => !pages.current.has(value));
          if (offset === undefined) break;
          setLoading(true);
          const page = await loader.current(offset, active.signal);
          if (!current()) return;
          if (page.offset !== offset || page.channels.length > PAGE_SIZE || page.totalAvailable < offset + page.channels.length) throw new Error('LIVE_WINDOW_INVALID');
          if (page.totalAvailable > offset && !page.channels.length) throw new Error('LIVE_WINDOW_INCOMPLETE');
          pages.current.delete(offset); pages.current.set(offset, page);
          const protect = new Set(desired.current.offsets);
          while (pages.current.size > 3) {
            const victim = [...pages.current.keys()].find(key => !protect.has(key));
            if (victim === undefined) throw new Error('LIVE_WINDOW_LIMIT');
            pages.current.delete(victim);
          }
          setCount(page.totalAvailable); setRevision(value => value + 1);
          if (!page.totalAvailable) break;
        }
      } catch { if (current()) setError(true); }
      finally { if (current()) { worker.current = null; setLoading(false); } }
    })();
  }, [range.start, range.end, retry, revision]);

  useEffect(() => {
    const page = pages.current.get(Math.floor(scrollTop / LIVE_ROW_HEIGHT / PAGE_SIZE) * PAGE_SIZE);
    if (page) onWindowPage?.(page);
    const index = pendingFocus.current;
    const target = index !== null ? list.current?.querySelector<HTMLElement>(`[data-live-index="${index}"]`) : null;
    if (target) { pendingFocus.current = null; target.focus({ preventScroll: true }); }
  }, [revision, range.start, scrollTop, onWindowPage]);

  const moveFocus = useCallback((index: number) => {
    const element = list.current;
    if (!element) return;
    pendingFocus.current = index;
    const top = index * LIVE_ROW_HEIGHT, bottom = top + LIVE_ROW_HEIGHT;
    if (top < element.scrollTop) element.scrollTop = top;
    else if (bottom > element.scrollTop + element.clientHeight) element.scrollTop = bottom - element.clientHeight;
    setScrollTop(element.scrollTop); setRevision(value => value + 1);
  }, []);
  const rows = Array.from({ length: Math.max(0, range.end - range.start) }, (_, i) => {
    const index = range.start + i, offset = Math.floor(index / PAGE_SIZE) * PAGE_SIZE;
    return { index, channel: pages.current.get(offset)?.channels[index - offset] };
  });
  return <div ref={list} className="live-channel-list live-channel-list--continuous" aria-label="Canais da categoria" aria-busy={loading}
    onScroll={event => { setScrollTop(event.currentTarget.scrollTop); }}>
    {error && <div className="live-window-status" role="alert">Não foi possível carregar os canais.
      <button type="button" className="focusable-item" onClick={() => { setError(false); setRetry(value => value + 1); }}>Tentar novamente</button>
    </div>}
    {!error && loading && <div className="live-window-status" role="status">Carregando canais…</div>}
    {!error && !loading && count === 0 && <div className="live-window-empty">Nenhum canal encontrado.</div>}
    <div className="live-channel-window" role="list" style={{ height: count * LIVE_ROW_HEIGHT }}>
      {rows.map(({ index, channel }) => <div key={index} role="listitem" aria-posinset={index + 1} aria-setsize={count}
        className="live-channel-window-row" style={{ top: index * LIVE_ROW_HEIGHT, height: LIVE_ROW_HEIGHT }}>
        {channel ? <button type="button" data-live-channel={channel.id} data-live-index={index}
          className={`focusable-item live-continuous-channel${channel.id === selectedId ? ' active-channel' : ''}`}
          onClick={() => onSelect(channel)} onKeyDown={event => {
            const direction = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
            const next = index + direction;
            if (direction && next >= 0 && next < count) { event.preventDefault(); event.stopPropagation(); moveFocus(next); }
          }}>
          {channel.logoUrl ? <img src={channel.logoUrl} alt="" loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }}/>
            : <span className="live-continuous-logo" aria-hidden="true">📺</span>}
          <span className="live-continuous-info"><span className="live-continuous-name">{channel.name}</span>
            <span className="live-continuous-format">{channel.num ? `Canal #${channel.num}` : channel.streamRef?.containerExtension?.toUpperCase() || 'LIVE'}</span></span>
          {channel.id === selectedId && <span aria-hidden="true">▶</span>}
        </button> : <div className="live-channel-placeholder" aria-hidden="true"/>}
      </div>)}
    </div>
  </div>;
}
