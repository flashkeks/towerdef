/**
 * Vertragstypen der Sim (docs/design/schnittstelle.md), abgeschrieben, damit der Client gegen sie bauen kann, bevor P1 auf dev ist.
 * Sobald `sim/src/index.ts` diese Typen selbst exportiert, schaltet `client/src/sim.ts` auf die echte Sim um und diese Datei entfaellt.
 */
export type TowerType = 'ranger' | 'bombardier' | 'frostcaller';
export type HeroType = 'wren';
export type EnemyType = 'red' | 'blue' | 'green' | 'gold' | 'ironshell' | 'ember' | 'brute' | 'leviathan';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TargetMode = 'first' | 'last' | 'strong' | 'close';
export type Tiers = [number, number, number];
export type AbilityId = 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak';

export interface GameOptions {
  map: string;
  difficulty: Difficulty;
  seed: number;
  unlocks?: { towers: (TowerType | HeroType)[]; maxTier: Record<TowerType, Tiers> };
  mods?: {
    startCash?: number; lives?: number; sellBp?: number; earlyBonus?: number; t1DiscountBp?: number;
    rangeBp?: Partial<Record<TowerType, number>>; radiusBp?: number; slowDurBp?: number; heroStartLevel?: number;
  };
}

export type PlaceCheck = { ok: true } | { ok: false; reason: string };
export type CommandResult = { ok: true; id?: number } | { ok: false; reason: string };

export type Command =
  | { type: 'place'; tower: TowerType | HeroType; x: number; y: number }
  | { type: 'upgrade'; towerId: number; path: 0 | 1 | 2 }
  | { type: 'sell'; towerId: number }
  | { type: 'target'; towerId: number; mode: TargetMode }
  | { type: 'ability'; ability: AbilityId }
  | { type: 'startRound' }
  | { type: 'autoStart'; on: boolean };

/** Je Pfad: was als Naechstes kaufbar ist (Form fuer die UI; P1 liefert dieselben Felder, Abweichungen nur in sim.ts anpassen). */
export interface UpgradeInfo {
  path: 0 | 1 | 2;
  /** aktuelle Stufe dieses Pfads (0..5) */
  tier: number;
  /** naechste Stufe (1..5) oder null, wenn der Pfad voll ist */
  next: number | null;
  price: number;
  /** null = kaufbar (ggf. zu wenig Geld), sonst Schluessel: 'crosspath' | 'locked' | 'max' */
  locked: string | null;
}

export interface TowerState {
  id: number; type: TowerType | HeroType; x: number; y: number;
  tiers: Tiers;
  heroLevel: number;
  heroXp: number;
  target: TargetMode;
  facing: number;
  attackTick: number;
  pops: number; spent: number;
  camo: boolean;
  range: number;
}

export interface EnemyState {
  id: number; type: EnemyType; x: number; y: number;
  progress: number;
  hp: number; maxHp: number;
  camo: boolean; revealed: boolean;
  slowBp: number; slowTicks: number; stunTicks: number; frozenTicks: number; burnTicks: number;
  damageStage: number;
}

export type ProjectileKind = 'arrow' | 'bigArrow' | 'bolt' | 'starBolt' | 'bomb' | 'frag' | 'frost' | 'shard' | 'lantern';
export interface ProjectileState {
  id: number; kind: ProjectileKind; owner: number;
  x: number; y: number; vx: number; vy: number;
  arc?: { x0: number; y0: number; x1: number; y1: number; t: number };
}

export interface GameState {
  tick: number;
  phase: 'build' | 'wave' | 'won' | 'lost' | 'freeplay';
  round: number;
  roundsCleared: number;
  cash: number; lives: number;
  towers: TowerState[];
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  abilities: { id: AbilityId; ready: boolean; cdLeft: number; cdTotal: number }[];
  stats: { pops: Record<TowerType | HeroType, number>; leaked: number; spent: Record<string, number> };
}

export type SimEvent =
  | { type: 'windup'; tick: number; tower: number; target: number }
  | { type: 'fire'; tick: number; tower: number; projectile?: number; kind: ProjectileKind | 'chain' }
  | { type: 'hit'; tick: number; enemy: number; tower: number; dmg: number; dtype: string; x: number; y: number }
  | { type: 'blocked'; tick: number; enemy: number; x: number; y: number; reason: 'armor' | 'immune' }
  | { type: 'pop'; tick: number; enemy: number; etype: EnemyType; x: number; y: number; children: number[]; cash: number }
  | { type: 'explode'; tick: number; x: number; y: number; radius: number; kind: 'bomb' | 'mini' | 'star' | 'quake' }
  | { type: 'nova'; tick: number; x: number; y: number; radius: number }
  | { type: 'chain'; tick: number; tower: number; points: [number, number][]; dmg: number }
  | { type: 'status'; tick: number; enemy: number; kind: 'slow' | 'stun' | 'freeze' | 'burn' | 'reveal' }
  | { type: 'leak'; tick: number; enemy: number; etype: EnemyType; lives: number }
  | { type: 'place'; tick: number; tower: number; ttype: TowerType | HeroType }
  | { type: 'upgrade'; tick: number; tower: number; ttype: TowerType | HeroType; tiers: Tiers; path?: number }
  | { type: 'sell'; tick: number; tower: number; ttype: TowerType | HeroType; cash: number }
  | { type: 'heroLevel'; tick: number; tower: number; level: number }
  | { type: 'ability'; tick: number; id: AbilityId; x?: number; y?: number }
  | { type: 'roundStart'; tick: number; round: number }
  | { type: 'roundEnd'; tick: number; round: number; bonus?: number }
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
  sellValue(towerId: number): number;
  priceOf(type: TowerType | HeroType): number;
}
