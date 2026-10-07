/**
 * Spieler-Level und Stufen-Freischaltung. Besitzer: P5 (Kurve), P2 (Freischaltung); alles Daten-Konstanten, Startwerte (gdd.md 4).
 */
import type { Profile } from './profile';

export const MAX_PLAYER_LEVEL = 50;

/** Spieler-Level, ab dem eine Stufe spielbar ist (Startwerte gdd 4). Infinite (Level 15) gibt es in dieser Runde nicht. */
export const DIFFICULTY_UNLOCK_LEVEL: Record<string, number> = { normal: 1, hard: 5, nightmare: 25 };

/** Gesamt-XP, um Level `level` zu erreichen. Platzhalterkurve: Level 5 = 500, Level 25 = 15 000. TODO P5: Kurve in `docs/balancing/meta.md` begruenden. */
export const xpToReach = (level: number): number => 25 * (level - 1) * level;

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
