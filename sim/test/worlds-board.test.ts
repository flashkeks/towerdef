import { describe, expect, it } from 'vitest';
import { loadWorlds } from '../src/data/load.js';
import type { GameData } from '../src/data/schema.js';
import { createSim } from '../src/index.js';
import { data } from './helpers.js';

/**
 * Runde 10 / P4: Kartenthema (`theme.board`) ist reine Darstellung. Jede Welt hat eines, es sind keine zwei gleich,
 * und die Sim liest es nicht: ohne den Block (und mit anderen Farben) ergibt dieselbe Runde denselben Hash.
 */
const { worlds } = loadWorlds();

describe('Kartenthema je Welt (Runde 10 / P4)', () => {
  it('alle Welten haben ein Kartenthema mit Boden, Pfad, Hindernissen und Licht', () => {
    expect(worlds.length).toBeGreaterThanOrEqual(10);
    for (const w of worlds) {
      const b = w.theme.board;
      expect(b, w.id).toBeDefined();
      expect(b!.deco.length, `${w.id} deco`).toBeGreaterThan(0);
      expect(b!.scatter.length, `${w.id} scatter`).toBeGreaterThan(0);
      expect(b!.light.vignette, `${w.id} vignette`).toBeGreaterThan(0);
    }
  });

  it('keine zwei Welten sehen gleich aus (Bodenfarbe, Wegfarbe und Hindernis-Mix verschieden)', () => {
    const ground = new Set(worlds.map((w) => w.theme.board!.ground.base));
    const path = new Set(worlds.map((w) => w.theme.board!.path.base));
    const mix = new Set(worlds.map((w) => w.theme.board!.deco.map((d) => d.kind).sort().join('+')));
    expect(ground.size).toBe(worlds.length);
    expect(path.size).toBe(worlds.length);
    expect(mix.size).toBe(worlds.length);
  });

  it('die Sim liest das Thema nicht: gleiche Runde mit und ohne `board` gibt denselben Hash', () => {
    for (const w of worlds) {
      const id = `${w.id}-1`;
      const plain: GameData = { ...data, stages: { ...data.stages, [id]: { ...data.stages[id], theme: { ...data.stages[id].theme!, board: undefined, background: '#000000' } } } };
      const a = createSim({ stage: id, difficulty: 'normal', players: 1, seed: 7, data });
      const b = createSim({ stage: id, difficulty: 'normal', players: 1, seed: 7, data: plain });
      a.runWave();
      b.runWave();
      expect(a.hash(), w.id).toBe(b.hash());
    }
  });
});
