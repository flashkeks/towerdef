/**
 * Bruecke zur Sim. Der Client importiert Sim-Typen und `createGame` NUR von hier.
 * Stand Runde 11 / P3: die echte Sim (P1) ist noch nicht auf dev, deshalb laeuft hier der Stub aus `match/sim-stub.ts`.
 * Mit P1 wird dies zu `export * from '../../sim/src/index';` (siehe client/README.md).
 */
export type {
  AbilityId, Command, CommandResult, Difficulty, EnemyState, EnemyType, Game, GameOptions, GameState, HeroType, PlaceCheck,
  ProjectileKind, ProjectileState, SimEvent, TargetMode, Tiers, TowerState, TowerType, UpgradeInfo,
} from './match/sim-types';
export { createGame } from './match/sim-stub';
