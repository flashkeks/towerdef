/**
 * Gemeinsames Werkzeug der Winter- und Steinbruchkarte (Runde 15 / B1): Splines, Masken, Abstandsfelder, Wegfelder.
 * Reine Funktionen, laufen in Node und Browser gleich.
 */
import { MAP_H, MAP_W, segDist } from './layout';

export type Pt = [number, number];

function cr(p0: number, p1: number, p2: number, p3: number, t: number): number {
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}

/** Geschlossener Catmull-Rom-Spline durch die Stuetzpunkte, `step` px je Teilstueck, gerundet auf ganze Pixel. */
export function closedSpline(ctrl: Pt[], step = 4): Pt[] {
  const n = ctrl.length, out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = ctrl[(i + n - 1) % n], b = ctrl[i], c = ctrl[(i + 1) % n], d = ctrl[(i + 2) % n];
    const k = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / step));
    for (let s = 0; s < k; s++) out.push([cr(a[0], b[0], c[0], d[0], s / k), cr(a[1], b[1], c[1], d[1], s / k)]);
  }
  return out;
}

/** Offener Spline (Endpunkte verdoppelt). */
export function openSpline(ctrl: Pt[], step = 2): Pt[] {
  const n = ctrl.length, out: Pt[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = ctrl[Math.max(0, i - 1)], b = ctrl[i], c = ctrl[i + 1], d = ctrl[Math.min(n - 1, i + 2)];
    const k = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / step));
    for (let s = 0; s < k; s++) out.push([cr(a[0], b[0], c[0], d[0], s / k), cr(a[1], b[1], c[1], d[1], s / k)]);
  }
  out.push(ctrl[n - 1]);
  return out;
}

/** Punkt-im-Polygon (Pixelmitte). */
export function inPoly(x: number, y: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Vorzeichenbehaftetes Abstandsfeld (px): < 0 innerhalb der Polygone, > 0 ausserhalb. Chamfer 3-4 ueber das ganze Bild. */
export function polySdf(polys: Pt[][], W = MAP_W, H = MAP_H): Float32Array {
  const mask = new Uint8Array(W * H);
  for (const poly of polys) {
    let y0 = H, y1 = 0, x0 = W, x1 = 0;
    for (const [x, y] of poly) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, Math.ceil(y1)); y++)
      for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(W - 1, Math.ceil(x1)); x++)
        if (inPoly(x + 0.5, y + 0.5, poly)) mask[y * W + x] = 1;
  }
  const dist = (inside: number): Float32Array => {
    const d = new Float32Array(W * H);
    const BIG = 1e5;
    for (let i = 0; i < d.length; i++) d[i] = mask[i] === inside ? BIG : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = d[i];
      if (!v) continue;
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, d[i - W] + 1);
        if (x > 0) v = Math.min(v, d[i - W - 1] + 1.414);
        if (x < W - 1) v = Math.min(v, d[i - W + 1] + 1.414);
      }
      d[i] = v;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      let v = d[i];
      if (!v) continue;
      if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < H - 1) {
        v = Math.min(v, d[i + W] + 1);
        if (x < W - 1) v = Math.min(v, d[i + W + 1] + 1.414);
        if (x > 0) v = Math.min(v, d[i + W - 1] + 1.414);
      }
      d[i] = v;
    }
    return d;
  };
  const dOut = dist(0), dIn = dist(1); // dOut: Abstand der Aussenpixel zur Maske, dIn: der Innenpixel zum Rand
  const out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) out[i] = mask[i] ? -(dIn[i] - 0.5) : dOut[i] - 0.5;
  return out;
}

/** Feld mit Zugriff ausserhalb des Bildes (geklemmt). */
export class Field {
  constructor(readonly d: Float32Array, readonly w = MAP_W, readonly h = MAP_H) {}
  at(x: number, y: number): number {
    return this.d[Math.max(0, Math.min(this.h - 1, y | 0)) * this.w + Math.max(0, Math.min(this.w - 1, x | 0))];
  }
  /** Gradient (zentrale Differenz) */
  grad(x: number, y: number): [number, number] {
    return [(this.at(x + 1, y) - this.at(x - 1, y)) / 2, (this.at(x, y + 1) - this.at(x, y - 1)) / 2];
  }
}

/** Abstand zu mehreren Wegstuecken je Pixel. */
export function pathField(branches: Pt[][], W = MAP_W, H = MAP_H): Field {
  const d = new Float32Array(W * H).fill(1e4);
  for (const br of branches) for (let i = 1; i < br.length; i++) {
    const [ax, ay] = br[i - 1], [bx, by] = br[i];
    const pad = 40;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - pad)), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx) + pad));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by) - pad)), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by) + pad));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const v = segDist(x + 0.5, y + 0.5, ax, ay, bx, by);
      if (v < d[y * W + x]) d[y * W + x] = v;
    }
  }
  return new Field(d, W, H);
}

export function pathDistAll(branches: Pt[][], x: number, y: number): number {
  let d = 1e9;
  for (const br of branches) for (let i = 1; i < br.length; i++) d = Math.min(d, segDist(x, y, br[i - 1][0], br[i - 1][1], br[i][0], br[i][1]));
  return d;
}

/** Punkte entlang eines Linienzugs im Abstand `every` px, mit Laufrichtung (Einheitsvektor). */
export function walk(poly: Pt[], every: number, start = 0): { x: number; y: number; dx: number; dy: number }[] {
  const out: { x: number; y: number; dx: number; dy: number }[] = [];
  let next = start; // Strecke bis zur naechsten Probe
  for (let i = 1; i < poly.length; i++) {
    const [ax, ay] = poly[i - 1], [bx, by] = poly[i];
    const len = Math.hypot(bx - ax, by - ay);
    if (!len) continue;
    const dx = (bx - ax) / len, dy = (by - ay) / len;
    let t = next;
    for (; t < len; t += every) out.push({ x: ax + dx * t, y: ay + dy * t, dx, dy });
    next = t - len;
  }
  return out;
}

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Vereinfachtes Polygon fuer die Sim: jeder `k`-te Punkt, gerundet. */
export function simplify(poly: Pt[], k = 3): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i += k) out.push([Math.round(poly[i][0]), Math.round(poly[i][1])]);
  return out;
}

export const pathLength = (br: Pt[]): number => br.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - br[i - 1][0], p[1] - br[i - 1][1]) : 0), 0);
