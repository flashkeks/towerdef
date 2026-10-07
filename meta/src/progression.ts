/**
 * Spieler-Level und Stufen-Freischaltung. Besitzer: P5 (XP-Kurve), P2 (Freischaltung); alles Daten-Konstanten, Startwerte (gdd.md 4).
 */
import type { Profile } from './profile';

export const MAX_PLAYER_LEVEL = 50;

/** Spieler-Level, ab dem eine Stufe spielbar ist (Startwerte gdd 4). Infinite (Level 15) gibt es in dieser Runde nicht. */
export const DIFFICULTY_UNLOCK_LEVEL: Record<string, number> = { normal: 1, hard: 5, nightmare: 25 };

/**
 * XP vom Level `level - 1` zum Level `level` (recommendations.md 15): 100 + 25 x (Level - 2), also 100, 125, 150 ... STARTWERT.
 * Gesamt-XP bis Level L: 100 x (L-1) + 25 x (L-1)(L-2)/2 -> Level 5 = 550, 10 = 1 800, 25 = 9 300, 50 = 34 300.
 * Rechnung (wie viele Clears das sind): docs/balancing/meta.md.
 */
export const xpToReach = (level: number): number => (level <= 1 ? 0 : 100 * (level - 1) + (25 * (level - 1) * (level - 2)) / 2);

export function levelFromXp(xp: number): number {
  let l = 1;
  while (l < MAX_PLAYER_LEVEL && xp >= xpToReach(l + 1)) l++;
  return l;
}

/** XP gutschreiben, Level nachziehen. */
export function addPlayerXp(p: Profile, xp: number): { profile: Profile; levelsGained: number } {
  const playerXp = p.playerXp + Math.max(0, Math.floor(xp));
  const playerLevel = levelFromXp(playerXp);
  return { profile: { ...p, playerXp, playerLevel }, levelsGained: playerLevel - p.playerLevel };
}

export const unlockLevelFor = (difficulty: string): number => DIFFICULTY_UNLOCK_LEVEL[difficulty] ?? Number.POSITIVE_INFINITY;
export const isDifficultyUnlocked = (p: Profile, difficulty: string): boolean => p.playerLevel >= unlockLevelFor(difficulty);
