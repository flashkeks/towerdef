/**
 * Kleine Bausteine fuer die Dinge der Runde-16-Karten (Dunes, Harbor, Spire): schattierte Rechtecke, Ziegel, Flammen, Daecher.
 * Gleiche Regeln wie `props.ts`: Licht oben links, drei Toene je Flaeche, Umriss in der dunkelsten Flaechenfarbe, nur Palettenindizes.
 */
import { bayer, Buf, C, hash2 } from './buf';
import { mk, type PropArt, type Tones } from './props';

export { mk };
export type { PropArt, Tones };

/** Rechteck mit Licht oben links: oben/links hell, unten/rechts dunkel, dazwischen Rauschen. */
export function shadedRect(b: Buf, x: number, y: number, w: number, h: number, t: Tones, seed = 1): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let c = hash2(x + i, y + j, seed) > 0.78 ? t.light : t.mid;
    if (i === 0 || j === 0) c = t.light;
    if (i >= w - 1 || j >= h - 1) c = t.dark;
    else if (i >= w - 2 && j > 1) c = bayer(x + i, y + j) < 0.5 ? t.dark : t.mid;
    b.set(x + i, y + j, c);
  }
}

/** Ziegel/Quader: versetzte Reihen (bw x bh), Fuge `mortar`, jeder Stein mit eigener Toenung, Licht oben links. */
export function bricks(b: Buf, x: number, y: number, w: number, h: number, t: Tones, mortar: number, seed = 1, bw = 6, bh = 3): void {
  for (let j = 0; j < h; j++) {
    const row = Math.floor(j / bh), off = row % 2 ? Math.floor(bw / 2) : 0;
    for (let i = 0; i < w; i++) {
      const col = Math.floor((i + off) / bw), ix = (i + off) % bw, iy = j % bh;
      let c: number;
      if (iy === bh - 1 || ix === bw - 1) c = mortar;
      else {
        const k = hash2(col, row, seed);
        c = k > 0.8 ? t.light : k < 0.22 ? t.dark : t.mid;
        if (iy === 0 && ix < bw - 1) c = t.light;
        if (hash2(x + i, y + j, seed + 3) > 0.94) c = t.dark;
      }
      b.set(x + i, y + j, c);
    }
  }
  // rechter Rand im Schatten
  for (let j = 0; j < h; j++) b.set(x + w - 1, y + j, t.dark);
}

/** Flamme (ein Bild): Tropfenform orange -> amber -> gelb, Spitze leicht versetzt. */
export function flame(b: Buf, cx: number, baseY: number, h: number, lean = 0): void {
  for (let k = 0; k < h; k++) {
    const f = k / h, y = baseY - k;
    const half = Math.max(0, Math.round((1 - f) * (h * 0.3 + 0.8) * (f < 0.15 ? 0.7 : 1)));
    const off = Math.round(lean * f * f * 2);
    for (let x = -half; x <= half; x++) b.set(cx + x + off, y, f < 0.5 && Math.abs(x) <= half - 1 ? (f < 0.22 && Math.abs(x) <= Math.max(0, half - 2) ? C.yellow : C.amber) : C.orange);
  }
  b.set(cx, baseY, C.yellow);
}

/** Pfosten (senkrecht, 3 Toene). */
export function pole(b: Buf, x: number, y0: number, y1: number, t: Tones, w = 2): void {
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) b.set(x + i, y, i === 0 ? t.light : i === w - 1 ? t.dark : t.mid);
}

/** Gefuellte Ellipse mit Licht oben links (zwei Toene + Rand) - fuer Fass, Kuppel, Stein. */
export function dome(b: Buf, cx: number, cy: number, rx: number, ry: number, t: Tones, seed = 1): void {
  b.each(cx, cy, rx, ry, (x, y) => {
    const nx = (x - cx) / rx, ny = (y - cy) / ry;
    const lit = -(nx * 0.6 + ny * 0.8) + (bayer(x, y) - 0.5) * 0.25 + (hash2(x, y, seed) - 0.5) * 0.15;
    b.set(x, y, lit > 0.45 ? t.light : lit > -0.25 ? t.mid : t.dark);
  });
}

/** Zinnen: Reihe Zahn/Luecke entlang x (oben auf Mauer `topY`), Zahn `tw` breit, Luecke `gw` breit, Hoehe `th`. */
export function crenel(b: Buf, x: number, w: number, topY: number, t: Tones, tw = 4, gw = 3, th = 3): void {
  for (let i = 0; i < w; i += tw + gw) for (let k = 0; k < tw && i + k < w; k++) for (let j = 0; j < th; j++) {
    b.set(x + i + k, topY + j, j === 0 || k === 0 ? t.light : k === tw - 1 || j === th - 1 ? t.dark : t.mid);
  }
}

/** Ziegeldach als Trapez (Ansicht von vorn): Reihen von Ziegeln, oben hell, Traufe dunkel. */
export function tileRoof(b: Buf, cx: number, topY: number, botY: number, halfTop: number, halfBot: number, t: Tones, seed = 1): void {
  for (let y = topY; y <= botY; y++) {
    const f = (y - topY) / Math.max(1, botY - topY);
    const half = Math.round(halfTop + (halfBot - halfTop) * f);
    for (let x = -half; x <= half; x++) {
      const nx = x / (half + 0.5);
      const row = (y - topY) % 3;
      let c = nx < -0.25 ? t.light : nx < 0.45 ? t.mid : t.dark;
      if (row === 2) c = nx < -0.25 ? t.mid : t.dark;
      if (((x + (Math.floor((y - topY) / 3) % 2) * 2) & 3) === 3) c = t.dark;
      if (hash2(x, y, seed) > 0.95) c = t.light;
      b.set(cx + x, y, c);
    }
  }
}

/** Fenster: Rahmen dunkel, Glas warm (Licht an) oder dunkel. */
export function windowLit(b: Buf, x: number, y: number, w: number, h: number, lit: boolean, frame: number): void {
  b.rect(x - 1, y - 1, w + 2, h + 2, frame);
  b.rect(x, y, w, h, lit ? C.amber : C.night);
  if (lit) { b.rect(x, y, Math.max(1, w >> 1), Math.max(1, h >> 1), C.yellow); b.set(x, y, C.white); }
  else b.set(x, y, C.dusk);
  if (w >= 5) b.rect(x + (w >> 1), y, 1, h, frame);
  if (h >= 6) b.rect(x, y + (h >> 1), w, 1, frame);
}

export const art = (buf: Buf, ax: number, ay: number, shadow: PropArt['shadow'], hook?: PropArt['hook']): PropArt => ({ buf, ax, ay, shadow, hook });
