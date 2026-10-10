import { describe, expect, it } from 'vitest';
import { popRaster, statusRaster } from '../src/pixel/fx/effects';
import { DUSK_TRAIL_FRAMES, duskTrailRaster, SHIP_CRASH_FRAMES, shipCrashRaster, shipShadowRaster } from '../src/pixel/fx/r15';
import { rowsToRGBA } from '../src/pixel/sprites/canvas';
import { enemyRaster, ENEMY_SIZE } from '../src/pixel/sprites/enemies';
import { ENEMY_TYPES, type EnemyType } from '../src/pixel/sprites/types';

const sig = (rows: string[]): string => rows.join('/');
const count = (rows: string[]): number => rows.join('').replace(/\./g, '').length;
const valid = (rows: string[]): void => { expect(() => rowsToRGBA(rows)).not.toThrow(); };
const SHIPS: [EnemyType, number][] = [['cruiser', 2], ['duskrunner', 2], ['dreadnought', 3]];

describe('Runde 15e: Cruiser, Duskrunner, Dreadnought', () => {
  it('Typen sind registriert, Rahmen im Limit, Anker im Bild', () => {
    for (const [t] of SHIPS) {
      expect(ENEMY_TYPES).toContain(t);
      const z = ENEMY_SIZE[t];
      expect(z.w).toBeLessThanOrEqual(112);
      expect(z.h).toBeLessThanOrEqual(76);
      expect(z.ax).toBeLessThan(z.w); expect(z.ay).toBeLessThan(z.h);
    }
    expect(ENEMY_SIZE.dreadnought.w).toBeGreaterThan(ENEMY_SIZE.colossus.w);
    expect(ENEMY_SIZE.cruiser.w).toBeGreaterThan(ENEMY_SIZE.gloomship.w * 1.35);
  });
  it('4 Lauf-Frames, Schadensstufen, flip, Blitz, Merkmale: gueltig und verschieden', () => {
    for (const [t, max] of SHIPS) {
      const fr = [0, 1, 2, 3].map((f) => enemyRaster(t, f));
      fr.forEach((r) => { valid(r.rows); expect(count(r.rows)).toBeGreaterThan(300); });
      expect(new Set(fr.map((r) => sig(r.rows))).size, t).toBe(4);
      const st = Array.from({ length: max + 1 }, (_, k) => sig(enemyRaster(t, 0, { damageStage: k }).rows));
      expect(new Set(st).size, `${t} Stufen`).toBe(max + 1);
      expect(sig(enemyRaster(t, 0, { damageStage: 99 }).rows)).toBe(st[max]);
      const w = enemyRaster(t, 1, { hitFlash: true });
      expect(new Set(w.rows.join('').replace(/\./g, ''))).toEqual(new Set(['W', 'X']));
      const a = enemyRaster(t, 0), b = enemyRaster(t, 0, { flip: true });
      expect(b.ax).toBe(a.rows[0].length - 1 - a.ax);
      expect(sig(enemyRaster(t, 1, { fortified: true }).rows)).not.toBe(sig(enemyRaster(t, 1).rows));
      expect(sig(enemyRaster(t, 1, { regrow: true }).rows)).not.toBe(sig(enemyRaster(t, 1).rows));
    }
  });
  it('Platzen und Eisblock kennen die Groessen', () => {
    for (const [t] of SHIPS) {
      const fs = Array.from({ length: 6 }, (_, f) => popRaster(t, f));
      fs.forEach((f) => valid(f.rows));
      expect(new Set(fs.map((f) => sig(f.rows))).size).toBeGreaterThanOrEqual(5);
    }
    const w = (t: EnemyType): number => statusRaster('freeze', 0, t).rows[0].length;
    expect(w('dreadnought')).toBeGreaterThan(w('cruiser'));
    expect(w('cruiser')).toBeGreaterThan(w('gloomship'));
    expect(w('duskrunner')).toBeGreaterThan(w('red'));
  });
  it('Schatten: je Typ eigene Groesse; Absturz 10 Frames; Nachzieher 4 Frames + flip', () => {
    const sw = (k: 'gloomship' | 'cruiser' | 'duskrunner' | 'dreadnought'): number => shipShadowRaster(k, 0).rows[0].length;
    expect(sw('cruiser')).toBeGreaterThan(sw('gloomship'));
    expect(sw('dreadnought')).toBeGreaterThan(sw('cruiser'));
    expect(sw('duskrunner')).toBeLessThan(sw('gloomship'));
    for (const k of ['cruiser', 'dreadnought'] as const) {
      const fs = Array.from({ length: SHIP_CRASH_FRAMES }, (_, f) => shipCrashRaster(k, f));
      fs.forEach((f) => { valid(f.rows); expect(count(f.rows)).toBeGreaterThan(30); });
      expect(new Set(fs.map((f) => sig(f.rows))).size).toBe(SHIP_CRASH_FRAMES);
    }
    expect(shipCrashRaster('dreadnought', 5).rows.length).toBeGreaterThan(shipCrashRaster('cruiser', 5).rows.length);
    const tr = Array.from({ length: DUSK_TRAIL_FRAMES }, (_, f) => duskTrailRaster(f));
    expect(new Set(tr.map((r) => sig(r.rows))).size).toBe(DUSK_TRAIL_FRAMES);
    const a = duskTrailRaster(1), b = duskTrailRaster(1, true);
    expect(b.ax).toBe(a.rows[0].length - 1 - a.ax);
  });
});
