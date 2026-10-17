/** Presentation only: generic source labels are not evidence of a genre. */
export function meaningfulDetailGenres(labels: readonly string[]): string[] {
  const seen = new Set<string>();
  return labels.map(label => label.trim()).filter(label => {
    const key = label.toLocaleLowerCase('pt-BR');
    if (!key || key === 'geral' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
