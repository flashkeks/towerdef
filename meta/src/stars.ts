/**
 * Kopien -> Sterne. Besitzer: P2 (Werte), gelesen von `gacha.ts` (P3). Platzhalter: 1/2/4/8/16 Kopien fuer Stern 1..5
 * (rec 13 nennt 1/2/4 fuer Stern 1-3). TODO P2: Schwellen als Daten in `sim/data/progression.json`.
 */
export const STAR_THRESHOLDS: readonly number[] = [1, 2, 4, 8, 16];
export const MAX_STARS = STAR_THRESHOLDS.length;

export function starsForCopies(copies: number): number {
  let s = 1;
  for (let i = 0; i < STAR_THRESHOLDS.length; i++) if (copies >= (STAR_THRESHOLDS[i] ?? Infinity)) s = i + 1;
  return s;
}
