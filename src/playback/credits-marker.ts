/** Local opaque references only. Never put URLs, credentials or session material here. */
export interface CreditsMarkerIdentity {
  seriesId: string;
  seasonNumber: number;
  episodeId: string;
  episodeNumber: number;
  sourceIdLocal: string;
  sourceGeneration: string;
  catalogSnapshotId: string;
  mediaEditionId: string;
}

export type CreditsMarkerOrigin = 'SOURCE_MARKER' | 'EDITION_RECORD';

export interface CreditsMarker extends CreditsMarkerIdentity {
  creditsStartSeconds: number;
  origin: CreditsMarkerOrigin;
  semantics: 'CREDITS_START';
  /** Reference into the caller's trusted authority registry, not a free-text claim. */
  provenance: string;
  /** Canonical UTC timestamps, including milliseconds. */
  validatedAt: string;
  validUntil?: string;
}

export interface CreditsMarkerAuthority {
  provenance: string;
  origin: CreditsMarkerOrigin;
  mediaEditionId: string;
  semantics: 'CREDITS_START';
  /** Documented producer convention or authorized edition-record schema. */
  conventionId: string;
}

export interface CreditsMarkerContext extends CreditsMarkerIdentity {
  now: string;
  /** Already verified by a trusted adapter; this function does not authenticate evidence. */
  editionEvidence: {
    mediaEditionId: string;
    verification: 'SOURCE_BOUND_EDITION' | 'CONTENT_FINGERPRINT';
    evidenceRef: string;
  };
  /** Actual media duration; descriptive catalog/TMDB duration is not accepted. */
  mediaDuration?: { seconds: number; origin: 'PLAYBACK_METADATA' | 'MEDIA_PROBE' };
  trustedAuthorities: readonly CreditsMarkerAuthority[];
}

export type CreditsMarkerValidation =
  | { status: 'VALID'; creditsStartSeconds: number; binding: CreditsMarkerIdentity;
      checkedAt: string; validUntil?: string; origins: readonly CreditsMarkerOrigin[] }
  | { status: 'MISSING' | 'INVALID' | 'AMBIGUOUS' | 'EXPIRED'; reason: string };

const identityKeys = ['seriesId', 'seasonNumber', 'episodeId', 'episodeNumber', 'sourceIdLocal',
  'sourceGeneration', 'catalogSnapshotId', 'mediaEditionId'] as const;
const markerKeys = new Set<string>([...identityKeys, 'creditsStartSeconds', 'origin', 'semantics', 'provenance', 'validatedAt', 'validUntil']);
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const reference = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v);
const ordinal = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const origin = (v: unknown): v is CreditsMarkerOrigin => v === 'SOURCE_MARKER' || v === 'EDITION_RECORD';
const fail = (reason: string): CreditsMarkerValidation => ({ status: 'INVALID', reason });

function identity(v: unknown): v is CreditsMarkerIdentity {
  return record(v) && identityKeys.every(k => k === 'seasonNumber' || k === 'episodeNumber' ? ordinal(v[k]) : reference(v[k]));
}

function utcMillis(v: unknown): number | undefined {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)) return undefined;
  const ms = Date.parse(v);
  return Number.isFinite(ms) && new Date(ms).toISOString() === v ? ms : undefined;
}

/**
 * Pure validation against a trusted current playback context. No I/O, clock reads or fallback.
 * Any invalid/expired candidate blocks this batch. Callers must revalidate after every identity
 * change and before using the result; VALID alone grants neither playback nor next-episode access.
 */
export function validateCreditsMarkers(context: CreditsMarkerContext, candidates: readonly unknown[]): CreditsMarkerValidation {
  if (!Array.isArray(candidates)) return fail('MALFORMED_CANDIDATES');
  if (candidates.length === 0) return { status: 'MISSING', reason: 'NO_MARKER' };
  if (!identity(context)) return fail('INVALID_PLAYBACK_IDENTITY');
  const now = utcMillis(context.now);
  if (now === undefined) return fail('INVALID_CLOCK');
  const edition = context.editionEvidence;
  if (!record(edition) || edition.mediaEditionId !== context.mediaEditionId || !reference(edition.evidenceRef)
    || !['SOURCE_BOUND_EDITION', 'CONTENT_FINGERPRINT'].includes(edition.verification)) return fail('UNVERIFIED_EDITION');
  const duration = context.mediaDuration;
  if (!record(duration) || !['PLAYBACK_METADATA', 'MEDIA_PROBE'].includes(duration.origin)
    || typeof duration.seconds !== 'number' || !Number.isFinite(duration.seconds) || duration.seconds <= 0) return fail('REAL_DURATION_REQUIRED');
  if (!Array.isArray(context.trustedAuthorities)) return fail('TRUSTED_AUTHORITY_REQUIRED');
  for (const authority of context.trustedAuthorities) {
    if (!record(authority) || !reference(authority.provenance) || !origin(authority.origin)
      || authority.mediaEditionId !== context.mediaEditionId || authority.semantics !== 'CREDITS_START'
      || !reference(authority.conventionId)) return fail('INVALID_AUTHORITY_CONTEXT');
  }
  const errors = new Set<string>(), times = new Set<number>(), origins = new Set<CreditsMarkerOrigin>();
  let expired = false, until: number | undefined;
  for (const candidate of candidates) {
    if (!record(candidate) || !identity(candidate) || Object.keys(candidate).some(k => !markerKeys.has(k))) {
      errors.add('MALFORMED_MARKER'); continue;
    }
    if (identityKeys.some(k => candidate[k] !== context[k])) { errors.add('IDENTITY_MISMATCH'); continue; }
    if (!origin(candidate.origin) || candidate.semantics !== 'CREDITS_START' || !reference(candidate.provenance)) {
      errors.add('CREDITS_PROVENANCE_REQUIRED'); continue;
    }
    if (!context.trustedAuthorities.some(a => a.provenance === candidate.provenance && a.origin === candidate.origin
      && a.mediaEditionId === candidate.mediaEditionId && a.semantics === 'CREDITS_START')) {
      errors.add('UNTRUSTED_PROVENANCE'); continue;
    }
    const start = candidate.creditsStartSeconds;
    if (typeof start !== 'number' || !Number.isFinite(start) || start < 0 || start >= duration.seconds) {
      errors.add('CREDITS_TIME_OUT_OF_BOUNDS'); continue;
    }
    const validated = utcMillis(candidate.validatedAt), expires = candidate.validUntil === undefined ? undefined : utcMillis(candidate.validUntil);
    if (validated === undefined || validated > now || (candidate.validUntil !== undefined && (expires === undefined || expires <= validated))) {
      errors.add('INVALID_VALIDITY_INTERVAL'); continue;
    }
    if (expires !== undefined && expires <= now) { expired = true; continue; }
    times.add(start); origins.add(candidate.origin);
    if (expires !== undefined) until = until === undefined ? expires : Math.min(until, expires);
  }
  if (errors.size > 0) return fail([...errors].sort()[0]);
  if (expired) return { status: 'EXPIRED', reason: 'EXPIRED_MARKER_IN_BATCH' };
  if (times.size !== 1) return { status: 'AMBIGUOUS', reason: 'CONFLICTING_CREDITS_START' };
  const binding: CreditsMarkerIdentity = {
    seriesId: context.seriesId, seasonNumber: context.seasonNumber, episodeId: context.episodeId,
    episodeNumber: context.episodeNumber, sourceIdLocal: context.sourceIdLocal, sourceGeneration: context.sourceGeneration,
    catalogSnapshotId: context.catalogSnapshotId, mediaEditionId: context.mediaEditionId,
  };
  return { status: 'VALID', creditsStartSeconds: [...times][0], binding, checkedAt: context.now,
    ...(until === undefined ? {} : { validUntil: new Date(until).toISOString() }), origins: [...origins].sort() };
}
