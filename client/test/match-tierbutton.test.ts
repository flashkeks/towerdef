import { describe, expect, it } from 'vitest';
import { createGame, type TowerType, type UpgradeInfo } from '../src/sim';
import { tierButton } from '../src/match/tier-button';

const info = (o: Partial<UpgradeInfo>): UpgradeInfo => ({ path: 0, current: 0, next: 1, name: 'X', desc: 'd', price: 100, unlocked: 1, unlockCost: 0, revealed: true, canBuy: true, ...o });

describe('Stufen-Knopf: Zustaende (reine Funktion)', () => {
  it('freigeschaltet + Geld reicht -> buy, klickbar, mit Preis', () => {
    const b = tierButton(info({}), 0);
    expect(b).toMatchObject({ kind: 'buy', price: 100, clickable: true, hidden: false, tier: 1 });
  });
  it('freigeschaltet, Geld fehlt -> poor, nicht klickbar, Preis bleibt sichtbar', () => {
    const b = tierButton(info({ canBuy: false, reason: 'no-cash', price: 250 }), 999);
    expect(b).toMatchObject({ kind: 'poor', price: 250, clickable: false });
  });
  it('nicht freigeschaltet + genug XP -> unlock, klickbar', () => {
    const b = tierButton(info({ current: 1, next: 2, unlocked: 1, unlockCost: 250, canBuy: false, reason: 'locked' }), 250);
    expect(b).toMatchObject({ kind: 'unlock', xpCost: 250, xpMissing: 0, clickable: true, tier: 2 });
  });
  it('nicht freigeschaltet + zu wenig XP -> needxp mit Fehlbetrag, nicht klickbar', () => {
    const b = tierButton(info({ unlocked: 0, unlockCost: 100, canBuy: false, reason: 'locked' }), 40);
    expect(b).toMatchObject({ kind: 'needxp', xpCost: 100, xpMissing: 60, clickable: false });
  });
  it('Crosspath gesperrt -> closed, auch wenn die Stufe freigeschaltet oder nicht ist', () => {
    expect(tierButton(info({ canBuy: false, reason: 'crosspath' }), 0).kind).toBe('closed');
    expect(tierButton(info({ unlocked: 0, unlockCost: 100, canBuy: false, reason: 'crosspath' }), 9999)).toMatchObject({ kind: 'closed', clickable: false });
  });
  it('alle fuenf gekauft -> maxed', () => {
    const b = tierButton(info({ current: 5, next: null, price: 0, unlocked: 5, canBuy: false, reason: 'maxed' }), 0);
    expect(b).toMatchObject({ kind: 'maxed', tier: 0, clickable: false, hidden: false });
  });
  it('verdeckte Stufe wird markiert (hidden), der Zustand bleibt', () => {
    const b = tierButton(info({ current: 2, next: 3, unlocked: 1, unlockCost: 900, revealed: false, name: '', canBuy: false, reason: 'locked' }), 1000);
    expect(b).toMatchObject({ kind: 'unlock', hidden: true });
  });
});

describe('Stufen-Knopf gegen die echte Sim', () => {
  const place = (g: ReturnType<typeof createGame>, type: TowerType): number => {
    const r = g.apply({ type: 'place', tower: type, x: 150000, y: 150000 });
    expect(r.ok).toBe(true);
    return (r as { id: number }).id;
  };
  const btn = (g: ReturnType<typeof createGame>, id: number, p: 0 | 1 | 2) => tierButton(g.upgradeInfo(id)[p], g.state.towerXp.ranger);

  it('Ablauf: needxp -> unlock -> (Freischalten) -> buy -> naechste Stufe unlock; die naechste Stufe ist immer sichtbar', () => {
    const g = createGame({ map: 'meadow', difficulty: 'easy', seed: 1, unlocks: { towers: ['ranger'], maxTier: { ranger: [0, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] } }, towerXp: { ranger: 0, bombardier: 0, frostcaller: 0 } });
    g.sandbox.setCash(100000);
    const id = place(g, 'ranger');
    expect(btn(g, id, 0)).toMatchObject({ kind: 'needxp', xpCost: 100, xpMissing: 100, hidden: false });
    g.state.towerXp.ranger = 100;
    expect(btn(g, id, 0).kind).toBe('unlock');
    expect(g.apply({ type: 'unlockTier', tower: 'ranger', path: 0 }).ok).toBe(true);
    expect(btn(g, id, 0)).toMatchObject({ kind: 'buy', clickable: true });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true);
    // Stufe 2 ist nicht freigeschaltet, aber Name/Icon sichtbar (Stufe davor ist freigeschaltet)
    const b2 = btn(g, id, 0);
    expect(b2).toMatchObject({ kind: 'needxp', tier: 2, hidden: false });
    expect(g.upgradeInfo(id)[0].name.length).toBeGreaterThan(0);
  });

  it('fuer jeden Pfad und jede Stufe: ist die Stufe davor freigeschaltet, ist die naechste Stufe sichtbar', () => {
    const g = createGame({ map: 'meadow', difficulty: 'easy', seed: 1 });
    g.sandbox.setCash(1e7);
    const id = place(g, 'ranger');
    for (let n = 0; n < 5; n++) {
      for (const p of [0, 1, 2] as const) {
        const i = g.upgradeInfo(id)[p];
        if (i.next != null && i.unlocked >= i.current) expect(i.revealed, `Pfad ${p}, Stufe ${i.next}`).toBe(true);
      }
      g.apply({ type: 'upgrade', towerId: id, path: 0 });
    }
  });

  it('5-2-0: Pfad 0 maxed, Pfad 1 und 2 closed (Crosspath)', () => {
    const g = createGame({ map: 'meadow', difficulty: 'easy', seed: 1 });
    g.sandbox.setCash(1e7);
    const id = place(g, 'ranger');
    for (let i = 0; i < 5; i++) g.apply({ type: 'upgrade', towerId: id, path: 0 });
    for (let i = 0; i < 2; i++) g.apply({ type: 'upgrade', towerId: id, path: 1 });
    expect(btn(g, id, 0).kind).toBe('maxed');
    expect(btn(g, id, 1).kind).toBe('closed');
    expect(btn(g, id, 2).kind).toBe('closed');
  });
});
