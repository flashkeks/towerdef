import { describe, expect, it } from 'vitest';
import { loadBrowserData, STAGE_ID } from '../src/sim';
import { buildMapOps, hillRects, HILL, pathCells, zoneChar } from '../src/game/map-compose';
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
  it('keine Slot-Platten mehr in der Karte (Runde 6)', () => {
    expect(ops.filter((o) => o.frame.startsWith('tiles/slot_'))).toEqual([]);
  });
  it('Huegel sind Flaechen: eine Kuppe je h-Kachel, Wand nur an der Suedkante eines Huegel-Streifens', () => {
    const rects = hillRects(stage);
    const hills = stage.zones.rows.flatMap((row, y) => [...row].map((c, x) => (c === 'h' ? { x, y } : null)).filter(Boolean)) as { x: number; y: number }[];
    expect(hills.length).toBeGreaterThan(20);
    for (const h of hills) expect(rects.some((r) => r.color === HILL.top && r.x === h.x * 32 && r.y === h.y * 32), `${h.x},${h.y}`).toBe(true);
    expect(rects.filter((r) => r.color === HILL.wall)).toHaveLength(hills.filter((h) => zoneChar(stage, h.x, h.y + 1) !== 'h').length);
    for (const r of rects) expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= 17 * 32 && r.y + r.h <= 11 * 32).toBe(true);
  });
  it('Pfadzellen sind die Strecken zwischen den Wegpunkten (Zahl der Zellen)', () => {
    expect(pathCells(stage.path).size).toBeGreaterThan(30);
    expect(pathCells([[0, 0], [2, 0]]).size).toBe(3);
  });
  it('Baeume und Felsen stehen nur auf blockierten Kacheln; nie Deko auf Pfad oder Huegel', () => {
    for (const o of ops.filter((p) => p.frame.startsWith('tiles/deco_'))) {
      const z = zoneChar(stage, o.x / 32, o.y / 32);
      if (/tree|rock|bush/.test(o.frame)) expect(z).toBe('#');
      expect(z === 'p' || z === 'h').toBe(false);
    }
    expect(ops.some((o) => o.frame === 'tiles/deco_tree')).toBe(true);
  });
});

describe('Atlas', () => {
  it('hat alle Gegner-Archetypen mit zwei Geh-Frames (Units ohne Sprite zeigen die Fallback-Figur)', () => {
    for (const e of ['grunt', 'runner', 'brute', 'flyer', 'splitter', 'splitter_child', 'elite', 'boss']) for (const f of [0, 1]) expect(atlas.frames).toHaveProperty([`enemies/${e}_${f}`]);
    expect(atlas.meta.scaleMode).toBe('nearest');
  });
});
