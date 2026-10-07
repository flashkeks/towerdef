/**
 * Kopien -> Sterne. Besitzer: P2, gelesen von `gacha.ts` (P3). Die Schwellen stehen als Daten in `sim/data/progression.json`
 * (`starCopies`: 1/2/4/8/16 Kopien fuer Stern 1..5; rec 13 nennt 1/2/4 fuer Stern 1-3), eine Quelle fuer Meta, Sim und Bots.
 */
import progressionJson from '../../sim/data/progression.json';
import { ProgressionSchema } from '../../sim/src/data/schema';
import { starsForCopies as starsFor } from '../../sim/src/progression';

export const PROGRESSION = ProgressionSchema.parse(progressionJson);
export const STAR_THRESHOLDS: readonly number[] = PROGRESSION.starCopies;
export const MAX_STARS = STAR_THRESHOLDS.length;

export function starsForCopies(copies: number): number {
  return starsFor(PROGRESSION, copies);
}

/** Zuwachs, bis der naechste Stern erreicht ist: Kopien insgesamt noetig (`null` bei Maximum). */
export function copiesForNextStar(stars: number): number | null {
  return stars >= MAX_STARS ? null : STAR_THRESHOLDS[stars] ?? null;
}
