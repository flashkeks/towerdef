/**
 * Fähigkeiten (per Befehl `useAbility`): Nuke (True Damage auf den stärksten Gegner,
 * ignoriert Reichweite und Targeting-Modus) und Stun-Flächeneffekt.
 */
import { dist2, mulBp } from '../fixed.js';
import type { UnitState, World } from '../state.js';
import { computeBuffs, hitEnemy } from './attack.js';
import { applyStun } from './effects.js';
import { selectTarget } from './target.js';

/** Löst die Fähigkeit aus; gibt false zurück, wenn keine vorhanden oder nicht bereit. */
export function triggerAbility(w: World, u: UnitState): boolean {
  const { state, ctx } = w;
  const def = ctx.units[u.defId];
  const ab = def.ability;
  if (!ab || u.abilityCd > 0) return false;
  const eco = ctx.data.economy;
  if (ab.kind === 'nuke') {
    // DESIGN-OFFEN: "stärkster Gegner" = größte Max-HP (wie Strongest), global, Flyer nur wenn die Unit Luft trifft.
    const target = selectTarget(state.enemies, {
      ux: u.x,
      uy: u.y,
      rangeMilli: 1_000_000,
      canHitAir: def.canHitAir,
      mode: 'strongest',
      enemyRadiusMilli: 0,
      strongestShieldBp: eco.targeting.strongestShieldBp,
    });
    if (!target) return false;
    const buffs = computeBuffs(w, u, u.x, u.y);
    const base = mulBp(def.levels[u.level].damageCenti, ab.damageMulBp);
    hitEnemy(w, u, def, target, { buffs, crit: false }, base, true);
  } else {
    const r2 = ab.radiusMilli * ab.radiusMilli;
    let any = false;
    for (const e of state.enemies) {
      if (e.hp <= 0 || (e.flying && !def.canHitAir)) continue;
      if (dist2(u.x, u.y, e.x, e.y) > r2) continue;
      if (applyStun(e, ab.stunTicks, eco)) any = true;
    }
    if (!any) return false; // DESIGN-OFFEN: ohne wirksames Ziel wird keine Abklingzeit verbraucht
  }
  u.abilityCd = ab.cooldownTicks;
  w.events.push({ type: 'ability', tick: state.tick, player: u.owner, unitId: u.id, kind: ab.kind });
  return true;
}
