import { describe, expect, it } from 'vitest';
import { Session } from '../src/game/session';
import { hasKey, t } from '../src/i18n/t';
import { cueFor } from '../src/view/feel';
import { abilityViews, describeAbility, describeAura, firstButton, hasButton, secondsLeft, typeAbility } from '../src/view/ability';
import { loadBrowserData } from '../src/sim';
import { soundsFor } from '../src/audio/logic';

/** Fähigkeiten im Client (Runde 9 / P1): Zustand der Knöpfe, Beschreibung aus den Daten, Session-Befehle, Texte. */
const place = (s: Session, unit: string): number => {
  const sim = s.sim;
  const spot = [...sim.placementGrid(unit)].filter((p) => !sim.canPlace(0, unit, p.x, p.y)).sort((a, b) => sim.coverage(b.x, b.y, 5000) - sim.coverage(a.x, a.y, 5000))[0];
  const r = sim.apply(0, { type: 'place', unitId: unit, x: spot.x, y: spot.y });
  if (!r.ok) throw new Error(r.reason);
  return r.entityId as number;
};
const rich = (s: Session): void => {
  (s.sim.state.players[0] as { coins: number }).coins = 10_000_000;
};

describe('Fähigkeiten: Ansicht', () => {
  it('Knopf-Fähigkeiten: Ring-Anteil, bereit/gesperrt, Grund der Sim', () => {
    const s = new Session('normal', 3);
    rich(s);
    const id = place(s, 'gojo_evolved');
    const def = s.sim.catalog().find((d) => d.id === 'gojo_evolved')!;
    expect(hasButton(def)).toBe(true);
    expect(firstButton(def)).toBe(0);
    const u = s.sim.state.units[0];
    let v = abilityViews(s.sim, def, u)[0];
    expect(v.ready).toBe(true);
    expect(v.ratio).toBe(1);
    expect(v.blocked).toBe('no-target'); // kein Gegner in Reichweite
    expect(s.useAbility(id)).toEqual({ ok: false, reason: 'no-target' });
    expect(s.toast?.key).toBe('error.no-target');
    // Gegner in Reichweite: ausloesen, Ring leert sich
    for (let i = 0; i < 4000 && s.sim.abilityBlocked(id, 0) !== null; i++) {
      if (s.sim.state.enemies.length === 0) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
    }
    expect(s.useAbility(id)).toEqual({ ok: true, entityId: id });
    v = abilityViews(s.sim, def, s.sim.state.units[0])[0];
    expect(v.ready).toBe(false);
    expect(v.ratio).toBeLessThan(0.01);
    expect(v.cdTicks).toBe(def.abilities[0].cooldownTicks);
    s.sim.step(def.abilities[0].cooldownTicks / 2);
    expect(abilityViews(s.sim, def, s.sim.state.units[0])[0].ratio).toBeCloseTo(0.5, 1);
  });
  it('Auto-Schalter über die Session, je Einheit und je Typ', () => {
    const s = new Session('normal', 3);
    rich(s);
    const a = place(s, 'wendy');
    const b = place(s, 'wendy');
    s.toggleAuto(a);
    expect(s.sim.state.units.find((u) => u.id === a)?.auto).toBe(1);
    expect(s.sim.state.units.find((u) => u.id === b)?.auto).toBeUndefined();
    s.toggleAutoType('wendy'); // nicht alle an: alle an
    expect(s.sim.state.units.every((u) => u.auto === 1)).toBe(true);
    s.toggleAutoType('wendy'); // alle an: alle aus
    expect(s.sim.state.units.every((u) => !u.auto)).toBe(true);
  });
  it('Zusammenfassung je Typ für die Unit-Leiste: Anzahl, bereit, kürzeste Abklingzeit', () => {
    const s = new Session('normal', 3);
    rich(s);
    const def = s.sim.catalog().find((d) => d.id === 'wendy')!;
    expect(typeAbility(s.sim.state.units, def)).toBeNull(); // keine gesetzt
    const a = place(s, 'wendy');
    place(s, 'wendy');
    expect(s.useAbilityType('wendy')).toBe(2); // Buff geht ohne Ziel
    let ta = typeAbility(s.sim.state.units, def)!;
    expect(ta.count).toBe(2);
    expect(ta.ready).toBe(0);
    expect(ta.cdTicks).toBe(def.abilities[0].cooldownTicks);
    expect(s.useAbilityType('wendy')).toBe(0);
    expect(s.toast?.key).toBe('error.cooldown');
    s.sim.step(def.abilities[0].cooldownTicks);
    ta = typeAbility(s.sim.state.units, def)!;
    expect(ta.ready).toBe(2);
    expect(a).toBeGreaterThan(0);
  });
  it('Beschreibung kommt aus den Daten; alle Texte gibt es', () => {
    const data = loadBrowserData();
    const summons = new Map(Object.entries(data.units.summons));
    expect(summons.size).toBeGreaterThanOrEqual(11);
    const s = new Session('normal', 3);
    const defs = s.sim.catalog();
    const sd = s.sim.summonDefs();
    const lines: string[] = [];
    for (const d of defs) for (const a of d.abilities) lines.push(...describeAbility(a, sd));
    expect(lines.length).toBeGreaterThanOrEqual(40);
    for (const l of lines) expect(l, l).not.toMatch(/\{\w+\}|undefined|NaN/);
    const hoshino = defs.find((d) => d.id === 'hoshino')!;
    expect(describeAura(hoshino, 0)).toContain('+5% damage');
    expect(describeAura(hoshino, 2)).toContain('+10% damage');
    expect(describeAura(defs.find((d) => d.id === 'griffith_reincarnation')!, 0)).toContain('All allies');
    for (const k of ['ability.use', 'ability.auto.on', 'ability.auto.off', 'ability.locked', 'error.cooldown', 'error.locked', 'error.no-ability', 'aura.title']) expect(hasKey(k), k).toBe(true);
    expect(t('ability.locked', { n: 3 })).toBe('Unlocks at level 3');
    expect(secondsLeft(30)).toBe('1.5');
    expect(secondsLeft(400)).toBe('20');
  });
  it('Ereignisse: Fähigkeit und Beschwörung lösen Effekt und Ton aus; automatische Auslösung bleibt leise', () => {
    const ev = { type: 'ability', tick: 1, unitId: 1, owner: 0, ability: 'x', name: 'X', auto: false } as const;
    expect(cueFor(ev)).toMatchObject({ kind: 'ability', unitId: 1, auto: false });
    expect(soundsFor(ev)).toEqual(['cutin']);
    expect(soundsFor({ ...ev, auto: true })).toEqual([]);
    expect(cueFor({ type: 'summonSpawn', tick: 1, summonId: 2, def: 'taurus', name: 'Taurus', parent: 1, x: 1000, y: 2000 })).toMatchObject({ kind: 'summon' });
    expect(cueFor({ type: 'summonEnd', tick: 1, summonId: 2, def: 'taurus', cause: 'dead', x: 1, y: 2 })).toMatchObject({ kind: 'summonEnd', cause: 'dead' });
  });
});
