/** Oeffentliche API der Pixel-Sprites (Vertrag: docs/design/schnittstelle.md, Abschnitt Client-Aufbau). */
import { rowsToCanvas, type Sprite, type AlphaFn } from './canvas';
import { towerRaster } from './towers';
import type { TowerFrame } from './pose';
import type { Tiers, TowerType } from './types';

export type { Sprite } from './canvas';
export * from './types';
export type { TowerFrame } from './pose';

const cache = new Map<string, Sprite>();
export function cached(key: string, make: () => Sprite): Sprite {
  let s = cache.get(key);
  if (!s) { s = make(); cache.set(key, s); }
  return s;
}
export function clearSpriteCache(): void { cache.clear(); }
export type { AlphaFn };

export function towerSprite(type: TowerType, tiers: Tiers, facing: number, frame: TowerFrame): Sprite {
  return cached(`t|${type}|${tiers.join('')}|${facing}|${frame}`, () => {
    const r = towerRaster(type, tiers, facing, frame);
    return rowsToCanvas(r.rows, r.ax, r.ay);
  });
}

import { heroRaster, type HeroFrame } from './hero';
export type { HeroFrame } from './hero';
export function heroSprite(level: number, facing: number, frame: HeroFrame): Sprite {
  const st = level >= 20 ? 4 : level >= 15 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0;
  return cached(`h|${st}|${facing}|${frame}`, () => {
    const r = heroRaster(level, facing, frame);
    return rowsToCanvas(r.rows, r.ax, r.ay);
  });
}
