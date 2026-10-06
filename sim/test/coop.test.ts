/**
 * Koop-Skalierung (Runde 4 / P5, docs/balancing/kalibrierung.md "Runde 4 - P5"):
 * HP-Faktor je Spielerzahl aus einer Tabelle (`economy.coop.hpTableBp`), Boss getrennt (`bossHpTableBp`), Solo bleibt unberührt.
 */
import { describe, expect, it } from 'vitest';
import { compile, coopHpFor } from '../src/data/compile.js';
import { validateGameData } from '../src/data/load.js';
import { wavePool } from '../src/systems/waves.js';
import { createEnemy } from '../src/systems/spawn.js';
import { plainData, stage } from './helpers.js';

const withCoop = (c: Record<string, unknown>) => {
  const d = plainData();
  Object.assign(d.economy.coop, c);
  return d;
};
const ctx = (d: ReturnType<typeof plainData>, players: number) => compile(d, stage, 'normal', players);
const hp = (d: ReturnType<typeof plainData>, players: number, type: string, wave = 10): number => {
  const c = ctx(d, players);
  return createEnemy(c, 1, type, wave, [], 0).maxHp;
};

describe('Koop-HP-Faktor', () => {
  it('eingecheckte Daten: Tabelle (falls vorhanden) beginnt bei 10000, Länge = maxPlayers; Solo-Faktor ist x1', () => {
    const d = plainData();
    const t = d.economy.coop.hpTableBp;
    if (t) {
      expect(t[0]).toBe(10000);
      expect(t.length).toBe(d.economy.coop.maxPlayers);
    }
    expect(ctx(d, 1).coopHpBp).toBe(10000);
    expect(ctx(d, 1).coopBossHpBp).toBe(10000);
  });

  it('Tabelle überschreibt die lineare Formel, je Spielerzahl ein Eintrag', () => {
    const d = withCoop({ hpTableBp: [10000, 15000, 18000, 21000], bossHpTableBp: undefined });
    expect([1, 2, 3, 4].map((p) => ctx(d, p).coopHpBp)).toEqual([10000, 15000, 18000, 21000]);
    // Ohne Boss-Tabelle gilt der normale Faktor auch für den Boss
    expect(ctx(d, 4).coopBossHpBp).toBe(21000);
  });

  it('ohne Tabelle gilt die lineare Formel (Rückwärtskompatibilität)', () => {
    const d = withCoop({ hpTableBp: undefined, bossHpTableBp: undefined, hpPerExtraPlayerBp: 8000 });
    expect(ctx(d, 3).coopHpBp).toBe(10000 + 2 * 8000);
  });

  it('Boss-Tabelle wirkt nur auf den Archetyp boss (Gegner-HP, Wellenpool, Beschwörungs-Helfer unberührt)', () => {
    const base = withCoop({ hpTableBp: [10000, 15000, 18000, 20000], bossHpTableBp: undefined });
    const sep = withCoop({ hpTableBp: [10000, 15000, 18000, 20000], bossHpTableBp: [10000, 12000, 14000, 16000] });
    const ratio = (type: string): number => hp(sep, 4, type) / hp(base, 4, type);
    expect(ratio('grunt')).toBe(1);
    expect(Math.abs(ratio('boss') - 16000 / 20000)).toBeLessThan(0.001);
    expect(coopHpFor(ctx(sep, 4), 'boss')).toBe(16000);
    expect(coopHpFor(ctx(sep, 4), 'grunt')).toBe(20000);
    // Wave 10 hat den Boss: Pool sinkt, Wave 5 ohne Boss bleibt gleich
    expect(wavePool(ctx(sep, 4), 10)).toBeLessThan(wavePool(ctx(base, 4), 10));
    expect(wavePool(ctx(sep, 4), 3)).toBe(wavePool(ctx(base, 4), 3));
  });

  it('Solo-Werte ändern sich durch Koop-Tabellen nie', () => {
    const a = withCoop({ hpTableBp: [10000, 15000, 18000, 20000], bossHpTableBp: [10000, 12000, 14000, 16000] });
    const b = withCoop({ hpTableBp: [10000, 30000, 30000, 30000], bossHpTableBp: [10000, 99999, 99999, 99999] });
    for (const type of ['grunt', 'brute', 'boss', 'elite']) expect(hp(a, 1, type)).toBe(hp(b, 1, type));
    expect(wavePool(ctx(a, 1), 20)).toBe(wavePool(ctx(b, 1), 20));
  });

  it('Validierung: Tabelle muss mit 10000 beginnen und maxPlayers Einträge haben', () => {
    expect(() => validateGameData(withCoop({ hpTableBp: [11000, 15000, 18000, 21000] }))).toThrow(/10000/);
    expect(() => validateGameData(withCoop({ bossHpTableBp: [10000, 15000] }))).toThrow(/maxPlayers/);
    expect(() => validateGameData(withCoop({ hpTableBp: [10000, 15000, 18000, 21000] }))).not.toThrow();
  });
});
