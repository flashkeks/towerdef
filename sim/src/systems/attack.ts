/**
 * Angriffe (Runde 8 / P1, generisch aus Daten): Abklingzeit, Zielwahl, Trefferfläche (single/circle/cone/line/full), Treffer-Teilung,
 * Schaden (Typ, Schwäche, Resistenz, Crit), DoT und Spezialeffekte.
 * Units werden in aufsteigender ID abgearbeitet; getroffene Gegner in aufsteigender ID.
 * Geometrie rein ganzzahlig: Richtungsvektor auf Länge ~1024 normiert (Integer-Sqrt).
 *
 * Ablauf eines Angriffs: Ziel wählen (Reichweite der Stufe) -> Crit würfeln (ein Wurf je Angriff, nur Units mit Crit verbrauchen
 * PRNG) -> Trefferfläche bestimmen (einmal) -> Shatter -> `hits` Treffer reihum auf alle Gegner der Fläche, jeder Treffer mit
 * `damage / hits` -> Spezialeffekte je Gegner (einmal je Angriff) -> Selbst-Buffs der Unit.
 */
import type { CompiledAttack, FxSpec, LevelStat, UnitDef } from '../data/compile.js';
import { computeHit } from '../damage.js';
import { BP, dist2, isqrt, mulBp } from '../fixed.js';
import { nextInt } from '../prng.js';
import type { EnemyState, UnitState, World } from '../state.js';
import { applyDamage, applyDot } from './effects.js';
import { effectiveArmor } from './boss.js';
import { applyFx } from './special.js';
import { selectTarget } from './target.js';

export interface Buffs {
  /** Buff-Schaden von Verbündeten (Motivate), wird auf `buffCaps.damageBp` begrenzt. */
  damageBp: number;
  tempoBp: number;
  /** Reichweiten-Zuwachs (Motivate, Sunshine), Cap `buffCaps.rangeBp` für Buffs, Sunshine zusätzlich (siehe `computeBuffs`). */
  rangeBp: number;
  /** Selbst-Buffs der Unit (Battlelust, Snatched, Sunshine) auf den Schaden, ohne Cap. */
  selfBp: number;
}

/** Effekte (`FxSpec`) einer Art in einem Angriff. */
const fxOf = <K extends FxSpec['kind']>(atk: CompiledAttack | null, kind: K): Extract<FxSpec, { kind: K }> | undefined =>
  atk?.fx.find((f): f is Extract<FxSpec, { kind: K }> => f.kind === kind);

/**
 * Buffs einer Unit für ihren aktuellen Angriff: Motivate-Buffs von Verbündeten (Schaden/Reichweite, je mit Cap), eigene
 * Selbst-Buffs aus den Effekten des Angriffs (Battlelust: +Schritt je Angriff bis Maximum; Snatched: dito, solange nicht abgelaufen,
 * auf der letzten Stufe mit höherem Maximum; Sunshine: wächst je Wave linear bis auf den Faktor, auch bei der Reichweite).
 */
export function computeBuffs(w: World, u: UnitState, def: UnitDef): Buffs {
  const eco = w.ctx.data.economy;
  const atk = def.levels[u.level].attack;
  let selfBp = 0;
  let rangeExtra = 0;
  const bl = fxOf(atk, 'battlelust');
  if (bl) selfBp += Math.min(u.lust * bl.stepBp, bl.maxBp);
  const sn = fxOf(atk, 'snatched');
  if (sn && u.snatchTicks > 0) selfBp += Math.min(u.snatch * sn.stepBp, u.level >= def.maxLevel ? sn.maxBpMaxLevel : sn.maxBp);
  const sun = fxOf(atk, 'sunshine');
  if (sun) {
    const k = Math.min(u.sun, sun.maxWaves);
    selfBp += Math.floor((sun.dmgBp * k) / sun.maxWaves);
    rangeExtra = Math.floor((sun.rangeBp * k) / sun.maxWaves);
  }
  const mot = u.motRangeTicks > 0 ? Math.min(u.motRangeBp, eco.buffCaps.rangeBp) : 0;
  return { damageBp: u.motDmgTicks > 0 ? u.motDmgBp : 0, tempoBp: 0, rangeBp: mot + rangeExtra, selfBp };
}

/** Normierte Richtung (Länge ~1024) von (ux,uy) nach (tx,ty). */
function direction(ux: number, uy: number, tx: number, ty: number): { nx: number; ny: number } {
  const dx = tx - ux;
  const dy = ty - uy;
  const len = isqrt(dx * dx + dy * dy);
  if (len === 0) return { nx: 1024, ny: 0 };
  return { nx: Math.trunc((dx * 1024) / len), ny: Math.trunc((dy * 1024) / len) };
}

export function inLine(
  e: { x: number; y: number },
  ux: number,
  uy: number,
  nx: number,
  ny: number,
  length: number,
  width: number,
  radius: number,
): boolean {
  const vx = e.x - ux;
  const vy = e.y - uy;
  const proj = Math.trunc((vx * nx + vy * ny) / 1024);
  if (proj < 0 || proj > length + radius) return false;
  const perp = Math.abs(Math.trunc((vx * ny - vy * nx) / 1024));
  return perp <= Math.floor(width / 2) + radius;
}

export function inCone(
  e: { x: number; y: number },
  ux: number,
  uy: number,
  nx: number,
  ny: number,
  length: number,
  cos2Bp: number,
  radius: number,
): boolean {
  const vx = e.x - ux;
  const vy = e.y - uy;
  const v2 = vx * vx + vy * vy;
  const r = length + radius;
  if (v2 > r * r) return false;
  if (v2 === 0) return true;
  const dot = vx * nx + vy * ny;
  if (dot <= 0) return false;
  const dot2 = Math.floor((dot * dot) / 1048576); // (dot/1024)^2
  return dot2 * BP >= cos2Bp * v2;
}

export interface HitCtx {
  buffs: Buffs;
  crit: boolean;
  /** OverCrit: Treffer auf blutende Gegner sind garantiert Crits. */
  overCrit: boolean;
}

/** Summe der Schwächen/Resistenzen eines Gegners gegen Elemente (Bp bzw. R) und gegen den Damage-Typ. */
function affinityOf(w: World, def: UnitDef, e: EnemyState): { weakBp: number; resist: number } {
  const aff = w.ctx.affinity(e.type, e.element);
  let weakBp = 0;
  let resist = aff.resist[def.damageType] ?? 0;
  for (const el of def.elements) {
    weakBp += aff.weakBp[el] ?? 0;
    resist += aff.resist[el] ?? 0;
  }
  return { weakBp, resist };
}

/**
 * Ein Treffer einer Unit auf einen Gegner (Schaden + DoT). Gibt den Treffer-Schaden vor Schwäche/Rüstung zurück (`dotBase`,
 * Grundlage für Wild-Card-DoT).
 */
export function hitEnemy(w: World, u: UnitState, def: UnitDef, atk: CompiledAttack, e: EnemyState, hc: HitCtx, baseCenti: number): number {
  const eco = w.ctx.data.economy;
  const trueDamage = def.damageType === 'true';
  const aff = affinityOf(w, def, e);
  const r = computeHit(
    {
      baseCenti,
      lvlBp: u.lvlBp,
      traitBp: u.traitBp,
      buffBp: hc.buffs.damageBp,
      selfBp: hc.buffs.selfBp,
      vulnBp: def.damageType === 'physical' ? e.physTakenBp : def.damageType === 'magic' ? e.magicTakenBp : 0,
      weakBp: aff.weakBp,
      armor: effectiveArmor(e) + aff.resist,
      pen: 0,
      crit: hc.crit || (hc.overCrit && e.dots.some((d) => d.kind === 'bleed')),
      critMultBp: def.critMultBp,
      trueDamage,
    },
    eco,
  );
  applyDamage(w, e, r.damageCenti, u.owner, u, trueDamage);
  // DESIGN-OFFEN: DoTs wirken auch, wenn ein Schild-Stack den Direktschaden absorbiert hat. Burn zählt als Fire (Schwäche gegen Fire).
  if (atk.dot) {
    let total = mulBp(r.dotBaseCenti, atk.dot.totalBp);
    if (atk.dot.kind === 'burn') total = mulBp(total, BP + (w.ctx.affinity(e.type, e.element).weakBp.fire ?? 0));
    applyDot(e, atk.dot.kind, total, atk.dot.ticks, u.owner, u.id, eco);
  }
  return r.dotBaseCenti;
}

/** Gegner in der Trefferfläche des Angriffs (aufsteigende ID). */
function areaOf(w: World, u: UnitState, def: UnitDef, atk: CompiledAttack, target: EnemyState, range: number): EnemyState[] {
  const { state } = w;
  if (atk.kind === 'single') return [target];
  const radius = w.ctx.data.economy.targeting.enemyRadiusMilli;
  const dir = direction(u.x, u.y, target.x, target.y);
  const out: EnemyState[] = [];
  for (const e of state.enemies) {
    if (e.hp <= 0 || (e.flying && !def.canHitAir)) continue;
    let inside: boolean;
    switch (atk.kind) {
      case 'circle':
        inside = dist2(target.x, target.y, e.x, e.y) <= (atk.radiusMilli + radius) ** 2;
        break;
      case 'line':
        inside = inLine(e, u.x, u.y, dir.nx, dir.ny, range, atk.widthMilli, radius);
        break;
      case 'cone':
        inside = inCone(e, u.x, u.y, dir.nx, dir.ny, range, atk.cos2Bp, radius);
        break;
      default: // full: alles in Reichweite der Unit
        inside = dist2(u.x, u.y, e.x, e.y) <= (range + radius) ** 2;
    }
    if (inside) out.push(e);
  }
  return out;
}

/** Alle Units: Timer herunterzählen und angreifen. */
export function runUnits(w: World): void {
  const { state, ctx } = w;
  const eco = ctx.data.economy;
  for (const u of state.units) {
    const def = ctx.units[u.defId];
    if (u.cd > 0) u.cd--;
    if (u.snatchTicks > 0 && --u.snatchTicks === 0) u.snatch = 0;
    if (u.motDmgTicks > 0 && --u.motDmgTicks === 0) u.motDmgBp = 0;
    if (u.motRangeTicks > 0 && --u.motRangeTicks === 0) u.motRangeBp = 0;
    const lv: LevelStat = def.levels[u.level];
    const atk = lv.attack;
    // DESIGN-OFFEN: kein Windup - der Treffer erfolgt im selben Tick wie die Zielwahl.
    if (!atk || u.cd > 0) continue;
    const buffs = computeBuffs(w, u, def);
    const range = mulBp(lv.rangeMilli, BP + buffs.rangeBp);
    const target = selectTarget(state.enemies, {
      ux: u.x,
      uy: u.y,
      rangeMilli: range,
      canHitAir: def.canHitAir,
      mode: u.targeting,
      enemyRadiusMilli: eco.targeting.enemyRadiusMilli,
      strongestShieldBp: eco.targeting.strongestShieldBp,
    });
    if (!target) {
      u.lust = 0; // Battlelust gilt nur, solange die Unit ein Ziel hat
      continue;
    }
    // DESIGN-OFFEN: ein Crit-Wurf je Angriff, gilt für alle Treffer und Gegner dieses Angriffs (nur Units mit Crit verbrauchen PRNG-Werte).
    const crit = def.critBp > 0 ? nextInt(state.rng, BP) < def.critBp : false;
    const hc: HitCtx = { buffs, crit, overCrit: fxOf(atk, 'overCrit') !== undefined };
    const area = areaOf(w, u, def, atk, target, range);
    if (fxOf(atk, 'shatter')) for (const e of area) e.shield = 0;
    // Schaden wird auf die Treffer geteilt (nicht vervielfacht). Treffer reihum über alle Gegner der Fläche; Tote fallen heraus.
    const per = Math.max(1, Math.floor(lv.damageCenti / atk.hits));
    const dotBase = new Map<number, number>();
    for (let h = 0; h < atk.hits; h++) {
      for (const e of area) if (e.hp > 0) dotBase.set(e.id, hitEnemy(w, u, def, atk, e, hc, per));
    }
    for (const fx of atk.fx) {
      for (const e of area) if (e.hp > 0) applyFx(w, u, e, fx, dotBase.get(e.id) ?? 0);
    }
    selfBuffs(w, u, def, atk, lv, range);
    u.cd = Math.max(1, Math.floor((lv.spaTicks * BP) / (BP + Math.min(buffs.tempoBp, eco.buffCaps.tempoBp))));
  }
}

/** Selbst-Buffs nach einem Angriff: Battlelust/Snatched-Stapel, Motivate auf Verbündete in Reichweite. */
function selfBuffs(w: World, u: UnitState, def: UnitDef, atk: CompiledAttack, lv: LevelStat, range: number): void {
  for (const fx of atk.fx) {
    if (fx.kind === 'battlelust') u.lust = Math.min(u.lust + 1, Math.ceil(fx.maxBp / fx.stepBp));
    else if (fx.kind === 'snatched') {
      u.snatch = Math.min(u.snatch + 1, Math.ceil(fx.maxBpMaxLevel / fx.stepBp));
      u.snatchTicks = fx.ticks;
    } else if (fx.kind === 'motivate') {
      // "Same effects do not stack": die Dauer wird erneuert, die Stärke ist die des stärksten Motivators.
      for (const o of w.state.units) {
        if (o.id === u.id || dist2(o.x, o.y, u.x, u.y) > range * range) continue;
        if (fx.dmgBp > 0) {
          o.motDmgBp = Math.max(o.motDmgTicks > 0 ? o.motDmgBp : 0, fx.dmgBp);
          o.motDmgTicks = fx.ticks;
        }
        if (fx.rangeBp > 0) {
          o.motRangeBp = Math.max(o.motRangeTicks > 0 ? o.motRangeBp : 0, fx.rangeBp);
          o.motRangeTicks = fx.ticks;
        }
      }
    }
  }
  void def;
  void lv;
}
