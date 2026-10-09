/** Raster -> Leinwand (nur im Browser) und die RGBA-Nachbearbeitung (Camo-Flimmern), die in Node testbar bleibt. */
import { toRGBA, type Rows } from '../raster';
import { FULL_MAP } from './surface';

export interface Sprite { canvas: HTMLCanvasElement; ax: number; ay: number }

export type AlphaFn = (x: number, y: number) => number;

/** Camo-Flimmer: Schachbrett aus durchscheinenden und fast durchsichtigen Pixeln, das mit `frame` wandert. */
export function camoAlpha(frame: number): AlphaFn {
  return (x, y) => ((x + y + frame) & 1 ? 0.28 : 0.72);
}

export function rowsToRGBA(rows: Rows, alpha?: AlphaFn): { w: number; h: number; data: Uint8ClampedArray } {
  const r = toRGBA(rows, FULL_MAP);
  if (alpha) {
    for (let y = 0; y < r.h; y++)
      for (let x = 0; x < r.w; x++) {
        const i = (y * r.w + x) * 4;
        if (r.data[i + 3]) r.data[i + 3] = Math.round(255 * alpha(x, y));
      }
  }
  return r;
}

export function rowsToCanvas(rows: Rows, ax: number, ay: number, alpha?: AlphaFn): Sprite {
  const { w, h, data } = rowsToRGBA(rows, alpha);
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  if (w && h) g.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
  return { canvas: c, ax, ay };
}
