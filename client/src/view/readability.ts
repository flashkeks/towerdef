/**
 * Lesbarkeit im Match (Runde 6, P4): reine Funktionen, kein DOM, kein Pixi. Alles wird aus den Sim-Daten abgeleitet
 * (`UnitDef.canHitAir`, `attack.kind`, `aura`, `farm`, `ability`), nichts ist je Unit hart codiert.
 */
import type { UnitDef, UnitState, WavePreview } from '../sim';

export type UnitTag = 'air' | 'area' | 'boss' | 'support' | 'income';

/** Reihenfolge = Reihenfolge der Symbole im Shop. */
export const UNIT_TAGS: readonly UnitTag[] = ['air', 'area', 'boss', 'support', 'income'];

/** Symbole einer Unit aus ihren Daten: trifft Luft, Flaeche (Kreis/Linie/Kegel), Boss (Nuke oder Stun-Faehigkeit), Support (Aura), Geld (Farm). */
export function unitTags(def: UnitDef): UnitTag[] {
  const tags: UnitTag[] = [];
  if (def.canHitAir && def.attack) tags.push('air'); // Banner steht auf dem Huegel, schiesst aber nicht
  const kind = def.attack?.kind;
  if (kind === 'circle' || kind === 'line' || kind === 'cone') tags.push('area');
  if (def.ability && (def.ability.kind === 'nuke' || def.ability.kind === 'stunAoe')) tags.push('boss');
  if (def.aura) tags.push('support');
  if (def.farm) tags.push('income');
  return tags;
}

/** Wie viele der gesetzten Units Flieger treffen koennen. */
export function airUnitCount(units: readonly UnitState[], defs: readonly UnitDef[]): number {
  const air = new Set(defs.filter((d) => d.canHitAir && d.attack).map((d) => d.id));
  return units.filter((u) => air.has(u.defId)).length;
}

/** Namen der Units im Team, die Luft treffen (Katalog-Reihenfolge). */
export const airCapable = (team: readonly UnitDef[]): UnitDef[] => team.filter((d) => d.canHitAir && d.attack !== null);

export interface FlyerWarning {
  /** Flieger in der Welle (Summe der fliegenden Gruppen) */
  flyers: number;
  /** gesetzte Units, die Luft treffen */
  airUnits: number;
}

/** Hinweis vor dem Wellenstart; `null`, wenn die Welle keine Flieger hat. */
export function flyerWarning(p: WavePreview | null, units: readonly UnitState[], defs: readonly UnitDef[]): FlyerWarning | null {
  if (!p) return null;
  const flyers = p.groups.filter((g) => g.flying).reduce((s, g) => s + g.count, 0);
  if (flyers === 0) return null;
  return { flyers, airUnits: airUnitCount(units, defs) };
}

/** Units im Team, die eine unterbrechbare Boss-Wirkung brechen (Stun) bzw. sie mit einem Schlag brechen (Nuke). */
export function bossHelpers(team: readonly UnitDef[]): { stun: UnitDef[]; nuke: UnitDef[] } {
  return {
    stun: team.filter((d) => d.ability?.kind === 'stunAoe'),
    nuke: team.filter((d) => d.ability?.kind === 'nuke'),
  };
}

/** Muenz-Hinweis: Leak in den letzten `windowTicks` Ticks und mehr als `factor` x die guenstigste Unit auf dem Konto. */
export const COIN_NUDGE_FACTOR = 1.5;
export const COIN_NUDGE_WINDOW_TICKS = 400;

export function coinNudge(coins: number, cheapest: number, ticksSinceLeak: number | null): boolean {
  if (ticksSinceLeak === null || ticksSinceLeak > COIN_NUDGE_WINDOW_TICKS) return false;
  if (cheapest <= 0) return false;
  return coins > COIN_NUDGE_FACTOR * cheapest;
}

/** Units mit bereiter Faehigkeit; nur sinnvoll, solange Gegner auf dem Feld sind. */
export function readyAbilityUnits(units: readonly UnitState[], defs: readonly UnitDef[], enemyCount: number): UnitState[] {
  if (enemyCount <= 0) return [];
  const withAbility = new Set(defs.filter((d) => d.ability).map((d) => d.id));
  return units.filter((u) => withAbility.has(u.defId) && u.abilityCd === 0);
}

/** "A", "A or B", "A, B or C". */
export function joinOr(names: readonly string[], or: string): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${or} ${names[names.length - 1]}`;
}
