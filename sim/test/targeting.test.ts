import { describe, expect, it } from 'vitest';
import { selectTarget, type TargetQuery } from '../src/systems/target.js';
import type { EnemyState, TargetMode } from '../src/state.js';
import { at as slotAt, ctxFor, createSim, data, enemy, mutable, slotsOf } from './helpers.js';

const ctx = ctxFor();
const q = (mode: TargetMode, over: Partial<TargetQuery> = {}): TargetQuery => ({
  ux: 0, uy: 0, rangeMilli: 3000, canHitAir: false, mode,
  enemyRadiusMilli: data.economy.targeting.enemyRadiusMilli,
  strongestShieldBp: data.economy.targeting.strongestShieldBp, ...over,
});
function at(id: number, type: string, progress: number, x: number, y: number, over: Partial<EnemyState> = {}): EnemyState {
  return enemy(ctx, type, 1, { progress, x, y, ...over }, id);
}

describe('Targeting (§9)', () => {
  const near = at(1, 'grunt', 1000, 500, 0); // nah, hinten
  const mid = at(2, 'grunt', 5000, 1500, 0);
  const far = at(3, 'grunt', 9000, 2500, 0); // am weitesten vorn, am weitesten weg
  const enemies = [near, mid, far];
  it('First = größter Fortschritt, Last = kleinster, Close = kleinster Abstand', () => {
    expect(selectTarget(enemies, q('first'))?.id).toBe(3);
    expect(selectTarget(enemies, q('last'))?.id).toBe(1);
    expect(selectTarget(enemies, q('close'))?.id).toBe(1);
  });
  it('Close: Gleichstand -> First', () => {
    const a = at(1, 'grunt', 1000, 1000, 0);
    const b = at(2, 'grunt', 4000, 0, 1000);
    expect(selectTarget([a, b], q('close'))?.id).toBe(2);
  });
  it('Strongest nach MAX-HP (nicht aktueller HP), Schild zählt +25 % je Stack, Gleichstand -> First', () => {
    const grunt = at(1, 'grunt', 9000, 100, 0);
    const brute = at(2, 'brute', 1000, 200, 0);
    brute.hp = 10; // schwer verletzt, bleibt aber Strongest (maxHP)
    expect(selectTarget([grunt, brute], q('strongest'))?.id).toBe(2);
    const g2 = at(3, 'grunt', 2000, 300, 0, { shield: 0 });
    const g3 = at(4, 'grunt', 7000, 400, 0, { shield: 0 });
    expect(selectTarget([g2, g3], q('strongest'))?.id).toBe(4);
    g2.shield = 2; // 1,5 x
    expect(selectTarget([g2, g3], q('strongest'))?.id).toBe(3);
  });
  it('Reichweite + Gegnerradius 0,3 Tiles; Tote und Flyer (ohne Luft-Fähigkeit) ausgeschlossen', () => {
    expect(selectTarget([at(1, 'grunt', 0, 3300, 0)], q('first'))?.id).toBe(1);
    expect(selectTarget([at(1, 'grunt', 0, 3301, 0)], q('first'))).toBeNull();
    const dead = at(1, 'grunt', 9000, 100, 0, { hp: 0 });
    expect(selectTarget([dead, mid], q('first'))?.id).toBe(2);
    const fly = at(5, 'flyer', 9999, 100, 0);
    expect(selectTarget([fly], q('first'))).toBeNull();
    expect(selectTarget([fly, mid], q('first'))?.id).toBe(2);
    expect(selectTarget([fly, mid], q('first', { canHitAir: true }))?.id).toBe(5);
  });
});

describe('Flyer im Sim: nur Hill/Hybrid treffen', () => {
  function setup() {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: (() => { const d = structuredClone(data); d.economy.startCoins = 100000; return d; })() });
    const st = mutable(sim);
    // Hill-Slot und Ground-Slot unmittelbar neben demselben Pfadpunkt
    const hill = slotsOf(sim, 'hill')[0];
    const ground = slotsOf(sim, 'ground')[0];
    return { sim, st, hill, ground };
  }
  it('Ichigo (ground) ignoriert Flyer, Krillin (hill) und Rikka (hybrid) treffen ihn', () => {
    for (const [unit, kind, expectHit] of [['ichigo', 'ground', false], ['krillin', 'hill', true], ['rikka_evo', 'hill', true]] as const) {
      const { sim, st } = setup();
      const slot = slotsOf(sim, kind)[0];
      const s = sim.slotCenters()[slot];
      expect(sim.apply(0, { type: 'place', unitId: unit, ...slotAt(sim, slot) }).ok).toBe(true);
      const f = enemy(ctxFor(), 'flyer', 1, { x: s.x + 500, y: s.y }, 500);
      st.enemies.push(f);
      sim.step();
      expect(f.hp < f.maxHp).toBe(expectHit);
    }
  });
});
