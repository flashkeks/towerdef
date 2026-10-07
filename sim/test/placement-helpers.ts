import type { Sim } from '../src/index.js';

/** IDs der Altbestand-Slots einer Art (nur 1x1), in ID-Reihenfolge. */
export function placementIds(sim: Sim, kind: 'ground' | 'hill'): number[] {
  return sim.slotCenters().filter((s) => s.kind === kind && s.size === 1).map((s) => s.id);
}
