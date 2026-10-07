/**
 * Spezialeffekte eines Angriffs auf einen getroffenen Gegner (Effekt-Katalog `effects.json`, combat-system § 7).
 * Die Wirkung ist datengetrieben (`FxSpec` aus `compile.ts`). Selbst-Buffs der Unit (Battlelust, Snatched, Sunshine,
 * Motivate, OverCrit) wirken in `attack.ts`; hier stehen nur die Effekte, die den Gegner ändern.
 */
import type { FxSpec } from '../data/compile.js';
import { BP, mulBp } from '../fixed.js';
import { positionAt } from '../path.js';
import { nextInt } from '../prng.js';
import type { EnemyState, UnitState, World } from '../state.js';
import { applyCc, applyCurse, applyDot, applySlow } from './effects.js';

/**
 * Wendet einen Effekt auf `e` an. `dotBaseCenti` = Treffer-Schaden vor Schwäche/Rüstung (Grundlage für DoT-Effekte, z. B. Wild Card).
 * PRNG-Würfe (Wild Card, Mind Control) laufen über die Sim-PRNG in fester Reihenfolge (Gegner in aufsteigender ID).
 */
export function applyFx(w: World, u: UnitState, e: EnemyState, fx: FxSpec, dotBaseCenti: number): void {
  const eco = w.ctx.data.economy;
  switch (fx.kind) {
    case 'slow':
      applySlow(e, fx.bp, fx.ticks, fx.immune, eco);
      return;
    case 'stun':
    case 'freeze':
    case 'timestop':
      applyCc(e, 'stun', fx.ticks, fx.immune, eco);
      return;
    case 'unconscious':
      e.uncTicks = Math.max(e.uncTicks, e.boss ? mulBp(fx.ticks, eco.cc.bossCcBp) : fx.ticks);
      return;
    case 'walkback':
      if (fx.chanceBp < BP && nextInt(w.state.rng, BP) >= fx.chanceBp) return;
      applyCc(e, 'back', fx.ticks, fx.immune, eco);
      return;
    case 'knockback': {
      if (e.kbImmune > 0) return;
      const dist = e.boss ? mulBp(fx.distMilli, eco.cc.bossCcBp) : fx.distMilli;
      e.progress = Math.max(0, e.progress - dist);
      e.frac = 0;
      const p = positionAt(w.ctx.path, e.progress);
      e.x = p.x;
      e.y = p.y;
      e.kbImmune = fx.immune;
      return;
    }
    case 'curse':
      applyCurse(e, fx.dtype, fx.bp, fx.ticks);
      return;
    case 'bleedAmp':
      if (e.bleedAmpTicks > 0 && e.bleedAmpBp > fx.factorBp) return;
      e.bleedAmpBp = fx.factorBp;
      e.bleedAmpTicks = Math.max(e.bleedAmpTicks, fx.ticks);
      return;
    case 'wither':
      e.regenBlock = Math.max(e.regenBlock, fx.ticks);
      return;
    case 'dot':
      applyDot(e, fx.dot.kind, mulBp(dotBaseCenti, fx.dot.totalBp), fx.dot.ticks, u.owner, u.id, eco);
      return;
    case 'wildcard':
      applyFx(w, u, e, fx.pool[nextInt(w.state.rng, fx.pool.length)], dotBaseCenti);
      return;
    case 'shatter':
      e.shield = 0;
      return;
    // Selbst-Buffs der Unit: siehe attack.ts.
    case 'overCrit':
    case 'battlelust':
    case 'snatched':
    case 'sunshine':
    case 'motivate':
      return;
  }
}
