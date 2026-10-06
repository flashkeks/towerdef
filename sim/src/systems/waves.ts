/**
 * Wave-Steuerung: Prep-Phase, Wave-Start (Spawn-Warteschlange), Timer 45 s, Skip (Mehrheit),
 * Wave-Ende (Auszahlung), Sieg/Niederlage.
 *
 * Eine Wave endet, wenn ihr Timer abläuft, per Skip, oder wenn nichts mehr lebt/aussteht.
 * Beim Ende von Wave n < N startet im selben Tick Wave n+1 (Waves dürfen überlappen).
 */
import { parseModifier, type Ctx } from '../data/compile.js';
import { mulBp } from '../fixed.js';
import type { World } from '../state.js';
import { payWaveEnd } from './economy.js';
import { getWave } from './infinite.js';

export function startWave(w: World, n: number): void {
  const { state, ctx } = w;
  const wave = getWave(ctx, n);
  for (const g of wave.groups) {
    for (let i = 0; i < g.count; i++) {
      state.spawnQueue.push({
        atTick: state.tick + g.delayTicks + i * g.intervalTicks,
        type: g.type,
        wave: n,
        modifiers: g.modifiers,
        element: g.element,
      });
    }
  }
  // Stabile Sortierung (Array.prototype.sort ist stabil): gleiche Zeit -> Einfügereihenfolge.
  state.spawnQueue.sort((a, b) => a.atTick - b.atTick);
  state.wave = n;
  state.phase = 'wave';
  state.waveOpen = true;
  state.waveTimer = 0;
  state.skipPending = false;
  for (const p of state.players) p.skipVote = false;
  w.events.push({ type: 'waveStart', tick: state.tick, wave: n });
}

function endWave(w: World): void {
  const { state } = w;
  payWaveEnd(w, state.wave);
  state.waveOpen = false;
  w.events.push({ type: 'waveEnd', tick: state.tick, wave: state.wave });
}

export function updateWaves(w: World): void {
  const { state, ctx } = w;
  // DESIGN-OFFEN: Prep-Phase dauert prepTicks (45 s) oder bis skipWave (Mehrheit); danach startet Wave 1 automatisch.
  if (state.phase === 'prep') {
    state.prepTicksLeft--;
    if (state.skipPending || state.prepTicksLeft <= 0) startWave(w, 1);
    return;
  }
  if (state.phase !== 'wave' || !state.waveOpen) return;
  state.waveTimer++;
  // DESIGN-OFFEN: Wave endet bei Timer (45 s ab Start), Skip oder wenn nichts mehr lebt/aussteht; das Ende zahlt Wave-Bonus + Farm und startet im selben Tick die nächste Wave.
  const cleared = state.spawnQueue.length === 0 && state.enemies.length === 0;
  if (state.waveTimer >= ctx.waveTimerTicks || cleared || state.skipPending) {
    endWave(w);
    if (state.wave >= ctx.maxWaves) {
      // DESIGN-OFFEN: Infinite-Abbruch nach maxWaves: Phase 'over', result bleibt null, kein 'over'-Event.
      state.phase = 'over';
      return;
    }
    if (state.wave < ctx.totalWaves) startWave(w, state.wave + 1);
  }
}

/** Sieg nach der letzten Wave, wenn nichts mehr lebt oder aussteht. */
export function checkVictory(w: World): void {
  const { state, ctx } = w;
  if (state.phase !== 'wave' || state.wave < ctx.totalWaves) return;
  if (state.spawnQueue.length > 0 || state.enemies.length > 0) return;
  // DESIGN-OFFEN: Sieg erst, wenn nach Wave 20 alle Gegner tot/geleakt sind; endet Wave 20 per Timer, wird ihr Bonus schon dort gezahlt.
  if (state.waveOpen) endWave(w);
  finish(w, 'win');
}

export function finish(w: World, result: 'win' | 'loss'): void {
  const { state } = w;
  state.phase = 'over';
  state.result = result;
  state.waveOpen = false;
  w.events.push({ type: 'over', tick: state.tick, result });
}

/** HP-Summe (Centi) einer Wave laut Stage-Daten, inkl. Splitter-Kinder (Pool-Spalte aus §5). */
export function wavePool(ctx: Ctx, n: number): number {
  let pool = 0;
  for (const g of getWave(ctx, n).groups) {
    const def = ctx.enemies[g.type];
    for (const m of g.modifiers) parseModifier(m); // validiert
    let hp = mulBp(ctx.hpGrunt(n), def.fHpBp);
    hp = mulBp(mulBp(hp, ctx.coopHpBp), ctx.difficulty.hpBp);
    pool += hp * g.count;
    if (def.child) {
      const c = ctx.enemies[def.child.type];
      let ch = mulBp(ctx.hpGrunt(n), c.fHpBp);
      ch = mulBp(mulBp(ch, ctx.coopHpBp), ctx.difficulty.hpBp);
      pool += ch * def.child.count * g.count;
    }
  }
  return pool;
}
