/** Shared by capture and window handlers. A discrete press is never delayed. */
let last = -Infinity;
export function acceptDpadRepeat(event: { repeat: boolean }, now = performance.now()): boolean {
  if (event.repeat && now - last < 55) return false;
  last = now;
  return true;
}
