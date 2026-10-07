import { describe, expect, it } from 'vitest';
import { getBot, runMatch } from '../src/bots/index.js';
import { loadGameData } from '../src/index.js';
import { createSim } from '../src/index.js';

/** Runde 6 / P2: steigende Platzierkosten je weiterer gleicher Unit (`economy.placeCostGrowthBp`, `placeCostFreeCopies`). */
const data = (growth: number, free: number, unit?: Record<string, unknown>) => {
  const d = loadGameData();
  d.economy.startCoins = 100_000;
  d.economy.placeCostGrowthBp = growth;
  d.economy.placeCostFreeCopies = free;
  if (unit) Object.assign(d.units.units.find((u) => u.id === "ichigo") as object, unit);
  return d;
};
const mk = (d = data(1000, 2)) => createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: d });
// Bodenpunkte entlang der oberen Bodenreihe, 800 Abstand (Radius 400)
const spot = (i: number) => ({ x: 800 * i + 7000, y: 3000 });

describe('placeCost: steigende Platzierkosten', () => {
  it('Daten: ab dem 6. Exemplar +10 % je weiterer Unit, Farm eingeschlossen', () => {
    const eco = loadGameData().economy;
    expect(eco.placeCostFreeCopies).toBe(5);
    expect(eco.placeCostGrowthBp).toBe(1000);
  });
  it('freie Exemplare zum Basispreis, danach linear (Basis x (1 + Zuwachs x (k - frei)))', () => {
    const sim = mk();
    const costs: number[] = [];
    for (let i = 0; i < 5; i++) {
      costs.push(sim.placeCost(0, 'ichigo'));
      const p = spot(i);
      const c0 = sim.state.players[0].coins;
      expect(sim.apply(0, { type: 'place', unitId: 'ichigo', ...p }).ok).toBe(true);
      expect(c0 - sim.state.players[0].coins).toBe(costs[i]); // `placeCost` ist genau der abgebuchte Betrag
    }
    expect(costs).toEqual([350, 350, 385, 420, 455]); // Exemplar 3 = +10 %, 4 = +20 %, 5 = +30 %
  });
  it('gilt je Spieler und je Typ, Verkauf senkt den Preis wieder, `placeCost(unitId)` = Spieler 0', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 2, seed: 1, data: data(1000, 0) });
    const r = sim.apply(0, { type: 'place', unitId: 'ichigo', ...spot(0) });
    expect(r.ok).toBe(true);
    expect(sim.placeCost(0, 'ichigo')).toBe(385);
    expect(sim.placeCost('ichigo')).toBe(385);
    expect(sim.placeCost(1, 'ichigo')).toBe(350); // anderer Spieler: eigener Zähler
    expect(sim.placeCost(0, 'krillin')).toBe(sim.placeCost(1, 'krillin')); // anderer Typ: Basis
    if (r.ok) sim.apply(0, { type: 'sell', entityId: r.entityId as number });
    expect(sim.placeCost(0, 'ichigo')).toBe(350);
  });
  it('zu wenig Münzen wegen des Aufschlags: `not-enough-coins`, Unit-Feld überstimmt die Wirtschaft', () => {
    const d = data(0, 0, { placeGrowthBp: 5000 });
    d.economy.startCoins = 1500;
    const sim = mk(d);
    expect(sim.placeCost(0, 'ichigo')).toBe(350);
    expect(sim.apply(0, { type: 'place', unitId: 'ichigo', ...spot(0) }).ok).toBe(true);
    expect(sim.placeCost(0, 'ichigo')).toBe(525); // +50 % nur für Ichigo
    expect(sim.placeCost(0, 'krillin')).toBe(sim.catalog().find((u) => u.id === 'krillin')?.placeCost);
    expect(sim.apply(0, { type: 'place', unitId: 'ichigo', ...spot(1) }).ok).toBe(true); // 525, bleiben 625
    const bad = sim.apply(0, { type: 'place', unitId: 'ichigo', ...spot(2) }); // 700 > 625
    expect(bad.ok ? null : bad.reason).toBe('not-enough-coins');
  });
  it('Standarddaten: ohne Zuwachs (0) unverändert, Bot-Lauf deterministisch mit Aufschlag', () => {
    const d0 = data(0, 0);
    const sim = mk(d0);
    sim.apply(0, { type: 'place', unitId: 'ichigo', ...spot(0) });
    expect(sim.placeCost(0, 'ichigo')).toBe(350);
    const a = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 3, bots: ['auto'] });
    const b = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 3, bots: ['auto'] });
    expect(a.finalUnits).toEqual(b.finalUnits);
  });
});

describe('mono-X Bots', () => {
  it('getBot kennt mono-X, platziert nur diese Unit', () => {
    expect(getBot('mono-ichigo')().name).toBe('auto:ichigo');
    const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, bots: ['mono-ichigo'] });
    expect(r.finalUnits.length).toBeGreaterThan(0);
    expect(new Set(r.finalUnits.map((u) => u.unit)).size).toBe(1);
    expect(r.finalUnits[0].unit).toBe('ichigo');
  });
});
