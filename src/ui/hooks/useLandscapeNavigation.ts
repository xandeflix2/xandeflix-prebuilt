import { useEffect, useState } from 'react';
import { shouldUseSideNavigation } from '../navigation/landscape-navigation.ts';

function readSideNavigation(): boolean {
  if (typeof window === 'undefined') return false;
  const mobile = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile;
  return shouldUseSideNavigation({
    width: window.innerWidth,
    height: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    orientation: window.screen.orientation?.type,
    userAgent: navigator.userAgent,
    touchPoints: navigator.maxTouchPoints,
    mobile,
  });
}

export function useLandscapeNavigation(): boolean {
  const [sideNavigation, setSideNavigation] = useState(readSideNavigation);
  useEffect(() => {
    const update = () => setSideNavigation(readSideNavigation());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return sideNavigation;
}
