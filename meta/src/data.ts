/**
 * Feste Zahlen des Fortschritts (docs/design/meta.md). Reine Daten, kein Zustand.
 * Spielersichtbare Texte sind Englisch.
 */
import type { Difficulty, HeroType, TowerType } from '../../sim/src/types';

export const TOWER_TYPES: readonly TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];
export const MAP_IDS: readonly string[] = ['meadow'];
export const MAP_NAMES: Record<string, string> = { meadow: 'Lanternfall Meadow' };
export const MAX_ROUND = 20;

/** Turm-XP-Kosten je Stufe 1..5 (Index 0 = Stufe 1). */
export const TIER_COST: readonly number[] = [100, 250, 900, 2500, 8000];
/** Turm-XP je gekaufter Stufe im Match, je geknackter Schicht 1. */
export const XP_PER_TIER_BOUGHT = 20;
export const XP_PER_POP = 1;
/** Start-Turm-XP je Turm, damit die erste Partie nicht komplett ohne Upgrades beginnt (Abweichung vom Entwurf, siehe Bericht). */
export const STARTER_TOWER_XP = 250;

export const DIFFICULTY_XP_BP: Record<Difficulty, number> = { easy: 10000, medium: 11000, hard: 12000 };
export const WIN_BONUS_XP = 200;
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

export type UnlockKind = 'tower' | 'hero' | 'difficulty';
export interface LevelUnlock {
  level: number;
  kind: UnlockKind;
  id: TowerType | HeroType | Difficulty;
  title: string;
  text: string;
}
export const LEVEL_UNLOCKS: readonly LevelUnlock[] = [
  { level: 2, kind: 'tower', id: 'bombardier', title: 'Bombardier', text: 'Lobs bombs that burst in an area and crack armor.' },
  { level: 3, kind: 'hero', id: 'wren', title: 'Wren, the Lamplighter', text: 'Your hero. One per match, levels up to 20 in the fight.' },
  { level: 4, kind: 'tower', id: 'frostcaller', title: 'Frostcaller', text: 'Slows, freezes and shocks whole lanes.' },
  { level: 5, kind: 'difficulty', id: 'hard', title: 'Hard difficulty', text: 'Faster Glims, tougher bosses, bigger medals.' },
];
/** Level, ab dem Turm/Held/Schwierigkeit offen ist; fehlt = von Anfang an. */
export function unlockLevel(id: string): number {
  return LEVEL_UNLOCKS.find((u) => u.id === id)?.level ?? 1;
}

export type Branch = 'economy' | 'towers' | 'wardens';
export interface KnowledgeNode {
  id: string;
  branch: Branch;
  name: string;
  cost: number;
  desc: string;
  /** Voraussetzung: mindestens einer dieser Knoten gekauft; leer = keine. */
  requires: string[];
  /** Position im Baum (Spalte, Zeile) fuer die Anzeige. */
  col: number;
  row: number;
}
export const KNOWLEDGE: readonly KnowledgeNode[] = [
  { id: 'head-start', branch: 'economy', name: 'Head Start', cost: 1, desc: 'Start every match with 100 extra gold.', requires: [], col: 0, row: 0 },
  { id: 'better-deals', branch: 'economy', name: 'Better Deals', cost: 1, desc: 'Selling returns 75% instead of 70%.', requires: ['head-start'], col: 0, row: 1 },
  { id: 'lantern-tax', branch: 'economy', name: 'Lantern Tax', cost: 2, desc: 'Rounds 1 to 10 pay 20 extra gold.', requires: ['better-deals'], col: 0, row: 2 },
  { id: 'sharp-eyes', branch: 'towers', name: 'Sharp Eyes', cost: 1, desc: 'Rangers see 8% farther.', requires: [], col: 0, row: 0 },
  { id: 'bigger-barrels', branch: 'towers', name: 'Bigger Barrels', cost: 1, desc: 'Explosions are 10% wider.', requires: [], col: 1, row: 0 },
  { id: 'cold-snap', branch: 'towers', name: 'Cold Snap', cost: 1, desc: 'Frostcaller slows last 25% longer.', requires: [], col: 2, row: 0 },
  { id: 'cheaper-basics', branch: 'towers', name: 'Cheaper Basics', cost: 2, desc: 'Tier 1 upgrades cost 10% less.', requires: ['sharp-eyes', 'bigger-barrels', 'cold-snap'], col: 1, row: 1 },
  { id: 'extra-lives', branch: 'wardens', name: 'Extra Lives', cost: 1, desc: 'Start every match with 10 more lives.', requires: [], col: 0, row: 0 },
  { id: 'veteran-hero', branch: 'wardens', name: 'Veteran Hero', cost: 2, desc: 'Wren starts at level 3.', requires: ['extra-lives'], col: 0, row: 1 },
  { id: 'fast-learner', branch: 'wardens', name: 'Fast Learner', cost: 2, desc: 'Towers earn 20% more Tower XP.', requires: ['extra-lives'], col: 1, row: 1 },
];
export const BRANCH_NAMES: Record<Branch, string> = { economy: 'Economy', towers: 'Towers', wardens: 'Wardens' };
export const nodeById = (id: string): KnowledgeNode | undefined => KNOWLEDGE.find((n) => n.id === id);
