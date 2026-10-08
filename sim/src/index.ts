/** Öffentliche API des Simulationskerns. */
export { createSim, type Sim, type SimOptions, type SlotCenter } from './sim.js';
export type { Command, CommandResult } from './commands.js';
export type { SimState, SimEvent, EnemyState, UnitState, SummonState, PlayerState, TargetMode, UnitMod, IncomeSource, BossRun } from './state.js';
export type { BossKit, RiskCard } from './data/schema.js';
export type { WavePreview, WavePreviewGroup } from './systems/cards.js';
import type { Sim } from './sim.js';
import type { WavePreview } from './systems/cards.js';
/** Wellenvorschau (K1): Gegnertypen, Anzahl, Modifier, Boss ja/nein. Gleichwertig zu `sim.previewWave(n, cardId?)`. */
export const previewWave = (sim: Sim, n: number, cardId?: string | null): WavePreview | null => sim.previewWave(n, cardId);
export type { UnitDef, LevelStat, CompiledAttack, CompiledDot, FxSpec, AttackKind, DamageType, AbilityDef, AuraDef, SummonDef, BuffSpec } from './data/compile.js';
export { unknownEffects } from './data/compile.js';
export type { GameData, StageData, DifficultyId, Theme, WorldFile, WaveTemplate, LegendStagesData, RaidsData } from './data/schema.js';
export { WorldFileSchema, WaveTemplateSchema, StageSchema, LegendStagesSchema, RaidsSchema } from './data/schema.js';
export { loadGameData, loadModes, loadProgression, loadUnits, loadWorlds, mergeUnitFiles, validateGameData } from './data/load.js';
export { actStageId, expandWorld, infiniteStageId, validateWorlds, worldCatalog, type StageKind, type WorldInfo, type WorldStageInfo } from './data/worlds.js';
export { UnitFileSchema, EffectsSchema, ELEMENTS, UNIT_RARITIES } from './data/schema.js';
export type { ProgressionData } from './data/schema.js';
export { damageBpFor, starsForCopies, unitModFor, metaProfileLevels, metaProfileMods, type MetaProfileName } from './progression.js';
export { hashState, stableStringify } from './hash.js';
export { computeHit } from './damage.js';
export * as fixed from './fixed.js';
