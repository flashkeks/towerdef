import { describe, expect, it } from 'vitest';
import { absoluteZeroRaster, arrowRainRaster, bossPlateRaster, boltLineRaster, dawnBeamRaster, explosionRaster, flareRaster, leakRaster, novaRaster, popRaster, puffRaster, statusRaster } from '../src/pixel/fx/effects';
import { textRaster, textWidth } from '../src/pixel/font';
import { camoAlpha, rowsToRGBA } from '../src/pixel/sprites/canvas';
import { enemyRaster } from '../src/pixel/sprites/enemies';
import { heroRaster, heroStage } from '../src/pixel/sprites/hero';
import { iconAbilityRaster, iconUpgradeRaster } from '../src/pixel/sprites/icons';
import { dir16, dir8, dirOf, TOWER_FRAMES } from '../src/pixel/sprites/pose';
import { projectileRaster } from '../src/pixel/sprites/projectiles';
import { Surface } from '../src/pixel/sprites/surface';
import { towerRaster, TOWER_H, TOWER_W } from '../src/pixel/sprites/towers';
import { ABILITIES, ENEMY_TYPES, PROJECTILE_KINDS, TOWER_TYPES, type Tiers, type TowerType } from '../src/pixel/sprites/types';
import { flipX } from '../src/pixel/raster';

const sig = (rows: string[]): string => rows.join('/');
const count = (rows: string[]): number => rows.join('').replace(/\./g, '').length;
const valid = (rows: string[]): void => { expect(() => rowsToRGBA(rows)).not.toThrow(); };

describe('Tuerme', () => {
  it('jede der 15 Stufen sieht anders aus als die vorige (alle Typen, alle Pfade)', () => {
    for (const type of TOWER_TYPES) {
      for (let p = 0; p < 3; p++) {
        let prev = '';
        for (let t = 0; t <= 5; t++) {
          const tiers: Tiers = [0, 0, 0];
          tiers[p] = t;
          const r = towerRaster(type, tiers, 0, 'idle0');
          valid(r.rows);
          const s = sig(r.rows);
          expect(s, `${type} Pfad ${p} Stufe ${t}`).not.toBe(prev);
          prev = s;
        }
      }
    }
  });
  it('Rahmen ist konstant, Anker liegt im Bild, alle Frames und Richtungen sind gueltig und nicht leer', () => {
    for (const type of TOWER_TYPES) {
      for (const tiers of [[0, 0, 0], [5, 0, 0], [0, 5, 2], [2, 0, 5], [3, 2, 0]] as Tiers[]) {
        for (let f = 0; f < 8; f++) {
          for (const fr of TOWER_FRAMES) {
            const r = towerRaster(type, tiers, f, fr);
            expect(r.rows.length).toBe(TOWER_H);
            expect(r.rows.every((x) => x.length === TOWER_W)).toBe(true);
            expect(r.ax).toBeLessThan(TOWER_W);
            expect(r.ay).toBeLessThan(TOWER_H);
            expect(count(r.rows)).toBeGreaterThan(150);
            valid(r.rows);
          }
        }
      }
    }
  });
  it('gespiegelte Blickrichtungen (W, NW, SW) sind exakte Spiegelbilder von E, NE, SE', () => {
    for (const type of TOWER_TYPES) {
      for (const [a, b] of [[4, 0], [3, 1], [5, 7]]) {
        expect(towerRaster(type, [2, 1, 0], a, 'idle1').rows).toEqual(flipX(towerRaster(type, [2, 1, 0], b, 'idle1').rows));
      }
    }
  });
  it('acht Blickrichtungen ergeben mindestens fuenf verschiedene Bilder, Idle-Frames wechseln', () => {
    for (const type of TOWER_TYPES) {
      const dirs = new Set(Array.from({ length: 8 }, (_, f) => sig(towerRaster(type, [3, 0, 0], f, 'idle0').rows)));
      expect(dirs.size).toBe(8);
      const frames = new Set(['idle0', 'idle1', 'idle2', 'idle3'].map((fr) => sig(towerRaster(type, [1, 0, 0], 0, fr as 'idle0').rows)));
      expect(frames.size, type).toBe(4);
    }
  });
  it('Angriff: F2 (Abschuss) unterscheidet sich von F0, F1 und F3; Muendung liegt vor der Figur', () => {
    for (const type of TOWER_TYPES) {
      const a = [0, 1, 2, 3].map((i) => towerRaster(type, [1, 0, 0], 0, `atk${i}` as 'atk0'));
      expect(new Set(a.map((r) => sig(r.rows))).size).toBe(4);
      expect(a[2].mx).toBeGreaterThan(0);
    }
  });
  it('Kombinationen (Crosspath) bilden sinnvolle Mischungen, ohne dass eine Stufe eine andere ersetzt', () => {
    const mixes: Tiers[] = [[3, 2, 0], [0, 2, 4], [2, 0, 5], [4, 0, 2], [0, 3, 2], [5, 2, 0], [2, 5, 0]];
    for (const type of TOWER_TYPES as TowerType[]) {
      const set = new Set(mixes.map((m) => sig(towerRaster(type, m, 0, 'idle0').rows)));
      expect(set.size).toBe(mixes.length);
      // 3-2-0 ist weder 3-0-0 noch 0-2-0
      const s320 = sig(towerRaster(type, [3, 2, 0], 0, 'idle0').rows);
      expect(s320).not.toBe(sig(towerRaster(type, [3, 0, 0], 0, 'idle0').rows));
      expect(s320).not.toBe(sig(towerRaster(type, [0, 2, 0], 0, 'idle0').rows));
    }
  });
});

describe('Held Wren', () => {
  it('fuenf sichtbare Stufen, Level innerhalb einer Stufe gleich', () => {
    const lv = [1, 5, 10, 15, 20];
    expect(lv.map(heroStage)).toEqual([0, 1, 2, 3, 4]);
    expect(new Set(lv.map((l) => sig(heroRaster(l, 0, 'idle0').rows))).size).toBe(5);
    expect(sig(heroRaster(1, 0, 'idle0').rows)).toBe(sig(heroRaster(4, 0, 'idle0').rows));
    expect(sig(heroRaster(10, 0, 'idle0').rows)).toBe(sig(heroRaster(14, 0, 'idle0').rows));
  });
  it('Idle, Angriff und Faehigkeits-Pose sind gueltig und verschieden', () => {
    const fr = ['idle0', 'idle1', 'atk0', 'atk2', 'cast0', 'cast1'] as const;
    const s = new Set(fr.map((f) => sig(heroRaster(12, 0, f).rows)));
    expect(s.size).toBe(fr.length);
    for (const f of fr) valid(heroRaster(12, 3, f).rows);
  });
});

describe('Gegner', () => {
  it('alle Typen: 4 Lauf-Frames gueltig, Frames unterscheiden sich, Anker im Bild', () => {
    for (const t of ENEMY_TYPES) {
      const rs = [0, 1, 2, 3].map((f) => enemyRaster(t, f));
      for (const r of rs) {
        valid(r.rows);
        expect(count(r.rows)).toBeGreaterThan(40);
        expect(r.ax).toBeLessThan(r.rows[0].length);
      }
      expect(new Set(rs.map((r) => sig(r.rows))).size, t).toBe(4);
    }
  });
  it('Brute-Risse 0-2 und Leviathan-Platten 0-3 sind sichtbar verschieden', () => {
    expect(new Set([0, 1, 2].map((k) => sig(enemyRaster('brute', 0, { damageStage: k }).rows))).size).toBe(3);
    expect(new Set([0, 1, 2, 3].map((k) => sig(enemyRaster('leviathan', 0, { damageStage: k }).rows))).size).toBe(4);
  });
  it('Treffer-Blitz ist eine weisse Silhouette (nur weiss + Umriss), gleiche Form', () => {
    for (const t of ENEMY_TYPES) {
      const n = enemyRaster(t, 1);
      const w = enemyRaster(t, 1, { hitFlash: true });
      expect(new Set(w.rows.join('').replace(/\./g, ''))).toEqual(new Set(['W', 'X']));
      expect(w.rows.map((r) => r.replace(/[^.]/g, '#'))).toEqual(n.rows.map((r) => r.replace(/[^.]/g, '#')));
    }
  });
  it('flip spiegelt Bild und Anker; Camo-Flimmer macht Alpha schachbrettartig und wandert mit dem Frame', () => {
    const a = enemyRaster('green', 0), b = enemyRaster('green', 0, { flip: true });
    expect(b.rows).toEqual(flipX(a.rows));
    expect(b.ax).toBe(a.rows[0].length - 1 - a.ax);
    const c0 = rowsToRGBA(a.rows, camoAlpha(0)), c1 = rowsToRGBA(a.rows, camoAlpha(1));
    const alphas = new Set<number>();
    for (let i = 3; i < c0.data.length; i += 4) if (c0.data[i]) alphas.add(c0.data[i]);
    expect(alphas.size).toBe(2);
    expect(Buffer.from(c0.data).equals(Buffer.from(c1.data))).toBe(false);
  });
  it('Schichten sind an der Farbe erkennbar: Red/Blue/Green/Gold haben je eine eigene Hauptfarbe', () => {
    const dom = (t: 'red' | 'blue' | 'green' | 'gold') => {
      const m: Record<string, number> = {};
      for (const ch of enemyRaster(t, 0).rows.join('')) if (!'.XWN'.includes(ch)) m[ch] = (m[ch] ?? 0) + 1;
      return Object.entries(m).sort((x, y) => y[1] - x[1])[0][0];
    };
    expect(new Set((['red', 'blue', 'green', 'gold'] as const).map(dom)).size).toBe(4);
  });
});

describe('Projektile', () => {
  it('alle Arten in 16 Richtungen: gueltig, nicht leer, Pfeile haben 16 verschiedene Bilder', () => {
    for (const k of PROJECTILE_KINDS) {
      for (let d = 0; d < 16; d++) {
        const r = projectileRaster(k, d);
        valid(r.rows);
        expect(count(r.rows)).toBeGreaterThan(3);
      }
    }
    for (const k of ['arrow', 'bigArrow', 'bolt', 'starBolt', 'frost', 'shard'] as const) {
      expect(new Set(Array.from({ length: 16 }, (_, d) => sig(projectileRaster(k, d).rows))).size).toBe(16);
    }
  });
  it('Richtungshilfen', () => {
    expect(dir16(1, 0)).toBe(0);
    expect(dir16(0, -1)).toBe(4);
    expect(dir16(-1, 0)).toBe(8);
    expect(dir16(0, 1)).toBe(12);
    expect(dir8(1, -1)).toBe(1);
    expect(dir8(-1, 1)).toBe(5);
    expect(dirOf(4).flip).toBe(true);
    expect(dirOf(0).flip).toBe(false);
  });
});

describe('Effekte', () => {
  it('Explosion: 4 Arten x 5 Frames, Frames verschieden, Radius skaliert', () => {
    for (const k of ['bomb', 'mini', 'star', 'quake'] as const) {
      const fs = [0, 1, 2, 3, 4].map((f) => explosionRaster(k, f));
      fs.forEach((f) => { valid(f.rows); expect(count(f.rows)).toBeGreaterThan(5); });
      expect(new Set(fs.map((f) => sig(f.rows))).size).toBe(5);
    }
    expect(explosionRaster('bomb', 2, 40).rows.length).toBeGreaterThan(explosionRaster('bomb', 2, 20).rows.length);
  });
  it('Platzen: 6 Frames je Typ in Schichtfarbe, Nova 4 Frames, Puff 6, Platte 8', () => {
    for (const t of ENEMY_TYPES) {
      const fs = Array.from({ length: 6 }, (_, f) => popRaster(t, f));
      fs.forEach((f) => valid(f.rows));
      expect(new Set(fs.map((f) => sig(f.rows))).size).toBeGreaterThanOrEqual(5);
    }
    const red = popRaster('red', 3).rows.join('');
    expect(red).toMatch(/[RCf]/);
    expect(popRaster('green', 3).rows.join('')).toMatch(/[LGP]/);
    expect(new Set([0, 1, 2, 3].map((f) => sig(novaRaster(f, 20).rows))).size).toBe(4);
    expect(new Set([0, 1, 2, 3, 4, 5].map((f) => sig(puffRaster(f, 1).rows))).size).toBe(6);
    expect(new Set(Array.from({ length: 8 }, (_, f) => sig(bossPlateRaster(f).rows))).size).toBe(8);
  });
  it('Blitzlinie deckt alle Punkte ab, Anker = Weltursprung', () => {
    const pts: [number, number][] = [[40, 30], [70, 50], [90, 20]];
    const r = boltLineRaster(pts, 0);
    valid(r.rows);
    for (const [x, y] of pts) expect(r.rows[Math.round(y + r.ay)][Math.round(x + r.ax)]).not.toBe('.');
  });
  it('Status, Leck, Faehigkeiten', () => {
    for (const k of ['slow', 'stun', 'burn', 'reveal', 'freeze'] as const) for (let f = 0; f < 4; f++) { const r = statusRaster(k, f, 'brute'); valid(r.rows); expect(count(r.rows)).toBeGreaterThan(3); }
    for (let f = 0; f < 6; f++) { valid(leakRaster(f).rows); valid(flareRaster(f).rows); valid(arrowRainRaster(f).rows); }
    for (let f = 0; f < 8; f++) valid(absoluteZeroRaster(f, 160, 90).rows);
    for (let f = 0; f < 4; f++) { valid(dawnBeamRaster(120, f).rows); expect(dawnBeamRaster(120, f, true).rows.length).toBe(120); }
  });
});

describe('Icons und Schrift', () => {
  it('45 Upgrade-Icons 16x16, alle verschieden, Stufenpunkte zaehlen mit', () => {
    const seen = new Set<string>();
    for (const type of TOWER_TYPES) for (const p of [0, 1, 2] as const) for (let t = 1; t <= 5; t++) {
      const r = iconUpgradeRaster(type, p, t);
      expect(r.rows.length).toBe(16);
      expect(r.rows.every((x) => x.length === 16)).toBe(true);
      valid(r.rows);
      seen.add(sig(r.rows));
    }
    expect(seen.size).toBe(45);
    for (const a of ABILITIES) { valid(iconAbilityRaster(a).rows); }
    expect(new Set(ABILITIES.map((a) => sig(iconAbilityRaster(a).rows))).size).toBe(4);
  });
  it('Pixel-Ziffern 3 x 5', () => {
    const r = textRaster('+120', 'yellow', null);
    expect(r.rows.length).toBe(5);
    expect(textWidth('120')).toBe(11);
    expect(sig(textRaster('1', 'white', null).rows)).not.toBe(sig(textRaster('7', 'white', null).rows));
    for (const c of '0123456789+-.,/%xk') expect(count(textRaster(c, 'white', null).rows)).toBeGreaterThan(0);
  });
  it('Surface: Ellipse, Linie, Raster-Roundtrip', () => {
    const s = new Surface(9, 9).ellipse(4.5, 4.5, 3, 3, 'red').line(0, 0, 8, 8, 'white');
    expect(s.get(4, 4)).toBe('white');
    expect(s.get(4, 2)).toBe('red');
    expect(Surface.fromRows(s.toRows()).toRows()).toEqual(s.toRows());
    s.erase(4.5, 4.5, 1.5, 1.5);
    expect(s.get(4, 3)).toBeNull();
  });
});
