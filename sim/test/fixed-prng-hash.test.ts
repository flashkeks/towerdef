import { describe, expect, it } from 'vitest';
import { divRound, isqrt, mulBp } from '../src/fixed.js';
import { fnv1a64, hashState, stableStringify } from '../src/hash.js';
import { nextInt, nextU32, seedRng } from '../src/prng.js';

describe('Festkomma', () => {
  it('isqrt ist exakt', () => {
    for (const n of [0, 1, 2, 3, 4, 15, 16, 17, 999_999, 1_000_000, 2 ** 40, 2 ** 52 - 1]) {
      const r = isqrt(n);
      expect(r * r).toBeLessThanOrEqual(n);
      expect((r + 1) * (r + 1)).toBeGreaterThan(n);
    }
  });
  it('mulBp / divRound runden wie dokumentiert', () => {
    expect(mulBp(7700, 14750)).toBe(11357);
    expect(divRound(5, 2)).toBe(3);
    expect(divRound(7, 3)).toBe(2);
  });
});

describe('PRNG', () => {
  it('ist deterministisch und der Zustand ist fortsetzbar', () => {
    const a = seedRng(42);
    const b = seedRng(42);
    const sa = Array.from({ length: 50 }, () => nextU32(a));
    const sb = Array.from({ length: 50 }, () => nextU32(b));
    expect(sa).toEqual(sb);
    const c = JSON.parse(JSON.stringify(a)) as number[];
    expect(nextU32(c)).toBe(nextU32(a));
    expect(seedRng(43)).not.toEqual(seedRng(42));
  });
  it('nextInt liegt im Bereich und ist grob gleichverteilt', () => {
    const r = seedRng(7);
    let below = 0;
    for (let i = 0; i < 10000; i++) {
      const v = nextInt(r, 10000);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10000);
      if (v < 2500) below++;
    }
    expect(below).toBeGreaterThan(2300);
    expect(below).toBeLessThan(2700);
  });
});

describe('Hash', () => {
  it('FNV-1a 64 Testvektoren', () => {
    expect(fnv1a64('')).toBe('cbf29ce484222325');
    expect(fnv1a64('a')).toBe('af63dc4c8601ec8c');
    expect(fnv1a64('foobar')).toBe('85944171f73967e8');
  });
  it('Serialisierung ist unabhängig von der Key-Reihenfolge', () => {
    expect(stableStringify({ b: 1, a: [2, { d: 1, c: null }] })).toBe(stableStringify({ a: [2, { c: null, d: 1 }], b: 1 }));
    expect(hashState({ a: 1, b: 2 })).toBe(hashState({ b: 2, a: 1 }));
    expect(hashState({ a: 1 })).not.toBe(hashState({ a: 2 }));
  });
  it('lehnt Floats im Zustand ab', () => {
    expect(() => stableStringify({ x: 1.5 })).toThrow();
  });
});
