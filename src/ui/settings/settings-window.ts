function controls(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>('.focusable-item:not([disabled])'))
    .filter(control => control.getClientRects().length > 0);
}

/** Keyboard scope exists only while this settings window is open. */
export function openSettingsWindow(dialog: HTMLDialogElement, trigger: HTMLElement): () => void {
  if (dialog.open) return () => {};
  dialog.showModal();
  const items = controls(dialog);
  (items.find(item => !item.hasAttribute('data-settings-close')) || items[0])?.focus({ preventScroll: true });

  const keydown = (event: KeyboardEvent) => {
    if (!dialog.open || Array.from(document.querySelectorAll('dialog[open]')).some(other => other !== dialog)) return;
    const editing = event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.matches('input, textarea, select'));
    if (event.key === 'Escape' || (event.key === 'Backspace' && !editing)) {
      event.preventDefault(); event.stopImmediatePropagation(); dialog.close(); return;
    }
    const tab = event.key === 'Tab';
    if (!tab && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    if (editing && !tab) return;
    const available = controls(dialog);
    if (!available.length) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const index = available.indexOf(document.activeElement as HTMLElement);
    const backward = tab ? event.shiftKey : event.key === 'ArrowUp' || event.key === 'ArrowLeft';
    const next = available[index < 0 ? 0 : (index + (backward ? -1 : 1) + available.length) % available.length];
    next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const detach = () => {
    window.removeEventListener('keydown', keydown, true);
    dialog.removeEventListener('close', closed);
  };
  const closed = () => {
    detach();
    if (trigger.isConnected && !document.querySelector('dialog[open]')) trigger.focus({ preventScroll: true });
  };
  window.addEventListener('keydown', keydown, true);
  dialog.addEventListener('close', closed);
  return () => { detach(); if (dialog.open) dialog.close(); };
}

/** Leave the current settings window before opening an existing destination. */
export function openSettingsDestination(action?: () => void): void {
  if (!action) return;
  document.querySelector<HTMLDialogElement>('dialog[data-settings-modal][open]')?.close();
  action();
}
