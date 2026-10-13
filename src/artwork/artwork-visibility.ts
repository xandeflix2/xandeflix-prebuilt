/** Shared viewport observation; a horizontal rail does not make all its posters visible. */
type Visibility = { near: boolean; visible: boolean };
type Entry = Visibility & { listeners: Set<(value: Visibility) => void> };
const targets = new Map<Element, Entry>();
let nearby: IntersectionObserver | undefined, onscreen: IntersectionObserver | undefined;
function changed(entries: IntersectionObserverEntry[], field: keyof Visibility): void {
  for (const change of entries) {
    const target = targets.get(change.target);
    if (!target || target[field] === change.isIntersecting) continue;
    target[field] = change.isIntersecting;
    for (const listener of target.listeners) listener({ near: target.near, visible: target.visible });
  }
}
export function observeArtwork(element: Element, listener: (value: Visibility) => void): () => void {
  if (typeof IntersectionObserver === 'undefined') { listener({ near: true, visible: true }); return () => {}; }
  if (!nearby) nearby = new IntersectionObserver(entries => changed(entries, 'near'), { rootMargin: '600px 200px' });
  if (!onscreen) onscreen = new IntersectionObserver(entries => changed(entries, 'visible'));
  let target = targets.get(element);
  if (!target) {
    target = { near: false, visible: false, listeners: new Set() };
    targets.set(element, target); nearby.observe(element); onscreen.observe(element);
  }
  target.listeners.add(listener); listener({ near: target.near, visible: target.visible });
  return () => {
    const current = targets.get(element); current?.listeners.delete(listener);
    if (current && !current.listeners.size) { targets.delete(element); nearby?.unobserve(element); onscreen?.unobserve(element); }
    if (!targets.size) { nearby?.disconnect(); onscreen?.disconnect(); nearby = onscreen = undefined; }
  };
}
