/**
 * Öffentliche Typen des Simulators (Vertrag: docs/design/schnittstelle.md).
 * Positionen in Milli-px, Zeit in Ticks (60/s), Faktoren in Basispunkten, Zustand nur Ganzzahlen.
 */

export type TowerType = 'ranger' | 'bombardier' | 'frostcaller';
export type HeroType = 'wren';
export type EnemyType = 'red' | 'blue' | 'green' | 'gold' | 'ironshell' | 'ember' | 'brute' | 'leviathan';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TargetMode = 'first' | 'last' | 'strong' | 'close';
export type Tiers = [number, number, number];
export type AbilityId = 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak';
export type DamageType = 'sharp' | 'cold' | 'explosive' | 'energy' | 'magic';
export type ProjectileKind = 'arrow' | 'bigArrow' | 'bolt' | 'starBolt' | 'bomb' | 'frag' | 'frost' | 'shard' | 'lantern';

export interface GameOptions {
  map: string;
  difficulty: Difficulty;
  seed: number;
  /** Was das Profil freigeschaltet hat (P4). Fehlt = alles frei (Tests, Sandbox). */
  unlocks?: { towers: (TowerType | HeroType)[]; maxTier: Record<TowerType, Tiers> };
  /**
   * Turm-XP-Konto aus dem Profil (Runde 11b). Fehlt = kein XP-System aktiv (keine Verteilung, `unlockTier` → `no-xp`).
   * Das Konto lebt im Match in `state.towerXp`; das Endkonto geht zurück ins Profil.
   */
  towerXp?: Record<TowerType, number>;
  /** Wissensbaum (P4), alles optional, Standard 0. Bedeutung: siehe sim/README.md. */
  mods?: {
    startCash?: number;
    lives?: number;
    sellBp?: number;
    earlyBonus?: number;
    t1DiscountBp?: number;
    rangeBp?: Partial<Record<TowerType, number>>;
    radiusBp?: number;
    slowDurBp?: number;
    heroStartLevel?: number;
    /** Zuschlag auf den Turm-XP-Topf in Basispunkten ("Fast Learner": 2000 = +20 %). */
    towerXpBp?: number;
  };
}

export type Command =
  | { type: 'place'; tower: TowerType | HeroType; x: number; y: number }
  | { type: 'upgrade'; towerId: number; path: 0 | 1 | 2 }
  | { type: 'unlockTier'; tower: TowerType; path: 0 | 1 | 2 }
  | { type: 'sell'; towerId: number }
  | { type: 'target'; towerId: number; mode: TargetMode }
  | { type: 'ability'; ability: AbilityId }
  | { type: 'startRound' }
  | { type: 'autoStart'; on: boolean };

export type CommandResult = { ok: true; id?: number } | { ok: false; reason: string };
export type PlaceCheck = { ok: true } | { ok: false; reason: string };

export interface UpgradeInfo {
  path: 0 | 1 | 2;
  /** Aktuelle Stufe dieses Pfads (0..5). */
  current: number;
  /** Nächste Stufe (1..5) oder null, wenn der Pfad voll ist. */
  next: number | null;
  name: string;
  desc: string;
  /** Preis der nächsten Stufe (Schwierigkeit, Wissensbaum eingerechnet); 0 wenn next = null. */
  price: number;
  /** Freigeschaltete Stufe dieses Pfads für den Turmtyp (`maxTier`, 0..5). */
  unlocked: number;
  /** Turm-XP, die das Freischalten der nächsten Stufe kostet; 0 wenn `next` = null oder schon freigeschaltet. */
  unlockCost: number;
  /** Name/Beschreibung der nächsten Stufe sichtbar (Stufe 1 immer, sonst wenn die Stufe davor freigeschaltet ist). Sonst sind `name`/`desc` leer. */
  revealed: boolean;
  /** Kaufbar jetzt (Geld, Crosspath, Freischaltung alles ok). */
  canBuy: boolean;
  /** Warum nicht: 'maxed' | 'crosspath' | 'locked' | 'no-cash' | 'hero' */
  reason?: string;
}

/** Eine Stufe im Freischalt-Menü eines Turmtyps (`Game.unlockInfo`). */
export interface UnlockTierInfo {
  tier: number;
  /** Stufe 1 immer, sonst wenn die Stufe davor freigeschaltet ist. Sonst sind `name`/`desc` leer ("???" in der UI). */
  revealed: boolean;
  unlocked: boolean;
  name: string;
  desc: string;
  /** Turm-XP-Kosten dieser Stufe (immer sichtbar). */
  cost: number;
}
export interface UnlockPathInfo {
  path: 0 | 1 | 2;
  /** Pfadname nur, wenn Stufe 1 des Pfads sichtbar ist (immer). */
  name: string;
  /** Freigeschaltete Stufen (0..5). */
  unlocked: number;
  /** Nächste freischaltbare Stufe (1..5) oder null. */
  next: number | null;
  /** Warum `next` jetzt nicht geht: 'maxed' | 'no-xp' | 'locked'. */
  reason?: string;
  tiers: UnlockTierInfo[];
}

export interface TowerState {
  id: number;
  type: TowerType | HeroType;
  x: number;
  y: number;
  tiers: Tiers;
  heroLevel: number;
  heroXp: number;
  target: TargetMode;
  /** 0 = rechts, gegen den Uhrzeigersinn in 45°-Schritten. */
  facing: number;
  /** 0 = idle, sonst Ticks seit `windup` (1..18). */
  attackTick: number;
  pops: number;
  spent: number;
  camo: boolean;
  range: number;
  // --- Innenleben (Teil des Hashes, für die UI uninteressant) ---
  /** Abklingzähler in Milli-Ticks. */
  cd: number;
  windupLeft: number;
  windupTarget: number;
  shots: number;
  auraCd: number;
  thunderCd: number;
}

export interface EnemyState {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  progress: number;
  hp: number;
  maxHp: number;
  camo: boolean;
  revealed: boolean;
  slowBp: number;
  slowTicks: number;
  stunTicks: number;
  frozenTicks: number;
  burnTicks: number;
  damageStage: number;
  // --- Innenleben ---
  /** Bruchteil von Milli-px (0..999). */
  frac: number;
  /** Runde, aus der der Gegner stammt (Kinder erben). */
  round: number;
  brittleTicks: number;
  burnDmg: number;
  burnOwner: number;
  dead: boolean;
}

export interface ProjectileState {
  id: number;
  kind: ProjectileKind;
  owner: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  arc?: { x0: number; y0: number; x1: number; y1: number; t: number };
  // --- Innenleben ---
  dmg: number;
  dtype: DamageType;
  pierce: number;
  life: number;
  age: number;
  /** Ids bereits getroffener Gegner (und der Kinder der Opfer). */
  hit: number[];
  /** 0 = Hauptschuss, 1 = Splitter/Frag (ohne Haupt-Effekte). */
  sub: number;
}

export type AbilityState = { id: AbilityId; ready: boolean; cdLeft: number; cdTotal: number };

export interface GameState {
  tick: number;
  phase: 'build' | 'wave' | 'won' | 'lost' | 'freeplay';
  round: number;
  roundsCleared: number;
  cash: number;
  lives: number;
  towers: TowerState[];
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  abilities: AbilityState[];
  /** Turm-XP-Konto im Match (Start = `GameOptions.towerXp`, sonst 0). */
  towerXp: Record<TowerType, number>;
  /** Im Match verdiente Turm-XP je Typ (Summe der `towerXp`-Events). */
  towerXpGained: Record<TowerType, number>;
  /** Freigeschaltete Stufe je Pfad im Match (Start = `unlocks.maxTier`, ohne `unlocks` überall 5). */
  maxTier: Record<TowerType, Tiers>;
  /** Pops (ohne Held) je Typ seit dem letzten Rundenende; Grundlage der Topf-Aufteilung. */
  roundPops: Record<TowerType, number>;
  stats: { pops: Record<TowerType | HeroType, number>; leaked: number; spent: Record<string, number> };
  // --- Innenleben ---
  autoStart: boolean;
  heroPlaced: boolean;
  rainLeft: number;
  nextId: number;
  rng: number[];
  /** Laufende Spawn-Gruppen. */
  groups: { round: number; type: EnemyType; camo: boolean; left: number; next: number; gap: number }[];
  /** Gestartete, noch nicht beendete Runden. */
  activeRounds: number[];
}

export type SimEvent =
  | { type: 'windup'; tick: number; tower: number; target: number }
  | { type: 'fire'; tick: number; tower: number; projectile?: number; kind: ProjectileKind | 'chain' }
  | { type: 'hit'; tick: number; enemy: number; tower: number; dmg: number; dtype: DamageType; x: number; y: number }
  | { type: 'blocked'; tick: number; enemy: number; x: number; y: number; reason: 'armor' | 'immune' }
  | { type: 'pop'; tick: number; enemy: number; etype: EnemyType; x: number; y: number; children: number[]; cash: number }
  | { type: 'explode'; tick: number; x: number; y: number; radius: number; kind: 'bomb' | 'mini' | 'star' | 'quake' }
  | { type: 'nova'; tick: number; x: number; y: number; radius: number }
  | { type: 'chain'; tick: number; tower: number; points: [number, number][]; dmg: number }
  | { type: 'status'; tick: number; enemy: number; kind: 'slow' | 'stun' | 'freeze' | 'burn' | 'reveal' }
  | { type: 'leak'; tick: number; enemy: number; etype: EnemyType; lives: number }
  | { type: 'place'; tick: number; tower: number; ttype: TowerType | HeroType; cash: number }
  | { type: 'upgrade'; tick: number; tower: number; ttype: TowerType | HeroType; tiers: Tiers; cash: number }
  | { type: 'sell'; tick: number; tower: number; ttype: TowerType | HeroType; cash: number }
  | { type: 'unlockTier'; tick: number; tower: TowerType; path: 0 | 1 | 2; tier: number; cost: number; xp: number }
  | { type: 'towerXp'; tick: number; round: number; pot: number; gains: Partial<Record<TowerType, number>> }
  | { type: 'heroLevel'; tick: number; tower: number; level: number }
  | { type: 'ability'; tick: number; id: AbilityId; x?: number; y?: number }
  | { type: 'roundStart'; tick: number; round: number }
  | { type: 'roundEnd'; tick: number; round: number; bonus: number }
  | { type: 'bossStage'; tick: number; enemy: number; stage: number }
  | { type: 'gameOver'; tick: number; result: 'won' | 'lost'; round: number };

export interface Game {
  readonly state: GameState;
  apply(cmd: Command): CommandResult;
  step(ticks?: number): void;
  drainEvents(): SimEvent[];
  hash(): string;
  canPlace(type: TowerType | HeroType, x: number, y: number): PlaceCheck;
  upgradeInfo(towerId: number): UpgradeInfo[];
  /** Freischalt-Menü eines Turmtyps: 3 Pfade × 5 Stufen mit Sichtbarkeit und Kosten (Turm-XP). */
  unlockInfo(type: TowerType): UnlockPathInfo[];
  sellValue(towerId: number): number;
  priceOf(type: TowerType | HeroType): number;
  /** Nur für Tests/Sandbox: Gegner direkt setzen, Schaden direkt zufügen. Ändert den Zustand wie ein normaler Eingriff (deterministisch). */
  readonly sandbox: {
    spawn(type: EnemyType, progress?: number, camo?: boolean): number;
    hurt(enemyId: number, amount: number, dtype?: DamageType): boolean;
    setCash(cash: number): void;
  };
}
