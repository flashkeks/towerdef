/**
 * Ember Quarry (Runde 15 / B1): Steinbruch mit Lavastroemen. Lage und Malen in einer Datei.
 * Weg, Lava, Bruecken kommen aus `sim/data/maps/quarry.json` (Agent A); Blocker schreibt `scripts/gen-maps.ts` zurueck.
 * Lava ist Sim-"Wasser": laeuft kein Gegner drueber ausser auf den Bruecken. Licht von oben links, Lava glueht von unten.
 */
import quarry from '../../../../sim/data/maps/quarry.json';
import { bayer, Buf, C, fbm, hash2, rng, shadeIdx, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { closedSpline, Field, pathDistAll, pathField, polySdf, walk, type Pt } from './kit';
import { quarryArt, type QuarryKind } from './props-quarry';
import type { MapArt, MapLight, PlacedArt } from './types';

const raw = quarry as unknown as { path: Pt[]; paths?: Pt[][]; pathHalfWidth: number; lava: Pt[][]; bridges: [Pt, Pt][]; buildArea: [number, number, number, number] };
export const Q_BRANCHES: Pt[][] = raw.paths ?? [raw.path];
export const Q_HW: number = raw.pathHalfWidth;
/** Lava-Polygone der Sim, im Bild leicht gerundet (Spline durch dieselben Punkte). */
export const LAVA: Pt[][] = raw.lava;
export const LAVA_DRAWN: Pt[][] = LAVA.map((p) => closedSpline(p, 3));
export const BRIDGES_Q: [Pt, Pt][] = raw.bridges;
export const ANIM_FRAMES = 8;

// ---------- Dinge ----------
export interface QuarryProp { kind: QuarryKind; x: number; y: number; v: number; r: number }
export const QUARRY_R: Record<QuarryKind, number> = {
  crystal: 10, rock: 4, boulder: 9, spire: 5, scaffold: 10, mine: 20, cart: 9, ore: 8, tnt: 4, barrel: 3, lamp: 2, dead: 3, brazier: 3,
  crane: 12, sign: 2, bones: 0, pickaxe: 0,
};
const P = (kind: QuarryKind, x: number, y: number, v = 0): QuarryProp => ({ kind, x, y, v, r: QUARRY_R[kind] });

const HAND: QuarryProp[] = [
  // Nordwest
  P('mine', 60, 100), P('lamp', 30, 104), P('lamp', 92, 104), P('cart', 94, 114), P('ore', 156, 98), P('crystal', 172, 96, 0), P('tnt', 18, 92), P('barrel', 28, 90),
  P('rock', 40, 44), P('rock', 150, 44),
  // West
  P('crystal', 24, 150, 1), P('scaffold', 64, 170), P('rock', 100, 226), P('crystal', 100, 190, 2), P('boulder', 22, 236), P('lamp', 100, 150),
  P('dead', 24, 188, 0), P('brazier', 112, 214), P('pickaxe', 56, 244), P('bones', 14, 126),
  // Mitte oben
  P('crane', 262, 92), P('crystal', 340, 40, 1), P('boulder', 280, 34), P('rock', 372, 90), P('ore', 330, 104), P('lamp', 320, 82), P('brazier', 250, 40), P('spire', 410, 20),
  P('crystal', 410, 100, 2), P('rock', 430, 140), P('tnt', 330, 126), P('barrel', 342, 128), P('sign', 316, 150), P('dead', 400, 60, 1), P('rock', 270, 150), P('spire', 250, 150, 1),
  // Mitte
  P('scaffold', 284, 226), P('rock', 252, 220), P('crystal', 404, 214, 0), P('lamp', 356, 200), P('boulder', 430, 226), P('cart', 380, 142), P('crystal', 252, 206, 1),
  // Sued
  P('rock', 40, 298), P('crystal', 100, 298, 0), P('lamp', 150, 292), P('ore', 210, 300), P('spire', 270, 296, 1), P('tnt', 320, 298), P('barrel', 312, 302),
  P('boulder', 440, 296), P('brazier', 408, 292), P('rock', 470, 300), P('crystal', 520, 292, 2), P('dead', 566, 296, 1), P('spire', 600, 294),
  P('lamp', 350, 300),
  // Ost
  P('crystal', 620, 30, 0), P('rock', 590, 60), P('scaffold', 580, 20), P('lamp', 450, 62), P('brazier', 440, 30), P('rock', 560, 20), P('spire', 440, 90, 1),
];

function scatter(lavaAt: (x: number, y: number) => number): QuarryProp[] {
  const rnd = rng(15092);
  const out: QuarryProp[] = [];
  const all = (): QuarryProp[] => [...HAND, ...out];
  for (let i = 0; i < 6000 && out.length < 70; i++) {
    const x = Math.round(rnd() * (MAP_W - 8) + 4), y = Math.round(rnd() * (MAP_H - 4) + 8);
    const roll = rnd();
    const kind: QuarryKind = roll < 0.42 ? 'rock' : roll < 0.62 ? 'spire' : roll < 0.8 ? 'crystal' : roll < 0.9 ? 'dead' : roll < 0.95 ? 'bones' : 'pickaxe';
    const v = Math.floor(rnd() * 3);
    const r = QUARRY_R[kind];
    if (pathDistAll(Q_BRANCHES, x, y - 2) < Q_HW + r + 5) continue;
    if (lavaAt(x, y) < r + 7 || lavaAt(x, y - 12) < 4) continue;
    if (all().some((q) => Math.hypot(q.x - x, (q.y - y) * 1.3) < Math.max(q.r, r) * 1.9 + 6)) continue;
    out.push(P(kind, x, y, v));
  }
  return out;
}

const lavaSdf = polySdf(LAVA);
export const lavaAt = (x: number, y: number): number => lavaSdf[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];
export const QUARRY_PROPS: QuarryProp[] = [...HAND, ...scatter(lavaAt)].sort((a, b) => a.y - b.y);

export function blockers(): [number, number, number][] {
  const [bx, , bw] = raw.buildArea;
  return QUARRY_PROPS.filter((q) => q.r > 0 && q.x - q.r < bx + bw && q.x + q.r > bx && lavaAt(q.x, q.y) > -4).map((q) => [q.x, q.y - 2, q.r]);
}

/** Funkenquellen: Orte auf der Lava (fuer `ambient.ts`). */
export const EMBER_SEEDS: Pt[] = (() => {
  const r = rng(3131), out: Pt[] = [];
  for (let i = 0; i < 4000 && out.length < 70; i++) {
    const x = Math.round(r() * MAP_W), y = Math.round(r() * MAP_H);
    if (lavaAt(x, y) < -4) out.push([x, y]);
  }
  return out;
})();

// ------------------------------------------------------------------ Boden
const LEVEL_TONES: [number, number][] = [[C.night, C.dusk], [C.dusk, C.slate], [C.slate, C.dusk], [C.slate, C.stone], [C.stone, C.slate]];

function rockLevel(x: number, y: number): number {
  return Math.floor(fbm(x * 0.9, y * 1.05, 19) * 4.6);
}

function rockTone(x: number, y: number): number {
  const L = rockLevel(x, y);
  const [dark, light] = LEVEL_TONES[Math.max(0, Math.min(4, L - 0))];
  const n = vnoise(x, y, 5, 3) * 0.5 + hash2(x, y, 4) * 0.5;
  let c = n > 0.64 + (bayer(x, y) - 0.5) * 0.3 ? light : dark;
  // Klippenkante: oben/links hell, darunter Schatten
  const below = rockLevel(x, y + 2), above = rockLevel(x, y - 3), right = rockLevel(x + 2, y), left = rockLevel(x - 3, y);
  if (below < L || right < L) c = bayer(x, y) < 0.7 ? C.stone : C.silver;
  else if (above > L) c = bayer(x + 1, y) < 0.75 ? C.ink : C.night;
  else if (left > L && bayer(x, y) < 0.6) c = C.night;
  // Kiesel und Steinchen
  const hs = hash2(x, y, 6);
  if (hs > 0.992) c = C.stone; else if (hs < 0.008) c = C.night;
  return c;
}

function pathColor(x: number, y: number, pd: number, gx: number, gy: number): number | null {
  if (pd > Q_HW + 2.2) return null;
  const n = vnoise(x, y, 3.5, 21) * 0.7 + hash2(x, y, 22) * 0.3;
  const lit = -(gx * 0.6 + gy * 0.8);
  if (pd <= Q_HW - 0.6) {
    const edge = pd / Q_HW;
    let c = C.tan;
    if (edge < 0.72 && n > 0.62) c = C.peach;
    if (edge < 0.4 && n > 0.86) c = C.sand;
    if (n < 0.22 && edge > 0.3) c = C.wood;
    if (edge > 0.62) c = bayer(x, y) < (edge - 0.62) * 2.1 ? C.wood : C.tan;
    if (edge > 0.88) c = lit > 0 ? (bayer(x, y) < 0.5 ? C.peach : C.tan) : bayer(x + 1, y) < 0.65 ? C.bark : C.wood;
    if (pd > 3.6 && pd < 5.0 && n < 0.55 && ((x + y) & 1) === 0) c = C.wood;
    const hs = hash2(x, y, 5);
    if (hs > 0.987) c = C.sand; else if (hs < 0.012) c = C.bark;
    return c;
  }
  if (pd <= Q_HW + 0.9) return lit > 0.25 ? C.sand : lit > -0.25 ? C.wood : C.bark;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.wood : C.tan) : C.plum;
}

/** Lava (Bild f von ANIM_FRAMES, schliesst nahtlos): ineinanderfliessende Sinusfelder, Krustenplatten, helle Adern. */
function lavaColor(x: number, y: number, dep: number, f: number): number {
  const ph = (f / ANIM_FRAMES) * Math.PI * 2;
  if (dep < 1.4) return bayer(x, y) < 0.35 + 0.2 * Math.sin(ph + x * 0.4) ? C.crimson : C.plum; // dunkle Kruste am Rand
  const a = (Math.sin(x / 7 + Math.sin(y / 5 + ph)) + Math.sin(y / 5 + Math.sin(x / 9 - ph)) + Math.sin((x + y) / 10 + ph)) / 3;
  const b = Math.sin(x / 4.5 - ph + Math.sin(y / 6)) + Math.sin((x - y) / 5 + Math.sin(x / 7 + ph)) + Math.sin(y / 3.5 + ph);
  const n = vnoise(x, y, 7, 8) - 0.5;
  // Krustenplatten: kleine dunkle Schollen mit gluehendem Rand (selten)
  if (b > 2.15 && dep > 3.5) return b > 2.45 ? (bayer(x, y) < 0.6 ? C.plum : C.night) : bayer(x + 1, y) < 0.6 ? C.crimson : C.rust;
  // helle Adern dort, wo das Feld durch null geht (wie Zellgrenzen aus Magma)
  if (Math.abs(a - 0.1 + n * 0.3) < 0.055 && dep > 2) return bayer(x, y) < 0.55 ? C.yellow : C.amber;
  const deepPool = vnoise(x, y, 38, 17); // grosse, tiefere (dunklere) Becken
  const t = a * 0.7 + n * 0.6 + (bayer(x, y) - 0.5) * 0.3 - (dep < 3.5 ? (3.5 - dep) * 0.12 : 0) - (deepPool - 0.45) * 0.9;
  if (t > 0.75) return C.amber;
  if (t > 0.32) return bayer(x, y + 1) < 0.35 ? C.amber : C.orange;
  if (t > -0.08) return C.orange;
  if (t > -0.32) return bayer(x + 1, y + 1) < 0.5 ? C.orange : C.red;
  return t > -0.55 ? C.red : bayer(x, y) < 0.5 ? C.crimson : C.red;
}

export function paintQuarry(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const lava = new Field(polySdf(LAVA_DRAWN));
  const pf = pathField(Q_BRANCHES);
  const HW = Q_HW;
  const onBridge = (x: number, y: number): boolean => BRIDGES_Q.some(([a, b]) => x >= Math.min(a[0], b[0]) - 14 && x <= Math.max(a[0], b[0]) + 14 && y >= Math.min(a[1], b[1]) - 14 && y <= Math.max(a[1], b[1]) + 14);

  // 1) Fels, Weg, Lava (Grundton), Glutsaum
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ld = lava.at(x, y);
    const pd = pf.at(x, y);
    if (pd <= HW + 2.2 && (ld > 0 || onBridge(x, y))) {
      const [gx, gy] = pf.grad(x, y);
      const c = pathColor(x, y, pd, gx, gy);
      if (c !== null && ld > -1) { ground.set(x, y, c); continue; }
    }
    if (ld < 0) { ground.set(x, y, C.red); continue; }
    let c = rockTone(x, y);
    if (ld < 7) {
      const [gx, gy] = lava.grad(x, y);
      const k = bayer(x, y);
      if (ld < 1.6) c = k < 0.7 ? C.ink : C.plum; // Kruste
      else if (ld < 3.2) c = k < 0.55 ? C.plum : C.night;
      else if (k < (1 - (ld - 3.2) / 3.8) * 0.75) c = c === C.stone || c === C.silver ? C.wood : c === C.slate ? C.bark : c === C.dusk ? C.plum : c;
      void gx; void gy;
    }
    ground.set(x, y, c);
  }
  // Risse im Fels (zufaellige gezackte Linien in dunkel, daneben ein heller Punkt)
  const r = rng(20261016);
  for (let i = 0; i < 70; i++) {
    let x = Math.floor(r() * W), y = Math.floor(r() * H);
    if (lava.at(x, y) < 12 || pf.at(x, y) < HW + 6) continue;
    const len = 6 + Math.floor(r() * 14);
    let dx = r() < 0.5 ? 1 : -1, dy = r() < 0.5 ? 1 : 0;
    for (let k = 0; k < len; k++) {
      if (lava.at(x, y) < 6 || pf.at(x, y) < HW + 3) break;
      ground.set(x, y, C.ink); ground.set(x + 1, y - 1, C.slate);
      if (r() < 0.4) dy = dy ? 0 : 1; if (r() < 0.2) dx = -dx;
      x += dx; y += dy;
    }
  }
  // Fussspuren und Radspuren auf dem Weg
  for (const br of Q_BRANCHES) walk(br, 11, 5).forEach((p, i) => {
    const side = i % 2 ? 1 : -1;
    const x = Math.round(p.x - p.dy * side * 3), y = Math.round(p.y + p.dx * side * 3);
    if (pf.at(x, y) > HW - 3 || lava.at(x, y) < 1) return;
    ground.set(x, y, C.wood); ground.set(x + 1, y, C.bark);
  });
  // Randsteine am Weg
  for (let i = 0; i < 520; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    const pd = pf.at(x, y);
    if (pd < HW + 0.8 || pd > HW + 2.8 || lava.at(x, y) < 3) continue;
    if (hash2(x >> 2, y >> 2, 31) > 0.45) continue;
    ground.set(x, y, C.stone); ground.set(x + 1, y, C.slate); ground.set(x, y + 1, C.dusk); ground.set(x + 1, y + 1, C.dusk);
  }

  // 2) Schatten der Dinge, Kristallschein
  const props: PlacedArt[] = QUARRY_PROPS.map((prop) => ({ prop, art: quarryArt(prop.kind, prop.v) }));
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
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (shade[y * W + x] && lava.at(x, y) > 0) ground.set(x, y, shadeIdx(ground.get(x, y)));

  // 3) Lichter: Lava (orange), Laternen und Feuerkoerbe (warm), Kristalle (Farbe je Art)
  const lights: MapLight[] = [];
  for (const { prop, art } of props) {
    if (prop.kind === 'lamp') lights.push({ x: prop.x, y: prop.y + (art.hook?.y ?? -21), r: 26, warm: true, col: 'orange', flicker: 'flame' });
    else if (prop.kind === 'brazier') lights.push({ x: prop.x, y: prop.y - 16, r: 30, warm: true, col: 'orange', flicker: 'flame' });
    else if (prop.kind === 'mine') { lights.push({ x: prop.x - 21, y: prop.y - 20, r: 14, warm: true, col: 'yellow', flicker: 'flame' }); lights.push({ x: prop.x + 21, y: prop.y - 20, r: 14, warm: true, col: 'yellow', flicker: 'flame' }); }
    else if (prop.kind === 'scaffold') lights.push({ x: prop.x + 5, y: prop.y - 46, r: 16, warm: true, col: 'yellow', flicker: 'flame' });
    else if (prop.kind === 'crystal') lights.push({ x: prop.x, y: prop.y - 16, r: 22, warm: false, col: prop.v === 1 ? 'ice' : prop.v === 2 ? 'magenta' : 'violet', flicker: 'pulse' });
  }
  for (let gy = 8; gy < H; gy += 36) for (let gx = 8; gx < W; gx += 36) {
    // beste (tiefste) Lavastelle in der Zelle
    let best: [number, number] | null = null, bd = -7;
    for (let y = gy; y < gy + 36; y += 3) for (let x = gx; x < gx + 36; x += 3) { const d = lava.at(x, y); if (d < bd) { bd = d; best = [x, y]; } }
    if (best) lights.push({ x: best[0], y: best[1], r: 34, warm: true, col: 'orange', flicker: 'pulse' });
  }
  // Glutschein der Lava auf dem Fels (warme Raender gedithert, schon oben) und Pfuetzen unter Laternen
  for (const L of lights.filter((l) => l.flicker === 'flame' && l.r >= 26)) {
    const ly = L.y + 16, rx = L.r * 0.8, ry = L.r * 0.5;
    for (let y = Math.floor(ly - ry); y <= ly + ry; y++) for (let x = Math.floor(L.x - rx); x <= L.x + rx; x++) {
      const d = Math.hypot((x - L.x) / rx, (y - ly) / ry);
      if (d >= 1 || x < 0 || y < 0 || x >= W || y >= H || lava.at(x, y) < 0) continue;
      if (bayer(x, y) < (1 - d) * 0.8) {
        const c = ground.get(x, y);
        ground.set(x, y, c === C.night || c === C.ink ? C.plum : c === C.dusk ? C.bark : c === C.slate ? C.wood : c === C.stone ? C.peach : c === C.tan ? C.peach : c === C.peach ? C.sand : c);
      }
    }
  }
  for (const L of lights.filter((l) => l.flicker === 'pulse' && !l.warm)) {
    const pc = L.col === 'ice' ? [C.navy, C.sky] : L.col === 'magenta' ? [C.crimson, C.magenta] : [C.violet, C.orchid];
    for (let y = Math.floor(L.y - 6); y <= L.y + 12; y++) for (let x = Math.floor(L.x - 14); x <= L.x + 14; x++) {
      const d = Math.hypot((x - L.x) / 14, (y - L.y - 6) / 8);
      if (d >= 1 || x < 0 || y < 0 || x >= W || y >= H || lava.at(x, y) < 1 || pf.at(x, y) < HW) continue;
      const c = ground.get(x, y);
      if (bayer(x, y) < (1 - d) * 0.6 && (c === C.night || c === C.dusk || c === C.slate || c === C.ink)) ground.set(x, y, bayer(x + 1, y) < 0.5 ? pc[0] : c === C.slate ? pc[1] : pc[0]);
    }
  }
  // Vignette
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (e < 12 && lava.at(x, y) > 0 && bayer(x, y) < (12 - e) / 12 * 0.7) ground.set(x, y, shadeIdx(ground.get(x, y)));
  }

  const deco = new Buf(W, H);
  paintRails(deco, lava, pf);
  for (const br of BRIDGES_Q) paintBridge(deco, br, lava);
  const anim = Array.from({ length: ANIM_FRAMES }, (_, f) => paintLavaAnim(f, lava));
  const smoke: MapArt['smoke'] = [];
  return { id: 'quarry', name: 'Ember Quarry', ground, anim, animMs: 150, deco, props, lights, smoke };
}

// ---------- Lava-Bild ----------
function paintLavaAnim(f: number, lava: Field): Buf {
  const b = new Buf(MAP_W, MAP_H);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const ld = lava.at(x, y);
    if (ld >= 0) continue;
    let c = lavaColor(x, y, -ld, f);
    // Blasen: kleine Ringe, die aufgehen
    const bh = hash2(x >> 3, y >> 3, 14);
    if (bh > 0.985 && -ld > 5) {
      const cx = (x >> 3) * 8 + 4, cy = (y >> 3) * 8 + 4, k = (f + Math.floor(bh * 997)) % ANIM_FRAMES;
      const d = Math.hypot(x - cx, y - cy);
      if (k < 3 && Math.abs(d - (k + 1)) < 0.6) c = k === 0 ? C.yellow : C.amber;
    }
    b.set(x, y, c);
  }
  return b;
}

// ---------- Schienen ----------
/** Gleise (Lorenschienen): Stollen -> Wagen, Wagen im Mittelteil. Endpuffer als Holzbock. */
export const RAILS: Pt[][] = [
  [[60, 104], [60, 114], [112, 114]],
  [[336, 143], [420, 143]],
];
function paintRails(d: Buf, lava: Field, pf: Field): void {
  for (const line of RAILS) {
    // Schwellen (quer), alle 4 px
    walk(line, 4, 1).forEach((p) => {
      if (lava.at(p.x, p.y) < 5 || pf.at(p.x, p.y) < Q_HW + 2) return;
      const nx = -p.dy, ny = p.dx;
      for (let s = -5; s <= 5; s++) {
        const x = Math.round(p.x + nx * s), y = Math.round(p.y + ny * s);
        d.set(x, y, Math.abs(s) >= 4 ? C.bark : s < 0 ? C.wood : C.bark);
      }
    });
    // Schienen: zwei helle Linien, unten ein dunkler Saum
    for (const s of [-3, 3]) {
      const poly: Pt[] = line.map(([x, y], i) => {
        const [x0, y0] = line[Math.max(0, i - 1)], [x1, y1] = line[Math.min(line.length - 1, i + 1)];
        const l = Math.hypot(x1 - x0, y1 - y0) || 1;
        return [x - ((y1 - y0) / l) * s, y + ((x1 - x0) / l) * s] as Pt;
      });
      for (const p of walk(poly, 1)) {
        if (lava.at(p.x, p.y) < 5 || pf.at(p.x, p.y) < Q_HW + 2) continue;
        d.set(Math.round(p.x), Math.round(p.y), C.silver);
        d.set(Math.round(p.x), Math.round(p.y) + 1, C.slate);
      }
    }
  }
}

// ---------- Bruecken ----------
function paintBridge(d: Buf, [a, b]: [Pt, Pt], lava: Field): void {
  const horiz = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
  const hw = Q_HW + 1;
  const bx0 = horiz ? x0 - 5 : x0 - hw, bx1 = horiz ? x1 + 5 : x1 + hw, by0 = horiz ? y0 - hw : y0 - 5, by1 = horiz ? y1 + hw : y1 + 5;
  // Schatten und Glut auf der Lava darunter
  for (let y = by0 + 3; y <= by1 + 4; y++) for (let x = bx0 + 1; x <= bx1 + 3; x++) if (lava.at(x, y) < 0 && (x > bx1 - 1 || y > by1 - 1 || bayer(x, y) < 0.75)) d.set(x, y, bayer(x, y) < 0.6 ? C.plum : C.crimson);
  // Bohlen
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
    const along = horiz ? x - bx0 : y - by0, across = horiz ? y - by0 : x - bx0;
    const plank = Math.floor(along / 3), sep = along % 3 === 2;
    let c = sep ? C.bark : plank % 2 ? C.wood : C.tan;
    if (!sep && along % 3 === 0) c = plank % 2 ? C.tan : C.peach;
    if (hash2(plank, across >> 2, 8) > 0.88 && !sep) c = C.bark;
    d.set(x, y, c);
  }
  // Randbalken (dunkel, mit Glut im Holz)
  const rail = (x: number, y: number, w: number, h: number, hi: boolean): void => {
    d.rect(x, y, w, h, C.bark);
    if (horiz) { d.rect(x, y, w, 1, hi ? C.wood : C.plum); } else { d.rect(x, y, 1, h, hi ? C.wood : C.plum); }
  };
  if (horiz) { rail(bx0 - 1, by0 - 1, bx1 - bx0 + 3, 3, true); rail(bx0 - 1, by1 - 1, bx1 - bx0 + 3, 3, false); }
  else { rail(bx0 - 1, by0 - 1, 3, by1 - by0 + 3, true); rail(bx1 - 1, by0 - 1, 3, by1 - by0 + 3, false); }
  // Pfosten, Eisenringe und eine Kettenlaterne am Ende
  const posts: Pt[] = horiz ? [[bx0 - 1, by0 - 3], [bx1 - 1, by0 - 3], [bx0 - 1, by1 - 3], [bx1 - 1, by1 - 3]] : [[bx0 - 3, by0 - 1], [bx0 - 3, by1 - 1], [bx1 - 1, by0 - 1], [bx1 - 1, by1 - 1]];
  for (const [px, py] of posts) { d.rect(px, py - 3, 4, 7, C.bark); d.rect(px, py - 3, 1, 7, C.wood); d.rect(px, py - 4, 4, 1, C.tan); d.set(px + 1, py - 5, C.orange); }
}
