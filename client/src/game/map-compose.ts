/**
 * Karte als Liste von Atlas-Bildern (rein, ohne Pixi/Canvas, getestet): Gras, Pfad mit Kantenmaske, Deko, Spawn, Basis; dazu die Huegel-Flaechen
 * als Rechtecke (Runde 6: keine Slot-Platten mehr, Zonen aus `stage.zones`).
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

/** Zonenzeichen der Kachel (x, y) aus `stage.zones.rows`: `.` Boden, `h` Huegel, `#` blockiert, `p` Pfad; ausserhalb `.`. */
export const zoneChar = (stage: StageData, x: number, y: number): string => stage.zones.rows[y]?.[x] ?? '.';

export interface MapRect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** CSS-Farbe */
  color: string;
}

/** Farben der Huegel (Runde 6): helle Kuppe, Felswand an der Suedkante, Lichtkante oben. */
export const HILL = { top: '#6f9a4c', topLight: '#8cb35e', wall: '#8a5a3a', wallDark: '#5a3a2a' } as const;

/**
 * Huegel als Flaeche: jede `h`-Kachel bekommt eine helle Kuppe, eine Felswand unten, wenn darunter kein Huegel liegt,
 * und eine Lichtkante oben, wenn darueber keiner liegt. Zusammenhaengende Huegel-Kacheln wirken als eine Terrasse.
 */
export function hillRects(stage: StageData): MapRect[] {
  const out: MapRect[] = [];
  const isHill = (x: number, y: number): boolean => zoneChar(stage, x, y) === 'h';
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      if (!isHill(x, y)) continue;
      const px = x * ART;
      const py = y * ART;
      const wall = isHill(x, y + 1) ? 0 : 8;
      out.push({ x: px, y: py, w: ART, h: ART - wall, color: HILL.top });
      if (!isHill(x, y - 1)) out.push({ x: px, y: py, w: ART, h: 2, color: HILL.topLight });
      if (wall > 0) {
        out.push({ x: px, y: py + ART - wall, w: ART, h: wall, color: HILL.wall });
        out.push({ x: px, y: py + ART - 2, w: ART, h: 2, color: HILL.wallDark });
      }
      if (!isHill(x - 1, y)) out.push({ x: px, y: py, w: 2, h: ART - wall, color: HILL.topLight });
      if (!isHill(x + 1, y)) out.push({ x: px + ART - 2, y: py, w: 2, h: ART - wall, color: HILL.wallDark });
    }
  }
  return out;
}

export function buildMapOps(stage: StageData): MapOp[] {
  const ops: MapOp[] = [];
  const cells = pathCells(stage.path);
  const isPath = (x: number, y: number): boolean => cells.has(`${x},${y}`);
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
  // Deko: Baeume und Felsen nur auf blockierten Kacheln (`#`: dort wird wirklich nicht gebaut), Blumen sparsam auf Boden
  // (flach, ohne Hindernis-Optik). Auf Huegeln und am Pfad keine Deko, damit Platz und Hindernis auf einen Blick lesbar sind.
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      if (isPath(x, y)) continue;
      const z = zoneChar(stage, x, y);
      const h = hash(x * 3 + 1, y * 5 + 2);
      let frame: string | null = null;
      if (z === '#') frame = h % 3 === 0 ? 'tiles/deco_rock' : 'tiles/deco_tree';
      else if (z === '.' && h % 6 === 2) frame = 'tiles/deco_flowers';
      if (frame) ops.push({ frame, x: x * ART, y: y * ART });
    }
  }
  const [sx, sy] = stage.path[0];
  const [bx, by] = stage.path[stage.path.length - 1];
  ops.push({ frame: 'tiles/spawn', x: sx * ART, y: sy * ART });
  ops.push({ frame: 'tiles/base', x: bx * ART, y: by * ART });
  return ops;
}
