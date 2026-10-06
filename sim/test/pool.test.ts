import { describe, expect, it } from 'vitest';
import { wavePool } from '../src/systems/waves.js';
import { ctxFor, stage } from './helpers.js';

// Spalte "Pool (HP)" aus recommendations §5.
const POOL = [200, 252, 317, 429, 629, 705, 938, 1122, 1436, 2634, 2081, 2383, 2961, 3480, 3690, 4967, 5517, 6557, 6921, 9689];

describe('Pool-Check (§5)', () => {
  const ctx = ctxFor();
  it('Stage hat 20 Waves', () => {
    expect(stage.waves).toHaveLength(20);
  });
  POOL.forEach((expected, i) => {
    it(`Wave ${i + 1}: Pool ${expected} HP (+-1 %)`, () => {
      const pool = wavePool(ctx, i + 1) / 100;
      expect(Math.abs(pool - expected) / expected).toBeLessThanOrEqual(0.01);
    });
  });
  it('Koop skaliert den Pool mit h(n)', () => {
    const solo = wavePool(ctx, 20);
    const four = wavePool(ctxFor(4), 20);
    expect(four / solo).toBeGreaterThan(3.24);
    expect(four / solo).toBeLessThan(3.26);
  });
  it('Spawn-Fenster <= 35 s, Wave-Timer 45 s, Bosse/Elite nur in W5/10/15/19/20', () => {
    expect(ctx.waveTimerTicks).toBe(900);
    for (const w of stage.waves) {
      const last = Math.max(...w.groups.map((g) => g.delayTicks + (g.count - 1) * g.intervalTicks));
      expect(last).toBeLessThanOrEqual(35 * 20);
    }
  });
});
