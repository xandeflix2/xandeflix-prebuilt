import { useEffect, useState } from 'react';
import { isPhoneHeroProfile } from '../../catalog/home-hero.service.ts';
import { getDevicePresentation } from '../device-presentation.ts';
import { useDevicePresentation } from './useDevicePresentation.ts';

function readPhoneLayout(): boolean {
  if (typeof window === 'undefined') return false;
  const choice = getDevicePresentation();
  if (choice) return choice === 'PHONE';
  const mobile = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile;
  return isPhoneHeroProfile(navigator.userAgent, mobile, window.innerWidth, navigator.maxTouchPoints);
}

/** Presentation profile only; independent of activation/device identity. */
export function usePhoneLayout(): boolean {
  const choice = useDevicePresentation();
  const [phone, setPhone] = useState(readPhoneLayout);
  useEffect(() => {
    const update = () => setPhone(readPhoneLayout());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [choice]);
  return choice ? choice === 'PHONE' : phone;
}
