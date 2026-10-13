/** User gesture only; clipboard stays on this device. */
export async function copyActivationText(text: string): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch { /* Older WebView: try the local compatibility API. */ }
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') throw new Error('COPY_UNAVAILABLE');
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const scrollX = window.scrollX, scrollY = window.scrollY;
  const selection = document.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
  const input = document.createElement('textarea');
  input.value = text;
  input.readOnly = true;
  input.setAttribute('aria-hidden', 'true');
  input.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(input);
  try {
    input.focus({ preventScroll: true });
    input.select();
    if (!document.execCommand('copy')) throw new Error('COPY_UNAVAILABLE');
  } finally {
    input.remove();
    if (selection) { selection.removeAllRanges(); for (const range of ranges) selection.addRange(range); }
    previousFocus?.focus({ preventScroll: true });
    window.scrollTo(scrollX, scrollY);
  }
}
