/**
 * Runde 7 / P6: sechs neue Units (Pool 8 -> 14) und ihre generischen, datengetriebenen Mechaniken:
 * Kettenangriff (`chain`), Markierung (`onHit.mark`), Fenster-Verlängerung (`windowExtend`), Kopfgeld-Aura (`bountyAura`),
 * Leak-Schild (`guard`), Tempo-Aura (`slowAura`).
 */
import { describe, expect, it } from 'vitest';
import type { GameData, StageData } from '../src/data/schema.js';
import type { EnemyState, World } from '../src/state.js';
import { windowExtendBp } from '../src/systems/boss.js';
import { bountyAuraBp, guardLeft, resolveDeaths } from '../src/systems/economy.js';
import { createEnemy } from '../src/systems/spawn.js';
import { at, ctxFor, createSim, mutable, richData, slotsOf, stage } from './helpers.js';

function mk(d: GameData = richData()) {
  const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 9, data: d });
  const ctx = ctxFor(1, 'normal');
  const st = mutable(sim);
  const put = (type: string, x: number, y: number, over: Partial<EnemyState> = {}, wave = 1): EnemyState => {
    const e = createEnemy(ctx, st.nextId++, type, wave, [], 0, 5000, 0);
    Object.assign(e, { x, y, stunTicks: 100000 }, over);
    st.enemies.push(e);
    return e;
  };
  const place = (unit: string, slot: number): number => {
    const r = sim.apply(0, { type: 'place', unitId: unit, ...at(sim, slot) });
    if (!r.ok) throw new Error(`${unit}: ${r.reason}`);
    return r.entityId as number;
  };
  const world = (): World => ({ state: st, ctx, events: [], unitMods: [] });
  return { sim, st, ctx, put, place, world };
}
const lost = (e: EnemyState): number => e.maxHp - e.hp;

describe('Pool Runde 7', () => {
  it('14 Units, Seltenheiten der sechs neuen: 1 Rare, 2 Epic, 2 Legendary, 1 Mythic', () => {
    const { sim } = mk();
    const cat = sim.catalog();
    expect(cat).toHaveLength(14);
    const news = ['warden', 'mortar', 'broker', 'stormcaller', 'seer', 'weaver'].map((id) => cat.find((u) => u.id === id)!);
    expect(news.every(Boolean)).toBe(true);
    const by = (r: string): number => news.filter((u) => u.rarity === r).length;
    expect([by('rare'), by('epic'), by('legendary'), by('mythic')]).toEqual([1, 2, 2, 1]);
  });

  it('Mortar: zweite Boden-Flächen-Unit mit anderem Profil als Blaster (Radius, Burn, Luft)', () => {
    const { sim } = mk();
    const m = sim.catalog().find((u) => u.id === 'mortar')!;
    const b = sim.catalog().find((u) => u.id === 'blaster')!;
    expect(m.placement).toBe('ground');
    expect(m.attack?.kind).toBe('circle');
    expect(m.attack?.radiusMilli).toBeGreaterThan(b.attack?.radiusMilli as number);
    expect(m.airDamageBp).toBeLessThan(b.airDamageBp as number);
    expect(m.onHit.some((o) => o.kind === 'slow')).toBe(false);
  });
});

describe('Kettenangriff (Stormcaller)', () => {
  it('trifft den ersten Gegner voll, dann bis zu 4 Sprünge mit je 80 %, nur innerhalb der Sprungweite', () => {
    const { sim, put, place } = mk();
    place('stormcaller', slotsOf(sim, 'hill')[0]);
    const c = sim.slotCenters().find((s) => s.id === slotsOf(sim, 'hill')[0])!;
    // Kette von 6 Gegnern in einer Reihe, 1,5 Tiles Abstand (< Sprungweite 1,8), erster im Zentrum der Reichweite
    const es = Array.from({ length: 6 }, (_, i) => put('brute', c.x + 1000 + i * 1500, c.y + 300, { hp: 10_000_000, maxHp: 10_000_000 }, 1));
    // der vorderste (höchster Fortschritt) soll Ziel sein: Fortschritt absteigend setzen
    es.forEach((e, i) => (e.progress = 9000 - i * 10));
    sim.step();
    const d = es.map(lost);
    expect(d[0]).toBeGreaterThan(0);
    for (let k = 1; k <= 4; k++) expect(d[k]).toBeGreaterThan(0);
    expect(d[5]).toBe(0); // fünfter Sprung gibt es nicht
    for (let k = 1; k <= 4; k++) expect(d[k]).toBeLessThan(d[k - 1]);
  });

  it('trifft Flieger (Hügel) und springt nicht über die Sprungweite', () => {
    const { sim, put, place } = mk();
    const hill = slotsOf(sim, 'hill')[0];
    place('stormcaller', hill);
    const c = sim.slotCenters().find((s) => s.id === hill)!;
    const a = put('flyer', c.x + 1000, c.y, { progress: 9000 });
    const far = put('flyer', c.x + 1000 + 2500, c.y, { progress: 8000 }); // 2,5 Tiles: außerhalb 1,8
    sim.step();
    expect(lost(a)).toBeGreaterThan(0);
    expect(lost(far)).toBe(0);
  });
});

describe('Markierung (Seer)', () => {
  it('markiert das Ziel; ein markierter Gegner nimmt mehr Schaden', () => {
    const { sim, put, place } = mk();
    const slot = slotsOf(sim, 'ground')[0];
    place('seer', slot);
    const c = sim.slotCenters().find((s) => s.id === slot)!;
    const e = put('brute', c.x + 800, c.y, { hp: 10_000_000, maxHp: 10_000_000 });
    sim.step();
    expect(e.markTicks).toBeGreaterThan(0);
    expect(e.markBp).toBe(2500);
    const first = lost(e);
    // zweiter Treffer nach der Abklingzeit: bereits markiert -> mehr Schaden als der erste
    sim.step(80);
    expect(lost(e) - first).toBeGreaterThan(first);
  });

  it('Markierung läuft ab', () => {
    const { sim, put, place } = mk();
    const slot = slotsOf(sim, 'ground')[0];
    place('seer', slot);
    const c = sim.slotCenters().find((s) => s.id === slot)!;
    const e = put('brute', c.x + 800, c.y, { hp: 10_000_000, maxHp: 10_000_000 });
    sim.step();
    Object.assign(e, { x: c.x + 99_000 }); // aus der Reichweite
    sim.step(130);
    expect(e.markTicks).toBe(0);
    expect(e.markBp).toBe(0);
  });
});

describe('Fenster-Verlängerung (Seer, K5)', () => {
  it('windowExtendBp: je Typ der höchste Wert nach Stufe, ohne Seer 0', () => {
    const { sim, place, world } = mk();
    expect(windowExtendBp(world())).toBe(0);
    place('seer', slotsOf(sim, 'ground')[0]);
    expect(windowExtendBp(world())).toBe(1000);
    place('seer', slotsOf(sim, 'ground')[1]);
    expect(windowExtendBp(world())).toBe(1000); // zweiter Seer stapelt nicht
    const id = mutable(sim).units[0].id;
    sim.apply(0, { type: 'upgrade', entityId: id });
    expect(windowExtendBp(world())).toBe(1500);
  });
});

describe('Kopfgeld-Aura (Broker)', () => {
  it('Bounty von Gegnern im Radius steigt, außerhalb nicht; Typ stapelt nicht', () => {
    const { sim, st, ctx, put, place, world } = mk();
    const slot = slotsOf(sim, 'ground')[0];
    place('broker', slot);
    const c = sim.slotCenters().find((s) => s.id === slot)!;
    expect(bountyAuraBp(world(), c.x + 1000, c.y)).toBe(2000);
    expect(bountyAuraBp(world(), c.x + 9000, c.y)).toBe(0);
    place('broker', slotsOf(sim, 'ground')[1]);
    expect(bountyAuraBp(world(), c.x, c.y)).toBeLessThanOrEqual(2000);
    // Tod im Radius: Auszahlung = Bounty x 1,2
    const e = put('grunt', c.x + 500, c.y);
    const base = e.bounty;
    e.hp = 0;
    e.dmgShare[0] = 1;
    const before = st.players[0].coins;
    resolveDeaths(world());
    void ctx;
    expect(st.players[0].coins - before).toBe(base + Math.floor((base * 2000) / 10000));
  });
});

describe('Leak-Schild (Warden)', () => {
  const longWave = (n: number): StageData => ({
    ...stage,
    waves: [{ n: 1, groups: [{ type: 'grunt', count: n, intervalTicks: 40, delayTicks: 0, modifiers: [], element: 0 }] }],
  });

  it('fängt je Wave so viele nicht-tödliche Leaks ab, wie die Stufe erlaubt; Rest kostet Leben', () => {
    const run = (withWarden: boolean) => {
      const sim = createSim({ stage: longWave(4), difficulty: 'normal', players: 1, seed: 1, data: richData() });
      if (withWarden) {
        const slot = slotsOf(sim, 'ground')[0];
        expect(sim.apply(0, { type: 'place', unitId: 'warden', ...at(sim, slot) }).ok).toBe(true);
      }
      let guard = 0;
      while (!sim.isOver() && guard++ < 4000) sim.step(10);
      return sim.state;
    };
    const none = run(false);
    const warded = run(true);
    expect(none.lives).toBe(30 - 4 * 2);
    expect(warded.lives).toBe(30 - 3 * 2); // Stufe 0: 1 Ladung
    expect(warded.stats.leaks).toBe(4);
  });

  it('guardLeft zählt die Ladungen nach Stufe und die in dieser Wave verbrauchten', () => {
    const { sim, st, place, world } = mk();
    expect(guardLeft(world())).toBe(0);
    const id = place('warden', slotsOf(sim, 'ground')[0]);
    expect(guardLeft(world())).toBe(1);
    st.guardUsed = 1;
    expect(guardLeft(world())).toBe(0);
    for (let i = 0; i < 2; i++) sim.apply(0, { type: 'upgrade', entityId: id });
    expect(guardLeft(world())).toBe(1); // Stufe 2: 2 Ladungen, eine verbraucht
  });

  it('Boss-Leak (Sofortverlust) wird nie abgefangen', () => {
    const { sim, st, place, put } = mk();
    place('warden', slotsOf(sim, 'ground')[0]);
    const boss = put('boss', 0, 0, { stunTicks: 0, progress: 10_000_000 }, 10);
    void boss;
    sim.step();
    expect(st.lives).toBe(0);
  });
});

describe('Tempo-Aura (Weaver)', () => {
  it('Gegner im Radius laufen langsamer, außerhalb nicht, Boss mit halber Wirkung', () => {
    const adv = (type: string, near: boolean): number => {
      const { sim, st, put, place } = mk();
      place('weaver', slotsOf(sim, 'hill')[0]);
      const w = st.units[0];
      const e = put(type, w.x + (near ? 500 : 60_000), w.y, { stunTicks: 0, progress: 3000 }, type === 'boss' ? 10 : 1);
      // Position auf dem Pfad nach dem Schritt ist egal: die Aura wird vor der Bewegung an der Position des Gegners geprüft
      sim.step();
      return e.progress - 3000;
    };
    const free = adv('grunt', false);
    const slowed = adv('grunt', true);
    expect(slowed).toBeLessThan(free);
    expect(slowed).toBe(Math.floor((free * (10000 - 2000)) / 10000) || slowed);
    const bossFree = adv('boss', false);
    const bossSlow = adv('boss', true);
    expect(bossSlow).toBeLessThan(bossFree);
    expect((free - slowed) / free).toBeGreaterThan((bossFree - bossSlow) / bossFree);
  });
});
