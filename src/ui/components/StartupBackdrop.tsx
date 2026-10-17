import { useEffect, useState } from 'react';
import { displayArtworkUri } from '../../artwork/artwork-uri.ts';
import { loadImage } from '../../artwork/image-load-queue.ts';
import type { StartupPoster } from '../../artwork/startup-catalog-preview.ts';
import { heroArtworkService } from '../../artwork/hero-artwork.service.ts';

interface Frame { uri: string; src: string; }
/** One visible cover; the previous decoded image stays beneath the incoming fade. */
export function StartupBackdrop({ posters, paused, mobile }: { posters: readonly StartupPoster[]; paused: boolean; mobile: boolean }) {
  const [cursor, setCursor] = useState<string>();
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [frames, setFrames] = useState<{ current: Frame; previous?: Frame }>();
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const target = posters.find(poster => poster.uri === cursor && !failed.has(poster.uri)) || posters.find(poster => !failed.has(poster.uri));
  const uri = target?.uri;
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!uri) { setFrames(undefined); return; }
    if (paused) return;
    const controller = new AbortController(); let retry: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      // Reuse the hero's verified horizontal resolver; never stretch a poster on TV.
      const source = mobile ? displayArtworkUri(uri, 'poster') : target?.backdropUri || await heroArtworkService.resolve({
        id: target!.id, kind: 'movie', title: target!.title, posterUri: uri, genreLabels: [], categoryLabels: [],
      }, 'horizontal', 'normal');
      if (controller.signal.aborted) return;
      if (!source) { setFailed(previous => new Set(previous).add(uri)); return; }
      const result = await loadImage(source, false, controller.signal);
      if (controller.signal.aborted) return;
      if (result.ok && result.src && (mobile ? result.height > result.width : result.width > result.height)) {
        const frame = { uri, src: result.src };
        setFrames(previous => previous?.current.uri === uri ? previous : { current: frame, previous: previous?.current });
      } else if (result.deferred) retry = setTimeout(() => { void load(); }, 500);
      else if (!result.cancelled) setFailed(previous => new Set(previous).add(uri));
    };
    void load(); return () => { controller.abort(); if (retry) clearTimeout(retry); };
  }, [uri, mobile, paused, target?.id, target?.title, target?.backdropUri]);
  useEffect(() => {
    if (paused || reduced || !uri || frames?.current.uri !== uri || posters.filter(poster => !failed.has(poster.uri)).length < 2) return;
    const timer = setTimeout(() => {
      const available = posters.filter(poster => !failed.has(poster.uri));
      setCursor(available[(available.findIndex(poster => poster.uri === uri) + 1) % available.length]?.uri);
    }, 6000);
    return () => clearTimeout(timer);
  }, [uri, frames, posters, paused, reduced, failed]);
  return <div className={`startup-backdrop ${mobile ? 'startup-mobile-backdrop' : 'startup-wide-backdrop'}`} aria-hidden="true" data-current-cover={frames?.current.uri}>
    {frames?.previous && <img key={'previous:' + frames.previous.uri} src={frames.previous.src} alt="" decoding="async"/>}
    {frames?.current && <img key={frames.current.uri} src={frames.current.src} alt="" decoding="async" className="startup-mobile-cover--incoming"/>}
  </div>;
}
