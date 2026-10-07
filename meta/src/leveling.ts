/**
 * Unit-Level mit Gold. Besitzer: P5 (Kosten, Ablauf), P2 (Wirkung im Simulator ueber `unit-mods.ts`).
 * Kostenkurve nach recommendations.md 15 (dort 40 + 10 x (L-1) XP je Level, hier als Gold): STARTWERT, Rechnung in docs/balancing/meta.md.
 * Jeder Aufstieg ist eine eigene Buchung (refType 'unit_level', refId 'UNIT:ZIELLEVEL'), damit er nie doppelt abgebucht wird.
 * Fehlercodes: `unit-not-owned`, `max-level`, `not-enough-gold`.
 */
import type { MetaEnv } from './env';
import { book, KIND } from './ledger';
import type { Profile } from './profile';
import { fail, opOk, type Op } from './result';

export const MAX_UNIT_LEVEL = 40;
export const LEVEL_COST_BASE = 40;
export const LEVEL_COST_STEP = 10;

/** Gold fuer den Aufstieg von `level` auf `level + 1` (1..39): 40, 50, 60 ... 420. */
export const levelUpCost = (level: number): number => LEVEL_COST_BASE + LEVEL_COST_STEP * (level - 1);

/** Gold fuer alle Aufstiege von `from` bis `to` (z. B. 1 -> 40 = 8 970). */
export function levelUpTotalCost(from: number, to: number): number {
  let sum = 0;
  for (let l = Math.max(1, from); l < Math.min(MAX_UNIT_LEVEL, to); l++) sum += levelUpCost(l);
  return sum;
}

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
