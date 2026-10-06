/**
 * Karte als Liste von Atlas-Bildern (rein, ohne Pixi/Canvas, getestet): Gras, Pfad mit Kantenmaske, Deko, Slot-Untergruende, Spawn, Basis.
 * Koordinaten in Quellpixeln (32 je Kachel). `map-layer.ts` setzt die Liste auf eine Zeichenflaeche und skaliert sie auf die Fenstergroesse.
 */
import type { StageData } from '../sim';
import { WORLD_H, WORLD_W } from './context';

export const ART = 32;

export interface MapOp {
  /** Bildname im Atlas, z. B. `tiles/path_0101`. */
  frame: string;
  x: number;
  y: number;
}

/** Zellen des Pfads (Kachelkoordinaten), jede Zelle einmal. */
export function pathCells(path: ReadonlyArray<readonly [number, number]>): Set<string> {
  const cells = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    const [x0, y0] = path[i];
    const [x1, y1] = path[Math.min(i + 1, path.length - 1)];
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    let x = x0;
    let y = y0;
    cells.add(`${x},${y}`);
    while (x !== x1 || y !== y1) {
      x += dx;
      y += dy;
      cells.add(`${x},${y}`);
    }
  }
  return cells;
}

/** Kachel-Hash (deterministisch, nur fuer Streuung von Variante und Deko). */
const hash = (x: number, y: number): number => {
  let h = Math.imul(x + 7, 374761393) ^ Math.imul(y + 13, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};

export function buildMapOps(stage: StageData): MapOp[] {
  const ops: MapOp[] = [];
  const cells = pathCells(stage.path);
  const isPath = (x: number, y: number): boolean => cells.has(`${x},${y}`);
  // Belegte Zellen der Slots (grosse Slots liegen auf halben Koordinaten)
  const blocked = new Set<string>();
  for (const s of stage.slots) {
    const left = s.x + 0.5 - s.size / 2;
    const top = s.y + 0.5 - s.size / 2;
    for (let x = Math.floor(left); x < Math.ceil(left + s.size); x++) for (let y = Math.floor(top); y < Math.ceil(top + s.size); y++) blocked.add(`${x},${y}`);
  }
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const h = hash(x, y);
      if (isPath(x, y)) {
        const mask = (isPath(x, y - 1) ? 1 : 0) | (isPath(x + 1, y) ? 2 : 0) | (isPath(x, y + 1) ? 4 : 0) | (isPath(x - 1, y) ? 8 : 0);
        ops.push({ frame: `tiles/path_${mask.toString(2).padStart(4, '0')}`, x: x * ART, y: y * ART });
        continue;
      }
      ops.push({ frame: `tiles/grass_${h % 4}`, x: x * ART, y: y * ART });
    }
  }
  // Deko nur auf freien Wiesenzellen; Baeume am Rand, Buesche/Steine/Blumen verstreut. Nie auf oder direkt neben Slots (Platzier-Lesbarkeit).
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      if (isPath(x, y)) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (blocked.has(`${x + dx},${y + dy}`)) near = true;
      if (near) continue;
      const h = hash(x * 3 + 1, y * 5 + 2);
      const edge = x === 0 || y === 0 || x === WORLD_W - 1 || y === WORLD_H - 1;
      let frame: string | null = null;
      if (edge && h % 3 === 0) frame = 'tiles/deco_tree';
      else if (h % 9 === 0) frame = 'tiles/deco_bush';
      else if (h % 11 === 1) frame = 'tiles/deco_rock';
      else if (h % 5 === 2) frame = 'tiles/deco_flowers';
      if (frame) ops.push({ frame, x: x * ART, y: y * ART });
    }
  }
  const [sx, sy] = stage.path[0];
  const [bx, by] = stage.path[stage.path.length - 1];
  ops.push({ frame: 'tiles/spawn', x: sx * ART, y: sy * ART });
  ops.push({ frame: 'tiles/base', x: bx * ART, y: by * ART });
  for (const s of stage.slots) {
    const frame = s.size === 2 ? 'tiles/slot_big' : s.kind === 'hill' ? 'tiles/slot_hill' : 'tiles/slot_ground';
    ops.push({ frame, x: Math.round((s.x + 0.5 - s.size / 2) * ART), y: Math.round((s.y + 0.5 - s.size / 2) * ART) });
  }
  return ops;
}
