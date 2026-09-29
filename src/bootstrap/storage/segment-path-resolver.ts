/**
 * Xandeflix Prebuilt - Canonical Segment Path Resolver
 */

export const SEGMENT_DIR = 'segments';
export const SEGMENT_PATH_ROOT_CAUSE_FIXED = true;
export const CANONICAL_SEGMENT_PATH_RESOLVER = true;
export const SEGMENT_PATH_RESOLUTION_SINGLE_SOURCE_OF_TRUTH = true;
export const NO_DOUBLE_PREFIX = true;

export function resolveSegmentRelativePath(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('[SEGMENT_PATH_INVALID] Nome de arquivo de segmento invalido ou nulo');
  }

  const trimmed = fileName.trim();
  if (!trimmed) {
    throw new Error('[SEGMENT_PATH_INVALID] Nome de arquivo de segmento vazio');
  }

  // 1. Checagem de schemes (file://, content://, http://, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+-.]*:\/\//.test(trimmed)) {
    throw new Error('[SEGMENT_PATH_SECURITY] Scheme nao permitido em segmento: ' + trimmed);
  }

  // 2. Checagem de drive letter (C:, D:, etc.)
  if (/^[a-zA-Z]:/.test(trimmed)) {
    throw new Error('[SEGMENT_PATH_SECURITY] Drive letter nao permitido em segmento: ' + trimmed);
  }

  // 3. Checagem de leading slash
  if (trimmed.startsWith('/') || trimmed.startsWith('\\')) {
    throw new Error('[SEGMENT_PATH_SECURITY] Caminho absoluto nao permitido em segmento: ' + trimmed);
  }

  // 4. Checagem de URL encoded characters que possam mascarar traversal
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    throw new Error('[SEGMENT_PATH_SECURITY] Encoding invalido no segmento: ' + trimmed);
  }

  // 5. Checagem de directory traversal (.. ou ../ ou ..\)
  if (decoded.includes('..') || trimmed.includes('..')) {
    throw new Error('[SEGMENT_PATH_SECURITY] Path traversal detectado em segmento: ' + trimmed);
  }

  // 6. Normalizacao de barras invertidas para barras normais
  const normalized = decoded.replace(/\\+/g, '/');

  // 7. Checagem se ja possui o prefixo 'segments/' (NO_DOUBLE_PREFIX)
  const prefix = SEGMENT_DIR + '/';
  if (normalized.startsWith(prefix)) {
    const after = normalized.substring(prefix.length);
    if (!after || after.includes('/') || after.includes('..')) {
      throw new Error('[SEGMENT_PATH_SECURITY] Subcaminho invalido sob segments: ' + trimmed);
    }
    return prefix + after;
  }

  // Se tem barra intermediaria mas nao comeca com segments/
  if (normalized.includes('/')) {
    throw new Error('[SEGMENT_PATH_SECURITY] Segmento fora do diretorio segments/: ' + trimmed);
  }

  return prefix + normalized;
}
