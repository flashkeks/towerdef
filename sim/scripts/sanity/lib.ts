/**
 * Gemeinsame Hilfen der Sanity-Experimente (P3): eigener Match-Runner mit Data-Override,
 * unitMods und godMode (der Registry-Runner `runMatch` bietet diese Optionen nicht),
 * Experiment-Bots (nur über `sim.apply`) und Statistik-Hilfen. Kern und `sim/data/` bleiben unberührt.
 */
import { createSim, loadGameData, type DifficultyId, type GameData, type Sim, type UnitMod } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import type { Bot, BotFactory } from '../../src/bots/types.js';
import { seedRng } from '../../src/prng.js';
import { policyBot, type Policy } from '../../src/bots/util.js';

export const baseData: GameData = loadGameData();

/** Tiefe Kopie der Daten, dann mutieren (die JSON-Dateien bleiben unverändert). */
export function patched(mut: (d: GameData) => void): GameData {
  const d = structuredClone(baseData);
  mut(d);
  return d;
}

/** Globaler HP-Faktor f auf die Schwierigkeits-HP (Basispunkte, gerundet). */
export function hpScaled(f: number): GameData {
  return patched((d) => {
    for (const k of ['normal', 'hard', 'nightmare'] as const) d.difficulties[k].hpBp = Math.round(d.difficulties[k].hpBp * f);
  });
}

export interface PlayOpts {
  difficulty: DifficultyId;
  players: number;
  seed: number;
  /** Ein Bot-Factory für alle Spieler oder je Spieler einer. */
  bots: BotFactory | BotFactory[];
  data?: GameData;
  unitMods?: UnitMod[];
  godMode?: boolean;
  stage?: string;
  maxWaves?: number;
  maxTicks?: number;
  /** Wird vor jedem Tick aufgerufen (für eigene Messungen / Befehle). */
  beforeTick?: (sim: Sim) => void;
}

export interface PlayResult {
  result: 'win' | 'loss' | 'timeout';
  endWave: number;
  ticks: number;
  sim: Sim;
  /** Schaden (HP) je Unit-Typ, aus den damage-Events. */
  dmg: Record<string, number>;
  /** Ausgegebene Münzen je Unit-Typ (Platzierung + Upgrades). */
  spent: Record<string, number>;
  /** Anzahl Platzierungen je Unit-Typ. */
  placed: Record<string, number>;
}

export function play(o: PlayOpts): PlayResult {
  const n = o.players;
  const sim = createSim({
    stage: o.stage ?? 'standard20',
    difficulty: o.difficulty,
    players: n,
    seed: o.seed,
    data: o.data,
    unitMods: o.unitMods,
    godMode: o.godMode,
    maxWaves: o.maxWaves,
  });
  const facs = Array.isArray(o.bots) ? o.bots : [o.bots];
  const bots: Bot[] = Array.from({ length: n }, (_, i) => facs[facs.length === 1 ? 0 : i]());
  const rngs = bots.map((_, i) => seedRng((Math.imul(o.seed | 0, 0x9e3779b1) ^ Math.imul(i + 1, 0x85ebca6b) ^ 0xb07b07) >>> 0));
  const st = sim.state;
  const dmg: Record<string, number> = {};
  const spent: Record<string, number> = {};
  const placed: Record<string, number> = {};
  const defOf = new Map<number, string>();
  const drain = (): boolean => {
    let started = false;
    for (const e of sim.drainEvents()) {
      if (e.type === 'place') {
        defOf.set(e.unitId, e.unit);
        spent[e.unit] = (spent[e.unit] ?? 0) + e.cost;
        placed[e.unit] = (placed[e.unit] ?? 0) + 1;
      } else if (e.type === 'upgrade') {
        const d = defOf.get(e.unitId) as string;
        spent[d] = (spent[d] ?? 0) + e.cost;
      } else if (e.type === 'damage') {
        const d = defOf.get(e.unitId);
        if (d) dmg[d] = (dmg[d] ?? 0) + e.amount / 100;
      } else if (e.type === 'waveStart') started = true;
    }
    return started;
  };
  const decideAll = (): void => {
    for (let p = 0; p < n; p++) {
      if (sim.isOver()) return;
      bots[p].decide({ sim, playerId: p, rng: rngs[p] });
      drain();
    }
  };
  const maxTicks = o.maxTicks ?? 40000;
  decideAll();
  while (!sim.isOver() && st.tick < maxTicks) {
    o.beforeTick?.(sim);
    sim.step(1);
    const started = drain();
    if (sim.isOver()) break;
    if (started || st.tick % 20 === 0) decideAll();
  }
  drain();
  return { result: st.result ?? 'timeout', endWave: st.wave, ticks: st.tick, sim, dmg, spent, placed };
}

/** Experiment-Bot: greedy-Policy, eingeschränkt auf erlaubte Unit-Typen (optional mit Gewichten). */
export function restricted(name: string, allowed: string[] | null, extra: Policy = {}): BotFactory {
  return () =>
    policyBot(name, {
      ...extra,
      canPlace: (d, env) => (allowed === null || allowed.includes(d.id)) && (extra.canPlace?.(d, env) ?? true),
    });
}

/** greedy ohne bestimmte Unit-Typen (Leave-one-out). */
export const without = (...ids: string[]): BotFactory => () =>
  policyBot(`greedy-ohne-${ids.join('+')}`, { canPlace: (d) => !ids.includes(d.id) });

export const reg = (name: string): BotFactory => BOTS[name];

export interface Rate {
  n: number;
  win: number;
  /** Siegquote in Prozent. */
  pct: number;
  /** Median der Endwave. */
  medWave: number;
}

export function rate(n: number, one: (seed: number) => PlayResult | { result: string; endWave: number }): Rate {
  let win = 0;
  const waves: number[] = [];
  for (let s = 1; s <= n; s++) {
    const r = one(s);
    if (r.result === 'win') win++;
    waves.push(r.endWave);
  }
  waves.sort((a, b) => a - b);
  return { n, win, pct: Math.round((win / n) * 1000) / 10, medWave: waves[Math.floor(waves.length / 2)] };
}

export const median = (a: number[]): number => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

export const f1 = (x: number): string => (Math.round(x * 10) / 10).toFixed(1);

/** Markdown-Tabelle ausgeben. */
export function table(head: string[], rows: (string | number)[][]): string {
  const l = (r: (string | number)[]): string => `| ${r.join(' | ')} |`;
  return [l(head), l(head.map(() => '---')), ...rows.map(l)].join('\n');
}

export const ARGS = process.argv.slice(2);
export const argNum = (name: string, def: number): number => {
  const i = ARGS.indexOf(`--${name}`);
  return i >= 0 ? Number(ARGS[i + 1]) : def;
};
export const argStr = (name: string, def: string): string => {
  const i = ARGS.indexOf(`--${name}`);
  return i >= 0 ? ARGS[i + 1] : def;
};
