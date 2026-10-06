/**
 * Pfad als Polylinie in Milli-Tiles. Position aus zurückgelegter Distanz (ganzzahlig),
 * Abdeckung je Slot = Pfadlänge in Reichweite (Stichprobe alle COVERAGE_STEP Milli-Tiles).
 */
import { dist2, isqrt } from './fixed.js';

export interface Path {
  /** Stützpunkte in Milli-Tiles. */
  points: { x: number; y: number }[];
  /** cum[i] = Distanz vom Start bis points[i]. */
  cum: number[];
  /** Gesamtlänge in Milli-Tiles. */
  length: number;
}

export const COVERAGE_STEP = 100;

export function buildPath(waypoints: [number, number][]): Path {
  const points = waypoints.map(([x, y]) => ({ x, y }));
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    cum.push(cum[i - 1] + isqrt(dist2(a.x, a.y, b.x, b.y)));
  }
  return { points, cum, length: cum[cum.length - 1] };
}

/** Position bei Distanz d (0..length); Interpolation per Ganzzahl-Division (gegen 0 gerundet). */
export function positionAt(path: Path, d: number): { x: number; y: number } {
  if (d <= 0) return { x: path.points[0].x, y: path.points[0].y };
  if (d >= path.length) {
    const l = path.points[path.points.length - 1];
    return { x: l.x, y: l.y };
  }
  let i = 1;
  while (path.cum[i] < d) i++;
  const a = path.points[i - 1];
  const b = path.points[i];
  const segLen = path.cum[i] - path.cum[i - 1];
  const off = d - path.cum[i - 1];
  return {
    x: a.x + Math.trunc(((b.x - a.x) * off) / segLen),
    y: a.y + Math.trunc(((b.y - a.y) * off) / segLen),
  };
}

/** Pfadlänge (Milli-Tiles) innerhalb von `range` um (x,y); Näherung per Stichprobe. */
export function coverage(path: Path, x: number, y: number, range: number): number {
  const r2 = range * range;
  let n = 0;
  for (let d = 0; d <= path.length; d += COVERAGE_STEP) {
    const p = positionAt(path, d);
    if (dist2(x, y, p.x, p.y) <= r2) n++;
  }
  return Math.min(n * COVERAGE_STEP, path.length);
}
