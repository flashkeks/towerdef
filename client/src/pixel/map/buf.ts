/**
 * Index-Puffer fuer die Karte (Runde 11 / P3): jedes Pixel ist ein Palettenindex (0 = durchsichtig, n = PAL_NAMES[n-1]).
 * Damit kann nichts ausserhalb der Palette entstehen. Alles reine Funktionen, laeuft in Node (Vorschau-PNG, Tests)
 * und im Browser (`toCanvas`).
 */
import { PAL, PAL_NAMES, type PalName } from '../palette';

export const C = Object.fromEntries(PAL_NAMES.map((n, i) => [n, i + 1])) as Record<PalName, number>;
export const NAME_OF = (c: number): PalName => PAL_NAMES[c - 1];

/** Dunklere / hellere Nachbarfarbe in der Palette (fuer Schatten und Licht ohne Zwischenfarben). */
const SHADE_PAIRS: Partial<Record<PalName, PalName>> = {
  white: 'silver', silver: 'stone', stone: 'slate', slate: 'dusk', dusk: 'night', night: 'ink',
  yellow: 'amber', amber: 'orange', orange: 'rust', clay: 'rust', rust: 'crimson', crimson: 'plum', red: 'crimson',
  leaf: 'grass', grass: 'pine', pine: 'deep', deep: 'ink',
  ice: 'sky', sky: 'navy', navy: 'night',
  sand: 'tan', peach: 'tan', skin: 'tan', tan: 'wood', wood: 'bark', bark: 'plum', plum: 'ink',
  coral: 'orchid', orchid: 'violet', violet: 'plum', magenta: 'crimson',
};
const LIGHT_PAIRS: Partial<Record<PalName, PalName>> = {};
for (const [a, b] of Object.entries(SHADE_PAIRS) as [PalName, PalName][]) if (!LIGHT_PAIRS[b]) LIGHT_PAIRS[b] = a;

export const shadeIdx = (c: number, steps = 1): number => {
  let n = NAME_OF(c);
  for (let i = 0; i < steps; i++) n = SHADE_PAIRS[n] ?? n;
  return C[n];
};
export const lightIdx = (c: number, steps = 1): number => {
  let n = NAME_OF(c);
  for (let i = 0; i < steps; i++) n = LIGHT_PAIRS[n] ?? n;
  return C[n];
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Geordnetes Raster 0..1 (4x4 Bayer) fuer Dither-Uebergaenge. */
export const bayer = (x: number, y: number): number => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

export class Buf {
  readonly d: Uint8Array;
  constructor(readonly w: number, readonly h: number) {
    this.d = new Uint8Array(w * h);
  }
  get(x: number, y: number): number {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[y * this.w + x];
  }
  set(x: number, y: number, c: number): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  }
  /** Nur auf durchsichtige Pixel malen. */
  under(x: number, y: number, c: number): void {
    if (this.get(x, y) === 0) this.set(x, y, c);
  }
  fill(c: number): void {
    this.d.fill(c);
  }
  rect(x: number, y: number, w: number, h: number, c: number): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  /** Scheibe mit Mittelpunkt (cx, cy) und Radius r (Pixelmitten). */
  disc(cx: number, cy: number, r: number, c: number): void {
    this.each(cx, cy, r, r, (x, y) => this.set(x, y, c));
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: number): void {
    this.each(cx, cy, rx, ry, (x, y) => this.set(x, y, c));
  }
  /** Ruft fn fuer jedes Pixel in der Ellipse auf. */
  each(cx: number, cy: number, rx: number, ry: number, fn: (x: number, y: number) => void): void {
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
        if (dx * dx + dy * dy <= 1) fn(x, y);
      }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number): void {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /** Legt src bei (dx, dy) ueber diesen Puffer (0 in src laesst durchscheinen). */
  blit(src: Buf, dx: number, dy: number): void {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const c = src.d[y * src.w + x];
      if (c) this.set(x + dx, y + dy, c);
    }
  }
  /** Dunkelt vorhandene Pixel ab (Schatten): nur dort, wo die Maske `mask(x,y)` wahr ist. */
  darken(mask: (x: number, y: number) => boolean, steps = 1): void {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = y * this.w + x;
      if (this.d[i] && mask(x, y)) this.d[i] = shadeIdx(this.d[i], steps);
    }
  }
  /** 1-px-Umriss um alle sichtbaren Pixel (4er-Nachbarschaft); der Puffer braucht dafuer 1 px freien Rand. */
  outline(c: number, diag = false): void {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.d[y * this.w + x]) continue;
      const n = this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1) ||
        (diag && (this.get(x - 1, y - 1) || this.get(x + 1, y - 1) || this.get(x - 1, y + 1) || this.get(x + 1, y + 1)));
      if (n) add.push(y * this.w + x);
    }
    for (const i of add) this.d[i] = c;
  }
  clone(): Buf {
    const b = new Buf(this.w, this.h);
    b.d.set(this.d);
    return b;
  }
  /** Rahmen um die belegten Pixel (fuer Schnitt) */
  bounds(): { x: number; y: number; w: number; h: number } | null {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.d[y * this.w + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  rgba(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(this.w * this.h * 4);
    const lut = PAL_NAMES.map((n) => {
      const v = parseInt(PAL[n].slice(1), 16);
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    });
    for (let i = 0; i < this.d.length; i++) {
      const c = this.d[i];
      if (!c) continue;
      const [r, g, b] = lut[c - 1];
      out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = 255;
    }
    return out;
  }
  toCanvas(): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = this.w;
    cv.height = this.h;
    const g = cv.getContext('2d') as CanvasRenderingContext2D;
    g.putImageData(new ImageData(this.rgba() as Uint8ClampedArray<ArrayBuffer>, this.w, this.h), 0, 0);
    return cv;
  }
}

/** Ganzzahl-Hash -> 0..1 (deterministisch, ohne Zustand). */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Weiches Wertrauschen 0..1 auf Gittergroesse `scale`. */
export function vnoise(x: number, y: number, scale: number, seed = 0): number {
  const gx = x / scale, gy = y / scale;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, seed), b = hash2(x0 + 1, y0, seed), c = hash2(x0, y0 + 1, seed), d = hash2(x0 + 1, y0 + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
export const fbm = (x: number, y: number, seed = 0): number => vnoise(x, y, 48, seed) * 0.55 + vnoise(x, y, 20, seed + 7) * 0.3 + vnoise(x, y, 8, seed + 13) * 0.15;

/** Kleiner deterministischer Zufall (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
