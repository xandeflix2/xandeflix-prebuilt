interface SquareLiveWindow {
  width: number;
  height: number;
  touch: boolean;
  television: boolean;
}

export function shouldUseSquareLive({ width, height, touch, television }: SquareLiveWindow): boolean {
  if (television || !touch || !Number.isFinite(width) || !Number.isFinite(height) || Math.min(width, height) < 600) return false;
  const ratio = width / height;
  return ratio >= 0.8 && ratio <= 1.25;
}
