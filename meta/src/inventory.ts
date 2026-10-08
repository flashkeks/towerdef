/**
 * Inventar-Helfer (Runde 9 / P3): Raid-Marken und Evolutions-Material. Reine Funktionen auf dem Profil.
 * Mengen sind Ganzzahlen >= 0; Material mit Menge 0 wird gestrichen. Buchungen ueber den Ledger gibt es hier nicht (siehe `InventorySchema`):
 * Gutschriften kommen aus `rewardForMatch` (Doppelsperre ueber die Match-Buchung) und die Ausgaben aus Evolution und Raid-Shop (Idempotenz
 * ueber `withIdempotency`, Zaehler fuer Limits).
 */
import type { Inventory, Profile } from './profile';
import { fail, type Fail } from './result';

export const materialCount = (p: Profile, id: string): number => p.inventory.materials[id] ?? 0;

export interface InventoryDelta {
  raidMarks?: number;
  materials?: Record<string, number>;
}

/** Positive und negative Aenderungen anwenden. Faellt eine Menge unter 0: `not-enough-raid-marks` bzw. `not-enough-material`, Profil unveraendert. */
export function applyInventory(p: Profile, d: InventoryDelta): { ok: true; profile: Profile } | Fail {
  const marks = p.inventory.raidMarks + (d.raidMarks ?? 0);
  if (marks < 0) return fail('not-enough-raid-marks', 'Not enough Raid Marks.');
  const materials: Inventory['materials'] = { ...p.inventory.materials };
  for (const [id, delta] of Object.entries(d.materials ?? {})) {
    if (!Number.isInteger(delta)) return fail('invalid-amount', 'Amount must be an integer.');
    const n = (materials[id] ?? 0) + delta;
    if (n < 0) return fail('not-enough-material', 'Not enough material.');
    if (n === 0) delete materials[id];
    else materials[id] = n;
  }
  return { ok: true, profile: { ...p, inventory: { raidMarks: marks, materials } } };
}
