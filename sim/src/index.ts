/** Öffentliche API des Simulationskerns. */
export { createSim, type Sim, type SimOptions, type SlotInfo } from './sim.js';
export type { Command, CommandResult } from './commands.js';
export type { SimState, SimEvent, EnemyState, UnitState, PlayerState, TargetMode, UnitMod, IncomeSource } from './state.js';
export type { UnitDef, LevelStat } from './data/compile.js';
export type { GameData, StageData, DifficultyId } from './data/schema.js';
export { loadGameData } from './data/load.js';
export { hashState, stableStringify } from './hash.js';
export { computeHit, elementBp } from './damage.js';
export * as fixed from './fixed.js';
