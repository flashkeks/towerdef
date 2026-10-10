/**
 * Ashra Dunes (Runde 16 / K2, Karte 8, Advanced): Lage der Dinge. EINE Quelle fuer Zeichnung UND Sim-Daten:
 * Wege, Oase (Wasser) und Blocker in `sim/data/maps/dunes.json` schreibt `scripts/gen-maps.ts` aus diesem Layout, ein Test
 * prueft den Gleichstand. Drei Eingaenge (links oben, links unten, oben), die sich vereinen; jeder Ast ~1.000 px.
 */
import { closedSpline, Field, pathDistAll, pathLength, polySdf, simplify, type Pt } from './kit';
import { fitLength, scatterProps } from './k2kit';
import { MAP_H, MAP_W } from './layout';
import type { DunesKind } from './props-dunes';

export const DU_HW = 13;
export const DU_BUILD: [number, number, number, number] = [8, 8, 624, 344];
export const DU_TARGET = 1000;

// Gemeinsamer Teil: bei (300,185) laufen A und B zusammen, bei (400,185) stoesst C dazu, dann der Schweif zum Ausgang.
const TAIL: Pt[] = [[400, 185], [400, 262], [520, 262], [656, 262]];

export const DU_BRANCHES: Pt[][] = [
  // A (links oben): Karawanenpfad, der sich ueber die Nordwestduenen windet
  fitLength((v) => [[-16, 44], [v, 44], [v, 100], [180, 100], [180, 148], [300, 148], [300, 185], ...TAIL], DU_TARGET, 190, 280),
  // B (links unten): Spiegel von A
  fitLength((v) => [[-16, 316], [v, 316], [v, 260], [180, 260], [180, 222], [300, 222], [300, 185], ...TAIL], DU_TARGET, 190, 280),
  // C (oben): kommt von Norden und windet sich durch den Nordosten
  fitLength((v) => [[v, -16], [v, 40], [590, 40], [590, 104], [480, 104], [480, 150], [400, 150], ...TAIL], DU_TARGET, 200, 380),
];

// ---------- Wasser: die Oase im Westen (Platz fuer 2-3 Wassertuerme) ----------
const OASIS_CTRL: Pt[] = [[22, 190], [30, 172], [52, 162], [80, 165], [104, 175], [114, 192], [100, 208], [70, 216], [42, 213], [25, 202]];
export const OASIS: Pt[] = closedSpline(OASIS_CTRL, 4);
export const OASIS_C: Pt = [68, 189];
export const duWater = (): Pt[][] => [simplify(OASIS, 3)];

export const DU_LEN = DU_BRANCHES.map(pathLength);

const oasisSdf = new Field(polySdf([OASIS]));
/** Abstand zur Oase in px: < 0 im Wasser. */
export const oasisAt = (x: number, y: number): number => oasisSdf.at(x, y);

// ---------- Dinge ----------
export interface DunesProp { kind: DunesKind; x: number; y: number; v: number; r: number }
export const DU_R: Record<DunesKind, number> = {
  palm: 5, palmsmall: 3, cactus: 4, cactusround: 3, mesa: 14, rock: 4, boulder: 9, column: 4, columnbroken: 4, columnfallen: 9, arch: 12,
  obelisk: 5, ruinwall: 10, statue: 8, tent: 13, camel: 8, bones: 0, deadtree: 3, torch: 2, brazier: 3, crate: 4, jar: 3, banner: 2,
  shrub: 0, well: 6, cart: 11, reeds: 0,
};
const P = (kind: DunesKind, x: number, y: number, v = 0): DunesProp => ({ kind, x, y, v, r: DU_R[kind] });

const HAND: DunesProp[] = [
  // Oase mit Lager (Westtasche)
  P('palm', 24, 160, 0), P('palm', 120, 166, 1), P('palm', 118, 214, 2), P('palmsmall', 98, 156, 1), P('palmsmall', 34, 224, 0), P('palm', 62, 232, 1),
  P('reeds', 44, 164, 0), P('reeds', 100, 214, 1), P('reeds', 24, 198, 0), P('reeds', 112, 186, 1),
  P('tent', 46, 112, 0), P('tent', 100, 124, 1), P('brazier', 74, 138), P('crate', 24, 136, 0), P('crate', 32, 142, 1), P('jar', 120, 140, 0), P('camel', 26, 100, 0),
  P('well', 140, 196), P('banner', 150, 112), P('cart', 124, 262), P('tent', 52, 266, 1), P('camel', 90, 276, 1), P('torch', 84, 250), P('jar', 20, 288, 1),
  P('cactus', 142, 232, 0), P('cactusround', 150, 252, 0), P('rock', 160, 130, 0),
  // Ruinentor vor der Kreuzung (Mitte)
  P('columnbroken', 218, 176, 0), P('columnfallen', 262, 197, 0), P('torch', 238, 176), P('column', 224, 202, 0),
  // Ruinen im Norden (Mitte oben)
  P('arch', 322, 118), P('ruinwall', 272, 84, 0), P('statue', 356, 80), P('ruinwall', 372, 112, 1), P('cactus', 292, 112, 1), P('shrub', 312, 78, 0), P('bones', 266, 126, 0),
  // Tempel im Osten
  P('column', 440, 226, 0), P('columnbroken', 468, 228, 0), P('column', 496, 226, 0), P('columnbroken', 548, 228, 0), P('columnfallen', 520, 236, 0),
  P('obelisk', 606, 194), P('statue', 562, 188), P('brazier', 452, 190), P('brazier', 520, 214), P('banner', 584, 224), P('ruinwall', 468, 188, 0), P('torch', 596, 232), P('bones', 440, 204, 1),
  // Sueden
  P('mesa', 304, 308, 0), P('mesa', 476, 322, 1), P('mesa', 600, 316, 2), P('camel', 372, 300, 1), P('camel', 398, 308, 0), P('boulder', 540, 302, 0), P('cactus', 440, 296, 2),
  P('crate', 358, 290, 0), P('jar', 348, 298, 0), P('deadtree', 262, 290, 0), P('cactus', 270, 258, 0), P('rock', 330, 264, 1), P('palmsmall', 420, 330, 0),
  // Norden und Osten
  P('rock', 470, 20, 2), P('rock', 380, 22, 0), P('boulder', 560, 18, 0), P('deadtree', 440, 74, 1), P('cactus', 520, 76, 1), P('cactus', 626, 74, 0), P('rock', 622, 120, 1), P('mesa', 618, 214, 1),
  P('deadtree', 610, 150, 0), P('shrub', 420, 124, 0), P('cactusround', 560, 128, 1), P('rock', 360, 152, 1), P('boulder', 28, 316, 0), P('deadtree', 170, 340, 1), P('rock', 210, 340, 1), P('cactus', 230, 296, 1),
];

/** Streu: trockene Struppen, Steinchen, Kakteen, Knochen auf freiem Sand (fester Seed). */
function scatter(): DunesProp[] {
  return scatterProps<DunesKind>({
    seed: 16081, count: 70, tries: 7000, branches: DU_BRANCHES, hw: DU_HW, hand: HAND, variants: 3, radius: DU_R,
    kinds: [['shrub', 30], ['rock', 18], ['cactusround', 12], ['cactus', 6], ['bones', 8], ['palmsmall', 0.0001]],
    accept: (x, y, r) => oasisAt(x, y) > 20 + r && x > 10 && x < 630 && y > 14 && y < 350,
  });
}
export const DU_PROPS: DunesProp[] = [...HAND, ...scatter()].sort((a, b) => a.y - b.y);

/** Blocker fuer die Sim: alle Dinge mit Radius, die auf der Bauflaeche stehen. */
export function duBlockers(): [number, number, number][] {
  const [bx, by, bw, bh] = DU_BUILD;
  return DU_PROPS.filter((q) => q.r > 0 && q.x - q.r < bx + bw && q.x + q.r > bx && q.y - q.r < by + bh && oasisAt(q.x, q.y) > -4 && pathDistAll(DU_BRANCHES, q.x, q.y) > DU_HW - 2).map((q) => [q.x, q.y - 2, q.r]);
}
void MAP_W; void MAP_H;
