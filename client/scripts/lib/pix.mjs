// Kleine Pixel-Zeichenflaeche fuer die code-generierten Sprites (eigene Werke). Reine Ganzzahl-Operationen, kein Zufall ohne Seed.
import { encodePng } from './png.mjs';

/** Master-Palette nach docs/design/art-styleguide.md §4 (Kurznamen). */
export const P = {
  ink: '#2a1e3a', inkW: '#3b2418', night: '#1b2036', slate: '#3a3f5c',
  st1: '#59607a', st2: '#8a90a6', st3: '#c3c7d6', fog: '#f1f2f7',
  er1: '#5a3a2a', er2: '#8a5a3a', sand: '#d0a574',
  g1: '#2f5a3a', g2: '#4e8a45', g3: '#8ab85a',
  sk1: '#a86a4a', sk2: '#d99a72', sk3: '#f2c8a2',
  or1: '#b8481f', or2: '#f07a2a', gold: '#f5c542', red: '#d8344a', pink: '#f08aa0',
  bl1: '#2c4a8a', bl2: '#4a86d8', ice: '#9ad8f0', teal: '#3fd8c0',
  sh1: '#3a2260', sh2: '#6a3fa0', sh3: '#a67ae0', ember: '#ff9a3c', lime: '#8ae04a', parch: '#f3e3c0',
};

const rgb = (c) => {
  if (c === null || c === undefined) return null;
  const h = (P[c] ?? c).replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
};

/** Seedbarer Zufall (mulberry32): gleiche Eingabe, gleiche Bilder. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Img {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h * 4);
  }
  inb(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  px(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inb(x, y)) return this;
    const v = rgb(c);
    const i = (y * this.w + x) * 4;
    if (v) this.d.set(v, i);
    else this.d.fill(0, i, i + 4);
    return this;
  }
  get(x, y) {
    if (!this.inb(x, y)) return null;
    const i = (y * this.w + x) * 4;
    return this.d[i + 3] ? [this.d[i], this.d[i + 1], this.d[i + 2]] : null;
  }
  solid(x, y) {
    return this.inb(x, y) && this.d[(y * this.w + x) * 4 + 3] > 0;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
    return this;
  }
  /** Gefuellte Ellipse (Mittelpunkt cx, cy, Halbachsen rx, ry; Pixelmitten). */
  oval(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / (rx + 0.01);
        const dy = (y + 0.5 - cy) / (ry + 0.01);
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
    return this;
  }
  line(x0, y0, x1, y1, c) {
    let dx = Math.abs(x1 - x0);
    let dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
    return this;
  }
  /** Pixel-Matrix: `rows` = Zeilen aus Zeichen, `legend` ordnet Zeichen Farben zu ('.' = leer). */
  mat(x, y, rows, legend) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && ch !== ' ') this.px(x + i, y + j, legend[ch]); }));
    return this;
  }
  /** Fremdes Bild an (x, y) legen; nur deckende Pixel. */
  blit(src, x, y) {
    for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) {
      const k = (j * src.w + i) * 4;
      if (src.d[k + 3] && this.inb(x + i, y + j)) this.d.set(src.d.subarray(k, k + 4), ((y + j) * this.w + x + i) * 4);
    }
    return this;
  }
  /** 1-px-Aussenlinie in Farbe c (4er-Nachbarschaft), nur auf leeren Pixeln im Bild. */
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
      if (!this.solid(x, y) && (this.solid(x - 1, y) || this.solid(x + 1, y) || this.solid(x, y - 1) || this.solid(x, y + 1))) add.push([x, y]);
    for (const [x, y] of add) this.px(x, y, c);
    return this;
  }
  flipH() {
    const o = new Img(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.d.set(this.d.subarray((y * this.w + x) * 4, (y * this.w + x) * 4 + 4), (y * this.w + (this.w - 1 - x)) * 4);
    return o;
  }
  /** Palette-Swap: map = { '#vonhex' | name: '#nachhex' | name }. */
  swap(map) {
    const o = this.clone();
    const pairs = Object.entries(map).map(([a, b]) => [rgb(a), rgb(b)]);
    for (let i = 0; i < o.d.length; i += 4) {
      if (!o.d[i + 3]) continue;
      for (const [a, b] of pairs) if (o.d[i] === a[0] && o.d[i + 1] === a[1] && o.d[i + 2] === a[2]) { o.d.set(b, i); break; }
    }
    return o;
  }
  clone() {
    const o = new Img(this.w, this.h);
    o.d.set(this.d);
    return o;
  }
  /** Zeilen ab `fromY` um dy nach unten/oben schieben (Wippen); der Rest bleibt. */
  shiftRows(fromY, toY, dy) {
    const o = this.clone();
    for (let y = fromY; y < toY; y++) for (let x = 0; x < this.w; x++) {
      o.px(x, y, null);
    }
    for (let y = fromY; y < toY; y++) for (let x = 0; x < this.w; x++) {
      if (this.solid(x, y) && o.inb(x, y + dy)) o.d.set(this.d.subarray((y * this.w + x) * 4, (y * this.w + x) * 4 + 4), ((y + dy) * this.w + x) * 4);
    }
    return o;
  }
  /** Zahl verschiedener Farben (Palettenbudget pruefen). */
  colors() {
    const s = new Set();
    for (let i = 0; i < this.d.length; i += 4) if (this.d[i + 3]) s.add(`${this.d[i]},${this.d[i + 1]},${this.d[i + 2]}`);
    return s.size;
  }
  png() {
    return encodePng(this.w, this.h, this.d);
  }
}
