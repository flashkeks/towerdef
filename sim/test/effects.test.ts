import { describe, expect, it } from 'vitest';
import { applyFx } from '../src/systems/special.js';
import { applyDot, tickEffects } from '../src/systems/effects.js';
import type { World } from '../src/state.js';
import { arena, data, lost, tu } from './helpers.js';

/**
 * Alle 22 AA-Effekte (`effects.json`, combat-system § 7), datengetrieben: jede Unit hier ist ein Datensatz mit `special`/`dot` im Angriff.
 * Slot 0 = (2000, 0); Gegner stehen eingefroren auf y = 1000. Wenn nichts anderes steht: 100 Schaden = 10 000 Centi, SPA 100 s (genau ein Angriff).
 */
const DMG = 10000;
const once = (special: unknown, extra: Record<string, unknown> = {}, o: Parameters<typeof tu>[1] = {}) => ({
  units: [tu('t', { attack: 'a', spa: 100, ...o })],
  attacks: { a: { aoe: 'single', special, ...extra } },
});
const fire = (file: ReturnType<typeof once>, setup: (a: ReturnType<typeof arena>) => void = () => {}) => {
  const a = arena(file);
  setup(a);
  a.place('t');
  const e = a.put('grunt', 5000);
  a.sim.step();
  return { a, e };
};
const world = (a: ReturnType<typeof arena>): World => ({ state: a.st, ctx: a.ctx, events: [], unitMods: [] });
const T = (s: number): number => s * 20;

describe('Effekt-Katalog', () => {
  it('alle 22 Effekte aus units.json.effects stehen im Katalog (und kompilieren), Wild Card zeigt auf Katalog-Einträge', () => {
    const names = ['Sunshine', 'Unconscious', 'Confused', 'Dismembered', 'Stun', 'Hexed (20%)', 'Knockback', 'Slow', 'Wild Card', 'Mind Control', 'Bleed Amplification', 'Cursed (30%)', 'OverCrit', 'Battlelust', 'Wither', 'Hexed (25%)', 'Timestop', 'Snatched', 'Motivate', 'Shatter', 'Freeze', 'Cursed (15%)'];
    expect(names).toHaveLength(22);
    for (const n of names) expect(data.effects.effects[n], n).toBeDefined();
    const wc = data.effects.effects['Wild Card'];
    if (wc.kind !== 'wildcard') throw new Error('Wild Card');
    for (const p of wc.pool) expect(data.effects.effects[p], p).toBeDefined();
  });
  it('unbekannter Effektname = No-op (kein Absturz), wird von unknownEffects gemeldet', async () => {
    const { unknownEffects } = await import('../src/data/compile.js');
    const a = arena(once({ name: 'Does Not Exist' }));
    expect(unknownEffects(a.data)).toEqual(['Does Not Exist']);
    a.place('t');
    const e = a.put('grunt', 5000);
    a.sim.step();
    expect(lost(e)).toBe(DMG);
  });
});

describe('CC-Gruppe: Stun, Freeze, Timestop, Walkback (eine gemeinsame Sperre)', () => {
  it('Stun: Dauer und Sperre aus dem Katalog (2 s, 12 s), `duration` im Angriff überstimmt', () => {
    for (const [special, dur] of [[{ name: 'Stun' }, 2], [{ name: 'Stun', duration: 3 }, 3]] as const) {
      const a = arena(once(special));
      a.place('t');
      const g = a.put('grunt', 5000, { stunTicks: 0 });
      a.sim.step();
      expect(g.stunTicks).toBeGreaterThan(T(dur) - 3);
      expect(g.stunTicks).toBeLessThanOrEqual(T(dur));
      expect(g.stunImmuneAfter).toBe(T(12));
    }
  });
  it('Freeze/Timestop wie Stun mit eigener Dauer und Sperre; nur eins der Gruppe zugleich', () => {
    for (const [name, dur, immune] of [['Freeze', 2.5, 11], ['Timestop', 2, 11]] as const) {
      const a = arena(once({ name }));
      a.place('t');
      const g = a.put('grunt', 5000, { stunTicks: 0 });
      a.sim.step();
      expect(g.stunTicks, name).toBeGreaterThan(T(dur) - 3);
      expect(g.stunImmuneAfter, name).toBe(T(immune));
    }
    const a = arena(once({ name: 'Stun' }));
    const g = a.put('grunt', 5000, { stunTicks: 0 });
    const w = world(a);
    const fx = a.ctx.units['t'].levels[0].attack!.fx;
    a.place('t');
    applyFx(w, a.st.units[0], g, fx[0], 0);
    const t0 = g.stunTicks;
    const freeze = arena(once({ name: 'Freeze' })).ctx.units['t'].levels[0].attack!.fx[0];
    applyFx(w, a.st.units[0], g, freeze, 0); // gesperrt: kein Refresh
    expect(g.stunTicks).toBe(t0);
  });
  it('nach dem Stun gilt die Sperre; erst danach wirkt ein neuer Stun (Dauer 2 s, Sperre 12 s)', () => {
    const a = arena(once({ name: 'Stun' }));
    a.place('t');
    const g = a.put('grunt', 5000, { stunTicks: 0 });
    const fx = a.ctx.units['t'].levels[0].attack!.fx[0];
    const w = world(a);
    applyFx(w, a.st.units[0], g, fx, 0);
    expect(g.stunTicks).toBe(T(2));
    for (let i = 0; i < T(2); i++) tickEffects(w);
    expect(g.stunImmune).toBe(T(12));
    applyFx(w, a.st.units[0], g, fx, 0);
    expect(g.stunTicks).toBe(0);
    for (let i = 0; i < T(12); i++) tickEffects(w);
    applyFx(w, a.st.units[0], g, fx, 0);
    expect(g.stunTicks).toBe(T(2));
  });
  it('Boss: halbe Dauer außerhalb eines Schwachstellen-Fensters', () => {
    const a = arena(once({ name: 'Stun' }));
    a.place('t');
    const b = a.put('boss', 5000, { stunTicks: 0 }, 10);
    applyFx(world(a), a.st.units[0], b, a.ctx.units['t'].levels[0].attack!.fx[0], 0);
    expect(b.stunTicks).toBe(T(1));
  });
  it('Unconscious: 0,5 s, stapelt mit der CC-Gruppe, keine Sperre', () => {
    const a = arena(once({ name: 'Unconscious' }));
    a.place('t');
    const g = a.put('grunt', 5000, { stunTicks: 0 });
    const w = world(a);
    const unc = a.ctx.units['t'].levels[0].attack!.fx[0];
    applyFx(w, a.st.units[0], g, unc, 0);
    expect(g.uncTicks).toBe(T(0.5));
    const stun = arena(once({ name: 'Stun' })).ctx.units['t'].levels[0].attack!.fx[0];
    applyFx(w, a.st.units[0], g, stun, 0);
    expect(g.stunTicks).toBe(T(2)); // beides gleichzeitig
    for (let i = 0; i < T(0.5); i++) tickEffects(w);
    expect(g.uncTicks).toBe(0);
    expect(g.stunImmune).toBe(0);
  });
  it('bewusstlose und betäubte Gegner bewegen sich nicht', () => {
    const a = arena(once({ name: 'Unconscious' }));
    a.place('t');
    const g = a.put('grunt', 5000, { stunTicks: 0 });
    a.sim.step(1); // Bewegung kommt vor dem Angriff: der erste Tick läuft noch
    const p0 = g.progress;
    expect(g.uncTicks).toBeGreaterThan(0);
    a.sim.step(5); // danach 0,5 s bewusstlos
    expect(g.progress).toBe(p0);
  });
  it('Confused: Gegner laufen 5 s rückwärts (bis zum Pfadanfang)', () => {
    const a = arena(once({ name: 'Confused' }));
    a.place('t');
    const g = a.put('grunt', 5000, { stunTicks: 0, progress: 5000 });
    a.sim.step(1);
    expect(g.backTicks).toBeGreaterThan(T(5) - 3);
    const p1 = g.progress;
    a.sim.step(20);
    expect(g.progress).toBeLessThan(p1);
    a.sim.step(T(5));
    expect(g.backTicks).toBe(0);
    expect(g.progress).toBeGreaterThanOrEqual(0);
  });
  it('Mind Control: 10 % Chance je Gegner (Sim-PRNG), 1,5 s; deterministisch je Seed', () => {
    const run = (seed: number): number => {
      const a = arena({ units: [tu('t', { attack: 'a', spa: 100 })], attacks: { a: { aoe: 'full', special: { name: 'Mind Control' } } } }, { seed });
      a.place('t');
      for (let i = 0; i < 200; i++) a.put('grunt', 3000 + (i % 30) * 10, { stunTicks: 0 });
      a.sim.step(1);
      return a.st.enemies.filter((e) => e.backTicks > 0).length;
    };
    const n = run(5);
    expect(n).toBeGreaterThan(8);
    expect(n).toBeLessThan(40);
    expect(run(5)).toBe(n);
  });
});

describe('Slow', () => {
  it('Standard 50 % / 3 s; `influence`/`duration` im Angriff (Stufen 65 %, 80 %) überstimmen; Cap 80 %', () => {
    const run = (sp: unknown) => fire(once(sp)).e;
    expect([run({ name: 'Slow' }).slowBp, run({ name: 'Slow' }).slowTicks]).toEqual([5000, T(3)]);
    const e = run({ name: 'Slow', duration: 2.5, influence: 0.65 });
    expect([e.slowBp, e.slowTicks]).toEqual([6500, T(2.5)]);
    expect(run({ name: 'Slow', influence: 0.8 }).slowBp).toBe(8000);
  });
  it('Slow wirkt auf die Geschwindigkeit; nach Ablauf 4 s Sperre', () => {
    const a = arena(once({ name: 'Slow', influence: 0.5, duration: 1 }));
    a.place('t');
    const g = a.put('grunt', 5000, { stunTicks: 0, progress: 5000 });
    a.sim.step(1);
    expect(g.slowTicks).toBeGreaterThan(0);
    const fx = a.ctx.units['t'].levels[0].attack!.fx[0];
    const w = world(a);
    a.sim.step(T(1));
    expect(g.slowTicks).toBe(0);
    expect(g.slowImmune).toBeGreaterThan(0);
    applyFx(w, a.st.units[0], g, fx, 0);
    expect(g.slowTicks).toBe(0); // gesperrt
    a.sim.step(T(4));
    applyFx(w, a.st.units[0], g, fx, 0);
    expect(g.slowTicks).toBe(T(1));
  });
});

describe('Knockback', () => {
  it('schiebt 2,5 Kacheln Richtung Spawn, 30 s Sperre, nie unter Pfadanfang; Boss halbe Strecke', () => {
    const a = arena(once({ name: 'Knockback' }));
    a.place('t');
    const g = a.put('grunt', 5000, { progress: 5000 });
    const b = a.put('boss', 5000, { progress: 5000 }, 10);
    const w = world(a);
    const fx = a.ctx.units['t'].levels[0].attack!.fx[0];
    applyFx(w, a.st.units[0], g, fx, 0);
    expect(g.progress).toBe(2500);
    expect(g.kbImmune).toBe(T(30));
    applyFx(w, a.st.units[0], g, fx, 0);
    expect(g.progress).toBe(2500);
    applyFx(w, a.st.units[0], b, fx, 0);
    expect(b.progress).toBe(5000 - 1250);
    const near = a.put('grunt', 1000, { progress: 1000 });
    applyFx(w, a.st.units[0], near, fx, 0);
    expect(near.progress).toBe(0);
  });
});

describe('Debuffs auf erhaltenen Schaden: Cursed, Hexed, Dismembered', () => {
  const next = (name: string, o: Parameters<typeof tu>[1]) => {
    const a = arena({ units: [tu('t', { attack: 'a', spa: 100, ...o })], attacks: { a: { aoe: 'single', special: { name } } } });
    a.place('t');
    const e = a.put('grunt', 5000);
    a.sim.step();
    return { a, e };
  };
  it('Dismembered: +20 % Physical dauerhaft; wirkt nur auf physical, nicht auf magic', () => {
    const { a, e } = next('Dismembered', {});
    expect([e.physTakenBp, e.physTakenTicks, e.magicTakenBp]).toEqual([2000, -1, 0]);
    // der nächste physische Treffer: x1,2
    const hit = arena(once({ name: 'Dismembered' }));
    hit.place('t');
    const g = hit.put('grunt', 5000, { physTakenBp: 2000, physTakenTicks: -1 });
    hit.sim.step();
    expect(lost(g)).toBe(12000);
    const m = arena({ units: [tu('t', { attack: 'a', spa: 100, damageType: 'magic' })], attacks: { a: { aoe: 'single' } } });
    m.place('t');
    const mg = m.put('grunt', 5000, { physTakenBp: 2000, physTakenTicks: -1 });
    m.sim.step();
    expect(lost(mg)).toBe(DMG);
    void a;
  });
  it('Hexed (20 %/25 %): +20/25 % Magic dauerhaft', () => {
    expect(next('Hexed (20%)', { damageType: 'magic' }).e.magicTakenBp).toBe(2000);
    const { e } = next('Hexed (25%)', { damageType: 'magic' });
    expect([e.magicTakenBp, e.magicTakenTicks]).toEqual([2500, -1]);
  });
  it('Cursed (30 %/15 %): +30/15 % Magic für 10 s, danach weg; stärkster gewinnt, kein Stapeln', () => {
    const { a, e } = next('Cursed (30%)', {});
    expect([e.magicTakenBp, e.magicTakenTicks]).toEqual([3000, T(10)]);
    const w = world(a);
    const weak = arena(once({ name: 'Cursed (15%)' })).ctx.units['t'].levels[0].attack!.fx[0];
    applyFx(w, a.st.units[0], e, weak, 0);
    expect(e.magicTakenBp).toBe(3000);
    for (let i = 0; i < T(10); i++) tickEffects(w);
    expect(e.magicTakenBp).toBe(0);
    applyFx(w, a.st.units[0], e, weak, 0);
    expect(e.magicTakenBp).toBe(1500);
  });
  it('Magic-Treffer nehmen den Zuschlag (x1,3), Wirkung im Direktschaden', () => {
    const m = arena({ units: [tu('t', { attack: 'a', spa: 100, damageType: 'magic' })], attacks: { a: { aoe: 'single' } } });
    m.place('t');
    const g = m.put('grunt', 5000, { magicTakenBp: 3000, magicTakenTicks: 100 });
    m.sim.step();
    expect(lost(g)).toBe(13000);
  });
});

describe('DoTs (Burn, Bleed, Poison, Wither) und Bleed Amplification', () => {
  const dot = (type: string, mult: number, ticks: number, total?: number) => ({ type, multiplierPerTick: mult, ticks, totalMultiplier: total });
  const total = (type: string, mult: number, ticks: number, o: Parameters<typeof tu>[1] = {}, enemyOver: Record<string, unknown> = {}) => {
    const a = arena({ units: [tu('t', { attack: 'a', spa: 100, ...o })], attacks: { a: { aoe: 'single', dot: dot(type, mult, ticks) } } });
    a.place('t');
    const e = a.put('grunt', 5000, enemyOver);
    a.sim.step();
    const direct = lost(e);
    a.sim.step(T(ticks) + 5);
    return { direct, all: lost(e), e, a };
  };
  it('Burn 0,1 x 4 Ticks = 40 % des Treffers über 4 s (1 Tick je Sekunde), wirkt als True Damage', () => {
    const r = total('Burn', 0.1, 4);
    expect(r.direct).toBe(DMG);
    expect(r.all).toBe(DMG + 4 * 1000);
    expect(r.e.dots).toHaveLength(0);
  });
  it('Bleed, Poison, Wither: gleiche Rechnung (Wither 0,2 x 3, Poison 0,05 x 20)', () => {
    expect(total('Bleed', 0.083, 3).all).toBe(DMG + 3 * 830);
    expect(total('Poison', 0.05, 20).all).toBe(DMG + 20 * 500);
    expect(total('Wither', 0.2, 3).all).toBe(DMG + 3 * 2000);
  });
  it('DoT hängt am gebufften Treffer (Level-Mod x1,5 -> DoT x1,5) und nicht an Rüstung (Basis vor Rüstung)', () => {
    const r = total('Burn', 0.1, 4, {}, { armor: 100 });
    expect(r.direct).toBe(DMG / 2);
    expect(r.all - r.direct).toBe(4 * 1000); // Rüstung ändert den DoT nicht
  });
  it('Burn gegen einen Eis-Gegner (Schwäche fire +200 %): DoT x3', () => {
    const a = arena({ units: [tu('t', { attack: 'a', spa: 100 })], attacks: { a: { aoe: 'single', dot: dot('Burn', 0.1, 4) } } }, { difficulty: 'hard' });
    a.place('t');
    const e = a.put('grunt', 5000, {}, 1, 2); // Element 2 = Eis
    a.sim.step(T(4) + 5);
    // Direktschaden ohne Fire-Element unverändert, DoT x3
    expect(lost(e)).toBe(DMG + 3 * 4000);
  });
  it('Treffer teilen den DoT mit: 3 Treffer, jeder mit dem geteilten Schaden', () => {
    const a = arena({ units: [tu('t', { attack: 'a', spa: 100 })], attacks: { a: { aoe: 'single', hits: 3, dot: dot('Bleed', 0.1, 3) } } });
    a.place('t');
    const e = a.put('grunt', 5000);
    a.sim.step();
    expect(e.dots).toHaveLength(1); // dieselbe Unit erneuert
    expect(e.dots[0].perIntervalCenti).toBe(Math.floor(((Math.floor(DMG / 3) * 3000) / 10000) / 3));
  });
  it('Bleed Amplification: Bleed-Ticks x5 für 6 s', () => {
    const a = arena(once({ name: 'Bleed Amplification' }, {}, {}));
    a.place('t');
    const e = a.put('grunt', 5000, { hp: 1e12, maxHp: 1e12 });
    const w = world(a);
    applyDot(e, 'bleed', 3000, 60, 0, 99, data.economy); // 3 Ticks x 1000
    a.sim.step(); // Angriff: Amp 5x
    expect([e.bleedAmpBp, e.bleedAmpTicks]).toEqual([50000, T(6)]);
    const hp0 = e.hp;
    for (let i = 0; i < 20; i++) tickEffects(w);
    expect(hp0 - e.hp).toBeGreaterThanOrEqual(5000);
    for (let i = 0; i < T(6); i++) tickEffects(w);
    expect(e.bleedAmpBp).toBe(0);
  });
  it('Wither (Effekt): sperrt die Heilung 5 s', () => {
    const a = arena(once({ name: 'Wither' }));
    a.place('t');
    const e = a.put('brute', 5000, { regen: true });
    a.sim.step();
    expect(e.regenBlock).toBeGreaterThan(T(5) - 3);
    e.hp = Math.floor(e.maxHp / 2);
    const w = world(a);
    w.state.tick = 20;
    const hp = e.hp;
    tickEffects(w);
    expect(e.hp).toBe(hp);
  });
});

describe('Selbst-Buffs: OverCrit, Battlelust, Snatched, Sunshine, Motivate', () => {
  it('OverCrit: garantierter Crit gegen blutende Gegner (ohne PRNG), sonst normaler Schaden', () => {
    const run = (bleeding: boolean): { dmg: number; rngMoved: boolean } => {
      const a = arena(once({ name: 'OverCrit' }));
      a.place('t');
      const e = a.put('grunt', 5000, { hp: 1e12, maxHp: 1e12 });
      if (bleeding) applyDot(e, 'bleed', 60000, 80, 0, 99, data.economy);
      const r0 = JSON.stringify(a.st.rng);
      a.sim.step();
      return { dmg: lost(e), rngMoved: JSON.stringify(a.st.rng) !== r0 };
    };
    expect(run(false)).toEqual({ dmg: DMG, rngMoved: false });
    expect(run(true)).toEqual({ dmg: 15000, rngMoved: false });
  });
  it('Battlelust: +5 % je Angriff bis +25 %, zurück auf 0 ohne Ziel', () => {
    const a = arena(once({ name: 'Battlelust' }, {}, { spa: 1 }));
    a.place('t');
    const e = a.put('grunt', 5000, { hp: 1e12, maxHp: 1e12 });
    const seen: number[] = [];
    for (let i = 0; i < 8; i++) {
      const before = lost(e);
      a.sim.step(20);
      seen.push(lost(e) - before);
    }
    expect(seen).toEqual([10000, 10500, 11000, 11500, 12000, 12500, 12500, 12500]);
    e.x = 100000; // außer Reichweite
    a.sim.step(25);
    expect(a.st.units[0].lust).toBe(0);
  });
  it('Snatched: +3 % je Angriff bis +33 % (+99 % auf der letzten Stufe), verfällt nach der Dauer', () => {
    const run = (levels: number, up: number, attacks: number) => {
      const a = arena({ units: [tu('t', { attack: 'a', spa: 1, levels })], attacks: { a: { aoe: 'single', special: { name: 'Snatched', duration: 5 } } } });
      const id = a.place('t');
      for (let k = 0; k < up; k++) a.sim.apply(0, { type: 'upgrade', entityId: id });
      const e = a.put('grunt', 5000, { hp: 1e12, maxHp: 1e12 });
      let last = 0;
      for (let i = 0; i < attacks; i++) {
        const before = lost(e);
        a.sim.step(20);
        last = lost(e) - before;
      }
      return { last, a, e };
    };
    expect(run(2, 0, 6).last).toBe(11500); // 5 Stapel vor dem 6. Angriff: +15 %
    expect(run(2, 0, 20).last).toBe(13300); // gedeckelt +33 %
    expect(run(2, 1, 40).last).toBe(19900); // letzte Stufe: Deckel +99 %, 33 Stapel
    const r = run(1, 0, 3);
    r.e.x = 100000;
    r.a.sim.step(T(6));
    expect(r.a.st.units[0].snatch).toBe(0);
  });
  it('Sunshine: wächst je beendeter Wave, bei 15 Waves x2,25 Schaden und x1,67 Reichweite', () => {
    const a = arena(once({ name: 'Sunshine' }, {}, { spa: 1, range: 10 }));
    a.place('t');
    a.sim.runWave();
    expect(a.st.units[0].sun).toBe(1);
    a.st.enemies = [];
    // 3400 entfernt: Reichweite 2000 reicht nicht, mit x1,67 = 3340 + Gegnerradius 300 schon
    const mk = (sun: number): number => {
      const b = arena(once({ name: 'Sunshine' }, {}, { spa: 1, range: 10 }));
      b.place('t');
      b.st.units[0].sun = sun;
      const far = b.put('grunt', 5400, { hp: 1e12, maxHp: 1e12, y: 0 });
      b.sim.step();
      return lost(far);
    };
    expect(mk(0)).toBe(0);
    expect(mk(15)).toBe(22500);
    expect(mk(20)).toBe(22500); // über das Maximum wächst nichts mehr
  });
  it('Sunshine: halbe Wellen = halber Zuwachs (linear)', () => {
    const a = arena(once({ name: 'Sunshine' }, {}, { spa: 1 }));
    a.place('t');
    a.st.units[0].sun = 5;
    const e = a.put('grunt', 5000, { hp: 1e12, maxHp: 1e12 });
    a.sim.step();
    expect(lost(e)).toBe(Math.floor((DMG * (10000 + Math.floor((12500 * 5) / 15))) / 10000));
  });
  it('Motivate: jeder Angriff gibt Verbündeten in Reichweite +15 % Schaden für 10 s (stapelt nicht)', () => {
    const a = arena({
      units: [tu('m', { attack: 'a', spa: 1, damage: 1, range: 25 }), tu('ally', { attack: 'b', spa: 100 })],
      attacks: { a: { aoe: 'single', special: { name: 'Motivate' } }, b: { aoe: 'single' } },
    });
    a.place('m', 'ground');
    const ground2 = a.sim.slotCenters().filter((s) => s.kind === 'ground' && s.size === 1)[1];
    const ok = a.sim.apply(0, { type: 'place', unitId: 'ally', x: ground2.x, y: ground2.y });
    expect(ok.ok).toBe(true);
    const e = a.put('grunt', 5000, { hp: 1e12, maxHp: 1e12 });
    a.sim.step();
    const ally = a.st.units.find((u) => u.defId === 'ally')!;
    expect(ally.motDmgBp).toBe(1500);
    expect(ally.motDmgTicks).toBeGreaterThanOrEqual(T(10) - 1);
    expect(lost(e)).toBe(100 + DMG * 1.15);
    a.sim.step(T(10) + 1);
    expect(a.st.units.find((u) => u.defId === 'm')!.motDmgBp).toBe(0);
    void e;
  });
});

describe('Shatter und Wild Card', () => {
  it('Shatter: entfernt alle Schild-Stacks vor dem Treffer (voller Schaden statt 1 Stack)', () => {
    const { e } = fire(once({ name: 'Shatter' }), () => {});
    expect(e.shield).toBe(0);
    const a = arena(once({ name: 'Shatter' }));
    a.place('t');
    const s = a.put('grunt', 5000, { shield: 3 });
    a.sim.step();
    expect(s.shield).toBe(0);
    expect(lost(s)).toBe(DMG);
  });
  it('Wild Card: würfelt Burn/Slow/Bleed/Freeze/Knockback mit der Sim-PRNG, alle Ausgänge kommen vor, deterministisch', () => {
    const run = (seed: number): Record<string, number> => {
      const a = arena({ units: [tu('t', { attack: 'a', spa: 100 })], attacks: { a: { aoe: 'full', special: { name: 'Wild Card' } } } }, { seed });
      a.place('t');
      for (let i = 0; i < 150; i++) a.put('grunt', 3000 + (i % 40) * 10, { stunTicks: 0, progress: 5000 });
      a.sim.step(1);
      const c: Record<string, number> = { burn: 0, bleed: 0, slow: 0, freeze: 0, knockback: 0 };
      for (const e of a.st.enemies) {
        if (e.dots.some((d) => d.kind === 'burn')) c.burn++;
        else if (e.dots.some((d) => d.kind === 'bleed')) c.bleed++;
        else if (e.slowTicks > 0) c.slow++;
        else if (e.stunTicks > 0) c.freeze++;
        else if (e.kbImmune > 0) c.knockback++;
      }
      return c;
    };
    const r = run(7);
    for (const k of Object.keys(r)) expect(r[k], k).toBeGreaterThan(10);
    expect(run(7)).toEqual(r);
  });
});

describe('Effekte brauchen null Code: jede Kombination ist ein Datensatz', () => {
  it('mehrere Specials je Angriff (Liste) wirken zusammen', () => {
    const a = arena(once([{ name: 'Slow' }, { name: 'Dismembered' }]));
    a.place('t');
    const e = a.put('grunt', 5000);
    a.sim.step();
    expect(e.slowBp).toBe(5000);
    expect(e.physTakenBp).toBe(2000);
  });
});
