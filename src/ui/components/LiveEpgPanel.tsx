import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LiveChannel } from '../../catalog/live/live-tv.types.ts';
import { liveEpgService, type LiveEpgResult } from '../../catalog/live/live-epg.service.ts';

interface LiveEpgPanelProps {
  channel: LiveChannel;
  open: boolean;
  onToggle: () => void;
  inline?: boolean;
  embedded?: boolean;
}

function EpgSchedule({ channel }: { channel: LiveChannel }) {
  const [result, setResult] = useState<LiveEpgResult | null>(null);
  const [now, setNow] = useState(Date.now);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false, controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort(); controller = new AbortController();
      const request = controller;
      const next = await liveEpgService.load(channel, request.signal);
      if (!disposed && !request.signal.aborted) { setNow(Date.now()); setResult(next); }
    };
    setResult(null);
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 60000);
    const clock = setInterval(() => setNow(Date.now()), 15000);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); clearInterval(clock); };
  }, [channel, retry]);
  const programs = result?.status === 'ready' ? result.programs.filter(p => p.end > now) : [];
  const current = programs.find(p => p.start <= now && now < p.end);
  const format = (date: number) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const date = (time: number) => new Date(time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return <>
    <h3 className="live-epg-channel-name">{channel.name}</h3>
    {!result ? <p className="live-epg-message" role="status"><span className="live-epg-spinner" aria-hidden="true"/>Carregando programação…</p>
      : result.status === 'error' ? <div className="live-epg-message" role="status"><p>Não foi possível carregar a programação.</p><button type="button" className="focusable-item live-epg-retry" onClick={() => setRetry(v => v + 1)}>Tentar novamente</button></div>
      : !programs.length ? <p className="live-epg-message" role="status">{result.status === 'unavailable' && result.reason === 'unauthorized' ? 'Acesso à programação indisponível. Verifique a autorização da fonte.' : 'Programação indisponível para este canal. A fonte não forneceu uma grade compatível.'}</p>
      : <>
        {!current && <p className="live-epg-message">A fonte não informou o programa atual.</p>}
        <ol className="live-epg-programs">{programs.map(program => {
          const active = program === current;
          return <li key={program.id} className={active ? 'live-epg-program live-epg-program--current' : 'live-epg-program'}>
            <div className="live-epg-program-time"><span>{active ? 'Agora' : 'A seguir'}</span><time dateTime={new Date(program.start).toISOString()}>{date(program.start)} · {format(program.start)} – {format(program.end)}</time></div>
            <strong>{program.title}</strong>
            {program.description && <p>{program.description}</p>}
            {active && <progress aria-label="Progresso do programa atual" max={program.end - program.start} value={Math.min(program.end - program.start, Math.max(0, now - program.start))}/>}
          </li>;
        })}</ol>
        <p className="live-epg-source-note">Horários locais. Programação fornecida pela fonte do canal.</p>
      </>}
  </>;
}

export function LiveEpgPanel({ channel, open, onToggle, inline = false, embedded = false }: LiveEpgPanelProps) {
  const panel = useRef<HTMLElement>(null), toggle = useRef<HTMLButtonElement>(null), wasOpen = useRef(false);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    if (inline) return;
    const page = panel.current?.closest<HTMLElement>('.live-tv-page'), preview = page?.querySelector<HTMLElement>('.live-preview-section');
    if (!page || !preview) return;
    let frame = 0;
    const measure = () => {
      const pageRect = page.getBoundingClientRect();
      const scale = page.offsetHeight > 0 ? pageRect.height / page.offsetHeight : 1;
      const next = preview.offsetParent === page ? preview.offsetTop + preview.offsetHeight : (preview.getBoundingClientRect().bottom - pageRect.top) / (scale || 1);
      setTop(Math.max(0, next));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure(); schedule();
    const timers = [80, 250, 600].map(delay => setTimeout(schedule, delay));
    const observer = new ResizeObserver(schedule);
    observer.observe(page); observer.observe(preview);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame); timers.forEach(clearTimeout);
      window.removeEventListener('resize', schedule); window.removeEventListener('orientationchange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
    };
  }, [open, inline]);
  useEffect(() => {
    if (wasOpen.current && !open && !inline) toggle.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open, inline]);
  return <section ref={panel} className={`live-mobile-epg${inline ? ' live-epg-inline' : ''}${open ? ' live-mobile-epg--open' : ''}${embedded ? ' live-epg-embedded focusable-item' : ''}`} tabIndex={embedded ? 0 : undefined} style={inline ? undefined : { top }} aria-label="Guia de programação do canal"
    onKeyDown={embedded ? event => {
      if(event.target!==event.currentTarget||!['ArrowDown','ArrowUp'].includes(event.key))return;
      const content=panel.current?.querySelector<HTMLElement>('.live-epg-content');if(!content)return;
      const down=event.key==='ArrowDown';if((down&&content.scrollTop+content.clientHeight>=content.scrollHeight-1)||(!down&&content.scrollTop<=0))return;
      event.preventDefault();event.stopPropagation();content.scrollBy({top:down?64:-64,behavior:'auto'});
    } : undefined}>
    {inline ? <h2 className="live-epg-inline-heading">Guia de Programação (EPG)</h2> : <button ref={toggle} type="button" className="focusable-item live-epg-toggle" aria-expanded={open} aria-controls="live-mobile-epg-content" onClick={onToggle}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-12 4h3m-3 3h7"/></svg>
      <span>Guia de Programação (EPG)</span>
      <svg className="live-epg-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>
    </button>}
    <div id="live-mobile-epg-content" className="live-epg-content" role="region" aria-label={`Programação de ${channel.name}`} aria-hidden={!open}>
      {open && <EpgSchedule key={channel.id} channel={channel}/>}
    </div>
  </section>;
}
