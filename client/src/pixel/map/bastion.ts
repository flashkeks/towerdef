/**
 * Sunken Bastion (Runde 16 / K1): Burgruine, Intermediate. Zwei Eingaenge (oben/unten, gespiegelt, gleich lang, ~1.220 px je
 * Ast), die durch zwei Tore in der Westmauer in den Burghof laufen und sich vor dem Bergfried vereinen; Ausgang durch das
 * Osttor. Wege aus `sim/data/maps/bastion.json` (scripts/gen-r16-paths.mjs). Wassergraben (Wasser) und Mauern (`walls`,
 * dazu als Kreisketten in `blockers`, damit die Sim sie sperrt) schreibt `scripts/gen-maps.ts` zurueck.
 * Licht von oben links, kuehles Daemmerlicht, warme Feuerschalen; Fahnen, Feuer und Graben sind bewegt.
 */
import bastion from '../../../../sim/data/maps/bastion.json';
import { bayer, Buf, C, fbm, hash2, rng, shadeIdx, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { Field, type Pt } from './kit';
import { bastionArt, brazier, type BastionKind } from './props-bastion';
import { at, blockersOf, chain, fillCircles, gradOf, lightPool, maskSdf, maskToRects, nudge, pathCoordsOf, placed, scatter, shadowPass, spriteOver, vignette, waterBase, waterFrame, type SceneProp, type WaterStyle } from './scene';
import type { MapArt, MapLight, PlacedArt } from './types';

const raw = bastion as unknown as { path: Pt[]; paths?: Pt[][]; pathHalfWidth: number; buildArea: [number, number, number, number] };
export const BA_BRANCHES: Pt[][] = raw.paths ?? [raw.path];
export const BA_HW: number = raw.pathHalfWidth;
export const ANIM_FRAMES = 8;
const pcb = pathCoordsOf(BA_BRANCHES);

// ---------- Mauern ----------
/** Mittellinien der Aussenmauer (Dicke 8 px, Kreise r = 5 fuer die Sim). */
export const WALL_T = 8;
export const WALL = { x0: 214, x1: 566, y0: 40, y1: 320 };
/** Tore (Mitte, Halbbreite der Luecke): zwei im Westen, eins im Osten. */
export const GATES = { west: [146, 214], east: [180], half: 17 };
/** Bresche (eingestuerzt): Mauer sichtbar als Schutt, Sperre bleibt. */
const BREACH: { wall: 'n' | 's' | 'w' | 'e'; a: number; b: number }[] = [
  { wall: 'n', a: 312, b: 336 }, { wall: 'n', a: 452, b: 470 }, { wall: 's', a: 268, b: 292 }, { wall: 's', a: 432, b: 464 },
  { wall: 'w', a: 96, b: 118 }, { wall: 'w', a: 252, b: 270 }, { wall: 'e', a: 86, b: 110 }, { wall: 'e', a: 252, b: 276 },
];
export interface WallSeg { wall: 'n' | 's' | 'w' | 'e'; a: number; b: number }
/** Mauerabschnitte (Laufkoordinate a..b) ohne die Tore. */
export const WALL_SEGS: WallSeg[] = (() => {
  const cut = (wall: 'n' | 's' | 'w' | 'e', from: number, to: number, gates: number[]): WallSeg[] => {
    const out: WallSeg[] = [];
    let a = from;
    for (const g of gates) { out.push({ wall, a, b: g - GATES.half }); a = g + GATES.half; }
    out.push({ wall, a, b: to });
    return out;
  };
  return [...cut('n', WALL.x0 - WALL_T / 2, WALL.x1 + WALL_T / 2, []), ...cut('s', WALL.x0 - WALL_T / 2, WALL.x1 + WALL_T / 2, []), ...cut('w', WALL.y0 - WALL_T / 2, WALL.y1 + WALL_T / 2, GATES.west), ...cut('e', WALL.y0 - WALL_T / 2, WALL.y1 + WALL_T / 2, GATES.east)];
})();
const segRect = (s: WallSeg): [number, number, number, number] => {
  const h = WALL_T / 2;
  return s.wall === 'n' ? [s.a, WALL.y0 - h, s.b, WALL.y0 + h] : s.wall === 's' ? [s.a, WALL.y1 - h, s.b, WALL.y1 + h] : s.wall === 'w' ? [WALL.x0 - h, s.a, WALL.x0 + h, s.b] : [WALL.x1 - h, s.a, WALL.x1 + h, s.b];
};
/** Mauer-Polygone (Rechtecke) fuer das kommende `walls`-Feld der Sim. */
export const wallPolygons = (): Pt[][] => WALL_SEGS.filter((s) => s.b > s.a).map((s) => { const [x0, y0, x1, y1] = segRect(s); return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as Pt[]; });
const onBreach = (wall: string, c: number): boolean => BREACH.some((b) => b.wall === wall && c >= b.a && c <= b.b);

/** Mauer-Blocker: Kreise r = 5 entlang der Mittellinien, nicht auf dem Weg. */
function wallBlockers(): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const s of WALL_SEGS) {
    if (s.b <= s.a) continue;
    const line: Pt[] = s.wall === 'n' ? [[s.a, WALL.y0], [s.b, WALL.y0]] : s.wall === 's' ? [[s.a, WALL.y1], [s.b, WALL.y1]] : s.wall === 'w' ? [[WALL.x0, s.a], [WALL.x0, s.b]] : [[WALL.x1, s.a], [WALL.x1, s.b]];
    out.push(...chain(line, 5, (x, y) => at(pcb.dist, x, y) < BA_HW + 5.5));
  }
  return out;
}

// ---------- Graben ----------
const rrSdf = (x: number, y: number, x0: number, y0: number, x1: number, y1: number, r: number): number => {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = (x1 - x0) / 2 - r, hy = (y1 - y0) / 2 - r;
  const dx = Math.abs(x - cx) - hx, dy = Math.abs(y - cy) - hy;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
};
const MOAT = { out: [172, 8, 606, 352] as const, inn: [206, 32, 572, 328] as const };
function isMoat(x: number, y: number, pd: number): boolean {
  if (pd < BA_HW + 3.5) return false;
  return rrSdf(x, y, MOAT.out[0], MOAT.out[1], MOAT.out[2], MOAT.out[3], 16) < 0 && rrSdf(x, y, MOAT.inn[0], MOAT.inn[1], MOAT.inn[2], MOAT.inn[3], 5) > 0;
}
export const WATER_MASK: Uint8Array = (() => {
  const m = new Uint8Array(MAP_W * MAP_H);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) m[y * MAP_W + x] = isMoat(x, y, pcb.dist[y * MAP_W + x]) ? 1 : 0;
  return m;
})();
const sdf = maskSdf(WATER_MASK);
export const waterAt = (x: number, y: number): number => sdf[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];
export const waterPolygons = (): Pt[][] => maskToRects((x, y) => WATER_MASK[(y | 0) * MAP_W + (x | 0)] === 1, 2);

/** Hof: innerhalb der Aussenmauer. */
const inCourt = (x: number, y: number): boolean => x > WALL.x0 + 4 && x < WALL.x1 - 4 && y > WALL.y0 + 4 && y < WALL.y1 - 4;

// ---------- Dinge ----------
export type BastionProp = SceneProp<BastionKind>;
export const BASTION_R: Record<BastionKind, number> = {
  tower: 14, gatetower: 12, keep: 0, pillar: 3, arch: 8, rubble: 4, statue: 5, brazier: 3, banner: 2, oak: 7, dead: 4, pine: 5,
  bush: 3, rock: 5, cannon: 7, tent: 12, well: 8, crate: 4, barrel: 3, grave: 3, reeds: 0, wreck: 0, cart: 9, lamp: 2,
};
const P = (kind: BastionKind, x: number, y: number, v = 0): BastionProp => ({ kind, x, y, v, r: BASTION_R[kind] });
/** Bergfried: Fussmitte und Grundflaeche (Sperre als gefuellte Kreise). */
export const KEEP = { x: 385, y: 226, w: 108, h: 94 };
const KEEP_POLY: Pt[] = [[KEEP.x - 54, KEEP.y - 40], [KEEP.x + 54, KEEP.y - 40], [KEEP.x + 54, KEEP.y], [KEEP.x - 54, KEEP.y]];

export function overlaps(p: BastionProp): boolean {
  const art = bastionArt(p.kind, p.v);
  if (p.kind !== 'wreck' && p.kind !== 'reeds' && spriteOver(art, p, (x, y) => at(pcb.dist, x, y) < BA_HW + 1) > 0) return true;
  if (p.kind === 'wreck' || p.kind === 'reeds') return false;
  if (p.x < 4 || p.x > MAP_W - 4 || p.y < 10 || p.y > MAP_H - 2) return true;
  // nicht in den Graben (ausser Schilf, Wrack), nicht in die Mauer, nicht in den Bergfried
  if (waterAt(p.x, p.y) < 3 && p.kind !== 'tower' && p.kind !== 'gatetower') return true;
  return false;
}

const HAND_RAW: BastionProp[] = [
  // Tuerme: Ecken, Mitten, Tore
  P('tower', 214, 48, 0), P('tower', 566, 48, 1), P('tower', 214, 326, 1), P('tower', 566, 326, 0), P('tower', 390, 48, 1), P('tower', 390, 326, 0),
  P('gatetower', 214, 122, 0), P('tower', 214, 182, 0), P('gatetower', 214, 238, 1), P('gatetower', 566, 152, 1), P('gatetower', 566, 212, 0),
  // Bergfried und Feuerschalen
  P('brazier', 322, 236), P('brazier', 448, 236), P('brazier', 322, 126), P('brazier', 448, 126), P('banner', 300, 180, 0), P('banner', 470, 180, 1),
  // Hof Nordwest / Suedwest
  P('statue', 246, 104), P('rubble', 264, 70, 0), P('pillar', 232, 74, 0), P('pillar', 258, 126, 1), P('brazier', 240, 174),
  P('statue', 246, 266), P('rubble', 262, 296, 1), P('pillar', 232, 290, 1), P('pillar', 258, 232, 0), P('brazier', 240, 192),
  // Hof Nordost / Suedost
  P('well', 520, 112), P('crate', 506, 92, 1), P('barrel', 534, 138), P('banner', 546, 74, 1), P('rubble', 506, 150, 1), P('pillar', 540, 100, 1),
  P('cannon', 524, 252), P('arch', 520, 282), P('barrel', 540, 226), P('crate', 506, 238, 0), P('grave', 540, 290, 1), P('rubble', 546, 252, 0),
  // Hof Nord / Sued (ueber und unter dem Bergfried)
  P('pillar', 330, 96, 0), P('rubble', 358, 104, 0), P('arch', 400, 112), P('pillar', 440, 98, 1), P('rubble', 348, 262, 1), P('statue', 392, 262), P('pillar', 330, 270, 0), P('cart', 440, 266),
  // Vorfeld West: Ruinen, Lager, Graeber
  P('tent', 74, 62), P('barrel', 94, 66), P('lamp', 128, 58), P('lamp', 48, 118), P('grave', 70, 116, 0), P('grave', 90, 118, 1), P('rock', 126, 118), P('dead', 32, 62, 0),
  P('lamp', 128, 122), P('rubble', 156, 120, 0), P('cart', 150, 138), P('bush', 100, 130, 0), P('lamp', 70, 170),
  P('tent', 74, 298), P('barrel', 94, 294), P('lamp', 128, 302), P('lamp', 48, 242), P('grave', 70, 244, 1), P('grave', 90, 242, 0), P('rock', 126, 242), P('dead', 32, 298, 1),
  P('lamp', 128, 238), P('rubble', 156, 240, 1), P('bush', 100, 230, 1),
  P('statue', 100, 180), P('pillar', 70, 178, 1), P('rubble', 124, 184, 0), P('brazier', 150, 182),
  // Graben: Wrack, Schilf
  P('wreck', 188, 260), P('reeds', 176, 44, 0), P('reeds', 198, 316, 1), P('reeds', 590, 100, 0), P('reeds', 588, 262, 1), P('reeds', 400, 20, 0), P('reeds', 330, 342, 1),
  // Osten: Torvorplatz
  P('lamp', 598, 152), P('lamp', 598, 208), P('banner', 622, 160, 0), P('banner', 622, 200, 1), P('oak', 620, 70, 0), P('dead', 624, 296, 0), P('pine', 622, 118), P('pine', 624, 246), P('rock', 614, 330),
  // Westfeld Baeume
  P('oak', 24, 30, 0), P('pine', 56, 24), P('pine', 100, 24), P('oak', 24, 334, 1), P('pine', 60, 340), P('pine', 108, 338), P('dead', 20, 190, 0), P('rock', 40, 178),
];
const HAND: BastionProp[] = nudge(HAND_RAW, (p) => !overlaps(p), 24);

function scatterProps(): BastionProp[] {
  return scatter<BastionKind>({
    seed: 16041, tries: 12000, max: 90, hand: HAND, branches: BA_BRANCHES, hw: BA_HW, gap: 1.7,
    pick: (x, y, rnd) => {
      // nur ausserhalb von Mauer und Graben (Hof ist bewusst leer von Baeumen), dichter an den Raendern
      if (x > 168 && x < 612 && y > 4 && y < 356) return null;
      const edge = Math.min(x, MAP_W - x, y * 1.4, (MAP_H - y) * 1.2);
      if (rnd() > (edge < 50 ? 0.9 : 0.25)) return null;
      const k = rnd();
      const kind: BastionKind = k < 0.28 ? 'pine' : k < 0.45 ? 'oak' : k < 0.58 ? 'dead' : k < 0.78 ? 'bush' : k < 0.92 ? 'rock' : 'grave';
      return P(kind, x, y, Math.floor(rnd() * 2));
    },
    free: (p) => !overlaps(p),
  });
}
export const BASTION_PROPS: BastionProp[] = (() => [...HAND, ...scatterProps()].sort((a, b) => a.y - b.y))();

/** Alle Blocker: Dinge, Mauer-Kreisketten und die Grundflaeche des Bergfrieds. */
export function blockers(): [number, number, number][] {
  const props = blockersOf(BASTION_PROPS, raw.buildArea, (q) => q.kind === 'tower' && false);
  return [...props, ...wallBlockers(), ...fillCircles(KEEP_POLY.map(([x, y]) => [x, y] as Pt), 9)];
}

// ---------- Malen ----------
const MOATW: WaterStyle = { shallow: C.sky, mid: C.navy, deep: C.night, glint: C.ice, foam: C.silver, tint: C.pine, shore: C.night };

function grass(x: number, y: number): number {
  const n = fbm(x, y, 7);
  const lit = n - 0.5 + (bayer(x, y) - 0.5) * 0.1 + (vnoise(x, y, 70, 13) - 0.5) * 0.2;
  let c = lit > 0.16 ? C.grass : lit > -0.05 ? (bayer(x, y + 1) < 0.5 ? C.pine : C.grass) : lit > -0.2 ? C.pine : C.deep;
  if (lit > 0.3 && bayer(x + 1, y) < 0.3) c = C.leaf;
  const mud = vnoise(x, y, 22, 14);
  if (mud > 0.7 && bayer(x, y) < (mud - 0.7) * 4) c = mud > 0.8 ? C.bark : C.wood;
  const wx = Math.max(0, (120 - x) / 120);
  if (wx > 0.3 && (c === C.deep || c === C.pine) && bayer(x + 3, y + 1) < wx * 0.5) c = C.violet;
  return c;
}

/** Hofpflaster: Platten in versetzten Reihen, bemoost, stellenweise aufgebrochen. */
function flag(x: number, y: number): number {
  const row = Math.floor(y / 5), off = (row & 1) * 4, bx = Math.floor((x + off) / 8);
  const joint = y % 5 === 4 || (x + off) % 8 === 7;
  const k = hash2(bx, row, 21);
  let c = joint ? C.night : k > 0.66 ? C.stone : k > 0.25 ? C.slate : C.dusk;
  if (!joint && y % 5 === 0 && k > 0.25) c = k > 0.66 ? C.silver : C.stone;
  const moss = vnoise(x, y, 14, 22);
  if (moss > 0.62 && bayer(x, y) < (moss - 0.62) * 4) c = joint ? C.pine : bayer(x + 1, y + 1) < 0.5 ? C.grass : C.pine;
  const broken = vnoise(x, y, 26, 23);
  if (broken > 0.74 && bayer(x + 2, y) < (broken - 0.74) * 5) c = bayer(x, y + 1) < 0.4 ? C.wood : C.tan; // Erde schaut durch
  return c;
}

function road(x: number, y: number, pd: number, lit: number): number | null {
  if (pd > BA_HW + 2.2) return null;
  const edge = pd / BA_HW;
  if (pd <= BA_HW - 0.6) {
    // Randsteine (Bordstein), dann Mitte: Erde mit eingelassenen Kopfsteinen
    if (edge > 0.8) {
      const k = hash2(Math.floor((x + y) / 4), Math.floor((x - y) / 4), 33);
      return lit > 0 ? (k > 0.5 ? C.silver : C.stone) : (k > 0.5 ? C.stone : C.slate);
    }
    const row = Math.floor(y / 4), off = (row & 1) * 3, cx = Math.floor((x + off) / 6), lx = (x + off) % 6, ly = y % 4;
    const k = hash2(cx, row, 31);
    const cobble = k > 0.34 && !(lx === 5 || ly === 3 && k < 0.5) && !((lx === 0 || lx === 4) && (ly === 0 || ly === 2) && k < 0.7);
    if (cobble) {
      const t = k > 0.8 ? C.silver : k > 0.58 ? C.stone : C.slate;
      if (ly === 0 || lx === 0) return t === C.slate ? C.stone : t === C.stone ? C.silver : C.white;
      if (ly === 2 || lx === 4) return t === C.silver ? C.stone : t === C.stone ? C.slate : C.dusk;
      return t;
    }
    const n = vnoise(x, y, 3.5, 21);
    let c = n > 0.62 ? C.peach : n > 0.2 ? C.tan : C.wood;
    if (hash2(x, y, 32) > 0.97) c = C.sand;
    if (pd > 3.6 && pd < 5 && n < 0.6 && ((x + y) & 1) === 0) c = C.wood;
    return c;
  }
  if (pd <= BA_HW + 0.9) return lit > 0.2 ? C.white : lit > -0.25 ? C.silver : C.slate;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.silver : C.stone) : C.dusk;
}

export function paintBastion(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const water = new Field(sdf);

  // 1) Gras, Hof, Weg, Graben
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const pd = pcb.dist[i], wd = sdf[i];
    const [gx, gy] = gradOf(pcb.dist, x, y);
    const lit = -(gx * 0.6 + gy * 0.8);
    if (pd <= BA_HW + 2.2) { const c = road(x, y, pd, lit); if (c !== null) { ground.set(x, y, c); continue; } }
    if (wd < 0) {
      const [wx, wy] = water.grad(x, y);
      let c = waterBase(x, y, -wd, -(wx * 0.6 + wy * 0.8), MOATW, 4);
      if (pd < BA_HW + 6 && lit < -0.05 && bayer(x, y) < 0.75) c = shadeIdx(c);
      // Mauerschatten: die Mauer am Innenrand wirft aufs Wasser nach unten rechts (nur grobe Naehe)
      const duck = vnoise(x, y, 8, 15);
      if (duck > 0.72 && bayer(x + 1, y) < (duck - 0.72) * 4) c = C.pine;
      ground.set(x, y, c);
      continue;
    }
    let c: number;
    if (inCourt(x, y)) c = flag(x, y);
    else if (wd < 6 && x > 200 && x < 580 && y > 24 && y < 340 && rrSdf(x, y, MOAT.inn[0] - 6, MOAT.inn[1] - 6, MOAT.inn[2] + 6, MOAT.inn[3] + 6, 8) < 0) c = flag(x, y); // Kai um den Hof
    else c = grass(x, y);
    // Graben-Ufer: Steinkante (innen), Matsch/Gras (aussen)
    if (wd < 3) {
      const [wx, wy] = water.grad(x, y);
      const l2 = -(wx * 0.6 + wy * 0.8);
      const inner = x > 200 && x < 580 && y > 24 && y < 340 && rrSdf(x, y, MOAT.out[0] + 3, MOAT.out[1] + 3, MOAT.out[2] - 3, MOAT.out[3] - 3, 14) < 0;
      if (inner) c = wd < 1.4 ? (l2 > 0.1 ? C.white : C.silver) : (bayer(x, y) < 0.5 ? C.stone : C.slate);
      else c = wd < 1.6 ? (bayer(x, y) < 0.55 ? C.plum : C.bark) : (bayer(x + 1, y) < 0.5 ? C.bark : c);
    }
    if (pd < BA_HW + 4.2 && pd > BA_HW + 2 && lit < -0.12 && bayer(x, y) < 0.7) c = shadeIdx(c);
    ground.set(x, y, c);
  }

  // 2) Streu: Gras, Unkraut in den Fugen, Blumen
  const r = rng(20261047);
  const isGrass = (x: number, y: number): boolean => !inCourt(x, y) && waterAt(x, y) > 5 && at(pcb.dist, x, y) > BA_HW + 3 && !(x > 200 && x < 580 && y > 24 && y < 340);
  for (let i = 0; i < 1100; i++) {
    const x = Math.floor(r() * (W - 4)) + 2, y = Math.floor(r() * (H - 6)) + 4;
    if (!isGrass(x, y)) continue;
    const base = ground.get(x, y), dark = shadeIdx(base), light = base === C.deep || base === C.pine ? C.grass : C.leaf;
    ground.set(x, y, dark);
    const t = Math.floor(r() * 3);
    if (t === 0) { ground.set(x - 1, y - 1, dark); ground.set(x + 1, y - 1, dark); ground.set(x, y - 1, light); ground.set(x, y - 2, light); }
    else if (t === 1) { ground.set(x - 1, y, dark); ground.set(x + 1, y, dark); ground.set(x - 1, y - 1, light); ground.set(x + 1, y - 2, light); }
    else { ground.set(x + 1, y, dark); ground.set(x, y - 1, light); ground.set(x + 1, y - 2, light); }
  }
  for (let i = 0; i < 260; i++) { // Unkraut aus den Hofplatten
    const x = Math.floor(r() * (W - 4)) + 2, y = Math.floor(r() * (H - 6)) + 4;
    if (!inCourt(x, y) || at(pcb.dist, x, y) < BA_HW + 3) continue;
    ground.set(x, y, C.grass); ground.set(x, y - 1, C.leaf); if (r() < 0.5) ground.set(x + 1, y - 1, C.pine);
  }
  const FL = [C.violet, C.orchid, C.white, C.violet];
  for (let k = 0; k < 40; k++) {
    const cx = r() * W, cy = r() * H;
    if (!isGrass(Math.round(cx), Math.round(cy))) continue;
    const col = FL[Math.floor(r() * FL.length)];
    for (let j = 0; j < 4; j++) { const x = Math.round(cx + (r() - 0.5) * 12), y = Math.round(cy + (r() - 0.5) * 7); if (isGrass(x, y)) { ground.set(x, y + 1, C.pine); ground.set(x, y, col); } }
  }

  // 3) Dinge, Schatten
  const props: PlacedArt[] = placed(BASTION_PROPS, bastionArt);
  const keepArt = bastionArt('keep', 0);
  shadowPass(ground, [...props, { prop: { kind: 'keep', x: KEEP.x, y: KEEP.y, v: 0, r: 0 }, art: keepArt }]);

  // 4) Mauern (nach den Schatten, damit sie nicht verdunkelt werden)
  paintWalls(ground);

  // 5) Licht
  const lights: MapLight[] = [];
  for (const { prop, art } of props) {
    if (prop.kind === 'brazier') lights.push({ x: prop.x, y: prop.y + (art.hook?.y ?? -14), r: 30, warm: true, flicker: 'flame' });
    else if (prop.kind === 'lamp') lights.push({ x: prop.x, y: prop.y + (art.hook?.y ?? -22), r: 24, warm: true, flicker: 'flame' });
    else if (prop.kind === 'gatetower') lights.push({ x: prop.x, y: prop.y - 26, r: 14, warm: true, flicker: 'flame' });
    else if (prop.kind === 'tower') lights.push({ x: prop.x, y: prop.y - 28, r: 14, warm: true, flicker: 'flame' });
  }
  lights.push({ x: KEEP.x, y: KEEP.y - 24, r: 30, warm: true, flicker: 'flame' }, { x: KEEP.x - 38, y: KEEP.y - 50, r: 14, warm: true, flicker: 'flame' });
  for (const L of lights.filter((l) => l.warm && l.r >= 24)) {
    lightPool(ground, L.x, L.y + 16, 22, 14, (c) => c === C.slate ? C.stone : c === C.stone ? C.silver : c === C.dusk ? C.slate : c === C.grass ? C.leaf : c === C.pine ? C.grass : c === C.deep ? C.pine : c === C.night ? C.dusk : c, 0.8);
  }
  vignette(ground, 16, 0.8);

  // 6) Keep in den Boden backen? Nein: Dinge bleiben einzeln sortierbar. Der Bergfried ist eines davon.
  const keepProp: PlacedArt = { prop: { kind: 'keep', x: KEEP.x, y: KEEP.y, v: 0, r: 0 }, art: keepArt };
  const allProps = [...props, keepProp].sort((a, b) => a.prop.y - b.prop.y);

  const deco = new Buf(W, H);
  paintBridges(deco, water);
  paintMoatDeco(deco, water);
  const smoke: MapArt['smoke'] = [];
  const anim = Array.from({ length: ANIM_FRAMES }, (_, f) => paintAnim(f, water, props));
  void keepArt;
  return { id: 'bastion', name: 'Sunken Bastion', ground, anim, animMs: 140, deco, props: allProps, lights, smoke };
}

// ---------- Mauer malen ----------
function paintWalls(g: Buf): void {
  const T = WALL_T, face = 8;
  for (const s of WALL_SEGS) {
    if (s.b <= s.a) continue;
    const [x0, y0, x1, y1] = segRect(s);
    const horiz = s.wall === 'n' || s.wall === 's';
    // Schatten der Mauer auf den Boden (unten rechts)
    for (let y = y0 + (horiz ? T : 1); y < y1 + (horiz ? face + 3 : 1); y++) for (let x = x0 + 2; x < x1 + (horiz ? 0 : 5); x++) {
      if (horiz ? y < y1 + face : x < x1 + 3 && false) continue;
      if (bayer(x, y) < 0.8) g.set(x, y, shadeIdx(g.get(x, y)));
    }
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const along = horiz ? x : y;
      if (onBreach(s.wall, along)) continue;
      const u = horiz ? y - y0 : x - x0, row = Math.floor(along / 6);
      // Oberseite: Laufgang mit Platten
      let c = u < 1 ? C.white : u < 2 ? C.silver : u > T - 2 ? C.slate : (along + u * 3) % 7 === 0 ? C.slate : hash2(row, u, 41) > 0.5 ? C.stone : C.silver;
      if (hash2(x, y, 42) > 0.97) c = C.slate;
      g.set(x, y, c);
    }
    // Zinnen auf der Aussenseite (Nord: oben, Sued: oben, West: links, Ost: rechts)
    for (let a = s.a; a < s.b; a += 6) {
      if (onBreach(s.wall, a) || onBreach(s.wall, a + 3)) continue;
      for (let k = 0; k < 4; k++) {
        const along = Math.min(a + k, s.b - 1);
        if (horiz) { g.set(along, y0 - 1, k === 0 ? C.white : C.silver); g.set(along, y0 - 2, k === 0 ? C.white : C.stone); g.set(along, y0 - 3, C.slate); }
        else if (s.wall === 'w') { g.set(x0 - 1, along, C.silver); g.set(x0 - 2, along, C.stone); g.set(x0 - 3, along, C.slate); }
        else { g.set(x1, along, C.stone); g.set(x1 + 1, along, C.slate); g.set(x1 + 2, along, C.dusk); }
      }
    }
    if (horiz) {
      // Vorderseite: Quader in versetzten Reihen mit Moos und Rissen
      for (let y = y1; y < y1 + face; y++) for (let x = x0; x < x1; x++) {
        const along = x;
        if (onBreach(s.wall, along)) continue;
        const row = Math.floor((y - y1) / 3), off = (row & 1) * 4, bx = Math.floor((x + off) / 8);
        const joint = (y - y1) % 3 === 2 || (x + off) % 8 === 7;
        const k = hash2(bx, row + (s.wall === 's' ? 9 : 0), 43);
        const fx = (x - x0) / Math.max(1, x1 - x0);
        let c = joint ? C.dusk : fx < 0.15 || k > 0.7 ? C.stone : k > 0.3 ? C.slate : C.dusk;
        if ((y - y1) === 0 && !joint) c = C.stone;
        if ((y - y1) > face - 3 && hash2(bx, row, 44) < 0.3 && !joint) c = hash2(x, y, 45) > 0.5 ? C.grass : C.pine;
        if (hash2(x, y, 46) > 0.97) c = C.night;
        g.set(x, y, c);
      }
      for (let x = x0; x < x1; x += 2) { // Efeu, das von der Mauerkante haengt
        if (onBreach(s.wall, x)) continue;
        if (hash2(x, y1, 47) > 0.72) for (let k = 0; k < 2 + Math.floor(hash2(x, y1, 48) * 5); k++) g.set(x, y1 + k, k % 2 ? C.grass : C.pine);
      }
    } else {
      // Seitenflaeche rechts als dunkler Streifen (West/Ost), Fuss mit Moos
      for (let y = y0; y < y1; y++) { if (onBreach(s.wall, y)) continue; for (let k = 0; k < 3; k++) g.set(x1 + k, y, k === 0 ? C.slate : C.dusk); if (hash2(y, s.wall === 'w' ? 1 : 2, 49) > 0.7) g.set(x1 - 1 - Math.floor(hash2(y, 3, 49) * 3), y, C.pine); }
    }
    // Bruchstellen: Schutthaufen
    for (const b of BREACH) {
      if (b.wall !== s.wall) continue;
      const rr = rng(b.a * 7 + 3);
      for (let a = b.a; a <= b.b; a++) for (let k = 0; k < 3; k++) {
        const ox = horiz ? a : (s.wall === 'w' ? x0 : x0) + Math.floor(rr() * T) - 2, oy = horiz ? y0 + Math.floor(rr() * (T + face - 2)) : a;
        const px = horiz ? ox : x0 + Math.floor(rr() * (T + 2)) - 1, py = horiz ? oy : oy;
        const c = rr() > 0.6 ? C.stone : rr() > 0.4 ? C.slate : rr() > 0.2 ? C.silver : C.dusk;
        g.set(px, py, c); g.set(px + 1, py, shadeIdx(c));
      }
    }
  }
}

// ---------- Bruecken und Grabenrand ----------
const BRIDGES: { x0: number; x1: number; y: number }[] = [{ x0: 170, x1: 208, y: 146 }, { x0: 170, x1: 208, y: 214 }, { x0: 570, x1: 608, y: 180 }];
function paintBridges(d: Buf, water: Field): void {
  for (const br of BRIDGES) {
    const hw = BA_HW;
    // Schatten auf dem Wasser
    for (let y = br.y - hw - 1; y <= br.y + hw + 5; y++) for (let x = br.x0; x <= br.x1; x++) if (water.at(x, y) < 0 && y > br.y + hw && bayer(x, y) < 0.8) d.set(x, y, C.night);
    // Bruestungen oben und unten: Mauerwerk mit Kappe
    for (const sgn of [-1, 1]) {
      const yc = br.y + sgn * (hw + 1);
      for (let x = br.x0 - 1; x <= br.x1 + 1; x++) for (let k = -2; k <= 2; k++) {
        const y = yc + k;
        const joint = (x + (k & 1) * 3) % 6 === 5;
        d.set(x, y, k === (sgn < 0 ? -2 : 2) ? (sgn < 0 ? C.white : C.dusk) : joint ? C.dusk : k === -2 ? C.silver : (x + k) % 2 ? C.stone : C.slate);
      }
      for (const px of [br.x0 - 1, (br.x0 + br.x1) / 2 | 0, br.x1 - 1]) { d.rect(px, yc - 4, 4, 8, C.stone); d.rect(px, yc - 4, 4, 1, C.white); d.rect(px + 3, yc - 3, 1, 7, C.slate); }
    }
  }
}

/** Seerosen- und Schilfsaum, Steine im Graben (statisch). */
function paintMoatDeco(d: Buf, water: Field): void {
  const r = rng(808);
  for (let i = 0; i < 200; i++) {
    const x = Math.floor(r() * (MAP_W - 4)) + 2, y = Math.floor(r() * (MAP_H - 4)) + 2;
    const w = water.at(x, y);
    if (w > 0 || w < -2.5) continue;
    if (r() < 0.5) { d.set(x, y, C.silver); d.set(x + 1, y, C.stone); d.set(x, y + 1, C.slate); }
    else { d.set(x, y, C.pine); d.set(x, y - 1, C.grass); d.set(x + 1, y - 2, C.grass); }
  }
}

// ---------- Bewegte Ebene ----------
export const FLAGS: Pt[] = [];
function paintAnim(f: number, water: Field, props: PlacedArt[]): Buf {
  const b = waterFrame(f, ANIM_FRAMES, water, MOATW, { flow: [1, 0], sparkle: 0.9975, minDep: 1.5 });
  const r = rng(515);
  // Seerosen
  for (let i = 0; i < 34; i++) {
    const lx = Math.floor(r() * (MAP_W - 20)) + 10, ly = Math.floor(r() * (MAP_H - 20)) + 10, ph = Math.floor(r() * ANIM_FRAMES);
    if (water.at(lx, ly) > -6 || at(pcb.dist, lx, ly) < BA_HW + 8) continue;
    const bob = Math.round(Math.sin(((f + ph) / ANIM_FRAMES) * Math.PI * 2) * 0.6), y = ly + bob;
    b.ellipse(lx, y, 3.5, 2, C.pine); b.ellipse(lx - 1, y - 1, 2.5, 1.2, C.grass);
    b.set(lx + 2, y, C.navy); b.set(lx + 3, y, C.navy);
    if (i % 3 === 0) { b.set(lx - 1, y - 1, C.white); b.set(lx, y - 2, C.coral); }
  }
  // Fahnen an den Tuermen und Banner im Hof: Tuch flattert (Spalten wellen um +-1 px)
  const wave = (hx: number, hy: number, len: number, hgt: number, cols: [number, number], phase: number): void => {
    for (let x = 0; x < len; x++) {
      const k = (f / ANIM_FRAMES) * Math.PI * 2 - x * 0.7 + phase;
      const dy = Math.round(Math.sin(k) * (0.5 + (x / len) * 1.1));
      const hh = hgt - Math.floor(x / 4);
      for (let y = 0; y < hh; y++) b.set(hx + 1 + x, hy + y + dy, (y === 0 ? cols[1] : y === hh - 1 && x > len / 2 ? C.plum : x % 5 === 3 ? C.amber : cols[0]));
    }
  };
  props.forEach(({ prop, art }, i) => {
    if (prop.kind === 'tower' || prop.kind === 'gatetower') wave(prop.x + (art.hook?.x ?? 1), prop.y + (art.hook?.y ?? -50) - 1, 11, 7, [C.crimson, C.red], i);
    else if (prop.kind === 'brazier') {
      // Flamme: vier Formen im Wechsel
      const fx = prop.x, fy = prop.y + (art.hook?.y ?? -14) + 2, k = (f + i) % 4;
      const h = [4, 6, 5, 6][k], sway = [0, 1, 0, -1][k];
      for (let y = 0; y < h; y++) { const w = y < h - 3 ? 3 : y < h - 1 ? 2 : 1; for (let x = -Math.floor(w / 2); x <= Math.floor(w / 2); x++) b.set(fx + x + (y > 2 ? sway : 0), fy - y, y > h - 3 ? C.yellow : y > 1 ? C.amber : C.orange); }
      b.set(fx + (k % 2 ? 1 : -1), fy - h, C.orange); b.set(fx, fy - 1, C.red);
    }
  });
  return b;
}
void brazier; void vnoise; void MAP_H;
