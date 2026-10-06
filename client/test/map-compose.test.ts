import { describe, expect, it } from 'vitest';
import { loadBrowserData, STAGE_ID } from '../src/sim';
import { buildMapOps, pathCells } from '../src/game/map-compose';
import atlas from '../assets/atlas/atlas.json';

const stage = loadBrowserData().stages[STAGE_ID];

describe('Karte aus Atlas-Kacheln', () => {
  const ops = buildMapOps(stage);
  it('nutzt nur Bilder, die im Atlas stehen', () => {
    for (const op of ops) expect(atlas.frames, op.frame).toHaveProperty([op.frame]);
  });
  it('deckt die ganze Welt mit Gras/Pfad ab (17 x 11)', () => {
    expect(ops.filter((o) => /tiles\/(grass|path)_/.test(o.frame))).toHaveLength(17 * 11);
  });
  it('setzt je Slot genau einen Untergrund passend zu Art und Groesse', () => {
    for (const s of stage.slots) {
      const want = s.size === 2 ? 'tiles/slot_big' : s.kind === 'hill' ? 'tiles/slot_hill' : 'tiles/slot_ground';
      const hit = ops.filter((o) => o.frame.startsWith('tiles/slot_') && o.x === Math.round((s.x + 0.5 - s.size / 2) * 32) && o.y === Math.round((s.y + 0.5 - s.size / 2) * 32));
      expect(hit.map((h) => h.frame)).toEqual([want]);
    }
    expect(new Set(ops.filter((o) => o.frame.startsWith('tiles/slot_')).map((o) => o.frame)).size).toBe(3);
  });
  it('Pfadzellen sind die Strecken zwischen den Wegpunkten (Zahl der Zellen)', () => {
    expect(pathCells(stage.path).size).toBeGreaterThan(30);
    expect(pathCells([[0, 0], [2, 0]]).size).toBe(3);
  });
  it('Deko steht nie auf oder neben einem Slot', () => {
    const slotCells = new Set<string>();
    for (const s of stage.slots) {
      const left = s.x + 0.5 - s.size / 2;
      const top = s.y + 0.5 - s.size / 2;
      for (let x = Math.floor(left); x < Math.ceil(left + s.size); x++) for (let y = Math.floor(top); y < Math.ceil(top + s.size); y++) slotCells.add(`${x},${y}`);
    }
    for (const o of ops.filter((p) => p.frame.startsWith('tiles/deco_'))) expect(slotCells.has(`${o.x / 32},${o.y / 32}`)).toBe(false);
  });
});

describe('Atlas', () => {
  it('hat alle Units und Gegner-Archetypen mit zwei Geh-Frames', () => {
    for (const u of ['striker', 'gunner', 'blaster', 'banner', 'farm', 'lancer', 'frost', 'titan']) expect(atlas.frames).toHaveProperty([`units/${u}`]);
    for (const e of ['grunt', 'runner', 'brute', 'flyer', 'splitter', 'splitter_child', 'elite', 'boss']) for (const f of [0, 1]) expect(atlas.frames).toHaveProperty([`enemies/${e}_${f}`]);
    expect(atlas.meta.scaleMode).toBe('nearest');
  });
});
