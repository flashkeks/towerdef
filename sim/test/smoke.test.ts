import { describe, expect, it } from 'vitest';
import { getBot, runMatch } from '../src/bots/index.js';
import { data } from './helpers.js';

/** Rauchtest (Kurswechsel 07.10.2026, Punkt 4): keine Siegquoten-Korridore, nur "läuft durch" und "nichts völlig kaputt". */
describe('Rauchtest: Bots spielen beliebige Units aus dem Datenformat', () => {
  it('zufällige Units aus sample.json (auto): die Stage läuft ohne Absturz bis zum Ende, deterministisch je Seed', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const a = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed, bots: ['auto'] });
      expect(['win', 'loss']).toContain(a.result);
      expect(a.finalUnits.length).toBeGreaterThan(0);
      if (seed <= 2) expect(runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed, bots: ['auto'] }).hash).toBe(a.hash);
    }
  });
  it('jede Unit aus sample.json für sich (mono): 2 Waves ohne Absturz', () => {
    for (const u of data.units.units) {
      const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, bots: [`mono-${u.id}`], maxTicks: 2 * 900 });
      expect(r.ticks, u.id).toBeGreaterThan(0);
    }
  });
  it('eine starke Unit (Goku SSJ3, Mythic, Hill) schafft Standard20 Normal allein', () => {
    const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, bots: ['mono-goku_ssj3'] });
    expect(r.result).toBe('win');
  });
  it('zwei Spieler (Koop) mit zufälligen Units laufen durch', () => {
    const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 2, seed: 3, bots: ['auto', 'mono-rikka_evo'] });
    expect(['win', 'loss']).toContain(r.result);
  });
  it('Infinite mit einer starken Unit: 25 Waves ohne Absturz', () => {
    const r = runMatch({ stage: 'infinite', difficulty: 'normal', players: 1, seed: 1, bots: ['mono-rikka_evo'], maxWaves: 25, maxTicks: 60000 });
    expect(r.endWave).toBeGreaterThan(0);
  });
  it('unbekannter Bot oder unbekannte Unit melden einen klaren Fehler', () => {
    expect(() => getBot('wide')).toThrow(/Unbekannter Bot/);
    expect(() => runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, bots: ['mono-gibtsnicht'] })).toThrow(/unbekannte Unit/);
  });
});
