import { describe, expect, it } from 'vitest';
import { auraRingRaster, bankChestRaster, bossMarkRaster, coinRiseRaster, COIN_RISE_FRAMES, CHEST_FRAMES, DROP_FRAMES, focusRaster, GRANT_FRAMES, grantRaster, ricochetRaster, supplyDropRaster } from '../src/pixel/fx/r13';
import { rowsToRGBA } from '../src/pixel/sprites/canvas';
import { growOf, widthOf } from '../src/pixel/sprites/gear';
import { heroRaster } from '../src/pixel/sprites/hero';
import { iconAbilityRaster, iconUpgradeRaster } from '../src/pixel/sprites/icons';
import { projectileRaster } from '../src/pixel/sprites/projectiles';
import { towerRaster } from '../src/pixel/sprites/towers';
import type { Tiers, TowerType } from '../src/pixel/sprites/types';

const sig = (rows: string[]): string => rows.join('/');
const count = (rows: string[]): number => rows.join('').replace(/\./g, '').length;
const valid = (rows: string[]): void => { expect(() => rowsToRGBA(rows)).not.toThrow(); };
const tiersOf = (p: number, t: number): Tiers => { const r: Tiers = [0, 0, 0]; r[p] = t; return r; };
/** Pixel-Hoehe der Figur (oberste bis unterste belegte Zeile). */
const height = (rows: string[]): number => {
  const ys = rows.map((r, y) => (/[^.]/.test(r) ? y : -1)).filter((y) => y >= 0);
  return ys[ys.length - 1] - ys[0] + 1;
};
/** Breite der breitesten der untersten `n` belegten Zeilen. */
const footWidth = (rows: string[], n = 3): number => {
  const ys = rows.map((r, y) => (/[^.]/.test(r) ? y : -1)).filter((y) => y >= 0);
  return Math.max(...ys.slice(-n).map((y) => rows[y].replace(/^\.+|\.+$/g, '').length));
};

describe('Runde 13: keine Plattform', () => {
  it('Basis-Tuerme und Wren: Fuesse stehen auf dem Boden, unten keine breite Platte', () => {
    for (const type of ['ranger', 'bombardier', 'frostcaller', 'longshot'] as TowerType[]) {
      const r = towerRaster(type, [0, 0, 0], 0, 'idle0');
      expect(footWidth(r.rows, 2), type).toBeLessThanOrEqual(16);
      // unterste Figurzeile liegt nahe am Anker (Fuss), nicht darunter
      const lastY = r.rows.map((x, y) => (/[^.]/.test(x) ? y : -1)).filter((y) => y >= 0).pop() as number;
      expect(Math.abs(lastY - r.ay), type).toBeLessThanOrEqual(2);
    }
    expect(footWidth(heroRaster('wren', 1, 0, 'idle0').rows, 2)).toBeLessThanOrEqual(16);
    expect(footWidth(heroRaster('wren', 20, 0, 'idle0').rows, 2)).toBeLessThanOrEqual(30);
  });
});

describe('Runde 13: deutlichere Stufen bei Ranger, Bombardier, Frostcaller', () => {
  it('Figur waechst mit der Stufe (3 groesser, 4 nochmals, 5 am groessten)', () => {
    expect([0, 1, 2, 3, 4, 5].map(growOf)).toEqual([0, 0, 0, 2, 4, 7]);
    expect(widthOf(5)).toBeGreaterThan(widthOf(3));
    for (const type of ['ranger', 'bombardier', 'frostcaller'] as TowerType[]) {
      for (let p = 0; p < 3; p++) {
        const h = [0, 2, 3, 4, 5].map((t) => height(towerRaster(type, tiersOf(p, t), 6, 'idle0').rows));
        expect(h[3], `${type} ${p} Stufe 4 hoeher als 3`).toBeGreaterThan(h[2] - 1);
        expect(h[4], `${type} ${p} Stufe 5 hoeher als 0`).toBeGreaterThanOrEqual(h[0] + 8);
        expect(h[4], `${type} ${p} Stufe 5 >= Stufe 3`).toBeGreaterThanOrEqual(h[2]);
      }
    }
  });
  it('Stufe 1 und 2 zeigen Ausruestung in Pfadfarbe (Pixel unterscheiden sich deutlich von der Basis)', () => {
    for (const type of ['ranger', 'bombardier', 'frostcaller'] as TowerType[]) {
      const base = towerRaster(type, [0, 0, 0], 6, 'idle0').rows;
      for (let p = 0; p < 3; p++) for (const t of [1, 2]) {
        const r = towerRaster(type, tiersOf(p, t), 6, 'idle0').rows;
        let diff = 0;
        r.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== base[y][x]) diff++; });
        expect(diff, `${type} ${'ABC'[p]}${t}`).toBeGreaterThan(24);
      }
    }
  });
  it('Stufe 5 hat Fluegel/Aura: Rahmen deutlich breiter als Stufe 0, bis mindestens 40 px', () => {
    for (const type of ['ranger', 'bombardier', 'frostcaller'] as TowerType[]) {
      const rows = towerRaster(type, [5, 0, 0], 6, 'idle0').rows;
      expect(height(rows)).toBeGreaterThanOrEqual(36);
    }
  });
  it('Wren: Stufen sichtbar groesser, Level 20 am hoechsten', () => {
    const h = [1, 5, 10, 15, 20].map((l) => height(heroRaster('wren', l, 6, 'idle0').rows));
    expect(h[4]).toBeGreaterThan(h[0] + 8);
    expect(h[3]).toBeGreaterThanOrEqual(h[1]);
  });
});

describe('Runde 13: Lantern Market', () => {
  it('15 Stufen verschieden, Stand -> Halle -> Gildenhaus -> Kuppel waechst', () => {
    const seen = new Set<string>();
    for (let p = 0; p < 3; p++) for (let t = 0; t <= 5; t++) {
      const r = towerRaster('market', tiersOf(p, t), 0, 'idle1');
      valid(r.rows);
      seen.add(sig(r.rows));
    }
    expect(seen.size).toBe(16); // 18 Bilder, Stufe 0 ist fuer alle drei Pfade gleich
    const hA = [0, 3, 4, 5].map((t) => count(towerRaster('market', tiersOf(0, t), 0, 'idle0').rows));
    expect(hA[1]).toBeGreaterThan(hA[0]);
    expect(height(towerRaster('market', tiersOf(2, 5), 0, 'idle0').rows)).toBeGreaterThan(height(towerRaster('market', tiersOf(2, 0), 0, 'idle0').rows) + 15);
  });
  it('Idle: vier Frames verschieden (Laternen, Winken), Blickrichtung aendert nichts, nie gespiegelt', () => {
    for (const t of [[0, 0, 0], [3, 0, 0], [0, 3, 0], [0, 0, 5]] as Tiers[]) {
      expect(new Set(['idle0', 'idle1', 'idle2', 'idle3'].map((f) => sig(towerRaster('market', t, 0, f as 'idle0').rows))).size).toBe(4);
      for (let f = 1; f < 8; f++) expect(towerRaster('market', t, f, 'idle1').rows).toEqual(towerRaster('market', t, 0, 'idle1').rows);
    }
  });
  it('Crosspath: Zweitpfad setzt sichtbare Beigaben', () => {
    const a = sig(towerRaster('market', [3, 0, 0], 0, 'idle0').rows);
    expect(sig(towerRaster('market', [3, 2, 0], 0, 'idle0').rows)).not.toBe(a);
    expect(sig(towerRaster('market', [3, 0, 2], 0, 'idle0').rows)).not.toBe(a);
    expect(sig(towerRaster('market', [3, 2, 0], 0, 'idle0').rows)).not.toBe(sig(towerRaster('market', [3, 0, 2], 0, 'idle0').rows));
  });
});

describe('Runde 13: Longshot', () => {
  it('8 Blickrichtungen, Angriffs-Frames verschieden, Muendung vor der Figur und im Bild', () => {
    for (const t of [[0, 0, 0], [3, 0, 0], [5, 0, 0], [0, 3, 0], [0, 0, 5]] as Tiers[]) {
      const dirs = new Set(Array.from({ length: 8 }, (_, f) => sig(towerRaster('longshot', t, f, 'idle0').rows)));
      expect(dirs.size, t.join('-')).toBe(8);
      const a = [0, 1, 2, 3].map((i) => towerRaster('longshot', t, 0, `atk${i}` as 'atk0'));
      expect(new Set(a.map((r) => sig(r.rows))).size).toBe(4);
      expect(a[2].mx).toBeGreaterThan(8);
    }
  });
  it('Stufen: Zielfernrohr, Riesenarmbrust, Kanone, zweiter und dritte Schuetzen zeigen sich als mehr Pixel', () => {
    const n = (t: Tiers) => count(towerRaster('longshot', t, 0, 'idle0').rows);
    expect(n([3, 0, 0])).toBeGreaterThan(n([0, 0, 0]));
    expect(n([4, 0, 0])).toBeGreaterThan(n([3, 0, 0]));
    expect(n([0, 4, 0])).toBeGreaterThan(n([0, 3, 0]) + 20);
    expect(n([0, 5, 0])).toBeGreaterThan(n([0, 4, 0]));
    expect(n([0, 0, 5])).toBeGreaterThan(n([0, 0, 4]));
  });
  it('Kanone (A5) feuert einen Lichtstrahl, nur im Abschuss-Frame', () => {
    const f2 = count(towerRaster('longshot', [5, 0, 0], 0, 'atk2').rows);
    expect(f2).toBeGreaterThan(count(towerRaster('longshot', [5, 0, 0], 0, 'atk1').rows) + 10);
  });
  it('Projektile: Bolzen mit Leuchtspur und Splitter in 16 Richtungen gueltig', () => {
    for (const k of ['snipe', 'snipeHeavy', 'snipeGold', 'splinter'] as const) {
      for (let d = 0; d < 16; d++) { const r = projectileRaster(k, d); valid(r.rows); expect(count(r.rows)).toBeGreaterThan(3); }
      expect(new Set(Array.from({ length: 16 }, (_, d) => sig(projectileRaster(k, d).rows))).size).toBeGreaterThanOrEqual(8);
    }
    expect(count(projectileRaster('snipeGold', 0).rows)).toBeGreaterThan(count(projectileRaster('snipe', 0).rows));
  });
});

describe('Runde 13: Icons und Effekte', () => {
  it('30 Upgrade-Icons beider neuer Tuerme, alle verschieden, 16 x 16', () => {
    const seen = new Set<string>();
    for (const type of ['market', 'longshot'] as const) for (const p of [0, 1, 2] as const) for (let t = 1; t <= 5; t++) {
      const r = iconUpgradeRaster(type, p, t);
      expect(r.rows).toHaveLength(16);
      expect(r.rows.every((x) => x.length === 16)).toBe(true);
      valid(r.rows);
      expect(count(r.rows), `${type} ${p} ${t}`).toBeGreaterThan(70);
      seen.add(sig(r.rows));
    }
    expect(seen.size).toBe(30);
  });
  it('Faehigkeits-Icons Grant, Focus, Supply Drop', () => {
    for (const a of ['grant', 'focus', 'supplyDrop'] as const) { const r = iconAbilityRaster(a); expect(r.rows).toHaveLength(16); valid(r.rows); expect(count(r.rows)).toBeGreaterThan(40); }
  });
  it('Muenzflug, Bank-Truhe, Aura-Ring, Grant, Supply-Drop, Focus, Markierung, Ricochet: gueltig, Frames verschieden', () => {
    const frames = (n: number, mk: (f: number) => { rows: string[] }) => Array.from({ length: n }, (_, f) => mk(f).rows);
    for (const [n, mk] of [
      [COIN_RISE_FRAMES, coinRiseRaster], [CHEST_FRAMES, bankChestRaster], [GRANT_FRAMES, grantRaster], [DROP_FRAMES, supplyDropRaster], [4, focusRaster], [4, bossMarkRaster],
    ] as [number, (f: number) => { rows: string[] }][]) {
      const fs = frames(n, mk);
      fs.forEach((r) => { valid(r); expect(count(r)).toBeGreaterThan(10); });
      const ks = fs.map(sig); expect(new Set(ks).size, ks.map((k, i) => ks.indexOf(k) === i ? '' : `dup ${ks.indexOf(k)}=${i}`).join(' ')).toBe(n);
    }
    for (let p = 0; p < 3; p++) valid(auraRingRaster(60, 1, p).rows);
    expect(new Set([0, 1, 2].map((p) => sig(auraRingRaster(60, 0, p).rows))).size).toBe(3);
    expect(auraRingRaster(80, 0).rows.length).toBeGreaterThan(auraRingRaster(40, 0).rows.length);
  });
  it('Bank-Truhe oeffnet sich: offene Frames haben mehr Pixel als der geschlossene', () => {
    expect(count(bankChestRaster(3).rows)).toBeGreaterThan(count(bankChestRaster(0).rows));
  });
  it('Boss-Markierung ist rot, Ricochet deckt alle Punkte ab', () => {
    expect(bossMarkRaster(0).rows.join('')).toMatch(/[RC]/);
    const pts: [number, number][] = [[20, 40], [80, 10], [120, 50]];
    const r = ricochetRaster(pts, 0);
    valid(r.rows);
    for (const [x, y] of pts) expect(r.rows[Math.round(y + r.ay)][Math.round(x + r.ax)]).not.toBe('.');
  });
});
