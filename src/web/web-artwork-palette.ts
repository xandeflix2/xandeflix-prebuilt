import { paletteForImage, type ArtworkPalette } from '../artwork/artwork-palette.ts';
import { isWebValidation } from './validation.ts';

type PaletteResult = { palette?: ArtworkPalette; failure?: string };
const pending = new Map<string, Promise<PaletteResult>>();
const unavailable = new Map<string, { until: number; result: PaletteResult }>();
const recovered = new Map<string, ArtworkPalette>();

/** A CORS-only color probe. The displayed cover and its loading path stay intact. */
function readPalette(uri: string): Promise<PaletteResult> {
  const known = recovered.get(uri);
  if (known) { recovered.delete(uri); recovered.set(uri, known); return Promise.resolve({ palette: known }); }
  const previous = unavailable.get(uri);
  if (previous && previous.until > Date.now()) return Promise.resolve(previous.result);
  unavailable.delete(uri);
  const existing = pending.get(uri);
  if (existing) return existing;
  if (pending.size >= 2) return Promise.resolve({ failure: 'BUSY' });
  let resolve!: (result: PaletteResult) => void;
  const job = new Promise<PaletteResult>(finish => { resolve = finish; });
  pending.set(uri, job);
  let probe: HTMLImageElement | undefined, timer: ReturnType<typeof setTimeout> | undefined, settled = false;
  let objectUri: string | undefined, retrying = false;
  const controller = new AbortController();
  const releaseImage = () => {
    if (probe) { probe.onload = null; probe.onerror = null; probe.removeAttribute('src'); }
  };
  const finish = (palette?: ArtworkPalette, failure = 'NO_COLOR') => {
    if (settled) return;
    settled = true;
    if (timer !== undefined) clearTimeout(timer);
    releaseImage(); controller.abort();
    if (objectUri) URL.revokeObjectURL(objectUri);
    pending.delete(uri);
    const result = palette ? { palette } : { failure };
    if (palette) {
      recovered.set(uri, palette);
      while (recovered.size > 48) recovered.delete(recovered.keys().next().value!);
    } else {
      unavailable.set(uri, { until: Date.now() + 60000, result });
      while (unavailable.size > 48) unavailable.delete(unavailable.keys().next().value!);
    }
    resolve(result);
  };
  const recover = async () => {
    if (settled || retrying) return;
    retrying = true; releaseImage();
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => finish(undefined, 'TIMEOUT'), 5000);
    try {
      const response = await fetch(uri, { mode: 'cors', credentials: 'omit', cache: 'reload',
        referrerPolicy: 'no-referrer', signal: controller.signal });
      if (settled) return;
      if (!response.ok || response.type === 'opaque') { finish(undefined, 'HTTP_OR_CORS'); return; }
      const blob = await response.blob();
      if (settled) return;
      if (!blob.type.startsWith('image/') || !blob.size || blob.size > 5 * 1024 * 1024) {
        finish(undefined, 'INVALID_IMAGE'); return;
      }
      objectUri = URL.createObjectURL(blob);
      probe = new Image();
      probe.onload = () => finish(paletteForImage(probe!));
      probe.onerror = () => finish(undefined, 'DECODE_ERROR');
      probe.src = objectUri;
    } catch { finish(undefined, 'CORS_OR_NETWORK'); }
  };
  try {
    probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.referrerPolicy = 'no-referrer';
    probe.onload = () => { const palette = paletteForImage(probe!); if (palette) finish(palette); else void recover(); };
    probe.onerror = () => { void recover(); };
    timer = setTimeout(() => { void recover(); }, 5000);
    probe.src = uri;
  } catch { void recover(); }
  return job;
}

export async function applyWebArtworkPalette(image: HTMLImageElement, element: HTMLElement,
  page: HTMLElement, shell: HTMLElement | null, signal: AbortSignal): Promise<void> {
  if (!isWebValidation() || signal.aborted || !image.complete || !image.naturalWidth) return;
  const uri = image.currentSrc || image.src;
  let url: URL;
  try { url = new URL(uri, location.href); } catch { return; }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.origin === location.origin) {
    image.dataset.webAmbientState = 'UNSUPPORTED_URI'; return;
  }
  image.dataset.webAmbientState = 'PROBING';
  const { palette, failure } = await readPalette(uri);
  if (signal.aborted || !image.isConnected || !image.complete
    || !element.contains(image) || (image.currentSrc || image.src) !== uri) return;
  if (!palette) { image.dataset.webAmbientState = 'NO_PALETTE'; image.dataset.webAmbientFailure = failure || 'NO_COLOR'; return; }
  const surface = element.matches('.hero-banner') ? element
    : element.querySelector<HTMLElement>('.detail-hero-wide, .series-phone-hero') || image;
  const bottom = Math.max(0, surface.getBoundingClientRect().bottom - page.getBoundingClientRect().top + page.scrollTop);
  page.style.setProperty('--artwork-halo-height', `${Math.ceil(bottom + 32)}px`);
  page.style.setProperty('--artwork-base', palette.base);
  page.style.setProperty('--artwork-ambient', palette.ambient);
  page.classList.add('immersive-background');
  shell?.style.setProperty('--navigation-ambient', palette.ambient);
  image.dataset.webAmbientState = 'APPLIED';
  delete image.dataset.webAmbientFailure;
}
