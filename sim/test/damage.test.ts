import { describe, expect, it } from 'vitest';
import { computeHit, type HitInput } from '../src/damage.js';
import { applyDamage, applyDot } from '../src/systems/effects.js';
import type { World } from '../src/state.js';
import { createSim } from '../src/index.js';
import { ctxFor, data, enemy, mutable } from './helpers.js';

const eco = data.economy;
const base: HitInput = {
  baseCenti: 7700, lvlBp: 14750, traitBp: 800, buffBp: 2500, selfBp: 0, vulnBp: 0, weakBp: 5000,
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
    const mk = (armor: number, pen: number) => computeHit({ ...base, armor, pen, weakBp: 0, buffBp: 0, traitBp: 0, lvlBp: 10000 }, eco).damageCenti;
    expect(mk(100, 0)).toBe(3850); // x0,5
    expect(mk(100, 40)).toBe(Math.floor((7700 * 100) / 160));
    expect(mk(40, 40)).toBe(7700);
    expect(mk(40, 90)).toBe(7700);
  });
  it('Buff-Cap +100 %, Verwundbar-Cap +100 % (Runde 8: AA-Curses bis +30 %, mehrere Quellen)', () => {
    const mk = (buffBp: number, vulnBp: number) => computeHit({ ...base, baseCenti: 10000, lvlBp: 10000, traitBp: 0, buffBp, vulnBp, weakBp: 0, armor: 0 }, eco).damageCenti;
    expect(mk(5000, 0)).toBe(15000);
    expect(mk(30000, 0)).toBe(20000);
    expect(mk(0, 5000)).toBe(15000);
    expect(mk(0, 30000)).toBe(20000);
    expect(mk(10000, 5000)).toBe(30000);
  });
  it('Crit multipliziert zuletzt', () => {
    expect(computeHit({ ...base, crit: true }, eco).damageCenti).toBe(Math.floor((19163 * 15000) / 10000));
  });
  it('Schwäche additiv: 10 000 x (1 + 4,00 + 1,50) = 65 000 (design-brief § 2.4)', () => {
    const mk = (weakBp: number) => computeHit({ ...base, baseCenti: 1_000_000, lvlBp: 10000, traitBp: 0, buffBp: 0, weakBp, armor: 0 }, eco).damageCenti;
    expect(mk(0)).toBe(1_000_000);
    expect(mk(40000 + 15000)).toBe(6_500_000);
  });
  it('Resistenz 100/(100+R): R = 150 ergibt 40 %, True Damage ignoriert sie', () => {
    const mk = (armor: number, trueDamage = false) => computeHit({ ...base, baseCenti: 10000, lvlBp: 10000, traitBp: 0, buffBp: 0, weakBp: 0, armor, trueDamage }, eco).damageCenti;
    expect(mk(150)).toBe(4000);
    expect(mk(150, true)).toBe(10000);
  });
  it('Selbst-Buffs (Battlelust, Snatched, Sunshine) wirken ohne Cap und multiplikativ zu Buffs', () => {
    const mk = (buffBp: number, selfBp: number) => computeHit({ ...base, baseCenti: 10000, lvlBp: 10000, traitBp: 0, buffBp, selfBp, weakBp: 0, armor: 0 }, eco).damageCenti;
    expect(mk(0, 12500)).toBe(22500);
    expect(mk(10000, 12500)).toBe(45000);
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
    expect(g.dots[0].perIntervalCenti).toBe(200);
    expect(b.dots[0].perIntervalCenti).toBe(100);
    expect(el.dots[0].perIntervalCenti).toBe(100);
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
  it('Grunt-HP-Kurve base * g^(n-1) exakt in Centi-HP (Basis: AA-Maßstab, enemies.json)', () => {
    const ctx = ctxFor();
    const base = BigInt(data.enemies.hpCurve.baseCenti);
    const g = BigInt(data.enemies.hpCurve.growthBp);
    const exact = (n: number): number => Number((base * g ** BigInt(n - 1)) / 10000n ** BigInt(n - 1));
    expect(ctx.hpGrunt(1)).toBe(data.enemies.hpCurve.baseCenti);
    for (const n of [2, 10, 20]) expect(ctx.hpGrunt(n)).toBe(exact(n));
    expect(ctx.hpGrunt(2)).toBe(Math.floor((data.enemies.hpCurve.baseCenti * data.enemies.hpCurve.growthBp) / 10000));
  });
  it('Schwierigkeit und Koop-Faktor skalieren HP, Bounty-Basis nur mit Koop', () => {
    const solo = enemy(ctxFor(1, 'normal'), 'grunt', 10);
    const hard = enemy(ctxFor(1, 'hard'), 'grunt', 10);
    const coop = enemy(ctxFor(4, 'normal'), 'grunt', 10);
    // Normal hat seit Runde 4 P1 selbst einen HP-Faktor (kalibrierung.md); Hard verhält sich zu Normal wie hardBp/normalBp.
    expect(Math.abs(hard.maxHp - Math.floor((solo.maxHp * data.difficulties.hard.hpBp) / data.difficulties.normal.hpBp))).toBeLessThanOrEqual(1);
    expect(hard.bounty).toBe(solo.bounty);
    // Rundung je Faktor (Schwierigkeit, Koop): +-2 Centi-HP gegen den Direktwert
    expect(Math.abs(coop.maxHp - Math.floor((solo.maxHp * data.economy.coop.hpTableBp![3]) / 10000))).toBeLessThanOrEqual(2);
    expect(coop.bounty).toBeGreaterThan(solo.bounty * 1.5); // Bounty folgt der Koop-HP (Tabelle, P5)
  });
});
