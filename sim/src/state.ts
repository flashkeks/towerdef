/**
 * Zustandstypen. Der gesamte Zustand ist reines JSON aus Ganzzahlen/Strings/Booleans/null
 * (Float verboten, wird beim Hashen geprüft) und wird komplett in den Hash einbezogen.
 */
import type { Ctx } from './data/compile.js';
import type { RngState } from './prng.js';

export type TargetMode = 'first' | 'last' | 'close' | 'strongest';
export type DotKind = 'bleed' | 'burn' | 'poison' | 'wither';

export interface DotState {
  kind: DotKind;
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
  wardWindowArmor: number;
  /** Schwachstellen-Fenster: solange `vulnTicks` > 0 nimmt der Boss `vulnBp`-fachen Schaden und volle Stun-Dauer. */
  vulnTicks: number;
  vulnBp: number;
  /** Sturm (charge): Geschwindigkeitsfaktor, solange `hasteTicks` > 0; danach optionales Fenster `exhaustTicks`/`exhaustBp`. */
  hasteTicks: number;
  hasteBp: number;
  exhaustTicks: number;
  exhaustBp: number;
  exhaustArmor: number;
  /** Restabklingzeit je Fähigkeit des Kits (Index = Position in `abilities`). */
  cd: number[];
  /** Laufender Telegraph: Fähigkeit (Index), Ticks bis zur Wirkung, wurde der Boss währenddessen betäubt? */
  tele: { ability: number; left: number; interrupted: boolean; /** Schaden (Centi-HP) während des Telegraphs und Schwelle (`staggerBp`, 0 = keine); Runde 5 / P3. */ dmg: number; need: number; cause?: 'stun' | 'damage' | null } | null;
  /** Rüstung der Phase (Runde 5 / P3): -1 = die Basis-Rüstung des Gegners; `vulnArmor`: Rüstung, solange das Fenster offen ist (-1 = keine Änderung). */
  armor: number;
  vulnArmor: number;
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
  /** CC-Gruppe (Stun, Freeze, Timestop, Rückwärtslaufen): höchstens eins zugleich; danach `stunImmune` Ticks Sperre (`stunImmuneAfter` wird beim Ende übernommen). */
  stunTicks: number;
  backTicks: number;
  stunImmune: number;
  stunImmuneAfter: number;
  /** Bewusstlos (Runde 8): steht still, keine Sperre, stapelt mit der CC-Gruppe. */
  uncTicks: number;
  slowBp: number;
  slowTicks: number;
  slowImmune: number;
  slowImmuneAfter: number;
  /** Knockback-Sperre in Ticks. */
  kbImmune: number;
  /** Bleed-Verstärkung (Faktor in Bp, 10000 = keine) solange `bleedAmpTicks` > 0. */
  bleedAmpBp: number;
  bleedAmpTicks: number;
  /** Heilsperre (Wither-Effekt) in Ticks. */
  regenBlock: number;
  /** Mehr erhaltener Schaden je Schadensart (Cursed/Hexed/Dismembered) in Bp; `*Ticks` = Rest, -1 = dauerhaft. */
  physTakenBp: number;
  physTakenTicks: number;
  magicTakenBp: number;
  magicTakenTicks: number;
  /** Aktive DoT-Instanzen (Burn/Bleed/Poison/Wither), in Reihenfolge des Auftragens. */
  dots: DotState[];
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
  /** Position (Milli-Tiles, Mitte der Unit). */
  x: number;
  y: number;
  level: number;
  /** Investierte Münzen (Platzierung + bezahlte Upgrades) für den Verkaufswert. */
  invested: number;
  targeting: TargetMode;
  /** Ticks bis zum nächsten Angriff. */
  cd: number;
  /** Hooks: Level-Multiplikator, Trait-Schaden (additiv), Farm-Ertrag (alle Basispunkte; Standard x1 / +0). */
  lvlBp: number;
  traitBp: number;
  yieldBp: number;
  /** Trait-Reichweite und -Tempo (Bp, nur gesetzt wenn != 0). */
  traitRangeBp?: number;
  traitSpaBp?: number;
  /** Selbst-Buffs aus Effekten (Runde 8): Battlelust-Stapel (je Angriff), Snatched-Stapel + Restdauer, Sunshine-Wellen, Motivate-Buffs von Verbündeten (Bp + Restticks). */
  lust: number;
  snatch: number;
  snatchTicks: number;
  sun: number;
  motDmgBp: number;
  motDmgTicks: number;
  motRangeBp: number;
  motRangeTicks: number;
  damageDealt: number;
  damageReported: number;
  /**
   * Fähigkeiten (Runde 9 / P1). Alle Felder nur gesetzt, wenn die Unit sie braucht (Replay-Hashes älterer Läufe bleiben gleich):
   * `ab` = Rest-Abklingzeit je Fähigkeit (Ticks, Index = Position in `def.abilities`), `auto` = 1, wenn der Auto-Schalter an ist,
   * `run` = laufende Mehrfach-Wirkung (Fähigkeit, übrige Schläge, Ticks bis zum nächsten),
   * `rot` = Zähler des Angriffs-Wechsels (Zweitangriffe), `motTempoBp/Ticks` und `motCritBp/Ticks` = Tempo- und Crit-Buffs (wie Motivate: stärkster gewinnt).
   */
  ab?: number[];
  auto?: 1;
  run?: { i: number; left: number; next: number };
  rot?: number;
  motTempoBp?: number;
  motTempoTicks?: number;
  motCritBp?: number;
  motCritTicks?: number;
}

/** Eine Beschwörung im Spiel (Runde 9 / P1). */
export interface SummonState {
  id: number;
  /** Eintrag im Katalog `units.summons`. */
  def: string;
  owner: number;
  /** Beschwörer (Unit-ID); verschwindet die Unit, verschwinden ihre Wesen. */
  parent: number;
  x: number;
  y: number;
  /** `walk`: Pfadfortschritt in Milli-Tiles + Rest (wie bei Gegnern); `stand`: 0. */
  progress: number;
  frac: number;
  /** Rest-Lebensdauer in Ticks (-1 = unbegrenzt). */
  life: number;
  /** Rest-Haltbarkeit in Ticks gegen einen Standard-Gegner im Kontakt. */
  hp: number;
  cd: number;
  /** `walk`: Pfadfortschritt, an dem die Beschwörung erschien (sie entfernt sich nur begrenzt davon). */
  home: number;
  /** Platz neben dem Beschwörer (`stand`). */
  slot: number;
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
  /** Beschwörungen (Runde 9 / P1); das Feld entsteht erst mit der ersten Beschwörung. */
  summons?: SummonState[];
  enemies: EnemyState[];
  spawnQueue: SpawnEntry[];
  stats: SimStats;
}

export type IncomeSource = 'waveBonus' | 'bounty' | 'farm' | 'sell' | 'donate' | 'ability';

export type SimEvent =
  | { type: 'spawn'; tick: number; enemyId: number; enemy: string; wave: number; summon?: true }
  | { type: 'kill'; tick: number; enemyId: number; enemy: string; wave: number; bounty: number }
  | { type: 'leak'; tick: number; enemyId: number; enemy: string; wave: number; damage: number; hp: number; maxHp: number; fatal: boolean; /** Runde 7 / P6: vom Leak-Schild abgefangen (damage 0). */ guarded?: true }
  | { type: 'waveStart'; tick: number; wave: number }
  | { type: 'waveEnd'; tick: number; wave: number }
  | { type: 'income'; tick: number; player: number; amount: number; source: IncomeSource }
  | { type: 'damage'; tick: number; unitId: number; owner: number; amount: number }
  | { type: 'place'; tick: number; player: number; unitId: number; unit: string; x: number; y: number; cost: number }
  | { type: 'upgrade'; tick: number; player: number; unitId: number; level: number; cost: number }
  | { type: 'sell'; tick: number; player: number; unitId: number; refund: number }
  | { type: 'over'; tick: number; result: 'win' | 'loss' }
  // Boss-Kits (P4, K5): Phase, Telegraph (Vorwarnung), Wirkung/Unterbrechung, Schwachstellen-Fenster, Schild.
  | { type: 'bossPhase'; tick: number; enemyId: number; kit: string; phase: number; id: string; name: string }
  | { type: 'bossTelegraph'; tick: number; enemyId: number; kit: string; ability: string; kind: string; warnTicks: number; fireTick: number; interruptible: boolean; /** Runde 5 / P3: Schaden-Schwelle (Centi-HP) zum Zerstören der Wirkung, 0 = keine. */ staggerNeed?: number }
  | { type: 'bossCast'; tick: number; enemyId: number; kit: string; ability: string; kind: string; interrupted: boolean; /** Runde 5 / P3: womit unterbrochen (null = nicht unterbrochen). */ cause?: 'stun' | 'damage' | null }
  | { type: 'bossWindow'; tick: number; enemyId: number; open: boolean; damageBp: number; ticks: number; cause: 'ward' | 'cast' | 'interrupt' | 'exhaust' | 'phase'; /** Runde 5 / P3: Rüstung im Fenster (-1 = unverändert). */ armor?: number }
  | { type: 'bossArmor'; tick: number; enemyId: number; armor: number; base: number }
  | { type: 'bossWard'; tick: number; enemyId: number; state: 'up' | 'broken' | 'expired'; hp: number }
  | { type: 'cardChosen'; tick: number; player: number; card: string | null; wave: number }
  // Fähigkeiten und Beschwörungen (Runde 9 / P1).
  | { type: 'ability'; tick: number; unitId: number; owner: number; ability: string; name: string; auto: boolean }
  | { type: 'summonSpawn'; tick: number; summonId: number; def: string; name: string; parent: number; x: number; y: number }
  | { type: 'summonEnd'; tick: number; summonId: number; def: string; cause: 'life' | 'dead' | 'parent' | 'blast'; x: number; y: number };

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
  /** Trait (Runde 8 / P2): Reichweite in Bp (+1000 = +10 %) und Angriffsintervall in Bp (-1000 = 10 % schneller). Fehlt = 0; nur wenn gesetzt, landen die Felder im Unit-Zustand (Replay-Hashes älterer Läufe bleiben gleich). */
  rangeBp?: number;
  spaBp?: number;
}
