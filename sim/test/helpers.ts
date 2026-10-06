import { compile, type Ctx } from '../src/data/compile.js';
import { loadGameData } from '../src/data/load.js';
import type { DifficultyId, GameData, StageData } from '../src/data/schema.js';
import { createSim as createSimCore, type Sim, type SimOptions } from '../src/index.js';
import { createEnemy } from '../src/systems/spawn.js';
import type { EnemyState, SimState } from '../src/state.js';

/**
 * Daten ohne Stufen-Regeln (Runde 4 / P3): Modifier-Dichte 0, keine Wellen-Varianten, Element-Modus `wave`,
 * keine Leben-Überschreibung, Bounty x1, keine Koop-Tabelle je Stufe (P6; es gilt `economy.coop`). Die HP-Faktoren bleiben. Alle Regel-unabhängigen Tests laufen hierauf,
 * damit sie die Stage-Waves der Daten zeigen; die Stufen-Regeln prüft `difficulty.test.ts` mit den echten Daten.
 */
export function plainData(): GameData {
  const d = loadGameData();
  for (const k of ['normal', 'hard', 'nightmare'] as const) {
    Object.assign(d.difficulties[k], {
      elementMode: 'wave',
      modifiers: { densityBp: 0, fromWave: 1, pool: [] },
      waveVariants: [],
      lives: {},
      bountyBp: 10000,
      coopHpTableBp: undefined,
      coopBossHpTableBp: undefined,
    });
  }
  return d;
}

export const data: GameData = plainData();
export const stage = data.stages['standard20'];

export function ctxFor(players = 1, diff: DifficultyId = 'normal', st: StageData = stage): Ctx {
  return compile(data, st, diff, players);
}

/** Gegner direkt bauen (für reine Funktionstests). */
export function enemy(ctx: Ctx, type: string, wave = 1, over: Partial<EnemyState> = {}, id = 1): EnemyState {
  return { ...createEnemy(ctx, id, type, wave, [], 0), ...over };
}

export function richData(coins = 1_000_000): GameData {
  const d = plainData();
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

/** `createSim` mit regelfreien Daten als Standard (siehe `plainData`); `data` überschreibt. */
export function createSim(o: SimOptions): Sim {
  return createSimCore({ ...o, data: o.data ?? data });
}
