/** Öffentliche API des Simulationskerns. */
export { createSim, type Sim, type SimOptions, type SlotCenter } from './sim.js';
export type { Command, CommandResult } from './commands.js';
export type { SimState, SimEvent, EnemyState, UnitState, PlayerState, TargetMode, UnitMod, IncomeSource, BossRun } from './state.js';
export type { BossKit, RiskCard } from './data/schema.js';
export type { WavePreview, WavePreviewGroup } from './systems/cards.js';
import type { Sim } from './sim.js';
import type { WavePreview } from './systems/cards.js';
/** Wellenvorschau (K1): Gegnertypen, Anzahl, Modifier, Boss ja/nein. Gleichwertig zu `sim.previewWave(n, cardId?)`. */
export const previewWave = (sim: Sim, n: number, cardId?: string | null): WavePreview | null => sim.previewWave(n, cardId);
export type { UnitDef, LevelStat, CompiledAttack, CompiledDot, FxSpec, AttackKind, DamageType } from './data/compile.js';
export { unknownEffects } from './data/compile.js';
export type { GameData, StageData, DifficultyId } from './data/schema.js';
export { loadGameData, loadProgression, loadUnits, mergeUnitFiles } from './data/load.js';
export { UnitFileSchema, EffectsSchema, ELEMENTS, UNIT_RARITIES } from './data/schema.js';
export type { ProgressionData } from './data/schema.js';
export { damageBpFor, starsForCopies, unitModFor, metaProfileLevels, metaProfileMods, type MetaProfileName } from './progression.js';
export { hashState, stableStringify } from './hash.js';
export { computeHit } from './damage.js';
export * as fixed from './fixed.js';
