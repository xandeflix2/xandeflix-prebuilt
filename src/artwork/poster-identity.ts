import { loadImage } from './image-load-queue.ts';

type Candidate = Record<string, unknown>;
export type PosterSample = { ratio: number; rgb: readonly number[] };
const WIDTH = 24, HEIGHT = 36;
const samples = new Map<string, Promise<PosterSample | undefined>>();
const object = (value: unknown): Candidate => value && typeof value === 'object' && !Array.isArray(value) ? value as Candidate : {};

/** Compare the same poster after resizing/compression, not visually related art. */
export function samePoster(a: PosterSample, b: PosterSample): boolean {
  if (!Number.isFinite(a.ratio) || !Number.isFinite(b.ratio) || a.ratio < 0.5 || a.ratio > 0.8
    || Math.abs(a.ratio - b.ratio) > 0.025 || a.rgb.length !== WIDTH * HEIGHT * 3 || b.rgb.length !== a.rgb.length) return false;
  let total = 0, square = 0, large = 0, sum = 0, sumSquared = 0;
  for (let n = 0; n < a.rgb.length; n++) {
    const x = a.rgb[n], y = b.rgb[n];
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 255 || y < 0 || y > 255) return false;
    const diff = Math.abs(x - y);
    total += diff; square += diff * diff; if (diff > 24) large++;
    sum += x; sumSquared += x * x;
  }
  const count = a.rgb.length, variance = sumSquared / count - (sum / count) ** 2;
  return variance >= 22 ** 2 && total / count <= 10 && square / count <= 225 && large / count <= 0.12;
}

async function readSample(uri: string): Promise<PosterSample | undefined> {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return;
  const loaded = await loadImage(uri, true);
  if (!loaded.ok || !loaded.src || loaded.width <= 0 || loaded.height <= loaded.width) throw new Error('POSTER_SAMPLE_UNAVAILABLE');
  const src = loaded.src;
  return new Promise((resolve, reject) => {
    const image = new Image(); image.crossOrigin = 'anonymous';
    let canvas: HTMLCanvasElement | undefined;
    const done = (value?: PosterSample, failed = false) => {
      clearTimeout(timer); image.onload = image.onerror = null;
      if (canvas) canvas.width = canvas.height = 0;
      if (failed) reject(new Error('POSTER_SAMPLE_UNAVAILABLE')); else resolve(value);
    };
    const timer = setTimeout(() => done(undefined, true), 5000);
    image.onerror = () => done(undefined, true);
    image.onload = () => {
      try {
        const ratio = image.naturalWidth / image.naturalHeight;
        if (ratio < 0.5 || ratio > 0.8) { done(); return; }
        canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) { done(undefined, true); return; }
        context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, WIDTH, HEIGHT);
        const rgba = context.getImageData(0, 0, WIDTH, HEIGHT).data, rgb: number[] = [];
        for (let n = 0; n < rgba.length; n += 4) {
          if (rgba[n + 3] !== 255) { done(); return; }
          rgb.push(rgba[n], rgba[n + 1], rgba[n + 2]);
        }
        done({ ratio, rgb });
      } catch { done(undefined, true); }
    };
    image.src = src;
  });
}

function sample(uri: string): Promise<PosterSample | undefined> {
  const cached = samples.get(uri); if (cached) return cached;
  const value = readSample(uri); samples.set(uri, value);
  while (samples.size > 96) samples.delete(samples.keys().next().value!);
  void value.catch(() => { if (samples.get(uri) === value) samples.delete(uri); });
  return value;
}

/** Public official paths only; source URI never leaves the existing image cache. */
export function identityPosterPaths(candidate: Candidate): string[] {
  const images = object(candidate.images).posters;
  const rows = Array.isArray(images) ? images.slice(0, 256).map(object) : [];
  const paths = [candidate.poster_path, ...rows.filter(p => p.iso_639_1 === 'pt').map(p => p.file_path),
    ...rows.filter(p => p.iso_639_1 == null || p.iso_639_1 === 'en').map(p => p.file_path)];
  return [...new Set(paths.filter((path): path is string => typeof path === 'string' && /^\/[A-Za-z0-9_.-]+$/.test(path)))].slice(0, 8);
}

export async function matchSourcePoster(uri: string, candidates: Candidate[]): Promise<Candidate | null> {
  if (!candidates.length || candidates.length > 6) return null;
  const deadline = Date.now() + 16000;
  let expired = false, timer: ReturnType<typeof setTimeout> | undefined;
  const operation = (async () => {
    const source = await sample(uri); if (!source) return null;
    let confirmed: Candidate | null = null;
    for (const candidate of candidates) {
      let matched = false;
      const paths = identityPosterPaths(candidate);
      for (let index = 0; index < paths.length; index += 2) {
        if (expired || Date.now() >= deadline) throw new Error('POSTER_MATCH_TIMEOUT');
        const batch = await Promise.all(paths.slice(index, index + 2).map(path => sample(`https://image.tmdb.org/t/p/w92${path}`)));
        if (expired) throw new Error('POSTER_MATCH_TIMEOUT');
        if (batch.some(official => official && samePoster(source, official))) { matched = true; break; }
      }
      if (!matched) continue;
      if (confirmed && confirmed.id !== candidate.id) return null;
      confirmed = candidate;
    }
    return confirmed;
  })();
  try {
    return await Promise.race([operation, new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => { expired = true; reject(new Error('POSTER_MATCH_TIMEOUT')); }, 16000);
    })]);
  } finally { if (timer) clearTimeout(timer); }
}
