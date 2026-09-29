export const SOURCE_CLASSIFICATION_PROFILE_LOCK_ID = 'SOURCE_CLASSIFICATION_PROFILE_LOCK_V1';

export const SOURCE_CLASSIFICATION_PROFILE_LOCK_INVARIANTS = [
  'profile-is-source-specific',
  'profile-is-explicit-and-versioned',
  'no-global-group-name-heuristic',
  'structural-contradiction-fails-closed',
  'profile-never-silently-overrides-strong-evidence',
  'source-metadata-is-preserved',
  'generic-classifier-remains-provider-agnostic',
  'ae-sentinel-is-live-only-under-authorized-profile',
  'same-label-in-another-source-has-no-authority',
  'category-text-remains-category-metadata',
] as const;

export const SOURCE_CLASSIFICATION_PROFILE_LOCK_MATERIAL =
  `${SOURCE_CLASSIFICATION_PROFILE_LOCK_ID}\n${SOURCE_CLASSIFICATION_PROFILE_LOCK_INVARIANTS.join('\n')}`;

export const SOURCE_CLASSIFICATION_PROFILE_LOCK_HASH =
  '5538E68A8FC89D63A9EDA9028716A7DBAC5E422EA44A1BE44FAE000E415DDF24';
