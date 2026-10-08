/**
 * Bewegung entlang des Pfads in Mikro-Milli-Tiles (Ganzzahl-Akkumulator) und Leaks.
 * Betäubte Gegner bewegen sich nicht; Slow reduziert die Tick-Geschwindigkeit (floor).
 */
import { BP, mulBp } from '../fixed.js';
import { positionAt } from '../path.js';
import type { World } from '../state.js';
import { cardLeakCost } from './cards.js';
import { blockerOf, holdEnemy } from './summon.js';

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
  // DESIGN-OFFEN: Flyer folgen derselben Polylinie wie Bodengegner (kein separater Luftpfad); alle spawnen bei Fortschritt 0.
  for (const e of state.enemies) {
    if (e.hp <= 0 || e.stunTicks > 0 || e.uncTicks > 0) continue;
    let speed = e.speedMicro;
    if (e.slowTicks > 0 && e.slowBp > 0) speed = mulBp(speed, BP - e.slowBp);
    if (e.bossRun && e.bossRun.hasteTicks > 0) speed = mulBp(speed, e.bossRun.hasteBp);
    if (e.backTicks > 0) {
      // Rückwärtslaufen (Confused, Mind Control): mit der aktuellen Geschwindigkeit zurück, nie vor den Pfadanfang.
      const back = e.progress * 1000 + e.frac - speed;
      const k = Math.max(0, back);
      e.progress = Math.floor(k / 1000);
      e.frac = k % 1000;
      const q = positionAt(ctx.path, e.progress);
      e.x = q.x;
      e.y = q.y;
      continue;
    }
    // Beschwörungen (Runde 9 / P1) halten Bodengegner auf; der Gegner bleibt stehen, die Beschwörung zehrt an ihrer Haltbarkeit.
    const blocker = blockerOf(w, e);
    if (blocker) {
      holdEnemy(blocker, e);
      continue;
    }
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
      const cost = fatal ? Math.max(state.lives, 0) : cardLeakCost(ctx, leakCost(e.leak, e.hp, e.maxHp), e.card);
      state.stats.leaks++;
      state.stats.leakDamage += cost;
      if (!state.godMode) state.lives = fatal ? 0 : Math.max(0, state.lives - cost);
      w.events.push({ type: 'leak', tick: state.tick, enemyId: e.id, enemy: e.type, wave: e.wave, damage: cost, hp: e.hp, maxHp: e.maxHp, fatal });
    } else keep.push(e);
  }
  state.enemies = keep;
}
