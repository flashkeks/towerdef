import { describe, expect, it } from 'vitest';
import { createEnemy } from '../src/systems/spawn.js';
import { resolveDeaths } from '../src/systems/economy.js';
import type { World } from '../src/state.js';
import { arena, ctxFor, data, lost, tu } from './helpers.js';

/**
 * Baukasten (Runde 8 / P1): Angriffsformen, Treffer-Teilung, Damage-Typen, Schwächen/Resistenzen, Elemente, Crit, wechselnde Angriffe.
 * Die Units sind reine Datensätze (kein Code); Slot 0 = (2000, 0), Gegner stehen eingefroren auf der Linie y = 1000 (x = Fortschritt).
 * 100 Schaden = 10 000 Centi-HP; Grunt Wave 1 hat R 0, Normal ohne Element, Leben/Schild nicht im Weg (HP-Basis 300 HP x Normal-Faktor).
 */
const A = {
  single: { aoe: 'single' },
  hits4: { aoe: 'single', hits: 4 },
  circle: { aoe: 'circle', radius: 12 }, // 12 Studs = 2,4 Kacheln
  cone: { aoe: 'cone', angle: 30 },
  line: { aoe: 'line', width: 4 }, // 4 Studs = 0,8 Kacheln
  full: { aoe: 'full' },
};
const base = (placement: 'ground' | 'hill' | 'hybrid' = 'ground', attack = 'single') => tu('t', { placement, attack, damage: 100 });
const DMG = 10000; // 100 HP in Centi

describe('Angriffsformen (alle Units sind Datensätze)', () => {
  it('single: nur das Ziel (First = größter Fortschritt)', () => {
    const { sim, put, place } = arena({ units: [base()], attacks: { single: A.single } });
    place('t');
    const front = put('grunt', 5000);
    const back = put('grunt', 4000);
    sim.step();
    expect(lost(front)).toBe(DMG);
    expect(lost(back)).toBe(0);
  });
  it('circle: Radius um das Ziel, nicht um die Unit', () => {
    const { sim, put, place } = arena({ units: [base('ground', 'circle')], attacks: { circle: A.circle } });
    place('t');
    const target = put('grunt', 5000);
    const near = put('grunt', 3000); // 2000 vom Ziel, 2400 Radius + 300 Gegnerradius
    const far = put('grunt', 2000); // 3000 vom Ziel
    sim.step();
    expect(lost(target)).toBe(DMG);
    expect(lost(near)).toBe(DMG);
    expect(lost(far)).toBe(0);
  });
  it('cone: Winkel ab der Unit Richtung Ziel, begrenzt durch die Range; nichts dahinter oder daneben', () => {
    const { sim, put, place } = arena({ units: [base('ground', 'cone')], attacks: { cone: A.cone } });
    place('t'); // (2000, 0), Ziel bei (5000, 1000)
    const target = put('grunt', 5000);
    const inside = put('grunt', 4000); // ~8 Grad neben der Zielrichtung, Kegel 30 Grad = +-15
    const side = put('grunt', 2500); // fast senkrecht zur Zielrichtung
    const behind = put('grunt', 0);
    sim.step();
    expect(lost(target)).toBe(DMG);
    expect(lost(inside)).toBe(DMG);
    expect(lost(side)).toBe(0);
    expect(lost(behind)).toBe(0);
  });
  it('line: Breite ab der Unit Richtung Ziel, bis Range', () => {
    const { sim, put, place } = arena({ units: [base('ground', 'line')], attacks: { line: A.line } });
    place('t');
    const target = put('grunt', 5000);
    const onLine = put('grunt', 6000); // dicht an der Linie
    const off = put('grunt', 2000); // direkt über der Unit, senkrecht zur Linie
    sim.step();
    expect(lost(target)).toBe(DMG);
    expect(lost(onLine)).toBe(DMG);
    expect(lost(off)).toBe(0);
  });
  it('full: alles in der Reichweite der Unit, auch hinter ihr; nichts außerhalb', () => {
    const { sim, put, place } = arena({ units: [base('ground', 'full')], attacks: { full: A.full } });
    place('t');
    const a = put('grunt', 5000);
    const behind = put('grunt', 500);
    const out = put('grunt', 12000);
    sim.step();
    expect(lost(a)).toBe(DMG);
    expect(lost(behind)).toBe(DMG);
    expect(lost(out)).toBe(0);
  });
  it('fehlender Katalog-Eintrag / aoe null = single, fehlende Parameter bekommen Standardwerte (kein Absturz)', () => {
    const { sim, put, place } = arena({ units: [tu('t', { attack: 'ghost' }), tu('c', { attack: 'bare' })], attacks: { bare: { aoe: 'circle' } } });
    place('t');
    const a = put('grunt', 5000);
    sim.step();
    expect(lost(a)).toBe(DMG);
    expect(sim.catalog().find((u) => u.id === 'c')?.levels[0].attack?.radiusMilli).toBeGreaterThan(0);
  });
});

describe('Hits: Schaden wird geteilt, nicht vervielfacht', () => {
  it('4 Treffer = gleicher Gesamtschaden wie 1 Treffer', () => {
    const one = arena({ units: [base()], attacks: { single: A.single } });
    one.place('t');
    const e1 = one.put('grunt', 5000);
    one.sim.step();
    const four = arena({ units: [base('ground', 'hits4')], attacks: { hits4: A.hits4 } });
    four.place('t');
    const e4 = four.put('grunt', 5000);
    four.sim.step();
    expect(lost(e4)).toBe(lost(e1));
  });
  it('jeder Treffer entfernt einen Schild-Stack: 4 Treffer gegen Schild 2 = halber Schaden', () => {
    const { sim, put, place } = arena({ units: [base('ground', 'hits4')], attacks: { hits4: A.hits4 } });
    place('t');
    const e = put('grunt', 5000, { shield: 2 });
    sim.step();
    expect(e.shield).toBe(0);
    expect(lost(e)).toBe(DMG / 2);
  });
  it('Flächenangriff mit Treffern: jeder Gegner der Fläche bekommt den vollen (geteilten) Schaden', () => {
    const { sim, put, place } = arena({ units: [base('ground', 'c4')], attacks: { c4: { aoe: 'circle', radius: 12, hits: 4 } } });
    place('t');
    const a = put('grunt', 5000);
    const b = put('grunt', 4500);
    sim.step();
    expect(lost(a)).toBe(DMG);
    expect(lost(b)).toBe(DMG);
  });
});

describe('Wechselnde Angriffe je Stufe', () => {
  it('Upgrade wechselt von single auf circle (Katalog-ID je Stufe)', () => {
    const unit = tu('t', { levels: 2, attacks: ['single', 'circle'] });
    const { sim, put, place } = arena({ units: [unit], attacks: { single: A.single, circle: A.circle } });
    const id = place('t');
    const a = put('grunt', 5000);
    const b = put('grunt', 4500);
    sim.step();
    expect([lost(a), lost(b)]).toEqual([DMG, 0]);
    sim.apply(0, { type: 'upgrade', entityId: id });
    sim.step(20); // Abklingzeit 1 s
    expect(lost(b)).toBe(DMG);
  });
  it('Stufen ohne eigene Angabe erben Schaden, SPA, Range und Angriff', () => {
    const unit = { ...tu('t', { levels: 3, attack: 'single' }), levels: [{ level: 0, cost: 100, damage: 100, spa: 2, range: 20, attack: 'single' }, { level: 1, cost: 100 }, { level: 2, cost: 100, damage: 300 }] };
    const { ctx } = arena({ units: [unit], attacks: { single: A.single } });
    const lv = ctx.units['t'].levels;
    expect(lv.map((l) => [l.damageCenti, l.spaTicks, l.rangeMilli, l.attack?.id])).toEqual([[DMG, 40, 4000, 'single'], [DMG, 40, 4000, 'single'], [3 * DMG, 40, 4000, 'single']]);
  });
});

describe('Damage-Typen, Schwächen, Resistenzen, Elemente', () => {
  const resist = (d: typeof data): void => {
    const g = d.enemies.archetypes.find((a) => a.id === 'grunt')!;
    g.resist = { physical: 100, magic: 0, fire: 100 };
    g.weakBp = { water: 20000, ice: 10000 };
  };
  const hit = (o: Parameters<typeof tu>[1], over = resist): number => {
    const { sim, put, place } = arena({ units: [tu('t', { attack: 'single', ...o })], attacks: { single: A.single } }, { over });
    place('t');
    const e = put('grunt', 5000);
    sim.step();
    return lost(e);
  };
  it('physical: Resistenz 100/(100+R); magic ohne R voll; true ignoriert Resistenz', () => {
    expect(hit({ damageType: 'physical' })).toBe(DMG / 2);
    expect(hit({ damageType: 'magic' })).toBe(DMG);
    expect(hit({ damageType: 'true' })).toBe(DMG);
  });
  it('Resistenz gegen ein Element der Unit kommt zur Typ-Resistenz hinzu (R = 100 + 100 = 200 -> 1/3)', () => {
    expect(hit({ damageType: 'physical', elements: ['fire'] })).toBe(Math.floor(DMG / 3));
    expect(hit({ damageType: 'true', elements: ['fire'] })).toBe(DMG);
  });
  it('Schwäche additiv: Wasser +200 %, Eis +100 % -> 1 + 2 + 1 = x4 (magic, ohne R)', () => {
    expect(hit({ damageType: 'magic', elements: ['water'] })).toBe(3 * DMG);
    expect(hit({ damageType: 'magic', elements: ['water', 'ice'] })).toBe(4 * DMG);
    expect(hit({ damageType: 'magic', elements: ['dark'] })).toBe(DMG);
  });
  it('Wave-Elemente ab Hard: ein Eis-Gegner (Element 2) ist schwach gegen Fire (+200 %), auf Normal wirkungslos', () => {
    const run = (difficulty: 'normal' | 'hard', element: number): number => {
      const { sim, put, place } = arena({ units: [tu('t', { attack: 'single', damageType: 'magic', elements: ['fire'] })], attacks: { single: A.single } }, { difficulty });
      place('t');
      const e = put('grunt', 5000, {}, 1, element);
      sim.step();
      return lost(e);
    };
    expect(run('hard', 0)).toBe(DMG);
    expect(run('hard', 2)).toBe(3 * DMG); // enemies.json elementAffinity.ice.weakBp.fire = 20000
    expect(run('normal', 2)).toBe(DMG);
  });
  it('Gegner-Rüstung (armor) gilt wie eine Resistenz gegen alle Nicht-True-Typen', () => {
    const { sim, put, place } = arena({ units: [tu('t', { attack: 'single' })], attacks: { single: A.single } });
    place('t');
    const e = put('grunt', 5000, { armor: 100 });
    sim.step();
    expect(lost(e)).toBe(DMG / 2);
  });
});

describe('Crit (Sim-PRNG)', () => {
  it('Chance 1: jeder Angriff critet (Standard x1,5, `critDamage` überstimmt); ohne Crit-Feld kein PRNG-Verbrauch', () => {
    const run = (o: Parameters<typeof tu>[1]) => {
      const a = arena({ units: [tu('t', { attack: 'single', ...o })], attacks: { single: A.single } });
      a.place('t');
      const e = a.put('grunt', 5000);
      const r0 = [...a.st.rng];
      a.sim.step();
      return { dmg: lost(e), rngMoved: JSON.stringify(a.st.rng) !== JSON.stringify(r0) };
    };
    expect(run({})).toEqual({ dmg: DMG, rngMoved: false });
    expect(run({ critChance: 1 })).toEqual({ dmg: 15000, rngMoved: true });
    expect(run({ critChance: 1, critDamage: 2 })).toEqual({ dmg: 2 * DMG, rngMoved: true });
  });
  it('Chance 0,5: deterministisch je Seed, über viele Angriffe etwa die Hälfte', () => {
    const play = (seed: number): number => {
      const a = arena({ units: [tu('t', { attack: 'single', critChance: 0.5, spa: 0.05, damage: 1 })], attacks: { single: A.single } }, { seed });
      a.place('t');
      const e = a.put('grunt', 5000, { hp: 1e12, maxHp: 1e12 });
      a.sim.step(400);
      return lost(e);
    };
    expect(play(3)).toBe(play(3));
    expect(play(3)).not.toBe(play(4));
    const hits = 400 / 1; // SPA 0,05 s = 1 Tick, 400 Angriffe; Mindestschaden 1 HP
    const normal = hits * 100;
    const withCrit = play(3);
    expect(withCrit).toBeGreaterThan(normal);
    expect(withCrit).toBeLessThan(normal * 1.5);
  });
});

describe('Flieger', () => {
  it('Boden trifft keine Flieger, Hügel/Hybrid schon; `hitsAir` überstimmt', () => {
    const run = (placement: 'ground' | 'hill' | 'hybrid', hitsAir?: boolean): boolean => {
      const unit = { ...tu('t', { placement, attack: 'single' }), hitsAir };
      const { sim, put, place } = arena({ units: [unit], attacks: { single: A.single } });
      place('t', placement === 'hill' ? 'hill' : 'ground');
      const f = put('flyer', 3000);
      sim.step();
      return lost(f) > 0;
    };
    expect(run('ground')).toBe(false);
    expect(run('hill')).toBe(true);
    expect(run('hybrid')).toBe(true);
    expect(run('ground', true)).toBe(true);
    expect(run('hill', false)).toBe(false);
  });
});

describe('Splitter, Modifier', () => {
  it('Splitter: 2 Kinder mit 35 % HP an derselben Pfadposition, Kinder-Leak 1', () => {
    const { st, ctx } = arena({});
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
    const { sim } = arena({});
    const s = sim.slotCenters()[0];
    const c3 = sim.coverage(s.x, s.y, 3000);
    const c5 = sim.coverage(s.x, s.y, 5000);
    expect(c3).toBeGreaterThan(0);
    expect(c5).toBeGreaterThan(c3);
    expect(sim.coverage(s.x, s.y, 100000)).toBe(42000);
    expect(sim.slotCenters()).toHaveLength(26);
  });
});
