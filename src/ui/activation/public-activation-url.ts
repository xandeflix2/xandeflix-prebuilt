export const PUBLIC_DEVICE_ACTIVATION_URL = 'https://xandeflix.vercel.app/activate-device';

export interface PublicActivationHandoff { displayCode: string; sessionToken: string; }

export function publicActivationHandoffUrl(baseUrl: string, proof: PublicActivationHandoff): string {
  if (!/^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(proof.displayCode) || !/^[a-f0-9]{64}$/.test(proof.sessionToken)) {
    throw new Error('ACTIVATION_HANDOFF_INVALID');
  }
  const fragment = new URLSearchParams({ device: proof.displayCode, session: proof.sessionToken });
  return publicDeviceActivationUrl(baseUrl) + '#' + fragment.toString();
}

/** Strip the short-lived capability before any SDK reads the URL. */
export function consumePublicActivationHandoff(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>,
  history?: Pick<History, 'replaceState'>,
): PublicActivationHandoff | null {
  if (location.pathname !== '/activate-device') return null;
  const fragment = new URLSearchParams(location.hash.slice(1));
  if (!fragment.has('session') && !fragment.has('device')) return null;
  if (!history) return null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch { return null; }
  const displayCode = fragment.get('device') || '', sessionToken = fragment.get('session') || '';
  return /^XF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(displayCode) && /^[a-f0-9]{64}$/.test(sessionToken)
    ? { displayCode, sessionToken } : null;
}

/** External activation never inherits the Capacitor WebView's localhost origin. */
export function publicDeviceActivationUrl(configured?: unknown): string {
  if (typeof configured !== 'string' || !configured.trim()) return PUBLIC_DEVICE_ACTIVATION_URL;
  try {
    const url = new URL(configured.trim()), host = url.hostname.toLowerCase();
    const local = !host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':')
      || ['.localhost', '.local', '.internal'].some(suffix => host.endsWith(suffix));
    if (url.protocol !== 'https:' || local || url.username || url.password || url.search
      || !['/', '/activate-device', '/activate-device/'].includes(url.pathname)
      || (url.hash && url.hash !== '#/activate-device')) return PUBLIC_DEVICE_ACTIVATION_URL;
    return url.origin + '/activate-device';
  } catch { return PUBLIC_DEVICE_ACTIVATION_URL; }
}

export function isPublicActivationLocation(location: Pick<Location, 'pathname' | 'hash'>): boolean {
  return location.pathname === '/activate-device'
    || (location.pathname === '/' && location.hash === '#/activate-device');
}
