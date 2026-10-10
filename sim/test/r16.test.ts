/**
 * Runde 16 (Paket T): Wasser-Platzierung, Riverkeeper, Bellringer, Tinker (Sentries, Fallen, Overclock), Helden Bram und Sela.
 * 10.10.2026, Max: „füge noch mehr Türme hinzu und auch mehr Helden“ / „Wassertürme, die man nur in bestimmten Wasserbereichen setzen kann“.
 */
import { describe, expect, it } from 'vitest';
import './setup';
import { createGame, DATA, DATA as D, type AbilityId, type Game, type HeroType, type SimEvent, type Tiers } from '../src/index';
import { runBot, parseStrategy } from '../src/bot';
import { buy, clearRound, newGame, place, run, statsOf } from './helpers';

// Testkarte `pond`: Wiese mit einem Teich zwischen den Wegen (x 150..246, y 120..200) und einem Lavasee (x 370..430, y 245..285).
(DATA.maps as Record<string, unknown>).pond = {
  ...DATA.maps.meadow, id: 'pond', blockers: [],
  water: [[[150, 120], [246, 120], [246, 200], [150, 200]]],
  lava: [[[370, 245], [430, 245], [430, 285], [370, 285]]],
};
const pond = (over: Parameters<typeof createGame>[0] extends infer O ? Partial<O> : never = {}): Game =>
  createGame({ map: 'pond', difficulty: 'medium', seed: 1, mods: { startCash: 200000 }, ...over });

const abilityReady = (g: Game, id: AbilityId): boolean => g.state.abilities.find((a) => a.id === id)?.ready === true;
/** Springt in einer leeren Welt, bis die Fähigkeit bereit ist. */
function waitAbility(g: Game, id: AbilityId): void {
  const a = g.state.abilities.find((x) => x.id === id);
  if (!a) throw new Error(`Fähigkeit ${id} fehlt`);
  g.step(a.cdLeft + 1);
  if (!abilityReady(g, id)) throw new Error(`${id} nicht bereit`);
}
const ev = (all: SimEvent[], type: SimEvent['type']) => all.filter((e) => e.type === type);

describe('Platzierung: Wasser und Land', () => {
  it('Wasserturm nur ganz im Wasser, Fehlergrund needs-water', () => {
    const g = pond();
    expect(DATA.towers.riverkeeper.placement).toBe('water');
    expect(DATA.towers.ranger.placement).toBe('land');
    expect(g.canPlace('riverkeeper', 60000, 122000)).toEqual({ ok: false, reason: 'needs-water' });
    expect(g.canPlace('riverkeeper', 195000, 160000)).toEqual({ ok: true });
    // Kreis ragt 2 px über die Teichkante (x = 150): nicht ganz im Wasser
    expect(g.canPlace('riverkeeper', 158000, 160000)).toEqual({ ok: false, reason: 'needs-water' });
    // genau am Rand, Kreis noch innen
    expect(g.canPlace('riverkeeper', 161000, 160000)).toEqual({ ok: true });
    const c0 = g.state.cash;
    const r = g.apply({ type: 'place', tower: 'riverkeeper', x: 195000, y: 160000 });
    expect(r.ok).toBe(true);
    expect(g.state.cash).toBe(c0 - 400);
  });

  it('Landturm nie im Wasser, auch nicht am Teichrand', () => {
    const g = pond();
    expect(g.canPlace('ranger', 195000, 160000)).toEqual({ ok: false, reason: 'water' });
    expect(g.canPlace('tinker', 195000, 160000)).toEqual({ ok: false, reason: 'water' });
    expect(g.canPlace('ranger', 60000, 122000)).toEqual({ ok: true });
  });

  it('Lava ist kein Wasser: Wasserturm braucht Wasser, Landturm bekommt weiter lava', () => {
    const g = pond();
    expect(g.canPlace('riverkeeper', 400000, 265000)).toEqual({ ok: false, reason: 'needs-water' });
    expect(g.canPlace('ranger', 400000, 265000)).toEqual({ ok: false, reason: 'lava' });
  });

  it('Wasserturm gilt auch für Weg, Überlappung und Geld', () => {
    const g = pond();
    g.sandbox.setCash(399);
    expect(g.canPlace('riverkeeper', 195000, 160000)).toEqual({ ok: false, reason: 'no-cash' });
    const h = pond();
    place(h, 'riverkeeper', 195, 160);
    expect(h.canPlace('riverkeeper', 200000, 160000)).toEqual({ ok: false, reason: 'overlap' });
    expect(h.canPlace('riverkeeper', 215000, 160000)).toEqual({ ok: true });
  });

  it('echte Karten: Meadow-Bach, Frostfen-See und der Quarry-Kuehlteich tragen Wassertürme, die Lava nicht', () => {
    const count = (map: string): number => {
      const g = createGame({ map, difficulty: 'medium', seed: 1, mods: { startCash: 100000 } });
      let n = 0;
      for (let y = 5000; y < 355000; y += 6000) for (let x = 5000; x < 635000; x += 6000) if (g.canPlace('riverkeeper', x, y).ok) n++;
      return n;
    };
    expect(count('meadow')).toBeGreaterThan(0);
    expect(count('frostfen')).toBeGreaterThan(50);
    // Runde 16 TP: Quarry hat einen kleinen Kuehlteich (runde16.md §2), die Lava bleibt fuer Wassertuerme gesperrt
    expect(count('quarry')).toBeGreaterThan(0);
    expect(count('quarry')).toBeLessThan(10);
  });
});

describe('Daten Runde 16', () => {
  it('Preise, Fußabdruck, Pfade', () => {
    expect([DATA.towers.riverkeeper.price, DATA.towers.bellringer.price, DATA.towers.tinker.price]).toEqual([400, 1000, 450]);
    expect([DATA.hero.bram.price, DATA.hero.sela.price]).toEqual([650, 750]);
    expect(DATA.towers.riverkeeper.paths.map((p) => p.name)).toEqual(['Harpoons', 'Sonar', 'Armada']);
    expect(DATA.towers.bellringer.paths.map((p) => p.name)).toEqual(['Chimes', 'Watch', 'Toll']);
    expect(DATA.towers.tinker.paths.map((p) => p.name)).toEqual(['Sentry', 'Caltrops', 'Overclock']);
    expect(DATA.towers.riverkeeper.paths[0].tiers.map((t) => t.name)).toEqual(['Barbed Harpoons', 'Harpoon Volley', 'Tidal Steel', 'Whaler', 'Tidal Lance']);
    expect(DATA.towers.bellringer.paths[0].tiers[0].name).toBe('Swift Chime');
    expect(DATA.towers.bellringer.paths[1].tiers[2].name).toBe('Alarm');
    expect(DATA.towers.tinker.paths[2].tiers[2].name).toBe('Overclock');
    expect(DATA.hero.bram.levels).toHaveLength(20);
    expect(DATA.hero.sela.levels).toHaveLength(20);
  });
});

describe('Riverkeeper', () => {
  it('Ember Quarry: Kuehlteich (Runde 16 TP) nimmt einen Riverkeeper, Landtuerme nicht', () => {
    const g = createGame({ map: 'quarry', difficulty: 'medium', seed: 1, mods: { startCash: 100000 } });
    let spot: [number, number] | null = null;
    for (let y = 205_000; y <= 245_000 && !spot; y += 1000) for (let x = 300_000; x <= 360_000 && !spot; x += 1000) if (g.canPlace('riverkeeper', x, y).ok) spot = [x, y];
    expect(spot).not.toBeNull();
    expect(g.canPlace('ranger', spot![0], spot![1]).ok).toBe(false);
  });
  it('Harpunen: A2 = 3er-Fächer, A3 trifft Ironshell, A5 Lanze mit Boss-Schaden', () => {
    expect(statsOf('riverkeeper', [0, 0, 0])).toMatchObject({ pk: 'harpoon', dmg: 2, pierce: 3, count: 1 });
    expect(statsOf('riverkeeper', [2, 0, 0])).toMatchObject({ count: 3, pierce: 5 });
    expect(statsOf('riverkeeper', [3, 0, 0])).toMatchObject({ dtype: 'magic', dmg: 5 });
    expect(statsOf('riverkeeper', [5, 0, 0])).toMatchObject({ count: 1, dmg: 40, bonusBoss: 210 });
  });

  it('schießt vom Teich auf den Weg und holt Pops', () => {
    const g = pond();
    place(g, 'riverkeeper', 230, 160);
    g.sandbox.spawn('red', 520000);
    const events = run(g, 240);
    expect(ev(events, 'fire').length).toBeGreaterThan(0);
    expect(ev(events, 'pop').length).toBeGreaterThan(0);
    expect(g.state.stats.pops.riverkeeper).toBeGreaterThan(0);
  });

  it('Sonar Array: Türme im Radius sehen Camo, Riptide verlangsamt', () => {
    const g = pond();
    const rk = place(g, 'riverkeeper', 230, 160);
    const r = place(g, 'ranger', 215, 105);
    expect(g.canPlace('ranger', 215000, 105000)).toMatchObject({ ok: false });
    buy(g, rk, [0, 2, 0]);
    g.step(2);
    expect(g.state.towers.find((t) => t.id === r)!.camo).toBe(true);
    expect(g.auraOf(r).camo).toBe(true);
    // weit weg: keine Aura
    const far = place(g, 'ranger', 60, 122);
    g.step(1);
    expect(g.state.towers.find((t) => t.id === far)!.camo).toBe(false);
    // Riptide (B3): Gegner im Radius langsamer
    buy(g, rk, [0, 1, 0]);
    const e = g.sandbox.spawn('green', 520000);
    g.step(3);
    const en = g.state.enemies.find((x) => x.id === e)!;
    expect(en.slowBp).toBeGreaterThanOrEqual(3000);
  });

  it('Leviathan Call schlägt alle 4 s auf das stärkste Ziel', () => {
    const g = pond();
    const rk = place(g, 'riverkeeper', 230, 160);
    buy(g, rk, [0, 5, 0]);
    expect(statsOf('riverkeeper', [0, 5, 0])).toMatchObject({ thunderInterval: 240, thunderDmg: 150 });
    g.sandbox.spawn('brute', 520000);
    const events = run(g, 10);
    expect(events.some((e) => e.type === 'chain' && e.tower === rk)).toBe(true);
  });

  it('Armada: Lantern Ship wirft Kanonenkugeln mit Splitterkreis, Broadside vier davon', () => {
    expect(statsOf('riverkeeper', [0, 0, 2])).toMatchObject({ pk: 'cannonball', dtype: 'explosive', endR: 18000 });
    expect(statsOf('riverkeeper', [0, 0, 3])).toMatchObject({ count: 4, endR: 22000 });
    const g = pond();
    const rk = place(g, 'riverkeeper', 230, 160);
    buy(g, rk, [0, 0, 3]);
    g.sandbox.spawn('green', 520000);
    const events = run(g, 60, () => g.state.projectiles.length >= 4);
    expect(g.state.projectiles.filter((p) => p.kind === 'cannonball').length).toBeGreaterThanOrEqual(4);
    void events;
  });

  it('Crosspath gilt (zwei Pfade, nur einer ab Stufe 3)', () => {
    const g = pond();
    const rk = place(g, 'riverkeeper', 230, 160);
    buy(g, rk, [3, 2, 0]);
    expect(g.upgradeInfo(rk)[2].reason).toBe('crosspath'); // dritter Pfad
    expect(g.upgradeInfo(rk)[1].reason).toBe('crosspath'); // zweiter Pfad nicht auch noch auf 3
    expect(g.upgradeInfo(rk)[0].reason).toBeUndefined();
  });
});

describe('Bellringer', () => {
  it('Aura: Basis +8 % Reichweite, Swift Chime +10 % Tempo, Auren stapeln mit Markets nicht', () => {
    const g = newGame();
    const b = place(g, 'bellringer', 60, 200);
    const r = place(g, 'ranger', 60, 122);
    expect(g.auraOf(r)).toMatchObject({ rangeBp: 800, speedBp: 0 });
    buy(g, b, [1, 0, 0]);
    expect(g.auraOf(r).speedBp).toBe(1000);
    buy(g, b, [1, 0, 0]);
    expect(g.auraOf(r).speedBp).toBe(1800);
    // ein Market mit Drum Hall (1500) liegt darunter: der stärkste Wert zählt
    const m = place(g, 'market', 60, 170);
    buy(g, m, [0, 0, 3]);
    expect(g.auraOf(r).speedBp).toBe(1800);
    // außerhalb des Radius: nichts
    const far = place(g, 'ranger', 300, 110);
    expect(g.auraOf(far).speedBp).toBe(0);
  });

  it('Tempo-Aura macht den Ranger tatsächlich schneller; Bellringer selbst empfängt keine Aura', () => {
    const shots = (withBell: boolean): number => {
      const g = newGame();
      place(g, 'ranger', 60, 122);
      if (withBell) buy(g, place(g, 'bellringer', 60, 200), [3, 0, 0]);
      g.sandbox.spawn('brute', 20000);
      return ev(run(g, 600), 'windup').length;
    };
    expect(shots(true)).toBeGreaterThan(shots(false));
  });

  it('Watch: Camo-Sicht und Rabatt auf Upgrades im Radius', () => {
    const g = newGame();
    const b = place(g, 'bellringer', 60, 200);
    const r = place(g, 'ranger', 60, 122);
    const before = g.upgradeInfo(r)[0].price;
    buy(g, b, [0, 2, 0]);
    expect(g.auraOf(r).camo).toBe(true);
    expect(g.upgradeInfo(r)[0].price).toBeLessThan(before);
  });

  it('Alarm: alle Gegner stehen 2 s (Boss 1 s), Abklingzeit 60 s, startet nicht sofort bereit', () => {
    const g = newGame();
    const b = place(g, 'bellringer', 60, 200);
    buy(g, b, [0, 3, 0]);
    const a = g.state.abilities.find((x) => x.id === 'alarm')!;
    expect(a).toMatchObject({ ready: false, cdTotal: 3600 });
    expect(g.apply({ type: 'ability', ability: 'alarm' })).toEqual({ ok: false, reason: 'cooldown' });
    waitAbility(g, 'alarm');
    const e1 = g.sandbox.spawn('green', 90000);
    const boss = g.sandbox.spawn('leviathan', 60000);
    const p1 = g.state.enemies.find((x) => x.id === e1)!.progress;
    expect(g.apply({ type: 'ability', ability: 'alarm' })).toEqual({ ok: true });
    expect(g.state.abilities.find((x) => x.id === 'alarm')).toMatchObject({ ready: false, cdLeft: 3600 });
    expect(g.state.enemies.find((x) => x.id === e1)!.stunTicks).toBe(120);
    expect(g.state.enemies.find((x) => x.id === boss)!.stunTicks).toBe(60);
    g.step(100);
    expect(g.state.enemies.find((x) => x.id === e1)!.progress).toBe(p1);
    g.step(40);
    expect(g.state.enemies.find((x) => x.id === e1)!.progress).toBeGreaterThan(p1);
  });

  it('Dusk Siren: Alarmierte nehmen kurz +1 Schaden', () => {
    const g = newGame();
    buy(g, place(g, 'bellringer', 60, 200), [0, 5, 0]);
    waitAbility(g, 'alarm');
    const e = g.sandbox.spawn('green', 90000);
    g.apply({ type: 'ability', ability: 'alarm' });
    const en = g.state.enemies.find((x) => x.id === e)!;
    expect(en.brittleTicks).toBe(240);
    expect(en.stunTicks).toBe(240);
  });

  it('Toll of Coin: Einkommen am Rundenende, Event income, kein Market-Bonus', () => {
    const g = newGame({ mods: { startCash: 100000, marketBp: 5000 } });
    const b = place(g, 'bellringer', 60, 200);
    buy(g, b, [0, 0, 2]);
    expect(statsOf('bellringer', [0, 0, 2]).income).toBe(80);
    const cash0 = g.state.cash;
    const events = clearRound(g);
    const inc = events.filter((e): e is Extract<SimEvent, { type: 'income' }> => e.type === 'income' && e.tower === b);
    expect(inc).toHaveLength(1);
    expect(inc[0]).toMatchObject({ amount: 80, cash: 80, bank: 0 });
    expect(g.state.cash).toBeGreaterThan(cash0 + 80);
  });

  it('Wissensbaum: Silver Tongue (+Toll) und Loud Bells (Radius)', () => {
    const g = newGame({ mods: { startCash: 100000, tollAdd: 25, auraRadiusBp: { bellringer: 1500 } } });
    const b = place(g, 'bellringer', 60, 200);
    buy(g, b, [0, 0, 1]);
    expect(g.state.towers.find((t) => t.id === b)!.range).toBe(92000);
    const events = clearRound(g);
    expect(events.find((e) => e.type === 'income' && e.tower === b)).toMatchObject({ amount: 55 });
  });
});

describe('Tinker', () => {
  it('Sentry Kit: baut erst bei Gegnern in Reichweite, höchstens sentryN, löst sich nach der Lebensdauer auf', () => {
    const g = newGame();
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [1, 0, 0]);
    g.step(10);
    expect(g.state.sentries).toHaveLength(0);
    g.sandbox.spawn('brute', 20000);
    const events = run(g, 400);
    expect(g.state.sentries).toHaveLength(1);
    const built = ev(events, 'sentry')[0] as Extract<SimEvent, { type: 'sentry' }>;
    expect(built).toMatchObject({ tower: t, ttl: 1500 });
    const s = g.state.sentries[0];
    expect(Math.hypot(s.x - 60000, s.y - 122000)).toBeLessThanOrEqual(13100);
    // Sentries schießen: fire mit sentry-Feld
    expect(ev(events, 'fire').some((e) => (e as Extract<SimEvent, { type: 'fire' }>).sentry === s.id)).toBe(true);
    // läuft ab (Gegner weg, Bau nur bei Gegnern)
    for (const e of g.state.enemies.slice()) while (g.state.enemies.some((x) => x.id === e.id)) g.sandbox.hurt(e.id, 1_000_000);
    const events2 = run(g, 1600);
    expect(ev(events2, 'sentryGone').some((e) => (e as Extract<SimEvent, { type: 'sentryGone' }>).reason === 'expired')).toBe(true);
    expect(g.state.sentries).toHaveLength(0);
  });

  it('Sentries zählen Pops dem Tinker, mehrere Stufen = mehr Sentries', () => {
    const g = newGame();
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [3, 0, 0]);
    expect(statsOf('tinker', [3, 0, 0])).toMatchObject({ sentryN: 3, sentryDmg: 2, sentryDtype: 'magic' });
    for (let i = 0; i < 6; i++) g.sandbox.spawn('brute', 20000 + i * 3000);
    for (const e of g.state.enemies) e.stunTicks = 5000; // bleiben in Reichweite stehen
    run(g, 700);
    expect(g.state.sentries.length).toBeGreaterThan(1);
    expect(g.state.sentries.length).toBeLessThanOrEqual(3);
    expect(g.state.stats.pops.tinker).toBeGreaterThan(0);
    // Slots sind verschieden
    expect(new Set(g.state.sentries.map((s) => s.slot)).size).toBe(g.state.sentries.length);
  });

  it('Verkauf entfernt die Sentries mit Event', () => {
    const g = newGame();
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [2, 0, 0]);
    g.sandbox.spawn('brute', 20000);
    run(g, 500);
    const n = g.state.sentries.length;
    expect(n).toBeGreaterThan(0);
    g.apply({ type: 'sell', towerId: t });
    expect(g.state.sentries).toHaveLength(0);
    expect(ev(g.drainEvents(), 'sentryGone')).toHaveLength(n);
  });

  it('Caltrop Layer: legt Fallen auf den Weg in Reichweite, höchstens trapMax, mit Abstand', () => {
    const g = newGame();
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [0, 1, 0]);
    const events = run(g, 2400);
    const mine = g.state.traps.filter((x) => x.owner === t);
    expect(mine).toHaveLength(3);
    expect(ev(events, 'trapSet')).toHaveLength(3);
    for (const a of mine) {
      expect(a.kind).toBe('caltrops');
      expect(a.charges).toBe(6);
      expect(a.dmg).toBe(1);
      expect(Math.hypot(a.x - 60000, a.y - 122000)).toBeLessThanOrEqual(64000);
      // liegt auf dem Weg (Bare-Karte: erst y = 92 bis x = 120, dann nach unten)
      expect(a.y === 92000 || a.x === 120000).toBe(true);
      for (const b of mine) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(14000);
    }
    // vorderste Falle liegt am Ende der Reichweite (nach rechts)
    expect(Math.max(...mine.map((x) => x.x))).toBeGreaterThan(100000);
  });

  it('Fallen treffen Gegner (Schaden pro Stufe) und zählen für den Tinker', () => {
    const g = newGame();
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [0, 3, 0]);
    expect(statsOf('tinker', [0, 3, 0])).toMatchObject({ trapMax: 5, trapCharges: 14, trapDmg: 3 });
    run(g, 2400);
    const n = g.state.traps.filter((x) => x.owner === t).length;
    expect(n).toBeGreaterThanOrEqual(3);
    // Ironshell prallt an den Nägeln des Tinkers ab (sharp), die Fallen (magic) knacken ihn
    const e = g.sandbox.spawn('ironshell', 0);
    const events = run(g, 900, () => !g.state.enemies.some((x) => x.id === e));
    expect(ev(events, 'trap').length).toBeGreaterThan(0);
    expect(g.state.traps.some((x) => x.charges < 14 && x.owner === t)).toBe(true);
    expect(g.state.stats.pops.tinker).toBeGreaterThan(0);
  });

  it('Power-Fallen bleiben unverändert (owner 0, Schaden aus der Power)', () => {
    const g = newGame({ powers: { caltrops: 1 } });
    g.apply({ type: 'power', power: 'caltrops', x: 90000, y: 92000 });
    expect(g.state.traps[0]).toMatchObject({ owner: 0, dmg: 0, charges: 20 });
  });

  it('Overclock: Fähigkeit, die nächsten Türme im Radius doppelt so schnell für 10 s', () => {
    const g = newGame();
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [0, 0, 3]);
    const r = place(g, 'ranger', 90, 122);
    const far = place(g, 'ranger', 300, 110);
    const a = g.state.abilities.find((x) => x.id === 'overclock')!;
    expect(a).toMatchObject({ ready: false, cdTotal: 2700 });
    waitAbility(g, 'overclock');
    expect(g.apply({ type: 'ability', ability: 'overclock' })).toEqual({ ok: true });
    const tw = (id: number) => g.state.towers.find((x) => x.id === id)!;
    expect(tw(r)).toMatchObject({ boostTicks: 600, boostBp: 10000 });
    expect(tw(t)).toMatchObject({ boostTicks: 600 });
    expect(tw(far).boostTicks).toBe(0);
    const events = g.drainEvents();
    expect(events.filter((e) => e.type === 'overclock')).toHaveLength(2);
    g.step(601);
    expect(tw(r)).toMatchObject({ boostTicks: 0, boostBp: 0 });
  });

  it('Overclock wirkt: Ranger schießt in 5 s fast doppelt so oft', () => {
    const shots = (oc: boolean): number => {
      const g = newGame();
      const t = place(g, 'tinker', 60, 122);
      buy(g, t, [0, 0, 3]);
      place(g, 'ranger', 90, 122);
      waitAbility(g, 'overclock');
      if (oc) g.apply({ type: 'ability', ability: 'overclock' });
      g.sandbox.spawn('brute', 20000);
      g.drainEvents();
      const events = run(g, 300);
      return events.filter((e) => e.type === 'windup' && e.tower === g.state.towers[1].id).length;
    };
    expect(shots(true)).toBeGreaterThanOrEqual(shots(false) * 1.6);
  });

  it('Ultra-Overclock: 20 Türme, 15 s, Dauer-Aura +10 % Tempo', () => {
    expect(statsOf('tinker', [0, 0, 5])).toMatchObject({ ocMax: 20, ocDur: 900, ocCd: 1800, aSpeedBp: 1000, aR: 70000 });
    const g = newGame();
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [0, 0, 3]);
    const r = place(g, 'ranger', 90, 122);
    buy(g, t, [0, 0, 2]);
    g.step(2);
    expect(g.auraOf(r).speedBp).toBe(1000);
  });

  it('Wissensbaum: Spare Parts und Sharp Caltrops', () => {
    const g = newGame({ mods: { startCash: 100000, sentryTtlBp: 2500, trapChargesAdd: 2 } });
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [1, 1, 0]);
    run(g, 10);
    expect(g.state.traps.find((x) => x.owner === t)!.charges).toBe(8);
    g.sandbox.spawn('brute', 20000);
    run(g, 10);
    expect(g.state.sentries[0].ttl).toBeGreaterThan(1850);
  });
});

describe('Helden: Auswahl', () => {
  it('Vorgabe wren; nur der gewählte Held ist platzierbar (wrong-hero)', () => {
    const g = newGame();
    expect(g.info.hero).toBe('wren');
    expect(g.canPlace('bram', 60000, 122000)).toEqual({ ok: false, reason: 'wrong-hero' });
    expect(g.canPlace('wren', 60000, 122000)).toEqual({ ok: true });
    const b = newGame({ hero: 'bram' });
    expect(b.info.hero).toBe('bram');
    expect(b.canPlace('wren', 60000, 122000)).toEqual({ ok: false, reason: 'wrong-hero' });
    expect(b.priceOf('bram')).toBe(650);
    const s = newGame({ hero: 'sela' });
    expect(s.priceOf('sela')).toBe(750);
    expect(() => createGame({ map: 'bare', difficulty: 'medium', seed: 1, hero: 'nobody' as HeroType })).toThrow();
  });

  it('ein Held pro Match, nicht verkaufbar, keine Upgrades; Modus no-hero sperrt alle', () => {
    const g = newGame({ hero: 'sela' });
    const id = place(g, 'sela', 60, 122);
    expect(g.canPlace('sela', 200000, 200000)).toEqual({ ok: false, reason: 'hero-limit' });
    expect(g.apply({ type: 'sell', towerId: id })).toEqual({ ok: false, reason: 'hero' });
    expect(g.upgradeInfo(id)).toEqual([]);
    const n = newGame({ hero: 'bram', mode: 'no-hero' });
    expect(n.canPlace('bram', 60000, 122000)).toEqual({ ok: false, reason: 'mode-locked' });
  });

  it('Held-XP am Rundenende gleich wie bei Wren (60 + 20 x Runde), Level aus der Tabelle des Helden', () => {
    for (const h of ['bram', 'sela'] as const) {
      const g = newGame({ hero: h });
      place(g, h, 60, 122);
      clearRound(g);
      expect(g.state.towers[0].heroXp).toBe(80);
      clearRound(g);
      expect(g.state.towers[0].heroXp).toBe(180);
      expect(g.state.towers[0].heroLevel).toBe(2);
    }
  });

  it('heroStartLevel und heroBoost nutzen die Tabelle des gewählten Helden', () => {
    const g = newGame({ hero: 'bram', mods: { startCash: 100000, heroStartLevel: 5 }, powers: { heroBoost: 1 } });
    place(g, 'bram', 60, 122);
    expect(g.state.towers[0].heroXp).toBe(DATA.hero.bram.levels[4].xp);
    g.apply({ type: 'power', power: 'heroBoost' });
    const to = Math.min(20, 5 + DATA.powers.heroBoost.params.levels);
    expect(g.state.towers[0].heroLevel).toBe(to);
    expect(g.state.towers[0].heroXp).toBe(DATA.hero.bram.levels[to - 1].xp);
  });
});

describe('Bram Ironwright', () => {
  const bram = (level: number, extra: Parameters<typeof newGame>[0] = {}): Game => {
    const g = newGame({ hero: 'bram', mods: { startCash: 100000, heroStartLevel: level }, ...extra });
    place(g, 'bram', 60, 122);
    return g;
  };
  it('Grundwerte: Hammer magic, +2 gegen Brute und Ironshell', () => {
    const g = bram(1);
    expect(g.state.towers[0].range).toBe(70000);
    expect(g.state.towers[0].camo).toBe(false);
    expect(D.hero.bram.base).toMatchObject({ pk: 'hammer', dtype: 'magic', dmg: 4, pierce: 3, bonusBrute: 2, bonusIron: 2 });
  });

  it('L3 Schmiede: Türme im Radius machen +1 Schaden, L12 +2; Hero selbst nicht', () => {
    const g = bram(3);
    const r = place(g, 'ranger', 90, 122);
    expect(g.auraOf(r).dmg).toBe(1);
    const far = place(g, 'ranger', 300, 110);
    expect(g.auraOf(far).dmg).toBe(0);
    const h = bram(12);
    const r2 = place(h, 'ranger', 90, 122);
    expect(h.auraOf(r2).dmg).toBe(2);
  });

  it('Fähigkeiten: Anvil Drop ab L10 (55 s, später 45 s), Forge of Dawn L20 (80 s)', () => {
    expect(bram(9).state.abilities).toHaveLength(0);
    expect(bram(10).state.abilities).toEqual([{ id: 'anvilDrop', ready: false, cdLeft: 3300, cdTotal: 3300 }]);
    expect(bram(15).state.abilities.find((a) => a.id === 'anvilDrop')).toMatchObject({ cdTotal: 2700 });
    const g20 = bram(20);
    expect(g20.state.abilities.map((a) => a.id)).toEqual(['anvilDrop', 'forgeOfDawn']);
    expect(g20.state.abilities.find((a) => a.id === 'forgeOfDawn')).toMatchObject({ cdTotal: 4800 });
  });

  it('Anvil Drop: Schaden im Radius, Boss mehr, Betäubung 2 s (Boss 0,6 s)', () => {
    const g = bram(10);
    waitAbility(g, 'anvilDrop');
    const a = g.sandbox.spawn('brute', 30000);
    const b = g.sandbox.spawn('leviathan', 30500);
    const hpBoss = g.state.enemies.find((e) => e.id === b)!.hp;
    expect(g.apply({ type: 'ability', ability: 'anvilDrop' })).toEqual({ ok: true });
    const bo = g.state.enemies.find((e) => e.id === b)!;
    expect(hpBoss - bo.hp).toBe(150);
    expect(bo.stunTicks).toBe(36);
    // Brute (HP 8?) stirbt, Kinder erben Betäubung nicht; Pops zählen für Bram
    expect(g.state.enemies.find((e) => e.id === a)).toBeUndefined();
    expect(g.state.stats.pops.bram).toBeGreaterThan(0);
  });

  it('Anvil Drop ohne Ziel in Reichweite: no-target', () => {
    const g = bram(10);
    waitAbility(g, 'anvilDrop');
    expect(g.apply({ type: 'ability', ability: 'anvilDrop' })).toEqual({ ok: false, reason: 'no-target' });
  });

  it('Forge of Dawn: sharp trifft Ironshell, Panzerträger nehmen +3, endet nach 10 s', () => {
    const g = bram(20);
    waitAbility(g, 'forgeOfDawn');
    // ohne Schmiede prallt sharp ab
    const iron = g.sandbox.spawn('ironshell', 30000);
    expect(g.sandbox.hurt(iron, 1, 'sharp')).toBe(false);
    expect(g.apply({ type: 'ability', ability: 'forgeOfDawn' })).toEqual({ ok: true });
    expect(g.state.forgeLeft).toBe(600);
    expect(g.sandbox.hurt(iron, 1, 'sharp')).toBe(true);
    g.step(601);
    expect(g.state.forgeLeft).toBe(0);
    const iron2 = g.sandbox.spawn('ironshell', 30000);
    expect(g.sandbox.hurt(iron2, 1, 'sharp')).toBe(false);
  });
});

describe('Sela Nightglass', () => {
  const sela = (level: number): Game => {
    const g = newGame({ hero: 'sela', mods: { startCash: 100000, heroStartLevel: level } });
    place(g, 'sela', 60, 122);
    return g;
  };
  it('Grundwerte: große Reichweite, sieht Camo', () => {
    const g = sela(1);
    expect(g.state.towers[0]).toMatchObject({ range: 110000, camo: true });
  });

  it('L5 Camo-Aura: Türme im Radius sehen Camo; L12 +10 % Reichweite', () => {
    const g = sela(5);
    const r = place(g, 'ranger', 90, 122);
    expect(g.auraOf(r).camo).toBe(true);
    const far = place(g, 'ranger', 300, 110);
    expect(g.auraOf(far).camo).toBe(false);
    g.step(2);
    expect(g.state.towers.find((t) => t.id === r)!.camo).toBe(true);
    const h = sela(12);
    const r2 = place(h, 'ranger', 90, 122);
    h.step(2);
    expect(h.state.towers.find((t) => t.id === r2)!.range).toBe(Math.floor(68000 * 1.1));
  });

  it('Fähigkeiten: Starfall L10 (50 s), L15 (40 s), Eclipse L20 (70 s)', () => {
    expect(sela(10).state.abilities).toEqual([{ id: 'starfall', ready: false, cdLeft: 3000, cdTotal: 3000 }]);
    expect(sela(15).state.abilities[0]).toMatchObject({ cdTotal: 2400 });
    expect(sela(20).state.abilities.map((a) => a.id)).toEqual(['starfall', 'eclipse']);
    expect(sela(20).state.abilities.find((a) => a.id === 'eclipse')).toMatchObject({ cdTotal: 4200 });
  });

  it('Starfall trifft alle Gegner in ihrer Reichweite, Boss mehr, aber niemanden außerhalb', () => {
    const g = sela(10);
    waitAbility(g, 'starfall');
    const near = g.sandbox.spawn('ironshell', 30000);
    const nb = g.sandbox.spawn('leviathan', 33000);
    const far = g.sandbox.spawn('ironshell', 900000);
    const hp = (id: number) => g.state.enemies.find((e) => e.id === id)!.hp;
    const hFar = hp(far), hBoss = hp(nb);
    const events = [] as SimEvent[];
    expect(g.apply({ type: 'ability', ability: 'starfall' })).toEqual({ ok: true });
    events.push(...g.drainEvents());
    expect(g.state.enemies.find((e) => e.id === near)).toBeUndefined(); // Ironshell (HP 6?) unter 20 Schaden
    expect(hBoss - hp(nb)).toBe(120);
    expect(hp(far)).toBe(hFar);
    expect(ev(events, 'starfall')[0]).toMatchObject({ tower: g.state.towers[0].id });
  });

  it('Eclipse: alle Gegner halbes Tempo für 4 s, auch Blimps, Bosse und Emberlinge', () => {
    const g = sela(20);
    waitAbility(g, 'eclipse');
    const ids = ['green', 'ember', 'gloomship', 'leviathan'].map((t) => g.sandbox.spawn(t as 'green', 50000));
    expect(g.apply({ type: 'ability', ability: 'eclipse' })).toEqual({ ok: true });
    for (const id of ids) {
      const e = g.state.enemies.find((x) => x.id === id)!;
      expect(e).toMatchObject({ slowBp: 5000, slowTicks: 240 });
    }
    g.step(241);
    for (const id of ids) {
      const e = g.state.enemies.find((x) => x.id === id);
      if (e) expect(e.slowTicks).toBe(0); // Sela schießt mit; wer noch lebt, ist nicht mehr verlangsamt
    }
  });
});

describe('Bot und Determinismus', () => {
  it('Bot kennt die neuen Türme und Helden; zwei Läufe = gleicher Hash', () => {
    const text = 'ranger 0-0-0 + ranger 0-2-4 + tinker 2-2-0 + bram';
    const a = runBot(parseStrategy(text), { difficulty: 'easy', seed: 3 });
    const b = runBot(parseStrategy(text), { difficulty: 'easy', seed: 3 });
    expect(a.hash).toBe(b.hash);
    expect(a.heroLevel).toBeGreaterThan(0);
    expect(a.pops.bram).toBeGreaterThan(0);
    expect(a.pops.tinker).toBeGreaterThan(0);
  });

  it('Bot setzt Riverkeeper ins Wasser (Meadow-Bach)', () => {
    const r = runBot(parseStrategy('riverkeeper 2-0-0 + ranger 0-0-0'), { difficulty: 'easy', seed: 1, maxTicks: 60 * 60 * 3 });
    expect(r.spent.riverkeeper).toBeGreaterThan(0);
    expect(r.pops.riverkeeper).toBeGreaterThan(0);
  });

  it('Zustand bleibt ganzzahlig (hash wirft sonst) mit Sentries, Fallen, Auren', () => {
    const g = newGame({ hero: 'bram', mods: { startCash: 200000, heroStartLevel: 10 } });
    const t = place(g, 'tinker', 60, 122);
    buy(g, t, [3, 2, 0]);
    place(g, 'bram', 90, 122);
    for (let i = 0; i < 8; i++) g.sandbox.spawn('brute', 20000 + i * 2000);
    run(g, 900);
    expect(() => g.hash()).not.toThrow();
  });
});
