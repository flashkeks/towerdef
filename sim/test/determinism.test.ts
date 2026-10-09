import { describe, expect, it } from 'vitest';
import { createGame, parseStrategy, runBot, type Command } from '../src/index';

const script: [number, Command][] = [
  [0, { type: 'place', tower: 'ranger', x: 60000, y: 122000 }],
  [0, { type: 'place', tower: 'bombardier', x: 180000, y: 240000 }],
  [0, { type: 'place', tower: 'frostcaller', x: 200000, y: 90000 }],
  [0, { type: 'startRound' }],
  [300, { type: 'upgrade', towerId: 2, path: 1 }],
  [600, { type: 'upgrade', towerId: 2, path: 1 }],
  [900, { type: 'upgrade', towerId: 2, path: 1 }],
  [1000, { type: 'startRound' }],
  [1200, { type: 'upgrade', towerId: 1, path: 0 }],
  [2000, { type: 'target', towerId: 1, mode: 'strong' }],
  [2400, { type: 'startRound' }],
];

function play(seed: number, withExtra = false): string {
  const g = createGame({ map: 'bare', difficulty: 'medium', seed, mods: { startCash: 5000 } });
  for (let t = 0; t < 6000; t++) {
    for (const [at, c] of script) if (at === t) g.apply(c);
    if (withExtra && t === 700) g.apply({ type: 'sell', towerId: 3 });
    g.step();
    g.drainEvents();
  }
  return g.hash();
}

describe('Determinismus', () => {
  it('gleicher Seed + gleiche Befehle = gleicher Hash', () => {
    expect(play(7)).toBe(play(7));
  });
  it('anderer Befehl = anderer Hash', () => {
    expect(play(7)).not.toBe(play(7, true));
  });
  it('Zufall (Splitterwinkel) hängt am Seed', () => {
    expect(play(7)).not.toBe(play(8));
  });
  it('Schritte in Teilen = in einem Rutsch', () => {
    const a = createGame({ map: 'bare', difficulty: 'easy', seed: 3, mods: { startCash: 2000 } });
    const b = createGame({ map: 'bare', difficulty: 'easy', seed: 3, mods: { startCash: 2000 } });
    for (const g of [a, b]) {
      g.apply({ type: 'place', tower: 'bombardier', x: 60000, y: 122000 });
      g.apply({ type: 'startRound' });
    }
    a.step(500);
    for (let i = 0; i < 500; i++) b.step();
    expect(a.hash()).toBe(b.hash());
  });
  it('Zustand ist nur Ganzzahlen (hash wirft sonst)', () => {
    const g = createGame({ map: 'bare', difficulty: 'hard', seed: 5, mods: { startCash: 3000 } });
    g.apply({ type: 'place', tower: 'frostcaller', x: 60000, y: 122000 });
    g.apply({ type: 'startRound' });
    for (let i = 0; i < 600; i++) g.step();
    expect(() => g.hash()).not.toThrow();
  });
  it('Bot-Läufe sind reproduzierbar', () => {
    const s = parseStrategy('ranger 0-0-0 + ranger 0-0-0 + bombardier 4-0-2 + hero');
    const a = runBot(s, { difficulty: 'medium', seed: 2 });
    const b = runBot(s, { difficulty: 'medium', seed: 2 });
    expect(a).toEqual(b);
  });
});
