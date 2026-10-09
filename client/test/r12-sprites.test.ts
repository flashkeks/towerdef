import { describe, expect, it } from 'vitest';
import { bigHeartRaster, bombLanternRaster, bubbleRaster, coinRaster, emberRaster, merchantRaster, powerIconRaster, POWER_ICON_IDS, trapRaster } from '../src/pixel/sprites/powers';
import { rowsToRGBA } from '../src/pixel/sprites/canvas';

const valid = (rows: string[]): void => { expect(() => rowsToRGBA(rows)).not.toThrow(); };
const count = (rows: string[]): number => rows.join('').replace(/\./g, '').length;

describe('Powers: Pixel-Art', () => {
  it('Icons: 16 x 16, nur Palette, alle verschieden', () => {
    const seen = new Set<string>();
    for (const id of POWER_ICON_IDS) {
      const r = powerIconRaster(id);
      expect(r.rows).toHaveLength(16);
      for (const row of r.rows) expect(row).toHaveLength(16);
      valid(r.rows);
      expect(count(r.rows), id).toBeGreaterThan(120);
      seen.add(r.rows.join('/'));
    }
    expect(seen.size).toBe(POWER_ICON_IDS.length);
  });
  it('Embers-Symbol, Haendler, Effekt-Bausteine sind gueltige Raster', () => {
    for (const r of [emberRaster(0), emberRaster(1), merchantRaster(0), merchantRaster(1), coinRaster(0), coinRaster(2), bigHeartRaster(), bombLanternRaster(0), bubbleRaster(0, 20), bubbleRaster(3, 20)]) { valid(r.rows); expect(count(r.rows)).toBeGreaterThan(5); }
    expect(emberRaster(0).rows).toHaveLength(16);
    expect(merchantRaster(0).rows.join('')).not.toBe(merchantRaster(1).rows.join(''));
  });
  it('Fallen: weniger Ladungen = weniger Zacken (weniger Pixel)', () => {
    for (const kind of ['caltrops', 'frostTrap'] as const) {
      let prev = Infinity;
      for (const n of kind === 'caltrops' ? [6, 4, 2, 1] : [5, 4, 2, 1]) {
        const c = count(trapRaster(kind, n, 0).rows);
        valid(trapRaster(kind, n, 0).rows);
        expect(c, `${kind} ${n}`).toBeLessThan(prev);
        prev = c;
      }
      expect(count(trapRaster(kind, 0, 0).rows)).toBeLessThan(prev);
    }
  });
});
