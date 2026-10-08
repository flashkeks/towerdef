/**
 * Einziges Tor zur Sim. Der Rest des Clients importiert nur von hier (und nur Typen + createSim/apply-Schnittstelle).
 * Der Client enthaelt keine Spielregeln: Platzieren, Upgraden, Wellen, Schaden - alles entscheidet `sim/`.
 */
export { createSim } from '../../../sim/src/index';
export type {
  Sim,
  SimState,
  SimEvent,
  EnemyState,
  UnitState,
  SummonState,
  Command,
  CommandResult,
  TargetMode,
  WavePreview,
  WavePreviewGroup,
  RiskCard,
  BossKit,
  UnitDef,
  LevelStat,
  CompiledAttack,
  AbilityDef,
  AuraDef,
  SummonDef,
  FxSpec,
  UnitMod,
  StageData,
  Theme,
  GameData,
  DifficultyId,
} from '../../../sim/src/index';
export { loadBrowserData, STAGE_ID } from './data';
