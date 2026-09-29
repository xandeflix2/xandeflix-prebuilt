export const WEBVIEW_BINARY_RUNTIME_COMPATIBILITY_LOCK_ID =
  'WEBVIEW_BINARY_RUNTIME_COMPATIBILITY_LOCK_V1';

export const WEBVIEW_BINARY_RUNTIME_COMPATIBILITY_LOCK_INVARIANTS = [
  'buffer-runtime-api-required-by-serializer-exists',
  'serializer-need-not-contain-browser-specific-workaround',
  'binary-writes-preserve-deterministic-output',
  'buffer-compatibility-works-in-webview-runtime',
  'search-frozen-paths-remain-unchanged',
  'no-secret-exposure',
  'processing-errors-preserve-processing-stage',
  'fetch-errors-remain-fetch-errors',
  'post-download-errors-are-never-mislabeled-as-fetch',
  'browser-native-behavior-remains-deterministic',
] as const;

export const WEBVIEW_BINARY_RUNTIME_COMPATIBILITY_LOCK_MATERIAL =
  `${WEBVIEW_BINARY_RUNTIME_COMPATIBILITY_LOCK_ID}\n${WEBVIEW_BINARY_RUNTIME_COMPATIBILITY_LOCK_INVARIANTS.join('\n')}`;

