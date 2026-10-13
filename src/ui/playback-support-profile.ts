import { getDevicePresentation } from './device-presentation.ts';
/** Support UI only; never reads or changes registered device identity. */
export function canUsePlaybackWhatsapp(userAgent: string, touchPoints = 0): boolean {
  const choice = getDevicePresentation();
  if (choice) return choice !== 'TV';
  if (/tizen|web[0o]s|\b(?:aft\w+|firetv|googletv|crkey|hbbtv|netcast|bravia|shield|stb)\b|smart[ -]?tv|android tv|fire tv|tv[ -]?box|mi[ -]?box\w*/i.test(userAgent)) return false;
  // Android boxes can advertise an ordinary Chrome/Android UA. A touch tablet
  // remains eligible in either orientation; viewport width is irrelevant.
  return !/android/i.test(userAgent) || touchPoints > 0;
}
