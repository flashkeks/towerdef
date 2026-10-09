/**
 * Öffentliche Typen des Simulators (Vertrag: docs/design/schnittstelle.md).
 * Positionen in Milli-px, Zeit in Ticks (60/s), Faktoren in Basispunkten, Zustand nur Ganzzahlen.
 */

export type TowerType = 'ranger' | 'bombardier' | 'frostcaller' | 'longshot' | 'market' | 'thornweaver' | 'alchemist';
export type HeroType = 'wren';
export type EnemyType =
  | 'red' | 'blue' | 'green' | 'gold' | 'ironshell' | 'ember' | 'brute' | 'leviathan'
  // Runde 15
  | 'pink' | 'frostling' | 'crystal' | 'gloomship' | 'wyrm' | 'colossus';
/** Runde 15: Spielmodi (Zusatzmodi je Karte). `standard` = normales Spiel. */
export type ModeId = 'standard' | 'primary-only' | 'specialists-only' | 'no-hero' | 'half-cash' | 'deflation';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TargetMode = 'first' | 'last' | 'strong' | 'close';
export type Tiers = [number, number, number];
export type AbilityId = 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak' | 'focus' | 'supplyDrop' | 'grant' | 'wallOfTrees' | 'tonic';
export type DamageType = 'sharp' | 'cold' | 'explosive' | 'energy' | 'magic';
export type PowerKey =
  | 'goldDrop' | 'lanternBomb' | 'caltrops' | 'frostTrap' | 'timeWarp' | 'lanternOil' | 'extraLives' | 'heroBoost'
  | 'instaWarden:ranger' | 'instaWarden:bombardier' | 'instaWarden:frostcaller';
export type TrapKind = 'caltrops' | 'frostTrap';
export type ProjectileKind = 'arrow' | 'bigArrow' | 'bolt' | 'starBolt' | 'bomb' | 'frag' | 'frost' | 'shard' | 'lantern' | 'snipe' | 'thorn' | 'potion';

export interface GameOptions {
  map: string;
  difficulty: Difficulty;
  seed: number;
  /** Runde 15: Spielmodus (Standard `standard`). Regeln: sim/README.md "Runde 15". */
  mode?: ModeId;
  /** Was das Profil freigeschaltet hat (P4). Fehlt = alles frei (Tests, Sandbox). */
  unlocks?: { towers: (TowerType | HeroType)[]; maxTier: Partial<Record<TowerType, Tiers>> };
  /**
   * Turm-XP-Konto aus dem Profil (Runde 11b). Fehlt = kein XP-System aktiv (keine Verteilung, `unlockTier` → `no-xp`).
   * Das Konto lebt im Match in `state.towerXp`; das Endkonto geht zurück ins Profil.
   */
  towerXp?: Partial<Record<TowerType, number>>;
  /** Power-Inventar aus dem Profil (Runde 12). Fehlt = keine Powers. Fehlende Schlüssel zählen als 0. */
  powers?: Partial<Record<PowerKey, number>>;
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
    // --- Runde 13 (Wissensbaum) ---
    /** Rabatt auf alle Stufe-2-Upgrades von Ranger/Bombardier/Frostcaller ("Veteran Primaries", 1000 = −10 %). */
    t2DiscountBp?: number;
    /** Angriffstempo je Turmtyp in Basispunkten, additiv zu Auren ("Quick Hands" 500, "Steady Aim" 1000). */
    tempoBp?: Partial<Record<TowerType, number>>;
    /** Verlängert Absolute Zero um Ticks ("Deep Freeze" 30). */
    freezeAddTicks?: number;
    /** Market-Ertrag in Basispunkten ("Market Savvy" 1000). */
    marketBp?: number;
    /** Bank-Zinsen in Basispunkten zusätzlich, nur mit Bank ("Compound Interest" 500). */
    bankRateBp?: number;
    /** Gold pro Supply Drop zusätzlich ("Supply Lines" 200). */
    supplyBonus?: number;
    /** Market-Wirkradius in Basispunkten ("Wide Aura" 1500). */
    marketRadiusBp?: number;
    /** Rabatt auf den Kaufpreis eines Markets ("Bulk Orders" 1000). */
    marketPriceBp?: number;
    /** Wren-XP-Zuschlag in Basispunkten ("Hero Training" 1500). */
    heroXpBp?: number;
    /** Einsätze je Power-Art und Runde (Standard 1; "Spare Pocket" 2). */
    powerUses?: number;
    /** Zusätzliche Powers zu Matchbeginn ("Starter Kit": goldDrop 1). */
    freePowers?: Partial<Record<PowerKey, number>>;
    // --- Runde 14 (Wissensbaum) ---
    /** Pop-Gold-Zuschlag in Basispunkten mit Bruchrest ("Pop Bonus" 500). */
    popCashBp?: number;
    /** Zusätzliche Pierce je Turmtyp ("Sharper Arrows": ranger 1). */
    pierceAdd?: Partial<Record<TowerType, number>>;
    /** Zusätzliche Splitter je Turmtyp, nur wenn der Turm schon Splitter wirft ("Fused Shells": bombardier 2). */
    fragAdd?: Partial<Record<TowerType, number>>;
    /** Frostcaller: Zusatzschaden auf eingefrorene Gegner ("Icicle Edge" 1). */
    icicleDmg?: number;
    /** Jungle's Bounty: Zusatzgold je Runde ("Bountiful Grove" 50). */
    bountyGold?: number;
    /** Buff-Tränke des Alchemisten halten länger, Basispunkte ("Potent Brews" 2500). */
    brewDurBp?: number;
    /** Lead to Gold: Zusatzgold je Ironshell ("Midas Hands" 20). */
    leadGoldAdd?: number;
    /** Leben je Rundenende ("Field Medic" 1). */
    roundLives?: number;
    /** Leckschutz: so viele Lecks werden je Match verhindert ("Sturdy Gate" 1). */
    gate?: number;
  };
}

export type Command =
  | { type: 'place'; tower: TowerType | HeroType; x: number; y: number }
  | { type: 'upgrade'; towerId: number; path: 0 | 1 | 2 }
  | { type: 'unlockTier'; tower: TowerType; path: 0 | 1 | 2 }
  | { type: 'sell'; towerId: number }
  | { type: 'target'; towerId: number; mode: TargetMode }
  | { type: 'ability'; ability: AbilityId }
  /** Runde 13: Bank eines Markets (Lockbox …) abheben. Gründe: `no-tower`, `not-bank`, `empty`. */
  | { type: 'withdraw'; towerId: number }
  /** Runde 12: Power einsetzen. `x`/`y` (Milli-px) nur bei Ziel-Powers (Lantern Bomb, Fallen, Insta-Warden). */
  | { type: 'power'; power: PowerKey; x?: number; y?: number }
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
  /** Runde 13: Bank-Konto (Market mit Lockbox …), sonst 0. Zählt erst als Geld, wenn abgehoben (oder verkauft). */
  bank: number;
  // --- Runde 14 (sichtbar für die UI) ---
  /** Thornweaver: Radius der Dornenranken-Zone in Milli-px (0 = keine). */
  zone: number;
  /** Alchemist-Buff auf diesem Turm (Trank): Restticks, Schaden, Reichweite/Tempo in Basispunkten. Dauerhafte Tränke (Permanent Brew) stehen hier nicht, nur in `Game.buffOf`. */
  buffTicks: number;
  buffDmg: number;
  buffRangeBp: number;
  buffSpeedBp: number;
  /** Transforming Tonic: Restticks der Monster-Form (0 = normal). */
  monsterTicks: number;
  /** Runde 15: Frost Wyrm hat den Turm eingefroren, Restticks (0 = nicht eingefroren): der Turm tut nichts. */
  frozen: number;
  // --- Innenleben Runde 14 ---
  zapCd: number;
  whirlCd: number;
  snareCd: number;
  zoneCd: number;
  brewCd: number;
  shrinkCd: number;
}

/** Wall of Trees (Thornweaver B3): Weg-Objekt, schluckt Gegner bis `left` RBE aufgebraucht sind. */
export interface WallState {
  id: number;
  owner: number;
  /** Milli-px auf dem Weg. */
  progress: number;
  /** Runde 15: Ast (-1 = gemeinsamer Wegteil). */
  branch: number;
  x: number;
  y: number;
  /** Noch freie RBE (Kapazität 150). */
  left: number;
  /** Restticks bis die Wand ungenutzt verschwindet. */
  ttl: number;
}

/** Säurepfütze (Alchemist C2) auf dem Weg. */
export interface PuddleState {
  id: number;
  owner: number;
  progress: number;
  /** Runde 15: Ast (-1 = gemeinsamer Wegteil). */
  branch: number;
  x: number;
  y: number;
  /** Radius in Milli-px. */
  radius: number;
  /** Verbleibende Treffer. */
  charges: number;
  ttl: number;
  cd: number;
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
  /** Runde 14: Ranken-Fessel (Thornweaver), Restticks; der Gegner steht (`stunTicks` ist mitgesetzt). */
  vineTicks: number;
  /** Runde 14: Rubber to Gold, Restticks; jede geknackte Schicht gibt +1 Gold. Kinder erben den Rest. */
  goldTicks: number;
  /** Runde 14: Unstable Concoction, Id des Alchemisten (0 = nicht markiert); explodiert beim Tod. */
  volatile: number;
  /** Runde 13: Boss-Markierung (Crippling Shot): Restticks und Zusatzschaden aus allen Quellen in Basispunkten. */
  markTicks: number;
  markBp: number;
  // --- Runde 15 ---
  /** Ast der Karte (0 bei Karten mit einem Weg). `progress` zaehlt auf jedem Ast ab dessen Start; Aeste einer Karte sind gleich lang. */
  branch: number;
  /** Merkmal Fortified: Huelle doppelt (Ironshell, Brute, Crystal, Blimps, Bosse). Kinder erben. */
  fortified: boolean;
  /** Merkmal Regrow ("Bloom"): hoechster Typ, bis zu dem die Schichten nachwachsen (null = kein Regrow). Kinder erben. */
  regrowTo: EnemyType | null;
  /** Regrow: Restticks bis zur naechsten nachgewachsenen Schicht. */
  regrowTicks: number;
  /** Lava-Stampfer des Ember Colossus: Restticks mit +50 % Tempo. */
  hasteTicks: number;
  /** Boss-Faehigkeit (Frosthauch des Frost Wyrm): Restticks bis zum naechsten Einsatz. */
  bossCd: number;
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

/** Falle auf dem Weg (Runde 12). `x`/`y` liegen auf der Wegmitte bei `progress`. */
export interface TrapState {
  id: number;
  kind: TrapKind;
  /** Milli-px auf dem Weg. */
  progress: number;
  x: number;
  y: number;
  /** Verbleibende Ladungen. */
  charges: number;
  /** Runde 15: Ast, auf dem die Falle liegt (-1 = gemeinsamer Wegteil, wirkt auf alle Aeste). */
  branch: number;
  /** Innenleben: Falle verschwindet am Ende dieser Runde (0 = nie). */
  until: number;
}

/** Vorschau einer Runde (`Game.roundPreview`). */
export interface RoundPreview {
  round: number;
  /** Gleiche Typ/Camo-Gruppen zusammengefasst, Reihenfolge des ersten Auftretens. */
  groups: { type: EnemyType; n: number; camo: boolean; regrow: boolean; fortified: boolean }[];
  /** Summe der RBE aller Gegner der Runde (Hülle + Kinder, Boss-HP der Schwierigkeit). */
  rbe: number;
  hasCamo: boolean;
  /** Ein Gegner oder ein Nachkomme (Brute -> Ironshell) trägt Panzer. */
  hasArmor: boolean;
  /** Ein Gegner oder ein Nachkomme ist Emberling (kälteimmun). */
  hasEmber: boolean;
  hasBoss: boolean;
  /** Runde 15: ein Gegner oder Nachkomme ist explosions-immun (Frostling). */
  hasFrostling: boolean;
  /** Runde 15: Blimp (Gloomship) in der Runde. */
  hasBlimp: boolean;
  hasRegrow: boolean;
  hasFortified: boolean;
}

/** Aktuelle Market-Kennwerte (`Game.marketInfo`). */
export interface MarketInfo {
  /** Einkommen der nächsten Rundenende-Auszahlung (Wissensbaum und Golden Exchange eingerechnet), ohne Zinsen. */
  income: number;
  hasBank: boolean;
  bank: number;
  bankRateBp: number;
  bankCap: number;
  /** Zinsen, die beim nächsten Rundenende auf das aktuelle Konto fallen würden. */
  nextInterest: number;
  grantCash: number;
  /** Wirkradius der Auren in Milli-px (= `TowerState.range`). */
  radius: number;
}
/** Auren, die auf einen Turm wirken (stärkster Wert je Feld über alle Markets im Radius). */
export interface TowerAura {
  rangeBp: number;
  camo: boolean;
  speedBp: number;
  armor: boolean;
  pierce: number;
  dmg: number;
  discountBp: number;
}

/** Runde 14: wirksame Buffs auf einem Turm (stärkster Wert je Feld über Trank-Timer und Permanent Brew). */
export interface TowerBuff {
  dmg: number;
  rangeBp: number;
  speedBp: number;
  /** Spring Blessing (Thornweaver C4), Basispunkte Tempo; ist in `speedBp` NICHT enthalten. */
  groveSpeedBp: number;
  /** Mindestens ein Trank liegt dauerhaft an (Permanent Brew). */
  permanent: boolean;
  /** Restticks des Trank-Timers (0 = keiner). */
  ticks: number;
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
  stats: {
    pops: Record<TowerType | HeroType, number>;
    leaked: number;
    spent: Record<string, number>;
    /** Runde 12: erfolgreiche Einsätze je Power in diesem Match. */
    powersUsed: Record<PowerKey, number>;
    /** Runde 13: Summe des Market-Einkommens (inkl. Zinsen) in diesem Match. */
    income: number;
    /** Runde 13: Gold aus den Fähigkeiten Grant und Supply Drop. */
    abilityCash: number;
    /** Runde 14: Gold und Leben aus Thornweaver-Rundenerträgen (World Tree, Jungle's Bounty, Field Medic), Gold aus Lead/Rubber/Shrink. */
    groveGold: number;
    healed: number;
    bountyGold: number;
  };
  /** Runde 12: Restbestand je Power (Start = `GameOptions.powers`). */
  powers: Record<PowerKey, number>;
  /** Runde 12: je Power die Runde (`state.round`) des letzten Einsatzes, -1 = nie. Gesperrt, solange sie `state.round` entspricht. */
  powerUsedRound: Record<PowerKey, number>;
  /** Runde 13: Einsätze je Power in der Runde `powerUsedRound` (Spare Pocket erlaubt 2). */
  powerUses: Record<PowerKey, number>;
  /** Runde 12: Fallen auf dem Weg, aufsteigende id. */
  traps: TrapState[];
  /** Runde 14: Bäume-Wände (Thornweaver) und Säurepfützen (Alchemist) auf dem Weg. */
  walls: WallState[];
  puddles: PuddleState[];
  /** Runde 14: Sturdy Gate, noch verbleibende Leck-Verhinderungen. */
  gateLeft: number;
  /** Runde 14: Bruchrest von Pop Bonus (0..9999). */
  popCarry: number;
  /** Runde 15: Half Cash, Bruchrest der Halbierung (0 oder 1). */
  halfCarry: number;
  /** Runde 15: Runde vor der ersten Runde des Matches (0; Deflation: letzte Runde - 11). */
  baseRound: number;
  // --- Innenleben ---
  /** Time Warp: Restticks. */
  warpLeft: number;
  /** Lantern Oil: aktiv, solange `state.round <= oilRound` (0 = nie benutzt). */
  oilRound: number;
  /** Lantern Oil: Rest der Prozentrechnung in Basispunkten (0..9999). */
  oilCarry: number;
  autoStart: boolean;
  heroPlaced: boolean;
  rainLeft: number;
  /** Runde 13: Focus (Longshot B4), Restticks. */
  focusLeft: number;
  nextId: number;
  rng: number[];
  /** Laufende Spawn-Gruppen. */
  groups: { round: number; type: EnemyType; camo: boolean; regrow: boolean; fortified: boolean; /** Ast oder -1 = abwechselnd */ lane: number; /** schon gespawnte Gegner */ spawned: number; left: number; next: number; gap: number }[];
  /** Gestartete, noch nicht beendete Runden. */
  activeRounds: number[];
}

export type SimEvent =
  | { type: 'windup'; tick: number; tower: number; target: number }
  | { type: 'fire'; tick: number; tower: number; projectile?: number; kind: ProjectileKind | 'chain' }
  | { type: 'hit'; tick: number; enemy: number; tower: number; dmg: number; dtype: DamageType; x: number; y: number }
  | { type: 'blocked'; tick: number; enemy: number; x: number; y: number; reason: 'armor' | 'immune' | 'explosion' }
  | { type: 'pop'; tick: number; enemy: number; etype: EnemyType; x: number; y: number; children: number[]; cash: number }
  | { type: 'explode'; tick: number; x: number; y: number; radius: number; kind: 'bomb' | 'mini' | 'star' | 'quake' | 'acid' | 'unstable' }
  | { type: 'nova'; tick: number; x: number; y: number; radius: number }
  | { type: 'chain'; tick: number; tower: number; points: [number, number][]; dmg: number }
  | { type: 'status'; tick: number; enemy: number; kind: 'slow' | 'stun' | 'freeze' | 'burn' | 'reveal' | 'mark' | 'snare' | 'acid' | 'gold' | 'volatile' }
  /** Runde 13: Ricochet (Longshot C2), sofort. `points` = Treffer + Sprungziele. */
  | { type: 'ricochet'; tick: number; tower: number; points: [number, number][]; dmg: number }
  /** Runde 13: Market-Einkommen am Rundenende. `amount` = verdient (inkl. Zinsen), `cash` = direkt ausgezahlt, `bank` = Kontostand danach. */
  | { type: 'income'; tick: number; tower: number; round: number; amount: number; cash: number; bank: number }
  | { type: 'withdraw'; tick: number; tower: number; amount: number }
  /** Runde 14: Thornweaver-/Alchemist-Ereignisse (sofort, Position in Milli-px). */
  /** Wirbelwind (A3): `enemies` = zurückgeworfene Gegner, `px` = Rückstoß in Milli-px Wegfortschritt. */
  | { type: 'whirlwind'; tick: number; tower: number; x: number; y: number; radius: number; px: number; enemies: number[] }
  /** Ranke hält `enemy` für `ticks` fest (B2). */
  | { type: 'vine'; tick: number; tower: number; enemy: number; x: number; y: number; ticks: number }
  /** Dornenranken-Zone pulsiert (B4/B5), einmal je Sekunde: `hits` = getroffene Gegner. */
  | { type: 'zone'; tick: number; tower: number; x: number; y: number; radius: number; dmg: number; hits: number }
  /** Wall of Trees entsteht / schluckt einen Gegner / verschwindet. */
  | { type: 'wall'; tick: number; id: number; tower: number; x: number; y: number; progress: number; left: number }
  | { type: 'wallEat'; tick: number; wall: number; enemy: number; etype: EnemyType; x: number; y: number; rbe: number; left: number; cash: number }
  | { type: 'wallGone'; tick: number; id: number; reason: 'spent' | 'expired' }
  /** Buff-Trank (A3-A5) von `tower` auf `target`; `ticks` 0 = dauerhaft (Permanent Brew, nur beim ersten Mal je Turm gemeldet). */
  | { type: 'brew'; tick: number; tower: number; target: number; ticks: number; dmg: number; rangeBp: number; speedBp: number }
  /** Monster-Form (Transforming Tonic): Turm `tower` für `ticks`; `source` = auslösender Alchemist. */
  | { type: 'monster'; tick: number; tower: number; source: number; ticks: number }
  /** Säurepfütze entsteht, wird aufgefrischt oder verbraucht Treffer (`charges` = Rest) / verschwindet. */
  | { type: 'puddle'; tick: number; id: number; tower: number; x: number; y: number; radius: number; charges: number }
  | { type: 'puddleGone'; tick: number; id: number; reason: 'spent' | 'expired' }
  /** Shrink Potion: `enemy` war `from`, ist jetzt ein Red Glim (gleiche Id und Position). */
  | { type: 'shrink'; tick: number; tower: number; enemy: number; from: EnemyType; x: number; y: number; cash: number }
  /** Zusatzgold an einer Stelle: Lead to Gold (Ironshell geknackt). */
  | { type: 'bounty'; tick: number; tower: number; x: number; y: number; gold: number; reason: 'lead' }
  /** Rundenertrag Leben (Jungle's Bounty, Field Medic). */
  | { type: 'heal'; tick: number; tower: number; lives: number }
  /** Sturdy Gate hat ein Leck verhindert. */
  | { type: 'gate'; tick: number; enemy: number; etype: EnemyType }
  | { type: 'leak'; tick: number; enemy: number; etype: EnemyType; lives: number }
  | { type: 'place'; tick: number; tower: number; ttype: TowerType | HeroType; cash: number }
  | { type: 'upgrade'; tick: number; tower: number; ttype: TowerType | HeroType; tiers: Tiers; cash: number }
  | { type: 'sell'; tick: number; tower: number; ttype: TowerType | HeroType; cash: number }
  | { type: 'unlockTier'; tick: number; tower: TowerType; path: 0 | 1 | 2; tier: number; cost: number; xp: number }
  | { type: 'towerXp'; tick: number; round: number; pot: number; gains: Partial<Record<TowerType, number>> }
  | { type: 'heroLevel'; tick: number; tower: number; level: number }
  | { type: 'ability'; tick: number; id: AbilityId; x?: number; y?: number; cash?: number }
  | { type: 'power'; tick: number; power: PowerKey; x?: number; y?: number }
  | { type: 'trap'; tick: number; id: number; kind: TrapKind; charges: number }
  | { type: 'trapGone'; tick: number; id: number; kind: TrapKind; reason: 'spent' | 'expired' }
  | { type: 'roundStart'; tick: number; round: number }
  | { type: 'roundEnd'; tick: number; round: number; bonus: number }
  | { type: 'bossStage'; tick: number; enemy: number; stage: number }
  /** Runde 15: Frost Wyrm haucht (alle 8 s): Radius in Milli-px, `towers` = eingefrorene Tuerme (ohne Wirkung auf Bereits-Eingefrorene mitgezaehlt). */
  | { type: 'bossBreath'; tick: number; enemy: number; etype: EnemyType; x: number; y: number; radius: number; ticks: number; towers: number[] }
  | { type: 'towerFrozen'; tick: number; tower: number; ticks: number; source: number }
  /** Runde 15: Frost Wyrm spuckt `n` Frostlinge (bei 66 % und 33 %); `ids` = neue Gegner. */
  | { type: 'bossSpit'; tick: number; enemy: number; x: number; y: number; ids: number[] }
  /** Runde 15: Lava-Stampfer des Ember Colossus (bei jeder Platte): `enemies` = beschleunigte Gegner im Radius. */
  | { type: 'stomp'; tick: number; enemy: number; x: number; y: number; radius: number; ticks: number; enemies: number[] }
  /** Runde 15: Regrow, `enemy` wurde von `from` zu `to` (gleiche Id). */
  | { type: 'regrow'; tick: number; enemy: number; from: EnemyType; to: EnemyType; x: number; y: number }
  | { type: 'gameOver'; tick: number; result: 'won' | 'lost'; round: number };

/** Runde 15: Rahmendaten des Matches (aendern sich nicht). */
export interface GameInfo {
  map: string;
  mode: ModeId;
  difficulty: Difficulty;
  /** Letzte Runde dieser Karte (Meadow 20, Frostfen 25, Quarry 30); Sieg nach dieser Runde. */
  maxRound: number;
  /** Runde vor der ersten Runde des Matches (0; Deflation: maxRound - 11). */
  baseRound: number;
  /** Anzahl der Wegaeste der Karte (Frostfen 2, sonst 1). */
  branches: number;
}

export interface Game {
  readonly state: GameState;
  readonly info: GameInfo;
  apply(cmd: Command): CommandResult;
  step(ticks?: number): void;
  drainEvents(): SimEvent[];
  hash(): string;
  canPlace(type: TowerType | HeroType, x: number, y: number): PlaceCheck;
  upgradeInfo(towerId: number): UpgradeInfo[];
  /** Freischalt-Menü eines Turmtyps: 3 Pfade × 5 Stufen mit Sichtbarkeit und Kosten (Turm-XP). */
  unlockInfo(type: TowerType): UnlockPathInfo[];
  /** Verkaufserlös (70 %/75 % der Ausgaben, aufgerundet) plus Bank-Inhalt eines Markets. */
  sellValue(towerId: number): number;
  /** Runde 13: Market-Kennwerte für Panel und Münz-Animation; null, wenn der Turm kein Market ist. */
  marketInfo(towerId: number): MarketInfo | null;
  /** Runde 13: Auren der Markets, die gerade auf diesen Turm wirken (alle 0 = keine). */
  auraOf(towerId: number): TowerAura;
  /** Runde 14: Was an Alchemist-Trank und Thornweaver-Segen auf dem Turm liegt (inkl. Permanent Brew). */
  buffOf(towerId: number): TowerBuff;
  priceOf(type: TowerType | HeroType): number;
  /** Runde 12: Trockenlauf von `{ type: 'power' }` (ändert nichts) für Vorschau-Kreis/Geist. Liefert dieselben Gründe wie `apply`. */
  canUsePower(power: PowerKey, x?: number, y?: number): PlaceCheck;
  /** Runde 12: Vorschau der Runde `r` (1..`info.maxRound`), sonst null. */
  roundPreview(r: number): RoundPreview | null;
  /** Nur für Tests/Sandbox: Gegner direkt setzen, Schaden direkt zufügen. Ändert den Zustand wie ein normaler Eingriff (deterministisch). */
  readonly sandbox: {
    spawn(type: EnemyType, progress?: number, camo?: boolean, branch?: number): number;
    hurt(enemyId: number, amount: number, dtype?: DamageType): boolean;
    setCash(cash: number): void;
  };
}
