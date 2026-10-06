/**
 * zod-Schemas aller Datendateien (sim/data/*.json).
 * Jede Gruppe trägt ein `ref` (Quelle in docs/comparison/recommendations.md) und optional `_comment`.
 * Alle Zahlen sind Festkomma-Ganzzahlen (Einheiten siehe sim/README.md).
 */
import { z } from 'zod';

const ref = z.string().min(1);
const comment = z.string().optional();
const int = z.number().int();
const nat = z.number().int().nonnegative();
const pos = z.number().int().positive();

export const EconomySchema = z.object({
  ref,
  _comment: comment,
  tickRate: z.literal(20),
  startCoins: pos,
  /**
   * Leben-System (Runde 4 / P2), ersetzt Base-HP. `start` + `metaBonus` (Meta-Ausbau, M3; bis dahin 0) = Maximum.
   * `regenPerWave`: Leben, die am Ende jeder Wave zurückkommen (höchstens bis zum Maximum).
   * `instantLoss`: Archetyp-IDs, deren Leak die Runde sofort beendet (Boss; Elite = Entscheidung, s. kalibrierung.md).
   */
  lives: z.object({ ref, start: pos, metaBonus: nat, regenPerWave: nat, instantLoss: z.array(z.string()) }),
  waveTimerTicks: pos,
  prepTicks: pos,
  waveBonus: z.object({ ref, base: nat, perWave: nat }),
  bounty: z.object({ ref, gammaStartBp: pos, gammaDecayBp: pos }),
  sell: z.object({ ref, combatBp: nat, farmBp: nat }),
  leakDamage: z.object({ ref }).catchall(nat.or(z.string())),
  coop: z.object({
    ref,
    hpPerExtraPlayerBp: nat,
    /** P5: optionale Tabelle des Koop-HP-Faktors je Spielerzahl (Index 0 = 1 Spieler, muss 10000 sein); überschreibt die lineare Formel. */
    hpTableBp: z.array(pos).min(1).optional(),
    /** P5: dasselbe nur für den Archetyp boss (getrennte Boss-HP-Skalierung); fehlt sie, gilt der normale Faktor. */
    bossHpTableBp: z.array(pos).min(1).optional(),
    donationStep: pos,
    maxPlayers: pos,
  }),
  /** Infinite-Parameter (recommendations §3); fehlt der Block, gelten die Standardwerte aus compile.ts/infinite.ts. */
  infinite: z
    .object({
      ref,
      /** Pool je Wave in Milli-Grunt-Äquivalenten (32 000 = 32 Grunts). */
      poolMilli: pos,
      /** Pool einer Boss-Wave (Boss + Elite + Grunts). */
      bossPoolMilli: pos,
      speedPerWaveBp: nat,
      speedMaxBp: pos,
      enemyCap: pos,
    })
    .optional(),
  caps: z.object({ ref, teamUnits: pos, teamSlots: pos, enemies: pos }),
  cc: z.object({
    ref,
    stunTicks: pos,
    stunImmuneTicks: nat,
    slowMaxBp: nat,
    bossCcBp: pos,
  }),
  dot: z.object({ ref, intervalTicks: pos, bossEliteBp: pos }),
  regen: z.object({ ref, perSecondBp: nat }),
  buffCaps: z.object({ ref, damageBp: nat, tempoBp: nat, rangeBp: nat, vulnerableBp: nat }),
  damage: z.object({
    ref,
    minDamageCenti: pos,
    armorBase: pos,
    elementStrongBp: pos,
    elementWeakBp: pos,
    critDefaultMultBp: pos,
  }),
  targeting: z.object({ ref, enemyRadiusMilli: nat, strongestShieldBp: nat }),
});
export type EconomyData = z.infer<typeof EconomySchema>;

export const EnemyArchetypeSchema = z.object({
  id: z.string(),
  ref,
  _comment: comment,
  fHpBp: pos,
  fSpeedBp: pos,
  armor: nat,
  leak: nat,
  flying: z.boolean(),
  boss: z.boolean(),
  elite: z.boolean(),
  child: z.object({ type: z.string(), count: pos }).optional(),
});
export const EnemiesSchema = z.object({
  ref,
  _comment: comment,
  hpCurve: z.object({ ref, baseCenti: pos, growthBp: pos }),
  baseSpeedMilliPerSec: pos,
  archetypes: z.array(EnemyArchetypeSchema).min(1),
});
export type EnemyArchetype = z.infer<typeof EnemyArchetypeSchema>;
export type EnemiesData = z.infer<typeof EnemiesSchema>;

export const ModifiersSchema = z.object({
  ref,
  _comment: comment,
  shield: z.object({ ref, maxStacks: pos }),
  regen: z.object({ ref, stoppedBy: z.array(z.enum(['bleed', 'poison'])) }),
  armored: z.object({ ref, armorBonus: nat }),
  fast: z.object({ ref, speedBp: pos }),
});
export type ModifiersData = z.infer<typeof ModifiersSchema>;

const bp = z.number().int().min(0).max(10000);
const ModifierId = z.string().regex(/^(shield:\d+|regen|armored|fast)$/);

/** Modifier-Vergabe je Stufe (Runde 4 / P3): Anteil regulärer Gruppen (nicht Boss/Elite), die ab `fromWave` einen Modifier bekommen. */
export const DifficultyModifiersSchema = z.object({
  densityBp: bp,
  fromWave: pos,
  pool: z.array(z.object({ id: ModifierId, weight: pos })),
});
/** Wellen-Variante: pro Wave (seeded, deterministisch) mit `chanceBp` gewählt; höchstens eine je Wave. */
export const WaveVariantSchema = z.object({
  id: z.string().min(1),
  chanceBp: bp,
  fromWave: pos,
  /** Anzahl-Faktor auf alle regulären Gruppen (Basispunkte, floor, mindestens 1). */
  countBp: pos.default(10000),
  /** Spawn-Abstand-Faktor (Basispunkte, < 10000 = dichter). */
  intervalBp: pos.default(10000),
  /** Tauscht `shareBp` der Gegner des Typs `from` gegen Typ `to` (eigene Gruppe, gleicher Start). */
  swap: z.object({ from: z.string(), to: z.string(), shareBp: bp }).optional(),
  /** Setzt diesen Modifier auf alle regulären Gruppen der Wave, die noch keinen haben (ganze Wave gepanzert/geschirmt/schnell). */
  forceModifier: ModifierId.optional(),
});
export const DifficultySchema = z.object({
  ref,
  _comment: comment,
  /** Feinjustierung (Runde 4 / P3): Stufen unterscheiden sich über Regeln, nicht über diesen Faktor. */
  hpBp: pos,
  /** Runde 4 / P6: Koop-HP-Faktor je Spielerzahl für diese Stufe (Index 0 = 1 Spieler, muss 10000 sein); fehlt er, gilt `economy.coop.hpTableBp`. */
  coopHpTableBp: z.array(pos).min(1).optional(),
  /** Dasselbe nur für den Archetyp boss; fehlt es, gilt `economy.coop.bossHpTableBp` bzw. der normale Koop-Faktor. */
  coopBossHpTableBp: z.array(pos).min(1).optional(),
  speedBp: pos,
  elementsActive: z.boolean(),
  /** `wave`: alle Gruppen einer Wave teilen ein Element; `mixed`: Element je Gruppe versetzt (Gegenwehr braucht mehrere Elemente). */
  elementMode: z.enum(['wave', 'mixed']).default('wave'),
  modifiers: DifficultyModifiersSchema.default({ densityBp: 0, fromWave: 1, pool: [] }),
  waveVariants: z.array(WaveVariantSchema).default([]),
  /** Boss-Fähigkeiten-Set (0 = Basis, 1 = erweitert, 2 = voll). Schnittstelle für P4 (Boss-Kits); die Sim wertet es noch nicht aus. */
  bossAbilityTier: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
  /** Überschreibt `economy.lives` je Stufe (nur gesetzte Felder). */
  lives: z.object({ start: pos.optional(), regenPerWave: nat.optional(), instantLoss: z.array(z.string()).optional() }).default({}),
  /** Münz-Faktor auf Kill-Bounties (Basispunkte). */
  bountyBp: pos.default(10000),
  /** Belohnungsfaktor für Meta-Belohnungen (XP/Gems am Rundenende, M3); in der Sim nur Datenfeld. */
  rewardBp: pos.default(10000),
});
export const DifficultiesSchema = z.object({
  ref,
  normal: DifficultySchema,
  hard: DifficultySchema,
  nightmare: DifficultySchema,
});
export type DifficultyId = 'normal' | 'hard' | 'nightmare';
export type DifficultyDef = z.infer<typeof DifficultySchema>;
export type WaveVariant = z.infer<typeof WaveVariantSchema>;
export type DifficultiesData = z.infer<typeof DifficultiesSchema>;

const Modifier = z.string().regex(/^(shield:\d+|regen|armored|fast)$/);

export const StageSchema = z.object({
  ref,
  _comment: comment,
  id: z.string(),
  name: z.string(),
  waveTimerTicks: pos.optional(),
  /** Infinite-Modus: Waves ab Wave (waves.length+1) werden seeded erzeugt, kein Sieg (recommendations §3/§4). */
  infinite: z.boolean().optional(),
  /** Waypoints in Tiles (Tile-Mitten, dürfen .5 haben); werden zu Milli-Tiles. */
  path: z.array(z.tuple([z.number(), z.number()])).min(2),
  slots: z
    .array(
      z.object({
        id: nat,
        x: z.number(),
        y: z.number(),
        kind: z.enum(['ground', 'hill']),
        size: z.union([z.literal(1), z.literal(2)]),
      }),
    )
    .min(1),
  waves: z
    .array(
      z.object({
        n: pos,
        groups: z.array(
          z.object({
            type: z.string(),
            count: pos,
            intervalTicks: nat,
            delayTicks: nat,
            modifiers: z.array(Modifier),
            /** 0 = neutral, 1..5 = Element im Zyklus (wirkt ab Hard). */
            element: z.number().int().min(0).max(5),
          }),
        ),
      }),
    )
    .min(1),
});
export type StageData = z.infer<typeof StageSchema>;

const Effect = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('bleed'), totalBp: pos, ticks: pos }),
  z.object({ kind: z.literal('burn'), totalBp: pos, ticks: pos }),
  z.object({ kind: z.literal('poison'), totalBp: pos, ticks: pos }),
  z.object({ kind: z.literal('slow'), pctBp: pos, ticks: pos }),
]);
export type OnHitEffect = z.infer<typeof Effect>;

const Rarity = z.object({
  ref,
  _comment: comment,
  placeCost: pos,
  /** Upgrade-Kosten je Stufe (§6: round5(P*g^(k-1)), Halbwerte abwärts). */
  upgradeCosts: z.array(pos),
  growthBp: pos,
  cap: pos,
  spaTicks: z.tuple([pos, pos]),
  dpsCenti: z.tuple([nat, nat]),
  rangeMilli: z.tuple([pos, pos]),
});
export type RarityData = z.infer<typeof Rarity>;

export const UnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  ref,
  _comment: comment,
  rarity: z.enum(['rare', 'epic', 'legendary', 'mythic']),
  placement: z.enum(['ground', 'hill', 'hybrid']),
  role: z.string(),
  footprint: z.union([z.literal(1), z.literal(2)]).default(1),
  /** Überschreibungen der Rarity-Werte (Farm). */
  placeCost: pos.optional(),
  upgradeCosts: z.array(pos).optional(),
  cap: pos.optional(),
  sellBp: nat.optional(),
  /** Anteil am Rarity-DPS (AoE ~60 %, Kontrolle ~50 %, Support/Farm 0). */
  dpsShareBp: nat,
  attack: z
    .object({
      kind: z.enum(['single', 'circle', 'line', 'cone']),
      radiusMilli: pos.optional(),
      widthMilli: pos.optional(),
      coneDeg: pos.optional(),
    })
    .nullable(),
  defaultTargeting: z.enum(['first', 'last', 'close', 'strongest']).default('first'),
  element: z.number().int().min(0).max(5).default(0),
  penetration: nat.default(0),
  crit: z.object({ chanceBp: nat, multBp: pos }).optional(),
  onHit: z.array(Effect).default([]),
  aura: z.object({ radiusMilli: pos, damageBpByLevel: z.array(nat) }).optional(),
  farm: z.object({ yieldByLevel: z.array(pos) }).optional(),
  ability: z
    .discriminatedUnion('kind', [
      z.object({ kind: z.literal('nuke'), cooldownTicks: pos, damageMulBp: pos }),
      z.object({ kind: z.literal('stunAoe'), cooldownTicks: pos, radiusMilli: pos, stunTicks: pos }),
    ])
    .optional(),
});
export type UnitData = z.infer<typeof UnitSchema>;

export const UnitsSchema = z.object({
  ref,
  _comment: comment,
  rarities: z.object({ rare: Rarity, epic: Rarity, legendary: Rarity, mythic: Rarity }),
  units: z.array(UnitSchema).min(1),
});
export type UnitsData = z.infer<typeof UnitsSchema>;

/**
 * Challenges (vorbereitetes Datenkonzept, Runde 4 / P3): eine Stufe als Basis plus Regel-Überschreibungen und Einschränkungen.
 * Die Sim wertet sie noch nicht aus; sie werden nur geladen und auf Querverweise geprüft.
 */
export const ChallengesSchema = z.object({
  ref,
  _comment: comment,
  challenges: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      extends: z.enum(['normal', 'hard', 'nightmare']),
      /** Überschreibt Felder der Basis-Stufe (z. B. lives, modifiers, waveVariants, bossAbilityTier). */
      overrides: DifficultySchema.partial().default({}),
      restrictions: z.object({ bannedUnits: z.array(z.string()).default([]), maxTeamSlots: pos.optional(), noSell: z.boolean().default(false) }).default({ bannedUnits: [], noSell: false }),
      rewardBp: pos.default(10000),
    }),
  ),
});
export type ChallengesData = z.infer<typeof ChallengesSchema>;

/**
 * Boss-Kits (Runde 4 / P4, K5). Ein Kit gehört zu einer Wave der Stage (`wave`), gilt für den Archetyp `boss` und besteht aus
 * Phasen (HP-Schwellen), Phasen-Aktionen (Schild "ward", Beschwörung, Fenster) und Fähigkeiten mit Telegraph.
 * Schnittstelle für Schwierigkeitsstufen: jede Aktion/Fähigkeit hat `minDifficulty` (Standard normal); darunter ist sie aus.
 */
const DifficultyName = z.enum(['normal', 'hard', 'nightmare']);
const Window = z.object({ ticks: pos, bp: pos });
const PhaseAction = z.discriminatedUnion('kind', [
  /** Schild-Phase: absorbiert `hpBp` der Max-HP; läuft nach `expireTicks` ab; bricht er, öffnet sich ein Fenster. */
  z.object({
    kind: z.literal('ward'),
    hpBp: pos,
    expireTicks: pos,
    window: Window,
    minDifficulty: DifficultyName.default('normal'),
  }),
  z.object({ kind: z.literal('summon'), type: z.string(), count: pos, minDifficulty: DifficultyName.default('normal') }),
  z.object({ kind: z.literal('window'), window: Window, minDifficulty: DifficultyName.default('normal') }),
]);
const AbilityBase = {
  id: z.string(),
  name: z.string(),
  /** Aktiv ab dieser Phase (Index) bis einschließlich `toPhase` (Standard: bis zum Ende). */
  fromPhase: nat.default(0),
  toPhase: nat.optional(),
  /** Ticks nach Spawn bzw. nach Phasenbeginn bis zum ersten Einsatz. */
  firstTicks: pos,
  cooldownTicks: pos,
  /** Vorwarnzeit (Ticks) zwischen Telegraph-Ereignis und Wirkung. */
  telegraphTicks: pos,
  /** Ein erfolgreicher Stun des Bosses während des Telegraphs bricht die Fähigkeit ab. */
  interruptible: z.boolean().default(false),
  /** Fenster nach der Wirkung (bei `charge`: wenn der Sturm endet). */
  window: Window.optional(),
  /** Fenster, wenn die Fähigkeit unterbrochen wurde. */
  interruptWindow: Window.optional(),
  minDifficulty: DifficultyName.default('normal'),
};
const BossAbility = z.discriminatedUnion('kind', [
  z.object({ ...AbilityBase, kind: z.literal('summon'), type: z.string(), count: pos }),
  z.object({ ...AbilityBase, kind: z.literal('charge'), speedBp: pos, durationTicks: pos }),
  z.object({ ...AbilityBase, kind: z.literal('mend'), healBp: pos }),
]);
export const BossKitSchema = z.object({
  id: z.string(),
  name: z.string(),
  _comment: comment,
  /** Wave der Stage, in der der Boss mit diesem Kit erscheint. */
  wave: pos,
  phases: z
    .array(z.object({ id: z.string(), name: z.string(), fromHpBp: pos.max(10000), onEnter: z.array(PhaseAction).default([]) }))
    .min(1),
  abilities: z.array(BossAbility).default([]),
});
export const BossesSchema = z.object({ ref, _comment: comment, kits: z.array(BossKitSchema) });
export type BossKit = z.infer<typeof BossKitSchema>;
export type BossAbility = z.infer<typeof BossAbility>;
export type BossPhaseAction = z.infer<typeof PhaseAction>;
export type BossesData = z.infer<typeof BossesSchema>;

/**
 * Risikokarten (Runde 4 / P4, K1): vor einer Wave wählbar, wirken auf alle Gegner dieser Wave. Alle Faktoren in Basispunkten
 * (10000 = x1). `addModifiers` fügt Modifier hinzu (nur wo die Gruppe die Art nicht schon hat; nie auf Boss/Elite).
 */
export const RiskCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  text: z.string(),
  /** Grobe Stärke 1 (mild) bis 3 (hart), nur Bot-Strategie und UI-Sortierung. */
  tier: z.number().int().min(1).max(3),
  hpBp: pos.default(10000),
  speedBp: pos.default(10000),
  /** Anzahl je Gruppe: ceil(count * countBp / 10000). */
  countBp: pos.default(10000),
  bountyBp: pos.default(10000),
  /** Lebenskosten normaler Leaks (Boss-Sofortverlust bleibt). */
  leakBp: pos.default(10000),
  addModifiers: z.array(Modifier).default([]),
});
export const CardsSchema = z.object({ ref, _comment: comment, cards: z.array(RiskCardSchema).min(1) });
export type RiskCard = z.infer<typeof RiskCardSchema>;
export type CardsData = z.infer<typeof CardsSchema>;

export interface GameData {
  economy: EconomyData;
  enemies: EnemiesData;
  modifiers: ModifiersData;
  difficulties: DifficultiesData;
  /** Optional; nur Datenkonzept (P3). */
  challenges?: ChallengesData;
  units: UnitsData;
  stages: Record<string, StageData>;
  /** Runde 4 / P4. Optional, damit alte Datenobjekte (Tests, Overrides) ohne Kits weiter laufen. */
  bosses?: BossesData;
  cards?: CardsData;
}
export { int };

/**
 * Bot-Profile (Runde 4 / P6): Fehlermodell der Bots. Nur Bot-Verhalten, nie Sim-Regeln; die Datei gehört nicht zu `GameData`
 * (`loadBotProfiles` in `load.ts`). Zeiten in Sekunden (Bots entscheiden einmal je Sekunde), Wahrscheinlichkeiten in Basispunkten.
 * Alle Würfe laufen über den eigenen, geseedeten PRNG des Bots (nicht den Sim-PRNG).
 */
const secRange = z.tuple([z.number().int().min(0), z.number().int().min(0)]).refine(([a, b]) => a <= b, 'min <= max');
export const BotProfileSchema = z.object({
  ref: z.string().optional(),
  /** Zusätzliche Pause (Sekunden, gleichverteilt min..max) zwischen zwei Kaufrunden (Platzieren, Upgraden, Farm, Verkaufen). [0,0] = jede Sekunde. */
  buyDelaySec: secRange,
  /** Chance je Platzierung, statt des besten einen zufälligen anderen (bezahlbaren, nützlichen) Slot für dieselbe Unit zu nehmen. */
  worseSlotBp: z.number().int().min(0).max(10000),
  /** Chance je Unit und Wave, dass der Bot Upgrades dieser Unit in dieser Wave vergisst. */
  forgetUpgradeBp: z.number().int().min(0).max(10000),
  /** Verspätung (Sekunden, gleichverteilt) zwischen "Fähigkeit wäre sinnvoll" und dem Zünden. */
  abilityDelaySec: secRange,
  /** Wellenwissen: so viele Waves (ab der laufenden) liest der Bot per `previewWave` voraus. 0 = kein Wellenwissen: er reagiert erst, wenn der Boss da ist. */
  lookahead: z.number().int().min(0).max(20),
});
export type BotProfile = z.infer<typeof BotProfileSchema>;
export const BotProfilesSchema = z.object({
  ref: z.string().optional(),
  _comment: z.string().optional(),
  profiles: z.record(z.string(), BotProfileSchema),
});
