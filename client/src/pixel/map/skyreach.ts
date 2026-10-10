/**
 * Skyreach Cliffs (Runde 16 / K1): Berg-Serpentinen, Advanced. Zwei Eingaenge (oben/unten, gespiegelt, gleich lang, ~1.170 px
 * je Ast): je drei Laeufe mit Kehren, ueber die Schlucht A (zwei Haengebruecken) zum Zusammenfluss, danach ueber Schlucht B
 * (dritte Bruecke) zum Ausgang. Wege aus `sim/data/maps/skyreach.json` (scripts/gen-r16-paths.mjs).
 * Schluchten (unbebaubar), das Felsmassiv im Nordosten und der Bach samt Wasserfall stehen als `blockers`, der Bergsee als `water`
 * (scripts/gen-maps.ts schreibt beides zurueck). Licht von oben links, klare kalte Hoehenluft; Wolken und Adler kommen aus ambient.ts.
 * Bewegt (Bildfolge): Nebel in den Schluchten, Bruecken (Seile, Planken), Bergsee, Bach, Wasserfall, Feuer, Fahnen, Wolkenbaenke am Rand.
 */
import skyreach from '../../../../sim/data/maps/skyreach.json';
import { bayer, Buf, C, fbm, hash2, rng, shadeIdx, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { closedSpline, Field, inPoly, pathDistAll, polySdf, simplify, walk, type Pt } from './kit';
import { skyArt, type SkyKind } from './props-sky';
import { at, blockersOf, chain, fillCircles, gradOf, lightPool, nudge, pathCoordsOf, placed, scatter, shadowPass, spriteOver, vignette, waterBase, waterFrame, type SceneProp, type WaterStyle } from './scene';
import type { MapArt, MapLight, PlacedArt } from './types';

const raw = skyreach as unknown as { path: Pt[]; paths?: Pt[][]; pathHalfWidth: number; buildArea: [number, number, number, number] };
export const SK_BRANCHES: Pt[][] = raw.paths ?? [raw.path];
export const SK_HW: number = raw.pathHalfWidth;
export const ANIM_FRAMES = 8;
const pcs = pathCoordsOf(SK_BRANCHES);

// ---------- Schluchten ----------
/** Schlucht als Band: Mittellinie x(y) und Halbbreite hw(y), von ueber dem oberen bis unter den unteren Bildrand. */
function gorge(cx: (y: number) => number, hw: (y: number) => number): Pt[] {
  const L: Pt[] = [], R: Pt[] = [];
  for (let y = -8; y <= MAP_H + 8; y += 4) { L.push([Math.round(cx(y) - hw(y)), y]); R.push([Math.round(cx(y) + hw(y)), y]); }
  return [...L, ...R.reverse()];
}
/** Schlucht A (x ~ 392): quert beide Aeste auf dem dritten Lauf, zwei Bruecken. Schlucht B (x ~ 596): quert den gemeinsamen Ausgang. */
export const GORGE_A: Pt[] = gorge((y) => 392 + 13 * Math.sin(y / 57) + 3 * Math.sin(y / 17 + 1), (y) => 19 + 3 * Math.sin(y / 19 + 1));
export const GORGE_B: Pt[] = gorge((y) => 598 + 7 * Math.sin(y / 43 + 1), (y) => 14 + 2 * Math.sin(y / 17));
export const GORGES: Pt[][] = [GORGE_A, GORGE_B];
const gsd = polySdf(GORGES);
export const gorgeAt = (x: number, y: number): number => gsd[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];

// ---------- Bergsee, Bach, Massiv ----------
const LAKE_CTRL: Pt[] = [[450, 88], [460, 72], [486, 63], [516, 64], [542, 74], [552, 92], [538, 109], [508, 115], [478, 111], [458, 102]];
export const LAKE: Pt[] = closedSpline(LAKE_CTRL, 3);
export const waterPolygons = (): Pt[][] => [simplify(LAKE, 3)];
const lakeSdf = polySdf([LAKE]);
export const lakeAt = (x: number, y: number): number => lakeSdf[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];
/** Felseninsel im See (Kiefer), bebaubar ist sie nicht: sie liegt im Wasser-Polygon der Sim als Loch nicht abbildbar, daher bleibt sie dekorativ. */
const ISLET = { x: 512, y: 92, rx: 7, ry: 4 };
/** Bach vom See zur Schlucht A (Wasserfall am Westende). */
export const CREEK: Pt[] = [[449, 90], [440, 92], [431, 90], [423, 93], [414, 95], [405, 96]];
const MASSIF: Pt[] = closedSpline([[432, -10], [590, -10], [590, 30], [566, 46], [534, 40], [504, 50], [474, 44], [446, 34]], 3);
const massifSdf = polySdf([MASSIF]);
export const massifAt = (x: number, y: number): number => massifSdf[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];
const creekD = (x: number, y: number): number => pathDistAll([CREEK], x, y);

// ---------- Bruecken: die Wegstuecke in den Schluchten (plus 5 px Rand) ----------
export interface Span { pts: Pt[] }
export const BRIDGES: Span[] = (() => {
  const out: Span[] = [];
  for (const br of SK_BRANCHES) {
    const pts = walk(br, 1).map((p): Pt => [p.x, p.y]);
    let run: Pt[] = [];
    const flush = (): void => {
      if (run.length > 8) {
        const key = Math.round(run[0][0] / 6) + ':' + Math.round(run[0][1] / 6);
        if (!out.some((s) => Math.round(s.pts[0][0] / 6) + ':' + Math.round(s.pts[0][1] / 6) === key)) out.push({ pts: run });
      }
      run = [];
    };
    for (const p of pts) { if (gorgeAt(p[0], p[1]) < 5.5) run.push(p); else flush(); }
    flush();
  }
  return out;
})();
const onBridge = (x: number, y: number): boolean => BRIDGES.some((b) => pathDistAll([b.pts], x, y) < SK_HW + 4);

// ---------- Dinge ----------
export type SkyProp = SceneProp<SkyKind>;
export const SKY_R: Record<SkyKind, number> = {
  pine: 4, larch: 3, boulder: 7, spire: 7, cairn: 3, hut: 15, watchtower: 10, beacon: 3, goat: 0, tent: 11, banner: 2, campfire: 5,
  gatepost: 4, sign: 2, shrub: 3, snowrock: 5, plank: 5, flagpole: 2,
};
const P = (kind: SkyKind, x: number, y: number, v = 0): SkyProp => ({ kind, x, y, v, r: SKY_R[kind] });

export function overlaps(p: SkyProp): boolean {
  const art = skyArt(p.kind, p.v);
  if (spriteOver(art, p, (x, y) => at(pcs.dist, x, y) < SK_HW + 1) > 0) return true;
  if (p.x < 4 || p.x > MAP_W - 4 || p.y < 10 || p.y > MAP_H - 2) return true;
  if (gorgeAt(p.x, p.y) < 3.5 || lakeAt(p.x, p.y) < 3 || creekD(p.x, p.y) < 5) return true;
  // Fuss liegt auf dem Riser (Stuetzmauer) unter einem Lauf
  const d = at(pcs.dist, p.x, p.y - 2);
  if (d < SK_HW + 6 && p.r > 0 && d > SK_HW - 1) return true;
  return false;
}
const inMassif = (x: number, y: number): boolean => massifAt(x, y) < 0;

const HAND_RAW: SkyProp[] = [
  // Westtal: Huette, Ziegen, Zelt, Lager
  P('hut', 34, 196), P('goat', 52, 216, 0), P('goat', 16, 226, 1), P('campfire', 30, 244), P('tent', 36, 270, 0), P('sign', 58, 78), P('sign', 58, 282, 0),
  P('cairn', 22, 128), P('cairn', 22, 232), P('banner', 14, 76, 0), P('banner', 14, 284, 1), P('pine', 10, 150), P('pine', 12, 214, 1),
  // Mittelgrat zwischen den beiden dritten Laeufen
  P('cairn', 150, 180), P('goat', 210, 183, 1), P('cairn', 262, 180), P('boulder', 322, 172, 0), P('goat', 188, 177, 0),
  // Streifen zwischen den Laeufen: Felsen, Kiefern
  P('boulder', 120, 68, 0), P('pine', 176, 66, 1), P('shrub', 230, 70, 0), P('snowrock', 78, 62, 0), P('pine', 250, 125, 0), P('boulder', 160, 125, 1), P('shrub', 112, 122, 1),
  P('boulder', 120, 292, 1), P('pine', 176, 294, 0), P('shrub', 230, 290, 1), P('snowrock', 78, 298, 1), P('pine', 250, 235, 1), P('boulder', 160, 235, 0), P('shrub', 112, 238, 0),
  // Nordwest: Eingang
  P('gatepost', 20, 22, 0), P('gatepost', 20, 58, 1), P('pine', 56, 14, 1), P('pine', 94, 12, 0), P('larch', 140, 14, 0), P('pine', 188, 12, 1), P('boulder', 236, 14, 1), P('larch', 286, 14, 1),
  P('gatepost', 20, 302, 1), P('gatepost', 20, 338, 0), P('pine', 56, 346, 0), P('pine', 94, 348, 1), P('larch', 140, 346, 1), P('pine', 188, 348, 0), P('boulder', 236, 346, 0), P('larch', 286, 346, 0),
  // Plateau zwischen den Kehren (Ost der Schlucht-Westseite)
  P('watchtower', 336, 118), P('beacon', 360, 62), P('larch', 342, 34, 0), P('pine', 322, 82, 1), P('flagpole', 352, 142), P('pine', 316, 18, 0),
  P('beacon', 360, 298), P('larch', 342, 326, 1), P('pine', 322, 278, 0), P('flagpole', 352, 218), P('pine', 316, 342, 1), P('boulder', 338, 244, 1),
  // Massiv (Nordost): Nadeln
  P('spire', 456, 22, 0), P('spire', 484, 30, 1), P('spire', 512, 20, 0), P('spire', 542, 28, 1), P('spire', 568, 18, 0), P('boulder', 470, 40, 0), P('snowrock', 530, 38, 9), P('boulder', 556, 40, 1),
  // Ufer des Bergsees
  P('larch', 436, 112, 0), P('pine', 442, 66, 1), P('shrub', 470, 124, 0), P('boulder', 556, 108, 0), P('shrub', 528, 122, 1), P('pine', 560, 70, 1), P('larch', 568, 90, 0), P('cairn', 504, 128),
  // Mitte-Ost: Zusammenfluss, Ausgang
  P('watchtower', 566, 140), P('flagpole', 612, 150), P('gatepost', 626, 166, 0), P('gatepost', 626, 196, 1), P('banner', 630, 150, 0), P('banner', 630, 214, 1),
  P('boulder', 450, 214, 1), P('pine', 470, 130, 0), P('boulder', 440, 138, 0), P('snowrock', 560, 214, 9),
  // Suedost: Lager, Huette
  P('hut', 484, 262), P('tent', 438, 262, 1), P('campfire', 462, 290), P('goat', 450, 300, 0), P('goat', 512, 296, 1), P('watchtower', 560, 262), P('plank', 424, 218), P('plank', 424, 142),
  P('tent', 524, 306, 0), P('larch', 560, 322, 1), P('pine', 440, 330, 0), P('boulder', 500, 332, 1), P('pine', 540, 340, 0),
  // rechter Rand
  P('pine', 622, 24, 0), P('larch', 624, 50, 1), P('pine', 626, 86, 1), P('pine', 622, 118, 0), P('boulder', 624, 236, 0), P('pine', 624, 262, 1), P('larch', 626, 300, 0), P('pine', 622, 336, 1),
];
const HAND: SkyProp[] = nudge(HAND_RAW, (p) => !overlaps(p), 22);

function scatterProps(): SkyProp[] {
  return scatter<SkyKind>({
    seed: 16071, tries: 14000, max: 120, hand: HAND, branches: SK_BRANCHES, hw: SK_HW, gap: 1.6,
    pick: (x, y, rnd) => {
      if (inMassif(x, y)) return null;
      const edge = Math.min(x, MAP_W - x, y * 1.3, (MAP_H - y) * 1.1);
      const lip = gorgeAt(x, y);
      if (lip < 9 && rnd() < 0.5) return P(rnd() < 0.6 ? 'boulder' : 'cairn', x, y, Math.floor(rnd() * 2)); // Steine am Rand der Schlucht
      if (rnd() > (edge < 48 ? 0.8 : 0.22 + (vnoise(x, y, 50, 33) > 0.58 ? 0.3 : 0))) return null;
      const k = rnd();
      const north = y < 150 && x > 300;
      const kind: SkyKind = k < (north ? 0.3 : 0.4) ? 'pine' : k < 0.55 ? 'larch' : k < 0.72 ? 'shrub' : k < 0.88 ? 'boulder' : k < 0.95 ? 'snowrock' : 'cairn';
      return P(kind, x, y, kind === 'snowrock' ? (rnd() < 0.5 ? 9 : 0) : Math.floor(rnd() * 2));
    },
    free: (p) => !overlaps(p),
  });
}
export const SKY_PROPS: SkyProp[] = (() => [...HAND, ...scatterProps()].sort((a, b) => a.y - b.y))();

/** Kleinkram sperrt keinen Bauplatz (Zierde). */
const SMALL = new Set<string>(['shrub', 'cairn', 'snowrock', 'sign', 'plank', 'campfire', 'flagpole', 'banner', 'goat']);
/** Blocker: Dinge mit Radius, Schluchten und Massiv als gefuellte Kreise, der Bach als Kette. */
export function blockers(): [number, number, number][] {
  const props = blockersOf(SKY_PROPS, raw.buildArea, (q) => inMassif(q.x, q.y) || SMALL.has(q.kind));
  const far = (x: number, y: number): boolean => at(pcs.dist, x, y) < SK_HW + 1;
  const gorges = GORGES.flatMap((g) => fillCircles(g, 7, far));
  const massif = fillCircles(MASSIF, 8, (x, y) => at(pcs.dist, x, y) < SK_HW + 8 || x < 0 || y < 0);
  return [...props, ...gorges, ...massif, ...chain(CREEK, 3, (x, y) => gorgeAt(x, y) < 5)];
}

// ---------- Malen ----------
const TARN: WaterStyle = { shallow: C.ice, mid: C.sky, deep: C.navy, glint: C.white, foam: C.white, shore: C.navy };
const BECK: WaterStyle = { shallow: C.silver, mid: C.sky, deep: C.navy, glint: C.white, foam: C.white, shore: C.navy };

/** Fels mit Schichten: Platten ueber den Boden, Licht von oben links. `lit` > 0 hell. */
function rockTone(x: number, y: number, lit: number): number {
  const strata = Math.floor(y / 4 + vnoise(x, y, 18, 51) * 3 + Math.sin(x / 31) * 1.2);
  const k = hash2(strata, x >> 3, 52);
  let c = lit > 0.25 ? (k > 0.5 ? C.silver : C.stone) : lit > -0.2 ? (k > 0.55 ? C.stone : C.slate) : (k > 0.5 ? C.slate : C.dusk);
  if (y % 4 === 3 && k > 0.3) c = shadeIdx(c);
  if (hash2(x, y, 53) > 0.965) c = shadeIdx(c);
  return c;
}

function meadow(x: number, y: number): number {
  const n = fbm(x, y, 9);
  const lit = n - 0.5 + (bayer(x, y) - 0.5) * 0.1 + (vnoise(x, y, 64, 14) - 0.5) * 0.2;
  let c = lit > 0.2 ? C.leaf : lit > 0.0 ? C.grass : lit > -0.14 ? (bayer(x, y + 1) < 0.5 ? C.pine : C.grass) : lit > -0.26 ? C.pine : C.deep;
  if (lit > 0.34 && bayer(x + 1, y) < 0.35) c = C.leaf;
  // Fels tritt aus dem Rasen
  const rk = vnoise(x, y, 26, 31) + (x > 300 && y < 130 ? 0.06 : 0);
  if (rk > 0.64 && bayer(x, y) < (rk - 0.64) * 6) c = rockTone(x, y, lit * 2);
  // Schnee in den Hoehen (Nordosten, Raender) und im Schatten
  const sk = vnoise(x, y, 34, 35) + (y < 70 ? 0.1 : 0) + (x > 560 ? 0.08 : 0);
  if (sk > 0.8 && bayer(x + 2, y + 1) < (sk - 0.8) * 14) c = sk > 0.86 ? C.white : bayer(x, y) < 0.5 ? C.silver : C.white;
  return c;
}

/** Bergpfad: festgetretene Erde mit Kies, Rand aus Steinen. */
function trail(x: number, y: number, pd: number, lit: number): number | null {
  if (pd > SK_HW + 2.2) return null;
  const edge = pd / SK_HW;
  if (pd <= SK_HW - 0.6) {
    if (edge > 0.82) {
      const k = hash2(Math.floor((x + y) / 3), Math.floor((x - y) / 3), 61);
      return lit > 0 ? (k > 0.5 ? C.silver : C.stone) : (k > 0.5 ? C.stone : C.slate);
    }
    const n = vnoise(x, y, 5, 62), m = vnoise(x, y, 2.2, 66);
    let c = n > 0.66 ? (bayer(x, y) < 0.35 + (n - 0.66) * 3 ? C.peach : C.tan) : n > 0.3 ? C.tan : (bayer(x, y + 1) < 0.5 + (0.3 - n) * 1.5 ? C.wood : C.tan);
    if (m > 0.8 && bayer(x + 1, y) < 0.5) c = C.peach;
    if (hash2(x, y, 63) > 0.975) c = hash2(x, y, 64) > 0.5 ? C.stone : C.silver; // Kiesel
    if (pd > 4 && pd < 5.2 && n < 0.5 && ((x + y) & 1) === 0) c = C.wood; // Fahrrillen
    return c;
  }
  if (pd <= SK_HW + 0.9) return lit > 0.2 ? C.white : lit > -0.25 ? C.silver : C.slate;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.silver : C.stone) : C.dusk;
}

/** Schlucht: Wandflaeche am Rand, nach innen immer dunkler, ganz unten ein Rinnsal. */
function chasm(x: number, y: number, gd: number, gx: number, gy: number): number {
  // gx, gy: Gradient des Abstandsfelds (zeigt aus der Schlucht hinaus)
  const faceW = 3 + 5 * Math.max(0, -gy) + (gx > 0.3 ? 0 : 1.5);
  const d = -gd;
  if (d < faceW) {
    // Felswand: Licht von links oben, die Ostwand (zeigt nach Westen) ist hell, die Nordwand dunkel
    const lit = gx > 0 ? -0.4 - gx * 0.2 : 0.2 - gx * 0.4 + Math.max(0, gy) * 0.6;
    let c = rockTone(x, y, lit - (d / faceW) * 0.35);
    if (d < 1.2) c = lit > 0 ? C.stone : C.slate; // Lippe
    return c;
  }
  const depth = d - faceW;
  const n = vnoise(x, y, 9, 71), m = vnoise(x + 40, y, 4.5, 73);
  // Tiefe: dunkel, blauer Dunst am Grund (Wolken kommen als bewegte Schwaden darueber)
  if (depth < 2) return bayer(x, y) < 0.7 ? C.ink : C.night;
  if (depth < 5) return bayer(x + 1, y) < 0.5 ? C.night : C.dusk;
  let c = n > 0.72 ? C.slate : n > 0.5 ? C.dusk : C.night;
  if (m > 0.62 && bayer(x, y) < 0.45) c = n > 0.5 ? C.slate : C.navy;
  if (hash2(x, y, 74) > 0.985) c = C.stone;
  return c;
}

export function paintSkyreach(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const lake = new Field(lakeSdf);
  const gorgeF = new Field(gsd);

  // 1) Boden: Wiese, Fels, Schnee, Pfad, Stuetzmauern, Schlucht, See, Bach, Massiv
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const gd = gsd[i], pd = pcs.dist[i], ld = lakeSdf[i], md = massifSdf[i];
    const [gx, gy] = gradOf(pcs.dist, x, y);
    const lit = -(gx * 0.6 + gy * 0.8);
    if (gd < 0) { const [sx, sy] = gorgeF.grad(x, y); ground.set(x, y, chasm(x, y, gd, sx, sy)); continue; }
    if (ld < 0) {
      const [wx, wy] = lake.grad(x, y);
      ground.set(x, y, waterBase(x, y, -ld, -(wx * 0.6 + wy * 0.8), TARN, 8));
      continue;
    }
    const cd = creekD(x, y);
    if (cd < 2.6 && gd > 1.5) { ground.set(x, y, cd < 1.2 ? (bayer(x, y) < 0.5 ? C.sky : C.ice) : bayer(x, y) < 0.5 ? C.silver : C.navy); continue; }
    if (pd <= SK_HW + 2.2) { const c = trail(x, y, pd, lit); if (c !== null) { ground.set(x, y, c); continue; } }
    let c: number;
    if (md < 0) {
      const [mx, my] = gradOf(massifSdf, x, y);
      const l2 = -(mx * 0.6 + my * 0.8) * 0.7 + (vnoise(x, y, 14, 81) - 0.5) * 0.9;
      c = rockTone(x, y, l2);
      if (y < 34 && vnoise(x, y, 11, 82) > 0.46 - (34 - y) * 0.006) c = bayer(x, y) < 0.5 ? C.white : C.silver; // Schneekappen
    } else c = meadow(x, y);
    // Stuetzmauer (Riser) unter jedem Lauf: Trockenmauer, dunkler, mit Moos oben
    if (gy > 0.55 && pd > SK_HW + 0.9 && pd < SK_HW + 7.4 && md >= 0 && gd > 2) {
      const d = pd - SK_HW - 0.9, row = Math.floor(d / 2.2), off = (row & 1) * 3, bx = Math.floor((x + off) / 7);
      const joint = d - row * 2.2 > 1.7 || (x + off) % 7 === 6;
      const k = hash2(bx, row, 91);
      c = joint ? C.dusk : d < 1.5 ? (k > 0.5 ? C.silver : C.stone) : k > 0.55 ? C.stone : k > 0.2 ? C.slate : C.dusk;
      if (d > 4.2) c = joint ? C.night : k > 0.5 ? C.slate : C.dusk;
      if (d < 1.3 && bayer(x, y) < 0.3) c = C.leaf;
    } else if (gy > 0.4 && pd > SK_HW + 7.2 && pd < SK_HW + 10.5 && bayer(x, y) < 0.55) c = shadeIdx(c); // Schlagschatten der Mauer
    // Lippe der Schlucht: heller Rasenrand, abgebrochen
    if (gd < 3.2 && md >= 0 && ld > 0) {
      const [sx, sy] = gorgeF.grad(x, y);
      const l2 = -(sx * 0.6 + sy * 0.8);
      if (gd < 1.6) c = l2 > 0.1 ? C.silver : l2 > -0.3 ? C.stone : C.slate;
      else if (bayer(x, y) < 0.55) c = l2 > 0 ? C.stone : C.slate;
    }
    // Seeufer: Kies, nasser Fels, Schnee
    if (ld < 4.5) {
      const [wx, wy] = lake.grad(x, y);
      const l2 = -(wx * 0.6 + wy * 0.8);
      if (ld < 1.7) c = l2 > 0.2 ? C.silver : l2 > -0.3 ? C.stone : C.slate;
      else if (ld < 3.4) c = bayer(x, y) < 0.5 + l2 * 0.25 ? (l2 > 0 ? C.silver : C.stone) : c;
      else if (bayer(x + 1, y) < 0.3) c = l2 > 0 ? C.white : c;
    }
    ground.set(x, y, c);
  }

  // 2) Streu: Grasbueschel, Bergblumen (Enzian, Edelweiss), Steinchen
  const r = rng(20261058);
  const isTurf = (x: number, y: number): boolean => gorgeAt(x, y) > 5 && lakeAt(x, y) > 5 && massifAt(x, y) > 1 && at(pcs.dist, x, y) > SK_HW + 7 && ground.get(x, y) !== C.white && ground.get(x, y) !== C.silver && [C.leaf, C.grass, C.pine, C.deep].includes(ground.get(x, y));
  for (let i = 0; i < 1500; i++) {
    const x = Math.floor(r() * (W - 4)) + 2, y = Math.floor(r() * (H - 6)) + 4;
    if (!isTurf(x, y)) continue;
    const base = ground.get(x, y), dark = shadeIdx(base), light = base === C.deep || base === C.pine ? C.grass : C.leaf;
    ground.set(x, y, dark);
    const t = Math.floor(r() * 3);
    if (t === 0) { ground.set(x - 1, y - 1, dark); ground.set(x + 1, y - 1, dark); ground.set(x, y - 1, light); ground.set(x, y - 2, light); }
    else if (t === 1) { ground.set(x - 1, y, dark); ground.set(x + 1, y, dark); ground.set(x - 1, y - 1, light); ground.set(x + 1, y - 2, light); }
    else { ground.set(x + 1, y, dark); ground.set(x, y - 1, light); ground.set(x + 1, y - 2, light); }
  }
  const FL = [C.sky, C.white, C.violet, C.yellow, C.white, C.ice];
  for (let k = 0; k < 110; k++) {
    const cx = r() * W, cy = r() * H;
    if (!isTurf(Math.round(cx), Math.round(cy))) continue;
    const col = FL[Math.floor(r() * FL.length)];
    for (let j = 0; j < 5; j++) {
      const x = Math.round(cx + (r() - 0.5) * 14), y = Math.round(cy + (r() - 0.5) * 8);
      if (!isTurf(x, y)) continue;
      ground.set(x, y + 1, C.pine); ground.set(x, y, col);
      if (col === C.white) { ground.set(x - 1, y, C.silver); ground.set(x + 1, y, C.silver); ground.set(x, y - 1, C.silver); ground.set(x, y, C.yellow); }
    }
  }
  for (let i = 0; i < 520; i++) { // Steinchen am Pfad
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    const pd = at(pcs.dist, x, y);
    if (pd < SK_HW + 0.8 || pd > SK_HW + 3.2 || gorgeAt(x, y) < 3 || lakeAt(x, y) < 2) continue;
    if (hash2(x >> 2, y >> 2, 31) > 0.45) continue;
    ground.set(x, y, C.silver); ground.set(x + 1, y, C.stone); ground.set(x, y + 1, C.slate);
  }

  // 3) Dinge, Schatten, Seeinsel
  const props: PlacedArt[] = placed(SKY_PROPS, skyArt);
  shadowPass(ground, props, (c) => c === C.sky || c === C.navy || c === C.ice || c === C.ink || c === C.night);
  // Inselchen: Felsbuckel mit Kiefer (Teil des Bodens, im See)
  ground.each(ISLET.x, ISLET.y, ISLET.rx, ISLET.ry, (x, y) => { const lit = -(x - ISLET.x) / ISLET.rx * 0.5 - (y - ISLET.y) / ISLET.ry * 0.8; ground.set(x, y, lit > 0.3 ? C.silver : lit > -0.3 ? C.stone : C.slate); });
  for (let x = ISLET.x - 8; x <= ISLET.x + 8; x++) if (ground.get(x, ISLET.y + ISLET.ry + 1) === C.sky || ground.get(x, ISLET.y + ISLET.ry + 1) === C.navy) ground.set(x, ISLET.y + ISLET.ry + 1, C.navy);

  // 4) Licht
  const lights: MapLight[] = [];
  const smoke: MapArt['smoke'] = [];
  for (const { prop, art } of props) {
    if (prop.kind === 'watchtower' || prop.kind === 'beacon') lights.push({ x: prop.x, y: prop.y + (art.hook?.y ?? -40), r: prop.kind === 'beacon' ? 22 : 26, warm: true, flicker: 'flame' });
    else if (prop.kind === 'campfire') lights.push({ x: prop.x, y: prop.y - 5, r: 26, warm: true, flicker: 'flame' });
    else if (prop.kind === 'hut') { lights.push({ x: prop.x + 8, y: prop.y - 14, r: 18, warm: true, flicker: 'flame' }); smoke.push({ x: prop.x + (art.hook?.x ?? 10), y: prop.y + (art.hook?.y ?? -41) + 2 }); }
    else if (prop.kind === 'gatepost') lights.push({ x: prop.x, y: prop.y - 46, r: 16, warm: true, flicker: 'flame' });
  }
  smoke.push(...props.filter((p) => p.prop.kind === 'campfire').map((p) => ({ x: p.prop.x, y: p.prop.y - 9 })));
  for (const L of lights.filter((l) => l.warm && l.r >= 22)) {
    lightPool(ground, L.x, L.y + 18, 20, 13, (c) => c === C.slate ? C.stone : c === C.stone ? C.silver : c === C.grass ? C.leaf : c === C.pine ? C.grass : c === C.deep ? C.pine : c === C.wood ? C.tan : c === C.tan ? C.peach : c, 0.8);
  }
  vignette(ground, 14, 0.55, (c) => c === C.ink);

  const deco = new Buf(W, H);
  paintRails(deco);
  const anim = Array.from({ length: ANIM_FRAMES }, (_, f) => paintAnim(f, lake, gorgeF, props));
  return { id: 'skyreach', name: 'Skyreach Cliffs', ground, anim, animMs: 150, deco, props, lights, smoke };
}

/** Holzgelaender an der Aussenseite der Kehren: Pfosten alle 7 px, dazwischen eine Latte. */
function paintRails(d: Buf): void {
  for (const br of SK_BRANCHES) {
    const pts = walk(br, 5);
    let prev: Pt | null = null;
    for (let i = 2; i < pts.length - 2; i++) {
      const a = pts[i - 2], b = pts[i + 2];
      const turn = a.dx * b.dy - a.dy * b.dx; // > 0: Rechtskurve (y nach unten)
      if (Math.abs(turn) < 0.45 || gorgeAt(pts[i].x, pts[i].y) < 12) { prev = null; continue; }
      const sgn = turn > 0 ? -1 : 1; // Aussenseite
      const p = pts[i];
      const x = Math.round(p.x - p.dy * sgn * (SK_HW + 3)), y = Math.round(p.y + p.dx * sgn * (SK_HW + 3));
      if (gorgeAt(x, y) < 3 || (prev && Math.hypot(prev[0] - x, prev[1] - y) < 4)) continue;
      d.rect(x - 1, y - 5, 3, 7, C.bark); d.rect(x - 1, y - 5, 1, 7, C.wood); d.set(x, y - 6, C.tan); d.set(x + 1, y + 2, C.plum);
      if (prev && Math.hypot(prev[0] - x, prev[1] - y) < 12) {
        const n = Math.round(Math.hypot(x - prev[0], y - prev[1]));
        for (let t = 1; t < n; t++) { const f = t / n; const lx = Math.round(prev[0] + (x - prev[0]) * f), ly = Math.round(prev[1] + (y - prev[1]) * f); d.set(lx, ly - 4, C.wood); d.set(lx, ly - 2, C.bark); }
      }
      prev = [x, y];
    }
  }
}

// ---------- Bewegte Ebene ----------
const fx = (f: number, k = 1, ph = 0): number => Math.sin(((f / ANIM_FRAMES) * k + ph) * Math.PI * 2);

function flame(b: Buf, x: number, y: number, f: number, i: number, big: boolean): void {
  const k = (f + i) % 4, h = (big ? [5, 8, 7, 8] : [4, 6, 5, 6])[k], sway = [0, 1, 0, -1][k];
  for (let yy = 0; yy < h; yy++) { const w = yy < h - 3 ? (big ? 5 : 3) : yy < h - 1 ? (big ? 3 : 2) : 1; for (let xx = -Math.floor(w / 2); xx <= Math.floor(w / 2); xx++) b.set(x + xx + (yy > 2 ? sway : 0), y - yy, yy > h - 3 ? C.yellow : yy > 1 ? C.amber : C.orange); }
  b.set(x + (k % 2 ? 1 : -1), y - h, C.orange); b.set(x, y - 1, C.red);
}

function paintBridge(b: Buf, span: Span, f: number): void {
  const pts = span.pts;
  const n = pts.length;
  const hw = SK_HW;
  const sway = (s: number): number => Math.round(fx(f, 1, s / 18) * 0.8);
  // Planken quer zum Weg
  for (let s = 0; s < n; s += 1) {
    const [px, py] = pts[s], [qx, qy] = pts[Math.min(n - 1, s + 1)];
    const l = Math.hypot(qx - px, qy - py) || 1, dx = (qx - px) / l, dy = (qy - py) / l, nx = -dy, ny = dx;
    const plank = Math.floor(s / 3), inPlank = s % 3;
    const dip = Math.round(Math.sin((s / (n - 1)) * Math.PI) * 1.2) + (hash2(plank, 1, 5) > 0.82 ? sway(s) : 0);
    for (let t = -hw; t <= hw; t++) {
      const edge = Math.abs(t) > hw - 1.5;
      const c = inPlank === 2 ? C.bark : edge ? C.bark : inPlank === 0 ? (hash2(plank, 3, 6) > 0.5 ? C.tan : C.peach) : (hash2(plank, 3, 6) > 0.5 ? C.wood : C.tan);
      b.set(px + nx * t, py + ny * t + dip, c);
    }
  }
  // Seile: zwei Handlaeufe, mit Pfosten an den Enden und in der Mitte, dazwischen durchhaengend
  for (const sgn of [-1, 1]) {
    const post = (s: number): void => {
      const [px, py] = pts[Math.max(0, Math.min(n - 1, s))];
      const x = Math.round(px), y = Math.round(py + sgn * (hw + 1));
      b.rect(x - 1, y - 8, 3, 10, C.bark); b.rect(x - 1, y - 8, 1, 10, C.wood); b.set(x, y - 9, C.tan); b.set(x + 1, y + 2, C.plum);
    };
    post(1); post(n - 2); if (n > 30) post(Math.floor(n / 2));
    for (let s = 1; s < n - 1; s++) {
      const [px, py] = pts[s];
      const t = s / (n - 1), sag = Math.round(Math.sin(t * Math.PI) * -1.5 + Math.sin(t * Math.PI * 3) * 1.4 * fx(f, 1, t) * 0.6);
      const x = Math.round(px), y = Math.round(py + sgn * (hw + 1)) - 7 + 3 - sag;
      b.set(x, y, C.tan); if (s % 5 === 0) { b.set(x, y + 1, C.wood); b.set(x, y + 2, C.wood); } // Haengeseile
    }
  }
}

function paintAnim(f: number, lake: Field, gorgeF: Field, props: PlacedArt[]): Buf {
  const b = waterFrame(f, ANIM_FRAMES, lake, TARN, { flow: [1, 0], sparkle: 0.9972, minDep: 1.5 });
  const r = rng(414);

  // Nebel in den Schluchten: Schwaden, die hin und her wiegen
  for (let i = 0; i < 46; i++) {
    const gx0 = i % 2 ? 392 + (r() - 0.5) * 24 : 598 + (r() - 0.5) * 18, gy0 = Math.floor(r() * (MAP_H + 10)) - 4, ph = r(), rx = 5 + r() * 7;
    const x = gx0 + fx(f, 1, ph) * 3, y = gy0 + fx(f, 1, ph + 0.25) * 1.5;
    if (gorgeF.at(Math.round(x), Math.round(y)) > -7 || onBridge(Math.round(x), Math.round(y))) continue;
    for (let yy = -2; yy <= 2; yy++) for (let xx = -rx; xx <= rx; xx++) {
      const d = (xx / rx) ** 2 + (yy / 2.2) ** 2;
      if (d > 1) continue;
      const px = Math.round(x + xx), py = Math.round(y + yy);
      if (gorgeF.at(px, py) > -6) continue;
      if (bayer(px, py) < (1 - d) * 0.9) b.set(px, py, d < 0.35 ? C.silver : d < 0.7 ? C.stone : C.slate);
    }
  }
  // Rinnsal ganz unten funkelt
  for (let k = 0; k < 24; k++) {
    const y = Math.floor(hash2(k, 3, 4) * MAP_H), x = Math.round((gorgeCenterA(y)) + Math.sin(y / 9) * 2);
    if ((k + f) % 4 === 0 && gorgeF.at(x, y) < -9 && !onBridge(x, y)) b.set(x, y, C.sky);
  }

  // Bach und Wasserfall am Westende (Schlucht A)
  const cl = CREEK;
  for (let s = 0; s < cl.length - 1; s++) {
    const [ax, ay] = cl[s], [bx, by] = cl[s + 1];
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay));
    for (let t = 0; t < steps; t++) {
      const x = Math.round(ax + ((bx - ax) * t) / steps), y = Math.round(ay + ((by - ay) * t) / steps);
      if (gorgeAt(x, y) < 1.5) continue;
      if ((t + s * 3 + f * 2) % 7 < 2) b.set(x, y, C.white);
      if ((t + s * 5 + f) % 9 === 0) b.set(x, y + 1, C.ice);
    }
  }
  const [wx, wy] = cl[cl.length - 1];
  for (let k = 0; k < 11; k++) {
    const x = wx - 1 + (k % 3), yy = ((f * 2 + k * 3) % 11) + (k < 6 ? 0 : 2);
    b.set(x - 2, wy + yy, k % 2 ? C.white : C.silver); b.set(x - 1, wy + 2 + ((yy + 5) % 10), C.ice);
  }
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + fx(f, 1, k / 8) * 0.4; b.set(wx - 4 + Math.round(Math.cos(a) * 5), wy + 12 + Math.round(Math.sin(a) * 2), (k + f) % 3 === 0 ? C.white : C.silver); }

  // Bruecken
  for (const span of BRIDGES) paintBridge(b, span, f);

  // Feuer und Fahnen
  props.forEach(({ prop, art }, i) => {
    if (prop.kind === 'beacon') flame(b, prop.x + (art.hook?.x ?? 0), prop.y + (art.hook?.y ?? -26) + 2, f, i, true);
    else if (prop.kind === 'watchtower') flame(b, prop.x + (art.hook?.x ?? 0), prop.y + (art.hook?.y ?? -57) + 2, f, i, true);
    else if (prop.kind === 'campfire') flame(b, prop.x, prop.y - 4, f, i, false);
    else if (prop.kind === 'flagpole' || prop.kind === 'gatepost' && prop.v === 9) {
      const hx = prop.x + (art.hook?.x ?? 2), hy = prop.y + (art.hook?.y ?? -26);
      for (let x = 0; x < 13; x++) { const dy = Math.round(Math.sin((f / ANIM_FRAMES) * Math.PI * 2 - x * 0.65 + i) * (0.5 + (x / 13) * 1.2)); const hh = 8 - Math.floor(x / 4); for (let y = 0; y < hh; y++) b.set(hx + 1 + x, hy + y + dy, y === 0 ? C.sky : x % 5 === 3 ? C.white : y > hh - 2 ? C.navy : C.silver); }
    } else if (prop.kind === 'gatepost') flame(b, prop.x, prop.y + (art.hook?.y ?? -46) + 4, f, i, false);
  });

  // Wolkenbaenke am Rand (wiegen), liegen ueber dem Boden, unter allen Dingen
  const rc = rng(2718);
  for (let i = 0; i < 22; i++) {
    const side = i % 4, t = rc();
    const cx = side === 0 ? t * MAP_W : side === 1 ? MAP_W - 3 : side === 2 ? t * MAP_W : 3;
    const cy = side === 0 ? 2 : side === 1 ? t * MAP_H : side === 2 ? MAP_H - 2 : t * MAP_H;
    if (side === 3 && cy < 120) continue;
    const ph = rc(), x = cx + fx(f, 1, ph) * 2, y = cy + fx(f, 1, ph + 0.3) * 0.8;
    const rx = 9 + rc() * 9;
    for (let yy = -5; yy <= 5; yy++) for (let xx = -rx; xx <= rx; xx++) {
      const d = (xx / rx) ** 2 + (yy / 5) ** 2;
      if (d > 1) continue;
      const px = Math.round(x + xx), py = Math.round(y + yy);
      if (px < 0 || py < 0 || px >= MAP_W || py >= MAP_H) continue;
      const e = Math.min(px, py, MAP_W - 1 - px, MAP_H - 1 - py);
      if (e > 15) continue;
      if (bayer(px, py) < (1 - d) * 0.95) b.set(px, py, d < 0.3 && yy < 0 ? C.white : d < 0.65 ? C.silver : C.stone);
    }
  }
  void shadeIdx;
  return b;
}
const gorgeCenterA = (y: number): number => 392 + 13 * Math.sin(y / 57) + 3 * Math.sin(y / 17 + 1);
void inPoly; void hash2; void rng; void MAP_H;
