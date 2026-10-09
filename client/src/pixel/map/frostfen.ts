/**
 * Frostfen Crossing (Runde 15 / B1): Winterkarte. Lage der Dinge UND Malen in einer Datei.
 * Wege (zwei Eingaenge) kommen aus `sim/data/maps/frostfen.json`; See, Eisloch, Blocker schreibt `scripts/gen-maps.ts`
 * zurueck in dieselbe Datei (Wasser = der zugefrorene See, unbebaubar). Licht von oben links, kuehl, Laternenlicht warm.
 */
import frost from '../../../../sim/data/maps/frostfen.json';
import { bayer, Buf, C, fbm, hash2, rng, shadeIdx, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { closedSpline, Field, inPoly, pathDistAll, pathField, polySdf, simplify, walk, type Pt } from './kit';
import { frostArt, type FrostKind } from './props-frost';
import type { MapArt, MapLight, PlacedArt } from './types';

const raw = frost as unknown as { path: Pt[]; paths?: Pt[][]; pathHalfWidth: number; buildArea: [number, number, number, number] };
/** Alle Weg-Aeste (je Eingang einer, jeder bis zum Ausgang). */
export const FF_BRANCHES: Pt[][] = raw.paths ?? [raw.path];
export const FF_HW: number = raw.pathHalfWidth;

// ---------- Wasser: zugefrorener See, Eisschollen, Eisloch, Steg ----------
const rawFull = frost as unknown as { ice: Pt[][] };
/** Grobe Umrisse (Agent A, 16 Punkte); der gemalte See ist ihre organische Verfeinerung (nur nach innen, nie naeher am Weg). Fest eingetragen, damit gen-maps.ts wiederholbar bleibt. */
const LAKE_BASE: Pt[] = [[44,150],[90,124],[160,114],[230,118],[300,112],[366,122],[404,148],[414,180],[404,212],[366,238],[300,248],[230,242],[160,246],[90,236],[44,210],[32,180]];  // = `water` aus Agent As frostfen.json (Fassung r15-a); die Datei traegt danach die Verfeinerung
/** Eisschollen (bebaubar!): Polygone aus der Sim-Datei, so gemalt, wie sie liegen. */
export const FLOES: Pt[][] = rawFull.ice;

function organic(base: Pt[]): Pt[] {
  const cx = base.reduce((s, p) => s + p[0], 0) / base.length, cy = base.reduce((s, p) => s + p[1], 0) / base.length;
  const out: Pt[] = [];
  const inward = (p: Pt, d: number): Pt => {
    const dx = cx - p[0], dy = cy - p[1], l = Math.hypot(dx, dy) || 1;
    return [Math.round(p[0] + (dx / l) * d), Math.round(p[1] + (dy / l) * d)];
  };
  base.forEach((p, i) => {
    const q = base[(i + 1) % base.length];
    out.push(inward(p, 3 + (p[0] > 380 ? 5 : 0) + hash2(i, 1, 61) * 3));
    // Zwischenpunkte: Buchten und Landzungen, nur nach innen
    const n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 22));
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1), m: Pt = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      out.push(inward(m, 3 + hash2(i, k, 62) * 9 + (m[0] > 380 ? 4 : 0)));
    }
  });
  return out;
}
export const LAKE: Pt[] = closedSpline(organic(LAKE_BASE), 4);
const HOLE_CTRL: Pt[] = [[296, 228], [308, 221], [326, 220], [340, 227], [334, 237], [316, 240], [300, 236]];
export const HOLE: Pt[] = closedSpline(HOLE_CTRL, 3);
export const PIER = { x: 270, y0: 216, y1: 254 };

export function waterPolygons(): Pt[][] {
  return [simplify(LAKE, 3)];
}

// ---------- Dinge ----------
export interface FrostProp { kind: FrostKind; x: number; y: number; v: number; r: number }
export const FROST_R: Record<FrostKind, number> = {
  fir: 6, firsmall: 4, birch: 4, rock: 4, boulder: 8, stump: 4, hut: 15, shanty: 10, lamp: 2, snowman: 4, rack: 9, woodpile: 6,
  boat: 9, crate: 4, barrel: 3, sign: 2, reeds: 0, mound: 0, icerock: 5, tent: 12,
};
const P = (kind: FrostKind, x: number, y: number, v = 0): FrostProp => ({ kind, x, y, v, r: FROST_R[kind] });

const HAND: FrostProp[] = [
  // Fischerdorf im Ostpocket (zwischen den Wegen) und am Westrand
  P('hut', 480, 232, 0), P('woodpile', 450, 214), P('snowman', 508, 276), P('rack', 474, 288), P('crate', 502, 214), P('barrel', 510, 220),
  P('hut', 570, 214, 1), P('woodpile', 572, 262), P('barrel', 556, 244), P('sign', 567, 166),
  P('hut', 64, 290, 1), P('rack', 108, 284), P('boat', 40, 262), P('barrel', 90, 296), P('snowman', 24, 96),
  P('lamp', 462, 200), P('lamp', 520, 254), P('lamp', 560, 182), P('lamp', 584, 250), P('lamp', 622, 200), P('lamp', 86, 270), P('lamp', 124, 96), P('lamp', 12, 232),
  // Eishuetten auf dem See, Steg mit Laternen
  P('shanty', 128, 150, 0), P('shanty', 380, 200, 1), P('shanty', 214, 218, 1), P('shanty', 318, 140, 0),
  P('lamp', 266, 222), P('lamp', 275, 240),
  // Ufer
  P('reeds', 44, 152, 0), P('reeds', 332, 252, 1), P('reeds', 400, 232, 0), P('reeds', 200, 258, 1), P('reeds', 110, 244, 0),
  P('icerock', 60, 118, 0), P('icerock', 396, 118, 1), P('icerock', 360, 250, 0), P('rock', 232, 266, 0), P('boulder', 380, 86, 0), P('boulder', 22, 276, 0),
  // Tail im Osten, Wegrand
  P('tent', 631, 226, 0), P('snowman', 620, 112), P('lamp', 520, 110), P('rock', 330, 100), P('rock', 330, 276), P('rock', 360, 296),
  P('lamp', 20, 62), P('sign', 40, 62), P('lamp', 20, 300), P('sign', 40, 300), P('snowman', 330, 90), P('birch', 352, 96, 0), P('firsmall', 204, 98, 0), P('rock', 372, 100), P('woodpile', 96, 80), P('crate', 240, 98),
  P('birch', 400, 282, 0), P('birch', 188, 270, 1), P('birch', 210, 100, 1), P('stump', 30, 80), P('stump', 506, 140),
];

const lakeSdf = polySdf([LAKE]);
/** Abstand zum See in px: < 0 im See (zugefrorener See = Sim-Wasser). */
export const lakeAt = (x: number, y: number): number => lakeSdf[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];
/** Punkt in einer Eisscholle (bebaubar)? */
export const onFloe = (x: number, y: number): boolean => FLOES.some((f) => inPoly(x, y, f));

/** Streuwald: Tannen und Birken, die weder Weg noch See noch andere Dinge beruehren (fester Seed). */
function scatter(): FrostProp[] {
  const rnd = rng(15091);
  const out: FrostProp[] = [];
  const all = (): FrostProp[] => [...HAND, ...out];
  const tries = 9000;
  for (let i = 0; i < tries && out.length < 150; i++) {
    const x = Math.round(rnd() * (MAP_W - 6) + 3), y = Math.round(rnd() * (MAP_H - 4) + 6);
    // Dichte: Rand dicht, Mitte duenn, Wald-Flecken ueber Rauschen
    const edge = Math.min(x, MAP_W - x, y * 1.4, (MAP_H - y) * 1.4);
    const dens = edge < 40 ? 0.95 : 0.2 + (vnoise(x, y, 70, 31) > 0.55 ? 0.6 : 0) + (edge < 90 ? 0.2 : 0);
    if (rnd() > dens) continue;
    const roll = rnd();
    const kind: FrostKind = roll < 0.55 ? 'fir' : roll < 0.8 ? 'firsmall' : roll < 0.9 ? 'birch' : roll < 0.95 ? 'rock' : 'mound';
    const v = Math.floor(rnd() * (kind === 'fir' ? 3 : 2));
    const r = FROST_R[kind];
    if (pathDistAll(FF_BRANCHES, x, y - 2) < FF_HW + r + 5) continue;
    if (lakeAt(x, y) < r + 6) continue;
    if (x > 244 && x < 300 && y > 238 && y < 290) continue; // Zugang zum Steg bleibt frei
    if (all().some((q) => Math.hypot(q.x - x, (q.y - y) * 1.3) < Math.max(q.r, r) * 1.9 + 4)) continue;
    // Tannen nicht mitten in den Wiesen des Dorfs: nur dort, wo der Wald dicht ist oder die Dichte es erlaubt
    out.push(P(kind, x, y, v));
  }
  return out;
}
export const FROST_PROPS: FrostProp[] = (() => [...HAND, ...scatter()].sort((a, b) => a.y - b.y))();

export function blockers(): [number, number, number][] {
  const [bx, bw] = raw.buildArea;
  // was mitten im (unbebaubaren) See steht, muss die Sim nicht als Blocker kennen
  return FROST_PROPS.filter((q) => q.r > 0 && q.x - q.r < bx + bw && q.x + q.r > bx && lakeAt(q.x, q.y) > -4).map((q) => [q.x, q.y - 2, q.r]);
}

// ------------------------------------------------------------------ Malen
const SNOW_TONES = [C.white, C.silver, C.stone];

function snowTone(x: number, y: number): number {
  const n = fbm(x, y, 41);
  // Waehen: lange, flache Hoecker (Schneewehen) quer zum Wind
  const drift = vnoise(x + y * 0.6, y * 1.8, 26, 17);
  let lit = n - 0.5 + (bayer(x, y) - 0.5) * 0.12 + (vnoise(x, y, 64, 5) - 0.5) * 0.3 + (drift - 0.5) * 0.28;
  // Waehenkante: scharfer Wechsel hell -> Schatten
  if (drift > 0.5 && drift < 0.54) lit -= 0.25;
  if (lit > 0.1) return C.white;
  if (lit > -0.04) return bayer(x, y + 1) < 0.5 ? C.white : C.silver;
  if (lit > -0.22) return C.silver;
  if (lit > -0.32) return bayer(x + 1, y) < 0.5 ? C.silver : C.stone;
  return C.stone;
}

/** Eisschollen: Voronoi-Zellen (~28 px). Liefert Zellkennung (Hash 0..1) und Abstand zur Naht (px). */
function plate(x: number, y: number): { id: number; seam: number; cx: number; cy: number } {
  const S = 28;
  const gx = Math.floor(x / S), gy = Math.floor(y / S);
  let d1 = 1e9, d2 = 1e9, id = 0, bx = 0, by = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j;
    const sx = (cx + 0.15 + hash2(cx, cy, 71) * 0.7) * S, sy = (cy + 0.15 + hash2(cx, cy, 72) * 0.7) * S;
    const d = Math.hypot(x - sx, (y - sy) * 1.15);
    if (d < d1) { d2 = d1; d1 = d; id = hash2(cx, cy, 73); bx = sx; by = sy; } else if (d < d2) d2 = d;
  }
  return { id, seam: (d2 - d1) * 0.7, cx: bx, cy: by };
}

function iceColor(x: number, y: number, dep: number, lit: number): number {
  const p = plate(x, y);
  const noise = vnoise(x, y, 9, 8);
  // Naht / Riss
  if (p.seam < 0.85) {
    const crackKind = hash2(Math.floor(x / 9), Math.floor(y / 9), 91);
    return crackKind < 0.5 ? C.navy : crackKind < 0.8 ? C.white : C.night;
  }
  if (p.seam < 1.7 && ((x + y) & 1) === 0) return p.id < 0.5 ? C.ice : C.sky;
  let c: number;
  if (p.id < 0.36) { // klares Eis: tiefes Blau, selten ein heller Punkt
    c = bayer(x, y) < 0.22 + (1 - noise) * 0.3 ? C.navy : C.sky;
    if (noise > 0.72 && bayer(x + 1, y + 1) < 0.35) c = C.ice;
  } else if (p.id < 0.74) { // bereiftes Eis: blau mit Reif
    c = bayer(x, y) < 0.15 + noise * 0.3 ? C.silver : C.sky;
    if (bayer(x + 1, y + 2) < 0.1) c = C.ice;
    if (bayer(x + 2, y) < 0.12) c = C.navy;
  } else { // tiefes, dunkles Eis
    c = bayer(x, y) < 0.4 + (noise - 0.5) * 0.7 ? C.navy : C.sky;
    if (bayer(x + 3, y) < 0.06) c = C.dusk;
  }
  // Glanzstreifen schraeg (Spiegelung)
  const diag = (x + y * 0.9 + p.id * 40) % 31;
  if (diag < 1.3 && noise > 0.3) c = diag < 0.6 ? C.white : C.ice;
  // Rand: Reif, links/oben (Licht) heller
  if (dep < 4.5) {
    const k = bayer(x, y + 1);
    if (dep < 1.6) c = lit > 0 ? (k < 0.5 ? C.silver : C.stone) : C.white;
    else if (dep < 3.2) c = k < 0.5 + lit * -0.2 ? (lit > 0 ? C.silver : C.white) : c;
    else if (k < 0.25) c = lit > 0 ? C.navy : C.ice;
  }
  return c;
}

export function paintFrostfen(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const lake = new Field(polySdf([LAKE]));
  const hole = new Field(polySdf([HOLE]));
  const floe = new Field(polySdf(FLOES.map((f) => closedSpline(f, 3))));
  const pf = pathField(FF_BRANCHES);
  const HW = FF_HW;

  // 1) Schnee, Weg, See
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ld = lake.at(x, y);
    const pd = pf.at(x, y);
    if (pd <= HW + 2.2) {
      const [gx, gy] = pf.grad(x, y);
      const c = pathColor(x, y, pd, gx, gy);
      if (c !== null) { ground.set(x, y, c); continue; }
    }
    if (ld < 0) {
      const [gx, gy] = lake.grad(x, y);
      const lit = -(gx * 0.6 + gy * 0.8); // > 0: Ufer oben links
      let c = iceColor(x, y, -ld, lit);
      if (hole.at(x, y) < 0) c = holeBase(x, y, -hole.at(x, y));
      const fl = floe.at(x, y);
      if (fl < 0) c = floeTop(x, y, -fl, lit);
      else {
        let k = 0;
        for (let t = 1; t <= 3 && !k; t++) if (floe.at(x, y - t) < 0) k = t;
        if (k) c = k === 1 ? C.silver : k === 2 ? (bayer(x, y) < 0.5 ? C.ice : C.sky) : C.sky;
        else if (floe.at(x - 2, y - 5) < 0 && bayer(x, y) < 0.75) c = shadeIdx(c);
      }
      ground.set(x, y, c);
      continue;
    }
    let c = snowTone(x, y);
    // Uferwall: Schneekante um den See (hell auf der Lichtseite, Schatten daneben)
    if (ld < 4.5) {
      const [gx, gy] = lake.grad(x, y);
      const lit = -(gx * 0.6 + gy * 0.8); // Seewasser liegt in Richtung -grad: >0 heisst Ufer unten rechts des Wassers... Licht von oben links
      if (ld < 1.5) c = lit < 0 ? (bayer(x, y) < 0.6 ? C.white : C.silver) : (bayer(x, y) < 0.5 ? C.silver : C.stone);
      else if (ld < 3 && bayer(x + 1, y) < 0.45) c = lit < 0 ? C.white : C.silver;
    }
    ground.set(x, y, c);
  }
  void shadeIdx;

  // 2) Streu: Schneerippel, Eisfunkeln, Grashalme, Steinchen
  const r = rng(20261015);
  const isSnow = (x: number, y: number): boolean => lake.at(x, y) > 5 && pf.at(x, y) > HW + 4;
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(r() * (W - 6)) + 3, y = Math.floor(r() * (H - 6)) + 3;
    if (!isSnow(x, y)) continue;
    const k = r();
    if (k < 0.5) { // Rippel: zwei, drei Pixel im Schatten, ein heller darueber
      ground.set(x, y, C.stone); ground.set(x + 1, y, C.silver); if (r() < 0.5) ground.set(x + 2, y, C.stone);
      ground.set(x - 1, y - 1, C.white); ground.set(x, y - 1, C.white);
    } else if (k < 0.72) { // Funkelpunkt
      ground.set(x, y, C.white); if (r() < 0.3) ground.set(x, y, C.ice);
    } else if (k < 0.9) { // Grashalme, die aus dem Schnee ragen
      ground.set(x, y, C.bark); ground.set(x + 1, y - 1, C.wood); ground.set(x - 1, y - 1, C.wood); ground.set(x, y - 2, C.tan);
    } else { // Kiesel
      ground.set(x, y, C.slate); ground.set(x + 1, y, C.stone);
    }
  }

  // 3) Spuren: von jeder Huette zum Steg und zu den Eishuetten, dazu auf dem Weg (in pathColor)
  const trails: Pt[][] = [
    [[480, 240], [440, 262], [420, 296], [396, 318]],
    [[570, 222], [520, 236], [492, 240]],
    [[64, 298], [90, 276], [140, 256], [200, 252], [270, 252]],
    [[128, 158], [150, 190], [220, 232], [270, 248]],
    [[214, 226], [244, 240], [270, 250]],
    [[396, 198], [372, 220], [330, 238], [276, 252]],
    [[318, 148], [300, 176], [284, 214], [274, 240]],
  ];
  for (const t of trails) {
    walk(t, 6.5).forEach((p, i) => {
      const side = i % 2 ? 1 : -1;
      const x = Math.round(p.x - p.dy * side * 2), y = Math.round(p.y + p.dx * side * 2);
      if (pf.at(x, y) < HW + 1 || hole.at(x, y) < 1) return;
      const c = lake.at(x, y) < 0 ? C.sky : C.stone;
      ground.set(x, y, c); ground.set(x + 1, y, c === C.stone ? C.slate : C.navy);
    });
  }
  // Angellocher: dunkles Loch mit Eisrand neben jeder Eishuette
  for (const [fx, fy] of [[142, 158], [410, 196], [228, 226], [332, 150], [180, 184], [60, 190]] as const) {
    if (lake.at(fx, fy) > -4) continue;
    ground.ellipse(fx, fy, 3, 1.6, C.white);
    ground.ellipse(fx, fy, 2, 1, C.night);
    ground.set(fx - 1, fy, C.navy);
  }

  for (const br of FF_BRANCHES) {
    walk(br, 9, 4).forEach((p, i) => {
      const side = i % 2 ? 1 : -1;
      const x = Math.round(p.x - p.dy * side * 2.5 + (hash2(i, 1, 2) - 0.5) * 3), y = Math.round(p.y + p.dx * side * 2.5 + (hash2(i, 2, 2) - 0.5) * 3);
      if (pf.at(x, y) > HW - 3 || lake.at(x, y) < 0 || x < 2 || x > W - 3) return;
      ground.set(x, y, C.slate); ground.set(x + 1, y, C.slate); ground.set(x, y - 1, C.stone);
    });
  }

  // 4) Schatten der Dinge
  const props: PlacedArt[] = FROST_PROPS.map((prop) => ({ prop, art: frostArt(prop.kind, prop.v) }));
  const shade = new Uint8Array(W * H);
  for (const { prop, art } of props) {
    const { ox, oy, rx, ry } = art.shadow;
    const cx = prop.x + ox, cy = prop.y + oy;
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
      if (d < 0.7 || (d < 1 && bayer(x, y) < 0.5)) shade[y * W + x] = 1;
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (shade[y * W + x]) ground.set(x, y, shadeIdx(ground.get(x, y)));

  // 5) Lichtpfuetzen: warmer Schein um Laternen und Fenster (Schnee -> Sand/Peach gedithert)
  const lights: MapLight[] = [];
  const smoke: MapArt['smoke'] = [];
  for (const { prop, art } of props) {
    if (prop.kind === 'lamp') lights.push({ x: prop.x, y: prop.y + (art.hook?.y ?? -21), r: 28, warm: true, flicker: 'flame' });
    else if (prop.kind === 'hut') { lights.push({ x: prop.x + 8, y: prop.y - 12, r: 20, warm: true, flicker: 'flame' }); smoke.push({ x: prop.x + 9, y: prop.y + (art.hook?.y ?? -40) }); }
    else if (prop.kind === 'shanty') { lights.push({ x: prop.x + 4, y: prop.y - 14, r: 14, warm: true, flicker: 'flame' }); smoke.push({ x: prop.x + 7, y: prop.y + (art.hook?.y ?? -26) }); }
    else if (prop.kind === 'tent') lights.push({ x: prop.x, y: prop.y - 6, r: 16, warm: true, flicker: 'flame' });
  }
  for (const L of lights.filter((l) => l.r >= 14)) {
    const ly = L.y + (L.r >= 28 ? 16 : 6), rx = L.r * 0.8, ry = L.r * 0.5;
    for (let y = Math.floor(ly - ry); y <= ly + ry; y++) for (let x = Math.floor(L.x - rx); x <= L.x + rx; x++) {
      const d = Math.hypot((x - L.x) / rx, (y - ly) / ry);
      if (d >= 1 || x < 0 || y < 0 || x >= W || y >= H) continue;
      if (bayer(x, y) < (1 - d) * 0.85) {
        const c = ground.get(x, y);
        if (c === C.white || c === C.silver) ground.set(x, y, d < 0.45 && bayer(x + 2, y + 1) < 0.5 ? C.yellow : C.sand);
        else if (c === C.stone) ground.set(x, y, C.peach);
        else if (c === C.slate) ground.set(x, y, C.tan);
        else if (c === C.wood) ground.set(x, y, C.peach);
      }
    }
  }

  // 6) Vignette: Raender kuehler und dunkler
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (e < 12 && bayer(x, y) < (12 - e) / 12 * 0.7) ground.set(x, y, shadeIdx(ground.get(x, y)));
  }

  const deco = new Buf(W, H);
  paintPier(deco, lake);
  const anim = Array.from({ length: ANIM_FRAMES }, (_, f) => paintIceAnim(f, lake, hole, floe));
  return { id: 'frostfen', name: 'Frostfen Crossing', ground, anim, animMs: 140, deco, props, lights, smoke };
}

export const ANIM_FRAMES = 8;

// ---------- Weg: festgetretener Schnee ----------
function pathColor(x: number, y: number, pd: number, gx: number, gy: number): number | null {
  if (pd > FF_HW + 2.2) return null;
  const n = vnoise(x, y, 3.5, 21) * 0.7 + hash2(x, y, 22) * 0.3;
  const lit = -(gx * 0.6 + gy * 0.8);
  if (pd <= FF_HW - 0.6) {
    const edge = pd / FF_HW;
    let c = C.stone;
    if (edge < 0.75 && n > 0.62 - (0.75 - edge) * 0.1) c = C.silver;
    if (edge < 0.4 && n > 0.86) c = C.white;
    if (n < 0.2 && edge > 0.2) c = C.slate;
    // Matsch (Erde schaut durch), nur als Sprenkel
    if (edge < 0.55 && vnoise(x, y, 6, 33) > 0.74 && bayer(x + 1, y) < 0.22) c = C.wood;
    // Karrenspuren
    if (pd > 3.6 && pd < 5.0 && n < 0.7) c = ((x + y) & 1) === 0 ? C.slate : C.stone;
    if (edge > 0.65) c = hash2(x, y, 55) < (edge - 0.65) * 2.2 ? C.slate : c;
    // Raender: Schneewall (hell auf der Lichtseite, Schatten sonst)
    if (edge > 0.88) c = lit > 0 ? (bayer(x, y) < 0.7 ? C.white : C.silver) : bayer(x + 1, y) < 0.65 ? C.slate : C.stone;
    const hs = hash2(x, y, 5);
    if (hs > 0.988) c = C.white; else if (hs < 0.01) c = C.dusk;
    return c;
  }
  // Lippe / Schneewall
  if (pd <= FF_HW + 0.9) return lit > 0.25 ? C.white : lit > -0.25 ? C.silver : C.stone;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.white : snowTone(x, y)) : bayer(x, y) < 0.7 ? C.stone : snowTone(x, y);
}

/** Eisscholle (bebaubar): dick, mit Schnee bestaeubt, heller Rand auf der Lichtseite. */
function floeTop(x: number, y: number, dep: number, lit: number): number {
  const k = bayer(x, y);
  if (dep < 1.6) return lit < 0 ? C.white : k < 0.5 ? C.silver : C.stone;
  if (dep < 3.2) return k < 0.5 ? C.white : C.ice;
  let c = snowTone(x, y);
  if (c === C.stone) c = C.silver;
  if (vnoise(x, y, 5, 12) > 0.7 && k < 0.3) c = C.ice;
  const cr = hash2(Math.floor(x / 11), Math.floor(y / 11), 44);
  if (cr > 0.93 && ((x * 3 + y * 5) % 9) < 1) c = C.sky;
  return c;
}

/** Eisloch (Grundton): dunkles offenes Wasser, am Rand duenne Eisschicht. */
function holeBase(x: number, y: number, dep: number): number {
  if (dep < 1.3) return C.white;
  if (dep < 2.6) return bayer(x, y) < 0.5 ? C.ice : C.silver;
  const n = vnoise(x, y, 6, 4);
  return bayer(x, y) < 0.25 + n * 0.4 ? C.night : C.navy;
}

// ---------- Steg ----------
function paintPier(d: Buf, lake: Field): void {
  const { x, y0, y1 } = PIER;
  const x0 = x - 6, x1 = x + 6;
  // Schatten auf dem Eis (rechts, leicht nach unten)
  for (let yy = y0 + 3; yy <= y1 + 3; yy++) for (let xx = x1 + 1; xx <= x1 + 4; xx++) if (lake.at(xx, yy) < 0 && bayer(xx, yy) < 0.75 - (xx - x1) * 0.12) d.set(xx, yy, C.navy);
  // Bohlen (quer zur Gehrichtung = waagrechte Reihen)
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
    const plank = Math.floor((yy - y0) / 3);
    const sep = (yy - y0) % 3 === 2;
    let c = sep ? C.bark : plank % 2 ? C.wood : C.tan;
    if (!sep && (yy - y0) % 3 === 0) c = plank % 2 ? C.tan : C.peach;
    if (xx === x0) c = C.bark;
    if (xx === x1) c = C.plum;
    if (hash2(plank, xx, 8) > 0.9 && !sep) c = C.bark;
    d.set(xx, yy, c);
  }
  // Schnee auf den Bohlen (Flecken, links dichter)
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0 + 1; xx < x1; xx++) {
    const k = hash2(xx, yy >> 1, 19) * 0.6 + vnoise(xx, yy, 6, 2) * 0.4;
    if (k > 0.66) d.set(xx, yy, xx < x - 1 ? C.white : C.silver);
  }
  // Pfosten und Seile
  for (let yy = y0 + 2; yy <= y1; yy += 14) for (const px of [x0 - 1, x1 - 1]) {
    d.rect(px, yy - 4, 3, 7, C.bark);
    d.rect(px, yy - 4, 1, 7, C.wood);
    d.rect(px, yy - 5, 3, 1, C.white);
    d.set(px + 1, yy - 6, C.silver);
  }
  // Pfosten-Fuesse im Eis (kleine Eisringe)
  for (const px of [x0, x1]) d.set(px, y1 + 1, C.white);
}

// ---------- Animierte Ebene: Glitzern, Eisloch, Schollen ----------
function paintIceAnim(f: number, lake: Field, hole: Field, floe: Field): Buf {
  const b = new Buf(MAP_W, MAP_H);
  const r = rng(4242);
  const onIce = (x: number, y: number): boolean => lake.at(x, y) < -3 && hole.at(x, y) > 4 && floe.at(x, y) > 3;
  // Glitzerpunkte: feste Orte, Phase 0..7; Stern nur auf dem Hoehepunkt
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(30 + r() * 386), y = Math.floor(110 + r() * 142), ph = Math.floor(r() * ANIM_FRAMES), big = r() < 0.3;
    if (!onIce(x, y)) continue;
    const k = (f - ph + ANIM_FRAMES) % ANIM_FRAMES;
    if (k === 0) {
      b.set(x, y, C.white);
      if (big) { b.set(x - 1, y, C.ice); b.set(x + 1, y, C.ice); b.set(x, y - 1, C.ice); b.set(x, y + 1, C.ice); }
    } else if (k === 1 || k === ANIM_FRAMES - 1) b.set(x, y, big ? C.ice : C.silver);
  }
  // Glitzern auf den Schollen (weisser Reif blitzt)
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(90 + r() * 290), y = Math.floor(140 + r() * 84), ph = Math.floor(r() * ANIM_FRAMES);
    if (floe.at(x, y) > -4) continue;
    if ((f - ph + ANIM_FRAMES) % ANIM_FRAMES === 0) { b.set(x, y, C.white); b.set(x + 1, y, C.ice); b.set(x, y + 1, C.ice); }
  }
  // Streifenglanz: ein heller Streifen wandert langsam ueber den See
  const sweep = (f / ANIM_FRAMES) * 120;
  for (let y = 110; y < 252; y++) for (let x = 30; x < 416; x++) {
    if (!onIce(x, y)) continue;
    const dd = ((x + y * 0.8 - 150 - sweep * 4 + 480) % 480);
    if (dd < 5 && bayer(x, y) < 0.35 && vnoise(x, y, 8, 3) > 0.45) b.set(x, y, dd < 2 ? C.white : C.ice);
  }
  // Eisloch: Ringwellen, Funkeln, Schollen im Wasser
  const [hx, hy] = [318, 230];
  for (let y = 214; y < 246; y++) for (let x = 288; x < 350; x++) {
    const hd = -hole.at(x, y);
    if (hd < 2.6) continue;
    const d = Math.hypot((x - hx) / 1.7, y - hy);
    const ring = ((d * 1.4 - f * 1.5) % 6 + 6) % 6;
    if (ring < 0.7 && hd > 3.6 && bayer(x, y) < 0.7) b.set(x, y, C.sky);
    else if (ring < 0.4 && hd > 4) b.set(x, y, C.ice);
    if (hash2(x + f * 13, y + f * 7, 33) > 0.992) b.set(x, y, C.white);
  }
  const floes: [number, number, number, number][] = [[307, 230, 5, 3], [329, 233, 4, 2], [319, 225, 3, 2], [337, 228, 3, 2]];
  floes.forEach(([fx, fy, rx, ry], i) => {
    const bob = Math.round(Math.sin(((f + i * 2) / ANIM_FRAMES) * Math.PI * 2) * 0.9);
    const dx = Math.round(Math.sin(((f + i * 3) / ANIM_FRAMES) * Math.PI * 2) * 1.2);
    b.ellipse(fx + dx, fy + bob + 1, rx, ry, C.navy);
    b.ellipse(fx + dx, fy + bob, rx, ry, C.silver);
    b.ellipse(fx + dx - 1, fy + bob - 1, rx - 1, Math.max(1, ry - 1), C.white);
    b.set(fx + dx + rx - 1, fy + bob + 1, C.stone);
  });
  return b;
}
