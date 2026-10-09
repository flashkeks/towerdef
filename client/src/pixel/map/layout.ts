/**
 * Lanternfall Meadow: die Lage aller Dinge auf der Karte (Runde 11 / P3). EINE Quelle fuer Zeichnung UND Sim-Daten:
 * Wasser-Polygone und Blocker in `sim/data/maps/meadow.json` werden aus diesem Layout erzeugt
 * (`client/scripts/gen-meadow.ts`), ein Test prueft den Gleichstand. Alle Masse in Pixeln der 640 x 360-Karte.
 */
import meadow from '../../../../sim/data/maps/meadow.json';

export const MAP_W = 640;
export const MAP_H = 360;
export const PATH: [number, number][] = meadow.path as [number, number][];
export const PATH_HW: number = meadow.pathHalfWidth;

// ---------- Wasser ----------
/** Mittellinie des Bachs (Catmull-Rom-Stuetzpunkte), von oben nach unten. */
const STREAM_CTRL: [number, number][] = [[300, -14], [301, 30], [306, 68], [315, 102], [337, 127], [368, 149], [385, 177], [387, 212], [391, 252], [397, 290], [401, 312], [411, 342], [428, 378]];
export interface StreamPt { x: number; y: number; hw: number; nx: number; ny: number }

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}
/** Dichte Probe der Mittellinie, ungefaehr ein Punkt je Pixel. */
export const STREAM: StreamPt[] = (() => {
  const raw: { x: number; y: number }[] = [];
  const n = STREAM_CTRL.length;
  for (let i = 0; i < n - 1; i++) {
    const a = STREAM_CTRL[Math.max(0, i - 1)], b = STREAM_CTRL[i], c = STREAM_CTRL[i + 1], d = STREAM_CTRL[Math.min(n - 1, i + 2)];
    const len = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const steps = Math.max(2, Math.ceil(len));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      raw.push({ x: catmull(a[0], b[0], c[0], d[0], t), y: catmull(a[1], b[1], c[1], d[1], t) });
    }
  }
  return raw.map((p, i) => {
    const q = raw[Math.min(raw.length - 1, i + 2)], o = raw[Math.max(0, i - 2)];
    const dx = q.x - o.x, dy = q.y - o.y, l = Math.hypot(dx, dy) || 1;
    // Halbbreite 10..14 px, sanft schwankend
    const hw = 12 + 1.6 * Math.sin(p.y / 23) + 0.9 * Math.sin(p.y / 9 + 1);
    return { x: p.x, y: p.y, hw, nx: -dy / l, ny: dx / l };
  });
})();

/** Abstand (in px) zum Wasser: < 0 im Wasser, 0 am Ufer, > 0 an Land. Naechster Punkt der Mittellinie. */
export function waterDist(x: number, y: number): number {
  let best = 1e9;
  const i0 = Math.max(0, Math.floor(y + 14) - 48);
  const i1 = Math.min(STREAM.length - 1, Math.floor(y + 14) + 56);
  for (let i = i0; i <= i1; i++) {
    const s = STREAM[i];
    const d = Math.hypot(x - s.x, y - s.y) - s.hw;
    if (d < best) best = d;
  }
  return best;
}

/** Wasser-Polygon fuer die Sim (Ufer links runter, rechts wieder hoch), auf die Karte begrenzt. */
export function waterPolygons(): [number, number][][] {
  const left: [number, number][] = [], right: [number, number][] = [];
  for (let i = 0; i < STREAM.length; i += 6) {
    const s = STREAM[i];
    if (s.y < -4 || s.y > MAP_H + 4) continue;
    left.push([Math.round(s.x + s.nx * s.hw), Math.round(s.y + s.ny * s.hw)]);
    right.push([Math.round(s.x - s.nx * s.hw), Math.round(s.y - s.ny * s.hw)]);
  }
  return [[...left, ...right.reverse()]];
}

// ---------- Weg ----------
export function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay;
  const l2 = vx * vx + vy * vy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2)) : 0;
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}
export function pathDist(x: number, y: number): number {
  let d = 1e9;
  for (let i = 1; i < PATH.length; i++) d = Math.min(d, segDist(x, y, PATH[i - 1][0], PATH[i - 1][1], PATH[i][0], PATH[i][1]));
  return d;
}

/** Bruecken: dort, wo der Weg (waagrechte Strecken) den Bach kreuzt. */
export interface Bridge { x: number; y: number; hw: number }
export const BRIDGES: Bridge[] = (() => {
  const out: Bridge[] = [];
  for (let i = 1; i < PATH.length; i++) {
    const [ax, ay] = PATH[i - 1], [bx, by] = PATH[i];
    if (ay !== by) continue;
    const s = STREAM.reduce((m, q) => (Math.abs(q.y - ay) < Math.abs(m.y - ay) ? q : m));
    if (s.x > Math.min(ax, bx) && s.x < Math.max(ax, bx)) out.push({ x: Math.round(s.x), y: ay, hw: Math.round(s.hw) });
  }
  return out;
})();

// ---------- Dinge auf der Wiese ----------
export type PropKind =
  | 'oak' | 'pine' | 'birch' | 'vtree' | 'bush' | 'berry' | 'rock' | 'boulder' | 'stump' | 'hay' | 'barrel' | 'crate'
  | 'house' | 'barn' | 'cottage' | 'windmill' | 'well' | 'lamp' | 'sign' | 'gatetower' | 'shrine' | 'cart' | 'cattail';
export interface Prop {
  kind: PropKind;
  /** Fusspunkt in px */
  x: number;
  y: number;
  /** Variante (Farbe/Form) */
  v: number;
  /** Blocker-Radius in px (0 = nur Zierde) */
  r: number;
}
export const BLOCK_R: Record<PropKind, number> = {
  oak: 7, pine: 5, birch: 5, vtree: 6, bush: 4, berry: 4, rock: 4, boulder: 8, stump: 4, hay: 5, barrel: 3, crate: 4,
  house: 15, barn: 18, cottage: 13, windmill: 13, well: 6, lamp: 2, sign: 2, gatetower: 12, shrine: 6, cart: 8, cattail: 0,
};
const b = (kind: PropKind, x: number, y: number, v = 0): Prop => ({ kind, x, y, v, r: BLOCK_R[kind] });

export const PROPS: Prop[] = [
  // --- violetter Waldrand im Westen ---
  b('vtree', 12, 14, 0), b('vtree', 33, 28, 1), b('vtree', 10, 48, 2), b('vtree', 31, 56, 0), b('vtree', 14, 74, 1),
  b('vtree', 14, 116, 2), b('vtree', 35, 124, 0), b('vtree', 11, 142, 1), b('vtree', 31, 156, 2), b('vtree', 14, 176, 0),
  b('vtree', 36, 192, 1), b('vtree', 11, 210, 2), b('vtree', 31, 226, 0), b('vtree', 14, 248, 1), b('vtree', 36, 262, 2),
  b('vtree', 11, 282, 0), b('vtree', 31, 298, 1), b('vtree', 14, 320, 2), b('vtree', 36, 334, 0), b('vtree', 10, 352, 1),
  // --- Norden ---
  b('oak', 66, 38, 0), b('pine', 92, 24, 0), b('oak', 150, 30, 1), b('birch', 188, 46, 0), b('pine', 226, 22, 1),
  b('oak', 252, 40, 2), b('pine', 340, 26, 0), b('birch', 372, 40, 1), b('oak', 408, 28, 0), b('pine', 470, 30, 2),
  b('oak', 510, 44, 1), b('birch', 560, 24, 0), b('bush', 120, 52, 0), b('bush', 206, 18, 0), b('rock', 280, 30, 0),
  // --- Westtasche ---
  b('bush', 84, 118, 0), b('berry', 96, 138, 0), b('rock', 62, 160, 1), b('oak', 76, 200, 1), b('pine', 58, 236, 0),
  b('bush', 90, 262, 1), b('boulder', 70, 288, 0), b('birch', 94, 318, 1),
  // --- Taschen im Weg ---
  b('windmill', 196, 172, 0), b('bush', 150, 126, 1), b('berry', 232, 118, 1), b('rock', 148, 222, 0), b('bush', 236, 232, 0),
  b('hay', 172, 226, 0), b('hay', 183, 232, 1),
  b('oak', 300, 148, 2), b('bush', 296, 200, 0), b('rock', 308, 236, 1), b('pine', 300, 252, 1),
  // --- Mitte unten ---
  b('cottage', 214, 331, 0), b('oak', 150, 326, 1), b('bush', 180, 340, 0), b('barrel', 240, 344, 0), b('crate', 248, 336, 0),
  b('pine', 292, 322, 0), b('rock', 314, 346, 1), b('birch', 120, 345, 0),
  // --- Bachpartie ---
  b('boulder', 358, 245, 0), b('bush', 360, 270, 0), b('berry', 352, 296, 1), b('rock', 446, 250, 0), b('oak', 470, 258, 2),
  b('shrine', 450, 280, 0), b('bush', 498, 236, 0), b('birch', 506, 276, 1), b('pine', 376, 336, 1), b('oak', 438, 342, 0),
  b('bush', 480, 340, 1), b('rock', 356, 352, 0), b('pine', 340, 106, 0), b('rock', 350, 168, 0), b('bush', 352, 190, 1),
  b('oak', 404, 118, 1), b('berry', 416, 150, 0), b('bush', 410, 96, 0), b('boulder', 416, 186, 1),
  // --- Nordost: Hof ---
  b('barn', 566, 74, 0), b('cottage', 510, 96, 1), b('hay', 478, 126, 1), b('hay', 489, 120, 0), b('cart', 538, 128, 0),
  b('oak', 470, 90, 0), b('pine', 596, 124, 1), b('bush', 596, 28, 1), b('barrel', 530, 118, 0),
  // --- Ostrand: Stadt ---
  b('house', 624, 44, 0), b('house', 626, 94, 1), b('gatetower', 627, 146, 0), b('gatetower', 627, 214, 1),
  b('house', 625, 262, 2), b('house', 626, 308, 0), b('house', 622, 354, 1),
  // --- Suedost ---
  b('oak', 574, 232, 1), b('well', 580, 270, 0), b('bush', 560, 300, 0), b('pine', 588, 330, 0), b('rock', 548, 346, 1), b('birch', 598, 214, 1),
  // --- Lampen (Zierde, mit kleinem Blocker) und Schild ---
  b('lamp', 560, 144), b('lamp', 560, 179), b('lamp', 598, 144), b('lamp', 598, 179), b('lamp', 44, 76),
  b('lamp', 150, 106), b('lamp', 334, 50), b('lamp', 424, 238), b('lamp', 428, 292), b('lamp', 296, 110),
  b('sign', 52, 113),
  // --- Schilf am Bach (Zierde) ---
  { kind: 'cattail', x: 290, y: 100, v: 0, r: 0 }, { kind: 'cattail', x: 376, y: 160, v: 1, r: 0 }, { kind: 'cattail', x: 372, y: 262, v: 0, r: 0 },
  { kind: 'cattail', x: 418, y: 330, v: 1, r: 0 },
];

/** Zaeune als Linienzuege (Pfosten alle ~8 px), Zierde. */
export const FENCES: { pts: [number, number][] }[] = [
  { pts: [[478, 70], [478, 58], [530, 58]] },
  { pts: [[470, 148], [526, 148]] },
];

/** Blocker fuer die Sim: [x, y, r] in px, y auf Hoehe des Fusspunkts. */
export function blockers(): [number, number, number][] {
  const [bx, , bw] = meadow.buildArea;
  // was ganz ausserhalb der Bauflaeche steht (Stadtrand), muss die Sim nicht kennen
  return PROPS.filter((q) => q.r > 0 && q.x - q.r < bx + bw).map((q) => [q.x, q.y - 2, q.r]);
}
