/**
 * Fassade des Simulationskerns: `createSim` liefert ein `Sim` mit stabiler API.
 *
 * Tick-Reihenfolge (alles in aufsteigender Entity-ID):
 *  1. Waves (Prep-Timer, Wave-Ende/-Start, Skip)   2. Spawns   2b. Boss-Kits (Phasen, Telegraph, Fenster)
 *  3. Statuseffekte/DoT/Regen + Tode
 *  4. Bewegung + Leaks (Niederlage)                5. Units: Cooldowns, Angriffe + Tode
 *  6. Sieg-Prüfung                                 7. tick++
 */
import { applyCommand, placeCostFor, placeError, type Command, type CommandResult } from './commands.js';
import { compile, type Ctx, type UnitDef } from './data/compile.js';
import { loadGameData } from './data/load.js';
import type { BossKit, DifficultyId, GameData, RiskCard, StageData } from './data/schema.js';
import { hashState } from './hash.js';
import { coverage } from './path.js';
import { placementGrid, zoneAt, type MapDef, type Point, type ZoneKind } from './placement.js';
import { seedRng } from './prng.js';
import type { SimEvent, SimState, UnitMod, World } from './state.js';
import { moveEnemies } from './systems/move.js';
import { tickBosses } from './systems/boss.js';
import { previewWave, type WavePreview } from './systems/cards.js';
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
  /** Leben sinken nicht (Leaks werden weiter gezählt); für Einkommenstests. */
  godMode?: boolean;
  /** Meta-Ausbau der Leben (zusätzlich zu `economy.lives.start`); überschreibt `economy.lives.metaBonus`. */
  metaLives?: number;
  /** Hooks für Trait-/Level-Multiplikatoren je Spieler und Unit-Typ (Standard x1). */
  unitMods?: UnitMod[];
  /** Nur Infinite: Abbruch, sobald diese Wave endet (Phase 'over', result null). Standard: unbegrenzt. */
  maxWaves?: number;
}

/** Altbestand (Runden 1-5): Mitte eines früheren festen Slots in Milli-Tiles. Keine Platzierregel, nur Hilfe für den Client bis P3 und für Tests. */
export interface SlotCenter {
  id: number;
  x: number;
  y: number;
  kind: 'ground' | 'hill';
  size: 1 | 2;
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
  /** Positionen der früheren Slots (Altbestand der Stage-Daten), Milli-Tiles. */
  slotCenters(): SlotCenter[];
  /** Pfadlänge (Milli-Tiles) in `rangeMilli` um (x, y) (Stichprobe, je Position gecacht). */
  coverage(x: number, y: number, rangeMilli: number): number;
  /** Stichproben des Pfads alle 100 Milli-Tiles Weglänge (Bots: Abdeckung bewerten). */
  pathSamples(): readonly Point[];
  /** Wäre diese Platzierung jetzt erlaubt? `null` = ja, sonst der Ablehnungsgrund wie bei `apply` (inklusive `not-enough-coins`). */
  canPlace(playerId: number, unitId: string, x: number, y: number): string | null;
  /** Statisch gültige Positionen (Halbkachel-Raster, ohne andere Units) für diese Unit: Kandidaten für Bots und Hilfen. */
  placementGrid(unitId: string): readonly Point[];
  /** Zone unter (x, y): `ground`, `hill`, `blocked`, `path` oder `null` außerhalb der Karte. */
  zoneAt(x: number, y: number): ZoneKind | null;
  /** Karte: Raster, Zonen je Kachel, Kartenrand, Pfadabstand. Nur lesen. */
  map(): Readonly<MapDef>;
  catalog(): UnitDef[];
  upgradeCost(entityId: number): number | null;
  /**
   * Aktuelle Platzierkosten (Münzen) von `unitId` für `player`: Basispreis plus Zuwachs je eigener Unit gleichen Typs, die gerade steht
   * (`economy.placeCostGrowthBp`, Unit-Feld `placeGrowthBp`). Genau der Betrag, den `place` abbucht. Ohne `player` (nur `unitId`): Spieler 0.
   */
  placeCost(player: number, unitId: string): number;
  placeCost(unitId: string): number;
  /** Wellenvorschau (K1, P4): Gegnertypen, Anzahl, Modifier, Boss ja/nein. `cardId`: hypothetische Karte (Standard: gewählte Karte der nächsten Wave). null außerhalb der Stage. */
  previewWave(n: number, cardId?: string | null): WavePreview | null;
  /** Katalog der Risikokarten (P4, K1) in Datei-Reihenfolge. */
  cards(): RiskCard[];
  /** Boss-Kits der Stage nach Wave (P4, K5), z. B. für Bots und UI (Telegraph-Namen, Phasen). */
  bossKits(): Record<number, BossKit>;
}

export function createSim(opts: SimOptions): Sim {
  const data = opts.data ?? loadGameData();
  const stage = typeof opts.stage === 'string' ? data.stages[opts.stage] : opts.stage;
  if (!stage) throw new Error(`Unbekannte Stage ${String(opts.stage)}`);
  const ctx: Ctx = compile(data, stage, opts.difficulty, opts.players, { seed: opts.seed, maxWaves: opts.maxWaves });
  const eco = data.economy;
  const startLives = (data.difficulties[opts.difficulty].lives.start ?? eco.lives.start) + (opts.metaLives ?? eco.lives.metaBonus);
  const state: SimState = {
    tick: 0,
    wave: 0,
    phase: 'prep',
    waveOpen: false,
    waveTimer: 0,
    prepTicksLeft: eco.prepTicks,
    skipPending: false,
    nextCard: null,
    guardUsed: 0,
    lives: startLives,
    maxLives: startLives,
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

  function stepOnce(): void {
    if (state.phase === 'over') return;
    updateWaves(w);
    processSpawns(w);
    tickBosses(w);
    tickEffects(w);
    resolveDeaths(w);
    moveEnemies(w);
    if (state.lives <= 0) {
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
    slotCenters: () => ctx.slots.map((s) => ({ ...s })),
    coverage: (x, y, range) => coverage(ctx.path, x, y, range),
    pathSamples: () => ctx.path.samples,
    canPlace(playerId, unitId, x, y) {
      const def = ctx.units[unitId];
      if (!def) return 'unknown-unit';
      if (!state.players[playerId]) return 'unknown-player';
      return placeError(w, playerId, def, x, y);
    },
    placementGrid(unitId) {
      const def = ctx.units[unitId];
      if (!def) throw new Error(`Unbekannte Unit ${unitId}`);
      return placementGrid(ctx, def);
    },
    zoneAt: (x, y) => zoneAt(ctx.map, x, y),
    map: () => ctx.map,
    catalog: () => ctx.unitList,
    upgradeCost(entityId) {
      const u = state.units.find((x) => x.id === entityId);
      if (!u) return null;
      const def = ctx.units[u.defId];
      return u.level >= def.maxLevel ? null : def.upgradeCosts[u.level];
    },
    previewWave: (n, cardId) => previewWave(ctx, state, n, cardId),
    cards: () => ctx.cardList,
    bossKits: () => ctx.bossKits,
    placeCost(a: number | string, b?: string) {
      const player = typeof a === 'number' ? a : 0;
      const unitId = typeof a === 'number' ? (b as string) : a;
      const d = ctx.units[unitId];
      if (!d) throw new Error(`Unbekannte Unit ${unitId}`);
      return placeCostFor(w, player, d);
    },
  };
  return sim;
}
