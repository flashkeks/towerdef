import { describe, expect, it } from 'vitest';
import { wavePool } from '../src/systems/waves.js';
import { ctxFor, data, stage } from './helpers.js';

// Spalte "Pool (HP)" aus recommendations §5.
const POOL = [200, 252, 317, 429, 629, 705, 938, 1122, 1436, 2634, 2081, 2383, 2961, 3480, 3690, 4967, 5517, 6557, 6921, 9689];

// §5-Pools gelten für g = 1,12; kalibriertes g (docs/balancing/kalibrierung.md #2) skaliert Wave n um (g/1,12)^(n-1).
const G = data.enemies.hpCurve.growthBp / 10000;
// Runde 4 P1: die Normal-Stufe trägt einen eigenen HP-Faktor (kalibrierung.md), der Pool skaliert mit.
const D = data.difficulties.normal.hpBp / 10000;
// Runde 4 P2: der Boss-HP-Faktor ist Zwischenstand (kalibrierung.md); §5 rechnet mit 30. Die Boss-Anteile von Wave 10/20 skalieren entsprechend.
const bossF = data.enemies.archetypes.find((a) => a.id === 'boss')!.fHpBp / 10000;

describe('Pool-Check (§5, skaliert mit kalibriertem g)', () => {
  const ctx = ctxFor();
  it('Stage hat 20 Waves', () => {
    expect(stage.waves).toHaveLength(20);
  });
  POOL.forEach((expected0, i) => {
    it(`Wave ${i + 1}: Pool ${expected0} HP x (g/1,12)^${i} (+-1 %)`, () => {
      const pool = wavePool(ctx, i + 1) / 100;
      const hasBoss = stage.waves[i].groups.some((g) => g.type === 'boss');
      const bossShare = hasBoss ? 25 * 30 * 1.12 ** i * (1 - bossF / 30) : 0; // Boss-HP der §5-Tabelle (Faktor 30) minus Zwischenstand
      const expected = (expected0 - bossShare) * D * (G / 1.12) ** i;
      expect(Math.abs(pool - expected) / expected).toBeLessThanOrEqual(0.01);
    });
  });
  it('Koop skaliert den Pool mit h(n)', () => {
    const solo = wavePool(ctx, 20);
    const four = wavePool(ctxFor(4), 20);
    const h = 1 + (3 * data.economy.coop.hpPerExtraPlayerBp) / 10000;
    expect(four / solo).toBeGreaterThan(h - 0.01);
    expect(four / solo).toBeLessThan(h + 0.01);
  });
  it('Spawn-Fenster <= 35 s, Wave-Timer 45 s, Bosse/Elite nur in W5/10/15/19/20', () => {
    expect(ctx.waveTimerTicks).toBe(900);
    for (const w of stage.waves) {
      const last = Math.max(...w.groups.map((g) => g.delayTicks + (g.count - 1) * g.intervalTicks));
      expect(last).toBeLessThanOrEqual(35 * 20);
    }
  });
});
