/**
 * Pfad als Polylinie in Milli-px. Position aus zurückgelegter Distanz (ganzzahlig),
 * Abdeckung je Position = Pfadlänge in Reichweite (Stichprobe alle COVERAGE_STEP Milli-px, Ergebnis je (x, y, Reichweite) gecacht),
 * Abstand eines Punkts zum Pfad (ganzzahlig, für die Platzierung).
 */
import { dist2, isqrt } from './fixed.js';

export interface Path {
  /** Stützpunkte in Milli-px. */
  points: { x: number; y: number }[];
  /** cum[i] = Distanz vom Start bis points[i]. */
  cum: number[];
  /** Gesamtlänge in Milli-px. */
  length: number;
  /** Stichproben alle COVERAGE_STEP Milli-px (Index k = Distanz k * COVERAGE_STEP), einmal beim Bau berechnet. */
  samples: { x: number; y: number }[];
  /** Abdeckungs-Cache (Schlüssel aus x, y, Reichweite), geteilt von allen Sims mit demselben Pfad (rein von der Geometrie abhängig). */
  covCache: Map<number, number>;
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
  const path: Path = { points, cum, length: cum[cum.length - 1], samples: [], covCache: sharedCoverageCache(points) };
  for (let d = 0; d <= path.length; d += COVERAGE_STEP) path.samples.push(positionAt(path, d));
  return path;
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

const COV_CACHE_MAX = 400_000;
const pathCaches = new Map<string, Map<number, number>>();

/** Gemeinsamer Cache für alle Pfade mit gleicher Geometrie (jede `createSim`-Instanz baut den Pfad neu). */
export function sharedCoverageCache(points: readonly { x: number; y: number }[]): Map<number, number> {
  const key = points.map((p) => `${p.x},${p.y}`).join(';');
  let c = pathCaches.get(key);
  if (!c) {
    c = new Map();
    pathCaches.set(key, c);
  }
  return c;
}

/** Pfadlänge (Milli-px) innerhalb von `range` um (x,y); Näherung per Stichprobe, je (x, y, range) gecacht. */
export function coverage(path: Path, x: number, y: number, range: number): number {
  // Schlüssel eindeutig für |x|, |y| < 2^15 (+ Offset) und range < 2^14.
  const key = ((x + 32768) * 65536 + (y + 32768)) * 16384 + range;
  const hit = path.covCache.get(key);
  if (hit !== undefined) return hit;
  const r2 = range * range;
  let n = 0;
  const s = path.samples;
  for (let i = 0; i < s.length; i++) {
    const dx = x - s[i].x;
    const dy = y - s[i].y;
    if (dx * dx + dy * dy <= r2) n++;
  }
  const v = Math.min(n * COVERAGE_STEP, path.length);
  if (path.covCache.size >= COV_CACHE_MAX) path.covCache.clear();
  path.covCache.set(key, v);
  return v;
}

/**
 * Ist (x, y) mindestens `r` Milli-px von jeder Strecke des Pfads entfernt? Ganzzahlig und exakt: Endpunkte per Quadratvergleich,
 * Strecken-Inneres per Kreuzprodukt (|cross| / Länge = Abstand, verglichen als cross^2 gegen r^2 * len^2; ein grober Vorab-Vergleich
 * hält die Zwischenwerte unter 2^53).
 */
export function pathClearance(path: Path, x: number, y: number, r: number): boolean {
  const r2 = r * r;
  const pts = path.points;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const px = x - a.x;
    const py = y - a.y;
    const len2 = ex * ex + ey * ey;
    const dot = px * ex + py * ey;
    if (len2 === 0 || dot <= 0) {
      if (px * px + py * py < r2) return false;
    } else if (dot >= len2) {
      const qx = x - b.x;
      const qy = y - b.y;
      if (qx * qx + qy * qy < r2) return false;
    } else {
      const cross = Math.abs(px * ey - py * ex);
      const lenCeil = isqrt(len2) + 1;
      if (cross > r * lenCeil) continue; // sicher weiter weg als r
      if (cross * cross < r2 * len2) return false;
    }
  }
  return true;
}

/**
 * Nächster Punkt auf dem Weg zu (x, y): Fortschritt (Milli-px) und quadrierter Abstand zur Wegmitte an diesem Fortschritt.
 * Projektion in Fließkomma (nur `+ - * /`, deterministisch), Ergebnis auf ganze Milli-px gerundet und der Abstand
 * ganzzahlig an der gerundeten Position neu gemessen.
 */
export function nearestOnPath(path: Path, x: number, y: number): { progress: number; d2: number } {
  let bestD = Infinity;
  let bestProg = 0;
  const pts = path.points;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const len2 = ex * ex + ey * ey;
    let t = len2 === 0 ? 0 : ((x - a.x) * ex + (y - a.y) * ey) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = a.x + ex * t - x;
    const qy = a.y + ey * t - y;
    const d = qx * qx + qy * qy;
    if (d < bestD) {
      bestD = d;
      bestProg = path.cum[i - 1] + t * (path.cum[i] - path.cum[i - 1]);
    }
  }
  const progress = Math.max(0, Math.min(path.length, Math.round(bestProg)));
  const pos = positionAt(path, progress);
  return { progress, d2: dist2(x, y, pos.x, pos.y) };
}
