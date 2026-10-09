import { describe, expect, it } from 'vitest';
import { nextU32, seedRng } from '../src/prng.js';
import { buildPath, positionAt } from '../src/path.js';

describe('Grundbausteine', () => {
  it('PRNG ist deterministisch', () => {
    const a = seedRng(42);
    const b = seedRng(42);
    expect([nextU32(a), nextU32(a)]).toEqual([nextU32(b), nextU32(b)]);
  });
  it('Pfad: Laenge und Position', () => {
    const p = buildPath([
      [0, 0],
      [3000, 0],
      [3000, 4000],
    ]);
    expect(p.length).toBe(7000);
    expect(positionAt(p, 5000)).toEqual({ x: 3000, y: 2000 });
  });
});
