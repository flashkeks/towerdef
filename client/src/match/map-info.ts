/** Wegdaten der gewaehlten Karte fuer Anzeige und Zielvorschau (Runde 15 C): alle Aeste, Wegbreite, Ausgang. */
import { DATA } from '../sim';
import type { Pt } from '../powers/info';

export interface MapGeometry {
  /** alle Wegaeste (Frostfen 2, sonst 1) */
  paths: Pt[][];
  halfWidth: number;
  /** Ausgang (Stadttor / Schlot): Punkt, an dem Lecks und Tor-Effekte sitzen, in den Kartenrand geklemmt */
  exit: { x: number; y: number };
}

export function mapGeometry(map: string): MapGeometry {
  const m = DATA.maps[map] ?? DATA.maps.meadow;
  const paths = ((m.paths && m.paths.length ? m.paths : [m.path]) as Pt[][]).map((p) => p.map((q) => [q[0], q[1]] as Pt));
  const last = paths[0][paths[0].length - 1];
  return { paths, halfWidth: m.pathHalfWidth, exit: { x: Math.max(14, Math.min(628, last[0])), y: Math.max(14, Math.min(346, last[1])) } };
}
