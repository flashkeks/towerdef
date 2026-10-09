/** Runde 13: Lantern Market — Einkommen, Bank, Grant, Auren, Golden Exchange, Turm-XP. */
import { describe, expect, it } from 'vitest';
import './setup';
import { DATA, type Game, type SimEvent, type Tiers } from '../src/index';
import { buy, clearRound, newGame, place, run, statsOf } from './helpers';

const popCash = (ev: SimEvent[]): number => ev.reduce((a, e) => a + (e.type === 'pop' ? e.cash : 0), 0);
const incomeEv = (ev: SimEvent[]) => ev.filter((e): e is Extract<SimEvent, { type: 'income' }> => e.type === 'income');
/** Market ab, weit vom Weg; mit `tiers` ausgebaut. */
function market(g: Game, tiers: Tiers = [0, 0, 0], x = 60, y = 200): number {
  const id = place(g, 'market', x, y);
  buy(g, id, tiers);
  return id;
}

describe('Daten', () => {
  it('Preise, Basis und Fußabdruck laut Entwurf', () => {
    const d = DATA.towers.market;
    expect(d.price).toBe(1000);
    expect(d.radius).toBe(13);
    expect(d.paths.map((p) => p.name)).toEqual(['Harvest', 'Bank', 'Town Square']);
    expect(d.paths.map((p) => p.tiers.map((t) => t.price))).toEqual([
      [400, 600, 2200, 6000, 18000],
      [300, 500, 2500, 5000, 20000],
      [250, 400, 1500, 4000, 15000],
    ]);
    expect(d.paths[0].tiers.map((t) => t.name)).toEqual(['Busy Stalls', 'Night Market', 'Trade Hall', 'Merchant Guild', 'Golden Exchange']);
    const l = DATA.towers.longshot;
    expect(l.price).toBe(350);
    expect(l.radius).toBe(9);
    expect(l.paths.map((p) => p.tiers.map((t) => t.price))).toEqual([
      [350, 1200, 3000, 5000, 22000],
      [200, 400, 2500, 4500, 13000],
      [250, 450, 2000, 4000, 12000],
    ]);
  });

  it('Einkommen je Stufe (Pfad A: 90 / 130 / 320 / 900 / 2400, Pfad B1 +20)', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => statsOf('market', [n, 0, 0]).income)).toEqual([80, 120, 170, 420, 1180, 3100]);
    expect(statsOf('market', [0, 1, 0]).income).toBe(105);
    expect(statsOf('market', [2, 1, 0]).income).toBe(195);
  });
});

describe('Einkommen am Rundenende', () => {
  it('Basis +80 mit Event (Betrag + Turm-ID), zusätzlich zum Rundenbonus', () => {
    const g = newGame();
    const id = market(g);
    const cash0 = g.state.cash;
    const ev = clearRound(g);
    const inc = incomeEv(ev);
    expect(inc).toHaveLength(1);
    expect(inc[0]).toMatchObject({ tower: id, round: 1, amount: 80, cash: 80, bank: 0 });
    expect(g.state.cash).toBe(cash0 + 80 + 101 + popCash(ev)); // Einkommen + Rundenbonus 100 + Runde + Pop-Gold
    expect(g.state.stats.income).toBe(80);
    // Event liegt vor roundEnd
    const idxInc = ev.findIndex((e) => e.type === 'income');
    const idxEnd = ev.findIndex((e) => e.type === 'roundEnd');
    expect(idxInc).toBeLessThan(idxEnd);
  });

  it('Pfad A zahlt je Stufe, zwei Markets zahlen getrennt, Market verdient keine Pops', () => {
    const g = newGame();
    const a = market(g, [3, 0, 0], 60, 200);
    const b = market(g, [0, 1, 0], 30, 240);
    const inc = incomeEv(clearRound(g));
    expect(inc.map((e) => [e.tower, e.amount])).toEqual([[a, 420], [b, 105]]);
    expect(g.state.towers.find((t) => t.id === a)!.pops).toBe(0);
  });

  it('marketInfo: Einkommen vor der Auszahlung, null für andere Türme', () => {
    const g = newGame();
    const id = market(g, [2, 0, 0]);
    const r = place(g, 'ranger', 60, 122);
    expect(g.marketInfo(r)).toBeNull();
    expect(g.marketInfo(id)).toMatchObject({ income: 170, hasBank: false, bank: 0, grantCash: 0, radius: 80000 });
  });

  it('Golden Exchange: andere Markets +10 %, er selbst nicht; zwei Golden Exchanges stapeln nicht', () => {
    const g = newGame({ mods: { startCash: 200000 } });
    const gold = market(g, [5, 0, 0], 60, 200);
    const other = market(g, [0, 0, 0], 30, 240);
    expect(g.marketInfo(other)!.income).toBe(88);
    expect(g.marketInfo(gold)!.income).toBe(3100 + 0);
    const gold2 = market(g, [5, 0, 0], 60, 250);
    expect(g.marketInfo(other)!.income).toBe(88);
    expect(g.marketInfo(gold)!.income).toBe(3410); // der andere Golden Exchange zählt
    expect(g.marketInfo(gold2)!.income).toBe(3410);
  });
});

describe('Bank', () => {
  it('Lockbox: Einnahmen und Zinsen landen im Konto, Zinsen auf das alte Konto, Deckel, Überlauf als Geld', () => {
    const g = newGame({ mods: { startCash: 200000 } });
    const id = market(g, [3, 2, 0]); // A3 = 420 (+ B1 25) = 445 (Runde 13: Market-Ertrag +30 %)
    const t = g.state.towers.find((x) => x.id === id)!;
    expect(g.marketInfo(id)).toMatchObject({ income: 445, hasBank: true, bankRateBp: 1000, bankCap: 3000 });
    let cash = g.state.cash;
    let ev = clearRound(g); // Runde 1: Konto 445, Geld nur Rundenbonus
    expect(incomeEv(ev)[0]).toMatchObject({ amount: 445, cash: 0, bank: 445 });
    expect(t.bank).toBe(445);
    expect(g.state.cash - cash - popCash(ev)).toBe(101);
    ev = clearRound(g); // Runde 2: Zinsen 44 auf 445, +445
    expect(incomeEv(ev)[0]).toMatchObject({ amount: 445 + 44, cash: 0, bank: 934 });
    expect(g.marketInfo(id)!.nextInterest).toBe(93);
    // bis über den Deckel
    for (let i = 0; i < 6; i++) clearRound(g);
    expect(t.bank).toBe(3000);
    cash = g.state.cash;
    ev = clearRound(g);
    const e = incomeEv(ev)[0];
    expect(e.bank).toBe(3000);
    expect(e.cash).toBe(300 + 445); // Zinsen auf 3000 plus Einnahmen laufen komplett über
    expect(g.state.cash - cash - popCash(ev)).toBe(e.cash + 100 + g.state.round);
  });

  it('Withdraw zahlt aus, leert das Konto, Gründe no-tower / not-bank / empty', () => {
    const g = newGame({ mods: { startCash: 200000 } });
    const id = market(g, [0, 2, 0]);
    const plain = market(g, [0, 0, 0], 30, 240);
    const r = place(g, 'ranger', 60, 122);
    clearRound(g);
    clearRound(g);
    const t = g.state.towers.find((x) => x.id === id)!;
    const bank = t.bank;
    expect(bank).toBeGreaterThan(0);
    const cash = g.state.cash;
    g.drainEvents();
    expect(g.apply({ type: 'withdraw', towerId: id })).toEqual({ ok: true, id });
    expect(g.state.cash).toBe(cash + bank);
    expect(t.bank).toBe(0);
    expect(g.drainEvents()).toContainEqual({ type: 'withdraw', tick: g.state.tick, tower: id, amount: bank });
    expect(g.apply({ type: 'withdraw', towerId: id })).toEqual({ ok: false, reason: 'empty' });
    expect(g.apply({ type: 'withdraw', towerId: plain })).toEqual({ ok: false, reason: 'not-bank' });
    expect(g.apply({ type: 'withdraw', towerId: r })).toEqual({ ok: false, reason: 'not-bank' });
    expect(g.apply({ type: 'withdraw', towerId: 9999 })).toEqual({ ok: false, reason: 'no-tower' });
  });

  it('Verkauf zahlt das Konto mit aus (sellValue enthält es)', () => {
    const g = newGame({ mods: { startCash: 200000 } });
    const id = market(g, [0, 2, 0]);
    clearRound(g);
    const t = g.state.towers.find((x) => x.id === id)!;
    const spent = t.spent;
    expect(spent).toBe(1000 + 300 + 500);
    expect(t.bank).toBe(105);
    expect(g.sellValue(id)).toBe(Math.ceil(spent * 0.7) + 105);
    const cash = g.state.cash;
    expect(g.apply({ type: 'sell', towerId: id }).ok).toBe(true);
    expect(g.state.cash).toBe(cash + Math.ceil(spent * 0.7) + 105);
  });

  it('Stufen: Lantern Bank 15 % / 7.000, Treasury 20 % / 20.000', () => {
    expect(statsOf('market', [0, 3, 0])).toMatchObject({ bankOn: 1, bankRateBp: 1500, bankCap: 7000 });
    expect(statsOf('market', [0, 5, 0])).toMatchObject({ bankRateBp: 2000, bankCap: 20000, grantCash: 8000 });
  });

  it('Wissensbaum: Market Savvy +10 %, Compound Interest +5 Punkte (nur mit Bank), Wide Aura, Bulk Orders', () => {
    const g = newGame({ mods: { startCash: 200000, marketBp: 1000, bankRateBp: 500, marketRadiusBp: 1500, marketPriceBp: 1000 } });
    expect(g.priceOf('market')).toBe(900);
    const plain = market(g, [0, 0, 0], 60, 200);
    const bank = market(g, [0, 2, 0], 30, 240);
    expect(g.marketInfo(plain)).toMatchObject({ income: 88, bankRateBp: 0, radius: 92000 });
    expect(g.marketInfo(bank)).toMatchObject({ income: 115, bankRateBp: 1500 }); // (80 + 25) x 1,1
    expect(g.priceOf('ranger')).toBe(200); // Rabatt nur für Markets
  });
});

describe('Grant', () => {
  it('Fähigkeit ab Grant Office: +2.000, Abklingzeit 90 s, startet voll; Treasury +8.000', () => {
    const g = newGame({ mods: { startCash: 200000 } });
    market(g, [0, 3, 0]);
    expect(g.state.abilities.find((a) => a.id === 'grant')).toBeUndefined();
    const id = place(g, 'market', 30, 240);
    buy(g, id, [0, 4, 0]);
    const a = g.state.abilities.find((x) => x.id === 'grant')!;
    expect(a).toMatchObject({ ready: false, cdTotal: 5400, cdLeft: 5400 });
    expect(g.apply({ type: 'ability', ability: 'grant' })).toEqual({ ok: false, reason: 'cooldown' });
    g.step(5400);
    g.drainEvents();
    const cash = g.state.cash;
    expect(g.apply({ type: 'ability', ability: 'grant' }).ok).toBe(true);
    expect(g.state.cash).toBe(cash + 2000);
    expect(g.drainEvents()).toContainEqual({ type: 'ability', tick: g.state.tick, id: 'grant', x: 30000, y: 240000, cash: 2000 });
    expect(g.state.abilities.find((x) => x.id === 'grant')).toMatchObject({ ready: false, cdLeft: 5400 });
    buy(g, id, [0, 1, 0]);
    g.step(5400);
    const c2 = g.state.cash;
    g.apply({ type: 'ability', ability: 'grant' });
    expect(g.state.cash).toBe(c2 + 8000);
  });
});

describe('Auren (Pfad C)', () => {
  /** Ranger bei (60,122), Market im Radius (80 px) bzw. außerhalb. */
  function setup(tiers: Tiers, mx = 60, my = 190) {
    const g = newGame({ mods: { startCash: 200000 } });
    const r = place(g, 'ranger', 60, 122);
    const m = market(g, tiers, mx, my);
    g.step(1);
    return { g, r, m };
  }
  const T = (g: Game, id: number) => g.state.towers.find((t) => t.id === id)!;

  it('Watchpost +10 % Reichweite, nur im Radius', () => {
    const near = setup([0, 0, 1]);
    expect(T(near.g, near.r).range).toBe(Math.floor((68000 * 11000) / 10000));
    const far = setup([0, 0, 1], 500, 250);
    expect(T(far.g, far.r).range).toBe(68000);
    expect(near.g.auraOf(near.r).rangeBp).toBe(1000);
    expect(far.g.auraOf(far.r).rangeBp).toBe(0);
  });

  it('Lookout Bell: Erkennung (camo) im Radius; Market selbst bekommt keine Aura', () => {
    const { g, r, m } = setup([0, 0, 2]);
    expect(T(g, r).camo).toBe(true);
    expect(T(g, m).camo).toBe(false);
    expect(g.auraOf(m).camo).toBe(false);
    const far = setup([0, 0, 2], 500, 250);
    expect(T(far.g, far.r).camo).toBe(false);
  });

  it('Drum Hall +15 % Angriffstempo: mehr Schüsse in gleicher Zeit', () => {
    const shots = (tiers: Tiers): number => {
      const { g } = setup(tiers);
      g.sandbox.spawn('leviathan', 60000); // Boss steht lange im Bild
      const ev = run(g, 1200);
      return ev.filter((e) => e.type === 'fire').length;
    };
    const base = shots([0, 0, 0]);
    const buffed = shots([0, 0, 3]);
    expect(buffed).toBeGreaterThan(base);
    expect(buffed / base).toBeGreaterThan(1.1);
    expect(buffed / base).toBeLessThan(1.25);
  });

  it('Armory: sharp trifft Ironshell (wird magic), +1 Pierce; Lantern Capital +1 Schaden', () => {
    const { g, r } = setup([0, 0, 4]);
    g.sandbox.spawn('ironshell', 100000);
    const ev = run(g, 200);
    expect(ev.some((e) => e.type === 'hit' && e.dmg >= 1 && e.dtype === 'magic')).toBe(true);
    expect(ev.some((e) => e.type === 'blocked')).toBe(false);
    const proj = g.state.projectiles[0] ?? null;
    void proj;
    const cap = setup([0, 0, 5]);
    expect(cap.g.auraOf(cap.r)).toMatchObject({ dmg: 1, discountBp: 1000, armor: true, pierce: 1 });
    const none = newGame();
    const pr = place(none, 'ranger', 60, 122);
    none.sandbox.spawn('red', 100000);
    const e1 = run(none, 120).filter((e): e is Extract<SimEvent, { type: 'hit' }> => e.type === 'hit' && e.tower === pr);
    cap.g.sandbox.spawn('red', 100000);
    const e2 = run(cap.g, 120).filter((e): e is Extract<SimEvent, { type: 'hit' }> => e.type === 'hit' && e.tower === cap.r);
    expect(e1[0].dmg).toBe(1);
    expect(e2[0].dmg).toBe(2);
  });

  it('Lantern Capital: Upgrades im Radius −10 %', () => {
    const { g, r } = setup([0, 0, 5]);
    const free = newGame({ mods: { startCash: 200000 } });
    const r2 = place(free, 'ranger', 60, 122);
    const p0 = free.upgradeInfo(r2)[0].price; // 120
    expect(p0).toBe(120);
    expect(g.upgradeInfo(r)[0].price).toBe(110); // 108 -> 5er-Rundung
    expect(g.upgradeInfo(r)[2].price).toBe(70); // 72
    const cash = g.state.cash;
    g.apply({ type: 'upgrade', towerId: r, path: 0 });
    expect(cash - g.state.cash).toBe(110);
    expect(T(g, r).spent).toBe(200 + 110);
  });

  it('Auren mehrerer Markets stapeln nicht: stärkster Wert je Feld', () => {
    const g = newGame({ mods: { startCash: 400000 } });
    const r = place(g, 'ranger', 60, 122);
    market(g, [0, 0, 1], 30, 190);
    market(g, [0, 0, 1], 90, 190);
    expect(g.auraOf(r).rangeBp).toBe(1000);
    market(g, [0, 0, 3], 60, 175); // Drum Hall im Radius, Watchpost-Wert bleibt
    expect(g.auraOf(r)).toMatchObject({ rangeBp: 1000, speedBp: 1500, camo: true });
    market(g, [0, 0, 3], 35, 150);
    expect(g.auraOf(r).speedBp).toBe(1500);
  });
});

describe('Turm-XP', () => {
  it('Market bekommt nur den Geld-Anteil (keine Pops)', () => {
    const g = newGame({
      mods: { startCash: 100000 },
      towerXp: { ranger: 100, bombardier: 100, frostcaller: 100, longshot: 100, market: 100 },
    });
    const m = market(g, [0, 0, 0]);
    place(g, 'ranger', 60, 122);
    // Ranger tötet in Runde 1 mit
    g.apply({ type: 'startRound' });
    const ev = run(g, 60 * 120, () => g.state.roundsCleared >= 1);
    const xp = ev.find((e) => e.type === 'towerXp') as Extract<SimEvent, { type: 'towerXp' }>;
    expect(xp).toBeDefined();
    expect(g.state.towers.find((t) => t.id === m)!.pops).toBe(0);
    expect(g.state.roundPops.market).toBe(0);
    // Geld: 1000 : 200 = 5 : 1 -> Market bekommt von der Hälfte ~5/6, Ranger Rest + alle Pops
    expect(xp.gains.market).toBeGreaterThan(0);
    expect(xp.gains.market!).toBeLessThan(xp.pot / 2);
    expect(xp.gains.ranger!).toBeGreaterThan(xp.pot / 2);
    expect(Object.values(xp.gains).reduce((a, b) => a + b, 0)).toBe(xp.pot);
  });
});
