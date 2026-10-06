import { describe, expect, it } from 'vitest';
import { computeHit, elementBp, type HitInput } from '../src/damage.js';
import { applyDamage, applyDot } from '../src/systems/effects.js';
import type { World } from '../src/state.js';
import { createSim } from '../src/index.js';
import { ctxFor, data, enemy, mutable } from './helpers.js';

const eco = data.economy;
const base: HitInput = {
  baseCenti: 7700, lvlBp: 14750, traitBp: 800, buffBp: 2500, vulnBp: 0, elementBp: 15000,
  armor: 20, pen: 0, crit: false, critMultBp: 15000, trueDamage: false,
};

describe('Schadensformel (§10)', () => {
  it('Prüfrechnung: 77 x 1,475 x 1,08 x 1,25 x 1,5 x 100/120 = 192 (191,63 HP)', () => {
    const r = computeHit(base, eco);
    expect(r.damageCenti).toBe(19163);
    expect(Math.round(r.damageCenti / 100)).toBe(192);
  });
  it('True Damage ignoriert Rüstung', () => {
    expect(computeHit({ ...base, trueDamage: true }, eco).damageCenti).toBe(22996);
  });
  it('Mindestschaden 1 HP (100 Centi)', () => {
    expect(computeHit({ ...base, baseCenti: 10, armor: 100 }, eco).damageCenti).toBe(100);
  });
  it('Pen reduziert Rüstung, nie unter 0', () => {
    const mk = (armor: number, pen: number) => computeHit({ ...base, armor, pen, elementBp: 10000, buffBp: 0, traitBp: 0, lvlBp: 10000 }, eco).damageCenti;
    expect(mk(100, 0)).toBe(3850); // x0,5
    expect(mk(100, 40)).toBe(Math.floor((7700 * 100) / 160));
    expect(mk(40, 40)).toBe(7700);
    expect(mk(40, 90)).toBe(7700);
  });
  it('Buff- und Verwundbar-Caps (+100 % / +50 %)', () => {
    const mk = (buffBp: number, vulnBp: number) => computeHit({ ...base, baseCenti: 10000, lvlBp: 10000, traitBp: 0, buffBp, vulnBp, elementBp: 10000, armor: 0 }, eco).damageCenti;
    expect(mk(5000, 0)).toBe(15000);
    expect(mk(30000, 0)).toBe(20000);
    expect(mk(0, 9000)).toBe(15000);
    expect(mk(10000, 5000)).toBe(30000);
  });
  it('Crit multipliziert zuletzt', () => {
    expect(computeHit({ ...base, crit: true }, eco).damageCenti).toBe(Math.floor((19163 * 15000) / 10000));
  });
  it('Element-Zyklus: stark bei {1,2}, schwach bei {3,4}, neutral bei 0 / gleich', () => {
    const e = (a: number, d: number) => elementBp(a, d, eco);
    expect(e(1, 2)).toBe(15000);
    expect(e(1, 3)).toBe(15000);
    expect(e(1, 4)).toBe(5000);
    expect(e(1, 5)).toBe(5000);
    expect(e(1, 1)).toBe(10000);
    expect(e(5, 1)).toBe(15000); // Zyklus schließt sich
    expect(e(5, 2)).toBe(15000);
    expect(e(2, 1)).toBe(5000);
    expect(e(0, 3)).toBe(10000);
    expect(e(3, 0)).toBe(10000);
  });
});

describe('Schild, DoT, Boss', () => {
  const ctx = ctxFor();
  const world = (): World => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    return { state: mutable(sim), ctx, events: [], unitMods: [] };
  };
  it('Schild-Stack: jede Schadensinstanz entfernt 1 Stack ohne HP-Schaden', () => {
    const w = world();
    const e = enemy(ctx, 'grunt', 13);
    e.shield = 3;
    const hp0 = e.hp;
    for (let i = 0; i < 3; i++) expect(applyDamage(w, e, 5000, 0, null, false)).toBe(0);
    expect(e.shield).toBe(0);
    expect(e.hp).toBe(hp0);
    expect(applyDamage(w, e, 500, 0, null, false)).toBe(500);
    expect(e.hp).toBe(hp0 - 500);
  });
  it('True Damage / DoT umgehen den Schild', () => {
    const w = world();
    const e = enemy(ctx, 'grunt', 13);
    e.shield = 2;
    expect(applyDamage(w, e, 700, 0, null, true)).toBe(700);
    expect(e.shield).toBe(2);
  });
  it('Boss und Elite nehmen DoT x0,5', () => {
    const g = enemy(ctx, 'grunt');
    const b = enemy(ctx, 'boss', 10);
    const el = enemy(ctx, 'elite', 5);
    for (const e of [g, b, el]) applyDot(e, 'bleed', 1200, 120, 0, 1, eco);
    expect(g.bleed?.perIntervalCenti).toBe(200);
    expect(b.bleed?.perIntervalCenti).toBe(100);
    expect(el.bleed?.perIntervalCenti).toBe(100);
  });
  it('Schadensanteil wird auf die verbleibende HP begrenzt (kein Overkill-Anteil)', () => {
    const w = world();
    const e = enemy(ctx, 'grunt');
    e.hp = 300;
    applyDamage(w, e, 5000, 0, null, false);
    expect(e.dmgShare[0]).toBe(300);
  });
});

describe('HP-Kette', () => {
  it('Grunt-HP-Kurve 25 * g^(n-1) exakt in Centi-HP (g kalibriert: docs/balancing/kalibrierung.md #2)', () => {
    const ctx = ctxFor();
    const g = BigInt(data.enemies.hpCurve.growthBp);
    const exact = (n: number): number => Number((2500n * g ** BigInt(n - 1)) / 10000n ** BigInt(n - 1));
    expect(ctx.hpGrunt(1)).toBe(2500);
    for (const n of [2, 10, 20]) expect(ctx.hpGrunt(n)).toBe(exact(n));
    expect(ctx.hpGrunt(2)).toBe(Math.floor((2500 * data.enemies.hpCurve.growthBp) / 10000));
  });
  it('Schwierigkeit und Koop-Faktor skalieren HP, Bounty-Basis nur mit Koop', () => {
    const solo = enemy(ctxFor(1, 'normal'), 'grunt', 10);
    const hard = enemy(ctxFor(1, 'hard'), 'grunt', 10);
    const coop = enemy(ctxFor(4, 'normal'), 'grunt', 10);
    expect(hard.maxHp).toBe(Math.floor((solo.maxHp * data.difficulties.hard.hpBp) / 10000));
    expect(hard.bounty).toBe(solo.bounty);
    expect(coop.maxHp).toBe(Math.floor((solo.maxHp * (10000 + 3 * data.economy.coop.hpPerExtraPlayerBp)) / 10000));
    expect(coop.bounty).toBeGreaterThan(solo.bounty * 3);
  });
});
