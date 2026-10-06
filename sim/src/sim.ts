/**
 * Fassade des Simulationskerns: `createSim` liefert ein `Sim` mit stabiler API.
 *
 * Tick-Reihenfolge (alles in aufsteigender Entity-ID):
 *  1. Waves (Prep-Timer, Wave-Ende/-Start, Skip)   2. Spawns   3. Statuseffekte/DoT/Regen + Tode
 *  4. Bewegung + Leaks (Niederlage)                5. Units: Cooldowns, Angriffe + Tode
 *  6. Sieg-Prüfung                                 7. tick++
 */
import { applyCommand, type Command, type CommandResult } from './commands.js';
import { compile, type Ctx, type UnitDef } from './data/compile.js';
import { loadGameData } from './data/load.js';
import type { DifficultyId, GameData, StageData } from './data/schema.js';
import { hashState } from './hash.js';
import { coverage } from './path.js';
import { seedRng } from './prng.js';
import type { SimEvent, SimState, UnitMod, World } from './state.js';
import { moveEnemies } from './systems/move.js';
import { tickEffects } from './systems/effects.js';
import { processSpawns } from './systems/spawn.js';
import { resolveDeaths } from './systems/economy.js';
import { runUnits } from './systems/attack.js';
import { checkVictory, finish, updateWaves } from './systems/waves.js';

export interface SimOptions {
  stage: string | StageData;
  difficulty: DifficultyId;
  players: number;
  seed: number;
  data?: GameData;
  /** Base-HP sinkt nicht (Leaks werden weiter gezählt); für Einkommenstests. */
  godMode?: boolean;
  /** Hooks für Trait-/Level-Multiplikatoren je Spieler und Unit-Typ (Standard x1). */
  unitMods?: UnitMod[];
}

export interface SlotInfo {
  id: number;
  x: number;
  y: number;
  kind: 'ground' | 'hill';
  size: 1 | 2;
  free: boolean;
  /** Besetzende Unit-Entity oder null. */
  occupant: number | null;
  /** Pfadlänge (Milli-Tiles) innerhalb der Reichweite (Milli-Tiles) um diesen Slot. */
  coverageByRange(rangeMilli: number): number;
}

export interface Sim {
  readonly state: Readonly<SimState>;
  apply(playerId: number, cmd: Command): CommandResult;
  step(ticks?: number): void;
  runWave(): void;
  isOver(): boolean;
  result(): 'win' | 'loss' | null;
  hash(): string;
  drainEvents(): SimEvent[];
  slots(): SlotInfo[];
  catalog(): UnitDef[];
  upgradeCost(entityId: number): number | null;
  placeCost(unitId: string): number;
}

export function createSim(opts: SimOptions): Sim {
  const data = opts.data ?? loadGameData();
  const stage = typeof opts.stage === 'string' ? data.stages[opts.stage] : opts.stage;
  if (!stage) throw new Error(`Unbekannte Stage ${String(opts.stage)}`);
  const ctx: Ctx = compile(data, stage, opts.difficulty, opts.players);
  const eco = data.economy;
  const state: SimState = {
    tick: 0,
    wave: 0,
    phase: 'prep',
    waveOpen: false,
    waveTimer: 0,
    prepTicksLeft: eco.prepTicks,
    skipPending: false,
    baseHp: eco.baseHp,
    result: null,
    godMode: opts.godMode === true,
    nextId: 1,
    rng: seedRng(opts.seed),
    players: Array.from({ length: opts.players }, (_, id) => ({ id, coins: eco.startCoins, skipVote: false })),
    units: [],
    enemies: [],
    spawnQueue: [],
    stats: {
      spawned: 0,
      kills: 0,
      leaks: 0,
      leakDamage: 0,
      coinsWaveBonus: 0,
      coinsBounty: 0,
      coinsFarm: 0,
      coinsSold: 0,
      damageByPlayer: new Array<number>(opts.players).fill(0),
    },
  };
  const w: World = { state, ctx, events: [], unitMods: opts.unitMods ?? [] };
  const isOver = (): boolean => state.phase === 'over';
  const covCache = new Map<number, number>();

  function stepOnce(): void {
    if (state.phase === 'over') return;
    updateWaves(w);
    processSpawns(w);
    tickEffects(w);
    resolveDeaths(w);
    moveEnemies(w);
    if (state.baseHp <= 0) {
      finish(w, 'loss');
      return;
    }
    runUnits(w);
    resolveDeaths(w);
    checkVictory(w);
    state.tick++;
  }

  const sim: Sim = {
    state,
    apply: (playerId, cmd) => applyCommand(w, playerId, cmd),
    step(ticks = 1) {
      for (let i = 0; i < ticks && state.phase !== 'over'; i++) stepOnce();
    },
    runWave() {
      if (state.phase === 'over') return;
      if (state.phase === 'prep') state.skipPending = true;
      const target = state.phase === 'prep' ? 1 : state.wave;
      if (target >= ctx.totalWaves && state.phase === 'wave' && !state.waveOpen) {
        // Letzte Wave bereits beendet: weiterlaufen bis zum Matchende.
        while (!isOver()) stepOnce();
        return;
      }
      // Läuft, bis die Wave endet (Timer, alles tot/geleakt oder Skip); dann ist Wave n+1 bereits gestartet.
      for (;;) {
        stepOnce();
        if (isOver()) return;
        if (state.wave !== target || !state.waveOpen) return;
      }
    },
    isOver,
    result: () => state.result,
    hash: () => hashState(state),
    drainEvents() {
      const e = w.events;
      w.events = [];
      return e;
    },
    slots() {
      return ctx.slots.map((s) => {
        const occ = state.units.find((u) => u.slot === s.id);
        return {
          id: s.id,
          x: s.x,
          y: s.y,
          kind: s.kind,
          size: s.size,
          free: !occ,
          occupant: occ ? occ.id : null,
          coverageByRange: (range: number) => {
            const key = s.id * 1_000_000 + range;
            let v = covCache.get(key);
            if (v === undefined) {
              v = coverage(ctx.path, s.x, s.y, range);
              covCache.set(key, v);
            }
            return v;
          },
        };
      });
    },
    catalog: () => ctx.unitList,
    upgradeCost(entityId) {
      const u = state.units.find((x) => x.id === entityId);
      if (!u) return null;
      const def = ctx.units[u.defId];
      return u.level >= def.maxLevel ? null : def.upgradeCosts[u.level];
    },
    placeCost(unitId) {
      const d = ctx.units[unitId];
      if (!d) throw new Error(`Unbekannte Unit ${unitId}`);
      return d.placeCost;
    },
  };
  return sim;
}
