import { compile, type Ctx } from '../src/data/compile.js';
import { loadGameData, mergeUnitFiles } from '../src/data/load.js';
import { UnitFileSchema } from '../src/data/schema.js';
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

/** Regelfreie Daten mit eigenen Start-Münzen. */
export function plainDataCoins(coins: number): GameData {
  const d = plainData();
  d.economy.startCoins = coins;
  return d;
}

export function mutable(sim: Sim): SimState {
  return sim.state as SimState;
}

/** IDs der Altbestand-Slots (Runden 1-5) nach Art. Seit Runde 6 nur noch Positionsvorrat für Tests, keine Platzierregel. */
export function slotsOf(sim: Sim, kind: 'ground' | 'hill', size: 1 | 2 = 1): number[] {
  return sim.slotCenters().filter((s) => s.kind === kind && s.size === size).map((s) => s.id);
}

/** Position (Milli-Tiles) eines Altbestand-Slots als `x`/`y` für `place`. */
export function at(sim: Sim, slot: number): { x: number; y: number } {
  const s = sim.slotCenters()[slot];
  return { x: s.x, y: s.y };
}

/** `createSim` mit regelfreien Daten als Standard (siehe `plainData`); `data` überschreibt. */
export function createSim(o: SimOptions): Sim {
  return createSimCore({ ...o, data: o.data ?? data });
}

/**
 * Testdaten mit zusätzlichen Units im Datenformat (AA-nah, siehe `UnitFileSchema`): reichlich Münzen, regelfreie Stufen. So braucht ein
 * Test eine Unit nur als Datensatz. `units`/`attacks` wie in `sim/data/units/*.json`; `over` ändert danach die Daten (z. B. Gegner-Resistenzen).
 */
export function extraData(file: { units?: unknown[]; attacks?: Record<string, unknown> }, over?: (d: GameData) => void): GameData {
  const d = richData();
  const parsed = UnitFileSchema.parse({ units: file.units ?? [], attacks: file.attacks ?? {} });
  d.units = mergeUnitFiles([{ units: d.units.units, attacks: d.units.attacks }, parsed]);
  over?.(d);
  return d;
}

/** Kurzform für eine Test-Unit: gleiche Werte auf allen Stufen, `attack` = Katalog-ID, Stufen mit eigenem Angriff über `attacks`. */
export function tu(id: string, o: { placement?: 'ground' | 'hill' | 'hybrid'; damage?: number; spa?: number; range?: number; attack?: string; attacks?: (string | undefined)[]; levels?: number; damageType?: string; elements?: string[]; critChance?: number; critDamage?: number; cost?: number } = {}): Record<string, unknown> {
  const n = o.levels ?? 1;
  return {
    id,
    name: id,
    rarity: 'Mythic',
    placement: o.placement ?? 'ground',
    damageType: o.damageType ?? 'physical',
    elements: o.elements ?? [],
    critChance: o.critChance,
    critDamage: o.critDamage,
    levels: Array.from({ length: n }, (_, k) => ({
      level: k,
      cost: o.cost ?? 100,
      damage: o.damage ?? 100,
      spa: o.spa ?? 1,
      range: o.range ?? 25,
      attack: o.attacks ? o.attacks[k] : o.attack,
    })),
  };
}

/** Sim mit einer Test-Unit auf Altbestand-Slot 0 (2000, 0) bzw. dem ersten Hügel-Slot (2000, 2000); Gegner stehen eingefroren auf der Linie y = 1000. */
export function arena(file: Parameters<typeof extraData>[0], opts: { difficulty?: 'normal' | 'hard'; over?: (d: GameData) => void; seed?: number } = {}) {
  const diff = opts.difficulty ?? 'normal';
  const d = extraData(file, opts.over);
  const sim = createSimCore({ stage: 'standard20', difficulty: diff, players: 1, seed: opts.seed ?? 9, data: d });
  const ctx = compile(d, d.stages['standard20'], diff, 1);
  const st = sim.state as SimState;
  const put = (type: string, progress: number, over: Partial<EnemyState> = {}, wave = 1, element = 0): EnemyState => {
    const e = createEnemy(ctx, st.nextId++, type, wave, [], element, progress, 0);
    Object.assign(e, { x: progress, y: 1000, stunTicks: 100000 }, over);
    st.enemies.push(e);
    return e;
  };
  const place = (unit: string, kind: 'ground' | 'hill' = 'ground'): number => {
    const slot = sim.slotCenters().find((s) => s.kind === kind && s.size === 1)!;
    const r = sim.apply(0, { type: 'place', unitId: unit, x: slot.x, y: slot.y });
    if (!r.ok) throw new Error(r.reason);
    return r.entityId as number;
  };
  return { sim, st, ctx, put, place, data: d };
}
export const lost = (e: EnemyState): number => e.maxHp - e.hp;
