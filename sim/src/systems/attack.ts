/**
 * Angriffe: Abklingzeit, Zielwahl, Trefferfläche (single/circle/line/cone), Schaden, On-Hit-Effekte.
 * Units werden in aufsteigender ID abgearbeitet; getroffene Gegner in aufsteigender ID.
 * Geometrie rein ganzzahlig: Richtungsvektor auf Länge ~1024 normiert (Integer-Sqrt).
 */
import type { UnitDef } from '../data/compile.js';
import { computeHit, elementBp } from '../damage.js';
import { BP, dist2, isqrt, mulBp } from '../fixed.js';
import { nextInt } from '../prng.js';
import type { EnemyState, UnitState, World } from '../state.js';
import { applyDamage, applyDot, applySlow } from './effects.js';
import { effectiveArmor } from './boss.js';
import { selectTarget } from './target.js';

export interface Buffs {
  damageBp: number;
  tempoBp: number;
  rangeBp: number;
}

/**
 * Buff-Summe für eine Unit (§11): je Buff-ID (= Support-Unit-Typ) zählt nur der höchste Wert
 * (auch über Spieler hinweg); verschiedene Buff-IDs addieren sich. Caps greifen bei der Anwendung.
 */
export function computeBuffs(w: World, u: UnitState, ux: number, uy: number): Buffs {
  const { state, ctx } = w;
  // DESIGN-OFFEN: Buff-ID = Support-Unit-Typ; je ID zählt nur der höchste Wert im Radius (auch spielerübergreifend), verschiedene IDs addieren sich.
  const best: { id: string; bp: number }[] = [];
  for (const b of state.units) {
    const bd = ctx.units[b.defId];
    if (!bd.aura) continue;
    const bs = ctx.slots[b.slot];
    const r = bd.aura.radiusMilli;
    if (dist2(bs.x, bs.y, ux, uy) > r * r) continue;
    const bp = bd.aura.damageBpByLevel[b.level];
    const cur = best.find((x) => x.id === b.defId);
    if (!cur) best.push({ id: b.defId, bp });
    else if (bp > cur.bp) cur.bp = bp;
  }
  let damageBp = 0;
  for (const x of best) damageBp += x.bp;
  return { damageBp, tempoBp: 0, rangeBp: 0 };
}

/** cos^2(Halbwinkel) in bp für unterstützte Kegelwinkel. */
export function coneCos2Bp(coneDeg: number): number {
  switch (coneDeg) {
    case 30:
      return 9330;
    case 45:
      return 8536;
    case 60:
      return 7500;
    case 90:
      return 5000;
    default:
      throw new Error(`Kegelwinkel ${coneDeg} nicht unterstützt (30/45/60/90)`);
  }
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
}

/** Ein Treffer einer Unit auf einen Gegner (Schaden + On-Hit-Effekte). */
export function hitEnemy(w: World, u: UnitState, def: UnitDef, e: EnemyState, hc: HitCtx, baseCenti: number, trueDamage: boolean): number {
  const eco = w.ctx.data.economy;
  if (e.flying && def.airDamageBp !== undefined) baseCenti = mulBp(baseCenti, def.airDamageBp);
  const r = computeHit(
    {
      baseCenti,
      lvlBp: u.lvlBp,
      traitBp: u.traitBp,
      buffBp: hc.buffs.damageBp,
      vulnBp: 0,
      elementBp: elementBp(def.element, e.element, eco),
      armor: effectiveArmor(e),
      pen: def.penetration,
      crit: hc.crit,
      critMultBp: def.crit?.multBp ?? eco.damage.critDefaultMultBp,
      trueDamage,
    },
    eco,
  );
  const dealt = applyDamage(w, e, r.damageCenti, u.owner, u, trueDamage);
  // DESIGN-OFFEN: On-Hit-Effekte (Bleed/Burn/Slow) wirken auch, wenn ein Schild-Stack den Direktschaden absorbiert hat.
  for (const fx of def.onHit) {
    if (fx.kind === 'slow') applySlow(e, fx.pctBp, fx.ticks, eco);
    else applyDot(e, fx.kind, mulBp(r.dotBaseCenti, fx.totalBp), fx.ticks, u.owner, u.id, eco);
  }
  return dealt;
}

/** Alle Units: Abklingzeiten herunterzählen und angreifen. */
export function runUnits(w: World): void {
  const { state, ctx } = w;
  const eco = ctx.data.economy;
  for (const u of state.units) {
    const def = ctx.units[u.defId];
    if (u.abilityCd > 0) u.abilityCd--;
    if (u.cd > 0) u.cd--;
    // DESIGN-OFFEN: kein Windup - der Treffer erfolgt im selben Tick wie die Zielwahl (§9 Regel 2 braucht damit keine Verfall-Sonderfälle).
    if (!def.attack || u.cd > 0) continue;
    const slot = ctx.slots[u.slot];
    const lv = def.levels[u.level];
    const buffs = computeBuffs(w, u, slot.x, slot.y);
    const range = mulBp(lv.rangeMilli, BP + Math.min(buffs.rangeBp, eco.buffCaps.rangeBp));
    const target = selectTarget(state.enemies, {
      ux: slot.x,
      uy: slot.y,
      rangeMilli: range,
      canHitAir: def.canHitAir,
      mode: u.targeting,
      enemyRadiusMilli: eco.targeting.enemyRadiusMilli,
      strongestShieldBp: eco.targeting.strongestShieldBp,
    });
    if (!target) continue;
    // DESIGN-OFFEN: ein Crit-Wurf je Angriff, gilt für alle Treffer dieses Angriffs (Flächenangriffe).
    // Ein Crit-Wurf je Angriff (nur Units mit Crit verbrauchen PRNG-Werte).
    const crit = def.crit ? nextInt(state.rng, BP) < def.crit.chanceBp : false;
    const hc: HitCtx = { buffs, crit };
    const radius = eco.targeting.enemyRadiusMilli;
    const a = def.attack;
    if (a.kind === 'single') {
      hitEnemy(w, u, def, target, hc, lv.damageCenti, false);
    } else {
      const tx = target.x;
      const ty = target.y;
      const dir = direction(slot.x, slot.y, tx, ty);
      const cos2 = a.kind === 'cone' ? coneCos2Bp(a.coneDeg ?? 60) : 0;
      const hits: EnemyState[] = [];
      for (const e of state.enemies) {
        if (e.hp <= 0 || (e.flying && !def.canHitAir)) continue;
        let inside: boolean;
        if (a.kind === 'circle') inside = dist2(tx, ty, e.x, e.y) <= (a.radiusMilli as number) ** 2;
        else if (a.kind === 'line') inside = inLine(e, slot.x, slot.y, dir.nx, dir.ny, range, a.widthMilli as number, radius);
        else inside = inCone(e, slot.x, slot.y, dir.nx, dir.ny, range, cos2, radius);
        if (inside) hits.push(e);
      }
      for (const e of hits) hitEnemy(w, u, def, e, hc, lv.damageCenti, false);
    }
    u.cd = Math.max(1, Math.floor((lv.spaTicks * BP) / (BP + Math.min(buffs.tempoBp, eco.buffCaps.tempoBp))));
  }
}
