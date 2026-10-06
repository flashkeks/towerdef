import { describe, expect, it } from 'vitest';
import type { StageData } from '../src/data/schema.js';
import { createSim, data, stage } from './helpers.js';

describe('Leaks (§2)', () => {
  it('Leak-Werte je Archetyp und Base-HP 100', () => {
    const leak = Object.fromEntries(data.enemies.archetypes.map((a) => [a.id, a.leak]));
    expect(leak).toEqual({ grunt: 1, runner: 1, brute: 3, flyer: 2, splitter: 2, splitter_child: 1, elite: 10, boss: 50 });
    expect(data.economy.baseHp).toBe(100);
  });
  it('Jeder Typ kostet beim Leak genau seinen Wert; Summe über die Stage stimmt (godMode)', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, godMode: true });
    while (!sim.isOver()) sim.step(100);
    const events = sim.drainEvents();
    let expected = 0;
    for (const w of stage.waves) for (const g of w.groups) expected += g.count * (data.enemies.archetypes.find((a) => a.id === g.type)?.leak ?? 0);
    const leaks = events.filter((e) => e.type === 'leak');
    expect(leaks.reduce((a, e) => a + (e.type === 'leak' ? e.damage : 0), 0)).toBe(expected);
    expect(sim.state.stats.leakDamage).toBe(expected);
    expect(sim.state.baseHp).toBe(100); // godMode
    expect(leaks.length).toBe(stage.waves.reduce((a, w) => a + w.groups.reduce((b, g) => b + g.count, 0), 0));
  });
  it('Zwei Boss-Leaks beenden die Stage, einer nicht', () => {
    const st: StageData = {
      ...stage,
      waves: [{ n: 1, groups: [{ type: 'boss', count: 2, intervalTicks: 400, delayTicks: 0, modifiers: [], element: 0 }] }],
    };
    const sim = createSim({ stage: st, difficulty: 'normal', players: 1, seed: 1 });
    let afterFirst = -1;
    while (!sim.isOver()) {
      sim.step();
      if (afterFirst < 0 && sim.state.stats.leaks === 1) afterFirst = sim.state.baseHp;
    }
    expect(afterFirst).toBe(50);
    expect(sim.state.baseHp).toBe(0);
    expect(sim.result()).toBe('loss');
  });
  it('Geleakte Gegner zahlen keine Bounty, Splitter-Eltern erzeugen beim Leak keine Kinder', () => {
    const st: StageData = {
      ...stage,
      waves: [{ n: 1, groups: [{ type: 'splitter', count: 3, intervalTicks: 30, delayTicks: 0, modifiers: [], element: 0 }] }],
    };
    const sim = createSim({ stage: st, difficulty: 'normal', players: 1, seed: 1, godMode: true });
    while (!sim.isOver()) sim.step(50);
    expect(sim.state.stats.spawned).toBe(3);
    expect(sim.state.stats.coinsBounty).toBe(0);
    expect(sim.state.stats.leakDamage).toBe(6);
  });
});
