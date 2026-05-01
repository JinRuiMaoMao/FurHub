/** Worklet-safe: pill left edge from finger x (center pill under finger). */
export function clampPillX(x: number, pillW: number, maxX: number) {
  'worklet';
  const raw = x - pillW / 2;
  return Math.max(0, Math.min(maxX, raw));
}

/** Same geometry as `clampPillX`, for JS thread (e.g. press-in teleport). */
export function pillLeftFromFingerBarX(barFingerX: number, pillW: number, maxPillLeft: number): number {
  const raw = barFingerX - pillW / 2;
  return Math.max(0, Math.min(maxPillLeft, raw));
}
