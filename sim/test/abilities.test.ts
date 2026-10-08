import { describe, expect, it } from 'vitest';
import { createEnemy } from '../src/systems/spawn.js';
import { arena, lost, tu } from './helpers.js';

/**
 * Fähigkeiten, Auren, Beschwörungen, Zweitangriffe (Runde 9 / P1). Jede Unit ist ein Datensatz; Slot 0 = (2000, 0), Gegner stehen eingefroren
 * auf y = 1000 (`arena`). Normaler Angriff 100 s SPA (greift nicht dazwischen), Fähigkeiten rechnen mit Stufen-Schaden 100 = 10 000 Centi.
 */
const DMG = 10000;
const T = (s: number): number => s * 20;
/** Der normale Angriff soll nichts verfälschen: alle Units ruhen (Abklingzeit weit in der Zukunft). */
const quiet = (a: { st: { units: { cd: number }[] } }): void => {
  for (const u of a.st.units) u.cd = 1e6;
};

const kit = (ability: Record<string, unknown>, o: Parameters<typeof tu>[1] = {}, extra: { attacks?: Record<string, unknown>; summons?: Record<string, unknown>; unit?: Record<string, unknown> } = {}) => ({
  units: [{ ...tu('t', { attack: 'a', spa: 100, ...o }), abilities: [{ id: 'x', name: 'X', cooldown: 30, ...ability }], ...(extra.unit ?? {}) }],
  attacks: { a: { aoe: 'single' }, nuke: { aoe: 'circle', radius: 100 }, wide: { aoe: 'full' }, ...(extra.attacks ?? {}) },
  summons: extra.summons ?? {},
});

describe('Aktive Fähigkeit (Knopf)', () => {
  it('löst den Angriff aus dem Katalog aus, mit Stufen-Schaden x damageMult; danach Abklingzeit', () => {
    const a = arena(kit({ attack: 'nuke', damageMult: 2 }));
    const id = a.place('t');
    quiet(a);
    const e1 = a.put('grunt', 5000);
    const e2 = a.put('grunt', 5200);
    expect(a.sim.abilityBlocked(id)).toBeNull();
    expect(a.sim.apply(0, { type: 'ability', entityId: id }).ok).toBe(true);
    expect(lost(e1)).toBe(2 * DMG);
    expect(lost(e2)).toBe(2 * DMG);
    expect(a.sim.apply(0, { type: 'ability', entityId: id })).toEqual({ ok: false, reason: 'cooldown' });
    expect(a.sim.abilityBlocked(id)).toBe('cooldown');
    a.sim.step(T(30) - 1);
    expect(a.sim.abilityBlocked(id)).toBe('cooldown');
    a.sim.step(1);
    expect(a.sim.abilityBlocked(id)).toBeNull();
    expect(a.sim.apply(0, { type: 'ability', entityId: id }).ok).toBe(true);
    expect(a.sim.drainEvents().filter((e) => e.type === 'ability')).toHaveLength(2);
  });
  it('ohne Ziel in Reichweite abgelehnt (no-target); global trifft die ganze Karte', () => {
    const a = arena(kit({ attack: 'nuke' }));
    const id = a.place('t');
    expect(a.sim.apply(0, { type: 'ability', entityId: id })).toEqual({ ok: false, reason: 'no-target' });
    a.put('grunt', 40000); // weit außerhalb der Reichweite (25 Studs = 5 Kacheln)
    expect(a.sim.apply(0, { type: 'ability', entityId: id })).toEqual({ ok: false, reason: 'no-target' });
    const g = arena(kit({ attack: 'wide', scope: 'global', damageMult: 3 }));
    const gid = g.place('t');
    quiet(g);
    expect(g.sim.apply(0, { type: 'ability', entityId: gid })).toEqual({ ok: false, reason: 'no-target' });
    const far = g.put('grunt', 40000);
    expect(g.sim.apply(0, { type: 'ability', entityId: gid }).ok).toBe(true);
    expect(lost(far)).toBe(3 * DMG);
  });
  it('minLevel sperrt (locked), bis die Unit die Stufe hat', () => {
    const a = arena(kit({ attack: 'nuke', minLevel: 1 }, { levels: 2 }));
    const id = a.place('t');
    a.put('grunt', 5000);
    expect(a.sim.apply(0, { type: 'ability', entityId: id })).toEqual({ ok: false, reason: 'locked' });
    expect(a.sim.apply(0, { type: 'upgrade', entityId: id }).ok).toBe(true);
    expect(a.sim.apply(0, { type: 'ability', entityId: id }).ok).toBe(true);
  });
  it('fremde Units und Units ohne Fähigkeit werden abgelehnt', () => {
    const a = arena({ units: [tu('plain', { attack: 'a' })], attacks: { a: { aoe: 'single' } } });
    const id = a.place('plain');
    expect(a.sim.apply(0, { type: 'ability', entityId: id })).toEqual({ ok: false, reason: 'no-ability' });
    expect(a.sim.apply(0, { type: 'autoAbility', entityId: id, on: true })).toEqual({ ok: false, reason: 'no-ability' });
    expect(a.sim.apply(0, { type: 'ability', entityId: 99999 })).toEqual({ ok: false, reason: 'unknown-entity' });
  });
  it('Zeitstopp-Fähigkeit: Timestop auf alle Gegner der Karte', () => {
    const a = arena(kit({ attack: 'stop', scope: 'global', damageMult: 0 }, {}, { attacks: { stop: { aoe: 'full', special: { name: 'Timestop', duration: 4 } } } }));
    const id = a.place('t');
    quiet(a);
    const e = a.put('grunt', 30000, { stunTicks: 0 });
    expect(a.sim.apply(0, { type: 'ability', entityId: id }).ok).toBe(true);
    expect(e.stunTicks).toBeGreaterThan(T(4) - 3);
  });
  it('Mehrfach-Wirkung: pulses Schläge, gleichmäßig über durationSec', () => {
    const a = arena(kit({ attack: 'wide', scope: 'global', pulses: 3, durationSec: 4, cooldown: 60 }));
    const id = a.place('t');
    quiet(a);
    const e = a.put('grunt', 5000);
    a.sim.apply(0, { type: 'ability', entityId: id });
    expect(lost(e)).toBe(DMG);
    a.sim.step(T(2));
    expect(lost(e)).toBe(2 * DMG);
    a.sim.step(T(2));
    expect(lost(e)).toBe(3 * DMG);
    a.sim.step(T(10));
    expect(lost(e)).toBe(3 * DMG);
  });
});

describe('Auto-Schalter und automatische Fähigkeiten', () => {
  it('Auto-Schalter löst die Knopf-Fähigkeit bei bereiter Abklingzeit und Gegner von selbst aus; aus = Ruhe', () => {
    const a = arena(kit({ attack: 'nuke', cooldown: 10 }));
    const id = a.place('t');
    quiet(a);
    const e = a.put('grunt', 5000);
    expect(a.sim.apply(0, { type: 'autoAbility', entityId: id, on: true }).ok).toBe(true);
    a.sim.step(1);
    expect(lost(e)).toBe(DMG);
    a.sim.step(T(10));
    expect(lost(e)).toBe(2 * DMG);
    expect(a.sim.apply(0, { type: 'autoAbility', entityId: id, on: false }).ok).toBe(true);
    a.sim.step(T(30));
    expect(lost(e)).toBe(2 * DMG);
  });
  it('trigger auto feuert ohne Schalter, aber nie ohne lebenden Gegner', () => {
    const a = arena(kit({ trigger: 'auto', attack: 'nuke', cooldown: 5 }));
    a.place('t');
    quiet(a);
    a.sim.step(T(20));
    const e = a.put('grunt', 5000);
    a.sim.step(1);
    expect(lost(e)).toBe(DMG);
  });
});

describe('Buffs und Auren', () => {
  it('Buff auf Verbündete im Radius (Schaden/Reichweite/Tempo/Crit), Dauer läuft ab', () => {
    const a = arena(kit({ buff: { damagePct: 25, tempoPct: 20, critPct: 10, durationSec: 5 }, cooldown: 60 }));
    const id = a.place('t');
    const u = a.st.units[0];
    expect(a.sim.apply(0, { type: 'ability', entityId: id }).ok).toBe(true);
    expect(u.motDmgBp).toBe(2500);
    expect(u.motTempoBp).toBe(2000);
    expect(u.motCritBp).toBe(1000);
    a.sim.step(T(5) + 1);
    expect(u.motDmgBp).toBe(0);
    expect(u.motTempoBp).toBe(0);
  });
  it('Aura: Verbündete bekommen den Buff dauerhaft, der Träger selbst nicht; der stärkere Buff gewinnt', () => {
    const file = {
      units: [{ ...tu('aura', { attack: 'a' }), aura: { damagePct: 10 } }, tu('dps', { attack: 'a', spa: 100 })],
      attacks: { a: { aoe: 'single' } },
    };
    const a = arena(file);
    const au = a.place('aura');
    const slot = a.sim.slotCenters().filter((s) => s.kind === 'ground' && s.size === 1)[1];
    const r = a.sim.apply(0, { type: 'place', unitId: 'dps', x: slot.x, y: slot.y });
    expect(r.ok).toBe(true);
    a.sim.step(3);
    const [self, other] = a.st.units;
    expect(self.id).toBe(au);
    expect(self.motDmgBp).toBe(0);
    expect(other.motDmgBp).toBe(1000);
    a.sim.step(100);
    expect(other.motDmgTicks).toBeGreaterThan(0);
  });
});

describe('Beschwörungen', () => {
  const sm = { name: 'Golem', mode: 'walk', damageMult: 0.5, spa: 2, range: 8, attack: 'a', durability: 4, blocks: true, maxAlive: 2 };
  const summoner = (extra: Record<string, unknown> = {}) => kit({ summon: { id: 'golem', count: 1 }, cooldown: 5 }, {}, { summons: { golem: { ...sm, ...extra } } });

  it('ruft ein Wesen mit Event; Limit je Beschwörer: das älteste weicht', () => {
    const a = arena(summoner());
    const id = a.place('t');
    for (let i = 0; i < 3; i++) {
      expect(a.sim.apply(0, { type: 'ability', entityId: id }).ok).toBe(true);
      a.sim.step(T(5));
    }
    expect(a.st.summons).toHaveLength(2);
    const ev = a.sim.drainEvents();
    expect(ev.filter((e) => e.type === 'summonSpawn')).toHaveLength(3);
    expect(ev.filter((e) => e.type === 'summonEnd')).toHaveLength(1);
  });
  it('Lebensdauer: nach lifetime Sekunden weg', () => {
    const a = arena(summoner({ lifetime: 3 }));
    const id = a.place('t');
    a.sim.apply(0, { type: 'ability', entityId: id });
    a.sim.step(T(3) - 1);
    expect(a.st.summons).toHaveLength(1);
    a.sim.step(2);
    expect(a.st.summons).toHaveLength(0);
  });
  it('Verkauf des Beschwörers entfernt seine Wesen', () => {
    const a = arena(summoner());
    const id = a.place('t');
    a.sim.apply(0, { type: 'ability', entityId: id });
    expect(a.st.summons).toHaveLength(1);
    a.sim.apply(0, { type: 'sell', entityId: id });
    a.sim.step(1);
    expect(a.st.summons).toHaveLength(0);
    expect(a.sim.drainEvents().some((e) => e.type === 'summonEnd' && e.cause === 'parent')).toBe(true);
  });
  it('blockt Bodengegner (Flieger und Bosse nicht), kämpft und fällt nach der Haltbarkeit', () => {
    const a = arena(summoner({ range: 1 }));
    const id = a.place('t');
    a.sim.apply(0, { type: 'ability', entityId: id });
    const sm1 = a.st.summons![0];
    const mk = (type: string, progress: number) => {
      const e = createEnemy(a.ctx, a.st.nextId++, type, 1, [], 0, progress, 0);
      a.st.enemies.push(e);
      return e;
    };
    const grunt = mk('grunt', sm1.progress - 600);
    const flyer = mk('flyer', sm1.progress - 600);
    const boss = mk('boss', sm1.progress - 600);
    a.sim.step(20);
    // der Grunt hängt vor der Beschwörung, Flieger und Boss laufen durch
    expect(grunt.progress).toBeLessThan(sm1.progress);
    expect(grunt.progress).toBeGreaterThanOrEqual(sm1.progress - 600);
    expect(flyer.progress).toBeGreaterThan(sm1.progress - 600 + 500);
    expect(boss.progress).toBeGreaterThan(sm1.progress - 600);
    expect(sm1.hp).toBeLessThan(T(4));
    a.sim.step(T(4));
    expect(a.st.summons).toHaveLength(0);
    expect(a.sim.drainEvents().some((e) => e.type === 'summonEnd' && e.cause === 'dead')).toBe(true);
  });
  it('Kamikaze: endAttack beim Fall trifft Gegner in der Nähe', () => {
    const a = arena(summoner({ attack: null, endAttack: 'nuke', endDamageMult: 4, lifetime: 2, range: 200 }));
    const id = a.place('t');
    quiet(a);
    a.sim.apply(0, { type: 'ability', entityId: id });
    const e = a.put('grunt', 5000);
    a.put('grunt', 5000); // stehen eingefroren neben der Beschwörung (nicht in deren Nähe: Reichweite 200 Studs = 40 Kacheln)
    a.sim.step(T(2));
    expect(lost(e)).toBe(0.5 * 4 * DMG);
  });
  it('stand-Beschwörung steht neben dem Beschwörer und schießt mit damageMult x Stufen-Schaden', () => {
    const a = arena(summoner({ mode: 'stand', range: 30, durability: 100 }));
    const id = a.place('t');
    a.sim.apply(0, { type: 'ability', entityId: id });
    const e = a.put('grunt', 3000);
    const s = a.st.summons![0];
    const u = a.st.units[0];
    expect(Math.abs(s.x - u.x) + Math.abs(s.y - u.y)).toBeGreaterThan(0);
    a.sim.step(T(2));
    expect(lost(e)).toBeGreaterThanOrEqual(0.5 * DMG);
    expect(a.st.units[0].damageDealt).toBeGreaterThan(0); // der Schaden gehört dem Beschwörer
  });
});

describe('Zweitangriffe (Rotation)', () => {
  it('attack und also wechseln sich ab, je ein Schlag je Abklingzeit', () => {
    const file = {
      units: [{ ...tu('t', { attack: 'one', spa: 1 }), levels: [{ level: 0, cost: 100, damage: 100, spa: 1, range: 25, attack: 'one', also: ['two'] }] }],
      attacks: { one: { aoe: 'single' }, two: { aoe: 'circle', radius: 100 } },
    };
    const a = arena(file);
    a.place('t');
    const e1 = a.put('grunt', 5000);
    const e2 = a.put('grunt', 5300);
    a.sim.step(1); // erster Schlag: single auf das vorderste Ziel
    expect(lost(e1) + lost(e2)).toBe(DMG);
    a.sim.step(20); // zweiter Schlag: circle trifft beide
    expect(lost(e1)).toBe(DMG);
    expect(lost(e2)).toBe(2 * DMG);
  });
});

describe('Determinismus', () => {
  it('gleiche Befehle, gleicher Hash', () => {
    const run = () => {
      const a = arena(kit({ attack: 'nuke', pulses: 3, durationSec: 2, summon: { id: 'g', count: 2 } }, {}, { summons: { g: { name: 'G', attack: 'a', maxAlive: 3 } } }));
      const id = a.place('t');
      a.put('grunt', 5000);
      a.sim.apply(0, { type: 'autoAbility', entityId: id, on: true });
      a.sim.step(T(40));
      return a.sim.hash();
    };
    expect(run()).toBe(run());
  });
});
