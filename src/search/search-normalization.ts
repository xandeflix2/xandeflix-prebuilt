/**
 * Xandeflix Prebuilt — Search Normalization (Gate G7)
 *
 * Funções determinísticas de normalização e tokenização de texto para indexação e busca.
 *
 * Princípios:
 * - SEARCH_NORMALIZATION_VERSION = 1
 * - UNICODE_NORMALIZE = NFD com remoção segura de diacríticos
 * - CASE_INSENSITIVE = SIM (lowercase)
 * - DIACRITIC_INSENSITIVE = SIM ("Questão" -> "questao", "Tá Chovendo" -> "ta chovendo")
 * - PUNCTUATION_SAFE = SIM (substituição determinística por espaços)
 * - WHITESPACE_NORMALIZATION = SIM (trim e colapso de espaços múltiplos)
 * - MIN_TOKEN_LENGTH = 2 (exceto dígitos numéricos únicos)
 * - LOCALE_INDEPENDENT = SIM
 */

export const MIN_TOKEN_LENGTH = 2;
export const MIN_PREFIX_LENGTH = 2;

/**
 * Normaliza uma string de texto removendo acentos, convertendo para minúsculas,
 * tratando pontuação e colapsando espaços em branco.
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (typeof text !== 'string') return '';

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos/acentos
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // substitui pontuação por espaço
    .replace(/\s+/g, ' ') // colapsa múltiplos espaços
    .trim();
}

/**
 * Quebra um texto normalizado em tokens estáveis para indexação e consulta.
 * Descarta tokens menores que MIN_TOKEN_LENGTH, exceto dígitos individuais (ex: "1", "2").
 */
export function tokenize(text: string | null | undefined): string[] {
  const normalized = normalizeSearchText(text);
  if (!normalized) return [];

  const rawTokens = normalized.split(' ');
  const validTokens: string[] = [];

  for (const token of rawTokens) {
    if (!token) continue;
    // Aceita tokens com pelo menos MIN_TOKEN_LENGTH caracteres ou dígitos individuais (ex: filme "1")
    if (token.length >= MIN_TOKEN_LENGTH || /^\d$/.test(token)) {
      validTokens.push(token);
    }
  }

  return validTokens;
}

/**
 * Extrai e deduplica tokens de múltiplos campos de texto (título, título original, etc.).
 * Retorna lista ordenada deterministicamente.
 */
export function extractUniqueTokens(...fields: (string | null | undefined)[]): string[] {
  const tokenSet = new Set<string>();

  for (const field of fields) {
    const tokens = tokenize(field);
    for (const t of tokens) {
      tokenSet.add(t);
    }
  }

  return Array.from(tokenSet).sort();
}
