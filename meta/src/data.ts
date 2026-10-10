/**
 * Feste Zahlen des Fortschritts (docs/design/meta.md). Reine Daten, kein Zustand.
 * Spielersichtbare Texte sind Englisch.
 */
import type { Difficulty, HeroType, ModeId, PowerKey, TowerType } from '../../sim/src/types';
import { DATA, POWER_KEYS } from '../../sim/src/data';
import { MODE_IDS, MODES } from '../../sim/src/modes';

export const TOWER_TYPES: readonly TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'longshot', 'market', 'thornweaver', 'alchemist'];
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];
/** Alte Rechengrenze (20 Runden): Vorgabe der Belohnungsformeln, wenn kein `maxRound` im Kontext steht. Echte Endrunde: `maxRoundOf(map, difficulty)`. */
export const MAX_ROUND = 20;
/**
 * Runde 15b (Max, 10.10.2026: "Easy 40, Medium 60, Hard 80 wie BTD6"): eine Rundenliste fuer alle Karten, Endrunde nach Schwierigkeit
 * (`sim/data/difficulties.json`). Erreicht = Sieg und Medaille; danach optional Freeplay.
 */
export const END_ROUND: Record<Difficulty, number> = { easy: DATA.difficulties.easy.endRound, medium: DATA.difficulties.medium.endRound, hard: DATA.difficulties.hard.endRound };
/**
 * Daempfung von Spieler-XP und Embers je Runde in Basispunkten, damit 40/60/80 Runden die Level-Kurve nicht sprengen:
 * bis 20 Runden unveraendert, darueber (20 / Endrunde)^1,25 (Easy 4204, Medium 2495, Hard 1768). Eine volle Partie bleibt so bei
 * rund 3.800 / 4.900 / 6.000 Basis-XP (frueher R20 = 2.500).
 */
export const roundRewardBp = (endRound: number): number => (endRound <= 20 ? 10000 : Math.round(10000 * Math.pow(20 / endRound, 1.25)));

// ---------------------------------------------------------------- Karten und Modi (Runde 15, docs/design/karten-gegner-r15.md)

export type MapTier = 'beginner' | 'intermediate' | 'advanced';
export interface MapUnlockRule {
  /** Spieler-Level, ab dem die Karte offen ist. */
  level: number;
  /** ... oder diese Medaille (Standard-Modus) auf der Vorgaengerkarte. */
  medal: { map: string; difficulty: Difficulty };
}
export interface MapMeta {
  id: string;
  name: string;
  tier: MapTier;
  /** Anzeigename der Stufe (Englisch). */
  tierName: string;
  /** Boss der Karte (Anzeige, Flavour); die Bosse stehen fest in der gemeinsamen Liste (R20 Leviathan, R40 Wyrm, R60 Colossus, R80 alle). */
  boss: string;
  /** Keine Regel = von Anfang an offen. */
  unlock: MapUnlockRule | null;
  /** Belohnungsfaktor Spieler-XP in Basispunkten (10000 = x1,0). */
  xpBp: number;
  /** Belohnungsfaktor Embers in Basispunkten. */
  embersBp: number;
  desc: string;
}
export const MAPS: readonly MapMeta[] = [
  { id: 'meadow', name: 'Lanternfall Meadow', tier: 'beginner', tierName: 'Beginner', boss: 'Dusk Leviathan', unlock: null, xpBp: 10000, embersBp: 10000, desc: 'A long road through a summer meadow. Plenty of room to build.' },
  { id: 'frostfen', name: 'Frostfen Crossing', tier: 'intermediate', tierName: 'Intermediate', boss: 'Frost Wyrm', unlock: { level: 8, medal: { map: 'meadow', difficulty: 'medium' } }, xpBp: 11500, embersBp: 12000, desc: 'Two roads over a frozen lake meet in the middle. The ice cannot be built on.' },
  { id: 'quarry', name: 'Ember Quarry', tier: 'advanced', tierName: 'Advanced', boss: 'Ember Colossus', unlock: { level: 12, medal: { map: 'frostfen', difficulty: 'medium' } }, xpBp: 13000, embersBp: 14000, desc: 'A short, winding road through lava and rock. Very little room to build.' },
];
export const MAP_IDS: readonly string[] = MAPS.map((m) => m.id);
export const MAP_NAMES: Record<string, string> = Object.fromEntries(MAPS.map((m) => [m.id, m.name]));
export const mapById = (id: string): MapMeta | undefined => MAPS.find((m) => m.id === id);
/** Endrunde (= Sieg) auf der Schwierigkeit; seit 15b gleich fuer alle Karten (`map` bleibt fuer spaetere Sonderkarten). Vorgabe Medium. */
export const maxRoundOf = (_map: string, difficulty: Difficulty = 'medium'): number => END_ROUND[difficulty];

export { MODE_IDS };
/** Bonus auf Spieler-XP und Embers in den Zusatzmodi (+20 %). */
export const MODE_BONUS_BP = 2000;
export interface ModeMeta {
  id: ModeId;
  name: string;
  desc: string;
  /** Frei ab Standard-Medaille dieser Schwierigkeit (oder haerter) auf derselben Karte; null = immer offen. */
  unlockMedal: Difficulty | null;
  /** Bonus-Basispunkte auf XP und Embers. */
  bonusBp: number;
}
const MODE_UNLOCK: Record<ModeId, Difficulty | null> = { standard: null, 'primary-only': 'easy', 'specialists-only': 'medium', 'no-hero': 'medium', 'half-cash': 'hard', deflation: 'hard' };
export const MODE_META: Record<ModeId, ModeMeta> = Object.fromEntries(
  MODE_IDS.map((id) => [id, { id, name: MODES[id].name, desc: MODES[id].desc, unlockMedal: MODE_UNLOCK[id], bonusBp: id === 'standard' ? 0 : MODE_BONUS_BP }]),
) as Record<ModeId, ModeMeta>;

/** Turm-XP-Kosten je Stufe 1..5 (Index 0 = Stufe 1). */
export const TIER_COST: readonly number[] = [100, 250, 900, 2500, 8000];
/**
 * Start-Turm-XP je Turm: genau Stufe 1 eines Pfads (Runde 11b, vorher 250). Turm-XP entsteht im Match (Sim, `sim/src/xp.ts`:
 * Topf je Runde, verteilt nach Geld und Pops); das Profil uebernimmt nur das Endkonto.
 */
export const STARTER_TOWER_XP = 100;

export const DIFFICULTY_XP_BP: Record<Difficulty, number> = { easy: 10000, medium: 11000, hard: 12000 };
export const WIN_BONUS_XP = 200;
/** Freeplay-Runden (ueber der Endrunde) zaehlen 30 % der Runden-XP. */
export const FREEPLAY_BP = 3000;

/** XP bis zum naechsten Level, von Level `l` aus. */
export function xpToNext(l: number): number {
  if (l <= 1) return 300;
  if (l === 2) return 500;
  if (l === 3) return 800;
  return Math.min(7200, 1200 + 400 * (l - 4));
}
export const MAX_LEVEL = 100;

export interface LevelInfo { level: number; into: number; need: number }
/** Level aus Gesamt-XP; `into`/`need` = Fortschritt im aktuellen Level. */
export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (level < MAX_LEVEL && rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, need: xpToNext(level) };
}
/** Gesamt-XP, die noetig sind, um Level `l` zu erreichen. */
export function xpForLevel(l: number): number {
  let s = 0;
  for (let i = 1; i < l; i++) s += xpToNext(i);
  return s;
}

export type UnlockKind = 'tower' | 'hero' | 'difficulty' | 'map';
export interface LevelUnlock {
  level: number;
  kind: UnlockKind;
  id: TowerType | HeroType | Difficulty | string;
  title: string;
  text: string;
}
export const LEVEL_UNLOCKS: readonly LevelUnlock[] = [
  { level: 2, kind: 'tower', id: 'bombardier', title: 'Bombardier', text: 'Lobs bombs that burst in an area and crack armor.' },
  { level: 3, kind: 'hero', id: 'wren', title: 'Wren, the Lamplighter', text: 'Your hero. One per match, levels up to 20 in the fight.' },
  { level: 4, kind: 'tower', id: 'frostcaller', title: 'Frostcaller', text: 'Slows, freezes and shocks whole lanes.' },
  { level: 5, kind: 'difficulty', id: 'hard', title: 'Hard difficulty', text: 'Faster Glims, tougher bosses, bigger medals.' },
  { level: 5, kind: 'tower', id: 'longshot', title: 'Longshot', text: 'Sniper that sees the whole map. Slow, heavy shots.' },
  { level: 6, kind: 'tower', id: 'market', title: 'Lantern Market', text: 'Does not attack. Pays gold every round, banks interest, or buffs nearby towers.' },
  { level: 7, kind: 'tower', id: 'thornweaver', title: 'Thornweaver', text: 'Nature caster. Thorn fans, chain lightning, vines and a wall of trees.' },
  { level: 8, kind: 'map', id: 'frostfen', title: 'Frostfen Crossing', text: 'A frozen lake with two roads. Intermediate map.' },
  { level: 12, kind: 'map', id: 'quarry', title: 'Ember Quarry', text: 'Lava, rock and a short road. Advanced map.' },
  { level: 9, kind: 'tower', id: 'alchemist', title: 'Alchemist', text: 'Lobs acid, brews buffs for nearby towers, turns lead into gold.' },
];
/** Level, ab dem Turm/Held/Schwierigkeit offen ist; fehlt = von Anfang an. */
export function unlockLevel(id: string): number {
  return LEVEL_UNLOCKS.find((u) => u.id === id)?.level ?? 1;
}

export type Branch = 'economy' | 'primary' | 'specialists' | 'wardens' | 'powers';
/** Reihenfolge der Spalten im Baum. */
export const BRANCHES: readonly Branch[] = ['economy', 'primary', 'specialists', 'wardens', 'powers'];
export interface KnowledgeNode {
  id: string;
  branch: Branch;
  name: string;
  cost: number;
  desc: string;
  /** Voraussetzung: mindestens einer dieser Knoten gekauft; leer = keine. */
  requires: string[];
  /** Position im Baum (Spalte, Zeile) innerhalb des Asts fuer die Anzeige. */
  col: number;
  row: number;
}
const node = (id: string, branch: Branch, name: string, cost: number, desc: string, requires: string[], col: number, row: number): KnowledgeNode =>
  ({ id, branch, name, cost, desc, requires, col, row });
/**
 * Wissensbaum Runde 13/14 (docs/design/tuerme-r13.md): 40 Knoten in 5 Aesten, Summe 77 Punkte (Runde 13: 28 Knoten / 52 Punkte, Runde 14: +12). Die 10 alten Knoten
 * behalten ID und Wirkung (Ast `towers` heisst jetzt `primary`). Reihenfolge: Voraussetzungen stehen vor den Folgeknoten.
 */
export const KNOWLEDGE: readonly KnowledgeNode[] = [
  node('head-start', 'economy', 'Head Start', 1, 'Start every match with 100 extra gold.', [], 0, 0),
  node('better-deals', 'economy', 'Better Deals', 1, 'Selling returns 75% instead of 70%.', ['head-start'], 0, 1),
  node('lantern-tax', 'economy', 'Lantern Tax', 2, 'Rounds 1 to 10 pay 20 extra gold.', ['better-deals'], 0, 2),
  node('big-head-start', 'economy', 'Big Head Start', 2, 'Start every match with 200 more gold.', ['lantern-tax'], 0, 3),
  node('market-savvy', 'economy', 'Market Savvy', 2, 'Lantern Markets earn 10% more gold.', ['big-head-start'], 0, 4),
  node('compound-interest', 'economy', 'Compound Interest', 3, 'Market banks pay 5 points more interest.', ['market-savvy'], 0, 5),
  node('investor', 'economy', 'Investor', 2, 'Lantern Markets cost another 10% less to build.', ['market-savvy'], 1, 5),
  node('pop-bonus', 'economy', 'Pop Bonus', 3, 'Popping a Glim pays 5% more gold.', ['investor'], 1, 6),
  node('sharp-eyes', 'primary', 'Sharp Eyes', 1, 'Rangers see 8% farther.', [], 0, 0),
  node('bigger-barrels', 'primary', 'Bigger Barrels', 1, 'Explosions are 10% wider.', [], 1, 0),
  node('cold-snap', 'primary', 'Cold Snap', 1, 'Frostcaller slows last 25% longer.', [], 2, 0),
  node('cheaper-basics', 'primary', 'Cheaper Basics', 2, 'Tier 1 upgrades cost 10% less.', ['sharp-eyes', 'bigger-barrels', 'cold-snap'], 1, 1),
  node('quick-hands', 'primary', 'Quick Hands', 2, 'Rangers and Bombardiers attack 5% faster.', ['cheaper-basics'], 1, 2),
  node('deep-freeze', 'primary', 'Deep Freeze', 2, 'Absolute Zero freezes 0.5 s longer.', ['quick-hands'], 1, 3),
  node('veteran-primaries', 'primary', 'Veteran Primaries', 3, 'Tier 2 upgrades of Ranger, Bombardier and Frostcaller cost 10% less.', ['deep-freeze'], 1, 4),
  node('sharper-arrows', 'primary', 'Sharper Arrows', 2, 'Rangers pierce 1 more enemy.', ['sharp-eyes'], 0, 1),
  node('icicle-edge', 'primary', 'Icicle Edge', 3, 'Frostcaller hits deal 1 more damage to frozen enemies.', ['cold-snap'], 2, 1),
  node('fused-shells', 'primary', 'Fused Shells', 2, 'Bombardier bombs throw 2 more splinters.', ['veteran-primaries'], 1, 5),
  node('steady-aim', 'specialists', 'Steady Aim', 1, 'Longshots attack 10% faster.', [], 0, 0),
  node('supply-lines', 'specialists', 'Supply Lines', 2, 'Supply Drop crates hold 200 more gold.', ['steady-aim'], 0, 1),
  node('wide-aura', 'specialists', 'Wide Aura', 1, 'Lantern Market auras reach 15% farther.', ['supply-lines'], 0, 2),
  node('bulk-orders', 'specialists', 'Bulk Orders', 2, 'Lantern Markets cost 10% less to build.', ['wide-aura'], 0, 3),
  node('field-medic', 'specialists', 'Field Medic', 2, 'Regain 1 life at the end of every round.', ['bulk-orders'], 0, 4),
  node('deep-roots', 'specialists', 'Deep Roots', 1, 'Thornweavers reach 10% farther.', [], 1, 0),
  node('bountiful-grove', 'specialists', 'Bountiful Grove', 2, "Jungle's Bounty pays 50 more gold each round.", ['deep-roots'], 1, 1),
  node('potent-brews', 'specialists', 'Potent Brews', 1, 'Alchemist buff potions last 25% longer.', [], 2, 0),
  node('midas-hands', 'specialists', 'Midas Hands', 2, 'Lead to Gold pays 20 more gold per Ironshell.', ['potent-brews'], 2, 1),
  node('extra-lives', 'wardens', 'Extra Lives', 1, 'Start every match with 10 more lives.', [], 0, 0),
  node('veteran-hero', 'wardens', 'Veteran Hero', 2, 'Wren starts at level 3.', ['extra-lives'], 0, 1),
  node('fast-learner', 'wardens', 'Fast Learner', 2, 'Towers earn 20% more Tower XP.', ['extra-lives'], 1, 1),
  node('thick-walls', 'wardens', 'Thick Walls', 2, 'Start every match with 15 more lives.', ['veteran-hero', 'fast-learner'], 0, 2),
  node('hero-training', 'wardens', 'Hero Training', 2, 'Wren earns 15% more hero XP.', ['thick-walls'], 0, 3),
  node('legendary', 'wardens', 'Legendary', 3, 'Wren starts at level 5.', ['hero-training'], 0, 4),
  node('scholar', 'wardens', 'Scholar', 2, 'Matches give 10% more player XP.', ['legendary'], 0, 5),
  node('sturdy-gate', 'wardens', 'Sturdy Gate', 3, 'Once per match the gate stops one leak.', ['thick-walls'], 1, 3),
  node('ember-pouch', 'powers', 'Ember Pouch', 1, 'Matches give 10% more Embers.', [], 0, 0),
  node('bulk-buyer', 'powers', 'Bulk Buyer', 2, 'Powers cost 10% less in the Store.', ['ember-pouch'], 0, 1),
  node('ember-rush', 'powers', 'Ember Rush', 2, 'Earn 1 extra Ember for every round you clear.', ['ember-pouch'], 1, 1),
  node('spare-pocket', 'powers', 'Spare Pocket', 3, 'Use each Power twice per round instead of once.', ['bulk-buyer'], 0, 2),
  node('starter-kit', 'powers', 'Starter Kit', 3, 'Every match starts with one free Gold Drop.', ['spare-pocket'], 0, 3),
];
export const BRANCH_NAMES: Record<Branch, string> = { economy: 'Economy', primary: 'Primary', specialists: 'Specialists', wardens: 'Wardens', powers: 'Powers' };
export const nodeById = (id: string): KnowledgeNode | undefined => KNOWLEDGE.find((n) => n.id === id);

// ---------------------------------------------------------------- Embers und Powers (Runde 12, docs/design/powers.md)

export { POWER_KEYS };
export const emptyInventory = (): Record<PowerKey, number> => Object.fromEntries(POWER_KEYS.map((k) => [k, 0])) as Record<PowerKey, number>;
/** Preis einer Power in Embers (aus `sim/data/powers.json`). */
export const powerPrice = (k: PowerKey): number => DATA.powers[k].price;
/** Store-Rabatt "Bulk Buyer" in Basispunkten (1000 = -10 %). */
export const BULK_BUYER_BP = 1000;

/** Embers je geschaffter Runde: 1 + Runde / 5 (abgerundet). Runden ueber `MAX_ROUND` (Freeplay) zaehlen nicht. */
export const embersForRound = (r: number): number => 1 + Math.floor(r / 5);
/** Embers fuer einen Sieg. */
export const EMBERS_WIN: Record<Difficulty, number> = { easy: 20, medium: 30, hard: 50 };
/** Embers fuer die erste Medaille einer Schwierigkeit (je Karte). */
export const EMBERS_FIRST_MEDAL = 50;
/** Embers je Spieler-Level-Up. */
export const EMBERS_LEVEL_UP = 25;
/** Einmaliges Startpaket fuer neue und bestehende Profile. */
export const STARTER_PACK: { embers: number; powers: Partial<Record<PowerKey, number>> } = { embers: 100, powers: { goldDrop: 1, lanternBomb: 1 } };
