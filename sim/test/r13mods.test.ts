/** Runde 13: neue Wissensbaum-Mods der Sim, Migration der Optionen, Determinismus mit den neuen Türmen. */
import { describe, expect, it } from 'vitest';
import './setup';
import { DATA, createGame, parseStrategy, runBot, type Command } from '../src/index';
import { buy, clearRound, newGame, place, run } from './helpers';

describe('Mods', () => {
  it('tempoBp je Turmtyp (Longshot +10 % → ~10 % mehr Schüsse, Ranger unberührt)', () => {
    const shots = (mods: object): number[] => {
      const g = newGame({ mods: { startCash: 100000, ...mods } });
      const l = place(g, 'longshot', 560, 40);
      const r = place(g, 'ranger', 60, 122);
      g.sandbox.spawn('leviathan', 40000);
      const ev = run(g, 2400);
      return [l, r].map((id) => ev.filter((e) => e.type === 'fire' && e.tower === id).length);
    };
    const base = shots({});
    const quick = shots({ tempoBp: { longshot: 1000 } });
    expect(quick[0]).toBeGreaterThan(base[0]);
    expect(quick[0] / base[0]).toBeLessThan(1.2);
    expect(quick[1]).toBe(base[1]);
  });

  it('freezeAddTicks: Absolute Zero 30 Ticks länger (Normal und Boss)', () => {
    const g = newGame({ mods: { startCash: 100000, freezeAddTicks: 30 } });
    const id = place(g, 'frostcaller', 60, 122);
    buy(g, id, [5, 0, 0]);
    g.step(2700);
    const e = g.sandbox.spawn('red', 100000);
    const boss = g.sandbox.spawn('leviathan', 90000);
    expect(g.apply({ type: 'ability', ability: 'absoluteZero' }).ok).toBe(true);
    const f = (i: number) => g.state.enemies.find((x) => x.id === i)!.frozenTicks;
    expect(f(e)).toBe(240 + 30);
    expect(f(boss)).toBe(90 + 30);
  });

  it('heroXpBp: Wren bekommt 15 % mehr XP am Rundenende', () => {
    const xp = (bp: number): number => {
      const g = newGame({ mods: { startCash: 100000, heroXpBp: bp } });
      place(g, 'wren', 200, 170);
      g.state.towers[0].heroXp = 0;
      clearRound(g);
      return g.state.towers[0].heroXp;
    };
    expect(xp(0)).toBe(80);
    expect(xp(1500)).toBe(92);
  });

  it('t2DiscountBp: Stufe-2-Upgrades der Primary-Türme −10 %, andere Türme und Stufe 3 unberührt', () => {
    const g = newGame({ mods: { startCash: 100000, t2DiscountBp: 1000 } });
    const r = place(g, 'ranger', 60, 122);
    buy(g, r, [1, 0, 0]);
    expect(g.upgradeInfo(r)[0].price).toBe(160); // 180 × 0,9 = 162 → 160
    const l = place(g, 'longshot', 560, 40);
    buy(g, l, [1, 0, 0]);
    expect(g.upgradeInfo(l)[0].price).toBe(1200);
    buy(g, r, [2, 0, 0].map((v, i) => (i === 0 ? v - 1 : 0)) as [number, number, number]);
    expect(g.upgradeInfo(r)[0].price).toBe(450); // Stufe 3 bleibt
  });

  it('powerUses 2 (Spare Pocket): zwei Einsätze je Art und Runde, der dritte scheitert', () => {
    const g = newGame({ mods: { startCash: 1000, powerUses: 2 }, powers: { goldDrop: 5 } });
    const cmd = (): ReturnType<typeof g.apply> => g.apply({ type: 'power', power: 'goldDrop' });
    expect(cmd().ok).toBe(true);
    expect(cmd().ok).toBe(true);
    expect(cmd()).toEqual({ ok: false, reason: 'used-this-round' });
    expect(g.state.powers.goldDrop).toBe(3);
    expect(g.state.powerUses.goldDrop).toBe(2);
    g.apply({ type: 'startRound' });
    expect(cmd().ok).toBe(true);
    expect(g.state.powerUses.goldDrop).toBe(1);
    expect(g.state.stats.powersUsed.goldDrop).toBe(3);
  });

  it('freePowers (Starter Kit): zusätzlich zum Inventar', () => {
    const g = newGame({ powers: { goldDrop: 2 }, mods: { startCash: 100, freePowers: { goldDrop: 1 } } });
    expect(g.state.powers.goldDrop).toBe(3);
    expect(newGame({ mods: { freePowers: { goldDrop: 1 } } }).state.powers.goldDrop).toBe(1);
  });
});

describe('Optionen: Migration', () => {
  it('towerXp und unlocks.maxTier ohne die neuen Typen: fehlende Konten 0, fehlende Stufen gesperrt', () => {
    const g = createGame({
      map: 'bare', difficulty: 'medium', seed: 1,
      towerXp: { ranger: 120, bombardier: 5, frostcaller: 0 },
      unlocks: { towers: ['ranger', 'longshot'], maxTier: { ranger: [2, 0, 0] } },
    });
    expect(g.state.towerXp).toEqual({ ranger: 120, bombardier: 5, frostcaller: 0, longshot: 0, market: 0 });
    expect(g.state.maxTier.ranger).toEqual([2, 0, 0]);
    expect(g.state.maxTier.longshot).toEqual([0, 0, 0]);
    expect(g.canPlace('market', 60000, 160000)).toEqual({ ok: false, reason: 'locked' });
    expect(g.canPlace('longshot', 60000, 160000)).toEqual({ ok: true });
  });

  it('unlockTier gilt auch für die neuen Typen (Kosten aus xp.json)', () => {
    const g = createGame({
      map: 'bare', difficulty: 'medium', seed: 1, mods: { startCash: 2000 },
      towerXp: { ranger: 0, bombardier: 0, frostcaller: 0, longshot: 100, market: 250 },
      unlocks: { towers: ['longshot', 'market'], maxTier: { longshot: [0, 0, 0], market: [0, 0, 0] } },
    });
    expect(g.apply({ type: 'unlockTier', tower: 'longshot', path: 1 })).toEqual({ ok: true });
    expect(g.state.towerXp.longshot).toBe(0);
    expect(g.apply({ type: 'unlockTier', tower: 'longshot', path: 1 })).toEqual({ ok: false, reason: 'no-xp' });
    expect(g.apply({ type: 'unlockTier', tower: 'market', path: 0 }).ok).toBe(true);
    expect(g.upgradeInfo(0)).toEqual([]);
    const m = g.apply({ type: 'place', tower: 'market', x: 60000, y: 200000 });
    expect(m.ok).toBe(true);
    const info = g.upgradeInfo((m as { id: number }).id);
    expect(info[0]).toMatchObject({ unlocked: 1, revealed: true, name: 'Busy Stalls', canBuy: true });
    expect(info[1]).toMatchObject({ unlocked: 0, revealed: true, name: 'Coin Purse', canBuy: false, reason: 'locked' });
  });
});

describe('Determinismus', () => {
  const script: [number, Command][] = [
    [0, { type: 'place', tower: 'longshot', x: 560000, y: 40000 }],
    [0, { type: 'place', tower: 'market', x: 60000, y: 200000 }],
    [0, { type: 'place', tower: 'ranger', x: 60000, y: 122000 }],
    [0, { type: 'startRound' }],
    [200, { type: 'upgrade', towerId: 1, path: 2 }],
    [300, { type: 'upgrade', towerId: 1, path: 2 }],
    [400, { type: 'upgrade', towerId: 1, path: 0 }],
    [500, { type: 'upgrade', towerId: 2, path: 1 }],
    [500, { type: 'upgrade', towerId: 2, path: 1 }],
    [900, { type: 'startRound' }],
    [2500, { type: 'withdraw', towerId: 2 }],
  ];
  const play = (seed: number): string => {
    const g = createGame({ map: 'bare', difficulty: 'medium', seed, mods: { startCash: 20000 } });
    for (let t = 0; t < 5000; t++) {
      for (const [at, c] of script) if (at === t) g.apply(c);
      g.step();
      g.drainEvents();
    }
    return g.hash();
  };
  it('gleicher Seed = gleicher Hash (Hash wirft bei Nicht-Ganzzahlen), anderer Seed (Splitterwinkel) = anderer', () => {
    expect(play(5)).toBe(play(5));
    expect(play(5)).not.toBe(play(6));
  });
  it('Bot mit Longshot und Market ist deterministisch', () => {
    const s = 'ranger 0-0-0 + longshot 0-0-0 + market 1-2-0 + longshot 1-1-0';
    const a = runBot(parseStrategy(s), { difficulty: 'easy', seed: 2 });
    const b = runBot(parseStrategy(s), { difficulty: 'easy', seed: 2 });
    expect(a.hash).toBe(b.hash);
  });
  it('Daten: 5 Türme je 3 Pfade × 5 Stufen, Preise steigen im Pfad', () => {
    for (const k of ['ranger', 'bombardier', 'frostcaller', 'longshot', 'market'] as const) {
      expect(DATA.towers[k].paths).toHaveLength(3);
      for (const p of DATA.towers[k].paths) {
        expect(p.tiers).toHaveLength(5);
        for (let i = 1; i < 5; i++) expect(p.tiers[i].price).toBeGreaterThan(p.tiers[i - 1].price);
      }
    }
  });
});
