/**
 * Infinite-Modus: seeded Wave-Erzeugung ab Wave (fixedWaves+1), recommendations §3/§4/§5.
 *
 * - Pool je Wave konstant ca. 32 Grunt-Äquivalente (HP-Anteile f_HP); die absolute HP wächst über hpGrunt(n) ~ n^2.
 * - Boss alle 10 Waves (Boss + Elite + Grunts, Pool ca. 45 Äquivalente wie Wave 20), Mini-Boss (Elite) bei n mod 10 = 5.
 * - Höchstens 60 Gegner je Wave (Splitter-Kinder zählen nicht); das gleichzeitige Limit (60) setzt spawn.ts.
 * - Eigener PRNG je (Seed, Wave): unabhängig vom Sim-PRNG und von der Aufrufreihenfolge, daher stellt das Erzeugen
 *   den Zustands-Hash nicht ein und ist je Seed reproduzierbar.
 */
import type { Ctx } from '../data/compile.js';
import { nextInt, seedRng } from '../prng.js';

export interface GenGroup {
  type: string;
  count: number;
  intervalTicks: number;
  delayTicks: number;
  modifiers: string[];
  element: number;
}
export interface GenWave {
  n: number;
  groups: GenGroup[];
}

/** Äquivalente (Milli-Grunt) und Spawn-Abstand je Typ; Splitter inkl. 2 Kinder à 0,35. */
const KINDS: Record<string, { eq: number; interval: number }> = {
  grunt: { eq: 1000, interval: 16 },
  runner: { eq: 700, interval: 10 },
  brute: { eq: 3000, interval: 40 },
  flyer: { eq: 900, interval: 18 },
  splitter: { eq: 1700, interval: 30 },
  elite: { eq: 8000, interval: 60 },
};
const REGULAR = ['grunt', 'runner', 'brute', 'flyer', 'splitter'] as const;
const BUDGET = 32_000;
const BOSS_BUDGET = 45_000;
const BOSS_EQ = 30_000;
const MAX_PER_WAVE = 60;

const cache = new WeakMap<Ctx, Map<number, GenWave>>();

/** Wave n der Stage: feste Wave oder (Infinite) erzeugte Wave. */
export function getWave(ctx: Ctx, n: number): GenWave {
  if (n <= ctx.fixedWaves) return ctx.stage.waves[n - 1];
  if (!ctx.infinite) throw new Error(`Wave ${n} existiert nicht`);
  let m = cache.get(ctx);
  if (!m) cache.set(ctx, (m = new Map()));
  let w = m.get(n);
  if (!w) m.set(n, (w = generateWave(ctx, n)));
  return w;
}

// DESIGN-OFFEN: Infinite-Wave-Zusammensetzung (2-3 Gruppen aus Grunt/Runner/Brute/Flyer/Splitter, Pool 32 bzw. 45 Grunt-Äquivalente, Modifier 25 %).
export function generateWave(ctx: Ctx, n: number): GenWave {
  const rng = seedRng((ctx.waveSeed ^ Math.imul(n, 0x9e3779b1)) >>> 0);
  const element = 1 + ((n - 1) % 5);
  const maxShield = Math.min(ctx.data.modifiers.shield.maxStacks, 3 + Math.floor((n - ctx.fixedWaves) / 10));
  const boss = n % 10 === 0;
  const mini = n % 10 === 5;
  const groups: GenGroup[] = [];
  let delay = 0;
  const push = (type: string, count: number, modifiers: string[]): void => {
    groups.push({ type, count, intervalTicks: count > 1 ? KINDS[type].interval : 0, delayTicks: delay, modifiers, element });
    delay += count * (KINDS[type]?.interval ?? 60);
  };
  let budget = BUDGET;
  let used = 0;
  if (boss) {
    // Boss erscheint einzeln bei Delay 0, danach 1 Elite.
    groups.push({ type: 'boss', count: 1, intervalTicks: 0, delayTicks: 0, modifiers: [], element });
    delay = 60;
    push('elite', 1, []);
    used = 1 + 1;
    budget = BOSS_BUDGET - BOSS_EQ - KINDS.elite.eq;
  } else if (mini) {
    push('elite', 1, []);
    used = 1;
    budget = BUDGET - KINDS.elite.eq;
  }
  // 2-3 Gruppen aus den regulären Typen (Fisher-Yates mit eigenem PRNG).
  const pool: string[] = [...REGULAR];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const k = 2 + nextInt(rng, 2);
  const types = pool.slice(0, k);
  if (boss && !types.includes('grunt')) types[k - 1] = 'grunt';
  const weights = types.map(() => 1 + nextInt(rng, 3));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const counts = types.map((t, i) => Math.max(1, Math.floor((budget * weights[i]) / wsum / KINDS[t].eq)));
  // Hartes Limit 60 Gegner je Wave.
  let total = used + counts.reduce((a, b) => a + b, 0);
  for (let i = 0; total > MAX_PER_WAVE; i = (i + 1) % counts.length) {
    if (counts[i] > 1) {
      counts[i]--;
      total--;
    }
  }
  types.forEach((t, i) => {
    const mods: string[] = [];
    const roll = nextInt(rng, 4); // 25 % Modifier ab 5 Waves nach dem festen Teil
    if (n > ctx.fixedWaves + 5 && roll === 0) {
      if (t === 'grunt') mods.push(`shield:${maxShield}`);
      else if (t === 'brute') mods.push(nextInt(rng, 2) === 0 ? 'armored' : 'regen');
      else if (t === 'runner') mods.push('fast');
    }
    push(t, counts[i], mods);
  });
  return { n, groups };
}
