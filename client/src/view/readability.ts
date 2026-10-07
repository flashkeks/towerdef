/**
 * Lesbarkeit im Match (Runde 6, P4): reine Funktionen, kein DOM, kein Pixi. Alles wird aus den Sim-Daten abgeleitet
 * (`UnitDef.canHitAir`, `levels[].attack.kind/fx`, `farm`), nichts ist je Unit hart codiert.
 */
import type { FxSpec, UnitDef, UnitState, WavePreview } from '../sim';

export type UnitTag = 'air' | 'area' | 'boss' | 'support' | 'income';

/** Reihenfolge = Reihenfolge der Symbole im Shop. */
export const UNIT_TAGS: readonly UnitTag[] = ['air', 'area', 'boss', 'support', 'income'];

const CC_STUN = new Set(['stun', 'freeze', 'timestop']);
/** Alle Effekte, die irgendeine Stufe der Unit anwendet. */
export const unitEffects = (def: UnitDef): FxSpec[] => def.levels.flatMap((l) => l.attack?.fx ?? []);

/** Symbole einer Unit aus ihren Daten: trifft Luft, Flaeche (Kreis/Linie/Kegel/Voll), Boss (Stun/Freeze/Timestop), Support (Motivate), Geld (Farm). */
export function unitTags(def: UnitDef): UnitTag[] {
  const tags: UnitTag[] = [];
  const attacks = def.levels.map((l) => l.attack).filter((a) => a !== null);
  if (def.canHitAir && attacks.length > 0) tags.push('air');
  if (attacks.some((a) => a.kind !== 'single')) tags.push('area');
  const fx = unitEffects(def);
  if (fx.some((f) => CC_STUN.has(f.kind))) tags.push('boss');
  if (fx.some((f) => f.kind === 'motivate')) tags.push('support');
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

/** Units im Team, die einen Boss festsetzen koennen (Stun, Freeze, Timestop) und so unterbrechbare Wirkungen brechen. `nuke` bleibt fuer die Schnittstelle, ist aber leer (Runde 8: keine Fähigkeits-Knöpfe). */
export function bossHelpers(team: readonly UnitDef[]): { stun: UnitDef[]; nuke: UnitDef[] } {
  return { stun: team.filter((d) => unitEffects(d).some((f) => CC_STUN.has(f.kind))), nuke: [] };
}

/** Muenz-Hinweis: Leak in den letzten `windowTicks` Ticks und mehr als `factor` x die guenstigste Unit auf dem Konto. */
export const COIN_NUDGE_FACTOR = 1.5;
export const COIN_NUDGE_WINDOW_TICKS = 400;

export function coinNudge(coins: number, cheapest: number, ticksSinceLeak: number | null): boolean {
  if (ticksSinceLeak === null || ticksSinceLeak > COIN_NUDGE_WINDOW_TICKS) return false;
  if (cheapest <= 0) return false;
  return coins > COIN_NUDGE_FACTOR * cheapest;
}

/** "A", "A or B", "A, B or C". */
export function joinOr(names: readonly string[], or: string): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${or} ${names[names.length - 1]}`;
}
