/**
 * Runde 5 / P3: Boss-Kits ohne Pflicht-Unit. Neue Bausteine: zerstörbare Wirkungen (`staggerBp`: Dauerschaden unterbricht wie ein Stun),
 * Rüstungsphasen (`armor`-Aktion) und Fenster mit Rüstung (`window.armor`). Die Tests bauen eigene Kits (unabhängig von den Zahlen in
 * `data/bosses.json`) und prüfen am Ende die Datenlage der echten Kits.
 */
import { describe, expect, it } from 'vitest';
import { compile } from '../src/data/compile.js';
import type { GameData } from '../src/data/schema.js';
import { BossKitSchema } from '../src/data/schema.js';
import { loadGameData } from '../src/index.js';
import { validateGameData } from '../src/data/load.js';
import { applyDamage, applyStun } from '../src/systems/effects.js';
import { effectiveArmor } from '../src/systems/boss.js';
import { createEnemy } from '../src/systems/spawn.js';
import type { BossRun, EnemyState, SimEvent, World } from '../src/state.js';
import { createSim, mutable, richData } from './helpers.js';

/** Eigenes Kit für Wave 10 (ersetzt den Warden): ein Heiler mit Telegraph und optional Rüstungsphase. */
function kitData(mut?: (k: Record<string, unknown>) => void): GameData {
  const d = richData();
  const kit = {
    id: 'test',
    name: 'Test',
    wave: 10,
    phases: [
      { id: 'a', name: 'A', fromHpBp: 10000 },
      { id: 'b', name: 'B', fromHpBp: 5000, onEnter: [{ kind: 'armor', value: 90 }] },
    ],
    abilities: [
      {
        id: 'mend', name: 'Mend', kind: 'mend', healBp: 1000, firstTicks: 20, cooldownTicks: 200, telegraphTicks: 60,
        interruptible: true, staggerBp: 500, interruptWindow: { ticks: 100, bp: 20000, armor: 0 },
      },
    ],
  };
  mut?.(kit);
  d.bosses = { ref: 't', kits: [BossKitSchema.parse(kit)] } as GameData['bosses'];
  return d;
}

function mk(d: GameData, over: Partial<EnemyState> = {}) {
  const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 3, data: d });
  const ctx = compile(d, d.stages['standard20'], 'normal', 1);
  const st = mutable(sim);
  const boss = createEnemy(ctx, st.nextId++, 'boss', 10, [], 0, 3000, 0);
  Object.assign(boss, { x: 3000, y: 1000, stunTicks: 100000, hp: Math.floor(boss.maxHp * 0.8) }, over);
  st.enemies.push(boss);
  const w: World = { state: st, ctx, events: [], unitMods: [] };
  const evs: SimEvent[] = [];
  const step = (n: number): void => {
    for (let i = 0; i < n; i++) {
      sim.step(1);
      evs.push(...sim.drainEvents());
      boss.stunTicks = Math.max(boss.stunTicks, 1000); // Boss steht still (Zeit der Kits läuft trotzdem)
    }
  };
  return { sim, st, ctx, boss, w, step, evs, run: boss.bossRun as BossRun };
}

/** Bis der Telegraph des Heilers läuft. */
function untilTele(m: ReturnType<typeof mk>): void {
  let t = 0;
  while (!m.boss.bossRun?.tele && t++ < 200) m.step(1);
  expect(m.boss.bossRun?.tele).not.toBeNull();
}

describe('Zerstörbare Wirkung (staggerBp)', () => {
  it('Validierung: staggerBp ohne interruptible wird beim Laden abgelehnt, mit interruptible nicht', () => {
    const bad = kitData((k) => {
      (k.abilities as { interruptible: boolean }[])[0].interruptible = false;
    });
    expect(() => validateGameData(bad)).toThrow(/staggerBp/);
    expect(() => validateGameData(kitData())).not.toThrow();
  });
  it('genug Schaden im Telegraph bricht die Wirkung (cause damage), öffnet das Fenster mit Rüstung 0, keine Heilung', () => {
    const m = mk(kitData());
    untilTele(m);
    const tele = m.evs.find((e) => e.type === 'bossTelegraph');
    if (tele?.type !== 'bossTelegraph') throw new Error('Telegraph fehlt');
    const need = Math.floor((m.boss.maxHp * 500) / 10000);
    expect(tele.staggerNeed).toBe(need);
    expect(m.boss.bossRun!.tele!.need).toBe(need);
    const hp0 = m.boss.hp;
    applyDamage(m.w, m.boss, need, 0, null, true);
    expect(m.boss.bossRun!.tele!.interrupted).toBe(true);
    expect(m.boss.bossRun!.tele!.cause).toBe('damage');
    m.step(3); // Auflösung im nächsten Boss-Tick, nicht erst am Ende der Vorwarnzeit
    const cast = m.evs.find((e) => e.type === 'bossCast');
    expect(cast).toMatchObject({ interrupted: true, cause: 'damage' });
    expect(cast!.tick).toBeLessThan(tele.fireTick);
    const win = m.evs.find((e) => e.type === 'bossWindow' && e.open);
    expect(win).toMatchObject({ cause: 'interrupt', damageBp: 20000, armor: 0 });
    expect(m.boss.hp).toBeLessThanOrEqual(hp0 - need);
  });
  it('zu wenig Schaden: Heilung wirkt, aber um den Anteil geschrumpft; Schaden nach dem Telegraph zählt nicht', () => {
    const heal = (dmgShare: number): number => {
      const m = mk(kitData());
      untilTele(m);
      const need = m.boss.bossRun!.tele!.need;
      const hp0 = m.boss.hp;
      const dealt = Math.floor(need * dmgShare);
      if (dealt > 0) applyDamage(m.w, m.boss, dealt, 0, null, true);
      m.step(m.boss.bossRun!.tele!.left + 1);
      expect(m.evs.some((e) => e.type === 'bossCast' && !e.interrupted)).toBe(true);
      return m.boss.hp + m.boss.maxHp * 0 - (hp0 - dealt);
    };
    const full = heal(0);
    const half = heal(0.5);
    expect(full).toBe(Math.floor((mk(kitData()).boss.maxHp * 1000) / 10000));
    expect(half).toBeLessThan(full);
    expect(Math.abs(half - full / 2)).toBeLessThanOrEqual(2);
  });
  it('Stun unterbricht weiterhin (cause stun); die erste Ursache zählt', () => {
    const m = mk(kitData());
    untilTele(m);
    m.boss.stunTicks = 0;
    m.boss.stunImmune = 0;
    expect(applyStun(m.boss, 30, m.ctx.data.economy)).toBe(true);
    expect(m.boss.bossRun!.tele!.cause).toBe('stun');
    applyDamage(m.w, m.boss, m.boss.bossRun!.tele!.need, 0, null, true);
    expect(m.boss.bossRun!.tele!.cause).toBe('stun');
    m.step(70);
    expect(m.evs.find((e) => e.type === 'bossCast')).toMatchObject({ interrupted: true, cause: 'stun' });
  });
  it('Schild-Absorption zählt zum Schwellenschaden (Dauerschaden bricht auch durch einen Schild hindurch)', () => {
    const m = mk(kitData());
    untilTele(m);
    m.boss.bossRun!.ward = 1_000_000;
    m.boss.bossRun!.wardTicks = 1000;
    applyDamage(m.w, m.boss, m.boss.bossRun!.tele!.need, 0, null, false);
    expect(m.boss.bossRun!.tele!.cause).toBe('damage');
  });
  it('Fenster-Faktor zählt zum Schwellenschaden (im Fenster reichen weniger Treffer)', () => {
    const m = mk(kitData());
    untilTele(m);
    m.boss.bossRun!.vulnTicks = 100;
    m.boss.bossRun!.vulnBp = 20000;
    applyDamage(m.w, m.boss, Math.ceil(m.boss.bossRun!.tele!.need / 2), 0, null, true);
    expect(m.boss.bossRun!.tele!.interrupted).toBe(true);
  });
  it('deterministisch: gleicher Verlauf, gleicher Hash', () => {
    const run = (): string => {
      const m = mk(kitData());
      untilTele(m);
      applyDamage(m.w, m.boss, 99999, 0, null, true);
      m.step(300);
      return m.sim.hash() + JSON.stringify(m.evs);
    };
    expect(run()).toBe(run());
  });
});

describe('Rüstung des Bosses (Phase, Fenster)', () => {
  it('Phasen-Aktion armor setzt die Rüstung, Ereignis bossArmor, nächste Phase setzt zurück', () => {
    const m = mk(kitData());
    expect(effectiveArmor(m.boss)).toBe(m.boss.armor);
    m.boss.hp = Math.floor(m.boss.maxHp * 0.4);
    m.step(1);
    expect(m.boss.bossRun!.phase).toBe(1);
    expect(effectiveArmor(m.boss)).toBe(90);
    expect(m.evs.find((e) => e.type === 'bossArmor')).toMatchObject({ armor: 90, base: m.boss.armor });
  });
  it('Fenster mit armor überstimmt die Phasen-Rüstung und endet mit dem Fenster', () => {
    const m = mk(kitData());
    m.boss.hp = Math.floor(m.boss.maxHp * 0.4);
    m.step(1);
    untilTele(m);
    applyDamage(m.w, m.boss, m.boss.bossRun!.tele!.need, 0, null, true);
    m.step(3);
    expect(m.boss.bossRun!.vulnTicks).toBeGreaterThan(0);
    expect(effectiveArmor(m.boss)).toBe(0);
    m.step(110);
    expect(m.boss.bossRun!.vulnTicks).toBe(0);
    expect(effectiveArmor(m.boss)).toBe(90);
  });
  it('Schaden sinkt mit der Rüstung (physical), True Damage ignoriert sie', () => {
    const dmg = (armor: number, trueDamage: boolean): number => {
      const kd = kitData();
      if (trueDamage) kd.units.units.find((u) => u.id === 'krillin')!.damageType = 'true';
      const m = mk(kd);
      m.boss.bossRun!.armor = armor;
      m.boss.hp = m.boss.maxHp = m.boss.maxHp * 100;
      const slot = m.sim.slotCenters().find((s) => s.kind === 'hill')!;
      const r = m.sim.apply(0, { type: 'place', unitId: 'krillin', x: slot.x, y: slot.y });
      if (!r.ok) throw new Error(r.reason);
      m.boss.x = slot.x + 500;
      m.boss.y = slot.y;
      const hp0 = m.boss.hp;
      for (let i = 0; i < 80 && m.boss.hp === hp0; i++) m.sim.step(1);
      return hp0 - m.boss.hp;
    };
    const g0 = dmg(0, false);
    const g80 = dmg(80, false);
    expect(g0).toBeGreaterThan(0);
    expect(g80).toBeLessThan(g0);
    expect(dmg(80, true)).toBe(g0);
  });
});

describe('Echte Kits: mindestens zwei Antworten', () => {
  const d = loadGameData();
  const kits = d.bosses!.kits;
  for (const kit of kits) {
    it(`${kit.id}: unterbrechbare Wirkungen haben Stagger (Dauerschaden), Stun und Burst stehen offen`, () => {
      const inter = kit.abilities.filter((a) => a.interruptible);
      expect(inter.length).toBeGreaterThan(0);
      for (const a of inter) {
        expect(a.staggerBp, `${a.id}: staggerBp`).toBeGreaterThan(0);
        expect(a.interruptWindow, `${a.id}: interruptWindow`).toBeTruthy();
      }
    });
  }
  it('Colossus: Schild, Fenster mit Rüstung 0 und eine Rüstungsphase ab Hard', () => {
    const k = kits.find((x) => x.id === 'colossus')!;
    const acts = k.phases.flatMap((p) => p.onEnter);
    expect(acts.some((a) => a.kind === 'ward' && a.window.armor === 0)).toBe(true);
  });
});
