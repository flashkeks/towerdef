/**
 * Fähigkeiten und Auren (Runde 9 / P1).
 *
 * Eine Fähigkeit (`UnitDef.abilities`) wirkt mit dem Baukasten der Angriffe: Trefferfläche, Treffer, DoT und Spezialeffekte aus dem
 * Angriffs-Katalog, dazu Selbst-Buff, Buff auf Verbündete, Beschwörung, Münzen. `button`-Fähigkeiten löst der Befehl `ability` aus; der Auto-Schalter
 * (`autoAbility`) löst sie, sobald bereit, von selbst aus. `auto`-Fähigkeiten feuern immer von selbst (periodische Beschwörer). Auto-Auslösung
 * braucht einen lebenden Gegner (kein Verschwenden zwischen den Wellen) und bei Beschwörungen Platz unter dem Limit.
 *
 * Mehrfach-Wirkung: `pulses` Schläge im Abstand `pulseEvery` Ticks (der erste sofort); Buff, Beschwörung und Münzen kommen nur beim ersten.
 * Alle Zustände liegen in der Unit (`ab`, `auto`, `run`), nur wenn die Unit sie braucht.
 */
import type { AbilityDef, BuffSpec, UnitDef } from '../data/compile.js';
import { BP, dist2, mulBp } from '../fixed.js';
import type { UnitState, World } from '../state.js';
import { computeBuffs, strike } from './attack.js';
import { addCoins } from './economy.js';
import { spawnSummons, summonCount } from './summon.js';
import { selectTarget } from './target.js';

/** Reichweite einer globalen Fähigkeit (Milli-Tiles): größer als jede Karte. */
const GLOBAL_RANGE = 1_000_000;

type BuffBp = Pick<BuffSpec, 'damageBp' | 'rangeBp' | 'tempoBp' | 'critBp'>;

/** Stärkerer Buff gewinnt, gleich starker erneuert die Dauer, schwächerer wird ignoriert (wie Motivate). */
function raise(cur: number, curTicks: number, bp: number, ticks: number): [number, number] {
  if (bp <= 0) return [cur, curTicks];
  if (curTicks > 0 && cur > bp) return [cur, curTicks];
  return [bp, curTicks > 0 && cur === bp ? Math.max(curTicks, ticks) : ticks];
}

/** Gibt `o` einen Buff für `ticks` Ticks. Felder entstehen nur, wenn der Buff sie braucht. */
export function giveBuff(o: UnitState, b: BuffBp, ticks: number): void {
  if (b.damageBp > 0) [o.motDmgBp, o.motDmgTicks] = raise(o.motDmgBp, o.motDmgTicks, b.damageBp, ticks);
  if (b.rangeBp > 0) [o.motRangeBp, o.motRangeTicks] = raise(o.motRangeBp, o.motRangeTicks, b.rangeBp, ticks);
  if (b.tempoBp > 0) {
    const [bp, t] = raise(o.motTempoBp ?? 0, o.motTempoTicks ?? 0, b.tempoBp, ticks);
    o.motTempoBp = bp;
    o.motTempoTicks = t;
  }
  if (b.critBp > 0) {
    const [bp, t] = raise(o.motCritBp ?? 0, o.motCritTicks ?? 0, b.critBp, ticks);
    o.motCritBp = bp;
    o.motCritTicks = t;
  }
}

/** Anfangszustand der Fähigkeiten einer neuen Unit (leer, wenn die Unit keine hat). */
export function initAbilities(def: UnitDef): { ab?: number[] } {
  return def.abilities.length > 0 ? { ab: def.abilities.map(() => 0) } : {};
}

function rangeOf(w: World, u: UnitState, def: UnitDef, a: AbilityDef): number {
  if (a.global) return GLOBAL_RANGE;
  const lv = def.levels[u.level];
  const b = computeBuffs(w, u, def, a.attack);
  return mulBp(lv.rangeMilli, BP + b.rangeBp + (u.traitRangeBp ?? 0));
}

function targetOf(w: World, u: UnitState, def: UnitDef, a: AbilityDef) {
  const eco = w.ctx.data.economy;
  return selectTarget(w.state.enemies, {
    ux: u.x,
    uy: u.y,
    rangeMilli: rangeOf(w, u, def, a),
    canHitAir: def.canHitAir,
    mode: a.global ? 'first' : u.targeting,
    enemyRadiusMilli: eco.targeting.enemyRadiusMilli,
    strongestShieldBp: eco.targeting.strongestShieldBp,
  });
}

/**
 * Warum die Fähigkeit jetzt nicht geht (`null` = geht): `no-ability`, `locked` (Stufe zu niedrig), `cooldown`, `no-target`
 * (Ziel in Reichweite bzw. ein Gegner auf der Karte fehlt), `capped` (nur automatisch: Beschwörungslimit erreicht).
 */
export function abilityError(w: World, u: UnitState, def: UnitDef, i: number, auto: boolean): string | null {
  const a = def.abilities[i];
  if (!a) return 'no-ability';
  if (u.level < a.minLevel) return 'locked';
  if ((u.ab?.[i] ?? 0) > 0) return 'cooldown';
  if (a.needsTarget) {
    if (!targetOf(w, u, def, a)) return 'no-target';
  } else if ((a.global || auto) && !w.state.enemies.some((e) => e.hp > 0)) return 'no-target';
  if (auto && a.summon && a.summon.every((sc) => summonCount(w, u.id, sc.id) >= (w.ctx.summons[sc.id]?.cap ?? 1))) return 'capped';
  return null;
}

/** Ein Schlag der Fähigkeit; `first`: der erste (nur er bringt Buff, Beschwörung und Münzen). */
function pulse(w: World, u: UnitState, def: UnitDef, a: AbilityDef, first: boolean): void {
  const lv = def.levels[u.level];
  if (a.attack) {
    const target = targetOf(w, u, def, a);
    if (target) {
      const buffs = computeBuffs(w, u, def, a.attack);
      const dmg = a.damageCenti > 0 ? a.damageCenti : mulBp(lv.damageRawCenti, a.damageMultBp);
      strike(w, u, def, u, a.attack, dmg, rangeOf(w, u, def, a), target, buffs, def.critBp, false);
    }
  }
  if (!first) return;
  if (a.selfBuff) giveBuff(u, a.selfBuff, a.selfBuff.ticks);
  if (a.buff) {
    const r2 = a.buff.radiusMilli === null ? -1 : a.buff.radiusMilli * a.buff.radiusMilli;
    for (const o of w.state.units) {
      if (o.id === u.id && !a.buff.self) continue;
      if (r2 >= 0 && dist2(o.x, o.y, u.x, u.y) > r2) continue;
      giveBuff(o, a.buff, a.buff.ticks);
    }
  }
  for (const sc of a.summon ?? []) spawnSummons(w, u, sc.id, sc.count);
  if (a.coins > 0) addCoins(w, u.owner, a.coins, 'ability');
}

/** Löst Fähigkeit `i` aus (Bedingungen vorher mit `abilityError` geprüft). */
export function fireAbility(w: World, u: UnitState, def: UnitDef, i: number, auto: boolean): void {
  const a = def.abilities[i];
  (u.ab ??= def.abilities.map(() => 0))[i] = a.cooldownTicks;
  w.events.push({ type: 'ability', tick: w.state.tick, unitId: u.id, owner: u.owner, ability: a.id, name: a.name, auto });
  pulse(w, u, def, a, true);
  if (a.pulses > 1) u.run = { i, left: a.pulses - 1, next: a.pulseEvery };
}

/** Pro Tick (nach den Angriffen): Abklingzeiten, laufende Mehrfach-Wirkungen, automatische Auslösung. */
export function tickAbilities(w: World): void {
  const { state, ctx } = w;
  for (const u of state.units) {
    const def = ctx.units[u.defId];
    if (def.abilities.length === 0 || !u.ab) continue;
    for (let i = 0; i < u.ab.length; i++) if (u.ab[i] > 0) u.ab[i]--;
    if (u.run && --u.run.next <= 0) {
      pulse(w, u, def, def.abilities[u.run.i], false);
      if (--u.run.left <= 0) delete u.run;
      else u.run.next = def.abilities[u.run.i].pulseEvery;
    }
    for (let i = 0; i < def.abilities.length; i++) {
      const a = def.abilities[i];
      if (a.trigger !== 'auto' && !u.auto) continue;
      if (abilityError(w, u, def, i, true) === null) fireAbility(w, u, def, i, true);
    }
  }
}

/** Auren: jeder Aura-Träger erneuert den Buff aller Verbündeten im Radius (2 Ticks Dauer, stärkster gewinnt). */
export function applyAuras(w: World): void {
  const { state, ctx } = w;
  for (const u of state.units) {
    const auras = ctx.units[u.defId].aura;
    if (auras.length === 0) continue;
    const aura = auras[Math.min(u.level, auras.length - 1)];
    const r2 = aura.radiusMilli === null ? -1 : aura.radiusMilli * aura.radiusMilli;
    for (const o of state.units) {
      if (o.id === u.id) continue;
      if (r2 >= 0 && dist2(o.x, o.y, u.x, u.y) > r2) continue;
      giveBuff(o, aura, 2);
    }
  }
}
