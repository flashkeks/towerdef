import { Texture } from 'pixi.js';

const texCache = new WeakMap<HTMLCanvasElement, Texture>();
/** Pixi-Textur aus einer Leinwand, immer nearest (scharfe Pixel). */
export function tex(cv: HTMLCanvasElement): Texture {
  let t = texCache.get(cv);
  if (!t) {
    t = Texture.from(cv);
    t.source.scaleMode = 'nearest';
    texCache.set(cv, t);
  }
  return t;
}
