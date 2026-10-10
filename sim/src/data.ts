/**
 * Spieldaten: statische JSON-Importe (laufen im Browser/Vite und in Node ohne node:fs) + Konsistenzprüfung beim Laden.
 */
import { z } from 'zod';
import towersJson from '../data/towers.json';
import enemiesJson from '../data/enemies.json';
import roundsJson from '../data/rounds.json';
import difficultiesJson from '../data/difficulties.json';
import xpJson from '../data/xp.json';
import powersJson from '../data/powers.json';
import meadowJson from '../data/maps/meadow.json';
import frostfenJson from '../data/maps/frostfen.json';
import quarryJson from '../data/maps/quarry.json';
import { STAT_DEFAULTS, type Mod, type Stats } from './stats.js';
import type { Difficulty, EnemyType, HeroType, PowerKey, TowerType } from './types.js';

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
  longshot: towerSchema,
  market: towerSchema,
  thornweaver: towerSchema,
  alchemist: towerSchema,
  wren: heroSchema,
});

const ENEMY_TYPES = ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute', 'leviathan', 'pink', 'frostling', 'crystal', 'gloomship', 'wyrm', 'colossus', 'cruiser', 'duskrunner', 'dreadnought'] as const;
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
  // --- Runde 15 ---
  /** Blimp (MOAB-Klasse): kein Einfrieren, Verlangsamung halb, Schaden geht nicht an die Kinder. Bosse zaehlen immer als Blimp. */
  blimp: z.boolean().optional(),
  /** Explosions-immun (Frostling): `explosive`-Schaden prallt ab. */
  immuneExplosive: z.boolean().optional(),
  /** Betaeubungs-immun (Ember Colossus). */
  immuneStun: z.boolean().optional(),
  /** Huelle zaehlt beim Merkmal Fortified doppelt. */
  heavy: z.boolean().optional(),
  /** Pop-Gold fuer die Huelle (statt Pop-Cash je Schicht): Blimp 50, Boss 100/150. */
  hullCash: z.number().int().positive().optional(),
  /** Runde 15b: nie verlangsamt, eingefroren oder (per Time Warp) gebremst (Dusk Dreadnought). */
  immuneSlow: z.boolean().optional(),
  /** Runde 15b: immer getarnt (Duskrunner), Kinder erben. */
  alwaysCamo: z.boolean().optional(),
  /** Boss-Huelle je Schwierigkeit (fehlt: `bossHp` aus difficulties.json). */
  bossHp: z.object({ easy: z.number().int().positive(), medium: z.number().int().positive(), hard: z.number().int().positive() }).optional(),
});
const enemiesSchema = z.record(enemyTypeSchema, enemySchema);

const roundGroupSchema = z.object({
  type: enemyTypeSchema,
  n: z.number().int().positive(),
  gapMs: z.number().int().nonnegative(),
  startMs: z.number().int().nonnegative(),
  camo: z.boolean().optional(),
  /** Runde 15: Merkmal Regrow ("Bloom"), Kinder erben. */
  regrow: z.boolean().optional(),
  /** Runde 15: Merkmal Fortified, Kinder erben. */
  fortified: z.boolean().optional(),
  /** Runde 15: Wegast, auf dem die Gruppe laeuft (0, 1 ...). Fehlt = abwechselnd (Gegner 1 auf Ast 0, 2 auf Ast 1 ...). */
  lane: z.number().int().nonnegative().optional(),
});
const roundsSchema = (n: number) =>
  z.array(z.object({ round: z.number().int().positive(), groups: z.array(roundGroupSchema) })).length(n);

const diffSchema = z.object({
  lives: z.number().int().positive(),
  priceBp: z.number().int().positive(),
  speedBp: z.number().int().positive(),
  bossHp: z.number().int().positive(),
  /** Runde 15b: Endrunde = Sieg (Easy 40, Medium 60, Hard 80, wie BTD6). */
  endRound: z.number().int().positive(),
  startCash: z.number().int().nonnegative(),
  /** Gold je geknackter Schicht (Runde 11 / P5: 2, weil 20 Runden den Gegnerfortschritt von BTD6-R1-40 tragen). */
  popCash: z.number().int().positive(),
  /** Faktor auf den Turm-XP-Topf je Runde (Runde 11b): Easy 1,0 / Medium 1,1 / Hard 1,2. */
  towerXpBp: z.number().int().positive(),
});
/** Turm-XP (Runde 11b): Topf je Runde = (potBase + potPerRound x Runde) x Schwierigkeit; Freischaltkosten je Stufe 1..5. */
const xpSchema = z.object({ potBase: z.number().int().nonnegative(), potPerRound: z.number().int().nonnegative(), unlockCost: z.array(z.number().int().positive()).length(5) });
const difficultiesSchema = z.object({ easy: diffSchema, medium: diffSchema, hard: diffSchema });

const POWER_KEYS = [
  'goldDrop', 'lanternBomb', 'caltrops', 'frostTrap', 'timeWarp', 'lanternOil', 'extraLives', 'heroBoost',
  'instaWarden:ranger', 'instaWarden:bombardier', 'instaWarden:frostcaller',
] as const;
const powerKeySchema = z.enum(POWER_KEYS);
/** Power (Runde 12): `use` sagt dem Client, wie sie eingesetzt wird; Zahlen stehen in `params`. */
const powerSchema = z.object({
  name: z.string().min(1),
  desc: z.string().min(1),
  /** Embers im Store. */
  price: z.number().int().positive(),
  use: z.enum(['button', 'target', 'path', 'place']),
  params: z.record(z.string(), z.number().int()),
  tower: z.enum(['ranger', 'bombardier', 'frostcaller']).optional(),
  tiers: z.tuple([z.number().int(), z.number().int(), z.number().int()]).optional(),
});
const powersSchema = z.object({ order: z.array(powerKeySchema).length(POWER_KEYS.length), powers: z.record(powerKeySchema, powerSchema) });

const pt = z.tuple([z.number(), z.number()]);
const mapSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: pt,
  /** Hauptweg (Ast 0). */
  path: z.array(pt).min(2),
  /** Runde 15: alle Aeste (Frostfen: zwei, die sich vereinen); `paths[0]` ist `path`. Fehlt = ein Weg. */
  paths: z.array(z.array(pt).min(2)).min(1).optional(),
  pathHalfWidth: z.number().positive(),
  water: z.array(z.array(pt).min(3)),
  /** Runde 15: Lava (nicht bebaubar). */
  lava: z.array(z.array(pt).min(3)).default([]),
  /** Runde 15: Eisschollen (nur Optik, bebaubar wie das Ufer, liegen auf Wasser). */
  ice: z.array(z.array(pt).min(3)).default([]),
  /** Runde 15: Bruecken ueber Lava (nur Optik): Strecken auf dem Weg. */
  bridges: z.array(z.tuple([pt, pt])).default([]),
  blockers: z.array(z.tuple([z.number(), z.number(), z.number()])),
  buildArea: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

export type TowerData = z.infer<typeof towerSchema>;
export type HeroData = z.infer<typeof heroSchema>;
export type EnemyData = z.infer<typeof enemySchema>;
export type RoundData = z.infer<ReturnType<typeof roundsSchema>>[number];
export type DifficultyData = z.infer<typeof diffSchema>;
export type PowerData = z.infer<typeof powerSchema>;
export type MapFile = z.infer<typeof mapSchema>;

export interface GameData {
  towers: Record<TowerType, TowerData>;
  hero: Record<HeroType, HeroData>;
  enemies: Record<EnemyType, EnemyData>;
  /** Runde 15b: die eine Rundenliste fuer alle Karten, Index = Runde - 1, 120 feste Runden (`sim/data/rounds.json`, Quelle `sim/scripts/gen-rounds.mjs`). */
  rounds: RoundData[];
  difficulties: Record<Difficulty, DifficultyData>;
  xp: z.infer<typeof xpSchema>;
  /** Powers (Runde 12), Reihenfolge der Anzeige in `powerOrder`. */
  powers: Record<PowerKey, PowerData>;
  powerOrder: PowerKey[];
  maps: Record<string, MapFile>;
  /** RBE des ganzen Baums je Typ (Hülle + Kinder), mit HP aus enemies.json. */
  rbe: Record<EnemyType, number>;
}

const ALL_TOWERS = ['ranger', 'bombardier', 'frostcaller', 'longshot', 'market', 'thornweaver', 'alchemist'] as const;

function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`Spieldaten inkonsistent: ${msg}`);
}

function load(): GameData {
  const t = towersSchema.parse(towersJson);
  const enemies = enemiesSchema.parse(enemiesJson) as Record<EnemyType, EnemyData>;
  const rounds = roundsSchema(120).parse(roundsJson);
  const difficulties = difficultiesSchema.parse(difficultiesJson);
  const maps = { meadow: mapSchema.parse(meadowJson), frostfen: mapSchema.parse(frostfenJson), quarry: mapSchema.parse(quarryJson) };
  const xp = xpSchema.parse(xpJson);
  const pw = powersSchema.parse(powersJson);
  for (const k of POWER_KEYS) check(!!pw.powers[k], `Power ${k} fehlt`);
  check(new Set(pw.order).size === POWER_KEYS.length, 'Power-Reihenfolge nicht eindeutig');
  for (const k of POWER_KEYS) {
    const d = pw.powers[k];
    if (d.use === 'place') check(!!d.tower && !!d.tiers && k === `instaWarden:${d.tower}`, `${k}: Turm/Stufen fehlen`);
  }
  for (let i = 1; i < 5; i++) check(xp.unlockCost[i] > xp.unlockCost[i - 1], 'Freischaltkosten nicht steigend');

  for (const e of ENEMY_TYPES) check(!!enemies[e], `Gegner ${e} fehlt`);
  rounds.forEach((r, i) => check(r.round === i + 1, `Runde ${i + 1} falsch nummeriert`));
  for (const m of Object.values(maps)) {
    if (m.paths) check(JSON.stringify(m.paths[0]) === JSON.stringify(m.path), `${m.id}: paths[0] ist nicht path`);
  }
  for (const k of ALL_TOWERS) {
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
  for (const k of ALL_TOWERS) {
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
    towers: { ranger: t.ranger, bombardier: t.bombardier, frostcaller: t.frostcaller, longshot: t.longshot, market: t.market, thornweaver: t.thornweaver, alchemist: t.alchemist },
    hero: { wren: t.wren },
    enemies,
    rounds,
    difficulties,
    xp,
    powers: pw.powers as Record<PowerKey, PowerData>,
    powerOrder: pw.order,
    maps,
    rbe,
  };
}

export { POWER_KEYS };
export const DATA: GameData = load();

export function baseStats(base: Record<string, number | string>): Stats {
  return { ...STAT_DEFAULTS, ...(base as Partial<Stats>) };
}
