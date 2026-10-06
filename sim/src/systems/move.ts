/**
 * Bewegung entlang des Pfads in Mikro-Milli-Tiles (Ganzzahl-Akkumulator) und Leaks.
 * Betäubte Gegner bewegen sich nicht; Slow reduziert die Tick-Geschwindigkeit (floor).
 */
import { BP, mulBp } from '../fixed.js';
import { positionAt } from '../path.js';
import type { World } from '../state.js';

export function moveEnemies(w: World): void {
  const { state, ctx } = w;
  const len = ctx.path.length;
  let leaked = false;
  // DESIGN-OFFEN: Flyer folgen derselben Polylinie wie Bodengegner (kein separater Luftpfad); alle spawnen bei Fortschritt 0.
  for (const e of state.enemies) {
    if (e.hp <= 0 || e.stunTicks > 0) continue;
    let speed = e.speedMicro;
    if (e.slowTicks > 0) speed = mulBp(speed, BP - e.slowBp);
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
      state.stats.leaks++;
      state.stats.leakDamage += e.leak;
      if (!state.godMode) state.baseHp -= e.leak;
      w.events.push({ type: 'leak', tick: state.tick, enemyId: e.id, enemy: e.type, wave: e.wave, damage: e.leak });
    } else keep.push(e);
  }
  state.enemies = keep;
}
