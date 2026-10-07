/**
 * Match-Runner: spielt Bots gegen die Sim und sammelt Zeitreihen je Wave (Grundlage der Reports).
 *
 * Format (stabil): `MatchResult.waves[i]` mit `wave = i`; Zeile 0 = Prep (vor Wave 1), Zeilen 1..N = Waves.
 *  - Ökonomie (Münzen, Einkommen, Ausgaben, Verkäufe, Farm) wird der Wave zugeordnet, in der sie anfällt.
 *  - Gegner-bezogene Größen (poolHp, leaks, baseHpLost, kills) gehören zur Spawn-Wave des Gegners.
 *  - Alle Spielerarrays sind nach Spieler-ID indiziert. HP in ganzen HP (Sim: Centi-HP / 100).
 */
import { createSim, type Command, type DifficultyId, type SimEvent, type Sim, type GameData, type StageData, type UnitMod } from '../index.js';
import { seedRng } from '../prng.js';
import { getBot } from './index.js';
import type { Bot } from './types.js';

export interface MatchOptions {
  stage: string | StageData;
  difficulty: DifficultyId;
  players: number;
  seed: number;
  /** Bot-Name je Spieler (ein einzelner Eintrag gilt für alle Spieler). */
  bots: string[];
  /** Standard 40 000 Ticks (Stage-Ende liegt bei ~19 000). */
  maxTicks?: number;
  /** Nur Stage `infinite`: Abbruch, sobald diese Wave endet (Ergebnis `timeout`). */
  maxWaves?: number;
  /** Optional (Runde 6 / P2, Messungen): Daten-Override statt der JSON-Dateien. */
  data?: GameData;
  /** Optional (Runde 7 / P2): Level-/Sterne-Mods je Spieler und Unit (`metaProfileMods`), Standard keine = neutral. */
  unitMods?: UnitMod[];
  /** Optional: jeden Befehl der Bots mit Tick, Spieler, Ergebnis melden (Replay-Export, `scripts/export-replay.ts`). */
  onCommand?: (c: { tick: number; player: number; cmd: Command; ok: boolean; reason?: string }) => void;
}

export interface WaveStat {
  wave: number;
  /** Tick des Wave-Starts (Prep: 0). */
  tick: number;
  /** Münzen je Spieler beim Wave-Start (vor den Bot-Entscheidungen dieser Wave). */
  coins: number[];
  /** Einkommen je Spieler nach Quelle (in dieser Wave angefallen). */
  income: { kill: number[]; wave: number[]; farm: number[]; donate: number[]; sell: number[] };
  /** Münzen, die die Spieler in dieser Wave ausgegeben haben. */
  spentPlace: number[];
  spentUpgrade: number[];
  /** Verkaufserlös je Spieler (= income.sell). */
  sold: number[];
  /** Spenden je Spieler: gegeben. */
  donated: number[];
  /** Farm-Investition (Platzierung + Upgrades der Farm) und Ertrag (= income.farm) je Spieler. */
  farmInvest: number[];
  farmYield: number[];
  /** Gegner dieser Wave: Anzahl gespawnt, Pool-HP (Summe Max-HP inkl. Splitter-Kinder), Kills. */
  spawned: number;
  poolHp: number;
  kills: number;
  /** Leaks nach Gegner-Typ, verlorene Leben (Leak-Schaden). */
  leaks: Record<string, number>;
  baseHpLost: number;
  /** Leben am Ende der Wave (nach letztem Leak dieser Wave im Verlauf, sonst Wert des Vorgängers). */
  baseHpEnd: number;
}

export interface MatchResult {
  result: 'win' | 'loss' | 'timeout';
  /** Zuletzt gestartete Wave. */
  endWave: number;
  baseHp: number;
  ticks: number;
  hash: string;
  stage: string;
  difficulty: DifficultyId;
  players: number;
  seed: number;
  bots: string[];
  waves: WaveStat[];
  finalCoins: number[];
  /** Units am Ende (Zusammensetzung/Ausbau). */
  finalUnits: { unit: string; owner: number; level: number; x: number; y: number }[];
  /** Größte Zahl gleichzeitig stehender Units im Lauf (Messung gegen `economy.caps.teamUnits`). */
  peakUnits: number;
  damageByPlayer: number[];
  totals: { kills: number; leaks: number; spawned: number };
}

const zeros = (n: number): number[] => new Array<number>(n).fill(0);

export function runMatch(opts: MatchOptions): MatchResult {
  const n = opts.players;
  if (opts.bots.length !== n && opts.bots.length !== 1) throw new Error('bots: ein Name je Spieler oder genau einer');
  const names = Array.from({ length: n }, (_, i) => opts.bots[opts.bots.length === 1 ? 0 : i]);
  const core = createSim({ stage: opts.stage, difficulty: opts.difficulty, players: n, seed: opts.seed, maxWaves: opts.maxWaves, data: opts.data, unitMods: opts.unitMods });
  // Mit `onCommand` sehen die Bots eine Sicht, die jeden `apply` mitschreibt; Zustand und Ergebnis bleiben die der echten Sim.
  const sim: Sim = opts.onCommand
    ? {
        ...core,
        apply(player, cmd) {
          const tick = core.state.tick;
          const r = core.apply(player, cmd);
          opts.onCommand?.({ tick, player, cmd, ok: r.ok, ...(r.ok ? {} : { reason: r.reason }) });
          return r;
        },
      }
    : core;
  const bots: Bot[] = names.map((nm) => getBot(nm)());
  const rngs = names.map((_, i) => seedRng((Math.imul(opts.seed | 0, 0x9e3779b1) ^ Math.imul(i + 1, 0x85ebca6b) ^ 0xb07b07) >>> 0));
  const maxTicks = opts.maxTicks ?? 40000;
  const st = sim.state;

  const waves: WaveStat[] = [];
  const row = (w: number): WaveStat => {
    while (waves.length <= w) {
      const i = waves.length;
      waves.push({
        wave: i,
        tick: 0,
        coins: zeros(n),
        income: { kill: zeros(n), wave: zeros(n), farm: zeros(n), donate: zeros(n), sell: zeros(n) },
        spentPlace: zeros(n),
        spentUpgrade: zeros(n),
        sold: zeros(n),
        donated: zeros(n),
        farmInvest: zeros(n),
        farmYield: zeros(n),
        spawned: 0,
        poolHp: 0,
        kills: 0,
        leaks: {},
        baseHpLost: 0,
        baseHpEnd: waves.length ? waves[i - 1].baseHpEnd : st.lives,
      });
    }
    return waves[w];
  };
  row(0);
  row(0).coins = st.players.map((p) => p.coins);
  let cur = 0;
  let peak = 0;
  const unitDef = new Map<number, string>();
  const spawnedIds = new Set<number>();

  const handle = (events: SimEvent[]): boolean => {
    let waveStarted = false;
    for (const e of events) {
      switch (e.type) {
        case 'waveStart': {
          cur = e.wave;
          const r = row(cur);
          r.tick = e.tick;
          r.coins = st.players.map((p) => p.coins);
          waveStarted = true;
          break;
        }
        case 'income': {
          const r = row(cur);
          const k = e.source === 'bounty' ? 'kill' : e.source === 'waveBonus' ? 'wave' : e.source;
          r.income[k][e.player] += e.amount;
          if (e.source === 'farm') r.farmYield[e.player] += e.amount;
          if (e.source === 'sell') r.sold[e.player] += e.amount;
          break;
        }
        case 'place':
        case 'upgrade': {
          const r = row(cur);
          if (e.type === 'place') {
            unitDef.set(e.unitId, e.unit);
            r.spentPlace[e.player] += e.cost;
          } else r.spentUpgrade[e.player] += e.cost;
          if (unitDef.get(e.unitId) === 'farm') r.farmInvest[e.player] += e.cost;
          break;
        }
        case 'spawn': {
          const r = row(e.wave);
          r.spawned++;
          const en = st.enemies.find((x) => x.id === e.enemyId);
          if (en && !spawnedIds.has(e.enemyId)) r.poolHp += Math.round(en.maxHp / 100);
          spawnedIds.add(e.enemyId);
          break;
        }
        case 'kill':
          row(e.wave).kills++;
          break;
        case 'leak': {
          const r = row(e.wave);
          r.leaks[e.enemy] = (r.leaks[e.enemy] ?? 0) + 1;
          r.baseHpLost += e.damage;
          break;
        }
        default:
          break;
      }
    }
    row(cur).baseHpEnd = st.lives;
    return waveStarted;
  };

  const decideAll = (): void => {
    for (let p = 0; p < n; p++) {
      if (sim.isOver()) return;
      const before = st.players[p].coins;
      bots[p].decide({ sim, playerId: p, rng: rngs[p] });
      const ev = sim.drainEvents();
      handle(ev);
      // Gegebene Spenden = Münzabnahme, die nicht durch Platzierung/Upgrade erklärt ist (Verkauf zählt als Zufluss).
      let spent = 0;
      let gained = 0;
      for (const e of ev) {
        if ((e.type === 'place' || e.type === 'upgrade') && e.player === p) spent += e.cost;
        if (e.type === 'income' && e.player === p) gained += e.amount;
      }
      peak = Math.max(peak, st.units.length);
      const don = before + gained - spent - st.players[p].coins;
      if (don > 0) row(cur).donated[p] += don;
    }
  };

  decideAll();
  while (!sim.isOver() && st.tick < maxTicks) {
    sim.step(1);
    const started = handle(sim.drainEvents());
    if (sim.isOver()) break;
    if (started || st.tick % 20 === 0) decideAll();
  }
  handle(sim.drainEvents());

  return {
    result: st.result ?? 'timeout',
    endWave: st.wave,
    baseHp: st.lives,
    ticks: st.tick,
    hash: sim.hash(),
    stage: typeof opts.stage === 'string' ? opts.stage : opts.stage.id,
    difficulty: opts.difficulty,
    players: n,
    seed: opts.seed,
    bots: names,
    waves,
    finalCoins: st.players.map((p) => p.coins),
    finalUnits: st.units.map((u) => ({ unit: u.defId, owner: u.owner, level: u.level, x: u.x, y: u.y })),
    peakUnits: peak,
    damageByPlayer: [...st.stats.damageByPlayer],
    totals: { kills: st.stats.kills, leaks: st.stats.leaks, spawned: st.stats.spawned },
  };
}
