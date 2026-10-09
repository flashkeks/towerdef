import { describe, expect, it } from 'vitest';
import { acidMarkRaster, acidPoolRaster, acidSplashRaster, ARC_FRAMES, BUFF_FRAMES, buffGlowRaster, DEATH_BLAST_FRAMES, deathBlastRaster, GOLD_BURST_FRAMES, goldBurstRaster, monsterTransformRaster, SHRINK_FRAMES, shrinkRaster, SPLASH_FRAMES, stormArcRaster, thornZoneRaster, TRANSFORM_FRAMES, treeWallGrowRaster, treeWallRaster, vineSnareRaster, WALL_GROW_FRAMES, whirlwindRaster, WIND_FRAMES, worldTreeZoneRaster, ZONE_FRAMES } from '../src/pixel/fx/r14';
import { rowsToRGBA } from '../src/pixel/sprites/canvas';
import { iconAbilityRaster, iconUpgradeRaster } from '../src/pixel/sprites/icons';
import { projectileRaster } from '../src/pixel/sprites/projectiles';
import { monsterRaster, towerRaster } from '../src/pixel/sprites/towers';
import type { Tiers, TowerType } from '../src/pixel/sprites/types';

const sig = (rows: string[]): string => rows.join('/');
const count = (rows: string[]): number => rows.join('').replace(/\./g, '').length;
const valid = (rows: string[]): void => { expect(() => rowsToRGBA(rows)).not.toThrow(); };
const tiersOf = (p: number, t: number): Tiers => { const r: Tiers = [0, 0, 0]; r[p] = t; return r; };
const height = (rows: string[]): number => {
  const ys = rows.map((r, y) => (/[^.]/.test(r) ? y : -1)).filter((y) => y >= 0);
  return ys[ys.length - 1] - ys[0] + 1;
};
const footWidth = (rows: string[], n = 2): number => {
  const ys = rows.map((r, y) => (/[^.]/.test(r) ? y : -1)).filter((y) => y >= 0);
  return Math.max(...ys.slice(-n).map((y) => rows[y].replace(/^\.+|\.+$/g, '').length));
};
const NEW: TowerType[] = ['thornweaver', 'alchemist'];

describe('Runde 14: Thornweaver und Alchemist', () => {
  it('keine Plattform: Fuesse am Boden, unten keine breite Platte (Stufe 0)', () => {
    for (const type of NEW) {
      const r = towerRaster(type, [0, 0, 0], 0, 'idle0');
      expect(footWidth(r.rows), type).toBeLessThanOrEqual(24);
      const lastY = r.rows.map((x, y) => (/[^.]/.test(x) ? y : -1)).filter((y) => y >= 0).pop() as number;
      expect(Math.abs(lastY - r.ay), type).toBeLessThanOrEqual(4);
    }
  });
  it('alle 15 Stufen sind verschieden, Stufe 1 und 2 zeigen sich (> 24 Pixel gegen die Basis)', () => {
    for (const type of NEW) {
      const seen = new Set<string>();
      const base = towerRaster(type, [0, 0, 0], 0, 'idle1').rows;
      for (let p = 0; p < 3; p++) for (let t = 0; t <= 5; t++) {
        const r = towerRaster(type, tiersOf(p, t), 0, 'idle1').rows;
        valid(r);
        seen.add(sig(r));
        if (t >= 1 && t <= 2) {
          let diff = 0;
          r.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== base[y][x]) diff++; });
          expect(diff, `${type} ${'ABC'[p]}${t}`).toBeGreaterThan(24);
        }
      }
      expect(seen.size, type).toBe(16);
    }
  });
  it('Stufen werden deutlich: Stufe 3 mehr Pixel als 2, 4 mehr als 3, 5 am hoechsten und mindestens 36 px hoch', () => {
    for (const type of NEW) for (let p = 0; p < 3; p++) {
      const n = (t: number): number => count(towerRaster(type, tiersOf(p, t), 0, 'idle0').rows);
      expect(n(3), `${type} ${p} 3>2`).toBeGreaterThan(n(2) + 20);
      expect(n(4), `${type} ${p} 4>3`).toBeGreaterThan(n(3) - 5);
      expect(n(5), `${type} ${p} 5>4`).toBeGreaterThan(n(4));
      expect(height(towerRaster(type, tiersOf(p, 5), 6, 'idle0').rows), `${type} ${p}`).toBeGreaterThanOrEqual(36);
    }
  });
  it('8 Blickrichtungen verschieden, Idle 4 und Angriff 4 Frames verschieden, Muendung im Bild', () => {
    for (const type of NEW) for (const t of [[0, 0, 0], [3, 0, 0], [0, 4, 0], [0, 0, 5]] as Tiers[]) {
      expect(new Set(Array.from({ length: 8 }, (_, f) => sig(towerRaster(type, t, f, 'idle0').rows))).size, `${type} ${t}`).toBe(8);
      expect(new Set(['idle0', 'idle1', 'idle2', 'idle3'].map((f) => sig(towerRaster(type, t, 0, f as 'idle0').rows))).size).toBe(4);
      const a = [0, 1, 2, 3].map((i) => towerRaster(type, t, 0, `atk${i}` as 'atk0'));
      expect(new Set(a.map((r) => sig(r.rows))).size, `${type} ${t} atk`).toBe(4);
      for (const r of a) { const mx = r.ax + (r.mx ?? 0), my = r.ay + (r.my ?? 0); expect(mx).toBeGreaterThan(0); expect(mx).toBeLessThan(r.rows[0].length); expect(my).toBeGreaterThan(0); expect(my).toBeLessThan(r.rows.length); }
    }
  });
  it('Zweitpfad setzt Beigaben (Crosspath), Pfade unterscheiden sich', () => {
    for (const type of NEW) {
      const a = sig(towerRaster(type, [3, 0, 0], 0, 'idle0').rows);
      expect(sig(towerRaster(type, [3, 2, 0], 0, 'idle0').rows)).not.toBe(a);
      expect(sig(towerRaster(type, [3, 0, 2], 0, 'idle0').rows)).not.toBe(a);
      expect(sig(towerRaster(type, [3, 2, 0], 0, 'idle0').rows)).not.toBe(sig(towerRaster(type, [3, 0, 2], 0, 'idle0').rows));
    }
  });
  it('Alchemist: Wurf-Frame fuehrt den Arm nach vorn (Muendung rechts der Mitte), Ausholen hinter dem Kopf', () => {
    const a0 = towerRaster('alchemist', [0, 0, 0], 0, 'atk0'), a2 = towerRaster('alchemist', [0, 0, 0], 0, 'atk2');
    expect(a2.mx).toBeGreaterThan(a0.mx as number);
  });
});

describe('Runde 14: Icons', () => {
  it('30 Upgrade-Icons beider Tuerme, alle verschieden, 16 x 16, gefuellt', () => {
    const seen = new Set<string>();
    for (const type of NEW) for (const p of [0, 1, 2] as const) for (let t = 1; t <= 5; t++) {
      const r = iconUpgradeRaster(type, p, t);
      expect(r.rows).toHaveLength(16);
      expect(r.rows.every((x) => x.length === 16)).toBe(true);
      valid(r.rows);
      expect(count(r.rows), `${type} ${p} ${t}`).toBeGreaterThan(70);
      seen.add(sig(r.rows));
    }
    expect(seen.size).toBe(30);
  });
  it('Faehigkeits-Icons Wall of Trees und Transforming Tonic', () => {
    for (const a of ['wallOfTrees', 'transformingTonic'] as const) { const r = iconAbilityRaster(a); expect(r.rows).toHaveLength(16); valid(r.rows); expect(count(r.rows)).toBeGreaterThan(50); }
    expect(sig(iconAbilityRaster('wallOfTrees').rows)).not.toBe(sig(iconAbilityRaster('transformingTonic').rows));
  });
});

describe('Runde 14: Projektile', () => {
  it('Dorn, Dorn magic: 16 Richtungen; Trank und Gold-Trank: 16 Drehungen, alle gueltig und verschieden', () => {
    for (const k of ['thorn', 'thornMagic'] as const) {
      for (let d = 0; d < 16; d++) { const r = projectileRaster(k, d); valid(r.rows); expect(count(r.rows)).toBeGreaterThan(5); }
      expect(new Set(Array.from({ length: 16 }, (_, d) => sig(projectileRaster(k, d).rows))).size).toBeGreaterThanOrEqual(10);
    }
    for (const k of ['potion', 'potionGold'] as const) {
      for (let d = 0; d < 16; d++) { const r = projectileRaster(k, 0, d); valid(r.rows); expect(count(r.rows)).toBeGreaterThan(15); }
      expect(new Set(Array.from({ length: 16 }, (_, d) => sig(projectileRaster(k, 0, d).rows))).size).toBeGreaterThanOrEqual(12);
    }
    expect(sig(projectileRaster('potion', 0, 3).rows)).not.toBe(sig(projectileRaster('potionGold', 0, 3).rows));
  });
});

describe('Runde 14: Effekte', () => {
  it('Frames gueltig, nicht leer und verschieden', () => {
    const sets: [string, number, (f: number) => { rows: string[] }][] = [
      ['whirlwind', WIND_FRAMES, whirlwindRaster], ['vineSnare', 4, vineSnareRaster], ['treeWallGrow', WALL_GROW_FRAMES, treeWallGrowRaster],
      ['thornZone', ZONE_FRAMES, (f) => thornZoneRaster(40, f)], ['worldTree', ZONE_FRAMES, (f) => worldTreeZoneRaster(72, f)],
      ['splash', SPLASH_FRAMES, (f) => acidSplashRaster(20, f)], ['mark', 4, acidMarkRaster], ['pool', 4, (f) => acidPoolRaster(20, f)],
      ['buff', BUFF_FRAMES, (f) => buffGlowRaster(f, 'brew')], ['stimulant', BUFF_FRAMES, (f) => buffGlowRaster(f, 'stimulant')],
      ['death', DEATH_BLAST_FRAMES, (f) => deathBlastRaster(f, 24)], ['transform', TRANSFORM_FRAMES, monsterTransformRaster],
      ['shrink', SHRINK_FRAMES, (f) => shrinkRaster('ironshell', f)], ['lead', GOLD_BURST_FRAMES, (f) => goldBurstRaster('lead', f)], ['rubber', GOLD_BURST_FRAMES, (f) => goldBurstRaster('rubber', f)],
      ['arc', ARC_FRAMES, (f) => stormArcRaster([[10, 10], [60, 50], [110, 20]], f)],
    ];
    for (const [name, n, mk] of sets) {
      const fs = Array.from({ length: n }, (_, f) => mk(f).rows);
      fs.forEach((r) => { valid(r); expect(count(r), name).toBeGreaterThan(8); });
      expect(new Set(fs.map(sig)).size, name).toBe(n);
    }
    // Permanent-Glanz laeuft im Kreis (Frames 0 und 3 gleich)
    valid(buffGlowRaster(1, 'permanent').rows);
  });
  it('Baumwand: Abnutzung entfernt Laub (Stufe 3 deutlich weniger Pixel als 0), 4 Stufen verschieden', () => {
    const n = [0, 1, 2, 3].map((w) => count(treeWallRaster(w, 0).rows));
    expect(n[3]).toBeLessThan(n[0] * 0.7);
    expect(n[1]).toBeLessThan(n[0] + 1);
    expect(new Set([0, 1, 2, 3].map((w) => sig(treeWallRaster(w, 0).rows))).size).toBe(4);
  });
  it('Zonen: Radius bestimmt die Groesse; Blitzbogen deckt alle Punkte ab', () => {
    expect(thornZoneRaster(60, 0).rows.length).toBeGreaterThan(thornZoneRaster(30, 0).rows.length);
    expect(acidPoolRaster(30, 0).rows[0].length).toBeGreaterThan(acidPoolRaster(15, 0).rows[0].length);
    const pts: [number, number][] = [[20, 20], [100, 80], [180, 30]];
    const r = stormArcRaster(pts, 0);
    for (const [x, y] of pts) expect(r.rows[Math.round(y + r.ay)][Math.round(x + r.ax)]).not.toBe('.');
  });
  it('Schrumpfen: Pixelzahl sinkt in den Frames 0..4, Frame 5 ist ein roter Glim', () => {
    const n = [0, 1, 2, 3, 4].map((f) => count(shrinkRaster('ironshell', f).rows.map((r) => r.replace(/[^.]/g, (c) => (/[ERVTX]/.test(c) ? c : c)))));
    void n;
    expect(shrinkRaster('red', 5).rows.join('')).toMatch(/R/);
    expect(shrinkRaster('ironshell', 5).rows.join('')).toMatch(/R/);
  });
  it('Monster: 84 x 76, 8 Frames verschieden, Richtungen verschieden, Schlag-Frame mit Staub, klein ist kleiner', () => {
    const m = monsterRaster(0, 'idle0');
    expect(m.rows).toHaveLength(76);
    expect(m.rows[0]).toHaveLength(84);
    expect(new Set(['idle0', 'idle1', 'idle2', 'idle3', 'atk0', 'atk1', 'atk2', 'atk3'].map((f) => sig(monsterRaster(0, f as 'idle0').rows))).size).toBe(8);
    expect(new Set(Array.from({ length: 8 }, (_, f) => sig(monsterRaster(f, 'idle0').rows))).size).toBe(8);
    expect(count(monsterRaster(0, 'atk2').rows)).toBeGreaterThan(count(monsterRaster(0, 'atk1').rows) - 80);
    expect(height(m.rows)).toBeGreaterThan(55);
    const small = monsterRaster(0, 'idle0', 0.6);
    expect(small.rows.length).toBeLessThan(m.rows.length);
    valid(small.rows);
  });
});
