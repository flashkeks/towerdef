/** Positionshilfen der Sanity-Skripte (Runde 6 / P1): freie Platzierung statt Slot-IDs. */
import type { Sim } from '../../src/index.js';

/** Freie Positionen (Halbkachel-Raster) für die Unit in Reihenfolge der Pfadabdeckung bei `range` (beste zuerst). Geldmangel zählt nicht als belegt. */
export function freePositions(sim: Sim, unitId: string, range: number, player = 0): { x: number; y: number }[] {
  return [...sim.placementGrid(unitId)]
    .filter((p) => {
      const r = sim.canPlace(player, unitId, p.x, p.y);
      return r === null || r === 'not-enough-coins';
    })
    .sort((a, b) => sim.coverage(b.x, b.y, range) - sim.coverage(a.x, a.y, range) || a.y - b.y || a.x - b.x);
}

/** Alte Slot-Positionen (Altbestand) der Art, die jetzt für die Unit frei wären. */
export function legacyFree(sim: Sim, unitId: string, kind: 'ground' | 'hill', player = 0): { x: number; y: number }[] {
  return sim
    .slotCenters()
    .filter((s) => s.size === 1 && s.kind === kind)
    .filter((s) => {
      const r = sim.canPlace(player, unitId, s.x, s.y);
      return r === null || r === 'not-enough-coins';
    })
    .map((s) => ({ x: s.x, y: s.y }));
}
