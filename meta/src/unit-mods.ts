/**
 * Meta -> Simulator: `UnitMod[]` fuer `createSim({ unitMods })`. Besitzer: P2.
 * Level und Sterne einer besessenen Unit werden ueber `sim/data/progression.json` zu `lvlBp` (Schadens-Faktor, 10000 = x1);
 * die Umrechnung selbst steht in `sim/src/progression.ts` (dieselbe Quelle wie die Bots). Die Mods gehoeren ins Replay (Format v3).
 */
import type { UnitMod } from '../../sim/src/index';
import { damageBpFor, unitModFor } from '../../sim/src/progression';
import type { Profile } from './profile';
import { PROGRESSION, starsForCopies } from './stars';

export const NEUTRAL_BP = 10000;

/** Schadens-Faktor (bp) einer besessenen Unit; Sterne aus den Kopien (nicht aus dem Cache-Feld `stars`). */
export function damageBpOf(owned: { level: number; copies: number }): number {
  return damageBpFor(PROGRESSION, owned.level, starsForCopies(owned.copies));
}

/** Mods fuer die Team-Units eines Spielers; nicht besessene Units bekommen neutrale Mods (der Client laesst sie ohnehin nicht zu). */
export function unitModsFor(profile: Profile, team: readonly string[], player = 0): UnitMod[] {
  return team.map((unit) => {
    const o = profile.units[unit];
    return o ? unitModFor(PROGRESSION, player, unit, o.level, starsForCopies(o.copies)) : { player, unit, lvlBp: NEUTRAL_BP };
  });
}
