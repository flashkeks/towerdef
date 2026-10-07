import { describe, expect, it } from 'vitest';
import { createEnemy } from '../src/systems/spawn.js';
import { resolveDeaths } from '../src/systems/economy.js';
import type { EnemyState, World } from '../src/state.js';
import { at, ctxFor, createSim, data, mutable, richData } from './helpers.js';

/** Sim mit viel Geld; Gegner werden eingefroren auf Lane 1 (y = 1000, x = Fortschritt) platziert. */
function mk(difficulty: 'normal' | 'hard' = 'normal', players = 1) {
  const sim = createSim({ stage: 'standard20', difficulty, players, seed: 9, data: richData() });
  const ctx = ctxFor(players, difficulty);
  const st = mutable(sim);
  const put = (type: string, progress: number, over: Partial<EnemyState> = {}, wave = 1, element = 0): EnemyState => {
    const e = createEnemy(ctx, st.nextId++, type, wave, [], element, progress, 0);
    Object.assign(e, { x: progress, y: 1000, stunTicks: 100000 }, over);
    st.enemies.push(e);
    return e;
  };
  const place = (unit: string, slot: number): number => {
    const r = sim.apply(0, { type: 'place', unitId: unit, ...at(sim, slot) });
    if (!r.ok) throw new Error(r.reason);
    return r.entityId as number;
  };
  return { sim, st, ctx, put, place };
}
const hurt = (e: EnemyState) => e.hp < e.maxHp;

describe('Trefferflächen', () => {
  it('Blaster trifft Flieger mit airDamageBp (Runde 5 P3b), Striker (Boden) weiter nicht', () => {
    const { sim, put, place } = mk();
    place('blaster', 0);
    const fly = put('flyer', 5000);
    const near = put('flyer', 4200);
    const ground = put('grunt', 5000);
    sim.step();
    const bl = sim.catalog().find((u) => u.id === 'blaster')!;
    expect(bl.canHitAir).toBe(true);
    expect(bl.airDamageBp).toBeGreaterThan(0);
    expect(hurt(fly) && hurt(near)).toBe(true);
    expect(fly.maxHp - fly.hp).toBeLessThan(ground.maxHp - ground.hp);
    const st = sim.catalog().find((u) => u.id === 'striker')!;
    expect(st.canHitAir).toBe(false);
  });
  it('Lancer (line, Pen 40): trifft Linie, nicht daneben; Rüstung 20 wirkungslos', () => {
    const { sim, put, place } = mk();
    place('lancer', 0); // Slot 0 = (2000, 0), ground
    const a = put('brute', 5000);
    const b = put('brute', 6000);
    const off = put('brute', 2000);
    sim.step();
    expect(hurt(a)).toBe(true);
    expect(hurt(b)).toBe(true);
    expect(hurt(off)).toBe(false);
    const lancer = sim.catalog().find((u) => u.id === 'lancer')!;
    expect(a.maxHp - a.hp).toBe(lancer.levels[0].damageCenti); // Pen 40 >= R 20 -> volle Wirkung
  });
  it('Blaster (circle 1,2 Tiles): Ziel + Umgebung, Burn auf allen Getroffenen', () => {
    const { sim, put, place } = mk();
    place('blaster', 0);
    const t = put('grunt', 5000);
    const near = put('grunt', 4000);
    const far = put('grunt', 3000);
    sim.step();
    expect(hurt(t) && hurt(near)).toBe(true);
    expect(hurt(far)).toBe(false);
    expect(t.burn).not.toBeNull();
    expect(near.burn).not.toBeNull();
    expect(far.burn).toBeNull();
  });
  it('Frost (cone 60 Grad): trifft im Kegel, nicht dahinter oder seitlich; Slow aus den Daten', () => {
    const { sim, put, place } = mk();
    const hill = sim.slotCenters().find((s) => s.kind === 'hill')!; // (2000, 2000)
    place('frost', hill.id);
    const t = put('grunt', 4000); // Ziel (First)
    const inCone = put('grunt', 3500);
    const behind = put('grunt', 1000); // hinter der Unit-Richtung
    sim.step();
    expect(hurt(t) && hurt(inCone)).toBe(true);
    expect(hurt(behind)).toBe(false);
    // Slow-Stärke aus den Daten (Runde 4 P1: -20 % statt -40 %, kalibrierung.md)
    const slow = data.units.units.find((u) => u.id === 'frost')!.onHit.find((o) => o.kind === 'slow') as { pctBp: number; ticks: number };
    expect(t.slowBp).toBe(slow.pctBp);
    expect(t.slowTicks).toBe(slow.ticks);
  });
  it('Striker: Bleed auf Treffer, Rüstung senkt Direktschaden', () => {
    const { sim, put, place } = mk();
    place('striker', 0);
    const g = put('grunt', 3000);
    const b = put('brute', 4000, {}, 1); // First = größter Fortschritt: nur der Brute wird getroffen
    sim.step();
    expect(b.bleed).not.toBeNull();
    expect(g.bleed).toBeNull();
    const striker = sim.catalog().find((u) => u.id === 'striker')!;
    // Brute R20: Faktor 100/120; Direktschaden unter dem Basisschaden
    expect(b.maxHp - b.hp).toBe(Math.floor((striker.levels[0].damageCenti * 100) / 120));
  });
});

describe('Aura (§11)', () => {
  const dmg = (withBanner: 0 | 1 | 2, bannerSlot = 1): number => {
    const { sim, put, place } = mk();
    place('striker', 0); // (2000, 0)
    if (withBanner >= 1) place('banner', bannerSlot);
    if (withBanner === 2) place('banner', 2);
    const g = put('grunt', 3000);
    sim.step();
    return g.maxHp - g.hp;
  };
  it('Aura (Stufe 0) im Radius, kein Effekt außerhalb, mehrere Banner stapeln nicht (höchster zählt)', () => {
    const base = dmg(0);
    const bp = 10000 + data.units.units.find((u) => u.id === 'banner')!.aura!.damageBpByLevel[0]; // Runde 4 P1: +15 % statt +10 %
    expect(dmg(1, 1)).toBe(Math.floor((base * bp) / 10000)); // Slot 1 = (5000,0): 3 Tiles Abstand
    expect(dmg(1, 3)).toBe(base); // Slot 3 = (11000,0): außerhalb Radius 3
    expect(dmg(2)).toBe(dmg(1, 1));
  });
});

describe('Fähigkeiten', () => {
  it('Titan-Nuke: True Damage auf den stärksten Gegner (ignoriert Rüstung/Reichweite), Cooldown 45 s', () => {
    const { sim, put, place, ctx } = mk();
    const hill = sim.slotCenters().find((s) => s.kind === 'hill')!;
    const id = place('titan', hill.id);
    const grunt = put('grunt', 9000);
    const boss = put('boss', 500, {}, 10);
    const hpB = boss.hp;
    const r = sim.apply(0, { type: 'useAbility', entityId: id });
    expect(r.ok).toBe(true);
    const titan = ctx.units['titan'];
    const mul = (titan.ability as { damageMulBp: number }).damageMulBp;
    expect(hpB - boss.hp).toBe(Math.floor((titan.levels[0].damageCenti * mul) / 10000)); // Nuke-Vielfaches des Treffers (Runde 4 P1: 5x), Rüstung 40 ignoriert
    expect(hurt(grunt)).toBe(false);
    expect(sim.apply(0, { type: 'useAbility', entityId: id })).toEqual({ ok: false, reason: 'ability-cooldown' });
    sim.step(899);
    expect(sim.apply(0, { type: 'useAbility', entityId: id })).toEqual({ ok: false, reason: 'ability-cooldown' });
    sim.step(1);
    expect(sim.apply(0, { type: 'useAbility', entityId: id }).ok).toBe(true);
  });
  it('Frost-Stun: Radius, 1,5 s, Boss halb, Sperre 6 s, Abklingzeit 30 s', () => {
    const { sim, put, place } = mk();
    const hill = sim.slotCenters().find((s) => s.kind === 'hill')!; // (2000, 2000)
    const id = place('frost', hill.id);
    const tough = { stunTicks: 0, hp: 10_000_000, maxHp: 10_000_000 };
    const g = put('grunt', 2500, tough);
    const boss = put('boss', 1500, tough, 10);
    const far = put('grunt', 9000, tough);
    expect(sim.apply(0, { type: 'useAbility', entityId: id }).ok).toBe(true);
    expect(g.stunTicks).toBe(30);
    expect(boss.stunTicks).toBe(15);
    expect(far.stunTicks).toBe(0);
    sim.step(30);
    expect(g.stunImmune).toBeGreaterThan(0);
    expect(sim.apply(0, { type: 'useAbility', entityId: id })).toEqual({ ok: false, reason: 'ability-cooldown' });
    sim.step(570);
    // 30 s nach Einsatz: Cooldown vorbei; ein frischer Gegner im Radius wird wieder betäubt
    const fresh = put('grunt', 2200, tough);
    expect(sim.apply(0, { type: 'useAbility', entityId: id }).ok).toBe(true);
    expect(fresh.stunTicks).toBe(30);
  });
  it('Ability ohne Fähigkeit / fremde Unit', () => {
    const { sim, place } = mk('normal', 2);
    const id = place('striker', 0);
    expect(sim.apply(0, { type: 'useAbility', entityId: id })).toEqual({ ok: false, reason: 'no-ability' });
    expect(sim.apply(1, { type: 'upgrade', entityId: id })).toEqual({ ok: false, reason: 'not-owner' });
    expect(sim.apply(1, { type: 'sell', entityId: id })).toEqual({ ok: false, reason: 'not-owner' });
    expect(sim.apply(0, { type: 'setTargeting', entityId: id, mode: 'last' }).ok).toBe(true);
    const banner = sim.apply(0, { type: 'place', unitId: 'banner', ...at(sim, 1) });
    expect(sim.apply(0, { type: 'setTargeting', entityId: (banner as { entityId: number }).entityId, mode: 'last' })).toEqual({ ok: false, reason: 'no-targeting' });
  });
});

describe('Elemente ab Hard, Crit, Splitter', () => {
  it('Normal: Elemente inaktiv; Hard: Striker (Element 1) gegen Element 2 = x1,2, gegen 4 = x0,8', () => {
    const run = (diff: 'normal' | 'hard', el: number): number => {
      const { sim, put, place } = mk(diff);
      place('striker', 0);
      const g = put('grunt', 3000, {}, 1, el);
      sim.step();
      return g.maxHp - g.hp;
    };
    const base = run('normal', 2);
    expect(run('normal', 4)).toBe(base);
    const hardNeutral = run('hard', 0);
    expect(run('hard', 2)).toBe(Math.floor((hardNeutral * 12000) / 10000));
    expect(run('hard', 4)).toBe(Math.floor((hardNeutral * 8000) / 10000));
  });
  it('Nur Crit-Units verbrauchen PRNG-Werte', () => {
    const a = mk();
    a.place('striker', 0);
    a.put('grunt', 3000);
    const r0 = [...a.st.rng];
    a.sim.step(5);
    expect(a.st.rng).toEqual(r0);
    const b = mk();
    b.place('gunner', b.sim.slotCenters().find((s) => s.kind === 'hill')!.id);
    b.put('grunt', 3000);
    const r1 = [...b.st.rng];
    b.sim.step(5);
    expect(b.st.rng).not.toEqual(r1);
  });
  it('Splitter: 2 Kinder mit 35 % HP an derselben Pfadposition, Kinder-Leak 1', () => {
    const { st, ctx } = mk();
    const w: World = { state: st, ctx, events: [], unitMods: [] };
    const sp = createEnemy(ctx, st.nextId++, 'splitter', 15, [], 0, 12345, 77);
    sp.hp = 0;
    st.enemies.push(sp);
    resolveDeaths(w);
    expect(st.enemies).toHaveLength(2);
    for (const c of st.enemies) {
      expect(c.type).toBe('splitter_child');
      expect(c.progress).toBe(12345);
      expect(c.leak).toBe(1);
      // 35 % der Eltern-HP; die Normal-Stufe trägt seit Runde 4 P1 einen HP-Faktor, Rundung je Faktor (+-1 Centi-HP)
      const parent = Math.floor((ctx.hpGrunt(15) * data.difficulties.normal.hpBp) / 10000);
      expect(Math.abs(c.maxHp - Math.floor((parent * 3500) / 10000))).toBeLessThanOrEqual(1);
    }
    expect(st.enemies[0].id).toBeLessThan(st.enemies[1].id);
  });
  it('Modifier: Armored +80, Shield, Fast, Regen', () => {
    const ctx = ctxFor();
    const e = createEnemy(ctx, 1, 'brute', 17, ['armored', 'shield:3', 'fast', 'regen'], 0);
    expect(e.armor).toBe(100);
    expect(e.shield).toBe(3);
    expect(e.regen).toBe(true);
    const plain = createEnemy(ctx, 2, 'brute', 17, [], 0);
    expect(e.speedMicro).toBe(Math.floor((plain.speedMicro * 13000) / 10000));
    expect(data.modifiers.armored.armorBonus).toBe(80);
  });
});

describe('Abdeckung (freie Positionen)', () => {
  it('Abdeckung: Pfadlänge in Reichweite wächst mit der Reichweite und ist durch die Pfadlänge begrenzt', () => {
    const { sim } = mk();
    const s = sim.slotCenters()[0];
    const c3 = sim.coverage(s.x, s.y, 3000);
    const c5 = sim.coverage(s.x, s.y, 5000);
    expect(c3).toBeGreaterThan(0);
    expect(c5).toBeGreaterThan(c3);
    expect(sim.coverage(s.x, s.y, 100000)).toBe(42000);
    expect(sim.slotCenters()).toHaveLength(26);
  });
});
