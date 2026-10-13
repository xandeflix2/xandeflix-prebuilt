import { useEffect, useState } from 'react';
import { shouldUseSideNavigation } from '../navigation/landscape-navigation.ts';
import { getDevicePresentation } from '../device-presentation.ts';
import { useDevicePresentation } from './useDevicePresentation.ts';

function readSideNavigation(): boolean {
  if (typeof window === 'undefined') return false;
  const choice = getDevicePresentation();
  if (choice === 'TV') return true;
  if (choice === 'PHONE') return false;
  const mobile = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile;
  return shouldUseSideNavigation({
    width: window.innerWidth,
    height: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    orientation: window.screen.orientation?.type,
    userAgent: choice === 'TABLET' ? 'iPad' : navigator.userAgent,
    touchPoints: navigator.maxTouchPoints,
    mobile: choice === 'TABLET' ? false : mobile,
  });
}

export function useLandscapeNavigation(): boolean {
  const choice = useDevicePresentation();
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
  }, [choice]);
  return choice === 'TV' ? true : choice === 'PHONE' ? false : sideNavigation;
}
