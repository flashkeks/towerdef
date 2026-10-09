/** Ringe und Scheiben fuer Reichweite, Auswahl und Effekte: Pixel-Kreise (Bresenham-artig) aus Palettenindizes. */
import { Buf } from '../pixel/map/buf';

export interface Ring { canvas: HTMLCanvasElement; ax: number; ay: number }
const cache = new Map<string, Ring>();

export function ringSprite(radiusPx: number, col: number, dashed = false): Ring {
  const r = Math.max(2, Math.round(radiusPx));
  const key = `r:${r}:${col}:${dashed ? 1 : 0}`;
  let s = cache.get(key);
  if (!s) {
    const S = r * 2 + 4;
    const b = new Buf(S, S);
    const n = Math.max(24, Math.round(r * 7));
    for (let i = 0; i < n; i++) {
      if (dashed && i % 2) continue;
      const a = (i / n) * Math.PI * 2;
      b.set(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, col);
    }
    s = { canvas: b.toCanvas(), ax: S >> 1, ay: S >> 1 };
    cache.set(key, s);
  }
  return s;
}

export function discSprite(r: number, col: number): Ring {
  const key = `d:${r}:${col}`;
  let s = cache.get(key);
  if (!s) {
    const S = r * 2 + 3;
    const b = new Buf(S, S);
    b.disc(S >> 1, S >> 1, r, col);
    s = { canvas: b.toCanvas(), ax: S >> 1, ay: S >> 1 };
    cache.set(key, s);
  }
  return s;
}
