/** Presentation-only wait: bounded real cards, never the complete catalog. */
export const STARTUP_ARTWORK_LIMIT = 40;
export const STARTUP_ARTWORK_WAIT_MS = 20000;
export interface StartupArtworkSample {
  total: number; ready: number; unavailable: number; waitingRails: boolean; heroSettled: boolean;
}
export function isStartupArtworkSettled(sample: StartupArtworkSample): boolean {
  return sample.total > 0 && sample.total <= STARTUP_ARTWORK_LIMIT
    && sample.ready + sample.unavailable === sample.total && sample.heroSettled && !sample.waitingRails;
}
export function sampleStartupArtwork(root: HTMLElement): StartupArtworkSample {
  const marked = [...root.querySelectorAll<HTMLElement>('.media-card[data-startup-artwork]')].slice(0, 32);
  const visible = [...root.querySelectorAll<HTMLElement>('.media-card')].slice(0, 40).filter(card => {
    const r = card.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0;
  }).slice(0, 8);
  const cards = [...new Set([...marked, ...visible])].slice(0, STARTUP_ARTWORK_LIMIT);
  let ready = 0, unavailable = 0;
  for (const card of cards) {
    const image = card.querySelector<HTMLImageElement>('img[data-artwork-ready]');
    if (image?.complete && image.naturalWidth > 0) ready++;
    else if (card.querySelector('.artwork-fallback')) unavailable++;
  }
  const hero = root.querySelector('.home-hero-carousel');
  const heroImage = hero?.querySelector<HTMLImageElement>('img.hero-backdrop-img');
  const heroSettled = Boolean(heroImage?.complete && heroImage.naturalWidth > 0)
    || Boolean(hero?.querySelector('.hero-preparing[aria-busy="false"]'));
  return { total: cards.length, ready, unavailable, heroSettled,
    waitingRails: Boolean(root.querySelector('.media-rail-skeleton[data-startup-rail]')) };
}

/** Injected clock keeps cancellation/deadline checks independent of the UI. */
export function prepareStartupArtwork(options: {
  sample: () => StartupArtworkSample; update: (sample: StartupArtworkSample) => void;
  finish: (reason: 'settled' | 'timeout') => void;
  now?: () => number; schedule?: (fn: () => void, ms: number) => unknown; cancel?: (id: unknown) => void;
}): () => void {
  const now = options.now || Date.now;
  const schedule = options.schedule || ((fn, ms) => setTimeout(fn, ms));
  const cancel = options.cancel || (id => clearTimeout(id as ReturnType<typeof setTimeout>));
  const started = now();
  let stopped = false, timer: unknown, stableSince: number | undefined, previous = '';
  const tick = () => {
    if (stopped) return;
    const sample = options.sample();
    options.update(sample);
    if (stopped) return; // update may omit the presentation and cancel this very tick.
    const settled = isStartupArtworkSettled(sample);
    const signature = `${sample.total}:${sample.ready}:${sample.unavailable}:${sample.heroSettled}:${sample.waitingRails}`;
    if (settled) {
      if (signature !== previous || stableSince === undefined) stableSince = now();
      if (now() - stableSince >= 500) { stopped = true; options.finish('settled'); return; }
    } else stableSince = undefined;
    previous = signature;
    if (now() - started >= STARTUP_ARTWORK_WAIT_MS) { stopped = true; options.finish('timeout'); return; }
    timer = schedule(tick, 250);
  };
  timer = schedule(tick, 250);
  return () => { stopped = true; cancel(timer); };
}
