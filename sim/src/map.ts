/** Karte zur Laufzeit: Datei (px) -> Milli-px, Weg als Path, Wasser, Blocker, Baufläche. */
import { DATA, type MapFile } from './data.js';
import { buildPath, type Path } from './path.js';

export interface MapRt {
  id: string;
  name: string;
  path: Path;
  /** Halbe Wegbreite, Milli-px. */
  halfWidth: number;
  water: [number, number][][];
  blockers: { x: number; y: number; r: number }[];
  build: { x0: number; y0: number; x1: number; y1: number };
  size: [number, number];
}

const cache = new Map<string, MapRt>();

export function loadMap(file: MapFile): MapRt {
  const k = 1000;
  return {
    id: file.id,
    name: file.name,
    path: buildPath(file.path.map(([x, y]) => [Math.round(x * k), Math.round(y * k)] as [number, number])),
    halfWidth: Math.round(file.pathHalfWidth * k),
    water: file.water.map((poly) => poly.map(([x, y]) => [Math.round(x * k), Math.round(y * k)] as [number, number])),
    blockers: file.blockers.map(([x, y, r]) => ({ x: Math.round(x * k), y: Math.round(y * k), r: Math.round(r * k) })),
    build: {
      x0: Math.round(file.buildArea[0] * k),
      y0: Math.round(file.buildArea[1] * k),
      x1: Math.round((file.buildArea[0] + file.buildArea[2]) * k),
      y1: Math.round((file.buildArea[1] + file.buildArea[3]) * k),
    },
    size: file.size,
  };
}

export function getMap(id: string): MapRt {
  let m = cache.get(id);
  if (!m) {
    const f = DATA.maps[id];
    if (!f) throw new Error(`Unbekannte Karte: ${id}`);
    m = loadMap(f);
    cache.set(id, m);
  }
  return m;
}

export function pointInPolygon(x: number, y: number, poly: readonly [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
