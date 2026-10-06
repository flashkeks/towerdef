/**
 * Zielwahl (recommendations §9). Reine Funktion über ein Gegner-Array in aufsteigender ID.
 * First/Last: Pfadfortschritt; Close: kleinster Abstand (Gleichstand First);
 * Strongest: größte MAX-HP * (1 + 0,25 * Schild-Stacks) (Gleichstand First).
 */
import { BP, dist2 } from '../fixed.js';
import type { EnemyState, TargetMode } from '../state.js';

export interface TargetQuery {
  ux: number;
  uy: number;
  /** Reichweite in Milli-Tiles (ohne Gegnerradius). */
  rangeMilli: number;
  canHitAir: boolean;
  mode: TargetMode;
  enemyRadiusMilli: number;
  strongestShieldBp: number;
}

/** Fortschritt in Mikro-Milli-Tiles als einzelne Ganzzahl. */
export function progressKey(e: EnemyState): number {
  return e.progress * 1000 + e.frac;
}

export function isEligible(e: EnemyState, q: TargetQuery): boolean {
  if (e.hp <= 0) return false;
  if (e.flying && !q.canHitAir) return false;
  const r = q.rangeMilli + q.enemyRadiusMilli;
  return dist2(q.ux, q.uy, e.x, e.y) <= r * r;
}

export function selectTarget(enemies: readonly EnemyState[], q: TargetQuery): EnemyState | null {
  let best: EnemyState | null = null;
  let bestKey = 0;
  let bestProg = 0;
  for (const e of enemies) {
    if (!isEligible(e, q)) continue;
    const prog = progressKey(e);
    let key: number;
    switch (q.mode) {
      case 'first':
        key = prog;
        break;
      case 'last':
        key = -prog;
        break;
      case 'close':
        key = -dist2(q.ux, q.uy, e.x, e.y);
        break;
      case 'strongest':
        key = e.maxHp * (BP + q.strongestShieldBp * e.shield);
        break;
    }
    // Strikt größer gewinnt; Gleichstand: weiter vorn (First), dann kleinere ID (Iterationsreihenfolge).
    if (best === null || key > bestKey || (key === bestKey && q.mode !== 'first' && q.mode !== 'last' && prog > bestProg)) {
      best = e;
      bestKey = key;
      bestProg = prog;
    }
  }
  return best;
}
