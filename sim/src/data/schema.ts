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
  coop: z.object({ ref, hpPerExtraPlayerBp: nat, donationStep: pos, maxPlayers: pos }),
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

export interface GameData {
  economy: EconomyData;
  enemies: EnemiesData;
  modifiers: ModifiersData;
  difficulties: DifficultiesData;
  /** Optional; nur Datenkonzept (P3). */
  challenges?: ChallengesData;
  units: UnitsData;
  stages: Record<string, StageData>;
}
export { int };
