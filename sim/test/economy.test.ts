import { describe, expect, it } from 'vitest';
import { resolveDeaths, sellValue, splitBounty } from '../src/systems/economy.js';
import { createEnemy } from '../src/systems/spawn.js';
import type { SimState, UnitState } from '../src/state.js';
import { compile } from '../src/data/compile.js';
import { at, ctxFor, createSim, data, plainDataCoins, richData, slotsOf } from './helpers.js';

describe('Kosten und Level-Stats aus den Unit-Daten (AA-Maßstab)', () => {
  const sampleUnit = (id: string) => data.units.units.find((u) => u.id === id)!;
  it('Platzier- und Upgrade-Kosten = AA-Yen / yenPerCoin, Level-Stats in Festkomma (Rokuhira: Secret, 8 Upgrades)', () => {
    const ctx = ctxFor();
    const d = ctx.units['rokuhira'];
    const raw = sampleUnit('rokuhira').levels;
    const yen = data.economy.scale.yenPerCoin;
    expect(d.placeCost).toBe(Math.round((raw[0].cost as number) / yen));
    expect(d.upgradeCosts).toEqual(raw.slice(1).map((l) => Math.round((l.cost as number) / yen)));
    expect(d.maxLevel).toBe(8);
    // Stufe 0: 800 Schaden = 80 000 Centi, 8 s = 160 Ticks, 25 Studs = 25 / studsPerTile Kacheln
    expect(d.levels[0]).toMatchObject({ damageCenti: 80000, spaTicks: 160, rangeMilli: Math.round((25 * 1000) / data.economy.scale.studsPerTile) });
    expect(d.levels[8].damageCenti).toBe(900000);
    expect(d.levels[8].spaTicks).toBe(140);
  });
  it('Fehlende Werte erben den Vorwert (damage/spa/range/attack), Stufen mit anderem Angriff wechseln ihn', () => {
    const d = ctxFor().units['rokuhira'];
    expect(d.levels.map((l) => l.attack?.id)).toEqual(['rokuhira:one', 'rokuhira:one', 'rokuhira:one', 'rokuhira:two', 'rokuhira:two', 'rokuhira:two', 'rokuhira:three', 'rokuhira:three', 'rokuhira:three']);
  });
  it('yenPerCoin skaliert Kosten und Farm-Ertrag, studsPerTile Reichweite und Radius', () => {
    const d2 = structuredClone(data);
    d2.economy.scale = { ref: 'test', studsPerTile: 10, yenPerCoin: 10 };
    const c = compile(d2, d2.stages['standard20'], 'normal', 1);
    expect(c.units['rokuhira'].placeCost).toBe(200);
    expect(c.units['rokuhira'].levels[0].rangeMilli).toBe(2500);
    expect(c.units['speedwagon'].farm?.yieldByLevel[0]).toBe(20);
    const circle = c.units['stain'].levels[0].attack;
    expect(circle?.radiusMilli).toBe(800); // 8 Studs / 10
  });
  it('Sim: upgradeCost / placeCost folgen der Datei, Stufe 8 ist `max-level`', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: richData() });
    expect(sim.placeCost('goku_ssj3')).toBe(1300);
    const r = sim.apply(0, { type: 'place', unitId: 'goku_ssj3', ...at(sim, slotsOf(sim, 'hill')[0]) });
    if (!r.ok) throw new Error(r.reason);
    const id = r.entityId as number;
    const seen: number[] = [];
    for (let c = sim.upgradeCost(id); c !== null; c = sim.upgradeCost(id)) {
      seen.push(c);
      expect(sim.apply(0, { type: 'upgrade', entityId: id })).toEqual({ ok: true, entityId: id });
    }
    expect(seen).toEqual(sampleUnit('goku_ssj3').levels.slice(1).map((l) => l.cost));
    expect(sim.apply(0, { type: 'upgrade', entityId: id })).toEqual({ ok: false, reason: 'max-level' });
  });
});

describe('Verkauf (AA: 25 %)', () => {
  const fake = (defId: string, invested: number): UnitState => ({
    id: 1, defId, owner: 0, x: 0, y: 0, level: 0, invested, targeting: 'first', cd: 0,
    lvlBp: 10000, traitBp: 0, yieldBp: 10000, lust: 0, snatch: 0, snatchTicks: 0, sun: 0, motDmgBp: 0, motDmgTicks: 0, motRangeBp: 0, motRangeTicks: 0,
    damageDealt: 0, damageReported: 0,
  });
  const ctx = ctxFor();
  it('Kampf-Units und Farm 25 % (economy.sell), jeweils floor', () => {
    expect(sellValue(ctx.units['ichigo'], fake('ichigo', 1001))).toBe(250);
    expect(sellValue(ctx.units['ichigo'], fake('ichigo', 1000))).toBe(250);
    expect(sellValue(ctx.units['speedwagon'], fake('speedwagon', 1003))).toBe(250);
    expect(sellValue(ctx.units['speedwagon'], fake('speedwagon', 1004))).toBe(251);
  });
  it('`unsellable` (AA-Feld) lehnt den Verkauf ab', () => {
    const d = structuredClone(data);
    d.units.units.find((u) => u.id === 'ichigo')!.unsellable = true;
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: d });
    const id = (sim.apply(0, { type: 'place', unitId: 'ichigo', ...at(sim, slotsOf(sim, 'ground')[0]) }) as { entityId: number }).entityId;
    expect(sim.apply(0, { type: 'sell', entityId: id })).toEqual({ ok: false, reason: 'unsellable' });
  });
  it('Sim: Verkaufen erstattet und gibt die Position frei', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    const slot = slotsOf(sim, 'ground')[0];
    const id = (sim.apply(0, { type: 'place', unitId: 'ichigo', ...at(sim, slot) }) as { entityId: number }).entityId;
    const def = ctxFor().units['ichigo'];
    const afterPlace = data.economy.startCoins - def.placeCost;
    expect(sim.state.players[0].coins).toBe(afterPlace);
    sim.apply(0, { type: 'upgrade', entityId: id });
    const afterUp = afterPlace - def.upgradeCosts[0];
    expect(sim.state.players[0].coins).toBe(afterUp);
    expect(sim.apply(0, { type: 'sell', entityId: id })).toEqual({ ok: true, entityId: id });
    expect(sim.state.players[0].coins).toBe(afterUp + Math.floor(((def.placeCost + def.upgradeCosts[0]) * 2500) / 10000));
    expect(sim.canPlace(0, 'ichigo', at(sim, slot).x, at(sim, slot).y)).toBeNull();
    expect(sim.state.units).toHaveLength(0);
  });
});

describe('Farm und Team-Grenzen (§7)', () => {
  it('Ertrag je Stufe (AA-Feld `farm`) am Wave-Ende', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: richData(), godMode: true });
    const spots = sim.placementGrid('speedwagon');
    const f1 = (sim.apply(0, { type: 'place', unitId: 'speedwagon', ...spots[0] }) as { entityId: number }).entityId;
    const f2spot = spots.find((p) => sim.canPlace(0, 'speedwagon', p.x, p.y) === null)!;
    expect(sim.apply(0, { type: 'place', unitId: 'speedwagon', ...f2spot }).ok).toBe(true);
    const farmYield = data.units.units.find((u) => u.id === 'speedwagon')!.levels.map((l) => l.farm as number);
    const wb = data.economy.waveBonus;
    const yields: number[] = [];
    for (let lvl = 0; lvl <= 4; lvl++) {
      const c0 = sim.state.players[0].coins;
      sim.runWave();
      // Wave n endet: Bonus plus Ertrag der Farmen (Farm 1 auf Stufe lvl, Farm 2 auf Stufe 0)
      const n = lvl + 1;
      yields.push(sim.state.players[0].coins - c0 - (wb.base + wb.perWave * n) - farmYield[0]);
      sim.apply(0, { type: 'upgrade', entityId: f1 });
    }
    expect(yields).toEqual(farmYield);
    expect(sim.state.stats.coinsFarm).toBeGreaterThan(0);
  });
  it('Kein Limit je Unit-Typ (Runde 6): mehr als 5 Ichigo und mehr als 2 Goku, Zone und Überlappung bleiben Regeln', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: richData() });
    const ground = slotsOf(sim, 'ground');
    const hill = slotsOf(sim, 'hill');
    for (let i = 0; i < 7; i++) expect(sim.apply(0, { type: 'place', unitId: 'ichigo', ...at(sim, ground[i]) }).ok).toBe(true);
    for (let i = 0; i < 4; i++) expect(sim.apply(0, { type: 'place', unitId: 'goku_ssj3', ...at(sim, hill[i]) }).ok).toBe(true);
    expect(sim.apply(0, { type: 'place', unitId: 'krillin', ...at(sim, ground[8]) })).toEqual({ ok: false, reason: 'wrong-zone' });
    expect(sim.apply(0, { type: 'place', unitId: 'ichigo', ...at(sim, hill[0]) })).toEqual({ ok: false, reason: 'wrong-zone' });
    expect(sim.apply(0, { type: 'place', unitId: 'goku_ssj3', ...at(sim, hill[0]) })).toEqual({ ok: false, reason: 'overlap' });
  });
  it('zu wenig Geld wird abgelehnt', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: plainDataCoins(1500) });
    expect(sim.apply(0, { type: 'place', unitId: 'goku_ssj3', ...at(sim, slotsOf(sim, 'hill')[0]) }).ok).toBe(true); // 1300
    expect(sim.apply(0, { type: 'place', unitId: 'ichigo', ...at(sim, slotsOf(sim, 'ground')[0]) })).toEqual({ ok: false, reason: 'not-enough-coins' }); // 350 > 200
  });
});

describe('Bounty und Koop (§3, §16)', () => {
  it('Bounty = round(gamma(n) * HP): Wave 1 Grunt 25 HP -> 18 Münzen', () => {
    const ctx = ctxFor();
    expect(ctx.bounty(1, 2500)).toBe(18); // 17,5 -> 18
    expect(ctx.bounty(2, 2800)).toBe(Math.round(0.7 * (data.economy.bounty.gammaDecayBp / 10000) * 28)); // gamma-Decay kalibriert (kalibrierung.md #3)
    expect(ctx.bounty(20, 21530)).toBe(Math.round(0.7 * (data.economy.bounty.gammaDecayBp / 10000) ** 19 * 215.3));
  });
  it('Verteilung nach Schadensanteil, Rest an den größten Anteil', () => {
    expect(splitBounty(10, [0, 0])).toEqual([0, 0]);
    expect(splitBounty(10, [5, 5])).toEqual([5, 5]);
    expect(splitBounty(10, [3, 4, 3])).toEqual([3, 4, 3]);
    expect(splitBounty(7, [1, 1, 1])).toEqual([3, 2, 2]);
    expect(splitBounty(5, [0, 9])).toEqual([0, 5]);
  });
  it('Koop: Start je Spieler, Wave-Bonus voll an jeden, Skip nur mit Mehrheit, Spenden in 50ern', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 3, seed: 1, godMode: true });
    expect(sim.state.players.map((p) => p.coins)).toEqual([3000, 3000, 3000]);
    expect(sim.apply(0, { type: 'donate', to: 1, amount: 30 })).toEqual({ ok: false, reason: 'invalid-amount' });
    expect(sim.apply(0, { type: 'donate', to: 1, amount: 100 }).ok).toBe(true);
    expect(sim.state.players.map((p) => p.coins)).toEqual([2900, 3100, 3000]);
    sim.apply(0, { type: 'skipWave' });
    sim.step(2);
    expect(sim.state.phase).toBe('prep'); // 1 von 3
    sim.apply(1, { type: 'skipWave' });
    sim.step();
    expect(sim.state.wave).toBe(1); // 2 von 3 = Mehrheit
    sim.runWave();
    expect(sim.state.players.map((p) => p.coins)).toEqual([2900 + 650, 3100 + 650, 3000 + 650]);
  });
  it('Koop: Bounty geht nach Schadensanteil an die Spieler (Rest an den größten Anteil)', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 2, seed: 1 });
    const world = { state: sim.state as SimState, ctx: ctxFor(2), events: [], unitMods: [] };
    const e = createEnemy(world.ctx, 99, 'grunt', 1, [], 0);
    e.dmgShare = [300, 100];
    e.hp = 0;
    e.bounty = 18;
    world.state.enemies.push(e);
    resolveDeaths(world);
    expect(sim.state.players.map((p) => p.coins)).toEqual([3000 + 14, 3000 + 4]);
    expect(sim.state.stats.kills).toBe(1);
    expect(sim.state.enemies).toHaveLength(0);
  });
});
