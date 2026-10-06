/**
 * Gemeinsame Hilfen der Sanity-Experimente (P3): eigener Match-Runner mit Data-Override,
 * unitMods und godMode (der Registry-Runner `runMatch` bietet diese Optionen nicht),
 * Experiment-Bots (nur über `sim.apply`) und Statistik-Hilfen. Kern und `sim/data/` bleiben unberührt.
 */
import { createSim, loadGameData, type DifficultyId, type GameData, type Sim, type UnitMod } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import type { Bot, BotFactory } from '../../src/bots/types.js';
import { DifficultySchema } from '../../src/data/schema.js';
import { seedRng } from '../../src/prng.js';
import { botTuning, policyBot, type Policy } from '../../src/bots/util.js';

// P1_NOSAVE=1: Bots verhalten sich wie in Runde 1-3 (kein Sparen auf teure Platzierungen).
if (process.env.P1_NOSAVE === '1') botTuning.disabled = true;
// P4_NOWINDOW=1: Bots zünden Fähigkeiten gegen Bosse sofort (Verhalten vor P4); P4_NOCARDS=1: keine Risikokarten.
if (process.env.P4_NOWINDOW === '1') botTuning.windowAware = false;
if (process.env.P4_NOCARDS === '1') botTuning.cardsDisabled = true;

export const baseData: GameData = loadGameData();
// Experiment-Override ohne Dateiänderung: P1_PATCH='{"titan":{"dpsShareBp":7000,"ability":{...}}}' (je Unit-ID, flach überschrieben).
if (process.env.P1_PATCH) {
  const pt = JSON.parse(process.env.P1_PATCH) as Record<string, Record<string, unknown>>;
  for (const [id, f] of Object.entries(pt)) {
    const u = baseData.units.units.find((x) => x.id === id);
    if (!u) throw new Error(`P1_PATCH: Unit ${id} unbekannt`);
    Object.assign(u, f);
  }
}

// P1_HP=1.38: globaler HP-Faktor auf alle drei Stufen schon in baseData (Experiment ohne Dateiänderung).
if (process.env.P1_HP) {
  for (const k of ['normal', 'hard', 'nightmare'] as const) baseData.difficulties[k].hpBp = Math.round(baseData.difficulties[k].hpBp * Number(process.env.P1_HP));
}

// P1_DIFF='{"normal":14600,"hard":14400}': HP-Basispunkte je Stufe absolut überschreiben (Kalibrierungs-Scans).
if (process.env.P1_DIFF) {
  for (const [k, v] of Object.entries(JSON.parse(process.env.P1_DIFF) as Record<string, number>)) baseData.difficulties[k as 'normal'].hpBp = v;
}

// P3_RULES='{"hard":{"modifiers":{"densityBp":1500}}}': Regeln je Stufe überschreiben (flach je Feld, Kalibrierung ohne Dateiänderung).
if (process.env.P3_RULES) {
  for (const [k, v] of Object.entries(JSON.parse(process.env.P3_RULES) as Record<string, Record<string, unknown>>)) (baseData.difficulties[k as 'normal'] = DifficultySchema.parse({ ...baseData.difficulties[k as 'normal'], ...v }));
}

// P1_COOPH=9000: hpPerExtraPlayerBp (Koop-HP-Faktor) überschreiben.
if (process.env.P1_COOPH) baseData.economy.coop.hpPerExtraPlayerBp = Number(process.env.P1_COOPH);

// P2_BOSSHP=120000: HP-Faktor (Basispunkte) des Archetyps boss überschreiben (Zwischenstand bis P4, Boss-Kits).
if (process.env.P2_BOSSHP) {
  const b = baseData.enemies.archetypes.find((a) => a.id === 'boss');
  if (b) b.fHpBp = Number(process.env.P2_BOSSHP);
}
// P2_ELITEHP=40000: dasselbe für elite.
if (process.env.P2_ELITEHP) {
  const b = baseData.enemies.archetypes.find((a) => a.id === 'elite');
  if (b) b.fHpBp = Number(process.env.P2_ELITEHP);
}

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
  /** Leaks als "Typ@Wave" -> Anzahl. */
  leaks: Record<string, number>;
  /** Jeder Leak einzeln (Typ, Spawn-Wave, aktuelle Wave, Rest-HP, Max-HP in Centi-HP) für Leben-Auswertungen (q9-p2). */
  leakLog: { type: string; wave: number; cur: number; hp: number; maxHp: number }[];
  /** Je Unit-Typ und Wave: Schaden (HP) und bis dahin investierte Münzen (für Schaden je Münze nach Spielphase). */
  byWave: Record<string, { dmg: number[]; invested: number[] }>;
}

export function play(o: PlayOpts): PlayResult {
  const n = o.players;
  const sim = createSim({
    stage: o.stage ?? 'standard20',
    difficulty: o.difficulty,
    players: n,
    seed: o.seed,
    data: o.data ?? baseData,
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
  const leaks: Record<string, number> = {};
  const leakLog: PlayResult['leakLog'] = [];
  const byWave: Record<string, { dmg: number[]; invested: number[] }> = {};
  let wave = 0;
  const bw = (u: string): { dmg: number[]; invested: number[] } => (byWave[u] ??= { dmg: Array(24).fill(0), invested: Array(24).fill(0) });
  const defOf = new Map<number, string>();
  const drain = (): boolean => {
    let started = false;
    for (const e of sim.drainEvents()) {
      if (e.type === 'place') {
        defOf.set(e.unitId, e.unit);
        spent[e.unit] = (spent[e.unit] ?? 0) + e.cost;
        placed[e.unit] = (placed[e.unit] ?? 0) + 1;
        bw(e.unit).invested[wave] += e.cost;
      } else if (e.type === 'upgrade') {
        const d = defOf.get(e.unitId) as string;
        spent[d] = (spent[d] ?? 0) + e.cost;
        bw(d).invested[wave] += e.cost;
      } else if (e.type === 'damage') {
        const d = defOf.get(e.unitId);
        if (d) {
          dmg[d] = (dmg[d] ?? 0) + e.amount / 100;
          bw(d).dmg[Math.min(wave, 23)] += e.amount / 100;
        }
      } else if (e.type === 'leak') {
        const k = `${e.enemy}@${e.wave}`;
        leaks[k] = (leaks[k] ?? 0) + 1;
        leakLog.push({ type: e.enemy, wave: e.wave, cur: st.wave, hp: e.hp, maxHp: e.maxHp });
      } else if (e.type === 'waveStart') {
        started = true;
        wave = Math.min(e.wave, 23);
      }
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
  return { result: st.result ?? 'timeout', endWave: st.wave, ticks: st.tick, sim, dmg, spent, placed, leaks, leakLog, byWave };
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
