export interface ParentalClock { clockId: string; elapsedMs: number }
export interface ParentalPinBlock { clockId: string; elapsedAtMs: number; remainingMs: number }
export function validParentalClock(value: ParentalClock): boolean {
  return Boolean(value && typeof value.clockId === 'string' && /^[a-zA-Z0-9:_-]{1,128}$/.test(value.clockId)
    && Number.isSafeInteger(value.elapsedMs) && value.elapsedMs >= 0);
}
export function remainingPinBlock(block: ParentalPinBlock, clock: ParentalClock): number {
  if (!validParentalClock(clock)) throw new Error('PARENTAL_CLOCK_UNAVAILABLE');
  return block.clockId === clock.clockId && clock.elapsedMs >= block.elapsedAtMs
    ? Math.max(0, block.remainingMs - (clock.elapsedMs - block.elapsedAtMs)) : block.remainingMs;
}
