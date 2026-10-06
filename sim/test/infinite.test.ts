import { describe, expect, it } from 'vitest';
import { createSim, data } from './helpers.js';
import { ctxFor } from './helpers.js';
import { compile } from '../src/data/compile.js';
import { generateWave, getWave } from '../src/systems/infinite.js';
import type { Sim } from '../src/index.js';

const inf = data.stages['infinite'];
const mk = (seed = 1, maxWaves?: number, godMode = true): Sim =>
  createSim({ stage: 'infinite', difficulty: 'normal', players: 1, seed, godMode, maxWaves });

describe('Infinite', () => {
  it('Stage infinite: gleiche Map und Waves 1-20 wie standard20, kein Sieg', () => {
    expect(inf.infinite).toBe(true);
    expect(inf.path).toEqual(data.stages['standard20'].path);
    expect(inf.waves).toEqual(data.stages['standard20'].waves);
    expect(data.stages['standard20'].infinite).toBeUndefined();
    expect(ctxFor(1, 'normal', inf).totalWaves).toBe(Infinity);
  });

  it('HP_grunt ~ (n/20)^2 und gamma ~ (20/n)^2 ab Wave 21; Kill-Cash je Pool etwa flach', () => {
    const c = ctxFor(1, 'normal', inf);
    const h20 = c.hpGrunt(20);
    expect(c.hpGrunt(40)).toBe(h20 * 4);
    expect(c.hpGrunt(60)).toBe(h20 * 9);
    expect(c.hpGrunt(21)).toBe(Math.floor((h20 * 441) / 400));
    // Bounty je Grunt-HP: Wave 40 = Wave 20 / 4
    const b20 = c.bounty(20, h20);
    const b40 = c.bounty(40, c.hpGrunt(40));
    expect(Math.abs(b40 - b20)).toBeLessThanOrEqual(1);
    // gamma selbst fällt quadratisch: gleiche HP-Basis -> Bounty / 4
    expect(Math.abs(c.bounty(40, h20) * 4 - b20)).toBeLessThanOrEqual(2);
    // Standard-Stage bleibt unverändert (n <= 20 identisch)
    const s = ctxFor(1);
    for (const n of [1, 10, 20]) {
      expect(c.hpGrunt(n)).toBe(s.hpGrunt(n));
      expect(c.bounty(n, 5000)).toBe(s.bounty(n, 5000));
    }
  });

  it('Speed +1 %/Wave bis x1,5', () => {
    const c = ctxFor(1, 'normal', inf);
    expect(c.speedInfBp(20)).toBe(10000);
    expect(c.speedInfBp(30)).toBe(11000);
    expect(c.speedInfBp(70)).toBe(15000);
    expect(c.speedInfBp(500)).toBe(15000);
    expect(ctxFor(1).speedInfBp(30)).toBe(10000);
  });

  it('Wave-Erzeugung deterministisch je Seed, unabhängig von der Aufrufreihenfolge', () => {
    const a = compile(data, inf, 'normal', 1, { seed: 7 });
    const b = compile(data, inf, 'normal', 1, { seed: 7 });
    const order = [45, 21, 33, 21, 60];
    const ra = order.map((n) => JSON.stringify(getWave(a, n)));
    const rb = [...order].reverse().map((n) => JSON.stringify(getWave(b, n))).reverse();
    expect(ra).toEqual(rb);
    const c = compile(data, inf, 'normal', 1, { seed: 8 });
    const diff = [21, 22, 23, 24, 26, 27].some((n) => JSON.stringify(getWave(a, n)) !== JSON.stringify(getWave(c, n)));
    expect(diff).toBe(true);
  });

  it('Boss alle 10 Waves, Elite-Mini-Boss bei n mod 10 = 5, höchstens 60 Gegner je Wave, Pool etwa konstant', () => {
    const c = compile(data, inf, 'normal', 1, { seed: 3 });
    const eq = (n: number): number => {
      let sum = 0;
      for (const g of getWave(c, n).groups) sum += g.count * (c.enemies[g.type].fHpBp / 10000) * (1 + (c.enemies[g.type].child ? 0.7 : 0));
      return sum;
    };
    for (let n = 21; n <= 200; n++) {
      const w = generateWave(c, n);
      const count = w.groups.reduce((s, g) => s + g.count, 0);
      expect(count).toBeLessThanOrEqual(60);
      const has = (t: string) => w.groups.some((g) => g.type === t);
      expect(has('boss')).toBe(n % 10 === 0);
      if (n % 10 === 5) expect(has('elite')).toBe(true);
      if (n % 10 !== 0 && n % 10 !== 5) expect(eq(n)).toBeGreaterThan(24);
      expect(eq(n)).toBeLessThan(48);
      for (const g of w.groups) expect(g.element).toBe(1 + ((n - 1) % 5));
    }
  });

  it('Lauf deterministisch: gleicher Seed -> gleicher Hash; kein Sieg; Ende per maxWaves ohne Ergebnis', () => {
    const run = (seed: number) => {
      const s = mk(seed, 25);
      let guard = 0;
      while (!s.isOver() && guard++ < 60) s.runWave();
      return s;
    };
    const a = run(11);
    const b = run(11);
    expect(a.isOver()).toBe(true);
    expect(a.result()).toBeNull();
    expect(a.state.wave).toBe(25);
    expect(a.hash()).toBe(b.hash());
    expect(run(12).hash()).not.toBe(a.hash());
  });

  it('Wachstum: Gegner-HP in Wave 40 ~ 4x Wave 20; Speed steigt; Gegner-Limit 60', () => {
    const s = mk(5, 41);
    let maxAlive = 0;
    const maxHpByWave = new Map<number, number>();
    const speedByWave = new Map<number, number>();
    while (!s.isOver()) {
      s.step(20);
      maxAlive = Math.max(maxAlive, s.state.enemies.length);
      for (const e of s.state.enemies) {
        if (e.type === 'grunt' && e.wave > 0) {
          maxHpByWave.set(e.wave, e.maxHp);
          speedByWave.set(e.wave, e.speedMicro);
        }
      }
    }
    expect(maxAlive).toBeLessThanOrEqual(60);
    expect(maxAlive).toBeGreaterThan(20);
    const g = (n: number) => compile(data, inf, 'normal', 1).hpGrunt(n);
    for (const n of [21, 30, 40]) if (maxHpByWave.has(n)) expect(maxHpByWave.get(n)).toBe(g(n));
    if (maxHpByWave.has(40)) expect(maxHpByWave.get(40)).toBe(g(20) * 4);
    if (speedByWave.has(30) && speedByWave.has(20)) {
      expect(speedByWave.get(30)! * 10000).toBeGreaterThanOrEqual(speedByWave.get(20)! * 10990);
    }
    expect(s.state.stats.spawned).toBeGreaterThan(500);
  });

  it('ohne Verteidigung: Base-HP <= 0 beendet mit loss (kein godMode)', () => {
    const s = mk(2, undefined, false);
    let guard = 0;
    while (!s.isOver() && guard++ < 100) s.runWave();
    expect(s.result()).toBe('loss');
    expect(s.state.baseHp).toBeLessThanOrEqual(0);
  });

  it('standard20 bleibt unverändert (Sieg nach Wave 20 möglich, Gegner-Limit 80)', () => {
    const c = ctxFor(1);
    expect(c.totalWaves).toBe(20);
    expect(c.enemyCap).toBe(80);
    expect(c.infinite).toBe(false);
  });
});
