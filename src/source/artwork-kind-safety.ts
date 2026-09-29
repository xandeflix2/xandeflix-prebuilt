export type ArtworkContentKind = 'movie' | 'series';

export interface ArtworkResolutionIdentity {
  canonicalKind: ArtworkContentKind;
  title: string;
  year?: number;
  explicitIdentity?: string | number;
}

function normalizeArtworkTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Chave de resolução que nunca permite fuzzy match entre movie e series.
 * Identidade explícita é preferida; título normalizado e ano continuam parte
 * da chave para impedir colisões de fallback.
 */
export function buildArtworkResolutionKey(identity: ArtworkResolutionIdentity): string {
  const kind = identity.canonicalKind;
  const explicit = identity.explicitIdentity === undefined
    ? ''
    : `id-${String(identity.explicitIdentity).trim()}`;
  const title = normalizeArtworkTitle(identity.title) || 'untitled';
  const year = Number.isSafeInteger(identity.year) ? `year-${identity.year}` : 'year-unknown';
  return [kind, explicit || title, explicit ? title : '', year].filter(Boolean).join(':');
}

export function isArtworkKindSafeMatch(
  left: ArtworkResolutionIdentity,
  right: ArtworkResolutionIdentity,
): boolean {
  return left.canonicalKind === right.canonicalKind;
}

