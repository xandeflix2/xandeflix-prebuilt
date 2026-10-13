import type { KeyboardEvent } from 'react';

/** Local ordered controls: the global page geometry cannot route a floating notice. */
export function navigateErrorControls(event: KeyboardEvent<HTMLElement>, close: () => void): void {
  const key = event.key;
  if (['Escape', 'Backspace', 'GoBack'].includes(key)) {
    event.preventDefault(); event.stopPropagation(); close(); return;
  }
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button.focusable-item:not([disabled])'));
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (key === 'Enter' || key === ' ' || event.keyCode === 23) {
    event.preventDefault(); event.stopPropagation();
    if (!event.repeat) buttons[current]?.click();
    return;
  }
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
  event.preventDefault(); event.stopPropagation();
  const forward = key === 'ArrowDown' || key === 'ArrowRight';
  const next = current < 0 ? 0 : Math.max(0, Math.min(buttons.length - 1, current + (forward ? 1 : -1)));
  buttons[next]?.focus({ preventScroll: true });
  buttons[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
}
