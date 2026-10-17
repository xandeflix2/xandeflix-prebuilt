import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import type { HomeHeroOption } from '../../catalog/home-hero.service.ts';
import { useHeroLayout } from '../hooks/useHeroLayout.ts';
import { isFireTvPresentation } from '../device-presentation.ts';
import { Hero } from './Hero.tsx';
import { useHeroArtwork } from '../hooks/useHeroArtwork.ts';
import { HeroPreparing } from './CategoryHero.tsx';

interface HomeHeroProps {
  options: HomeHeroOption[];
  onSelect: (item: CatalogItemViewModel) => void;
  onPlay?: (item: CatalogItemViewModel) => void;
  playbackBusy?: boolean;
  playbackMessage?: string | null;
  nextBatch: () => Promise<boolean>;
  displayed: (option: HomeHeroOption) => void;
  contentKind?: 'movie' | 'series';
  headingLevel?: 1 | 2;
}

export function heroSwipeDirection(dx: number, dy: number, elapsed: number, width: number): 'next' | 'previous' | undefined {
  if (![dx, dy, elapsed, width].every(Number.isFinite) || elapsed < 0 || elapsed > 1500 || width <= 0) return;
  const threshold = Math.max(40, Math.min(80, width * 0.1));
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.4) return;
  return dx < 0 ? 'next' : 'previous';
}

export const HomeHero: React.FC<HomeHeroProps> = ({ options: incoming, onSelect, onPlay, playbackBusy, playbackMessage, nextBatch, displayed, contentKind, headingLevel = 1 }) => {
  const phone = useHeroLayout();
  const fireStick = typeof navigator !== 'undefined' && isFireTvPresentation(navigator.userAgent);
  const candidates = useMemo(() => contentKind ? incoming.filter(option => option.item.kind === contentKind) : incoming, [incoming, contentKind]);
  const items = useMemo(()=>candidates.map(option=>option.item),[candidates]);
  const artwork = useHeroArtwork(items,phone?'vertical':'horizontal',20,10);
  const options = useMemo(()=>{
    const counts={movie:0,series:0},freshCounts={movie:0,series:0};
    return candidates.filter(option=>{
      if(!artwork.eligible.some(v=>v.item.id===option.item.id&&v.item.kind===option.item.kind))return false;
      const bucket=option.fresh?freshCounts:counts;
      if(bucket[option.item.kind]>=5)return false;
      bucket[option.item.kind]++;return true;
    }).slice(0,20);
  },[candidates,artwork.revision,artwork.eligibilityKey,phone]);
  const [cursor, setCursor] = useState({ options, index: 0 });
  const index = cursor.options === options ? Math.min(cursor.index, Math.max(0, options.length - 1))
    : Math.max(0,options.findIndex(option=>option.key===cursor.options[cursor.index]?.key));
  const [gesturing, setGesturing] = useState(false), [interacting, setInteracting] = useState(false), [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false), [reduced, setReduced] = useState(false), [loading, setLoading] = useState(false);
  const root = useRef<HTMLDivElement>(null), pending = useRef(false);
  const gesture = useRef<{ pointerId: number; x: number; y: number; time: number; width: number; key: string; moved: boolean }>();
  const pointerType = useRef(''), suppressClickUntil = useRef(0);
  const item = options[index];
  const dotStart = Math.max(0, Math.min(index - 2, options.length - 5));
  const hasOptions = options.length > 0;
  const canRotate = options.length > 1;
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)'), updateMotion = () => setReduced(motion.matches);
    visibility(); updateMotion();
    document.addEventListener('visibilitychange', visibility); motion.addEventListener('change', updateMotion);
    const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver((entries) => setVisible(entries.some((entry) => entry.isIntersecting)));
    if (root.current) observer?.observe(root.current);
    if (!observer) setVisible(hasOptions);
    if (!hasOptions) setVisible(false);
    return () => { document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', updateMotion); observer?.disconnect(); };
  }, [hasOptions]);
  useEffect(() => { if (item && visible && !hidden) displayed(item); }, [item, displayed, visible, hidden]);
  useEffect(() => {
    if (!item || fireStick || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = root.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' });
    return () => animation?.cancel();
  }, [item?.key, reduced, fireStick]);
  const advance = async () => {
    if (pending.current || options.length < 2) return;
    if (index + 1 < options.length) { setCursor({ options, index: index + 1 }); return; }
    pending.current = true; setLoading(true);
    try { if (!(await nextBatch())) setCursor({ options, index: 0 }); } finally { pending.current = false; setLoading(false); }
  };
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  const cancelGesture = (suppressClick = false) => {
    if (suppressClick && gesture.current) suppressClickUntil.current = performance.now() + 400;
    gesture.current = undefined; setGesturing(false);
  };
  const startGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerType.current = event.pointerType;
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    if (!event.isPrimary) { cancelGesture(true); return; }
    const control = (event.target as Element).closest('button, a, input, select, textarea, [role="button"]');
    if (loading || playbackBusy || (control && !control.classList.contains('hero-artwork-link'))) return;
    if (event.currentTarget.contains(document.activeElement)) (document.activeElement as HTMLElement)?.blur();
    gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, width: event.currentTarget.clientWidth, key: item?.key, moved: false };
    setGesturing(true);
  };
  const moveGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) start.moved = true;
    if (heroSwipeDirection(event.clientX - start.x, event.clientY - start.y, event.timeStamp - start.time, start.width)) {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    }
  };
  const finishGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    cancelGesture();
    if (start.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) suppressClickUntil.current = performance.now() + 400;
    if (loading || playbackBusy || start.key !== item?.key) { suppressClickUntil.current = performance.now() + 400; return; }
    const direction = heroSwipeDirection(event.clientX - start.x, event.clientY - start.y, event.timeStamp - start.time, start.width);
    if (!direction) return;
    suppressClickUntil.current = performance.now() + 400;
    if (direction === 'next') void advance();
    else setCursor({ options, index: (index + options.length - 1) % options.length });
  };
  useEffect(() => {
    if (!canRotate || gesturing || ((interacting || hovered) && !fireStick) || !visible || hidden || reduced || loading || playbackBusy) return;
    const timer = setTimeout(() => { void advanceRef.current(); }, 10000);
    return () => clearTimeout(timer);
  }, [canRotate, item?.key, fireStick, gesturing, interacting, hovered, visible, hidden, reduced, loading, playbackBusy]);
  if (!item) return <div ref={root} className="home-hero-carousel"><HeroPreparing pending={artwork.pending} vertical={phone}/></div>;
  return <div ref={root} className="home-hero-carousel" aria-roledescription="carrossel" aria-label={contentKind === 'movie' ? 'Destaques de filmes' : contentKind === 'series' ? 'Destaques de séries' : 'Destaques de filmes e séries'}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false); }}
    onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={(event) => { if (event.pointerType === 'mouse') setHovered(false); }}
    onPointerDown={startGesture} onPointerMove={moveGesture} onPointerUp={finishGesture} onPointerCancel={() => cancelGesture(true)}
    onLostPointerCapture={(event) => { if (event.target === event.currentTarget) cancelGesture(true); }}
    onClickCapture={(event) => { if (event.detail > 0 && performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); } }}
    onClick={(event) => { if (event.detail > 0 && (pointerType.current === 'touch' || pointerType.current === 'pen') && event.currentTarget.contains(document.activeElement)) (document.activeElement as HTMLElement)?.blur(); }}>
    <Hero item={item.item} onPlay={onPlay} playbackBusy={playbackBusy} playbackMessage={playbackMessage} headingLevel={headingLevel} artworkUri={artwork.eligible.find(v=>v.item.id===item.item.id&&v.item.kind===item.item.kind)?.uri} onArtworkError={()=>artwork.reject(item.item)} onSelect={onSelect} mobilePoster={phone} controls={options.length > 1 ? <div className="hero-carousel-controls" role="group" aria-label="Selecionar destaque">
      {options.slice(dotStart, dotStart + 5).map((option, slot) => { const position = dotStart + slot; return <button key={slot} type="button" className="focusable-item hero-carousel-dot"
        aria-label={`Mostrar destaque ${position + 1} de ${options.length}: ${option.item.title}`} aria-current={position === index ? 'true' : undefined} aria-disabled={loading || playbackBusy}
        onClick={(event) => {
          if (!loading && !playbackBusy && !pending.current) setCursor({ options, index: position });
          if (event.detail > 0 && (pointerType.current === 'touch' || pointerType.current === 'pen')) event.currentTarget.blur();
        }}><span aria-hidden="true" /></button>; })}
    </div> : undefined} />
  </div>;
};
