import { describe, expect, it } from 'vitest';
import { createSim } from './helpers.js';

describe('Einkommen ohne Units', () => {
  it('Summe Wave-Boni = 3050, Kill-Bounty = 0 (godMode)', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, godMode: true });
    while (!sim.isOver()) sim.step(50);
    const ev = sim.drainEvents();
    const sum = (src: string) => ev.filter((e) => e.type === 'income' && e.source === src).reduce((a, e) => a + (e.type === 'income' ? e.amount : 0), 0);
    expect(sum('waveBonus')).toBe(3050);
    expect(sum('bounty')).toBe(0);
    expect(sim.state.stats.kills).toBe(0);
    expect(sim.state.players[0].coins).toBe(1000 + 3050);
    expect(sim.result()).toBe('win');
    expect(ev.filter((e) => e.type === 'waveEnd')).toHaveLength(20);
  });
  it('ohne godMode geht die Stage ohne Units verloren', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
    while (!sim.isOver()) sim.step(50);
    expect(sim.result()).toBe('loss');
    expect(sim.state.lives).toBeLessThanOrEqual(0);
  });
});
