/**
 * Ablaufplan der Zieh-Animation (Runde 8, P4), ohne DOM: wie lange das Siegel leuchtet, welche Karten ein Rampenlicht bekommen und wie lange.
 * Je hoeher die beste Seltenheit des Zugs, desto laenger und farbiger der Vorspann; nur Legendary und besser (und jeder Einzelzug) stehen im Rampenlicht,
 * der Rest klappt schnell in die Uebersicht. Das Ergebnis steht beim Zeigen schon fest, die Animation aendert nichts mehr.
 */
import { RARITIES, rarityId, type RarityId } from './kit';

export const rarityIndex = (r: string): number => RARITIES.indexOf(rarityId(r));

/** Farbton (hsl) der Lichtsaeule und der Funken je Seltenheit; `secret` laeuft durch alle Farben. */
export const REVEAL_HUE: Record<RarityId, number | 'rainbow'> = { rare: 210, epic: 275, legendary: 42, mythic: 345, secret: 'rainbow', exclusive: 160 };

/** Vorspann (Siegel + Lichtsaeule) je bester Seltenheit des Zugs. */
const INTRO_MS: Record<RarityId, number> = { rare: 900, epic: 1050, legendary: 1350, mythic: 1750, secret: 2100, exclusive: 1900 };
/** Rampenlicht je Seltenheit der einzelnen Karte. */
const SPOT_MS: Record<RarityId, number> = { rare: 750, epic: 850, legendary: 1300, mythic: 1900, secret: 2600, exclusive: 2200 };
/** Abstand der Karten in der Uebersicht, wenn kein Rampenlicht davor liegt. */
const POP_MS = 150;

export interface RevealStep {
  index: number;
  rarity: RarityId;
  /** Rampenlicht (Grosse Karte in der Mitte) davor? */
  spotlight: boolean;
  /** Dauer des Rampenlichts bzw. des Einklappens in ms */
  ms: number;
}

export interface RevealPlan {
  best: RarityId;
  introMs: number;
  steps: RevealStep[];
  totalMs: number;
}

/** Plan fuer eine Liste von Seltenheiten (Reihenfolge der Ziehung). */
export function revealPlan(rarities: readonly string[]): RevealPlan {
  const ids = rarities.map(rarityId);
  const best = ids.reduce<RarityId>((b, r) => (rarityIndex(r) > rarityIndex(b) ? r : b), 'rare');
  const single = ids.length === 1;
  const steps = ids.map((rarity, index): RevealStep => {
    const spotlight = single || rarityIndex(rarity) >= rarityIndex('legendary');
    return { index, rarity, spotlight, ms: spotlight ? SPOT_MS[rarity] : POP_MS };
  });
  const introMs = INTRO_MS[best];
  return { best, introMs, steps, totalMs: introMs + steps.reduce((s, x) => s + x.ms, 0) + 450 };
}
