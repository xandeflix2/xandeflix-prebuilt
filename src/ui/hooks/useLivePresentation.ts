import { useEffect, useState } from 'react';
import { getDevicePresentation, isTelevisionPresentation } from '../device-presentation.ts';
import { useDevicePresentation } from './useDevicePresentation.ts';
import { shouldUseSquareLive } from '../navigation/square-live-layout.ts';

function readPresentation() {
  if (typeof window === 'undefined') return { tabletPortrait: false, stackedLive: false, squareLive: false };
  const ua = navigator.userAgent;
  const choice = getDevicePresentation();
  const television = isTelevisionPresentation(ua, choice);
  const tablet = choice ? choice === 'TABLET' : !television && (/ipad/i.test(ua)
    || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    || (/android/i.test(ua) && !/\bmobile\b/i.test(ua)
      && !(navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile));
  const tabletPortrait = tablet && window.innerHeight > window.innerWidth;
  const squareLive = shouldUseSquareLive({ width: window.innerWidth, height: window.innerHeight,
    touch: navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse)').matches, television });
  return { tabletPortrait, squareLive, stackedLive: !squareLive && !television && (window.innerWidth < 600 || tabletPortrait) };
}

export function useLivePresentation() {
  const choice = useDevicePresentation();
  const [presentation, setPresentation] = useState(readPresentation);
  useEffect(() => {
    const update = () => {
      const next = readPresentation();
      setPresentation(current => current.tabletPortrait === next.tabletPortrait && current.stackedLive === next.stackedLive && current.squareLive === next.squareLive ? current : next);
    };
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    const pointer = window.matchMedia('(any-pointer: coarse)');
    pointer.addEventListener('change', update);
    update();
    return () => { window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update); pointer.removeEventListener('change', update); };
  }, [choice]);
  return choice === 'TV' ? { tabletPortrait: false, stackedLive: false, squareLive: false } : presentation;
}
