import { describe, expect, it } from 'vitest';
import { resolveDeaths, sellValue, splitBounty } from '../src/systems/economy.js';
import { createEnemy } from '../src/systems/spawn.js';
import type { SimState, UnitState } from '../src/state.js';
import { ctxFor, createSim, data, richData, slotsOf } from './helpers.js';

describe('Upgrade-Kosten (§6)', () => {
  const total = { rare: 2735, epic: 4780, legendary: 8945, mythic: 18050 } as const;
  for (const r of ['rare', 'epic', 'legendary', 'mythic'] as const) {
    it(`${r}: Tabelle = Formel round5(P*g^(k-1)), Gesamtkosten ${total[r]}`, () => {
      const t = data.units.rarities[r];
      const n = t.upgradeCosts.length;
      for (let k = 1; k <= n; k++) {
        const num = BigInt(t.placeCost) * BigInt(t.growthBp) ** BigInt(k - 1);
        const den = 10000n ** BigInt(k - 1);
        // ceil((num/den)/5 - 1/2) = Rundung auf 5, Halbwerte abwärts
        const q = (2n * num - 5n * den + 10n * den - 1n) / (10n * den);
        expect(t.upgradeCosts[k - 1]).toBe(Number(q) * 5);
      }
      expect(t.placeCost + t.upgradeCosts.reduce((a, b) => a + b, 0)).toBe(total[r]);
    });
  }
  it('Mythic: 1000 ... 4610', () => {
    const m = data.units.rarities.mythic.upgradeCosts;
    expect(m[0]).toBe(1000);
    expect(m[m.length - 1]).toBe(4610);
  });
  it('Voll-Ausbau 2 Mythic + 3 Legendary + 4 Epic = 164110 für 6 Slots (§6)', () => {
    const t = (r: 'epic' | 'legendary' | 'mythic', n: number) => n * (data.units.rarities[r].placeCost + data.units.rarities[r].upgradeCosts.reduce((a, b) => a + b, 0));
    expect(2 * 2 * 18050 + 2 * 3 * 8945 + 2 * 4 * 4780).toBe(164110);
    expect(2 * 18050 + 3 * 8945 + 4 * 4780).toBe(36100 + 26835 + 19120);
    expect(t('mythic', 2) + t('legendary', 3) + t('epic', 4)).toBe(36100 + 26835 + 19120);
  });
  it('Sim: upgradeCost / placeCost / Level-Stats', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: richData() });
    expect(sim.placeCost('titan')).toBe(1000);
    const r = sim.apply(0, { type: 'place', unitId: 'titan', slot: slotsOf(sim, 'hill')[0] });
    if (!r.ok) throw new Error(r.reason);
    const id = r.entityId as number;
    const seen: number[] = [];
    for (let c = sim.upgradeCost(id); c !== null; c = sim.upgradeCost(id)) {
      seen.push(c);
      expect(sim.apply(0, { type: 'upgrade', entityId: id })).toEqual({ ok: true, entityId: id });
    }
    expect(seen).toEqual([1000, 1290, 1665, 2145, 2770, 3570, 4610]);
    expect(sim.apply(0, { type: 'upgrade', entityId: id })).toEqual({ ok: false, reason: 'max-level' });
    const titan = sim.catalog().find((u) => u.id === 'titan');
    expect(titan?.levels[0]).toEqual({ damageCenti: 19000, spaTicks: 100, rangeMilli: 4500 });
    expect(titan?.levels[7].spaTicks).toBe(80);
    expect(titan?.levels[7].rangeMilli).toBe(6500);
  });
});

describe('Verkauf (§8)', () => {
  const fake = (defId: string, invested: number): UnitState => ({
    id: 1, defId, owner: 0, slot: 0, level: 0, invested, targeting: 'first', cd: 0, abilityCd: 0,
    lvlBp: 10000, traitBp: 0, yieldBp: 10000, damageDealt: 0, damageReported: 0,
  });
  const ctx = ctxFor();
  it('Kampf-Units 60 %, Farm 40 %, jeweils floor', () => {
    expect(sellValue(ctx.units['striker'], fake('striker', 1001))).toBe(600);
    expect(sellValue(ctx.units['striker'], fake('striker', 1000))).toBe(600);
    expect(sellValue(ctx.units['farm'], fake('farm', 1151))).toBe(460);
    expect(sellValue(ctx.units['farm'], fake('farm', 1150))).toBe(460);
    expect(sellValue(ctx.units['farm'], fake('farm', 1153))).toBe(461);
  });
  it('Sim: Verkaufen erstattet, gibt Slot und Cap frei', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    const slot = slotsOf(sim, 'ground')[0];
    const id = (sim.apply(0, { type: 'place', unitId: 'striker', slot }) as { entityId: number }).entityId;
    expect(sim.state.players[0].coins).toBe(700);
    sim.apply(0, { type: 'upgrade', entityId: id });
    expect(sim.state.players[0].coins).toBe(400);
    expect(sim.apply(0, { type: 'sell', entityId: id })).toEqual({ ok: true, entityId: id });
    expect(sim.state.players[0].coins).toBe(400 + 360);
    expect(sim.slots()[slot].free).toBe(true);
    expect(sim.state.units).toHaveLength(0);
  });
});

describe('Farm (§12) und Caps (§7)', () => {
  it('Ertrag 50/90/135/205/310 am Wave-Ende, Cap 2, 2x2-Slot', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: richData(), godMode: true });
    const big = slotsOf(sim, 'ground', 2);
    const small = slotsOf(sim, 'ground', 1)[0];
    expect(sim.apply(0, { type: 'place', unitId: 'farm', slot: small })).toEqual({ ok: false, reason: 'slot-size' });
    const f1 = (sim.apply(0, { type: 'place', unitId: 'farm', slot: big[0] }) as { entityId: number }).entityId;
    expect(sim.apply(0, { type: 'place', unitId: 'farm', slot: big[1] }).ok).toBe(true);
    expect(sim.apply(0, { type: 'place', unitId: 'farm', slot: big[2] })).toEqual({ ok: false, reason: 'cap-reached' });
    const yields: number[] = [];
    for (let lvl = 0; lvl <= 4; lvl++) {
      const c0 = sim.state.players[0].coins;
      sim.runWave();
      // Wave n endet: Bonus 100+5n plus Ertrag der Farmen (Farm 1 auf Stufe lvl, Farm 2 auf Stufe 0)
      const n = lvl + 1;
      yields.push(sim.state.players[0].coins - c0 - (100 + 5 * n) - 50);
      sim.apply(0, { type: 'upgrade', entityId: f1 });
    }
    expect(yields).toEqual([50, 90, 135, 205, 310]);
    expect(sim.state.stats.coinsFarm).toBeGreaterThan(0);
  });
  it('Caps je Typ und Spieler: Rare 5, Epic 4, Legendary 3, Mythic 2', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: richData() });
    const ground = slotsOf(sim, 'ground');
    const hill = slotsOf(sim, 'hill');
    for (let i = 0; i < 5; i++) expect(sim.apply(0, { type: 'place', unitId: 'striker', slot: ground[i] }).ok).toBe(true);
    expect(sim.apply(0, { type: 'place', unitId: 'striker', slot: ground[5] })).toEqual({ ok: false, reason: 'cap-reached' });
    expect(sim.apply(0, { type: 'place', unitId: 'titan', slot: hill[0] }).ok).toBe(true);
    expect(sim.apply(0, { type: 'place', unitId: 'titan', slot: hill[1] }).ok).toBe(true);
    expect(sim.apply(0, { type: 'place', unitId: 'titan', slot: hill[2] })).toEqual({ ok: false, reason: 'cap-reached' });
    expect(sim.apply(0, { type: 'place', unitId: 'gunner', slot: ground[6] })).toEqual({ ok: false, reason: 'slot-kind' });
    expect(sim.apply(0, { type: 'place', unitId: 'striker', slot: hill[0] })).toEqual({ ok: false, reason: 'slot-occupied' });
  });
  it('zu wenig Geld wird abgelehnt', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    expect(sim.apply(0, { type: 'place', unitId: 'titan', slot: slotsOf(sim, 'hill')[0] }).ok).toBe(true); // 1000 = Start
    expect(sim.apply(0, { type: 'place', unitId: 'striker', slot: slotsOf(sim, 'ground')[0] })).toEqual({ ok: false, reason: 'not-enough-coins' });
  });
});

describe('Bounty und Koop (§3, §16)', () => {
  it('Bounty = round(gamma(n) * HP): Wave 1 Grunt 25 HP -> 18 Münzen', () => {
    const ctx = ctxFor();
    expect(ctx.bounty(1, 2500)).toBe(18); // 17,5 -> 18
    expect(ctx.bounty(2, 2800)).toBe(18); // 0,644 * 28 = 18,03
    expect(ctx.bounty(20, 21530)).toBe(31);
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
    expect(sim.state.players.map((p) => p.coins)).toEqual([1000, 1000, 1000]);
    expect(sim.apply(0, { type: 'donate', to: 1, amount: 30 })).toEqual({ ok: false, reason: 'invalid-amount' });
    expect(sim.apply(0, { type: 'donate', to: 1, amount: 100 }).ok).toBe(true);
    expect(sim.state.players.map((p) => p.coins)).toEqual([900, 1100, 1000]);
    sim.apply(0, { type: 'skipWave' });
    sim.step(2);
    expect(sim.state.phase).toBe('prep'); // 1 von 3
    sim.apply(1, { type: 'skipWave' });
    sim.step();
    expect(sim.state.wave).toBe(1); // 2 von 3 = Mehrheit
    sim.runWave();
    expect(sim.state.players.map((p) => p.coins)).toEqual([900 + 105, 1100 + 105, 1000 + 105]);
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
    expect(sim.state.players.map((p) => p.coins)).toEqual([1000 + 14, 1000 + 4]);
    expect(sim.state.stats.kills).toBe(1);
    expect(sim.state.enemies).toHaveLength(0);
  });
});
