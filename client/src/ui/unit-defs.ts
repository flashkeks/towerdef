/** Sim-Definitionen aller Units (Werte, Platzierung, Faehigkeiten) fuer die Meta-UI. Einmal gebaut; neue Units aus `sim/data/units/*.json` erscheinen von selbst. Besitzer: P4. */
import { createSim, loadBrowserData, STAGE_ID, type UnitDef } from '../sim';
import { registerUnitColors } from '../view/model';

let cache: UnitDef[] | null = null;

export function unitCatalog(): UnitDef[] {
  if (!cache) {
    cache = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data: loadBrowserData() }).catalog();
    registerUnitColors(cache);
  }
  return cache;
}

let mapCache: Map<string, UnitDef> | null = null;
/** Id -> Definition. Die Karte wird einmal gebaut und geteilt (nicht veraendern). */
export const unitDefs = (): ReadonlyMap<string, UnitDef> => (mapCache ??= new Map(unitCatalog().map((d) => [d.id, d])));
export const unitDefMap = (): Map<string, UnitDef> => new Map(unitDefs());
