/** Sim-Definitionen aller Units (Werte, Platzierung, Faehigkeiten) fuer die Meta-UI. Einmal gebaut; neue Units aus `units.json` erscheinen von selbst. Besitzer: P4. */
import { createSim, loadBrowserData, STAGE_ID, type UnitDef } from '../sim';

let cache: UnitDef[] | null = null;

export function unitCatalog(): UnitDef[] {
  if (!cache) cache = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data: loadBrowserData() }).catalog();
  return cache;
}

export const unitDefMap = (): Map<string, UnitDef> => new Map(unitCatalog().map((d) => [d.id, d]));
