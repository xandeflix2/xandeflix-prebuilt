/** Bounded, ephemeral evidence of generic source artwork across unrelated titles. */
export class SeriesPosterClaims {
  private readonly entries = new Map<string, { titles: Set<string>; shared: boolean; listeners: Set<(shared: boolean) => void> }>();
  get size(): number { return this.entries.size; }
  watch(uri: string, identity: string, listener: (shared: boolean) => void): () => void {
    let entry = this.entries.get(uri);
    if (!entry) {
      if (this.entries.size >= 512) {
        const idle = [...this.entries].find(([, value]) => !value.listeners.size)?.[0];
        if (idle) this.entries.delete(idle);
        else { listener(false); return () => {}; }
      }
      entry = { titles: new Set(), shared: false, listeners: new Set() };
    }
    this.entries.delete(uri); this.entries.set(uri, entry);
    entry.listeners.add(listener);
    if (!entry.shared) entry.titles.add(identity);
    if (!entry.shared && entry.titles.size >= 3) {
      entry.shared = true;
      for (const notify of entry.listeners) notify(true);
    } else listener(entry.shared);
    return () => { entry.listeners.delete(listener); };
  }
}
export const seriesPosterClaims = new SeriesPosterClaims();
