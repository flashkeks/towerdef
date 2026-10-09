/**
 * Zeichenflaeche fuer prozedurale Pixel-Sprites (Runde 11, P2). Wie die Zeichenbefehle des Kek-Games (afx.js):
 * alles in GANZEN Pixeln, nur Palettenfarben. Eine Flaeche haelt je Pixel einen Palettennamen (oder nichts) und
 * wird am Ende zu einem Text-Raster (`toRows`), das mit raster.ts weiterverarbeitet wird (outline, flipX, toRGBA ...).
 * Reine Funktionen, kein DOM.
 */
import type { PalName } from '../palette';
import { OUTLINE_CHAR, type CharMap, type Rows } from '../raster';

/** Palettenname -> ein Zeichen im Raster (alle 32 Namen, '.' und '#' bleiben frei). */
export const PCH: Record<PalName, string> = {
  rust: 'r', clay: 'c', sand: 's', skin: 'k', wood: 'w', bark: 'b', plum: 'p',
  crimson: 'C', red: 'R', orange: 'O', amber: 'A', yellow: 'Y',
  leaf: 'L', grass: 'G', pine: 'P', deep: 'D',
  navy: 'N', sky: 'S', ice: 'I',
  white: 'W', silver: 'V', stone: 'T', slate: 'E', dusk: 'U', night: 'H', ink: 'X',
  magenta: 'M', violet: 'v', orchid: 'o', coral: 'f', peach: 'h', tan: 't',
};
const UNPCH = Object.fromEntries(Object.entries(PCH).map(([n, c]) => [c, n])) as Record<string, PalName>;
/** Zeichen -> Palettenname fuer `toRGBA`/`paint` (jedes Raster aus `Surface.toRows`). */
export const FULL_MAP: CharMap = UNPCH;

/** Tonleiter dunkel -> mittel -> hell. */
export type Ramp = readonly [PalName, PalName, PalName];

export const RAMPS = {
  leaf: ['pine', 'grass', 'leaf'] as Ramp,
  deepLeaf: ['deep', 'pine', 'grass'] as Ramp,
  wood: ['bark', 'wood', 'tan'] as Ramp,
  darkWood: ['plum', 'bark', 'wood'] as Ramp,
  skin: ['tan', 'skin', 'peach'] as Ramp,
  brass: ['rust', 'amber', 'yellow'] as Ramp,
  gold: ['clay', 'amber', 'yellow'] as Ramp,
  orange: ['rust', 'orange', 'amber'] as Ramp,
  rust: ['crimson', 'rust', 'clay'] as Ramp,
  red: ['crimson', 'red', 'coral'] as Ramp,
  stone: ['slate', 'stone', 'silver'] as Ramp,
  iron: ['night', 'slate', 'stone'] as Ramp,
  dark: ['ink', 'night', 'dusk'] as Ramp,
  steel: ['dusk', 'stone', 'silver'] as Ramp,
  ice: ['navy', 'sky', 'ice'] as Ramp,
  frost: ['sky', 'ice', 'white'] as Ramp,
  snow: ['stone', 'silver', 'white'] as Ramp,
  navy: ['night', 'navy', 'sky'] as Ramp,
  cloth: ['dusk', 'slate', 'stone'] as Ramp,
  plum: ['night', 'violet', 'orchid'] as Ramp,
  crimson: ['plum', 'crimson', 'red'] as Ramp,
  sand: ['tan', 'sand', 'white'] as Ramp,
  yellow: ['amber', 'yellow', 'white'] as Ramp,
};

export function irnd(seed: number): () => number {
  let s = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Pix = PalName | null;

export class Surface {
  readonly g: Pix[];
  constructor(readonly w: number, readonly h: number) {
    this.g = new Array<Pix>(w * h).fill(null);
  }
  inb(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  px(x: number, y: number, c: Pix): this {
    x = Math.round(x);
    y = Math.round(y);
    if (this.inb(x, y)) this.g[y * this.w + x] = c;
    return this;
  }
  /** Nur auf leere Pixel (Hintergrund-Details). */
  pxUnder(x: number, y: number, c: Pix): this {
    x = Math.round(x);
    y = Math.round(y);
    if (this.inb(x, y) && this.g[y * this.w + x] === null) this.g[y * this.w + x] = c;
    return this;
  }
  get(x: number, y: number): Pix {
    x = Math.round(x);
    y = Math.round(y);
    return this.inb(x, y) ? this.g[y * this.w + x] : null;
  }
  rect(x: number, y: number, w: number, h: number, c: Pix): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
    return this;
  }
  /** Bresenham, optional dicker (Quadrat der Kantenlaenge `th`). */
  line(x0: number, y0: number, x1: number, y1: number, c: Pix, th = 1): this {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const o = Math.floor((th - 1) / 2);
    for (;;) {
      if (th === 1) this.px(x0, y0, c);
      else this.rect(x0 - o, y0 - o, th, th, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }
  /** Gefuellte Ellipse; (cx, cy) darf halbzahlig sein. `fn` bekommt (x, y, nx, ny) und liefert die Farbe. */
  ellipseFn(cx: number, cy: number, rx: number, ry: number, fn: (x: number, y: number, nx: number, ny: number) => Pix): this {
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1), y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) {
          const c = fn(x, y, nx, ny);
          if (c) this.px(x, y, c);
        }
      }
    return this;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: Pix): this {
    return this.ellipseFn(cx, cy, rx, ry, () => c);
  }
  /** Loescht eine gefuellte Ellipse (macht Ringe, Aushoehlungen). */
  erase(cx: number, cy: number, rx: number, ry: number): this {
    const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1), y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1 && this.inb(x, y)) this.g[y * this.w + x] = null;
      }
    return this;
  }
  /** Ellipse mit Licht von oben links (3 Toene). `hi` setzt einen weissen Glanzpunkt. */
  ball(cx: number, cy: number, rx: number, ry: number, ramp: Ramp, hi = false): this {
    this.ellipseFn(cx, cy, rx, ry, (_x, _y, nx, ny) => {
      const l = -nx * 0.55 - ny * 0.75;
      return l > 0.5 ? ramp[2] : l > -0.25 ? ramp[1] : ramp[0];
    });
    if (hi) this.px(cx - rx * 0.45 - 0.5, cy - ry * 0.5 - 0.5, 'white');
    return this;
  }
  /** Kasten mit Licht oben/links, Schatten unten/rechts. */
  box(x: number, y: number, w: number, h: number, ramp: Ramp): this {
    this.rect(x, y, w, h, ramp[1]);
    if (w > 2 && h > 2) {
      this.rect(x, y, w, 1, ramp[2]);
      this.rect(x, y, 1, h, ramp[2]);
      this.rect(x, y + h - 1, w, 1, ramp[0]);
      this.rect(x + w - 1, y + 1, 1, h - 1, ramp[0]);
    } else if (h > 1) this.rect(x, y + h - 1, w, 1, ramp[0]);
    return this;
  }
  /** Gefuelltes Polygon (Scanline, gerade Kanten), Farbe je Pixel optional. */
  poly(pts: [number, number][], c: Pix | ((x: number, y: number) => Pix)): this {
    let ymin = Infinity, ymax = -Infinity;
    for (const p of pts) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
    for (let y = Math.floor(ymin); y <= Math.ceil(ymax); y++) {
      const yy = y + 0.5, xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + ((yy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) {
          const col = typeof c === 'function' ? c(x, y) : c;
          if (col) this.px(x, y, col);
        }
    }
    return this;
  }
  /** Quadratische Kurve als Pixel-Linie. */
  curve(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, c: Pix, th = 1): this {
    const n = Math.max(6, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      this.line(px, py, x, y, c, th);
      px = x; py = y;
    }
    return this;
  }
  /** Ring (Umfang einer Ellipse, 1 px). */
  ring(cx: number, cy: number, rx: number, ry: number, c: Pix): this {
    const n = Math.max(16, Math.ceil((rx + ry) * 5));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.px(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, c);
    }
    return this;
  }
  /** Legt `o` bei (dx, dy) darueber (Pixel mit `null` lassen durch). */
  blit(o: Surface, dx = 0, dy = 0): this {
    for (let y = 0; y < o.h; y++)
      for (let x = 0; x < o.w; x++) {
        const c = o.g[y * o.w + x];
        if (c) this.px(x + dx, y + dy, c);
      }
    return this;
  }
  /** Spiegelt waagerecht (um die Mitte der Flaeche). */
  flipX(): Surface {
    const o = new Surface(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.g[y * this.w + (this.w - 1 - x)] = this.g[y * this.w + x];
    return o;
  }
  /** Ersetzt alle Pixel in einer Farbe. */
  swap(from: PalName, to: Pix): this {
    for (let i = 0; i < this.g.length; i++) if (this.g[i] === from) this.g[i] = to;
    return this;
  }
  /** Loescht alle Pixel, die `keep` nicht erfuellt. */
  mask(keep: (x: number, y: number) => boolean): this {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!keep(x, y)) this.g[y * this.w + x] = null;
    return this;
  }
  count(): number {
    return this.g.reduce((n, c) => n + (c ? 1 : 0), 0);
  }
  toRows(): Rows {
    const rows: string[] = [];
    for (let y = 0; y < this.h; y++) {
      let r = '';
      for (let x = 0; x < this.w; x++) {
        const c = this.g[y * this.w + x];
        r += c ? PCH[c] : '.';
      }
      rows.push(r);
    }
    return rows;
  }
  static fromRows(rows: Rows): Surface {
    const h = rows.length, w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const s = new Surface(w, h);
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) {
        const c = r[x];
        if (c === '.') continue;
        if (c === OUTLINE_CHAR) s.g[y * w + x] = 'ink';
        else s.g[y * w + x] = UNPCH[c] ?? null;
      }
    });
    return s;
  }
}

/** Umriss (ink) um alle Pixel von `s` (4er-Nachbarschaft) direkt in die Flaeche gezeichnet, nur auf leere Pixel. */
export function outlineSurface(s: Surface, col: PalName = 'ink', diag = false): Surface {
  const o = new Surface(s.w, s.h);
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) {
      if (s.g[y * s.w + x]) { o.g[y * s.w + x] = s.g[y * s.w + x]; continue; }
      const n = (a: number, b: number) => (s.inb(a, b) && s.g[b * s.w + a] ? 1 : 0);
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1) || (diag && (n(x - 1, y - 1) || n(x + 1, y - 1) || n(x - 1, y + 1) || n(x + 1, y + 1)))) o.g[y * s.w + x] = col;
    }
  return o;
}

/** Schwaerzt/weisst: alle sichtbaren Pixel (ausser Umriss) in einer Farbe (Treffer-Blitz). */
export function silhouette(s: Surface, col: PalName, keep: PalName = 'ink'): Surface {
  const o = new Surface(s.w, s.h);
  for (let i = 0; i < s.g.length; i++) o.g[i] = s.g[i] ? (s.g[i] === keep ? keep : col) : null;
  return o;
}

/** Bounding-Box der sichtbaren Pixel. */
export function bbox(s: Surface): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++)
      if (s.g[y * s.w + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}
