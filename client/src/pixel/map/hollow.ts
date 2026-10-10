/**
 * Harvest Hollow (Runde 16 / K1): Herbstkarte, Beginner. Lage der Dinge UND Malen in einer Datei.
 * Der Weg (ein Eingang, ~1.750 px) kommt aus `sim/data/maps/hollow.json` (scripts/gen-r16-paths.mjs); der Teich (Wasser,
 * nicht bebaubar fuer Landtuerme, Platz fuer 3 bis 4 Wassertuerme) und die Blocker schreibt `scripts/gen-maps.ts` zurueck.
 * Licht von oben links, warm; Westen leicht kuehler, Osten golden. Animiert: Windmuehle, Teichwellen, Seerosen, Enten,
 * Blaetter und Kraehen (ambient.ts), Rauch vom Bauernhaus.
 */
import hollow from '../../../../sim/data/maps/hollow.json';
import { bayer, Buf, C, fbm, hash2, rng, shadeIdx, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { closedSpline, Field, inPoly, polySdf, simplify, walk, type Pt } from './kit';
import { hollowArt, hollowBlades, MILL_STEPS_H, type HollowKind } from './props-hollow';
import { at, blockersOf, lightPool, nudge, pathCoordsOf, placed, scatter, shadowPass, spriteOver, vignette, waterBase, waterFrame, type SceneProp, type WaterStyle } from './scene';
import type { MapArt, MapLight, PlacedArt } from './types';

const raw = hollow as unknown as { path: Pt[]; paths?: Pt[][]; pathHalfWidth: number; buildArea: [number, number, number, number] };
export const HO_BRANCHES: Pt[][] = raw.paths ?? [raw.path];
export const HO_HW: number = raw.pathHalfWidth;
export const ANIM_FRAMES = 8;

// ---------- Teich ----------
const POND_CTRL: Pt[] = [[318, 270], [334, 250], [368, 240], [410, 242], [442, 256], [458, 286], [448, 314], [416, 330], [372, 334], [336, 326], [316, 300]];
export const POND: Pt[] = closedSpline(POND_CTRL, 3);
export const waterPolygons = (): Pt[][] => [simplify(POND, 3)];
const pondSdf = polySdf([POND]);
/** Abstand zum Teich in px: < 0 im Wasser. */
export const pondAt = (x: number, y: number): number => pondSdf[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];

// ---------- Felder ----------
export type FieldKind = 'wheat' | 'pumpkin' | 'corn' | 'stubble' | 'plow' | 'yard';
export interface Plot { kind: FieldKind; x0: number; y0: number; x1: number; y1: number }
export const PLOTS: Plot[] = [
  { kind: 'wheat', x0: 191, y0: 116, x1: 251, y1: 262 },
  { kind: 'pumpkin', x0: 283, y0: 116, x1: 357, y1: 204 },
  { kind: 'corn', x0: 196, y0: 14, x1: 358, y1: 84 },
  { kind: 'stubble', x0: 489, y0: 74, x1: 541, y1: 184 },
  { kind: 'plow', x0: 91, y0: 70, x1: 157, y1: 192 },
  { kind: 'wheat', x0: 579, y0: 18, x1: 629, y1: 300 },
];
const YARD: Pt[] = closedSpline([[96, 306], [140, 298], [210, 298], [262, 306], [276, 330], [250, 350], [150, 352], [100, 342]], 3);
const plotAt = (x: number, y: number, pad = 0): Plot | null => PLOTS.find((p) => x >= p.x0 - pad && x <= p.x1 + pad && y >= p.y0 - pad && y <= p.y1 + pad) ?? null;

// ---------- Dinge ----------
export type HollowProp = SceneProp<HollowKind>;
export const HOLLOW_R: Record<HollowKind, number> = {
  maple: 4, oak: 5, birch: 2, fir: 3, willow: 6, apple: 3, bush: 2, rock: 3, boulder: 8, stump: 4, log: 5,
  barn: 22, farmhouse: 17, windmill: 16, haystack: 7, bale: 5, balestack: 8, pumpkin: 5, scarecrow: 3, cornshock: 2, wagon: 12,
  well: 7, lamp: 2, sign: 2, crate: 4, barrel: 3, cattail: 0, beehive: 3, basket: 3, dock: 0, boat: 0, coop: 10,
};
const P = (kind: HollowKind, x: number, y: number, v = 0): HollowProp => ({ kind, x, y, v, r: HOLLOW_R[kind] });

/** Windmuehle: Koerper wird in den Boden gebacken (die Fluegel liegen davor als bewegte Ebene). */
export const MILL = { x: 505, y: 286 };

const HAND_RAW: HollowProp[] = [
  // Hof unten links
  P('barn', 146, 346), P('farmhouse', 214, 344), P('coop', 104, 334), P('well', 178, 330), P('haystack', 244, 330, 1), P('wagon', 268, 346),
  P('crate', 188, 346, 1), P('barrel', 196, 340), P('basket', 232, 336), P('lamp', 168, 332), P('lamp', 250, 340), P('sign', 82, 322),
  P('beehive', 98, 316), P('balestack', 120, 316),
  // Windmuehle und Muehlteich-Ufer
  P('haystack', 534, 312, 0), P('bale', 520, 326, 0), P('bale', 538, 334, 1), P('lamp', 482, 300), P('sign', 540, 252), P('barrel', 474, 296), P('crate', 484, 312, 2),
  // Teich: Steg, Boot, Weide, Schilf
  P('dock', 392, 240), P('boat', 410, 272), P('willow', 326, 242), P('cattail', 322, 306, 0), P('cattail', 340, 330, 1), P('cattail', 440, 258, 0), P('cattail', 452, 308, 1), P('cattail', 418, 334, 0),
  P('rock', 456, 322), P('rock', 310, 288), P('bush', 306, 318, 1), P('bush', 466, 270, 2),
  // Felder: Kuerbisse, Maisschocken, Ballen, Vogelscheuchen
  P('pumpkin', 302, 148, 1), P('pumpkin', 332, 166, 0), P('pumpkin', 296, 186, 2), P('pumpkin', 344, 132, 0), P('pumpkin', 320, 194, 1), P('pumpkin', 312, 124, 2),
  P('scarecrow', 321, 160), P('scarecrow', 221, 190), P('scarecrow', 604, 160),
  P('bale', 506, 96, 0), P('bale', 524, 108, 1), P('bale', 500, 150, 1), P('balestack', 520, 170), P('haystack', 520, 128, 0),
  P('haystack', 124, 210, 0), P('bale', 100, 202, 0), P('bale', 146, 206, 1),
  P('fir', 596, 330), P('lamp', 574, 150), P('lamp', 574, 260), P('sign', 568, 92),
  // Strasse: Laternenpfaehle, Schilder
  P('lamp', 88, 308), P('lamp', 56, 56), P('sign', 40, 56), P('lamp', 160, 66), P('lamp', 280, 262), P('lamp', 364, 108), P('lamp', 456, 188), P('lamp', 546, 72),
  // Obstgarten links und Randbaeume
  P('apple', 32, 112), P('apple', 40, 168), P('apple', 28, 226), P('apple', 44, 270), P('apple', 24, 76),
  P('oak', 186, 100, 0), P('maple', 366, 66, 0), P('maple', 372, 246, 1), P('oak', 612, 54, 1), P('maple', 612, 332, 2), P('maple', 450, 112, 0), P('birch', 438, 222, 1),
  P('stump', 272, 214), P('log', 250, 94), P('stump', 560, 340), P('rock', 270, 96), P('boulder', 598, 214), P('rock', 442, 130),
];

const inPond = (x: number, y: number, pad = 0): boolean => pondAt(x, y) < pad;
const inYard = (x: number, y: number): boolean => inPoly(x, y, YARD);

/** Liegt ein sichtbares Pixel des Dings auf dem Weg, im Teich oder (Krone) auf einem Feld? Dann gehoert es dort nicht hin. */
export function overlaps(p: HollowProp): boolean {
  const pc = pathCoordsOf(HO_BRANCHES);
  const art = hollowArt(p.kind, p.v);
  if (spriteOver(art, p, (x, y) => at(pc.dist, x, y) < HO_HW + 1) > 0) return true;
  if (p.kind !== 'boat' && p.kind !== 'dock' && p.kind !== 'cattail' && p.kind !== 'willow' && spriteOver(art, p, (x, y) => pondAt(x, y) < 0) > 0) return true;
  return false;
}

// Maisfeld oben: Schocken in Reihen
for (const y of [34, 66]) for (let i = 0; i < 7; i++) HAND_RAW.push(P('cornshock', 214 + i * 24 + (y === 66 ? 12 : 0), y, i % 2));
const HAND: HollowProp[] = nudge(HAND_RAW, (p) => !overlaps(p));

function scatterProps(): HollowProp[] {
  return scatter<HollowKind>({
    seed: 16021, tries: 12000, max: 170, hand: HAND, branches: HO_BRANCHES, hw: HO_HW,
    pick: (x, y, rnd) => {
      const edge = Math.min(x, MAP_W - x, y * 1.4, (MAP_H - y) * 1.1);
      const dens = edge < 44 ? 0.9 : 0.1 + (vnoise(x, y, 80, 31) > 0.62 ? 0.5 : 0) + (edge < 100 ? 0.15 : 0);
      if (rnd() > dens) return null;
      const roll = rnd();
      const kind: HollowKind = roll < 0.34 ? 'maple' : roll < 0.5 ? 'oak' : roll < 0.64 ? 'birch' : roll < 0.78 ? 'fir' : roll < 0.9 ? 'bush' : roll < 0.95 ? 'rock' : 'stump';
      const v = Math.floor(rnd() * (kind === 'maple' ? 3 : kind === 'bush' ? 3 : kind === 'rock' ? 2 : 2));
      return P(kind, x, y, v);
    },
    free: (p) => !inPond(p.x, p.y, p.r + 8) && !plotAt(p.x, p.y, 4) && !inYard(p.x, p.y) && !(p.x > 462 && p.x < 556 && p.y > 224 && p.y < 330) && !overlaps(p),
  });
}
export const HOLLOW_PROPS: HollowProp[] = (() => [...HAND, ...scatterProps()].filter((p) => p.kind !== 'windmill').sort((a, b) => a.y - b.y))();

/** Kleinkram (Busch, Stein, Laterne, Kuerbis ...) sperrt keinen Bauplatz: er ist Zierde, der Turm darf davor stehen. */
const SMALL = new Set<string>(['bush', 'rock', 'stump', 'log', 'lamp', 'sign', 'cornshock', 'crate', 'barrel', 'basket', 'beehive', 'scarecrow', 'pumpkin', 'bale', 'apple']);
/** Blocker: Baeume, Gebaeude und grosse Dinge plus die gebackene Muehle. */
export function blockers(): [number, number, number][] {
  const [bx, by, bw, bh] = raw.buildArea;
  return [...blockersOf(HOLLOW_PROPS, [bx, by, bw, bh], (q) => inPond(q.x, q.y, -3) || SMALL.has(q.kind)), [MILL.x, MILL.y - 2, HOLLOW_R.windmill]];
}

// ---------- Malen ----------
const POND_STYLE: WaterStyle = { shallow: C.ice, mid: C.sky, deep: C.navy, glint: C.white, foam: C.white, tint: C.orange, shore: C.navy };

function grassTone(x: number, y: number): number {
  const n = fbm(x, y, 5);
  const wx = Math.max(0, (140 - x) / 140), ex = Math.max(0, (x - 470) / 170);
  let lit = n - 0.5 + ex * 0.08 - wx * 0.1 + (bayer(x, y) - 0.5) * 0.09 + (vnoise(x, y, 70, 11) - 0.5) * 0.18;
  let c: number;
  if (lit > 0.16) c = C.leaf;
  else if (lit > -0.08) c = C.grass;
  else if (lit > -0.2) c = bayer(x + 1, y) < 0.5 ? C.grass : C.pine;
  else c = C.pine;
  // trockene Herbstflecken: Gras vergilbt (gedithert zu tan/sand)
  const dry = vnoise(x, y, 46, 21) * 0.7 + vnoise(x, y, 14, 22) * 0.3;
  if (dry > 0.52) {
    const k = (dry - 0.52) * 3.2;
    if (bayer(x + 2, y + 1) < k) c = c === C.leaf ? C.yellow : c === C.grass ? C.tan : C.wood;
    if (dry > 0.7 && bayer(x, y + 2) < (dry - 0.62) * 3) c = c === C.yellow ? C.sand : C.tan;
  }
  if (wx > 0.3 && (c === C.pine) && bayer(x + 3, y) < wx * 0.5) c = C.deep;
  return c;
}

function pathColor(x: number, y: number, pd: number, lit: number): number | null {
  if (pd > HO_HW + 2.2) return null;
  const n = vnoise(x, y, 3.5, 21) * 0.7 + hash2(x, y, 22) * 0.3;
  if (pd <= HO_HW - 0.6) {
    const edge = pd / HO_HW;
    let c = C.tan;
    if (edge < 0.7 && n > 0.66 + edge * 0.2) c = C.peach;
    if (edge < 0.3 && n > 0.86) c = C.sand;
    if (n < 0.2 && edge > 0.3) c = C.wood;
    if (edge > 0.62) c = bayer(x, y) < (edge - 0.62) * 2.1 ? C.wood : C.tan;
    if (edge > 0.9 && lit < 0) c = bayer(x + 1, y) < 0.65 ? C.bark : C.wood;
    if (edge > 0.9 && lit > 0) c = bayer(x, y + 1) < 0.5 ? C.peach : C.tan;
    // Grasstreifen zwischen den Radspuren
    if (edge < 0.2 && vnoise(x, y, 5, 41) > 0.45 && bayer(x, y) < 0.55) c = bayer(x + 1, y + 1) < 0.4 ? C.leaf : C.grass;
    if (pd > 6.6 && pd < 8.2 && n < 0.6 && ((x + y) & 1) === 0) c = C.wood; // Radspuren
    const hs = hash2(x, y, 5);
    if (hs > 0.985) c = C.sand; else if (hs < 0.01) c = C.wood;
    // Herbstlaub auf dem Weg
    if (hash2(x, y, 6) > 0.992) c = hash2(x, y, 7) > 0.5 ? C.orange : C.red;
    return c;
  }
  if (pd <= HO_HW + 0.9) return lit > 0.25 ? C.sand : lit > -0.25 ? C.wood : C.bark;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.wood : C.tan) : C.plum;
}

/** Feldfarbe an (x, y) in der Parzelle; `d` = Abstand zum Rand der Parzelle (px). */
function plotColor(p: Plot, x: number, y: number, d: number): number {
  const n = vnoise(x, y, 5, 33);
  if (d < 1.2) return d < 0.6 ? C.bark : C.wood;
  switch (p.kind) {
    case 'wheat': {
      const k = (x - p.x0) % 4, row = Math.floor((x - p.x0) / 4);
      let c = k === 0 ? C.sand : k === 1 ? C.yellow : k === 2 ? C.amber : C.orange;
      if (k === 1 && hash2(row, y >> 1, 3) > 0.7) c = C.sand;
      if (hash2(x, y, 4) > 0.93) c = C.white;
      // Wellenmuster durch den Wind: hellere Baender wandern diagonal
      if (((x + y * 2) % 23) < 2 && k === 1) c = C.sand;
      // Erntespur in der Mitte der Parzelle
      const mid = (p.x0 + p.x1) / 2;
      if (Math.abs(x - mid) < 3 && p.kind === 'wheat' && y > p.y0 + (p.y1 - p.y0) * 0.55) c = k % 2 ? C.tan : C.peach;
      return c;
    }
    case 'pumpkin': {
      let c = n > 0.55 ? C.grass : C.pine;
      if (bayer(x, y) < 0.3) c = n > 0.55 ? C.leaf : C.grass;
      // Ranken
      if (((x * 3 + y * 5) % 17) === 0 && hash2(x, y, 8) > 0.4) c = C.leaf;
      if (hash2(x >> 2, y >> 2, 9) > 0.96 && (x & 3) < 3 && (y & 3) < 3) c = (x & 3) === 0 && (y & 3) === 0 ? C.amber : C.orange;
      return c;
    }
    case 'corn': {
      const r = (y - p.y0) % 6;
      let c = r < 2 ? C.wood : r === 2 ? C.tan : C.bark;
      if (r === 3 && hash2(x, y, 3) > 0.5) c = C.wood;
      if (r < 2 && hash2(x >> 1, y, 5) > 0.7) c = C.grass;
      return c;
    }
    case 'stubble': {
      let c = (x + y) % 3 === 0 ? C.sand : C.tan;
      const k = hash2(x, y, 2);
      if (k > 0.85) c = C.yellow; else if (k < 0.1) c = C.wood;
      if ((y - p.y0) % 8 < 1) c = C.peach;
      if (hash2(x >> 1, y, 6) > 0.9) c = C.amber;
      return c;
    }
    case 'plow': {
      const r = (y - p.y0) % 4;
      let c = r === 0 ? C.tan : r === 1 ? C.wood : r === 2 ? C.bark : C.wood;
      if (r === 1 && hash2(x, y, 4) > 0.82) c = C.leaf;
      if (r === 0 && hash2(x, y, 5) > 0.7) c = C.peach;
      return c;
    }
    default: return C.tan;
  }
}

function yardColor(x: number, y: number): number {
  const n = vnoise(x, y, 4, 51);
  let c = bayer(x, y) < 0.55 + (n - 0.5) * 0.5 ? C.tan : C.peach;
  if (hash2(x, y, 3) > 0.9) c = C.wood;
  if (hash2(x, y, 4) > 0.965) c = C.yellow; // Strohhalme
  return c;
}

function leafColors(prop: HollowProp): number[] {
  if (prop.kind === 'maple') return prop.v === 1 ? [C.red, C.crimson, C.orange] : prop.v === 2 ? [C.amber, C.yellow, C.orange] : [C.orange, C.amber, C.rust];
  if (prop.kind === 'oak') return [C.clay, C.amber, C.orange];
  if (prop.kind === 'birch') return [C.yellow, C.amber];
  if (prop.kind === 'willow') return [C.yellow, C.sand];
  return [];
}

export function paintHollow(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const pc = pathCoordsOf(HO_BRANCHES);
  const pond = new Field(pondSdf);
  const yardSdf = new Field(polySdf([YARD]));

  // 1) Gras, Felder, Hof, Weg, Teich
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const pd = pc.dist[y * W + x];
    const pdn = pd;
    const [gx, gy] = [at(pc.dist, x + 1, y) - at(pc.dist, x - 1, y), at(pc.dist, x, y + 1) - at(pc.dist, x, y - 1)];
    const lit = -(gx * 0.3 + gy * 0.4);
    const pw = pond.at(x, y);
    if (pw < 0) {
      const [wx, wy] = pond.grad(x, y);
      ground.set(x, y, waterBase(x, y, -pw, -(wx * 0.6 + wy * 0.8), POND_STYLE, 6));
      continue;
    }
    if (pdn <= HO_HW + 2.2) {
      const c = pathColor(x, y, pdn, lit);
      if (c !== null) { ground.set(x, y, c); continue; }
    }
    const pl = plotAt(x, y);
    if (pl) {
      const d = Math.min(x - pl.x0, pl.x1 - x, y - pl.y0, pl.y1 - y);
      ground.set(x, y, plotColor(pl, x, y, d));
      continue;
    }
    if (yardSdf.at(x, y) < 0) { ground.set(x, y, yardSdf.at(x, y) > -2 ? (bayer(x, y) < 0.5 ? C.tan : grassTone(x, y)) : yardColor(x, y)); continue; }
    let c = grassTone(x, y);
    // Kontaktschatten des Weges (Schattenseite)
    if (pdn < HO_HW + 4.2 && pdn > HO_HW + 2 && lit < -0.12 && bayer(x, y) < 0.7) c = shadeIdx(c);
    // Teichufer: nasser Boden
    if (pw < 5) {
      const [wx, wy] = pond.grad(x, y);
      const l2 = -(wx * 0.6 + wy * 0.8);
      if (pw < 1.8) c = l2 > 0.2 ? C.sand : l2 > -0.3 ? C.tan : C.wood;
      else if (pw < 3.2) c = bayer(x, y) < 0.55 + l2 * 0.2 ? (l2 > 0 ? C.sand : C.tan) : (l2 > 0 ? C.leaf : C.grass);
      else if (pw < 4.6 && bayer(x + 1, y + 1) < 0.35) c = l2 > 0 ? C.tan : C.pine;
    }
    ground.set(x, y, c);
  }

  // 2) Streu: Buescheln, Blumen (Astern), Pilze, Gras am Wegrand
  const r = rng(20261016);
  const isGrass = (x: number, y: number): boolean => pond.at(x, y) > 5.5 && at(pc.dist, x, y) > HO_HW + 4 && !plotAt(x, y, 2) && yardSdf.at(x, y) > 2;
  for (let i = 0; i < 1500; i++) {
    const x = Math.floor(r() * (W - 4)) + 2, y = Math.floor(r() * (H - 6)) + 4;
    if (!isGrass(x, y)) continue;
    const base = ground.get(x, y), dark = shadeIdx(base), light = base === C.leaf ? C.yellow : base === C.tan || base === C.sand ? C.sand : C.leaf;
    const type = Math.floor(r() * 3);
    ground.set(x, y, dark);
    if (type === 0) { ground.set(x - 1, y - 1, dark); ground.set(x + 1, y - 1, dark); ground.set(x, y - 1, light); ground.set(x, y - 2, light); }
    else if (type === 1) { ground.set(x - 1, y, dark); ground.set(x + 1, y, dark); ground.set(x - 1, y - 1, light); ground.set(x + 1, y - 2, light); }
    else { ground.set(x + 1, y, dark); ground.set(x, y - 1, light); ground.set(x + 1, y - 2, light); }
  }
  const ASTER = [C.orchid, C.white, C.yellow, C.coral, C.orchid, C.amber];
  for (let k = 0; k < 90; k++) {
    const cx = r() * W, cy = r() * H;
    if (!isGrass(Math.round(cx), Math.round(cy))) continue;
    const col = ASTER[Math.floor(r() * ASTER.length)];
    const n = 3 + Math.floor(r() * 5);
    for (let j = 0; j < n; j++) {
      const x = Math.round(cx + (r() - 0.5) * 16), y = Math.round(cy + (r() - 0.5) * 9);
      if (!isGrass(x, y)) continue;
      ground.set(x, y + 1, C.grass); ground.set(x, y, col);
      if (j % 3 === 0) { ground.set(x - 1, y, col); ground.set(x + 1, y, col); ground.set(x, y - 1, col); ground.set(x, y, C.yellow); }
    }
  }
  // Randsteine am Weg
  for (let i = 0; i < 480; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    const pd = at(pc.dist, x, y);
    if (pd < HO_HW + 0.8 || pd > HO_HW + 2.8 || pond.at(x, y) < 2 || plotAt(x, y, 1)) continue;
    if (hash2(x >> 2, y >> 2, 31) > 0.45) continue;
    ground.set(x, y, C.silver); ground.set(x + 1, y, C.stone); ground.set(x, y + 1, C.slate); ground.set(x + 1, y + 1, C.slate);
  }
  // Fussspuren und Hufabdruecke im Weg
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    if (at(pc.dist, x, y) > HO_HW - 3 || pond.at(x, y) < 3) continue;
    ground.set(x, y, C.wood); ground.set(x + 2, y + 1, C.wood);
  }

  // 3) Dinge, Schatten, Laub am Boden
  const props: PlacedArt[] = placed(HOLLOW_PROPS, hollowArt);
  const millArt = hollowArt('windmill', 0);
  const baked: PlacedArt[] = [{ prop: { kind: 'windmill', x: MILL.x, y: MILL.y, v: 0, r: HOLLOW_R.windmill }, art: millArt }];
  shadowPass(ground, [...props, ...baked], (c) => pondWater(c));
  const rl = rng(777);
  for (const { prop } of props) {
    const cols = leafColors(prop as HollowProp);
    if (!cols.length) continue;
    const n = 7 + Math.floor(rl() * 8);
    for (let i = 0; i < n; i++) {
      const a = rl() * Math.PI * 2, d = 6 + rl() * 17;
      const x = Math.round(prop.x + Math.cos(a) * d * 1.2), y = Math.round(prop.y + Math.sin(a) * d * 0.55 + 2);
      if (pond.at(x, y) < 2 || at(pc.dist, x, y) < HO_HW - 4) continue;
      const c = cols[Math.floor(rl() * cols.length)];
      ground.set(x, y, c);
      if (rl() < 0.4) ground.set(x + 1, y, c === C.orange ? C.amber : c);
    }
  }

  // 4) Licht: Laternen, Fenster
  const lights: MapLight[] = [];
  const smoke: MapArt['smoke'] = [];
  for (const { prop, art } of props) {
    if (prop.kind === 'lamp') lights.push({ x: prop.x + 3, y: prop.y + (art.hook?.y ?? -18), r: 26, warm: true, flicker: 'flame' });
    else if (prop.kind === 'farmhouse') { lights.push({ x: prop.x - 10, y: prop.y - 14, r: 20, warm: true, flicker: 'flame' }, { x: prop.x + 12, y: prop.y - 14, r: 16, warm: true, flicker: 'flame' }); smoke.push({ x: prop.x + (art.hook?.x ?? 7), y: prop.y + (art.hook?.y ?? -40) + 2 }); }
    else if (prop.kind === 'barn') lights.push({ x: prop.x, y: prop.y - 26, r: 16, warm: true, flicker: 'flame' });
    else if (prop.kind === 'pumpkin' && prop.v === 2) lights.push({ x: prop.x, y: prop.y - 6, r: 12, warm: true, flicker: 'flame' });
  }
  lights.push({ x: MILL.x, y: MILL.y - 18, r: 14, warm: true, flicker: 'flame' });
  for (const L of lights.filter((l) => l.r >= 24)) {
    lightPool(ground, L.x, L.y + 14, 20, 13, (c) => c === C.grass ? C.leaf : c === C.leaf ? C.yellow : c === C.pine ? C.grass : c === C.tan ? C.peach : c === C.peach ? C.sand : c === C.wood ? C.tan : c, 0.8);
  }
  vignette(ground, 14, 0.7, (c) => pondWater(c));
  // Westen: Daemmerung, Osten: Gold (sanfte Toenung am Rand)
  for (let y = 0; y < H; y++) for (let x = 0; x < 46; x++) if (bayer(x, y) < (46 - x) / 46 * 0.5 && (ground.get(x, y) === C.pine)) ground.set(x, y, C.deep);

  // 5) Mühlenkoerper in den Boden backen (Fluegel kommen als bewegte Ebene davor)
  ground.blit(millArt.buf, MILL.x - millArt.ax, MILL.y - millArt.ay);

  const deco = new Buf(W, H);
  paintFences(deco, pond);
  paintBunting(deco);
  paintPondDeco(deco, pond);
  const anim = Array.from({ length: ANIM_FRAMES }, (_, f) => paintAnim(f, pond));
  return { id: 'hollow', name: 'Harvest Hollow', ground, anim, animMs: 150, deco, props, lights, smoke };
}
const pondWater = (c: number): boolean => c === C.sky || c === C.ice || c === C.navy || c === C.orange;

// ---------- Zaeune ----------
export const FENCES: Pt[][] = [
  [[188, 114], [254, 114], [254, 264], [188, 264], [188, 114]],
  [[280, 114], [360, 114], [360, 206], [280, 206], [280, 114]],
  [[486, 72], [544, 72], [544, 186], [486, 186], [486, 72]],
  [[88, 68], [160, 68], [160, 194], [88, 194], [88, 68]],
  [[576, 16], [632, 16], [632, 302], [576, 302], [576, 16]],
];
function paintFences(d: Buf, pond: Field): void {
  for (const f of FENCES) {
    // Luecke fuer einen Eingang: jede Umzaeunung bekommt an einer Seite ein Tor (zwei Pfosten, kein Brett)
    const pts = walk(f, 8, 0);
    const rails = (a: Pt, b: Pt): void => {
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
      for (let t = 0; t <= l; t++) {
        const x = Math.round(a[0] + (dx / l) * t), y = Math.round(a[1] + (dy / l) * t);
        if (pond.at(x, y) < 1) continue;
        d.set(x, y - 5, C.tan); d.set(x, y - 3, C.wood);
        d.set(x, y - 4, C.bark);
        d.set(x + 1, y - 2, C.plum); d.set(x + 1, y - 1, C.plum);
      }
    };
    for (let i = 1; i < f.length; i++) rails(f[i - 1], f[i]);
    for (const p of pts) {
      const x = Math.round(p.x), y = Math.round(p.y);
      d.rect(x - 1, y - 8, 3, 9, C.wood); d.rect(x - 1, y - 8, 1, 9, C.tan); d.set(x + 1, y - 8, C.bark); d.rect(x, y - 9, 1, 1, C.peach);
      d.set(x + 2, y, C.plum); d.set(x + 2, y - 1, C.plum); d.set(x + 1, y + 1, C.plum);
    }
  }
}

/** Wimpelkette ueber dem Hof (Erntefest): Schnur und kleine Fahnen in Herbstfarben. */
function paintBunting(d: Buf): void {
  const strings: [Pt, Pt, number][] = [[[104, 322], [168, 318], 7], [[210, 316], [262, 326], 6]];
  const cols = [C.red, C.amber, C.orange, C.yellow, C.coral];
  for (const [a, b, sag] of strings) {
    const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = Math.round(a[0] + (b[0] - a[0]) * t), y = Math.round(a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * sag) - 20;
      d.set(x, y, C.plum);
      if (i % 5 === 2) { const c = cols[(i / 5 | 0) % cols.length]; d.set(x, y + 1, c); d.set(x + 1, y + 1, c); d.set(x, y + 2, c); }
    }
  }
}

/** Uferschmuck am Teich: Steine, Gras und Trittsteine, die ueber das Wasser ragen. */
function paintPondDeco(d: Buf, pond: Field): void {
  const r = rng(556);
  for (let i = 0; i < 90; i++) {
    const p = POND[Math.floor(r() * POND.length)];
    const side = r() < 0.5 ? 1 : -1, ang = r() * Math.PI * 2;
    const x = Math.round(p[0] + Math.cos(ang) * side * 2), y = Math.round(p[1] + Math.sin(ang) * side * 2);
    if (pond.at(x, y) < -2 || (x > 380 && x < 402 && y < 262)) continue;
    if (r() < 0.55) { d.set(x, y, C.silver); d.set(x + 1, y, C.stone); d.set(x, y + 1, C.slate); d.set(x + 1, y + 1, C.slate); }
    else { d.set(x, y, C.leaf); d.set(x, y - 1, C.leaf); d.set(x + 1, y - 2, C.grass); d.set(x - 1, y - 2, C.leaf); d.set(x + 1, y, C.pine); }
  }
}

// ---------- Bewegte Ebene: Teich, Windmuehlenfluegel ----------
const LILIES: [number, number, number][] = [[350, 262, 0], [398, 288, 1], [345, 306, 2], [436, 292, 3], [372, 316, 4], [424, 268, 5], [330, 288, 6]];
const DUCKS: [number, number, number][] = [[360, 280, 0], [426, 302, 3], [384, 304, 5]];

function paintAnim(f: number, pond: Field): Buf {
  const b = waterFrame(f, ANIM_FRAMES, pond, POND_STYLE, { flow: [1, 0], sparkle: 0.996 });
  // orange Spiegelungen der Baeume wandern langsam
  for (let y = 238; y < 336; y++) for (let x = 312; x < 460; x++) {
    if (pond.at(x, y) > -3) continue;
    const k = hash2(x >> 1, y >> 1, 41 + (f >> 1));
    if (k > 0.965 && vnoise(x, y, 18, 5) > 0.5) { b.set(x, y, C.amber); b.set(x + 1, y, C.orange); }
  }
  // Seerosen: Blatt mit Kerbe, Bluete; wippen 1 px
  for (const [lx, ly, ph] of LILIES) {
    const bob = Math.round(Math.sin(((f + ph) / ANIM_FRAMES) * Math.PI * 2) * 0.6);
    const y = ly + bob;
    b.ellipse(lx, y, 4, 2.4, C.grass); b.ellipse(lx - 1, y - 1, 3, 1.4, C.leaf);
    b.set(lx + 2, y, C.sky); b.set(lx + 3, y, C.sky); b.set(lx + 4, y - 1, C.grass); // Kerbe
    b.set(lx + 2, y + 2, C.pine);
    if (ph % 2 === 0) { b.set(lx - 1, y - 1, C.coral); b.set(lx, y - 1, C.white); b.set(lx, y - 2, C.coral); b.set(lx - 2, y - 1, C.coral); }
  }
  // Enten: schaukeln, Schwimmwelle dahinter
  for (const [dx, dy, ph] of DUCKS) {
    const bob = Math.round(Math.sin(((f + ph) / ANIM_FRAMES) * Math.PI * 2));
    const sx = Math.round(Math.sin(((f + ph) / ANIM_FRAMES) * Math.PI * 2) * 1.5);
    const x = dx + sx, y = dy + bob;
    for (let i = 1; i <= 3; i++) { b.set(x - 5 - i * 2, dy + 2, i === 1 ? C.white : C.ice); }
    b.ellipse(x, y, 4, 2.4, C.white); b.rect(x - 4, y, 8, 1, C.silver);
    b.set(x + 1, y - 1, C.silver); b.set(x - 1, y - 1, C.silver);
    b.disc(x + 4, y - 3, 1.8, C.leaf); b.set(x + 5, y - 3, C.ink); b.rect(x + 6, y - 3, 2, 1, C.amber); // Kopf
    b.rect(x + 3, y - 2, 2, 2, C.leaf);
    b.set(x - 4, y - 1, C.silver); b.set(x - 5, y - 2, C.white);
  }
  // Ringwellen eines springenden Fisches (nur alle paar Bilder)
  if (f % 4 === 1) { const fx = 402, fy = 312, rr = (f % 8) * 0.9 + 2; for (let a = 0; a < 20; a++) { const an = (a / 20) * Math.PI * 2; b.set(Math.round(fx + Math.cos(an) * rr * 1.8), Math.round(fy + Math.sin(an) * rr * 0.8), C.white); } }
  // Windmuehlenfluegel (Nabe = Koerperkopf)
  const blades = hollowBlades(f % MILL_STEPS_H);
  const art = hollowArt('windmill', 0);
  const hx = MILL.x, hy = MILL.y + (art.hook?.y ?? -50);
  b.blit(blades, hx - 38, hy - 38);
  return b;
}
