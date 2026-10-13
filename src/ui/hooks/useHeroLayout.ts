import { useEffect, useState } from 'react';
import { usePhoneLayout } from './usePhoneLayout.ts';
import { useLivePresentation } from './useLivePresentation.ts';

export function useHeroLayout(): boolean {
  const phone = usePhoneLayout();
  const { squareLive } = useLivePresentation();
  const [portrait, setPortrait] = useState(() => typeof window !== 'undefined' && window.innerHeight >= window.innerWidth);
  useEffect(() => {
    const update = () => setPortrait(window.innerHeight >= window.innerWidth);
    window.addEventListener('resize', update); window.addEventListener('orientationchange', update);
    update();
    return () => { window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update); };
  }, []);
  return phone && portrait && !squareLive;
}
