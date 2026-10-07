/**
 * Meta -> Simulator: `UnitMod[]` fuer `createSim({ unitMods })` (siehe sim/src/state.ts, commands.ts: fehlendes `lvlBp` = 10000).
 * Besitzer: P2. Jetzt: neutral (lvlBp 10000). TODO P2: Level und Sterne ueber `sim/data/progression.json` in `lvlBp` umrechnen;
 * die Mods muessen ins Replay (Format v3), damit Nachspielen bit-genau bleibt.
 */
import type { UnitMod } from '../../sim/src/index';
import type { Profile } from './profile';

export const NEUTRAL_BP = 10000;

export function unitModsFor(_profile: Profile, team: readonly string[], player = 0): UnitMod[] {
  return team.map((unit) => ({ player, unit, lvlBp: NEUTRAL_BP }));
}
