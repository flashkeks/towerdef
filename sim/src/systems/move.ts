/**
 * Bewegung entlang des Pfads in Mikro-Milli-Tiles (Ganzzahl-Akkumulator) und Leaks.
 * Betäubte Gegner bewegen sich nicht; Slow reduziert die Tick-Geschwindigkeit (floor).
 */
import { BP, dist2, mulBp } from '../fixed.js';
import { positionAt } from '../path.js';
import type { World } from '../state.js';
import { cardLeakCost } from './cards.js';
import { guardLeft } from './economy.js';

/**
 * Lebenskosten eines Leaks: ceil(Basis * RestHP / MaxHP), mindestens 1 (nur Ganzzahlen; Schild zählt nicht).
 * Ein fast toter Gegner kostet wenig, ein gesunder die volle Basis.
 */
export function leakCost(base: number, hp: number, maxHp: number): number {
  return Math.max(1, Math.floor((base * hp + maxHp - 1) / maxHp));
}

export function moveEnemies(w: World): void {
  const { state, ctx } = w;
  const len = ctx.path.length;
  let leaked = false;
  // Tempo-Auren (Runde 7 / P6): einmal je Tick die Träger sammeln.
  const auras = state.units.filter((u) => ctx.units[u.defId].slowAura);
  const cc = ctx.data.economy.cc;
  // DESIGN-OFFEN: Flyer folgen derselben Polylinie wie Bodengegner (kein separater Luftpfad); alle spawnen bei Fortschritt 0.
  for (const e of state.enemies) {
    if (e.hp <= 0 || e.stunTicks > 0) continue;
    let speed = e.speedMicro;
    let slow = e.slowTicks > 0 ? e.slowBp : 0;
    for (const a of auras) {
      const sa = ctx.units[a.defId].slowAura as NonNullable<(typeof ctx.units)[string]['slowAura']>;
      if (dist2(a.x, a.y, e.x, e.y) > sa.radiusMilli * sa.radiusMilli) continue;
      const bp = Math.min(e.boss ? mulBp(sa.slowBpByLevel[a.level], cc.bossCcBp) : sa.slowBpByLevel[a.level], cc.slowMaxBp);
      if (bp > slow) slow = bp;
    }
    if (slow > 0) speed = mulBp(speed, BP - slow);
    if (e.bossRun && e.bossRun.hasteTicks > 0) speed = mulBp(speed, e.bossRun.hasteBp);
    const total = e.frac + speed;
    e.progress += Math.floor(total / 1000);
    e.frac = total % 1000;
    if (e.progress >= len) {
      leaked = true;
      continue;
    }
    const p = positionAt(ctx.path, e.progress);
    e.x = p.x;
    e.y = p.y;
  }
  if (!leaked) return;
  // Leaks in aufsteigender Entity-ID abwickeln; kein Bounty, keine Splitter-Kinder.
  const keep = [];
  for (const e of state.enemies) {
    if (e.hp > 0 && e.progress >= len) {
      const fatal = ctx.instantLoss.has(e.type);
      const guarded = !fatal && guardLeft(w) > 0;
      if (guarded) state.guardUsed++;
      const cost = guarded ? 0 : fatal ? Math.max(state.lives, 0) : cardLeakCost(ctx, leakCost(e.leak, e.hp, e.maxHp), e.card);
      state.stats.leaks++;
      state.stats.leakDamage += cost;
      if (!state.godMode) state.lives = fatal ? 0 : Math.max(0, state.lives - cost);
      w.events.push({ type: 'leak', tick: state.tick, enemyId: e.id, enemy: e.type, wave: e.wave, damage: cost, hp: e.hp, maxHp: e.maxHp, fatal, ...(guarded ? { guarded: true as const } : {}) });
    } else keep.push(e);
  }
  state.enemies = keep;
}
