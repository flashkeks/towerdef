/**
 * Unit-Level mit Gold. Besitzer: P5 (Kosten), P2 (Wirkung im Simulator ueber `unit-mods.ts`).
 * Jetzt: einfache Kostenkurve, Level 1-40. TODO P5: Kurve als Daten + Rechnung in `docs/balancing/meta.md`.
 * Jeder Aufstieg ist eine eigene Buchung (refType 'unit_level', refId 'UNIT:ZIELLEVEL'), damit er nie doppelt abgebucht wird.
 */
import type { MetaEnv } from './env';
import { book, KIND } from './ledger';
import type { Profile } from './profile';
import { fail, opOk, type Op } from './result';

export const MAX_UNIT_LEVEL = 40;

/** Gold fuer den Aufstieg von `level` auf `level + 1`. Platzhalter: 50 x Level. */
export const levelUpCost = (level: number): number => 50 * level;

export function levelUp(p: Profile, unitId: string, env: Pick<MetaEnv, 'now'>): Op<{ unitId: string; level: number; cost: number }> {
  const u = p.units[unitId];
  if (!u) return fail('unit-not-owned', `You do not own ${unitId}.`);
  if (u.level >= MAX_UNIT_LEVEL) return fail('max-level', 'This unit is at the maximum level.');
  const cost = levelUpCost(u.level);
  const target = u.level + 1;
  const r = book(p, { currency: 'gold', delta: -cost, kind: KIND.levelUp, refType: 'unit_level', refId: `${unitId}:${target}` }, env);
  if (!r.ok) return r;
  const profile: Profile = { ...r.profile, units: { ...r.profile.units, [unitId]: { ...u, level: target } } };
  return opOk(profile, { unitId, level: target, cost });
}
