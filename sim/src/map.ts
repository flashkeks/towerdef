/** Karte zur Laufzeit: Datei (px) -> Milli-px, Weg als Path, Wasser, Blocker, Baufläche. */
import { DATA, type MapFile } from './data.js';
import { buildPath, nearestOnPath, pathClearance, type Path } from './path.js';

export interface MapRt {
  id: string;
  name: string;
  /** Hauptweg (Ast 0). */
  path: Path;
  /** Runde 15: alle Aeste (bei einem Weg nur `[path]`). Alle Aeste einer Karte sind gleich lang und enden im selben Punkt. */
  paths: Path[];
  /** Halbe Wegbreite, Milli-px. */
  halfWidth: number;
  water: [number, number][][];
  /** Runde 15: Lava, nicht bebaubar. */
  lava: [number, number][][];
  blockers: { x: number; y: number; r: number }[];
  build: { x0: number; y0: number; x1: number; y1: number };
  size: [number, number];
}

const cache = new Map<string, MapRt>();

export function loadMap(file: MapFile): MapRt {
  const k = 1000;
  const conv = (pts: readonly (readonly [number, number])[]): [number, number][] => pts.map(([x, y]) => [Math.round(x * k), Math.round(y * k)] as [number, number]);
  const paths = (file.paths ?? [file.path]).map((p) => buildPath(conv(p)));
  return {
    id: file.id,
    name: file.name,
    path: paths[0],
    paths,
    halfWidth: Math.round(file.pathHalfWidth * k),
    water: file.water.map(conv),
    lava: (file.lava ?? []).map(conv),
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

/**
 * Liegt der ganze Kreis (Mittelpunkt, Radius `r`, Milli-px) im Polygon? Mittelpunkt, vier Achsen- und vier Diagonalpunkte des Kreises
 * muessen innen liegen, und kein Polygon-Eckpunkt darf im Kreis liegen (sonst schneidet eine Ecke ins Kreisinnere). Ganzzahlig.
 * Runde 16: Platzierung der Wassertuerme.
 */
export function circleInPolygon(x: number, y: number, r: number, poly: readonly [number, number][]): boolean {
  const d = Math.round((r * 7071) / 10000);
  const pts: [number, number][] = [[x, y], [x + r, y], [x - r, y], [x, y + r], [x, y - r], [x + d, y + d], [x - d, y + d], [x + d, y - d], [x - d, y - d]];
  for (const [px, py] of pts) if (!pointInPolygon(px, py, poly)) return false;
  const r2 = r * r;
  for (const [vx, vy] of poly) if ((vx - x) * (vx - x) + (vy - y) * (vy - y) < r2) return false;
  return true;
}

/**
 * Auf welchem Ast liegt der Punkt (x, y)? -1 = auf dem gemeinsamen Wegteil (alle Aeste in Wegbreite), sonst der naechste Ast.
 * Bei einem Weg immer 0. Ganzzahlig ueber `nearestOnPath`.
 */
export function branchAt(map: MapRt, x: number, y: number): number {
  if (map.paths.length === 1) return 0;
  const hw2 = map.halfWidth * map.halfWidth;
  let best = 0;
  let bestD = Infinity;
  let all = true;
  map.paths.forEach((p, i) => {
    const d = nearestOnPath(p, x, y).d2;
    if (d > hw2) all = false;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return all ? -1 : best;
}

/** Naechster Punkt auf irgendeinem Ast: Ast, Fortschritt und quadrierter Abstand (bei Gleichstand der kleinere Ast). */
export function nearestOnPaths(map: MapRt, x: number, y: number): { branch: number; progress: number; d2: number } {
  let out = { branch: 0, ...nearestOnPath(map.paths[0], x, y) };
  for (let i = 1; i < map.paths.length; i++) {
    const n = nearestOnPath(map.paths[i], x, y);
    if (n.d2 < out.d2) out = { branch: i, ...n };
  }
  return out;
}

/** Wie `pathClearance`, aber fuer alle Aeste. */
export function clearOfPaths(map: MapRt, x: number, y: number, r: number): boolean {
  for (const p of map.paths) if (!pathClearance(p, x, y, r)) return false;
  return true;
}
