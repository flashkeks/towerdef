import { describe, expect, it } from 'vitest';
import { BossKitSchema } from '../src/data/schema.js';
import { applyStun, applyDamage } from '../src/systems/effects.js';
import { createEnemy } from '../src/systems/spawn.js';
import type { EnemyState, SimEvent, World } from '../src/state.js';
import { ctxFor, createSim, data, mutable, richData } from './helpers.js';

/** Sim mit eingefrorenem Boss (stunTicks groß, damit er nicht läuft; Kit-Zeiten laufen trotzdem). */
function mk(difficulty: 'normal' | 'hard' | 'nightmare' = 'normal', wave = 10, over: Partial<EnemyState> = {}) {
  const sim = createSim({ stage: 'standard20', difficulty, players: 1, seed: 3, data: richData() });
  const ctx = ctxFor(1, difficulty);
  const st = mutable(sim);
  const boss = createEnemy(ctx, st.nextId++, 'boss', wave, [], 0, 3000, 0);
  Object.assign(boss, { x: 3000, y: 1000, stunTicks: 100000 }, over);
  st.enemies.push(boss);
  const w: World = { state: st, ctx, events: [], unitMods: [] };
  const evs: SimEvent[] = [];
  const step = (n: number): void => {
    sim.step(n);
    evs.push(...sim.drainEvents());
  };
  return { sim, st, ctx, boss, w, step, evs };
}

describe('Boss-Kits: Daten', () => {
  it('zwei Kits für die Standard-Stage: Warden (Wave 10) und Colossus (Wave 20), Final-Boss zitiert die Mechaniken', () => {
    const ctx = ctxFor();
    expect(ctx.bossKits[10].id).toBe('warden');
    expect(ctx.bossKits[20].id).toBe('colossus');
    const kinds = (n: number): Set<string> => new Set([...ctx.bossKits[n].abilities.map((a) => a.kind), ...ctx.bossKits[n].phases.flatMap((p) => p.onEnter.map((a) => a.kind))]);
    for (const k of kinds(10)) expect(kinds(20).has(k)).toBe(true); // Mechaniken von W10 kommen in W20 wieder vor
    expect(kinds(20).has('mend')).toBe(true);
  });
  it('Schema: fallende Schwellen und Fähigkeiten-Felder werden validiert, minDifficulty hat Standard normal', () => {
    const kit = structuredClone(data.bosses!.kits[0]);
    expect(BossKitSchema.safeParse(kit).success).toBe(true);
    expect(BossKitSchema.parse(kit).abilities[0].minDifficulty).toBe('normal');
    const bad = structuredClone(kit) as { abilities: { telegraphTicks: number }[] };
    bad.abilities[0].telegraphTicks = 0;
    expect(BossKitSchema.safeParse(bad).success).toBe(false);
  });
});

describe('Boss-Kits: Phasen', () => {
  it('Phasenwechsel bei der HP-Schwelle, Schildphase mit Schild-HP und Ablauf', () => {
    const { boss, step, evs, ctx } = mk();
    const kit = ctx.bossKits[10];
    step(1);
    expect(boss.bossRun?.phase).toBe(0);
    boss.hp = Math.floor((boss.maxHp * 6400) / 10000); // knapp unter 65 %
    step(1);
    expect(boss.bossRun?.phase).toBe(1);
    const ph = evs.filter((e) => e.type === 'bossPhase');
    expect(ph).toHaveLength(1);
    expect(ph[0]).toMatchObject({ type: 'bossPhase', phase: 1, id: 'ward', kit: 'warden' });
    const ward = evs.find((e) => e.type === 'bossWard');
    expect(ward).toMatchObject({ state: 'up', hp: Math.floor((boss.maxHp * 1200) / 10000) });
    expect(boss.bossRun?.ward).toBeGreaterThan(0);
    // Ablauf nach expireTicks ohne Fenster
    const exp = (kit.phases[1].onEnter[0] as { expireTicks: number }).expireTicks;
    step(exp);
    expect(boss.bossRun?.ward).toBe(0);
    expect(evs.some((e) => e.type === 'bossWard' && e.state === 'expired')).toBe(true);
    expect(evs.some((e) => e.type === 'bossWindow' && e.open)).toBe(false);
  });
  it('mehrere Schwellen in einem Tick: Phasen werden der Reihe nach betreten', () => {
    const { boss, step, evs } = mk();
    boss.hp = Math.floor(boss.maxHp / 5); // 20 %: unter 65 % und unter 30 %
    step(1);
    expect(boss.bossRun?.phase).toBe(2);
    expect(evs.filter((e) => e.type === 'bossPhase').map((e) => (e.type === 'bossPhase' ? e.phase : -1))).toEqual([1, 2]);
  });
  it('Phasenverlauf ist deterministisch (gleicher Hash, gleiche Ereignisse)', () => {
    const run = (): { h: string; ev: string } => {
      const m = mk();
      m.step(30);
      m.boss.hp = Math.floor(m.boss.maxHp / 2);
      m.step(400);
      return { h: m.sim.hash(), ev: JSON.stringify(m.evs) };
    };
    const a = run();
    const b = run();
    expect(a.h).toBe(b.h);
    expect(a.ev).toBe(b.ev);
    expect(a.ev).toContain('bossPhase');
  });
  it('Schwierigkeits-Schnittstelle: minDifficulty schaltet Fähigkeiten und Phasen-Aktionen aus', () => {
    const normal = mk('normal', 10, { hp: 0 + 1 });
    void normal;
    // Sturm (surge, W10) erst ab Hard: Phase 2 erzwingen und lange laufen lassen
    const casts = (d: 'normal' | 'hard'): number => {
      const m = mk(d);
      m.boss.hp = Math.floor(m.boss.maxHp / 5);
      m.step(600);
      return m.evs.filter((e) => e.type === 'bossTelegraph' && e.ability === 'surge').length;
    };
    expect(casts('normal')).toBe(0);
    expect(casts('hard')).toBeGreaterThan(0);
    // zweiter Schild der Last-Stand-Phase (W20) erst ab Hard
    const wards = (d: 'normal' | 'hard'): number => {
      const m = mk(d, 20);
      m.boss.hp = Math.floor(m.boss.maxHp / 10);
      m.step(1);
      return m.evs.filter((e) => e.type === 'bossWard' && e.state === 'up').length;
    };
    expect(wards('hard')).toBe(wards('normal') + 1);
  });
});

describe('Boss-Kits: Telegraph, Beschwörung, Unterbrechung', () => {
  it('Telegraph: Ereignis zur Vorwarnzeit, Wirkung exakt telegraphTicks später, Beschwörung erscheint', () => {
    const { step, evs, ctx, st } = mk();
    const a = ctx.bossKits[10].abilities[0];
    step(a.firstTicks + a.telegraphTicks + 2);
    const tele = evs.find((e) => e.type === 'bossTelegraph');
    const cast = evs.find((e) => e.type === 'bossCast');
    if (tele?.type !== 'bossTelegraph' || cast?.type !== 'bossCast') throw new Error('Ereignisse fehlen');
    expect(tele.tick).toBe(a.firstTicks - 1);
    expect(tele.warnTicks).toBe(a.telegraphTicks);
    expect(tele.fireTick).toBe(tele.tick + tele.warnTicks);
    expect(cast.tick).toBe(tele.fireTick);
    expect(cast.interrupted).toBe(false);
    const minions = evs.filter((e) => e.type === 'spawn' && e.summon === true);
    expect(minions).toHaveLength(a.kind === 'summon' ? a.count : 0);
    expect(minions.every((e) => e.type === 'spawn' && e.enemy === 'grunt' && e.wave === 10)).toBe(true);
    expect(st.enemies.filter((e) => e.type === 'grunt').length).toBe(minions.length);
    // nächste Beschwörung frühestens cooldownTicks nach der ersten Wirkung
    expect(evs.filter((e) => e.type === 'bossTelegraph')).toHaveLength(1);
  });
  it('Stun während des Telegraphs unterbricht unterbrechbare Fähigkeiten und öffnet das Fenster', () => {
    const { boss, step, evs, w, ctx } = mk('hard');
    boss.hp = Math.floor(boss.maxHp / 5);
    boss.stunTicks = 0;
    boss.hp = Math.floor(boss.maxHp / 5);
    step(1); // Phasen 1, 2
    const surge = ctx.bossKits[10].abilities[1];
    let t = 0;
    while (!boss.bossRun?.tele && t++ < 400) {
      step(1);
      boss.stunTicks = 100000; // Boss steht still
    }
    expect(boss.bossRun?.tele?.ability).toBe(1);
    boss.stunTicks = 0;
    boss.stunImmune = 0;
    expect(applyStun(boss, 30, ctx.data.economy)).toBe(true);
    expect(boss.bossRun?.tele?.interrupted).toBe(true);
    step(surge.telegraphTicks + 1);
    const cast = evs.filter((e) => e.type === 'bossCast' && e.ability === 'surge');
    expect(cast[0]).toMatchObject({ interrupted: true });
    expect(evs.some((e) => e.type === 'bossWindow' && e.open && e.cause === 'interrupt')).toBe(true);
    expect(boss.bossRun?.hasteTicks).toBe(0); // kein Sturm
    void w;
  });
  it('ungestörter Sturm: Boss läuft schneller, danach Erschöpfungs-Fenster', () => {
    const { boss, step, evs, ctx } = mk('hard');
    boss.stunTicks = 0;
    boss.hp = Math.floor(boss.maxHp / 5);
    const s = ctx.bossKits[10].abilities[1];
    if (s.kind !== 'charge') throw new Error('charge erwartet');
    // Zeitpunkt der Wirkung abwarten
    let t = 0;
    while (!evs.some((e) => e.type === 'bossCast' && e.ability === 'surge') && t++ < 800) step(1);
    expect(boss.bossRun?.hasteTicks).toBeGreaterThan(0);
    const p0 = boss.progress * 1000 + boss.frac;
    step(10);
    const fast = boss.progress * 1000 + boss.frac - p0;
    const base = Math.floor(ctx.data.enemies.baseSpeedMilliPerSec * 1000 / 20) * ctx.enemies['boss'].fSpeedBp / 10000 * ctx.difficulty.speedBp / 10000 * 10;
    expect(fast).toBeGreaterThanOrEqual(Math.floor((base * s.speedBp) / 10000) - 10);
    step(s.durationTicks);
    expect(evs.some((e) => e.type === 'bossWindow' && e.open && e.cause === 'exhaust')).toBe(true);
  });
  it('Heilung (Colossus) wirkt ungestört und wird durch Stun verhindert', () => {
    const heal = (interrupt: boolean): number => {
      const { boss, step, ctx } = mk('normal', 20);
      boss.hp = Math.floor((boss.maxHp * 4000) / 10000); // Phase 2 (mending)
      step(1);
      const hp0 = boss.hp;
      let t = 0;
      while (!boss.bossRun?.tele && t++ < 400) step(1);
      if (interrupt) {
        boss.stunTicks = 0;
        boss.stunImmune = 0;
        applyStun(boss, 30, ctx.data.economy);
        boss.stunTicks = 100000;
      }
      step(70);
      return boss.hp - hp0;
    };
    expect(heal(false)).toBeGreaterThan(0);
    expect(heal(true)).toBe(0);
  });
});

describe('Boss-Kits: Schwachstellen-Fenster und Schild', () => {
  const world = (over: Partial<EnemyState> = {}) => {
    const m = mk('normal', 10, over);
    return m;
  };
  it('Fenster: Schaden x bp, volle Stun-Dauer ohne Sperre; außerhalb halber Stun', () => {
    const m = world();
    const e = m.boss;
    const hp0 = e.hp;
    expect(applyDamage(m.w, e, 1000, 0, null, true)).toBe(1000);
    expect(hp0 - e.hp).toBe(1000);
    e.bossRun!.vulnTicks = 50;
    e.bossRun!.vulnBp = 16000;
    expect(applyDamage(m.w, e, 1000, 0, null, true)).toBe(1600);
    // Stun: Boss halbiert, im Fenster voll und trotz Sperre
    e.stunTicks = 0;
    e.stunImmune = 0;
    e.bossRun!.vulnTicks = 0;
    applyStun(e, 30, m.ctx.data.economy);
    expect(e.stunTicks).toBe(15);
    e.stunTicks = 0;
    e.stunImmune = 100;
    expect(applyStun(e, 30, m.ctx.data.economy)).toBe(false); // Sperre
    e.bossRun!.vulnTicks = 50;
    expect(applyStun(e, 30, m.ctx.data.economy)).toBe(true);
    expect(e.stunTicks).toBe(30);
  });
  it('Schild absorbiert vor den HP (auch True Damage), Überschuss geht durch, Bruch öffnet das Fenster', () => {
    const m = world();
    const e = m.boss;
    e.hp = Math.floor((e.maxHp * 6400) / 10000);
    m.step(1);
    const ward = e.bossRun!.ward;
    expect(ward).toBeGreaterThan(0);
    const hp0 = e.hp;
    expect(applyDamage(m.w, e, ward - 100, 0, null, true)).toBe(0);
    expect(e.hp).toBe(hp0);
    expect(e.bossRun!.ward).toBe(100);
    const dealt = applyDamage(m.w, e, 600, 0, null, false);
    expect(dealt).toBe(500); // 100 Schild, 500 Überschuss
    expect(e.bossRun!.ward).toBe(0);
    expect(m.w.events.some((x) => x.type === 'bossWard' && x.state === 'broken')).toBe(true);
    const win = m.w.events.find((x) => x.type === 'bossWindow');
    expect(win).toMatchObject({ open: true, cause: 'ward', damageBp: 16000 });
    expect(e.bossRun!.vulnTicks).toBe(100);
    // Fenster schließt nach vulnTicks
    m.step(101);
    expect(e.bossRun!.vulnTicks).toBe(0);
    expect(m.evs.some((x) => x.type === 'bossWindow' && !x.open)).toBe(true);
  });
  it('Fenster in der echten Simulation: Titan-Nuke im Fenster richtet mehr Schaden an als außerhalb', () => {
    const run = (window: boolean): number => {
      const m = mk('normal', 10);
      const hill = m.sim.slots().find((s) => s.kind === 'hill')!;
      const r = m.sim.apply(0, { type: 'place', unitId: 'titan', slot: hill.id });
      if (!r.ok) throw new Error(r.reason);
      if (window) {
        m.boss.bossRun!.vulnTicks = 100;
        m.boss.bossRun!.vulnBp = 16000;
      }
      m.boss.hp = m.boss.maxHp = m.boss.maxHp * 10; // HP-Deckel (Schaden ist durch die Rest-HP begrenzt) aus dem Weg
      const hp0 = m.boss.hp;
      m.sim.apply(0, { type: 'useAbility', entityId: r.entityId as number });
      return hp0 - m.boss.hp;
    };
    expect(run(true)).toBe(Math.floor((run(false) * 16000) / 10000));
  });
});
