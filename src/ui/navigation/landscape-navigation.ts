/** Visual-only policy; never reads identity, activation or registered device type. */
export interface NavigationViewport {
  width: number;
  height: number;
  screenWidth?: number;
  screenHeight?: number;
  orientation?: string;
  userAgent?: string;
  mobile?: boolean;
  touchPoints?: number;
}

export function shouldUseSideNavigation(viewport: NavigationViewport): boolean {
  const { width, height, userAgent = '', mobile, orientation = '' } = viewport;
  if (width < 768 || height <= 0 || width <= height) return false;
  const television = /\b(?:aft[a-z0-9]+|firetv|googletv|crkey|hbbtv|tizen|web0s|webos|netcast)\b|smart[ -]?tv|android tv|fire tv/i.test(userAgent);
  if (television) return true;
  const ipad = /ipad/i.test(userAgent) || (/macintosh/i.test(userAgent) && (viewport.touchPoints ?? 0) > 1);
  const phone = /iphone|ipod/i.test(userAgent) || (!ipad && (mobile === true || /android.*\bmobile\b/i.test(userAgent)));
  if (phone) return false;
  // IME resize must not turn a physically portrait tablet into landscape UI.
  if (orientation.startsWith('portrait') && (ipad || /android/i.test(userAgent))) return false;
  const shortSide = Math.min(viewport.screenWidth || width, viewport.screenHeight || height);
  return shortSide >= 600 || height >= 480;
}
