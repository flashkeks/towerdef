/**
 * Spieldaten: statische JSON-Importe (laufen im Browser/Vite und in Node ohne node:fs) + Konsistenzprüfung beim Laden.
 */
import { z } from 'zod';
import towersJson from '../data/towers.json';
import enemiesJson from '../data/enemies.json';
import roundsJson from '../data/rounds.json';
import difficultiesJson from '../data/difficulties.json';
import xpJson from '../data/xp.json';
import meadowJson from '../data/maps/meadow.json';
import { STAT_DEFAULTS, type Mod, type Stats } from './stats.js';
import type { Difficulty, EnemyType, HeroType, TowerType } from './types.js';

const statKey = z.string().refine((k) => k in STAT_DEFAULTS, { message: 'unbekannter Kennwert' });
const modSchema = z.object({
  op: z.enum(['add', 'mul', 'set', 'max']),
  stat: statKey,
  v: z.union([z.number().int(), z.string()]),
});
const baseSchema = z.record(statKey, z.union([z.number().int(), z.string()]));
const tierSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().positive(),
  desc: z.string().min(1),
  mods: z.array(modSchema),
});
const pathSchema = z.object({ name: z.string().min(1), tiers: z.array(tierSchema).length(5) });
const towerSchema = z.object({
  name: z.string(),
  desc: z.string(),
  price: z.number().int().positive(),
  radius: z.number().int().positive(),
  base: baseSchema,
  paths: z.array(pathSchema).length(3),
});
const levelSchema = z.object({
  level: z.number().int(),
  xp: z.number().int().nonnegative(),
  desc: z.string(),
  mods: z.array(modSchema),
});
const heroSchema = z.object({
  name: z.string(),
  title: z.string(),
  desc: z.string(),
  price: z.number().int().positive(),
  radius: z.number().int().positive(),
  base: baseSchema,
  levels: z.array(levelSchema).length(20),
});
const towersSchema = z.object({
  ranger: towerSchema,
  bombardier: towerSchema,
  frostcaller: towerSchema,
  wren: heroSchema,
});

const ENEMY_TYPES = ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute', 'leviathan'] as const;
const enemyTypeSchema = z.enum(ENEMY_TYPES);
const enemySchema = z.object({
  name: z.string(),
  hp: z.number().int().positive(),
  tempo: z.number().int().positive(),
  radius: z.number().int().positive(),
  children: z.array(enemyTypeSchema),
  armor: z.boolean().optional(),
  immuneCold: z.boolean().optional(),
  boss: z.boolean().optional(),
  stages: z.array(z.number().int()).optional(),
});
const enemiesSchema = z.record(enemyTypeSchema, enemySchema);

const roundsSchema = z
  .array(
    z.object({
      round: z.number().int().positive(),
      groups: z.array(
        z.object({
          type: enemyTypeSchema,
          n: z.number().int().positive(),
          gapMs: z.number().int().nonnegative(),
          startMs: z.number().int().nonnegative(),
          camo: z.boolean().optional(),
        }),
      ),
    }),
  )
  .length(20);

const diffSchema = z.object({
  lives: z.number().int().positive(),
  priceBp: z.number().int().positive(),
  speedBp: z.number().int().positive(),
  bossHp: z.number().int().positive(),
  startCash: z.number().int().nonnegative(),
  /** Gold je geknackter Schicht (Runde 11 / P5: 2, weil 20 Runden den Gegnerfortschritt von BTD6-R1-40 tragen). */
  popCash: z.number().int().positive(),
  /** Faktor auf den Turm-XP-Topf je Runde (Runde 11b): Easy 1,0 / Medium 1,1 / Hard 1,2. */
  towerXpBp: z.number().int().positive(),
});
/** Turm-XP (Runde 11b): Topf je Runde = (potBase + potPerRound x Runde) x Schwierigkeit; Freischaltkosten je Stufe 1..5. */
const xpSchema = z.object({ potBase: z.number().int().nonnegative(), potPerRound: z.number().int().nonnegative(), unlockCost: z.array(z.number().int().positive()).length(5) });
const difficultiesSchema = z.object({ easy: diffSchema, medium: diffSchema, hard: diffSchema });

const pt = z.tuple([z.number(), z.number()]);
const mapSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: pt,
  path: z.array(pt).min(2),
  pathHalfWidth: z.number().positive(),
  water: z.array(z.array(pt).min(3)),
  blockers: z.array(z.tuple([z.number(), z.number(), z.number()])),
  buildArea: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

export type TowerData = z.infer<typeof towerSchema>;
export type HeroData = z.infer<typeof heroSchema>;
export type EnemyData = z.infer<typeof enemySchema>;
export type RoundData = z.infer<typeof roundsSchema>[number];
export type DifficultyData = z.infer<typeof diffSchema>;
export type MapFile = z.infer<typeof mapSchema>;

export interface GameData {
  towers: Record<TowerType, TowerData>;
  hero: Record<HeroType, HeroData>;
  enemies: Record<EnemyType, EnemyData>;
  /** Index = Runde - 1. */
  rounds: RoundData[];
  difficulties: Record<Difficulty, DifficultyData>;
  xp: z.infer<typeof xpSchema>;
  maps: Record<string, MapFile>;
  /** RBE des ganzen Baums je Typ (Hülle + Kinder), mit HP aus enemies.json. */
  rbe: Record<EnemyType, number>;
}

function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`Spieldaten inkonsistent: ${msg}`);
}

function load(): GameData {
  const t = towersSchema.parse(towersJson);
  const enemies = enemiesSchema.parse(enemiesJson) as Record<EnemyType, EnemyData>;
  const rounds = roundsSchema.parse(roundsJson);
  const difficulties = difficultiesSchema.parse(difficultiesJson);
  const meadow = mapSchema.parse(meadowJson);
  const xp = xpSchema.parse(xpJson);
  for (let i = 1; i < 5; i++) check(xp.unlockCost[i] > xp.unlockCost[i - 1], 'Freischaltkosten nicht steigend');

  for (const e of ENEMY_TYPES) check(!!enemies[e], `Gegner ${e} fehlt`);
  rounds.forEach((r, i) => check(r.round === i + 1, `Runde ${i + 1} falsch nummeriert`));
  for (const k of ['ranger', 'bombardier', 'frostcaller'] as const) {
    for (const p of t[k].paths) {
      let last = 0;
      for (const tier of p.tiers) {
        check(tier.price > last || last === 0, `${k}/${p.name}: Preise nicht steigend`);
        last = tier.price;
      }
    }
  }
  t.wren.levels.forEach((l, i) => check(l.level === i + 1, 'Held-Level nicht fortlaufend'));
  for (let i = 1; i < 20; i++) check(t.wren.levels[i].xp > t.wren.levels[i - 1].xp, 'Held-XP nicht steigend');
  // Stat-Werte: Typ muss zum Default passen
  const typeOk = (stat: string, v: unknown): boolean => typeof v === typeof (STAT_DEFAULTS as unknown as Record<string, unknown>)[stat];
  const checkMods = (mods: Mod[], where: string): void => {
    for (const m of mods) check(typeOk(m.stat, m.v), `${where}: ${m.stat} hat falschen Typ`);
  };
  for (const k of ['ranger', 'bombardier', 'frostcaller'] as const) {
    for (const [stat, v] of Object.entries(t[k].base)) check(typeOk(stat, v), `${k} base ${stat}`);
    t[k].paths.forEach((p) => p.tiers.forEach((tier) => checkMods(tier.mods as Mod[], `${k}/${tier.name}`)));
  }
  t.wren.levels.forEach((l) => checkMods(l.mods as Mod[], `wren L${l.level}`));

  // RBE-Baum
  const rbe = {} as Record<EnemyType, number>;
  const calc = (e: EnemyType, depth: number): number => {
    check(depth < 10, 'Gegnerbaum zu tief/zyklisch');
    const d = enemies[e];
    return d.hp + d.children.reduce((a, c) => a + calc(c, depth + 1), 0);
  };
  for (const e of ENEMY_TYPES) rbe[e] = calc(e, 0);

  return {
    towers: { ranger: t.ranger, bombardier: t.bombardier, frostcaller: t.frostcaller },
    hero: { wren: t.wren },
    enemies,
    rounds,
    difficulties,
    xp,
    maps: { meadow },
    rbe,
  };
}

export const DATA: GameData = load();

export function baseStats(base: Record<string, number | string>): Stats {
  return { ...STAT_DEFAULTS, ...(base as Partial<Stats>) };
}
