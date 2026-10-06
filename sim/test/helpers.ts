import { compile, type Ctx } from '../src/data/compile.js';
import { loadGameData } from '../src/data/load.js';
import type { DifficultyId, GameData, StageData } from '../src/data/schema.js';
import { createSim, type Sim } from '../src/index.js';
import { createEnemy } from '../src/systems/spawn.js';
import type { EnemyState, SimState } from '../src/state.js';

export const data: GameData = loadGameData();
export const stage = data.stages['standard20'];

export function ctxFor(players = 1, diff: DifficultyId = 'normal', st: StageData = stage): Ctx {
  return compile(data, st, diff, players);
}

/** Gegner direkt bauen (für reine Funktionstests). */
export function enemy(ctx: Ctx, type: string, wave = 1, over: Partial<EnemyState> = {}, id = 1): EnemyState {
  return { ...createEnemy(ctx, id, type, wave, [], 0), ...over };
}

export function richData(coins = 1_000_000): GameData {
  const d = loadGameData();
  d.economy.startCoins = coins;
  return d;
}

export function mutable(sim: Sim): SimState {
  return sim.state as SimState;
}

/** Slot-IDs nach Art. */
export function slotsOf(sim: Sim, kind: 'ground' | 'hill', size: 1 | 2 = 1): number[] {
  return sim.slots().filter((s) => s.kind === kind && s.size === size).map((s) => s.id);
}

export { createSim };
