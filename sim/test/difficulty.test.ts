import { describe, expect, it } from 'vitest';
import { compile } from '../src/data/compile.js';
import { loadGameData, validateGameData } from '../src/data/load.js';
import { DifficultySchema, type DifficultyId } from '../src/data/schema.js';
import { getWave } from '../src/systems/infinite.js';
import { pickVariant } from '../src/systems/rules.js';
import { createSim } from '../src/index.js';
import { createEnemy } from '../src/systems/spawn.js';
import { plainData } from './helpers.js';

const real = loadGameData();
const IDS: DifficultyId[] = ['normal', 'hard', 'nightmare'];
const ctx = (d: DifficultyId, seed: number, data = real) => compile(data, data.stages['standard20'], d, 1, { seed });
const flat = (c: ReturnType<typeof ctx>) => JSON.stringify(Array.from({ length: 20 }, (_, i) => getWave(c, i + 1)));
const baseFlat = JSON.stringify(real.stages['standard20'].waves);
const mods = (c: ReturnType<typeof ctx>) => Array.from({ length: 20 }, (_, i) => getWave(c, i + 1)).flatMap((w) => w.groups.map((g) => ({ w: w.n, t: g.type, m: g.modifiers })));

describe('Stufen-Regeln (Runde 4 / P3): Daten', () => {
  it('HP-Faktoren der Stufen sind nur Feinjustierung (höchstens 8 % Spreizung)', () => {
    const hp = IDS.map((d) => real.difficulties[d].hpBp);
    expect(Math.max(...hp) / Math.min(...hp)).toBeLessThan(1.08);
  });

  it('Stufen unterscheiden sich über Regeln: Elemente, Modifier-Dichte, Varianten, Boss-Set, Belohnung', () => {
    const [n, h, m] = IDS.map((d) => real.difficulties[d]);
    expect([n.elementsActive, h.elementsActive, m.elementsActive]).toEqual([false, true, true]);
    expect([n.elementMode, h.elementMode, m.elementMode]).toEqual(['wave', 'wave', 'mixed']);
    expect(n.modifiers.densityBp).toBe(0);
    expect(h.modifiers.densityBp).toBeGreaterThan(0);
    expect(m.modifiers.densityBp).toBeGreaterThan(h.modifiers.densityBp);
    expect(m.waveVariants[0].chanceBp).toBeGreaterThan(h.waveVariants[0].chanceBp);
    expect([n.bossAbilityTier, h.bossAbilityTier, m.bossAbilityTier]).toEqual([0, 1, 2]);
    expect(n.rewardBp).toBeLessThan(h.rewardBp);
    expect(h.rewardBp).toBeLessThan(m.rewardBp);
    // entspannt: Leben kommen zurück; fordernd (Nightmare): weniger Startleben, keine Regeneration
    expect(n.lives.regenPerWave).toBeGreaterThan(0);
    expect((m.lives.start ?? 30)).toBeLessThan(real.economy.lives.start);
  });

  it('Schema: Standardwerte für fehlende Felder, ungültige Werte werden abgelehnt', () => {
    const d = DifficultySchema.parse({ ref: 'x', hpBp: 10000, speedBp: 10000, elementsActive: false });
    expect(d).toMatchObject({ elementMode: 'wave', bossAbilityTier: 0, bountyBp: 10000, rewardBp: 10000, waveVariants: [], lives: {} });
    expect(d.modifiers.densityBp).toBe(0);
    expect(() => DifficultySchema.parse({ ref: 'x', hpBp: 10000, speedBp: 10000, elementsActive: false, bossAbilityTier: 3 })).toThrow();
    expect(() => DifficultySchema.parse({ ref: 'x', hpBp: 10000, speedBp: 10000, elementsActive: false, modifiers: { densityBp: 20000, fromWave: 1, pool: [] } })).toThrow();
  });

  it('Querprüfungen: Dichte ohne Pool, Schild über Maximum, unbekannter Typ und Verlust-Archetyp werden abgelehnt', () => {
    const a = loadGameData();
    a.difficulties.hard.modifiers.pool = [];
    expect(() => validateGameData(a)).toThrow(/Pool/);
    const b = loadGameData();
    b.difficulties.hard.modifiers.pool = [{ id: 'shield:99', weight: 1 }];
    expect(() => validateGameData(b)).toThrow(/Schild/);
    const c = loadGameData();
    c.difficulties.hard.waveVariants[0].swap = { from: 'grunt', to: 'drache', shareBp: 100 };
    expect(() => validateGameData(c)).toThrow(/drache/);
    const d = loadGameData();
    d.difficulties.hard.lives.instantLoss = ['drache'];
    expect(() => validateGameData(d)).toThrow(/instantLoss/);
  });

  it('Challenges: Datenkonzept geladen, Basis-Stufen und gesperrte Units existieren', () => {
    expect(real.challenges?.challenges.length).toBeGreaterThan(0);
    for (const c of real.challenges?.challenges ?? []) {
      expect(IDS).toContain(c.extends);
      for (const u of c.restrictions.bannedUnits) expect(real.units.units.some((x) => x.id === u)).toBe(true);
    }
    const bad = loadGameData();
    bad.challenges?.challenges.push({ id: 'x', name: 'x', extends: 'hard', overrides: {}, restrictions: { bannedUnits: ['nope'], noSell: false }, rewardBp: 10000 });
    expect(() => validateGameData(bad)).toThrow(/nope/);
  });
});

describe('Stufen-Regeln: Waves (seeded, deterministisch)', () => {
  it('Gleicher Seed -> gleiche Waves; die Waves hängen vom Seed ab (Hard, Nightmare)', () => {
    for (const d of ['hard', 'nightmare'] as const) {
      expect(flat(ctx(d, 7))).toBe(flat(ctx(d, 7)));
      const seeds = new Set([1, 2, 3, 4, 5].map((s) => flat(ctx(d, s))));
      expect(seeds.size).toBeGreaterThan(1);
    }
  });

  it('Normal: Boss-, Elite- und Basis-Anzahl bleiben; Hard/Nightmare lassen Boss und Elite unverändert', () => {
    for (const d of IDS) {
      const c = ctx(d, 3);
      for (let n = 1; n <= 20; n++) {
        const base = real.stages['standard20'].waves[n - 1];
        const w = getWave(c, n);
        for (const t of ['boss', 'elite']) {
          const strip = (gs: typeof w.groups) => gs.filter((g) => g.type === t).map((g) => ({ ...g, element: 0 }));
          expect(strip(w.groups)).toEqual(strip(base.groups));
        }
      }
    }
  });

  it('Normal: keine Modifier-Vergabe (nur die Modifier der Stage-Daten); Elemente aus', () => {
    const base = mods(ctx('normal', 1)).filter((x) => x.m.length > 0);
    const stageMods = real.stages['standard20'].waves.flatMap((w) => w.groups.filter((g) => g.modifiers.length > 0));
    expect(base.length).toBe(stageMods.length);
    expect(real.difficulties.normal.elementsActive).toBe(false);
  });

  it('Hard/Nightmare: Modifier erst ab fromWave, nie auf Boss/Elite, Nightmare dichter als Hard (Summe über 20 Seeds)', () => {
    const count = (d: DifficultyId): number => {
      let n = 0;
      for (let seed = 1; seed <= 20; seed++) {
        for (const x of mods(ctx(d, seed))) {
          if (x.m.length === 0) continue;
          n++;
          expect(['boss', 'elite']).not.toContain(x.t);
        }
      }
      return n;
    };
    const stageMods = real.stages['standard20'].waves.flatMap((w) => w.groups.filter((g) => g.modifiers.length > 0)).length * 20;
    const h = count('hard') - stageMods;
    const m = count('nightmare') - stageMods;
    expect(h).toBeGreaterThan(0);
    expect(m).toBeGreaterThan(h);
    for (const d of ['hard', 'nightmare'] as const) {
      const from = real.difficulties[d].modifiers.fromWave;
      for (let seed = 1; seed <= 20; seed++) {
        const c = ctx(d, seed);
        for (let n = 1; n < from; n++) {
          const authored = real.stages['standard20'].waves[n - 1].groups.map((g) => g.modifiers.length).reduce((a, b) => a + b, 0);
          expect(getWave(c, n).groups.map((g) => g.modifiers.length).reduce((a, b) => a + b, 0)).toBe(authored);
        }
      }
    }
  });

  it('Wellen-Varianten: swarm erhöht die Anzahl, air tauscht Grunts gegen Flyer (Gesamtzahl bleibt), nur ab fromWave', () => {
    const d = plainData();
    d.difficulties.hard.waveVariants = [
      { id: 'swarm', chanceBp: 10000, fromWave: 4, countBp: 15000, intervalBp: 8000 },
      { id: 'air', chanceBp: 0, fromWave: 4, countBp: 10000, intervalBp: 10000 },
    ];
    const c = ctx('hard', 1, d);
    expect(pickVariant(c, 3)).toBeNull();
    expect(pickVariant(c, 4)).toBe('swarm');
    const base = d.stages['standard20'].waves[5].groups.find((g) => g.type === 'grunt');
    const grunt = getWave(c, 6).groups.find((g) => g.type === 'grunt');
    expect(grunt?.count).toBe(Math.floor((((base?.count ?? 0) * 15000) / 10000)));
    expect(grunt?.intervalTicks).toBe(Math.floor(((base?.intervalTicks ?? 0) * 8000) / 10000));
    d.difficulties.hard.waveVariants = [{ id: 'air', chanceBp: 10000, fromWave: 2, countBp: 10000, intervalBp: 10000, swap: { from: 'grunt', to: 'flyer', shareBp: 5000 } }];
    const c2 = ctx('hard', 1, d);
    const w = getWave(c2, 2);
    expect(w.groups.reduce((a, g) => a + g.count, 0)).toBe(d.stages['standard20'].waves[1].groups.reduce((a, g) => a + g.count, 0));
    expect(w.groups.find((g) => g.type === 'flyer')?.count).toBe(Math.floor((d.stages['standard20'].waves[1].groups[0].count * 5000) / 10000));
  });

  it('Forcierter Modifier trifft nur reguläre Gruppen ohne eigenen Modifier', () => {
    const d = plainData();
    d.difficulties.hard.waveVariants = [{ id: 'plated', chanceBp: 10000, fromWave: 1, countBp: 10000, intervalBp: 10000, forceModifier: 'armored' }];
    const c = ctx('hard', 1, d);
    const w = getWave(c, 5);
    for (const g of w.groups) expect(g.modifiers).toEqual(g.type === 'elite' ? [] : ['armored']);
  });

  it('Element-Modus mixed: Gruppen einer Wave tragen verschiedene Elemente (Nightmare), wave: ein Element (Hard)', () => {
    const base = real.stages['standard20'].waves[2]; // Wave 3: zwei Gruppen
    expect(getWave(ctx('hard', 1), 3).groups.map((g) => g.element)).toEqual(base.groups.map((g) => g.element));
    const e = getWave(ctx('nightmare', 1), 3).groups.map((g) => g.element);
    expect(new Set(e).size).toBeGreaterThan(1);
    for (const x of e) expect(x >= 1 && x <= 5).toBe(true);
  });

  it('Basis-Stufe ohne Regeln liefert die Stage-Waves unverändert (gleiche Objekte)', () => {
    const d = plainData();
    const c = ctx('hard', 5, d);
    expect(JSON.stringify(Array.from({ length: 20 }, (_, i) => getWave(c, i + 1)))).toBe(baseFlat);
  });
});

describe('Stufen-Regeln: in der Sim wirksam', () => {
  it('Leben je Stufe: Startleben, Regeneration und Verlust-Archetypen überschreiben economy.lives', () => {
    const mk = (d: DifficultyId, data = real) => createSim({ stage: 'standard20', difficulty: d, players: 1, seed: 1, data });
    expect(mk('normal').state.maxLives).toBe(real.difficulties.normal.lives.start ?? real.economy.lives.start);
    expect(mk('nightmare').state.maxLives).toBe(real.difficulties.nightmare.lives.start ?? real.economy.lives.start);
    const d = loadGameData();
    d.difficulties.hard.lives = { start: 7, regenPerWave: 2, instantLoss: ['boss', 'elite'] };
    const sim = mk('hard', d);
    expect(sim.state.lives).toBe(7);
    expect(compile(d, d.stages['standard20'], 'hard', 1).regenLives).toBe(2);
    expect(compile(d, d.stages['standard20'], 'hard', 1).instantLoss.has('elite')).toBe(true);
    expect(compile(d, d.stages['standard20'], 'normal', 1).instantLoss.has('elite')).toBe(false);
  });

  it('Spawns tragen die vergebenen Modifier; zwei Läufe mit gleichem Seed haben gleichen Hash', () => {
    const run = (seed: number) => {
      const sim = createSim({ stage: 'standard20', difficulty: 'nightmare', players: 1, seed, data: real, godMode: true });
      let shielded = 0;
      let armored = 0;
      while (!sim.isOver() && sim.state.tick < 12000) {
        sim.step(20);
        for (const e of sim.state.enemies) {
          if (e.shield > 0) shielded++;
          if (e.armor > (real.enemies.archetypes.find((a) => a.id === e.type)?.armor ?? 0)) armored++;
        }
      }
      return { h: sim.hash(), shielded, armored };
    };
    const a = run(11);
    const b = run(11);
    expect(a).toEqual(b);
    expect(a.shielded + a.armored).toBeGreaterThan(0);
    expect(run(12).h).not.toBe(a.h);
  });

  it('bountyBp skaliert die Kill-Bounty, rewardBp und bossAbilityTier ändern die Sim nicht', () => {
    const bounty = (bp: number): number => {
      const d = plainData();
      d.difficulties.normal.bountyBp = bp;
      return createEnemy(compile(d, d.stages['standard20'], 'normal', 1), 1, 'grunt', 5, [], 0).bounty;
    };
    expect(bounty(20000)).toBeGreaterThanOrEqual(bounty(10000) * 2 - 1);
    expect(bounty(20000)).toBeLessThanOrEqual(bounty(10000) * 2 + 1);
    expect(bounty(5000)).toBeLessThan(bounty(10000));
    const run = (reward: number, tier: 0 | 1 | 2): string => {
      const d = plainData();
      d.difficulties.normal.rewardBp = reward;
      d.difficulties.normal.bossAbilityTier = tier;
      const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 2, data: d, godMode: true });
      sim.step(1500);
      return sim.hash();
    };
    expect(run(10000, 0)).toBe(run(30000, 2));
  });
});
