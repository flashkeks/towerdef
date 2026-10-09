/** Runde 11b: Turm-XP-Topf, Aufteilung, unlockTier, verdeckte Stufen, Crosspath. */
import { describe, expect, it } from 'vitest';
import { createGame, splitTowerXp, towerXpPot, type Game, type GameOptions, type Tiers, type TowerType } from '../src/index';
import { buy, place, run } from './helpers';

const none: Record<TowerType, Tiers> = { ranger: [0, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] };
const acct = (n = 100): Record<TowerType, number> => ({ ranger: n, bombardier: n, frostcaller: n });
function xpGame(over: Partial<GameOptions> = {}): Game {
  return createGame({
    map: 'bare', difficulty: 'medium', seed: 1, mods: { startCash: 100000 },
    unlocks: { towers: ['ranger', 'bombardier', 'frostcaller', 'wren'], maxTier: { ranger: [0, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] } },
    towerXp: acct(), ...over,
  });
}
/** Spielt Runde 1 komplett durch (Türme töten, was kommt) und liefert alle Events. */
function playRound1(g: Game) {
  g.apply({ type: 'startRound' });
  return run(g, 60 * 120, () => g.state.roundsCleared >= 1);
}

describe('Topf je Runde', () => {
  it('(10 + 6 x Runde) x Schwierigkeit; Summe R1-20 Medium = 1.606', () => {
    expect(towerXpPot(1, 'easy')).toBe(16);
    expect(towerXpPot(1, 'medium')).toBe(17); // 16 x 1,1 = 17,6 -> 17
    expect(towerXpPot(10, 'hard')).toBe(84);
    let sum = 0;
    for (let r = 1; r <= 20; r++) sum += towerXpPot(r, 'medium');
    expect(sum).toBeGreaterThan(1590);
    expect(sum).toBeLessThanOrEqual(1606);
  });
  it('Fast Learner (+20 %) hebt den Topf', () => {
    expect(towerXpPot(10, 'medium', 2000)).toBe(Math.floor((70 * 11000 * 12000) / 1e8));
    expect(towerXpPot(10, 'medium', 2000)).toBeGreaterThan(towerXpPot(10, 'medium'));
  });
});

describe('Aufteilung', () => {
  it('Beispiel Max: 10 Ranger (3.000) gegen Bombardier (10.000), Pops 50/50 -> Ranger ~37 %, Bombardier ~63 %', () => {
    const r = splitTowerXp(1000, { ranger: 3000, bombardier: 10000, frostcaller: 0 }, { ranger: 50, bombardier: 50, frostcaller: 0 });
    expect(r.frostcaller).toBe(0);
    expect(r.ranger + r.bombardier).toBe(1000);
    expect(r.ranger).toBeGreaterThanOrEqual(365);
    expect(r.ranger).toBeLessThanOrEqual(366);
    expect(r.bombardier).toBeGreaterThanOrEqual(634);
  });
  it('mehr Kills heißt mehr XP: Bombardier mit der Mehrheit der Pops bekommt noch mehr', () => {
    const r = splitTowerXp(1000, { ranger: 3000, bombardier: 10000, frostcaller: 0 }, { ranger: 20, bombardier: 80, frostcaller: 0 });
    expect(r.bombardier).toBeGreaterThan(700);
  });
  it('Summe ist immer genau der Topf (Rest an den größten Anteil, deterministisch)', () => {
    for (const pot of [1, 7, 17, 23, 94]) {
      const r = splitTowerXp(pot, { ranger: 333, bombardier: 777, frostcaller: 111 }, { ranger: 3, bombardier: 5, frostcaller: 1 });
      expect(r.ranger + r.bombardier + r.frostcaller).toBe(pot);
    }
    // Gleichstand: der erste Typ in der Reihenfolge bekommt den Rest
    const t = splitTowerXp(10, { ranger: 100, bombardier: 100, frostcaller: 100 }, { ranger: 1, bombardier: 1, frostcaller: 1 });
    expect(t).toEqual({ ranger: 4, bombardier: 3, frostcaller: 3 });
  });
  it('ohne Pops geht alles nach Geld, ohne Geld alles nach Pops, ohne beides nichts', () => {
    expect(splitTowerXp(10, { ranger: 100, bombardier: 300, frostcaller: 0 }, { ranger: 0, bombardier: 0, frostcaller: 0 })).toEqual({ ranger: 2, bombardier: 8, frostcaller: 0 });
    expect(splitTowerXp(10, { ranger: 0, bombardier: 0, frostcaller: 0 }, { ranger: 0, bombardier: 0, frostcaller: 4 })).toEqual({ ranger: 0, bombardier: 0, frostcaller: 10 });
    expect(splitTowerXp(10, { ranger: 0, bombardier: 0, frostcaller: 0 }, { ranger: 0, bombardier: 0, frostcaller: 0 })).toEqual({ ranger: 0, bombardier: 0, frostcaller: 0 });
  });
});

describe('Verteilung im Match', () => {
  it('Rundenende verteilt den Topf: Event, Konto und Summe passen, nur Typen mit Türmen bekommen etwas', () => {
    const g = xpGame();
    place(g, 'ranger', 60, 122);
    place(g, 'ranger', 90, 122);
    const ev = playRound1(g);
    const xp = ev.filter((e) => e.type === 'towerXp');
    expect(xp.length).toBe(1);
    const e = xp[0] as Extract<typeof xp[0], { type: 'towerXp' }>;
    expect(e.round).toBe(1);
    expect(e.pot).toBe(towerXpPot(1, 'medium'));
    expect(Object.values(e.gains).reduce((a, b) => a + (b ?? 0), 0)).toBe(e.pot);
    expect(e.gains.bombardier).toBeUndefined();
    expect(g.state.towerXpGained.ranger).toBe(e.pot);
    expect(g.state.towerXp.ranger).toBe(100 + e.pot);
    expect(g.state.towerXp.bombardier).toBe(100);
    expect(g.state.roundPops.ranger).toBe(0);
  });
  it('Held bekommt keinen Anteil und zählt nicht in die Aufteilung', () => {
    const g = xpGame();
    place(g, 'wren', 60, 122);
    const ev = playRound1(g);
    expect(ev.filter((e) => e.type === 'towerXp').length).toBe(0);
    expect(g.state.towerXp).toEqual(acct());
  });
  it('Fast Learner: mehr XP aus demselben Lauf', () => {
    const a = xpGame();
    const b = xpGame({ mods: { startCash: 100000, towerXpBp: 2000 } });
    for (const g of [a, b]) place(g, 'ranger');
    playRound1(a);
    playRound1(b);
    expect(b.state.towerXpGained.ranger).toBeGreaterThanOrEqual(a.state.towerXpGained.ranger);
  });
  it('ohne GameOptions.towerXp: kein XP-System (keine Verteilung, unlockTier -> no-xp, Stufen wie bisher frei)', () => {
    const g = createGame({ map: 'bare', difficulty: 'medium', seed: 1, mods: { startCash: 100000 } });
    const id = place(g, 'ranger');
    playRound1(g);
    expect(g.state.towerXpGained).toEqual({ ranger: 0, bombardier: 0, frostcaller: 0 });
    expect(g.apply({ type: 'unlockTier', tower: 'ranger', path: 0 })).toEqual({ ok: false, reason: 'maxed' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true);
    const h = createGame({ map: 'bare', difficulty: 'medium', seed: 1, unlocks: { towers: ['ranger'], maxTier: none } });
    expect(h.apply({ type: 'unlockTier', tower: 'ranger', path: 0 })).toEqual({ ok: false, reason: 'no-xp' });
  });
  it('deterministisch: gleicher Lauf, gleicher Hash und gleiche Events', () => {
    const go = () => {
      const g = xpGame();
      place(g, 'ranger', 60, 122);
      place(g, 'bombardier', 100, 55);
      const ev = playRound1(g);
      return { h: g.hash(), xp: ev.filter((e) => e.type === 'towerXp') };
    };
    const a = go();
    const b = go();
    expect(a.h).toBe(b.h);
    expect(a.xp).toEqual(b.xp);
  });
});

describe('unlockTier', () => {
  it('kauft die nächste Stufe des Pfads, zieht Kosten ab, hebt maxTier und meldet ein Event', () => {
    const g = xpGame();
    expect(g.apply({ type: 'unlockTier', tower: 'ranger', path: 1 })).toEqual({ ok: true });
    expect(g.state.maxTier.ranger).toEqual([0, 1, 0]);
    expect(g.state.towerXp.ranger).toBe(0);
    const ev = g.drainEvents().find((e) => e.type === 'unlockTier');
    expect(ev).toMatchObject({ tower: 'ranger', path: 1, tier: 1, cost: 100, xp: 0 });
  });
  it('no-xp: Stufe 2 kostet 250', () => {
    const g = xpGame({ towerXp: acct(300) });
    expect(g.apply({ type: 'unlockTier', tower: 'bombardier', path: 0 }).ok).toBe(true);
    expect(g.apply({ type: 'unlockTier', tower: 'bombardier', path: 0 })).toEqual({ ok: false, reason: 'no-xp' });
    expect(g.state.towerXp.bombardier).toBe(200);
  });
  it('Kosten T1..T5 = 100 / 250 / 900 / 2500 / 8000, danach maxed', () => {
    const g = xpGame({ towerXp: acct(100000) });
    const spent: number[] = [];
    for (let i = 0; i < 5; i++) {
      const before = g.state.towerXp.frostcaller;
      expect(g.apply({ type: 'unlockTier', tower: 'frostcaller', path: 2 }).ok).toBe(true);
      spent.push(before - g.state.towerXp.frostcaller);
    }
    expect(spent).toEqual([100, 250, 900, 2500, 8000]);
    expect(g.apply({ type: 'unlockTier', tower: 'frostcaller', path: 2 })).toEqual({ ok: false, reason: 'maxed' });
  });
  it('locked: Turm selbst nicht freigeschaltet', () => {
    const g = xpGame({ unlocks: { towers: ['ranger'], maxTier: none } });
    expect(g.apply({ type: 'unlockTier', tower: 'bombardier', path: 0 })).toEqual({ ok: false, reason: 'locked' });
  });
  it('freigeschaltet heißt kaufbar im Match; vorher reason locked', () => {
    const g = xpGame();
    const id = place(g, 'ranger');
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 })).toEqual({ ok: false, reason: 'locked' });
    g.apply({ type: 'unlockTier', tower: 'ranger', path: 0 });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true);
  });
  it('Freischalten ist unabhängig vom Crosspath: alle drei Pfade gehen, auch auf 5', () => {
    const g = xpGame({ towerXp: acct(100000) });
    for (const p of [0, 1, 2] as const) for (let i = 0; i < 5; i++) expect(g.apply({ type: 'unlockTier', tower: 'ranger', path: p }).ok).toBe(true);
    expect(g.state.maxTier.ranger).toEqual([5, 5, 5]);
  });
});

describe('verdeckte Stufen', () => {
  it('unlockInfo: Stufe 1 immer sichtbar, sonst erst nach der freigeschalteten Stufe davor; Kosten immer', () => {
    const g = xpGame({ towerXp: acct(100000) });
    g.apply({ type: 'unlockTier', tower: 'ranger', path: 0 });
    const info = g.unlockInfo('ranger');
    expect(info).toHaveLength(3);
    const p0 = info[0].tiers;
    expect(p0.map((t) => t.revealed)).toEqual([true, true, false, false, false]);
    expect(p0.map((t) => t.unlocked)).toEqual([true, false, false, false, false]);
    expect(p0[1].name).not.toBe('');
    expect(p0[2].name).toBe('');
    expect(p0[2].desc).toBe('');
    expect(p0.map((t) => t.cost)).toEqual([100, 250, 900, 2500, 8000]);
    expect(info[1].tiers.map((t) => t.revealed)).toEqual([true, false, false, false, false]);
    expect(info[0].next).toBe(2);
  });
  it('upgradeInfo meldet unlocked, unlockCost und revealed', () => {
    const g = xpGame();
    const id = place(g, 'ranger');
    const u = g.upgradeInfo(id);
    expect(u[0]).toMatchObject({ unlocked: 0, unlockCost: 100, revealed: true, reason: 'locked', canBuy: false });
    expect(u[0].name).not.toBe('');
    g.apply({ type: 'unlockTier', tower: 'ranger', path: 0 });
    expect(g.upgradeInfo(id)[0]).toMatchObject({ unlocked: 1, unlockCost: 0, canBuy: true });
  });
});

describe('Crosspath (BTD6): 5-2-0 geht, kein dritter Pfad, nur ein Pfad über Stufe 2', () => {
  const full = (): Game => xpGame({ towerXp: acct(0), unlocks: { towers: ['ranger'], maxTier: { ranger: [5, 5, 5], bombardier: none.bombardier, frostcaller: none.frostcaller } } });
  it('5-2-0 ist kaufbar', () => {
    const g = full();
    const id = place(g, 'ranger');
    buy(g, id, [5, 2, 0]);
    expect(g.state.towers[0].tiers).toEqual([5, 2, 0]);
  });
  it('mit 5-2-0 kein dritter Pfad und B nicht über 2', () => {
    const g = full();
    const id = place(g, 'ranger');
    buy(g, id, [5, 2, 0]);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 2 })).toEqual({ ok: false, reason: 'crosspath' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 1 })).toEqual({ ok: false, reason: 'crosspath' });
    expect(g.upgradeInfo(id)[2].reason).toBe('crosspath');
  });
  it('2-2-2 geht nicht (drei Pfade), 2-2 und dann Pfad A weiter auf 3 geht', () => {
    const g = full();
    const id = place(g, 'ranger');
    buy(g, id, [2, 2, 0]);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 2 })).toEqual({ ok: false, reason: 'crosspath' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 1 })).toEqual({ ok: false, reason: 'crosspath' });
  });
});
