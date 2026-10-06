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

/** Laufzeitzustand eines Boss-Kits (P4, K5). Alles Ganzzahlen; Zeiten in Ticks, Faktoren in Basispunkten, `ward` in Centi-HP. */
export interface BossRun {
  /** Kit-ID (data/bosses.json). */
  kit: string;
  /** Aktuelle Phase (Index in `phases`, steigt nur). */
  phase: number;
  /** Rest-Schild (Centi-HP) und Ticks bis zum Ablauf; Fenster, das beim Brechen aufgeht. */
  ward: number;
  wardTicks: number;
  wardWindowTicks: number;
  wardWindowBp: number;
  /** Schwachstellen-Fenster: solange `vulnTicks` > 0 nimmt der Boss `vulnBp`-fachen Schaden und volle Stun-Dauer. */
  vulnTicks: number;
  vulnBp: number;
  /** Sturm (charge): Geschwindigkeitsfaktor, solange `hasteTicks` > 0; danach optionales Fenster `exhaustTicks`/`exhaustBp`. */
  hasteTicks: number;
  hasteBp: number;
  exhaustTicks: number;
  exhaustBp: number;
  /** Restabklingzeit je Fähigkeit des Kits (Index = Position in `abilities`). */
  cd: number[];
  /** Laufender Telegraph: Fähigkeit (Index), Ticks bis zur Wirkung, wurde der Boss währenddessen betäubt? */
  tele: { ability: number; left: number; interrupted: boolean } | null;
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
  /** Boss-Kit-Zustand (nur Boss mit Kit für seine Wave, sonst null). */
  bossRun: BossRun | null;
  /** Risikokarte, unter der die Wave gestartet wurde (null = keine). */
  card: string | null;
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
  /** Risikokarte der Wave (null = keine). */
  card: string | null;
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
  /** Für die nächste zu startende Wave gewählte Risikokarte (P4, K1); wird beim Wave-Start verbraucht. */
  nextCard: string | null;
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
  | { type: 'spawn'; tick: number; enemyId: number; enemy: string; wave: number; summon?: true }
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
  | { type: 'over'; tick: number; result: 'win' | 'loss' }
  // Boss-Kits (P4, K5): Phase, Telegraph (Vorwarnung), Wirkung/Unterbrechung, Schwachstellen-Fenster, Schild.
  | { type: 'bossPhase'; tick: number; enemyId: number; kit: string; phase: number; id: string; name: string }
  | { type: 'bossTelegraph'; tick: number; enemyId: number; kit: string; ability: string; kind: string; warnTicks: number; fireTick: number; interruptible: boolean }
  | { type: 'bossCast'; tick: number; enemyId: number; kit: string; ability: string; kind: string; interrupted: boolean }
  | { type: 'bossWindow'; tick: number; enemyId: number; open: boolean; damageBp: number; ticks: number; cause: 'ward' | 'cast' | 'interrupt' | 'exhaust' | 'phase' }
  | { type: 'bossWard'; tick: number; enemyId: number; state: 'up' | 'broken' | 'expired'; hp: number }
  | { type: 'cardChosen'; tick: number; player: number; card: string | null; wave: number };

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
