// Kept local to the parental editor: form order must not depend on TV geometry.
export function parentalControls(page: Element): HTMLElement[] {
  return Array.from(page.querySelectorAll<HTMLElement>('.focusable-item')).filter(control =>
    !control.matches(':disabled') && !control.closest('[hidden], [aria-hidden="true"]')
    && control.getClientRects().length > 0);
}

export function parentalEntry(page: Element): HTMLElement | undefined {
  return parentalControls(page).find(control => control.getAttribute('role') !== 'radio'
    || control.getAttribute('aria-checked') === 'true');
}

export function parentalDpadTarget(page: Element, current: HTMLElement, key: string, back: HTMLElement | null, menu: HTMLElement | null): HTMLElement {
  const controls = parentalControls(page);
  const group = current.closest('.parental-age-options');
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const row = group || current.closest('.parental-actions');
    if (row) {
      const siblings = controls.filter(control => row.contains(control));
      return siblings[siblings.indexOf(current) + (key === 'ArrowRight' ? 1 : -1)] || current;
    }
    return key === 'ArrowLeft' ? menu || back || current : current;
  }
  // An age group is one vertical stop. Left/right reaches its individual ages.
  const stops = controls.filter(control => {
    const options = control.closest('.parental-age-options');
    return !options || (options === group ? control === current : control.getAttribute('aria-checked') === 'true');
  });
  const index = stops.indexOf(current);
  if (index < 0) return controls[0] || back || menu || current;
  return stops[index + (key === 'ArrowDown' ? 1 : -1)]
    || (key === 'ArrowUp' ? back || menu : null) || current;
}
