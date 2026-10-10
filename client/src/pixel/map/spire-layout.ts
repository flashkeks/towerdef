/**
 * Duskspire Keep (Runde 16 / K2, Karte 10, Expert): Lage der Dinge. EINE Quelle fuer Zeichnung UND Sim-Daten
 * (`sim/data/maps/spire.json` schreibt `scripts/gen-maps.ts`). Drei Tore im Westen (oben, Mitte, unten), je eine Bruecke ueber den
 * Lavagraben; im Innenhof laufen sie bei (350,180) zusammen und gehen gemeinsam zum Bergfried (Lavagraben, Zugbruecke). ~850 px je Ast.
 */
import { closedSpline, pathLength, simplify, type Pt } from './kit';
import type { Rect } from './k2kit';

export const SP_HW = 13;
export const SP_BUILD: [number, number, number, number] = [8, 8, 624, 344];

const TAIL: Pt[] = [[350, 180], [430, 180], [430, 110], [510, 110], [510, 180], [564, 180]];
export const SP_BRANCHES: Pt[][] = [
  [[-16, 50], [350, 50], ...TAIL],
  [[-16, 310], [350, 310], ...TAIL],
  [[-16, 180], [100, 180], [100, 245], [200, 245], [200, 180], ...TAIL],
];

// ---------- Lava: Graben vor dem Innenhof (Nord-Sued), U-foermiger Graben um den Bergfried ----------
const MOAT_W: Pt[] = [[256, -12], [284, -12], [290, 20], [286, 60], [292, 100], [286, 140], [291, 180], [286, 220], [292, 260], [287, 300], [290, 340], [286, 372], [256, 372], [262, 340], [257, 300], [263, 260], [258, 220], [262, 180], [257, 140], [263, 100], [258, 60], [262, 20]];
const MOAT_K: Pt[] = [[534, 80], [660, 80], [660, 104], [556, 104], [556, 256], [660, 256], [660, 280], [534, 280]];
export const SP_LAVA: Pt[][] = [MOAT_W, MOAT_K];
/** Bruecken (Optik) auf dem Weg: Strecken. */
export const SP_BRIDGES: [Pt, Pt][] = [[[246, 50], [302, 50]], [[246, 180], [302, 180]], [[246, 310], [302, 310]], [[524, 180], [566, 180]]];

// ---------- Wasser: die Zisterne im Innenhof ----------
const CISTERN_CTRL: Pt[] = [[418, 252], [430, 240], [452, 236], [474, 240], [486, 252], [482, 268], [462, 276], [440, 276], [422, 268]];
export const CISTERN: Pt[] = closedSpline(CISTERN_CTRL, 4);
export const spWater = (): Pt[][] => [simplify(CISTERN, 3)];

/** Mauern (Zinnen, unbebaubar): Rechtecke x0, y0, x1, y1 */
export const SP_WALLS: Rect[] = [
  [8, 108, 236, 118], [8, 270, 236, 280],
];
export const SP_LEN = SP_BRANCHES.map(pathLength);
