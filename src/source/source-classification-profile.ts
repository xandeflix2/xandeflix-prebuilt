import {
  classifyCanonicalSourceContent,
  type CanonicalSourceContentKind,
  type CanonicalSourceContentInput,
} from './content-kind-classifier.ts';
import { parseM3uEpisodeIdentity } from './m3u-extinf-parser.ts';

export type SourceProfileCanonicalKind = Exclude<CanonicalSourceContentKind, 'unresolved'>;

export type SourceClassificationEvidence =
  | 'EXPLICIT_SOURCE_ITEM_KIND'
  | 'SOURCE_PROFILE_EXPLICIT_KIND'
  | 'STRUCTURAL_CLASSIFIER'
  | 'PROFILE_STRUCTURAL_CONFLICT'
  | 'UNRESOLVED';

export interface SourceClassificationProfileRule {
  groupFamily: string;
  canonicalKind: SourceProfileCanonicalKind;
  evidence: 'EXPLICIT_SOURCE_PROFILE';
}

export interface SourceClassificationProfile {
  sourceId: string;
  version: number;
  rules: readonly SourceClassificationProfileRule[];
}

export interface SourceProfileClassificationInput extends CanonicalSourceContentInput {
  sourceId?: string;
  profile?: SourceClassificationProfile;
  explicitKind?: CanonicalSourceContentKind;
}

export interface SourceProfileClassificationResult {
  canonicalKind: CanonicalSourceContentKind;
  classificationEvidence: SourceClassificationEvidence;
  sourceProfileVersion?: number;
  sourceGroupFamily?: string;
}

export const MANAGED_SOURCE_CLASSIFICATION_PROFILE_SOURCE_ID = 'src_uhwh5cio';

export const CURRENT_CLASSIFICATION_PROFILE_VERSION = 2;
export const MANAGED_SOURCE_CLASSIFICATION_PROFILE_V1 = {
  sourceId: MANAGED_SOURCE_CLASSIFICATION_PROFILE_SOURCE_ID,
  version: 1,
  rules: [
    {
      groupFamily: 'CANAIS',
      canonicalKind: 'live',
      evidence: 'EXPLICIT_SOURCE_PROFILE',
    },
  ],
} as const satisfies SourceClassificationProfile;

/**
 * Extrai somente a famÃ­lia estrutural do group-title para a regra do perfil.
 * O texto original da categoria nunca Ã© reescrito no catÃ¡logo.
 */
let lastRawGroup: string | undefined;
let lastNormalizedGroup: string | undefined;

export function normalizeSourceGroupFamily(groupName: string): string {
  if (groupName === lastRawGroup && lastNormalizedGroup !== undefined) {
    return lastNormalizedGroup;
  }
  const result = groupName
    .trim()
    .split('|', 1)[0]
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  lastRawGroup = groupName;
  lastNormalizedGroup = result;
  return result;
}

export function getManagedSourceClassificationProfile(sourceId?: string): SourceClassificationProfile | undefined {
  return sourceId === MANAGED_SOURCE_CLASSIFICATION_PROFILE_SOURCE_ID
    ? MANAGED_SOURCE_CLASSIFICATION_PROFILE_V1
    : undefined;
}

function strongStructuralKind(input: CanonicalSourceContentInput): SourceProfileCanonicalKind | undefined {
  const normalizedPath = (input.streamUrl || '').trim().toLowerCase().split(/[?#]/, 1)[0];

  if (normalizedPath.includes('/movie/')) return 'movie';
  if (normalizedPath.includes('/series/')) return 'series';
  if (normalizedPath.includes('/live/') || normalizedPath.endsWith('.m3u8')) return 'live';
  if (parseM3uEpisodeIdentity(input.title || '')) return 'series';
  return undefined;
}

function genericClassification(input: CanonicalSourceContentInput): SourceProfileClassificationResult {
  const canonicalKind = classifyCanonicalSourceContent(input);
  return {
    canonicalKind,
    classificationEvidence: canonicalKind === 'unresolved' ? 'UNRESOLVED' : 'STRUCTURAL_CLASSIFIER',
  };
}

/**
 * Resolve o tipo com precedÃªncia explÃ­cita e sem transformar nomes de grupo
 * em heurÃ­stica global. Um perfil sÃ³ tem autoridade quando estÃ¡ associado Ã 
 * source gerenciada correspondente.
 */
export function classifySourceItemWithProfile(
  input: SourceProfileClassificationInput,
): SourceProfileClassificationResult {
  if (input.explicitKind) {
    return {
      canonicalKind: input.explicitKind,
      classificationEvidence: 'EXPLICIT_SOURCE_ITEM_KIND',
    };
  }

  const profile = input.profile;
  if (
    !profile ||
    !input.sourceId ||
    input.sourceId !== MANAGED_SOURCE_CLASSIFICATION_PROFILE_SOURCE_ID ||
    profile.sourceId !== input.sourceId ||
    profile.version !== MANAGED_SOURCE_CLASSIFICATION_PROFILE_V1.version
  ) {
    return genericClassification(input);
  }

  const sourceGroupFamily = normalizeSourceGroupFamily(input.groupName || '');
  const rule = profile.rules.find((candidate) => candidate.groupFamily === sourceGroupFamily);
  if (!rule) {
    const fallback = genericClassification(input);
    return { ...fallback, sourceProfileVersion: profile.version, sourceGroupFamily };
  }

  const structuralKind = strongStructuralKind(input);
  if (structuralKind && structuralKind !== rule.canonicalKind) {
    return {
      canonicalKind: 'unresolved',
      classificationEvidence: 'PROFILE_STRUCTURAL_CONFLICT',
      sourceProfileVersion: profile.version,
      sourceGroupFamily,
    };
  }

  return {
    canonicalKind: rule.canonicalKind,
    classificationEvidence: 'SOURCE_PROFILE_EXPLICIT_KIND',
    sourceProfileVersion: profile.version,
    sourceGroupFamily,
  };
}
