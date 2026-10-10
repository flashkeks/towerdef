/**
 * Duskspire Keep (Runde 16 / K2, Karte 10, Expert): Lage der Dinge. EINE Quelle fuer Zeichnung UND Sim-Daten
 * (`sim/data/maps/spire.json` schreibt `scripts/gen-maps.ts`). Drei Tore im Westen (oben, Mitte, unten), je eine Bruecke ueber den
 * Lavagraben; im Innenhof laufen sie bei (350,180) zusammen und gehen gemeinsam zum Bergfried (zweiter Lavagraben, Zugbruecke). ~850 px je Ast.
 */
import { closedSpline, pathDistAll, pathLength, simplify, type Pt } from './kit';
import { polyField, rectBlockers, rectPoly, type Rect } from './k2kit';
import type { SpireKind } from './props-spire';

export const SP_HW = 13;
export const SP_BUILD: [number, number, number, number] = [8, 8, 624, 344];

const TAIL: Pt[] = [[350, 180], [430, 180], [430, 128], [510, 128], [510, 210], [570, 210]];
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
export const SP_BRIDGES: [Pt, Pt][] = [[[246, 50], [302, 50]], [[246, 180], [302, 180]], [[246, 310], [302, 310]], [[524, 210], [568, 210]]];

// ---------- Wasser: die Zisterne im Innenhof ----------
const CISTERN_CTRL: Pt[] = [[418, 252], [430, 240], [452, 236], [474, 240], [486, 252], [482, 268], [462, 276], [440, 276], [422, 268]];
export const CISTERN: Pt[] = closedSpline(CISTERN_CTRL, 4);
export const spWater = (): Pt[][] => [simplify(CISTERN, 3)];

/** Abstandsfelder (px, < 0 innen): Lava und Zisterne. */
export const lavaField = polyField(SP_LAVA);
export const cisternField = polyField([CISTERN]);
export const lavaAt = (x: number, y: number): number => lavaField.at(x, y);
export const cisternAt = (x: number, y: number): number => cisternField.at(x, y);

/** Mauern (Zinnen, unbebaubar): Rechtecke x0, y0, x1, y1. Aussenwerk links, Innenhof-Mauern oben und unten. */
export const SP_WALLS: Rect[] = [
  [8, 8, 240, 22], [8, 338, 240, 352], // Aussenwerk
  [8, 108, 236, 118], [8, 270, 216, 280], // Zwischenmauern der Aussenwerke
  [304, 8, 632, 22], [304, 338, 632, 352], // Innenhof: Nord- und Suedmauer
  [8, 196, 76, 206], // Mauerrest links der C-Schleife
];

// ---------- Dinge ----------
export interface SpireProp { kind: SpireKind; x: number; y: number; v: number; r: number }
export const SP_R: Record<SpireKind, number> = {
  brazier: 3, banner: 2, statue: 6, catapult: 12, tent: 12, stakes: 7, crate: 4, barrel: 3, rack: 7, rock: 4, deadtree: 3, bones: 0, rubble: 5,
  cisternarch: 8, gatetower: 0, roundtower: 0, hall: 0, keep: 0,
};
/** Grundflaeche der Bauten [Breite, Tiefe] in px (von der Fussmitte nach oben); der Blocker deckt genau das ab. */
export const SP_FOOT: Partial<Record<SpireKind, (v: number) => [number, number]>> = {
  gatetower: () => [24, 18], roundtower: () => [26, 24], hall: (v) => [[116, 76, 60][v] ?? 76, [38, 26, 24][v] ?? 26], keep: () => [62, 64],
};
const P = (kind: SpireKind, x: number, y: number, v = 0): SpireProp => ({ kind, x, y, v, r: SP_R[kind] });

const HAND: SpireProp[] = [
  // Torbauten an den drei Bruecken (innen x=322, aussen x=236)
  P('gatetower', 322, 28), P('gatetower', 322, 148), P('gatetower', 322, 292),
  P('gatetower', 236, 28), P('gatetower', 236, 148), P('gatetower', 236, 290),
  P('brazier', 270, 36), P('brazier', 270, 160), P('brazier', 270, 292),
  // Innenhof: Kaserne, Waffenkammer, Stall, Zisterne
  P('hall', 448, 80, 0), P('hall', 440, 330, 1), P('roundtower', 372, 98), P('roundtower', 372, 270), P('roundtower', 536, 330),
  P('cisternarch', 452, 254), P('crate', 390, 240), P('barrel', 398, 236), P('crate', 500, 236), P('barrel', 508, 244), P('rack', 392, 214), P('banner', 468, 228),
  P('statue', 436, 104), P('brazier', 520, 150), P('brazier', 420, 214),
  P('banner', 366, 40), P('banner', 540, 40), P('banner', 536, 300), P('brazier', 510, 60), P('brazier', 388, 130), P('crate', 520, 316), P('barrel', 392, 306), P('stakes', 500, 286),
  // Bergfried auf der Insel im Lavagraben
  P('keep', 606, 226), P('statue', 584, 136), P('statue', 628, 136), P('brazier', 606, 128), P('brazier', 586, 248), P('brazier', 626, 248),
  // Aussenwerke: Belagerungsgeraet, Zelte, Palisaden, Truemmer
  P('catapult', 60, 90), P('tent', 140, 88, 0), P('stakes', 200, 80), P('crate', 30, 78), P('barrel', 38, 84), P('rack', 100, 84), P('banner', 28, 100),
  P('catapult', 100, 148), P('tent', 190, 146, 1), P('stakes', 40, 150), P('rubble', 150, 130), P('barrel', 70, 128), P('brazier', 214, 128),
  P('tent', 50, 232, 0), P('rack', 30, 214), P('stakes', 40, 290), P('deadtree', 140, 232, 0), P('rubble', 120, 296), P('brazier', 74, 290), P('crate', 60, 302),
  P('tent', 224, 250, 1), P('stakes', 220, 300), P('barrel', 210, 330), P('rock', 150, 326), P('rock', 100, 332), P('bones', 170, 266), P('rock', 20, 338, 1),
  P('bones', 130, 108), P('rock', 16, 44), P('deadtree', 206, 22, 0), P('rubble', 120, 28), P('stakes', 160, 28),
];
export const SP_PROPS: SpireProp[] = [...HAND].sort((a, b) => a.y - b.y);

/** Fussflaeche eines Baus als Rechteck, sonst null. */
export function footRect(p: SpireProp): Rect | null {
  const f = SP_FOOT[p.kind];
  if (!f) return null;
  const [w, d] = f(p.v);
  return [Math.round(p.x - w / 2), p.y - d, Math.round(p.x + w / 2), p.y];
}

/** Blocker fuer die Sim: Mauern, Bauten (Rechtecke -> Kreise), kleine Dinge (Kreise). Lava und Zisterne sind eigene Polygone. */
export function spBlockers(): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const w of SP_WALLS) out.push(...rectBlockers(w));
  for (const p of SP_PROPS) {
    const fr = footRect(p);
    if (fr) out.push(...rectBlockers(fr));
    else if (p.r > 0) out.push([p.x, p.y - 2, p.r]);
  }
  const [bx, by, bw, bh] = SP_BUILD;
  return out.filter(([x, y, r]) => x - r < bx + bw && x + r > bx && y - r < by + bh && y + r > by && lavaAt(x, y) > -4);
}
/** Mauern als Polygone fuer `walls` in der Karten-JSON (Torbauten und Haeuser stehen nur als Blocker in der Datei). */
export const spWallPolys = (): Pt[][] => SP_WALLS.map(rectPoly);
void pathDistAll;
export const SP_LEN = SP_BRANCHES.map(pathLength);
