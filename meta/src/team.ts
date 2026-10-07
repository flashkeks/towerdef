/**
 * Team setzen. Regeln: nur besessene Units, hoechstens `MAX_TEAM`, keine Duplikate, mindestens eine Unit.
 * Reihenfolge bleibt erhalten (sie ist die Reihenfolge der Unit-Leiste).
 */
import { MAX_TEAM, type Profile } from './profile';
import { fail, opOk, type Op } from './result';

export function setTeam(p: Profile, unitIds: readonly string[]): Op<{ team: string[] }> {
  if (!Array.isArray(unitIds) || unitIds.some((u) => typeof u !== 'string')) return fail('invalid-team', 'Team must be a list of unit ids.');
  if (unitIds.length === 0) return fail('team-empty', 'Pick at least one unit.');
  if (unitIds.length > MAX_TEAM) return fail('team-too-large', `A team has at most ${MAX_TEAM} units.`);
  if (new Set(unitIds).size !== unitIds.length) return fail('team-duplicate', 'Each unit can be in the team once.');
  const missing = unitIds.find((u) => !p.units[u]);
  if (missing) return fail('unit-not-owned', `You do not own ${missing}.`);
  const team = [...unitIds];
  return opOk({ ...p, team }, { team });
}
