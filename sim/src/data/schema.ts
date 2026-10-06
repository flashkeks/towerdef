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
  baseHp: pos,
  waveTimerTicks: pos,
  prepTicks: pos,
  waveBonus: z.object({ ref, base: nat, perWave: nat }),
  bounty: z.object({ ref, gammaStartBp: pos, gammaDecayBp: pos }),
  sell: z.object({ ref, combatBp: nat, farmBp: nat }),
  leakDamage: z.object({ ref }).catchall(nat.or(z.string())),
  coop: z.object({ ref, hpPerExtraPlayerBp: nat, donationStep: pos, maxPlayers: pos }),
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

export const DifficultySchema = z.object({
  ref,
  _comment: comment,
  hpBp: pos,
  speedBp: pos,
  elementsActive: z.boolean(),
});
export const DifficultiesSchema = z.object({
  ref,
  normal: DifficultySchema,
  hard: DifficultySchema,
  nightmare: DifficultySchema,
});
export type DifficultyId = 'normal' | 'hard' | 'nightmare';
export type DifficultyDef = z.infer<typeof DifficultySchema>;
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

export interface GameData {
  economy: EconomyData;
  enemies: EnemiesData;
  modifiers: ModifiersData;
  difficulties: DifficultiesData;
  units: UnitsData;
  stages: Record<string, StageData>;
}
export { int };
