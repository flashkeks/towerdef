import { describe, expect, it } from 'vitest';
import { applyDot, applySlow, applyStun, tickEffects } from '../src/systems/effects.js';
import { ctxFor, createSim, data, enemy, mutable } from './helpers.js';
import type { World } from '../src/state.js';

const eco = data.economy;
const ctx = ctxFor();

function worldWith(...enemies: ReturnType<typeof enemy>[]): World {
  const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
  const st = mutable(sim);
  st.enemies.push(...enemies);
  return { state: st, ctx, events: [], unitMods: [] };
}

describe('Stun (§10)', () => {
  it('1,5 s Stun, danach 6 s Sperre, danach wieder möglich', () => {
    const e = enemy(ctx, 'grunt');
    const w = worldWith(e);
    expect(applyStun(e, 30, eco)).toBe(true);
    expect(e.stunTicks).toBe(30);
    expect(applyStun(e, 30, eco)).toBe(false); // kein Refresh während Stun
    for (let i = 0; i < 30; i++) tickEffects(w);
    expect(e.stunTicks).toBe(0);
    expect(e.stunImmune).toBe(120);
    expect(applyStun(e, 30, eco)).toBe(false);
    for (let i = 0; i < 119; i++) tickEffects(w);
    expect(applyStun(e, 30, eco)).toBe(false); // 1 Tick Sperre übrig
    tickEffects(w);
    expect(e.stunImmune).toBe(0);
    expect(applyStun(e, 30, eco)).toBe(true);
  });
  it('Boss: halbe Stun-Dauer, Sperre unverändert', () => {
    const b = enemy(ctx, 'boss', 10);
    const w = worldWith(b);
    expect(applyStun(b, 30, eco)).toBe(true);
    expect(b.stunTicks).toBe(15);
    for (let i = 0; i < 15; i++) tickEffects(w);
    expect(b.stunImmune).toBe(120);
  });
  it('Betäubte Gegner bewegen sich nicht', () => {
    const e = enemy(ctx, 'grunt', 1, {}, 500);
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    mutable(sim).enemies.push(e);
    mutable(sim).phase = 'wave'; mutable(sim).wave = 1; mutable(sim).waveOpen = true;
    applyStun(e, 30, eco);
    sim.step(10);
    expect(e.progress).toBe(0);
    sim.step(40);
    expect(e.progress).toBeGreaterThan(0);
  });
});

describe('Slow (§10)', () => {
  it('Gesamt-Slow max -60 %', () => {
    const e = enemy(ctx, 'grunt');
    applySlow(e, 9000, 80, eco);
    expect(e.slowBp).toBe(6000);
  });
  it('stärkster Slow gewinnt, schwächerer wird ignoriert, gleicher erneuert die Dauer', () => {
    const e = enemy(ctx, 'grunt');
    expect(applySlow(e, 4000, 80, eco)).toBe(true);
    expect(applySlow(e, 2000, 200, eco)).toBe(false);
    expect(e.slowBp).toBe(4000);
    expect(e.slowTicks).toBe(80);
    expect(applySlow(e, 5000, 40, eco)).toBe(true);
    expect(e.slowBp).toBe(5000);
    expect(e.slowTicks).toBe(40);
    expect(applySlow(e, 5000, 90, eco)).toBe(true);
    expect(e.slowTicks).toBe(90);
  });
  it('Slow läuft ab und reduziert die Geschwindigkeit um den Faktor', () => {
    const e = enemy(ctx, 'grunt', 1, {}, 500);
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    mutable(sim).enemies.push(e);
    mutable(sim).phase = 'wave'; mutable(sim).wave = 1; mutable(sim).waveOpen = true;
    sim.step(20);
    const free = e.progress * 1000 + e.frac;
    expect(free).toBe(20 * 75000); // 1,5 Tiles/s = 75 Milli-Tiles je Tick
    const e2 = enemy(ctx, 'grunt', 1, {}, 501);
    mutable(sim).enemies.push(e2);
    applySlow(e2, 4000, 80, eco);
    sim.step(20);
    expect(e2.progress * 1000 + e2.frac).toBe(20 * 45000);
    sim.step(60);
    expect(e2.slowBp).toBe(0);
  });
  it('Boss: Slow-Dauer halbiert', () => {
    const b = enemy(ctx, 'boss', 10);
    applySlow(b, 4000, 80, eco);
    expect(b.slowTicks).toBe(40);
  });
});

describe('DoT (§10)', () => {
  it('gleicher Typ erneuert nur (kein Stapeln), verschiedene Typen stapeln', () => {
    const e = enemy(ctx, 'grunt', 10);
    applyDot(e, 'bleed', 1200, 120, 0, 1, eco);
    const per = e.bleed?.perIntervalCenti;
    e.bleed!.ticksLeft = 10;
    applyDot(e, 'bleed', 1200, 120, 0, 1, eco);
    expect(e.bleed?.ticksLeft).toBe(120);
    expect(e.bleed?.perIntervalCenti).toBe(per);
    applyDot(e, 'burn', 800, 80, 0, 1, eco);
    expect(e.burn).not.toBeNull();
    expect(e.bleed).not.toBeNull();
    // Gesamtschaden über die Dauer: bleed 6 x 200 + burn 4 x 200
    const w = worldWith(e);
    const hp0 = e.hp;
    for (let i = 0; i < 120; i++) tickEffects(w);
    expect(hp0 - e.hp).toBe(6 * 200 + 4 * 200);
    expect(e.bleed).toBeNull();
    expect(e.burn).toBeNull();
  });
  it('Regen 2 %/s, Bleed und Poison stoppen sie, Burn nicht', () => {
    const mk = () => enemy(ctx, 'brute', 12, { regen: true });
    const e = mk();
    e.hp = Math.floor(e.maxHp / 2);
    const w = worldWith(e);
    w.state.tick = 20;
    tickEffects(w);
    expect(e.hp).toBe(Math.floor(e.maxHp / 2) + Math.floor((e.maxHp * 200) / 10000));
    const b = mk();
    b.hp = Math.floor(b.maxHp / 2);
    applyDot(b, 'bleed', 600, 120, 0, 1, eco);
    const w2 = worldWith(b);
    w2.state.tick = 20;
    const before = b.hp;
    tickEffects(w2);
    expect(b.hp).toBe(before);
    const c = mk();
    c.hp = Math.floor(c.maxHp / 2);
    applyDot(c, 'burn', 600, 80, 0, 1, eco);
    const w3 = worldWith(c);
    w3.state.tick = 20;
    tickEffects(w3);
    expect(c.hp).toBe(Math.floor(c.maxHp / 2) + Math.floor((c.maxHp * 200) / 10000));
  });
});
