/** Preserve provider paths/query strings; never expose inline credentials. */
export function normalizeArtworkUri(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const uri = new URL(value.trim());
    if (!['http:', 'https:'].includes(uri.protocol) || uri.username || uri.password) return undefined;
    if (uri.hostname === 'image.tmdb.org') uri.protocol = 'https:';
    return uri.href;
  } catch {
    return undefined;
  }
}

/** Public TMDB resizes only; source filenames and non-TMDB URLs stay intact. */
export function displayArtworkUri(value: string | undefined, kind: 'poster' | 'backdrop' | 'thumbnail', high = false): string | undefined {
  const normalized = normalizeArtworkUri(value);
  if (!normalized) return;
  const url = new URL(normalized);
  const path = url.pathname.match(/^\/t\/p\/[^/]+(\/[A-Za-z0-9_.-]+\.(?:jpg|jpeg|png|webp))$/i);
  if (url.hostname === 'image.tmdb.org' && path) {
    url.pathname = `/t/p/${kind === 'backdrop' ? 'w1280' : high && kind === 'poster' ? 'w780' : 'w342'}${path[1]}`;
  }
  return url.href;
}

/** Backdrops use a real horizontal image before falling back to a poster. */
export function chooseArtworkUri(options: {
  source?: string; fallback?: string; provider?: string; providerPoster?: string;
  tmdbBackdropOnly?: boolean;
  kind: 'poster' | 'backdrop' | 'thumbnail'; failed: ReadonlySet<string>;
}): string | undefined {
  const source = normalizeArtworkUri(options.source);
  const fallback = normalizeArtworkUri(options.fallback);
  const usable = (uri: string | undefined) => uri && !options.failed.has(uri) ? uri : undefined;
  if (options.kind === 'backdrop' && options.tmdbBackdropOnly) return usable(normalizeArtworkUri(options.provider));
  const realSource = options.kind === 'backdrop' && source === fallback ? undefined : source;
  return usable(realSource) || usable(normalizeArtworkUri(options.provider))
    || usable(fallback) || usable(source) || usable(normalizeArtworkUri(options.providerPoster));
}
