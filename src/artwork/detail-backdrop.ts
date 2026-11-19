import type { ArtworkMetadata } from './tmdb-metadata.service.ts';

export function publicBackdropUri(value: unknown): string | undefined {
  return typeof value === 'string' && /^https:\/\/image\.tmdb\.org\/t\/p\/(?:w342|w780|w1280)\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(value) ? value : undefined;
}

export function chooseDetailBackdropUri(metadata: ArtworkMetadata | null, failed: ReadonlySet<string>): string | undefined {
  for (const candidate of [metadata?.backdropUri, ...(metadata?.backdropUris || [])]) {
    const uri = publicBackdropUri(candidate);
    if (uri && !failed.has(uri)) return uri;
  }
  return undefined;
}

export function isHorizontalDetailBackdrop(width: number, height: number): boolean {
  const ratio = width / height;
  return Number.isFinite(width) && Number.isFinite(height) && width >= 300 && height >= 150 && ratio >= 1.2 && ratio <= 3;
}
