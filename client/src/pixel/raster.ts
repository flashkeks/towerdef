/**
 * Pixel-Raster als Text (wie im Kek-Game, flashkeks/snake public/pfx.js): jede Zeile ein String, jedes Zeichen ein Pixel,
 * '.' = durchsichtig, andere Zeichen ueber eine Zuordnung Zeichen -> Palettenname. Alles reine Funktionen auf Zeichenrastern
 * (in Node testbar); erst `paint` braucht eine Leinwand. Stil-Regeln: docs/design/pixel-stil.md.
 */
import { OUTLINE, PAL, type PalName } from './palette';

export type Rows = string[];
/** Zeichen -> Palettenname. '.' ist immer durchsichtig. */
export type CharMap = Record<string, PalName>;

export const EMPTY = '.';
/** Reserviertes Zeichen fuer den automatischen Umriss. */
export const OUTLINE_CHAR = '#';

export function blank(w: number, h: number): Rows {
  return Array.from({ length: h }, () => EMPTY.repeat(w));
}

export function size(rows: Rows): { w: number; h: number } {
  return { w: rows.reduce((m, r) => Math.max(m, r.length), 0), h: rows.length };
}

/** Raster auf feste Breite bringen (rechts mit '.' auffuellen bzw. abschneiden). */
export function pad(rows: Rows, w: number): Rows {
  return rows.map((r) => (r + EMPTY.repeat(w)).slice(0, w));
}

/** Legt `top` bei (dx, dy) ueber `base`; '.' in `top` laesst `base` durchscheinen. Ausserhalb wird abgeschnitten. */
export function overlay(base: Rows, top: Rows, dx = 0, dy = 0): Rows {
  const out = base.map((r) => r.split(''));
  top.forEach((row, y) => {
    const ty = y + dy;
    if (ty < 0 || ty >= out.length) return;
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      const tx = x + dx;
      if (c === EMPTY || tx < 0 || tx >= out[ty].length) continue;
      out[ty][tx] = c;
    }
  });
  return out.map((r) => r.join(''));
}

/** Setzt mehrere Teile in Reihenfolge (hinten zuerst) auf eine leere Flaeche w x h. */
export function compose(w: number, h: number, parts: { rows: Rows; dx?: number; dy?: number }[]): Rows {
  return parts.reduce((acc, p) => overlay(acc, p.rows, p.dx ?? 0, p.dy ?? 0), blank(w, h));
}

export function flipX(rows: Rows): Rows {
  const { w } = size(rows);
  return pad(rows, w).map((r) => r.split('').reverse().join(''));
}

/** 1-px-Umriss um alle sichtbaren Pixel (4er-Nachbarschaft), als OUTLINE_CHAR. Das Raster sollte 1 px Rand frei haben. */
export function outline(rows: Rows): Rows {
  const { w, h } = size(rows);
  const src = pad(rows, w);
  const solid = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && src[y][x] !== EMPTY;
  return src.map((r, y) =>
    r
      .split('')
      .map((c, x) => (c !== EMPTY ? c : solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1) ? OUTLINE_CHAR : EMPTY))
      .join(''),
  );
}

/** Ersetzt Zeichen (z. B. Farbtausch fuer Varianten): { a: 'b' } macht aus jedem 'a' ein 'b'. */
export function recolor(rows: Rows, swap: Record<string, string>): Rows {
  return rows.map((r) => r.replace(/./g, (c) => swap[c] ?? c));
}

/** RGBA-Bytes (w*h*4) aus Raster + Zeichenzuordnung; unbekannte Zeichen werfen (Tippfehler im Raster sofort sehen). */
export function toRGBA(rows: Rows, map: CharMap): { w: number; h: number; data: Uint8ClampedArray } {
  const { w, h } = size(rows);
  const data = new Uint8ClampedArray(w * h * 4);
  const full: Record<string, string> = { [OUTLINE_CHAR]: PAL[OUTLINE] };
  for (const [ch, name] of Object.entries(map)) full[ch] = PAL[name];
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const c = r[x];
      if (c === EMPTY) continue;
      const hex = full[c];
      if (!hex) throw new Error(`raster: unbekanntes Zeichen '${c}' in Zeile ${y}`);
      const n = parseInt(hex.slice(1), 16);
      const i = (y * w + x) * 4;
      data[i] = (n >> 16) & 255;
      data[i + 1] = (n >> 8) & 255;
      data[i + 2] = n & 255;
      data[i + 3] = 255;
    }
  });
  return { w, h, data };
}

/** Malt ein Raster in eine neue Leinwand in Originalgroesse (1 Zeichen = 1 Pixel). Skaliert wird spaeter scharf (nearest). */
export function paint(rows: Rows, map: CharMap): HTMLCanvasElement {
  const { w, h, data } = toRGBA(rows, map);
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  if (w && h) g.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
  return c;
}
