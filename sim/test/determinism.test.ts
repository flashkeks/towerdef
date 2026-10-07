import { describe, expect, it } from 'vitest';
import type { Sim } from '../src/index.js';
import { at, createSim } from './helpers.js';
import { placementIds } from './placement-helpers.js';

/** Einfacher skriptgesteuerter Spieler: baut Striker/Gunner/Blaster/Banner und upgradet reihum. */
function script(sim: Sim, wave: number): void {
  // Freie Altbestand-Position der Art: erste, an der `place` jetzt erlaubt wäre.
  const buy = (unit: string, kind: 'ground' | 'hill') => {
    for (const id of placementIds(sim, kind)) {
      const p = at(sim, id);
      if (sim.canPlace(0, unit, p.x, p.y) === null) {
        sim.apply(0, { type: 'place', unitId: unit, ...p });
        return;
      }
    }
  };
  if (wave === 0) {
    buy('striker', 'ground');
    buy('gunner', 'hill');
  }
  if (wave === 2) buy('blaster', 'ground');
  if (wave === 4) buy('banner', 'ground');
  if (wave === 7) buy('striker', 'ground');
  for (const u of sim.state.units) {
    for (let i = 0; i < 3; i++) if (sim.upgradeCost(u.id) !== null) sim.apply(0, { type: 'upgrade', entityId: u.id });
  }
}

function play(seed: number): { hash: string; waves: string[]; result: string | null; tick: number } {
  const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed });
  const waves: string[] = [];
  let w = 0;
  while (!sim.isOver()) {
    script(sim, w);
    sim.runWave();
    waves.push(sim.hash());
    w++;
    if (w > 40) throw new Error('läuft zu lange');
  }
  return { hash: sim.hash(), waves, result: sim.result(), tick: sim.state.tick };
}

describe('Determinismus', () => {
  it('gleicher Seed + gleiche Befehle -> bit-gleicher Hash (über 20 Waves, auch je Wave)', () => {
    const a = play(1234);
    const b = play(1234);
    expect(a.hash).toBe(b.hash);
    expect(a.waves).toEqual(b.waves);
    expect(a.tick).toBe(b.tick);
    expect(a.waves.length).toBeGreaterThanOrEqual(2);
  });
  it('anderer Seed mit Crit-Unit -> anderer Hash', () => {
    const a = play(1234);
    const b = play(4321);
    expect(a.hash).not.toBe(b.hash);
  });
  it('step(n) ist gleich n-mal step(1)', () => {
    const mk = () => createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 5 });
    const a = mk();
    const b = mk();
    for (const s of [a, b]) {
      s.apply(0, { type: 'place', unitId: 'gunner', ...at(s, 4) });
    }
    a.step(900);
    for (let i = 0; i < 900; i++) b.step();
    expect(a.hash()).toBe(b.hash());
  });
  it('Befehle ändern den Hash', () => {
    const a = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 5 });
    const h0 = a.hash();
    a.apply(0, { type: 'place', unitId: 'striker', ...at(a, 0) });
    expect(a.hash()).not.toBe(h0);
  });
});
