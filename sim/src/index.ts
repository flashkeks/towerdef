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
export type { UnitDef, LevelStat } from './data/compile.js';
export type { GameData, StageData, DifficultyId } from './data/schema.js';
export { loadGameData } from './data/load.js';
export { hashState, stableStringify } from './hash.js';
export { computeHit, elementBp } from './damage.js';
export * as fixed from './fixed.js';
