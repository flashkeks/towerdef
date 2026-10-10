/**
 * Gloomharbor (Runde 16 / K2, Karte 9, Expert): Lage der Dinge. EINE Quelle fuer Zeichnung UND Sim-Daten
 * (`sim/data/maps/harbor.json` schreibt `scripts/gen-maps.ts`). Zwei Eingaenge (Westtor, Nordstrasse) laufen am Kai zusammen,
 * ~950 px je Ast. Das Hafenbecken im Sueden ist Wasser; Haeuser, Stadtmauer, Stege und Schiffe sind unbebaubar, Land ist knapp.
 */
import { closedSpline, pathDistAll, pathLength, simplify, type Pt } from './kit';
import { fitLength, polyField, rectBlockers, rectPoly, scatterProps, type Rect } from './k2kit';
import type { HarborKind } from './props-harbor';

export const HB_HW = 13;
export const HB_BUILD: [number, number, number, number] = [8, 8, 624, 344];
export const HB_TARGET = 950;

// Schweif ab der Kai-Ecke (470,188): am Ostufer entlang zum Ausgang (Lagerhaus-Tor) unten rechts.
const TAIL: Pt[] = [[470, 188], [520, 188], [520, 318], [656, 318]];

export const HB_BRANCHES: Pt[][] = [
  // A: Westtor, durch die Fischgasse und dann die Kaistrasse entlang (Start y so gewaehlt, dass der Ast genau HB_TARGET lang ist)
  fitLength((v) => [[-16, v], [100, v], [100, 188], ...TAIL], HB_TARGET, 10, 80),
  // B: Nordstrasse, schlaengelt sich durch das Nordostviertel
  fitLength((v) => [[580, -16], [580, 50], [400, 50], [400, 100], [v, 100], [v, 150], [470, 150], [470, 188], ...TAIL.slice(1)], HB_TARGET, 480, 600),
];

// ---------- Wasser: das Hafenbecken ----------
const SEA_CTRL: Pt[] = [
  [-14, 262], [18, 246], [52, 232], [96, 222], [150, 218], [210, 223], [270, 216], [330, 221], [392, 217], [440, 222], [474, 236], [490, 262],
  [494, 300], [488, 336], [494, 376], [-14, 376],
];
export const SEA: Pt[] = closedSpline(SEA_CTRL, 5);
export const hbWater = (): Pt[][] => [simplify(SEA, 3)];
export const HB_LEN = HB_BRANCHES.map(pathLength);

/** Abstandsfeld des Hafenbeckens (px, < 0 im Wasser). */
export const seaField = polyField([SEA]);
export const seaAt = (x: number, y: number): number => seaField.at(x, y);

// ---------- Mauern, Stege ----------
/** Stadtmauer und Torbauten (Mauern, unbebaubar): Rechtecke x0, y0, x1, y1. Luecken: Westtor y 27-53, Nordtor x 567-593, Osttor y 305-331. */
export const HB_WALLS: Rect[] = [
  [8, 8, 540, 20], [620, 8, 632, 20], // Nordmauer, Luecke fuer das Nordtor
  [8, 66, 20, 214], // Westmauer unter dem Westtor
  [620, 62, 632, 292], // Ostmauer ueber dem Osttor
];
/** Stege ins Becken (Holz, auf dem Wasser): Rechtecke. Unbebaubar, auch fuer Wassertuerme. */
export const HB_PIERS: Rect[] = [[132, 206, 146, 262], [264, 206, 278, 284], [376, 206, 390, 258]];

// ---------- Dinge ----------
export interface HarborProp { kind: HarborKind; x: number; y: number; v: number; r: number }
/** Kreisradius der kleinen Dinge (0 = nur Zierde). */
export const HB_R: Record<HarborKind, number> = {
  lamp: 2, crate: 4, barrel: 3, net: 6, bollard: 0, anchor: 0, coil: 0, crane: 10, fountain: 9, banner: 2, sign: 2, cart: 7, rowboat: 7,
  gatetower: 0, house: 0, cottage: 0, tavern: 0, warehouse: 0, customs: 0, lighthouse: 0, ship: 0,
};
/** Grundflaeche der Gebaeude und Schiffe [Breite, Tiefe] in px, von der Fussmitte nach oben (Schiffe: auf dem Wasser). Der Blocker deckt genau das ab. */
export const HB_FOOT: Partial<Record<HarborKind, (v: number) => [number, number]>> = {
  house: () => [28, 24], cottage: () => [30, 22], tavern: () => [38, 28],
  warehouse: (v) => [[134, 72, 54][v] ?? 72, 20], customs: () => [56, 28], lighthouse: () => [20, 18], gatetower: () => [24, 18],
  ship: (v) => [[82, 58, 44][v] ?? 58, [20, 16, 14][v] ?? 16],
};
const P = (kind: HarborKind, x: number, y: number, v = 0): HarborProp => ({ kind, x, y, v, r: HB_R[kind] });

const HAND: HarborProp[] = [
  // Tore
  P('gatetower', 20, 24), P('gatetower', 20, 74), P('gatetower', 552, 22), P('gatetower', 608, 22), P('gatetower', 622, 298), P('gatetower', 622, 353),
  // Westviertel: Fischer und Wirtshaus
  P('cottage', 54, 100, 0), P('house', 54, 138, 1), P('tavern', 52, 182, 0), P('cottage', 48, 222, 2), P('net', 78, 208), P('barrel', 26, 118), P('crate', 28, 200),
  P('lamp', 82, 66), P('lamp', 84, 160),
  // Altstadt: obere Reihe, Platz, Kaihaeuser
  P('house', 150, 52, 0), P('house', 186, 52, 2), P('house', 224, 52, 1), P('tavern', 268, 54, 1), P('house', 314, 52, 3), P('house', 354, 52, 0),
  P('cottage', 160, 104, 2), P('house', 160, 150, 3), P('cottage', 354, 104, 1), P('house', 354, 150, 2), P('house', 204, 104, 1), P('cottage', 316, 104, 3), P('house', 204, 152, 0), P('cottage', 312, 152, 2),
  P('fountain', 264, 106), P('lamp', 232, 84), P('lamp', 296, 84), P('lamp', 232, 138), P('lamp', 296, 138), P('cart', 244, 124), P('barrel', 296, 96), P('crate', 200, 110),
  P('lamp', 116, 170), P('lamp', 200, 166), P('lamp', 380, 166), P('banner', 380, 76),
  // Nordost: Lagerhaeuser entlang der Nordstrasse
  P('warehouse', 480, 86, 0), P('warehouse', 508, 134, 1), P('lamp', 420, 66), P('barrel', 430, 126), P('crate', 440, 118), P('crate', 448, 132), P('lamp', 450, 160),
  P('house', 612, 100, 3), P('house', 612, 150, 0), P('lamp', 600, 120), P('cottage', 608, 200, 1),
  // Ostkai: Zollhaus, Leuchtturm, Kran
  P('customs', 584, 214), P('lighthouse', 596, 288), P('crane', 560, 262), P('crate', 548, 238), P('crate', 556, 244), P('barrel', 572, 250), P('lamp', 550, 200), P('lamp', 548, 282),
  P('lamp', 500, 214), P('crane', 476, 214), P('bollard', 464, 206), P('bollard', 492, 206),
  // Kai: Poller, Laternen, Kisten, Netze
  P('lamp', 140, 207), P('lamp', 270, 207), P('lamp', 382, 207), P('lamp', 206, 211), P('lamp', 332, 211), P('lamp', 440, 211), P('bollard', 112, 207), P('bollard', 160, 208), P('bollard', 214, 208), P('bollard', 300, 208), P('bollard', 342, 208), P('bollard', 430, 208),
  P('crate', 176, 210), P('barrel', 186, 210), P('net', 226, 210), P('coil', 316, 210), P('anchor', 410, 210), P('crate', 350, 211), P('barrel', 360, 211),
  // Schiffe, vertaeut an den Stegen
  P('ship', 216, 268, 0), P('ship', 322, 262, 1), P('ship', 98, 262, 2), P('ship', 426, 258, 2), P('rowboat', 150, 252), P('rowboat', 392, 262), P('rowboat', 262, 296),
  // Suedrand
  P('lamp', 530, 338), P('crate', 560, 338), P('barrel', 572, 340), P('crate', 590, 340), P('net', 610, 340),
];
export const HB_PROPS: HarborProp[] = [...HAND].sort((a, b) => a.y - b.y);
void scatterProps; void pathDistAll;

/** Fussflaeche eines Dings als Rechteck (nur Gebaeude/Schiffe), sonst null. */
export function footRect(p: HarborProp): Rect | null {
  const f = HB_FOOT[p.kind];
  if (!f) return null;
  const [w, d] = f(p.v);
  return [Math.round(p.x - w / 2), p.y - d, Math.round(p.x + w / 2), p.y];
}

/** Blocker fuer die Sim: Mauern, Stege, Gebaeude/Schiffe (Rechtecke -> Kreise) und kleine Dinge (Kreise). */
export function hbBlockers(): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const w of [...HB_WALLS, ...HB_PIERS]) out.push(...rectBlockers(w));
  for (const p of HB_PROPS) {
    const fr = footRect(p);
    if (fr) out.push(...rectBlockers(fr));
    else if (p.r > 0) out.push([p.x, p.y - 2, p.r]);
  }
  const [bx, by, bw, bh] = HB_BUILD;
  return out.filter(([x, y, r]) => x - r < bx + bw && x + r > bx && y - r < by + bh && y + r > by);
}
/** Mauern als Polygone fuer `walls` in der Karten-JSON (Stadtmauer; Haeuser stehen nur als Blocker in der Datei). */
export const hbWallPolys = (): Pt[][] => HB_WALLS.map(rectPoly);
