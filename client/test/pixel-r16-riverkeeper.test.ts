import { describe, expect, it } from 'vitest';
import { rowsToRGBA } from '../src/pixel/sprites/canvas';
import { iconUpgradeRaster } from '../src/pixel/sprites/icons';
import { TOWER_FRAMES } from '../src/pixel/sprites/pose';
import { projectileRaster } from '../src/pixel/sprites/projectiles';
import { leviathanStrikeRaster, LEVIATHAN_FRAMES } from '../src/pixel/sprites/riverkeeper';
import { towerRaster, TOWER_H, TOWER_W } from '../src/pixel/sprites/towers';
import type { Tiers } from '../src/pixel/sprites/types';
import { projectileLook } from '../src/match/r13';

const sig = (rows: string[]): string => rows.join('/');
const count = (rows: string[]): number => rows.join('').replace(/\./g, '').length;
const tiersOf = (p: number, t: number): Tiers => { const r: Tiers = [0, 0, 0]; r[p] = t; return r; };

describe('Runde 16 TP: Riverkeeper', () => {
  it('jede Stufe liefert ein gueltiges Raster im Turm-Rahmen, alle 16 Stufen verschieden', () => {
    const seen = new Set<string>();
    for (let p = 0; p < 3; p++) for (let t = 0; t <= 5; t++) {
      const r = towerRaster('riverkeeper', tiersOf(p, t), 0, 'idle1');
      expect(r.rows.length).toBe(TOWER_H);
      expect(r.rows.every((x) => x.length === TOWER_W)).toBe(true);
      expect(count(r.rows)).toBeGreaterThan(300);
      expect(() => rowsToRGBA(r.rows)).not.toThrow();
      seen.add(sig(r.rows));
    }
    expect(seen.size).toBe(16);
  });
  it('Stufe 3 und 5 aendern die Silhouette deutlich (> 60 Pixel gegen die vorige Stufe, Stufe 5 am groessten)', () => {
    for (let p = 0; p < 3; p++) {
      const R = (t: number): string[] => towerRaster('riverkeeper', tiersOf(p, t), 0, 'idle1').rows;
      for (const t of [3, 5]) {
        const a = R(t - 1), b = R(t);
        let diff = 0;
        b.forEach((row, y) => { for (let x = 0; x < row.length; x++) if ((row[x] === '.') !== (a[y][x] === '.')) diff++; });
        expect(diff, `Pfad ${p} Stufe ${t}`).toBeGreaterThan(60);
      }
      expect(count(R(5))).toBeGreaterThan(count(R(3)));
    }
  });
  it('alle Frames und Richtungen gueltig, Muendung liegt im Bild', () => {
    for (const t of [[0, 0, 0], [5, 0, 0], [0, 5, 0], [0, 0, 5]] as Tiers[]) for (let f = 0; f < 8; f++) for (const fr of TOWER_FRAMES) {
      const r = towerRaster('riverkeeper', t, f, fr);
      expect(() => rowsToRGBA(r.rows)).not.toThrow();
      expect(Math.abs(r.mx ?? 0)).toBeLessThan(48);
    }
  });
  it('15 Upgrade-Icons sind gueltig und verschieden', () => {
    const seen = new Set<string>();
    for (let p = 0; p < 3; p++) for (let n = 1; n <= 5; n++) {
      const r = iconUpgradeRaster('riverkeeper', p as 0, n);
      expect(count(r.rows)).toBeGreaterThan(80);
      seen.add(sig(r.rows));
    }
    expect(seen.size).toBe(15);
  });
  it('Harpune und Kanonenkugel sind echte Geschosse (keine Platzhalter mehr), Leviathan-Schlag hat 9 verschiedene Bilder', () => {
    expect(projectileLook('harpoon', undefined)).toBe('harpoon');
    expect(projectileLook('cannonball', undefined)).toBe('cannonball');
    for (const k of ['harpoon', 'cannonball'] as const) expect(new Set(Array.from({ length: 16 }, (_, d) => sig(projectileRaster(k, d).rows))).size).toBeGreaterThan(3);
    expect(new Set(Array.from({ length: LEVIATHAN_FRAMES }, (_, f) => sig(leviathanStrikeRaster(f).rows))).size).toBe(LEVIATHAN_FRAMES);
  });
});
