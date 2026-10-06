/**
 * Zustandstypen. Der gesamte Zustand ist reines JSON aus Ganzzahlen/Strings/Booleans/null
 * (Float verboten, wird beim Hashen geprüft) und wird komplett in den Hash einbezogen.
 */
import type { Ctx } from './data/compile.js';
import type { RngState } from './prng.js';

export type TargetMode = 'first' | 'last' | 'close' | 'strongest';
export type DotKind = 'bleed' | 'burn' | 'poison';

export interface DotState {
  ticksLeft: number;
  /** Ticks bis zum nächsten Schadenstick. */
  nextIn: number;
  /** Schaden je Tick-Intervall (1 s) in Centi-HP. */
  perIntervalCenti: number;
  owner: number;
  unit: number;
}

export interface EnemyState {
  id: number;
  type: string;
  wave: number;
  flying: boolean;
  boss: boolean;
  elite: boolean;
  hp: number;
  maxHp: number;
  shield: number;
  armor: number;
  regen: boolean;
  element: number;
  leak: number;
  /** Kill-Bounty in Münzen (bei Spawn fest berechnet). */
  bounty: number;
  /** Basisgeschwindigkeit in Mikro-Milli-Tiles je Tick (1/1000 Milli-Tile). */
  speedMicro: number;
  /** Pfadfortschritt in Milli-Tiles + Rest in Mikro-Milli-Tiles (0..999). */
  progress: number;
  frac: number;
  x: number;
  y: number;
  stunTicks: number;
  stunImmune: number;
  slowBp: number;
  slowTicks: number;
  bleed: DotState | null;
  burn: DotState | null;
  poison: DotState | null;
  /** Wirksamer Schaden je Spieler (Index = Spieler-ID) für die Bounty-Verteilung. */
  dmgShare: number[];
}

export interface UnitState {
  id: number;
  defId: string;
  owner: number;
  slot: number;
  level: number;
  /** Investierte Münzen (Platzierung + bezahlte Upgrades) für den Verkaufswert. */
  invested: number;
  targeting: TargetMode;
  /** Ticks bis zum nächsten Angriff. */
  cd: number;
  abilityCd: number;
  /** Hooks: Level-Multiplikator, Trait-Schaden (additiv), Farm-Ertrag (alle Basispunkte; Standard x1 / +0). */
  lvlBp: number;
  traitBp: number;
  yieldBp: number;
  damageDealt: number;
  damageReported: number;
}

export interface PlayerState {
  id: number;
  coins: number;
  skipVote: boolean;
}

export interface SpawnEntry {
  atTick: number;
  type: string;
  wave: number;
  modifiers: string[];
  element: number;
}

export interface SimStats {
  spawned: number;
  kills: number;
  leaks: number;
  leakDamage: number;
  coinsWaveBonus: number;
  coinsBounty: number;
  coinsFarm: number;
  coinsSold: number;
  damageByPlayer: number[];
}

export type Phase = 'prep' | 'wave' | 'over';

export interface SimState {
  tick: number;
  /** Zuletzt gestartete Wave (0 = Prep). */
  wave: number;
  phase: Phase;
  /** Läuft die aktuelle Wave noch (Bonus noch nicht ausgezahlt)? */
  waveOpen: boolean;
  waveTimer: number;
  prepTicksLeft: number;
  skipPending: boolean;
  /** Verbleibende Leben (Team gemeinsam). Ersetzt Base-HP. */
  lives: number;
  /** Maximum (Startleben + Meta-Bonus); Regeneration deckelt hier. */
  maxLives: number;
  result: 'win' | 'loss' | null;
  godMode: boolean;
  nextId: number;
  rng: RngState;
  players: PlayerState[];
  units: UnitState[];
  enemies: EnemyState[];
  spawnQueue: SpawnEntry[];
  stats: SimStats;
}

export type IncomeSource = 'waveBonus' | 'bounty' | 'farm' | 'sell' | 'donate';

export type SimEvent =
  | { type: 'spawn'; tick: number; enemyId: number; enemy: string; wave: number }
  | { type: 'kill'; tick: number; enemyId: number; enemy: string; wave: number; bounty: number }
  | { type: 'leak'; tick: number; enemyId: number; enemy: string; wave: number; damage: number; hp: number; maxHp: number; fatal: boolean }
  | { type: 'waveStart'; tick: number; wave: number }
  | { type: 'waveEnd'; tick: number; wave: number }
  | { type: 'income'; tick: number; player: number; amount: number; source: IncomeSource }
  | { type: 'damage'; tick: number; unitId: number; owner: number; amount: number }
  | { type: 'place'; tick: number; player: number; unitId: number; unit: string; slot: number; cost: number }
  | { type: 'upgrade'; tick: number; player: number; unitId: number; level: number; cost: number }
  | { type: 'sell'; tick: number; player: number; unitId: number; refund: number }
  | { type: 'ability'; tick: number; player: number; unitId: number; kind: string }
  | { type: 'over'; tick: number; result: 'win' | 'loss' };

/** Laufzeitkontext der Systeme: veränderlicher Zustand + unveränderliche abgeleitete Daten. */
export interface World {
  state: SimState;
  ctx: Ctx;
  events: SimEvent[];
  unitMods: UnitMod[];
}

/** Optionale Per-Instanz-Hooks (Trait/Level/Meta), siehe createSim({ unitMods }). */
export interface UnitMod {
  player: number;
  unit: string;
  lvlBp?: number;
  traitBp?: number;
  yieldBp?: number;
}
