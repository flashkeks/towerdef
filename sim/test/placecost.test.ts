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
  if (unit) Object.assign(d.units.units.find((u) => u.id === 'striker') as object, unit);
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
      costs.push(sim.placeCost(0, 'striker'));
      const p = spot(i);
      const c0 = sim.state.players[0].coins;
      expect(sim.apply(0, { type: 'place', unitId: 'striker', ...p }).ok).toBe(true);
      expect(c0 - sim.state.players[0].coins).toBe(costs[i]); // `placeCost` ist genau der abgebuchte Betrag
    }
    expect(costs).toEqual([200, 200, 220, 240, 260]); // Exemplar 3 = +10 %, 4 = +20 %, 5 = +30 %
  });
  it('gilt je Spieler und je Typ, Verkauf senkt den Preis wieder, `placeCost(unitId)` = Spieler 0', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 2, seed: 1, data: data(1000, 0) });
    const r = sim.apply(0, { type: 'place', unitId: 'striker', ...spot(0) });
    expect(r.ok).toBe(true);
    expect(sim.placeCost(0, 'striker')).toBe(220);
    expect(sim.placeCost('striker')).toBe(220);
    expect(sim.placeCost(1, 'striker')).toBe(200); // anderer Spieler: eigener Zähler
    expect(sim.placeCost(0, 'gunner')).toBe(sim.placeCost(1, 'gunner')); // anderer Typ: Basis
    if (r.ok) sim.apply(0, { type: 'sell', entityId: r.entityId as number });
    expect(sim.placeCost(0, 'striker')).toBe(200);
  });
  it('zu wenig Münzen wegen des Aufschlags: `not-enough-coins`, Unit-Feld überstimmt die Wirtschaft', () => {
    const d = data(0, 0, { placeGrowthBp: 5000 });
    d.economy.startCoins = 650;
    const sim = mk(d);
    expect(sim.placeCost(0, 'striker')).toBe(200);
    expect(sim.apply(0, { type: 'place', unitId: 'striker', ...spot(0) }).ok).toBe(true);
    expect(sim.placeCost(0, 'striker')).toBe(300); // +50 % nur für den Striker
    expect(sim.placeCost(0, 'gunner')).toBe(sim.catalog().find((u) => u.id === 'gunner')?.placeCost);
    expect(sim.apply(0, { type: 'place', unitId: 'striker', ...spot(1) }).ok).toBe(true); // 300, bleiben 150
    const bad = sim.apply(0, { type: 'place', unitId: 'striker', ...spot(2) }); // 400 > 150
    expect(bad.ok ? null : bad.reason).toBe('not-enough-coins');
  });
  it('Standarddaten: ohne Zuwachs (0) unverändert, Bot-Lauf deterministisch mit Aufschlag', () => {
    const d0 = data(0, 0);
    const sim = mk(d0);
    sim.apply(0, { type: 'place', unitId: 'striker', ...spot(0) });
    expect(sim.placeCost(0, 'striker')).toBe(200);
    const a = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 3, bots: ['wide'] });
    const b = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 3, bots: ['wide'] });
    expect(a.finalUnits).toEqual(b.finalUnits);
  });
});

describe('mono-X Bots', () => {
  it('getBot kennt mono-X und mono-X+up, platziert nur diese Unit', () => {
    expect(getBot('mono-frost')().name).toBe('mono-frost');
    expect(getBot('mono-frost+up')().name).toBe('mono-frost+up');
    const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, bots: ['mono-striker'] });
    expect(r.finalUnits.length).toBeGreaterThan(3);
    expect(new Set(r.finalUnits.map((u) => u.unit)).size).toBe(1);
    expect(r.finalUnits[0].unit).toBe('striker');
    expect(r.finalUnits.every((u) => u.level === 0)).toBe(true);
  });
});
