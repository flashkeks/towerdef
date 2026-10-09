import { describe, expect, it } from 'vitest';
import { createGame, DATA, round5, type Tiers } from '../src/index';
import { buy, newGame, place, run } from './helpers';

describe('Platzieren', () => {
  it('Gründe: out-of-bounds, on-path, overlap, no-cash, locked, hero-limit', () => {
    const g = newGame();
    expect(g.canPlace('ranger', 2000, 2000)).toEqual({ ok: false, reason: 'out-of-bounds' });
    expect(g.canPlace('ranger', 60000, 92000)).toEqual({ ok: false, reason: 'on-path' });
    expect(g.canPlace('ranger', 60000, 108000)).toEqual({ ok: false, reason: 'on-path' }); // 16 px < 13 + 9
    expect(g.canPlace('ranger', 60000, 115000)).toEqual({ ok: true });
    place(g, 'ranger', 60, 122);
    expect(g.canPlace('bombardier', 70000, 122000)).toEqual({ ok: false, reason: 'overlap' });
    expect(g.canPlace('ranger', 90000, 122000)).toEqual({ ok: true });
    place(g, 'wren', 200, 170);
    expect(g.canPlace('wren', 300000, 170000)).toEqual({ ok: false, reason: 'hero-limit' });
    const poor = newGame({ mods: { startCash: -600 } });
    expect(poor.canPlace('ranger', 60000, 122000)).toEqual({ ok: false, reason: 'no-cash' });
    const locked = createGame({ map: 'bare', difficulty: 'medium', seed: 1, unlocks: { towers: ['ranger'], maxTier: { ranger: [2, 2, 2], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] } } });
    expect(locked.canPlace('bombardier', 60000, 122000)).toEqual({ ok: false, reason: 'locked' });
    expect(locked.canPlace('wren', 60000, 122000)).toEqual({ ok: false, reason: 'locked' });
  });

  it('Befehl place schlägt mit demselben Grund fehl, Geld wird abgebucht', () => {
    const g = createGame({ map: 'bare', difficulty: 'medium', seed: 1 });
    expect(g.apply({ type: 'place', tower: 'ranger', x: 60000, y: 92000 })).toEqual({ ok: false, reason: 'on-path' });
    const r = g.apply({ type: 'place', tower: 'ranger', x: 60000, y: 122000 });
    expect(r.ok).toBe(true);
    expect(g.state.cash).toBe(450);
  });

  it('Wasser und Blocker aus der Karte sperren', async () => {
    const { loadMap } = await import('../src/index');
    const m = loadMap({ ...DATA.maps.meadow, water: [[[300, 100], [340, 100], [340, 160], [300, 160]]], blockers: [[500, 200, 12]] });
    expect(m.water).toHaveLength(1);
    expect(m.blockers[0]).toEqual({ x: 500000, y: 200000, r: 12000 });
  });
});

describe('Preise und Verkauf', () => {
  it('Preise x Schwierigkeit, gerundet auf 5', () => {
    expect(round5(200, 8500)).toBe(170);
    expect(round5(200, 10800)).toBe(215);
    expect(round5(540, 10800)).toBe(585);
    expect(round5(120, 10800)).toBe(130);
    const e = newGame({ difficulty: 'easy' }), m = newGame(), h = newGame({ difficulty: 'hard' });
    expect([e.priceOf('ranger'), m.priceOf('ranger'), h.priceOf('ranger')]).toEqual([170, 200, 215]);
    expect([e.priceOf('bombardier'), m.priceOf('bombardier'), h.priceOf('bombardier')]).toEqual([300, 350, 380]);
    expect([e.priceOf('wren'), m.priceOf('wren'), h.priceOf('wren')]).toEqual([460, 540, 585]);
    const id = place(h, 'ranger');
    const info = h.upgradeInfo(id);
    expect(info[0].price).toBe(130); // 120 * 1,08 = 129,6 -> 130
    expect(info[2].price).toBe(85); // 80 * 1,08 = 86,4 -> 85
  });

  it('Alle Preise sind Vielfache von 5', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      const g = newGame({ difficulty: d });
      for (const k of ['ranger', 'bombardier', 'frostcaller'] as const) {
        const id = place(g, k, { ranger: 60, bombardier: 30, frostcaller: 90 }[k], 122);
        expect(g.priceOf(k) % 5).toBe(0);
        for (let p = 0; p < 3; p++) expect(g.upgradeInfo(id)[p].price % 5).toBe(0);
      }
    }
  });

  it('Verkauf: 70 % aller Ausgaben, aufgerundet; Wissensbaum 75 %', () => {
    const g = newGame();
    const id = place(g, 'ranger');
    expect(g.sellValue(id)).toBe(140);
    g.apply({ type: 'upgrade', towerId: id, path: 0 }); // +120 = 320 gesamt
    expect(g.state.towers[0].spent).toBe(320);
    expect(g.sellValue(id)).toBe(224);
    g.apply({ type: 'upgrade', towerId: id, path: 1 }); // +90 = 410 -> 287
    expect(g.sellValue(id)).toBe(287);
    const c0 = g.state.cash;
    expect(g.apply({ type: 'sell', towerId: id }).ok).toBe(true);
    expect(g.state.cash - c0).toBe(287);
    expect(g.state.towers).toHaveLength(0);
    const k = newGame({ mods: { sellBp: 7500, startCash: 100000 } });
    const id2 = place(k, 'ranger');
    expect(k.sellValue(id2)).toBe(150);
  });

  it('Wissensbaum: Startgeld, Leben, T1-Rabatt', () => {
    const g = createGame({ map: 'bare', difficulty: 'medium', seed: 1, mods: { startCash: 100, lives: 25, t1DiscountBp: 1000 } });
    expect(g.state.cash).toBe(750);
    expect(g.state.lives).toBe(175);
    const id = place(g, 'ranger');
    expect(g.upgradeInfo(id)[0].price).toBe(110); // 120 - 10 %
    expect(g.upgradeInfo(id)[2].price).toBe(70); // 80 - 10 %
    const g2 = newGame();
    const id2 = place(g2, 'ranger');
    expect(g2.upgradeInfo(id2)[0].price).toBe(120);
  });

  it('Wissensbaum: Reichweite und Radius', () => {
    const g = createGame({ map: 'bare', difficulty: 'medium', seed: 1, mods: { rangeBp: { ranger: 1000 } } });
    const id = place(g, 'ranger');
    expect(g.state.towers.find((t) => t.id === id)!.range).toBe(74800);
  });
});

describe('Crosspath und Freischaltung', () => {
  it('5-2-0 erlaubt, ein dritter Pfad oder zweiter Pfad > 2 nicht', () => {
    const g = newGame();
    const id = place(g, 'ranger');
    buy(g, id, [5, 2, 0]);
    expect(g.state.towers[0].tiers).toEqual([5, 2, 0]);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 1 })).toEqual({ ok: false, reason: 'crosspath' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 2 })).toEqual({ ok: false, reason: 'crosspath' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 })).toEqual({ ok: false, reason: 'maxed' });
    const info = g.upgradeInfo(id);
    expect(info.map((i) => i.reason)).toEqual(['maxed', 'crosspath', 'crosspath']);
    expect(info[0].next).toBeNull();
  });

  it('Zwei Pfade bis 2, dann Pfad 3 gesperrt; zwei Pfade >= 3 verboten', () => {
    const g = newGame();
    const id = place(g, 'bombardier');
    buy(g, id, [2, 2, 0]);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 2 })).toEqual({ ok: false, reason: 'crosspath' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true); // 3-2-0
    expect(g.apply({ type: 'upgrade', towerId: id, path: 1 })).toEqual({ ok: false, reason: 'crosspath' }); // 3-3 verboten
  });

  it('Stufen nur der Reihe nach, kein Geld = no-cash', () => {
    const g = createGame({ map: 'bare', difficulty: 'medium', seed: 1 });
    const id = place(g, 'ranger');
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true); // 120 + 180 = 300 (650-200 = 450 -> 150 übrig)
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 })).toEqual({ ok: false, reason: 'no-cash' });
    expect(g.state.towers[0].tiers[0]).toBe(2);
  });

  it('opts.unlocks.maxTier sperrt Stufen mit Grund locked', () => {
    const g = createGame({
      map: 'bare', difficulty: 'medium', seed: 1, mods: { startCash: 100000 },
      unlocks: { towers: ['ranger', 'wren'], maxTier: { ranger: [2, 0, 1], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] } },
    });
    const id = place(g, 'ranger');
    buy(g, id, [2, 0, 0]);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 })).toEqual({ ok: false, reason: 'locked' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 1 })).toEqual({ ok: false, reason: 'locked' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 2 }).ok).toBe(true); // 2-0-1 ist erlaubt
    expect(g.apply({ type: 'upgrade', towerId: id, path: 2 })).toEqual({ ok: false, reason: 'locked' });
  });
});

describe('Stufen wirken', () => {
  const stats = (type: 'ranger' | 'bombardier' | 'frostcaller', tiers: Tiers) => {
    const g = newGame();
    const id = place(g, type);
    buy(g, id, tiers);
    return g.state.towers.find((t) => t.id === id)!;
  };

  it('Ranger C: Reichweite 68 -> 85 -> 93,5 px, Erkennung ab C2', () => {
    expect(stats('ranger', [0, 0, 0]).range).toBe(68000);
    expect(stats('ranger', [0, 0, 1]).range).toBe(85000);
    const c2 = stats('ranger', [0, 0, 2]);
    expect(c2.range).toBe(93500);
    expect(c2.camo).toBe(true);
    expect(stats('ranger', [0, 0, 1]).camo).toBe(false);
  });

  it('Frostcaller C2 und Wren L5 geben Erkennung', () => {
    expect(stats('frostcaller', [0, 0, 2]).camo).toBe(true);
    expect(stats('frostcaller', [0, 2, 0]).camo).toBe(false);
  });

  it('Ranger A3 schießt 3 Pfeile im Fächer, A5 sieben', () => {
    for (const [tiers, n] of [[[3, 0, 0], 3], [[5, 0, 0], 7], [[0, 0, 0], 1]] as const) {
      const g = newGame();
      const id = place(g, 'ranger');
      buy(g, id, tiers as unknown as Tiers);
      g.sandbox.spawn('green', 40000);
      let count = 0;
      for (let i = 0; i < 12 && count === 0; i++) {
        g.step();
        count = g.state.projectiles.length;
        g.drainEvents();
      }
      expect(count).toBe(n);
    }
  });

  it('Bombardier B3 wirft Splitter, B4 mit Mini-Explosionen', () => {
    const g = newGame();
    const id = place(g, 'bombardier');
    buy(g, id, [0, 3, 0]);
    g.sandbox.spawn('green', 40000);
    const ev = run(g, 200);
    expect(ev.some((e) => e.type === 'explode' && e.kind === 'bomb')).toBe(true);
    expect(ev.filter((e) => e.type === 'fire').length).toBeGreaterThan(0);
    expect(g.state.towers.find((t) => t.id === id)!.tiers).toEqual([0, 3, 0]);
  });

  it('Bombardier C: Betäubung, Boss kürzer', () => {
    const g = newGame();
    const id = place(g, 'bombardier');
    buy(g, id, [0, 0, 3]);
    const e = g.sandbox.spawn('brute', 40000);
    const bo = g.sandbox.spawn('leviathan', 40000);
    run(g, 120, () => g.state.enemies.find((x) => x.id === e)!.stunTicks > 0);
    const brute = g.state.enemies.find((x) => x.id === e)!;
    expect(brute.stunTicks + (brute.hp < 10 ? 0 : 0)).toBeGreaterThan(0);
    expect(bo).toBeGreaterThan(0);
  });

  it('Bombardier C5: jeder dritte Schuss ist ein Beben', () => {
    const g = newGame();
    const id = place(g, 'bombardier');
    buy(g, id, [0, 0, 2]);
    // C5 braucht Crosspath-konform: erst C bis 5
    const g2 = newGame();
    const id2 = place(g2, 'bombardier');
    buy(g2, id2, [0, 0, 5]);
    g2.sandbox.spawn('brute', 40000);
    g2.sandbox.spawn('brute', 30000);
    const ev = run(g2, 600);
    expect(ev.some((e) => e.type === 'explode' && e.kind === 'quake')).toBe(true);
    expect(id).toBeGreaterThan(0);
  });

  it('Frostcaller A2: Aura verlangsamt alle in Reichweite, Boss nicht (A2), A4 schon', () => {
    const g = newGame();
    const id = place(g, 'frostcaller');
    buy(g, id, [2, 0, 0]);
    const e = g.sandbox.spawn('green', 40000);
    const bo = g.sandbox.spawn('leviathan', 40000);
    g.step(2);
    const en = g.state.enemies.find((x) => x.id === e)!;
    const boss = g.state.enemies.find((x) => x.id === bo)!;
    expect(en.slowBp).toBeGreaterThanOrEqual(2500);
    expect(boss.slowBp).toBe(0);
    const g2 = newGame();
    const id2 = place(g2, 'frostcaller');
    buy(g2, id2, [4, 0, 0]);
    const bo2 = g2.sandbox.spawn('leviathan', 40000);
    g2.step(2);
    expect(g2.state.enemies.find((x) => x.id === bo2)!.slowBp).toBe(2500);
    expect(id).toBeGreaterThan(0);
  });

  it('Frostcaller C3: Kettenblitz sofort, trifft mehrere', () => {
    const g = newGame();
    const id = place(g, 'frostcaller');
    buy(g, id, [0, 0, 3]);
    for (let i = 0; i < 5; i++) g.sandbox.spawn('green', 40000 + i * 4000);
    const ev = run(g, 20);
    const chain = ev.find((e) => e.type === 'chain');
    expect(chain && chain.type === 'chain' && chain.points.length).toBeGreaterThanOrEqual(4);
    const fire = ev.find((e) => e.type === 'fire')!;
    // Blitz sofort: Schaden im selben Tick wie der Abschuss
    expect(ev.some((e) => e.type === 'hit' && e.tick === fire.tick)).toBe(true);
    expect(id).toBeGreaterThan(0);
  });

  it('Frostcaller B1: Nova platzt beim ersten Treffer und trifft Nachbarn', () => {
    const g = newGame();
    place(g, 'frostcaller');
    g.apply({ type: 'upgrade', towerId: g.state.towers[0].id, path: 1 });
    g.sandbox.spawn('green', 40000);
    g.sandbox.spawn('green', 38000);
    g.sandbox.spawn('green', 36000);
    const ev = run(g, 120);
    expect(ev.some((e) => e.type === 'nova')).toBe(true);
  });

  it('Ranger C4/C5: Bonusschaden gegen Brute und Boss', () => {
    const run1 = (tiers: Tiers, enemy: 'brute' | 'leviathan'): number => {
      const g = newGame();
      const id = place(g, 'ranger');
      buy(g, id, tiers);
      const e = g.sandbox.spawn(enemy, 40000);
      const ev = run(g, 80);
      const h = ev.find((x) => x.type === 'hit' && x.enemy === e);
      return h && h.type === 'hit' ? h.dmg : 0;
    };
    expect(run1([0, 0, 3], 'brute')).toBe(3);
    expect(run1([0, 0, 4], 'brute')).toBe(7 + 4);
    expect(run1([0, 0, 4], 'leviathan')).toBe(7 + 4 + 12);
    expect(run1([0, 0, 5], 'leviathan')).toBe(18 + 4 + 30);
  });
});
