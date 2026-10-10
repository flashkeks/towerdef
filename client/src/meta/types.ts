/**
 * Was die Bildschirme von `startMatch` (P3) erwarten und wie daraus ein `MatchResult` fuer `meta/` wird.
 * P3 liefert (Stand wip): { won, round, difficulty, seed, livesLeft, pops, upgrades[], ticks, quit }.
 * Optionale Felder `roundsCleared`, `livesLost`, `matchId` werden bevorzugt, wenn P3 sie genau liefert.
 */
import type { Difficulty, GameOptions, HeroType, ModeId, PowerKey, Tiers, TowerType } from '../../../sim/src/types';
import { DATA } from '../../../sim/src/data';
import { maxRoundOf, type MatchResult } from '../../../meta/src/index';

export interface MatchOutcome {
  won: boolean;
  /** Runde, in der das Match endete (Niederlage: die Runde, in der man verlor). Sieg: 20. */
  round: number;
  difficulty: Difficulty;
  livesLeft: number;
  pops: Partial<Record<TowerType | HeroType, number>>;
  /** Endkonto, Endstufen und im Match verdiente Turm-XP aus der Sim (Runde 11b): `state.towerXp`, `state.maxTier`, `state.towerXpGained`. */
  towerXp?: Record<TowerType, number>;
  towerTiers?: Record<TowerType, Tiers>;
  towerXpGained?: Record<TowerType, number>;
  /** Erfolgreiche Power-Einsaetze (`state.stats.powersUsed`), Runde 12. */
  powersUsed?: Partial<Record<PowerKey, number>>;
  /** Jede im Match gekaufte Stufe. */
  upgrades?: { tower: TowerType | HeroType; path: number; tier: number }[];
  seed?: number;
  ticks?: number;
  /** Spieler hat das Match verlassen. */
  quit?: boolean;
  roundsCleared?: number;
  livesLost?: number;
  matchId?: string;
}

/** Optionen, die die Bildschirme an `startMatch` geben (Obermenge der P3-`StartOptions`). */
export interface MatchStartOptions {
  map: string;
  /** Spielmodus (Runde 15) */
  mode: ModeId;
  difficulty: Difficulty;
  unlocks: GameOptions['unlocks'];
  mods: GameOptions['mods'];
  /** Turm-XP-Konto aus dem Profil; die Sim fuehrt es im Match (Freischalten, Rundenende). */
  towerXp?: GameOptions['towerXp'];
  /** Power-Inventar (Runde 12) */
  powers?: GameOptions['powers'];
  /** Text fuer gesperrte Tuerme, z. B. { bombardier: 'Unlocks at level 2' }. */
  lockInfo: Partial<Record<TowerType | HeroType, string>>;
}

export type StartMatch = (root: HTMLElement, opts: MatchStartOptions) => Promise<MatchOutcome>;

export function toMetaResult(o: MatchOutcome, ctx: { matchId: string; map: string; mode?: ModeId; startLives: number }): MatchResult {
  const roundsCleared = Math.max(0, Math.min(9999, o.roundsCleared ?? (o.won ? Math.min(o.round, maxRoundOf(ctx.map, o.difficulty)) : o.round - 1)));
  const livesLost = Math.max(0, Math.min(9999, Math.round(o.livesLost ?? ctx.startLives - o.livesLeft)));
  const pops: MatchResult['pops'] = {};
  for (const [k, v] of Object.entries(o.pops)) pops[k as keyof MatchResult['pops']] = Math.max(0, Math.floor(v ?? 0));
  return { matchId: o.matchId ?? ctx.matchId, map: ctx.map, mode: ctx.mode ?? 'standard', difficulty: o.difficulty, won: o.won, roundsCleared, livesLost, pops, towerXp: o.towerXp, towerTiers: o.towerTiers, towerXpGained: o.towerXpGained, powersUsed: o.powersUsed };
}

/** Leben zu Beginn: Schwierigkeit + Wissensbaum (`mods.lives`). */
export const startLives = (d: Difficulty, mods: GameOptions['mods']): number => DATA.difficulties[d].lives + (mods?.lives ?? 0);
