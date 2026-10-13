/** UI order only. Never changes the canonical catalog, IDs or artwork links. */
export function isReleaseCategory(name: string): boolean {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /\blancamentos?\b/.test(normalized);
}

export function createPresentationSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) || 1;
}

/** Stable for a visit/snapshot, avoiding focus movement on ordinary re-renders. */
export function orderCategoryItems<T>(items: readonly T[], categoryName: string, seed: number): T[] {
  const ordered = [...items];
  if (isReleaseCategory(categoryName)) return ordered;
  let state = seed >>> 0 || 1;
  for (const char of categoryName) state = (Math.imul(state, 31) + char.charCodeAt(0)) >>> 0;
  state ||= 1;
  // Preserve already displayed pages when infinite browsing appends its next 48.
  for (let start = 0; start < ordered.length; start += 48) {
    for (let index = Math.min(start + 48, ordered.length) - 1; index > start; index--) {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      const position = start + (state >>> 0) % (index - start + 1);
      [ordered[index], ordered[position]] = [ordered[position], ordered[index]];
    }
  }
  return ordered;
}
