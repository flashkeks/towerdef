import { describe, expect, it } from 'vitest';
import type { GameData, StageData } from '../src/data/schema.js';
import { leakCost } from '../src/systems/move.js';
import { createSim, data, stage } from './helpers.js';
import { loadGameData, validateGameData } from '../src/data/load.js';

/** Stage mit einer einzigen Wave (nur Leaks, keine Verteidigung). */
const oneWave = (type: string, count: number, intervalTicks = 30): StageData => ({
  ...stage,
  waves: [{ n: 1, groups: [{ type, count, intervalTicks, delayTicks: 0, modifiers: [], element: 0 }] }],
});

function run(st: StageData, d?: GameData, godMode = false): ReturnType<typeof createSim> {
  const sim = createSim({ stage: st, difficulty: 'normal', players: 1, seed: 1, data: d, godMode });
  let guard = 0;
  while (!sim.isOver() && guard++ < 2000) sim.step(50);
  return sim;
}

describe('Leben und Leaks (Runde 4 / P2)', () => {
  it('Datenfelder: Basiskosten je Archetyp, Startleben, Meta-Bonus 0, keine Regeneration, nur Boss verliert sofort', () => {
    const leak = Object.fromEntries(data.enemies.archetypes.map((a) => [a.id, a.leak]));
    expect(leak).toEqual({ grunt: 2, runner: 2, brute: 5, flyer: 3, splitter: 3, splitter_child: 1, elite: 8, boss: 30 });
    expect(data.economy.lives).toMatchObject({ start: 30, metaBonus: 0, regenPerWave: 0, instantLoss: ['boss'] });
  });

  it('Startleben = start + metaBonus; metaLives überschreibt den Bonus', () => {
    expect(createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 }).state.lives).toBe(30);
    expect(createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, metaLives: 5 }).state).toMatchObject({ lives: 35, maxLives: 35 });
    const d = loadGameData();
    d.economy.lives.metaBonus = 4;
    expect(createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: d }).state.lives).toBe(34);
  });

  it('leakCost: ceil(Basis x Rest-HP / Max-HP), mindestens 1, nur Ganzzahlen', () => {
    expect(leakCost(8, 1000, 1000)).toBe(8); // voll
    expect(leakCost(8, 500, 1000)).toBe(4); // halb
    expect(leakCost(8, 501, 1000)).toBe(5); // aufrunden
    expect(leakCost(8, 1, 1000)).toBe(1); // fast tot: mindestens 1
    expect(leakCost(5, 750, 1000)).toBe(4); // 3,75 -> 4
    expect(leakCost(1, 1, 1000)).toBe(1);
    expect(Number.isInteger(leakCost(3, 333_333, 1_000_000))).toBe(true);
  });

  it('Gesunde Gegner kosten die Basis; Summe über die Stage stimmt (godMode: Leben bleiben, Kosten werden gezählt)', () => {
    // Boss-Kits aus (P4): Beschwörungen des Bosses wären zusätzliche Leaks außerhalb der Stage-Tabelle.
    const noKits = structuredClone(data);
    noKits.bosses = { ref: 'test', kits: [] };
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, godMode: true, data: noKits });
    while (!sim.isOver()) sim.step(100);
    const events = sim.drainEvents();
    const leaks = events.filter((e) => e.type === 'leak');
    let expected = 0;
    for (const w of stage.waves) for (const g of w.groups) expected += g.count * (data.enemies.archetypes.find((a) => a.id === g.type)?.leak ?? 0);
    let total = 0;
    for (const e of leaks) if (e.type === 'leak') { total += e.damage; expect(e.hp).toBe(e.maxHp); expect(e.damage).toBe(e.fatal ? 30 : leakCost(data.economy.leakDamage[e.enemy] as number, e.hp, e.maxHp)); }
    // ohne Verteidigung alle gesund: Kosten = Basis; Splitter-Eltern erzeugen beim Leak keine Kinder, daher Summe = Tabelle
    expect(total).toBe(expected);
    expect(sim.state.stats.leakDamage).toBe(expected);
    expect(sim.state.lives).toBe(30); // godMode
    expect(leaks.length).toBe(stage.waves.reduce((a, w) => a + w.groups.reduce((b, g) => b + g.count, 0), 0));
  });

  it('Normaler Leak zieht Leben ab und beendet die Runde erst bei 0 (Grunt: 15 x 2 = 30)', () => {
    const st = oneWave('grunt', 15, 20);
    const sim = createSim({ stage: st, difficulty: 'normal', players: 1, seed: 1 });
    const seen: number[] = [];
    while (!sim.isOver()) {
      sim.step();
      if (sim.state.stats.leaks > seen.length) seen.push(sim.state.lives);
    }
    expect(seen.slice(0, 3)).toEqual([28, 26, 24]);
    expect(sim.state.lives).toBe(0);
    expect(sim.result()).toBe('loss');
    expect(sim.state.stats.leaks).toBe(15);
  });

  it('14 Grunts kosten 28 Leben: überlebt, Wave läuft aus (mit Sieg ohne weitere Gegner)', () => {
    const sim = run(oneWave('grunt', 14, 20));
    expect(sim.state.lives).toBe(2);
    expect(sim.result()).toBe('win');
  });

  it('Angeschlagener Gegner kostet nach Rest-HP: Brute mit 30 % HP statt 5 Leben nur 2', () => {
    const sim = createSim({ stage: oneWave('brute', 1), difficulty: 'normal', players: 1, seed: 1 });
    const s = sim.state as { enemies: { hp: number; maxHp: number; progress: number }[] };
    let hurt = false;
    while (!sim.isOver()) {
      sim.step();
      if (!hurt && s.enemies.length > 0) {
        s.enemies[0].hp = Math.floor((s.enemies[0].maxHp * 3) / 10);
        hurt = true;
      }
    }
    const leak = sim.drainEvents().find((e) => e.type === 'leak');
    expect(leak).toMatchObject({ enemy: 'brute', damage: 2, fatal: false });
    expect(sim.state.lives).toBe(28);
  });

  it('Boss-Leak = sofort verloren, auch mit vollen Leben und fast totem Boss', () => {
    const sim = createSim({ stage: oneWave('boss', 1), difficulty: 'normal', players: 1, seed: 1 });
    const s = sim.state as { enemies: { hp: number }[] };
    let hurt = false;
    while (!sim.isOver()) {
      sim.step();
      if (!hurt && s.enemies.length > 0) {
        s.enemies[0].hp = 1; // 0,01 HP Rest: zählt trotzdem
        hurt = true;
      }
    }
    const leak = sim.drainEvents().find((e) => e.type === 'leak');
    expect(leak).toMatchObject({ enemy: 'boss', fatal: true, damage: 30 });
    expect(sim.state.lives).toBe(0);
    expect(sim.result()).toBe('loss');
  });

  it('Boss-Leak im godMode beendet die Runde nicht', () => {
    const sim = run(oneWave('boss', 1), undefined, true);
    expect(sim.state.lives).toBe(30);
    expect(sim.result()).toBe('win');
    expect(sim.state.stats.leaks).toBe(1);
  });

  it('Elite-Regel (Entscheidung P2): Elite kostet viele Leben (8, nach Rest-HP), verliert nicht sofort', () => {
    expect(data.economy.lives.instantLoss).not.toContain('elite');
    const sim = run(oneWave('elite', 1));
    expect(sim.state.lives).toBe(30 - 8);
    expect(sim.result()).toBe('win');
    const four = run(oneWave('elite', 4, 20));
    expect(four.state.lives).toBe(0); // 4 x 8 = 32 > 30
    expect(four.result()).toBe('loss');
  });

  it('Elite per Daten auf Sofort-Verlust umstellbar', () => {
    const d = loadGameData();
    d.economy.lives.instantLoss = ['boss', 'elite'];
    const sim = run(oneWave('elite', 1), d);
    expect(sim.result()).toBe('loss');
    expect(sim.state.lives).toBe(0);
  });

  it('instantLoss mit unbekanntem Archetyp wird beim Laden abgelehnt', () => {
    const d = loadGameData();
    d.economy.lives.instantLoss = ['drache'];
    expect(() => validateGameData(d)).toThrow(/instantLoss/);
  });

  it('Regeneration pro Wave: +N beim Wave-Ende (nach dem Leak), nie über dem Maximum', () => {
    const d = loadGameData();
    d.economy.lives.regenPerWave = 3;
    const sim = createSim({ stage: oneWave('brute', 1), difficulty: 'normal', players: 1, seed: 1, data: d });
    const trace: number[] = [];
    while (!sim.isOver() && sim.state.tick < 6000) {
      sim.step();
      for (const e of sim.drainEvents()) if (e.type === 'waveEnd') trace.push(sim.state.lives);
    }
    expect(trace).toEqual([28]); // 30 - 5 (Brute) + 3
  });

  it('Regeneration deckelt exakt am Maximum und heilt keine toten Runden', () => {
    const d = loadGameData();
    d.economy.lives.regenPerWave = 100;
    const sim = run(oneWave('grunt', 1), d);
    expect(sim.state.lives).toBe(30);
    expect(sim.state.maxLives).toBe(30);
  });

  it('Geleakte Gegner zahlen keine Bounty, Splitter-Eltern erzeugen beim Leak keine Kinder', () => {
    const sim = run(oneWave('splitter', 3), undefined, true);
    expect(sim.state.stats.spawned).toBe(3);
    expect(sim.state.stats.coinsBounty).toBe(0);
    expect(sim.state.stats.leakDamage).toBe(9); // 3 x Basis 3
  });

  it('Determinismus: gleicher Seed, gleiche Leaks, gleicher Hash; Zustand ganzzahlig', () => {
    const a = run(oneWave('grunt', 10, 20));
    const b = run(oneWave('grunt', 10, 20));
    expect(a.hash()).toBe(b.hash());
    expect(a.state.lives).toBe(b.state.lives);
    expect(Number.isInteger(a.state.lives)).toBe(true);
  });
});
