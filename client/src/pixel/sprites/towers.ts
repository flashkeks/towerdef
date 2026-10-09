/** Turm-Sprites: setzt Sockel + Figur + Aura zusammen, spiegelt, umrandet. Reine Raster (kein DOM). */
import type { Rows } from '../raster';
import { dirOf, poseOf, type TowerFrame } from './pose';
import { drawBombardier } from './bombardier';
import { drawFrost } from './frostcaller';
import { drawRanger, OX, OY } from './ranger';
import { outlineSurface, Surface } from './surface';
import type { Tiers, TowerType } from './types';

export interface RasterSprite { rows: Rows; ax: number; ay: number; mx?: number; my?: number }

export const TOWER_W = 55;
export const TOWER_H = 56;

export function towerRaster(type: TowerType, tiers: Tiers, facing: number, frame: TowerFrame): RasterSprite {
  const d = dirOf(facing);
  const p = poseOf(frame);
  const L = type === 'ranger' ? drawRanger(tiers, d, p) : type === 'bombardier' ? drawBombardier(tiers, d, p) : drawFrost(tiers, d, p);
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
