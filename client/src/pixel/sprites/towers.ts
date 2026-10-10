/** Turm-Sprites: setzt Sockel + Figur + Aura zusammen, spiegelt, umrandet. Reine Raster (kein DOM). */
import type { Rows } from '../raster';
import { dirOf, poseOf, type TowerFrame } from './pose';
import { drawBombardier } from './bombardier';
import { drawFrost } from './frostcaller';
import { drawMarket } from './market';
import { drawLongshot } from './longshot';
import { drawThornweaver } from './thornweaver';
import { drawAlchemist, drawMonster, MONSTER_AX, MONSTER_AY, MONSTER_H, MONSTER_W } from './alchemist';
import { drawRanger, OX, OY, TH, TW } from './ranger';
import { outlineSurface, Surface } from './surface';
import { baseLook, type Tiers, type TowerType } from './types';

export interface RasterSprite { rows: Rows; ax: number; ay: number; mx?: number; my?: number }

export const TOWER_W = TW;
export const TOWER_H = TH;

export function towerRaster(typeIn: TowerType, tiers: Tiers, facing: number, frame: TowerFrame): RasterSprite {
  const type = baseLook(typeIn); // Runde 16: Platzhalter fuer Riverkeeper/Bellringer/Tinker
  const d = dirOf(facing);
  const p = poseOf(frame);
  const L = type === 'ranger' ? drawRanger(tiers, d, p) : type === 'bombardier' ? drawBombardier(tiers, d, p) : type === 'frostcaller' ? drawFrost(tiers, d, p)
    : type === 'longshot' ? drawLongshot(tiers, d, p) : type === 'thornweaver' ? drawThornweaver(tiers, d, p) : type === 'alchemist' ? drawAlchemist(tiers, d, p) : drawMarket(tiers, p);
  if (type === 'market') d.flip = false; // Schilder und Gebaeude werden nie gespiegelt, Market dreht sich nicht
  const out = new Surface(TOWER_W, TOWER_H);
  out.blit(L.back);
  out.blit(outlineSurface(L.fig));
  out.blit(L.front);
  const fin = d.flip ? out.flipX() : out;
  const mx = (d.flip ? 2 * OX - L.muzzle[0] : L.muzzle[0]) - OX;
  const my = L.muzzle[1] - OY;
  void type;
  return { rows: fin.toRows(), ax: OX, ay: OY, mx, my };
}

/** Monster-Form des Alchemisten (Transforming Tonic): 84 x 76, Anker = Fuss. `scale` < 1 = kleine Fassung fuer verwandelte Tuerme (Total Transformation). */
export function monsterRaster(facing: number, frame: TowerFrame, scale = 1): RasterSprite {
  const d = dirOf(facing);
  const L = drawMonster(d, poseOf(frame));
  const out = new Surface(MONSTER_W, MONSTER_H);
  out.blit(L.back);
  out.blit(outlineSurface(L.fig));
  out.blit(L.front);
  let fin = d.flip ? out.flipX() : out;
  let ax = d.flip ? MONSTER_W - 1 - MONSTER_AX : MONSTER_AX, ay = MONSTER_AY;
  if (scale < 1) {
    const w = Math.round(MONSTER_W * scale), h = Math.round(MONSTER_H * scale), o2 = new Surface(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o2.g[y * w + x] = fin.get(Math.floor((x + 0.5) / scale), Math.floor((y + 0.5) / scale));
    fin = o2; ax = Math.round(ax * scale); ay = Math.round(ay * scale);
  }
  return { rows: fin.toRows(), ax, ay };
}
