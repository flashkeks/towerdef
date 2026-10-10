/**
 * Mistwood Marsh (Runde 16 / K1): Sumpfkarte, Intermediate. Viel Wasser, wenig Land. Der Weg (ein Eingang, ~1.500 px) ist ein
 * Holzsteg und kommt aus `sim/data/maps/marsh.json` (scripts/gen-r16-paths.mjs). Wasser = Maske (siehe `isWater`), die
 * `scripts/gen-maps.ts` als Rechtecke in dieselbe Datei schreibt (Vereinigung der Rechtecke = gemaltes Wasser).
 * Licht von oben links, kuehl-violette Daemmerung, warme Steglaternen, Leuchtpilze, Glühwuermchen und Nebel (ambient.ts).
 */
import marsh from '../../../../sim/data/maps/marsh.json';
import { bayer, Buf, C, fbm, hash2, rng, shadeIdx, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { Field, walk, type Pt } from './kit';
import { marshArt, type MarshKind } from './props-marsh';
import { at, blockersOf, gradOf, lightPool, maskAreas, maskSdf, maskToRects, nudge, pathCoordsOf, placed, scatter, shadowPass, spriteOver, vignette, waterBase, waterFrame, type SceneProp, type WaterStyle } from './scene';
import type { MapArt, MapLight, PlacedArt } from './types';

const raw = marsh as unknown as { path: Pt[]; paths?: Pt[][]; pathHalfWidth: number; buildArea: [number, number, number, number] };
export const MA_BRANCHES: Pt[][] = raw.paths ?? [raw.path];
export const MA_HW: number = raw.pathHalfWidth;
export const ANIM_FRAMES = 8;

// ---------- Wasser: Maske ----------
/** Handinseln (Mitte x, y, Radius): dort stehen Pfahlhuette, Totem, Reiherfelsen. Immer Land. */
export const ISLANDS: [number, number, number][] = [[212, 152, 26], [496, 160, 17], [326, 196, 11]];

const sm = (a: number, b: number, v: number): number => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Wasser an Pixel (x, y)? Nicht in Wegbreite, nicht am Kartenrand (Sumpfwald), nicht in Wegnaehe (Land-Streifen unterschiedlicher Breite), nicht auf Hummocks. */
function isWater(x: number, y: number, pd: number): boolean {
  if (pd < MA_HW + 2.5) return false;
  const e = Math.min(x, MAP_W - 1 - x, y, MAP_H - 1 - y);
  if (e < 6 + 20 * vnoise(x, y, 30, 71)) return false;
  const land = 18 + 30 * sm(0.38, 0.7, vnoise(x, y, 42, 72));
  if (pd < land) return false;
  if (vnoise(x, y, 24, 73) > 0.8 && pd < 130) return false;
  for (const [ix, iy, ir] of ISLANDS) if (Math.hypot(x - ix, (y - iy) * 1.1) < ir + 4 * vnoise(x, y, 8, 74)) return false;
  return true;
}
const pcm = pathCoordsOf(MA_BRANCHES);
export const WATER_MASK: Uint8Array = (() => {
  const m = new Uint8Array(MAP_W * MAP_H);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) m[y * MAP_W + x] = isWater(x, y, pcm.dist[y * MAP_W + x]) ? 1 : 0;
  return m;
})();
const sdf = maskSdf(WATER_MASK);
/** Abstand zum Wasser in px: < 0 im Wasser. */
export const waterAt = (x: number, y: number): number => sdf[Math.max(0, Math.min(MAP_H - 1, y | 0)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, x | 0))];
export const waterPolygons = (): Pt[][] => maskToRects((x, y) => WATER_MASK[(y | 0) * MAP_W + (x | 0)] === 1, 4);
export const waterAreas = (): number[] => maskAreas(WATER_MASK);

// ---------- Dinge ----------
export type MarshProp = SceneProp<MarshKind>;
export const MARSH_R: Record<MarshKind, number> = {
  cypress: 7, dead: 4, mangrove: 9, sbush: 3, reeds: 0, hut: 20, lantern: 2, mushroom: 2, mosslog: 0, rock: 5, stump: 4, boat: 0,
  heron: 0, totem: 4, fern: 0, bones: 0,
};
const P = (kind: MarshKind, x: number, y: number, v = 0): MarshProp => ({ kind, x, y, v, r: MARSH_R[kind] });

export function overlaps(p: MarshProp): boolean {
  const art = marshArt(p.kind, p.v);
  if (spriteOver(art, p, (x, y) => at(pcm.dist, x, y) < MA_HW + 1) > 0) return true;
  if (p.x < 4 || p.x > MAP_W - 4 || p.y < 10 || p.y > MAP_H - 2) return true;
  return false;
}

const HAND_RAW: MarshProp[] = [
  P('hut', 212, 164), P('lantern', 192, 168), P('boat', 244, 190), P('mushroom', 232, 168, 1), P('reeds', 184, 176, 0), P('sbush', 232, 152),
  P('totem', 496, 168), P('mushroom', 482, 172, 0), P('mushroom', 512, 170, 2), P('bones', 504, 176), P('fern', 484, 160),
  P('heron', 326, 202), P('rock', 336, 204), P('mosslog', 120, 190), P('mosslog', 410, 280),
];
// Steglaternen: alle ~64 px entlang des Weges, abwechselnd links und rechts
for (const br of MA_BRANCHES) walk(br, 64, 30).forEach((p, i) => {
  const side = i % 2 ? 1 : -1;
  HAND_RAW.push(P('lantern', Math.round(p.x - p.dy * side * (MA_HW + 6)), Math.round(p.y + p.dx * side * (MA_HW + 6) + 6)));
});
const landAt = (x: number, y: number): boolean => waterAt(x, y) > 4;
const HAND: MarshProp[] = nudge(HAND_RAW, (p) => !overlaps(p) && (p.r === 0 || p.kind === 'lantern' || landAt(p.x, p.y) || p.kind === 'hut'));

function scatterProps(): MarshProp[] {
  return scatter<MarshKind>({
    seed: 16031, tries: 20000, max: 190, hand: HAND, branches: MA_BRANCHES, hw: MA_HW, gap: 1.6,
    pick: (x, y, rnd) => {
      const wd = waterAt(x, y);
      const edge = Math.min(x, MAP_W - x, y * 1.3, (MAP_H - y) * 1.1);
      const roll = rnd();
      if (wd < 0) { // Wasser: Schilf am Ufer, Treibholz, Reiher
        if (wd > -7 && roll < 0.3) return P('reeds', x, y, Math.floor(rnd() * 3));
        if (wd < -10 && roll > 0.985) return P('mosslog', x, y, 0);
        return null;
      }
      if (wd < 3) return roll < 0.25 ? P('reeds', x, y, Math.floor(rnd() * 3)) : null; // Uferstreifen
      const dens = edge < 50 ? 0.95 : 0.3 + (vnoise(x, y, 60, 33) > 0.55 ? 0.35 : 0);
      if (rnd() > dens) return null;
      const k = roll;
      const kind: MarshKind = wd < 12 && k < 0.2 ? 'mangrove' : k < 0.33 ? 'cypress' : k < 0.5 ? 'dead' : k < 0.6 ? 'mangrove' : k < 0.72 ? 'sbush' : k < 0.8 ? 'mushroom' : k < 0.88 ? 'fern' : k < 0.94 ? 'rock' : 'stump';
      return P(kind, x, y, Math.floor(rnd() * (kind === 'cypress' || kind === 'dead' ? 2 : kind === 'mushroom' ? 3 : kind === 'sbush' ? 2 : 2)));
    },
    free: (p) => !overlaps(p),
  });
}
export const MARSH_PROPS: MarshProp[] = (() => [...HAND, ...scatterProps()].sort((a, b) => a.y - b.y))();

/** Blocker: alle Dinge mit Radius auf Land (was im Wasser steht, braucht die Sim nicht zu kennen). */
export function blockers(): [number, number, number][] {
  return blockersOf(MARSH_PROPS, raw.buildArea, (q) => waterAt(q.x, q.y) < -2);
}

// ---------- Malen ----------
const BOG: WaterStyle = { shallow: C.navy, mid: C.deep, deep: C.night, glint: C.ice, foam: C.silver, tint: C.dusk, shore: C.night };

function landTone(x: number, y: number, wd: number): number {
  const n = fbm(x, y, 11);
  const wx = Math.max(0, (130 - x) / 130);
  let lit = n - 0.5 + (bayer(x, y) - 0.5) * 0.1 + (vnoise(x, y, 60, 12) - 0.5) * 0.2;
  let c: number;
  if (lit > 0.17) c = C.grass;
  else if (lit > -0.05) c = bayer(x, y + 1) < 0.5 ? C.pine : C.grass;
  else if (lit > -0.18) c = C.pine;
  else c = C.deep;
  if (lit > 0.3 && bayer(x + 1, y) < 0.35) c = C.leaf;
  // Schlammflecken
  const mud = vnoise(x, y, 18, 13);
  if (mud > 0.66) c = bayer(x, y) < (mud - 0.66) * 5 ? (mud > 0.78 ? C.bark : C.wood) : c;
  if (mud > 0.82) c = bayer(x + 1, y + 1) < 0.5 ? C.bark : C.plum;
  // Westen: violette Daemmerung
  if (wx > 0.35 && (c === C.deep || c === C.pine) && bayer(x + 3, y + 1) < wx * 0.55) c = C.violet;
  // Ufer: nasser Schlamm
  if (wd < 4.5) {
    if (wd < 1.6) c = bayer(x, y) < 0.6 ? C.plum : C.bark;
    else if (wd < 3.2) c = bayer(x, y + 1) < 0.5 ? C.bark : C.deep;
    else if (bayer(x + 1, y) < 0.35) c = C.pine;
  }
  return c;
}

function plankColor(x: number, y: number, pd: number, s: number, lit: number): number {
  if (pd > MA_HW - 0.2) return lit > 0 ? (bayer(x, y) < 0.5 ? C.tan : C.wood) : C.plum; // Holm aussen
  if (pd > MA_HW - 2.2) return lit > 0.1 ? C.wood : C.bark; // Randbalken
  const idx = Math.floor(s / 3), r = s % 3;
  if (r >= 2) return C.plum; // Fuge
  const h = hash2(idx, 3, 71);
  let c = h > 0.66 ? C.tan : h > 0.2 ? C.wood : C.bark;
  if (r < 1 && c !== C.bark) c = c === C.tan ? C.peach : C.tan; // Lichtkante der Planke
  if (hash2(x + idx, y, 72) > 0.93) c = C.bark; // Maserung
  if (hash2(Math.floor(x / 3) + idx, Math.floor(y / 3), 73) > 0.9) c = h > 0.5 ? C.grass : C.pine; // Moos
  if (h < 0.03) c = hash2(x, y, 74) > 0.8 ? C.night : C.plum; // morsche Stelle
  return c;
}

export function paintMarsh(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const water = new Field(sdf);

  // 1) Land, Wasser, Steg
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const pd = pcm.dist[i];
    const wd = sdf[i];
    const [gx, gy] = gradOf(pcm.dist, x, y);
    const lit = -(gx * 0.6 + gy * 0.8);
    if (pd <= MA_HW + 0.6) { ground.set(x, y, plankColor(x, y, pd, Math.floor(pcm.s[i]), lit)); continue; }
    if (wd < 0) {
      const [wx, wy] = water.grad(x, y);
      let c = waterBase(x, y, -wd, -(wx * 0.6 + wy * 0.8), BOG, 9);
      if (-wd > 2 && c === C.deep && bayer(x + 1, y + 3) < 0.28) c = C.navy;
      // Schatten des Stegs aufs Wasser (unten rechts vom Steg)
      if (pd < MA_HW + 4.5 && lit < -0.05 && bayer(x, y) < 0.8) c = shadeIdx(c, pd < MA_HW + 2.5 ? 2 : 1);
      // Algenfilm / Entengruetze
      const duck = vnoise(x, y, 7, 14);
      if (duck > 0.7 && bayer(x + 1, y) < (duck - 0.7) * 4) c = bayer(x, y + 1) < 0.4 ? C.leaf : C.grass;
      // dunstige Tiefenzonen: tieferes Wasser mit violetter Spiegelung
      if (-wd > 6 && vnoise(x, y, 26, 15) > 0.7 && bayer(x + 2, y + 2) < 0.28) c = C.dusk;
      ground.set(x, y, c);
      continue;
    }
    let c = landTone(x, y, wd);
    // Steg wirft Schatten aufs Land
    if (pd < MA_HW + 4 && lit < -0.05 && bayer(x, y) < 0.7) c = shadeIdx(c);
    ground.set(x, y, c);
  }

  // 2) Streu: Grasbueschel, Pfuetzen, Bluetchen, Entengruetze, Steinchen
  const r = rng(20261031);
  const isLand = (x: number, y: number): boolean => waterAt(x, y) > 3 && at(pcm.dist, x, y) > MA_HW + 3;
  for (let i = 0; i < 1500; i++) {
    const x = Math.floor(r() * (W - 4)) + 2, y = Math.floor(r() * (H - 6)) + 4;
    if (!isLand(x, y)) continue;
    const base = ground.get(x, y), dark = shadeIdx(base), light = base === C.deep || base === C.pine ? C.grass : C.leaf;
    const t = Math.floor(r() * 3);
    ground.set(x, y, dark);
    if (t === 0) { ground.set(x - 1, y - 1, dark); ground.set(x + 1, y - 1, dark); ground.set(x, y - 1, light); ground.set(x, y - 2, light); }
    else if (t === 1) { ground.set(x - 1, y, dark); ground.set(x + 1, y, dark); ground.set(x - 1, y - 1, light); ground.set(x + 1, y - 2, light); }
    else { ground.set(x + 1, y, dark); ground.set(x, y - 1, light); ground.set(x + 1, y - 2, light); }
  }
  for (let k = 0; k < 70; k++) { // winzige Pfuetzen auf dem Land
    const cx = Math.round(r() * W), cy = Math.round(r() * H);
    if (!isLand(cx, cy) || waterAt(cx, cy) < 8) continue;
    ground.ellipse(cx, cy, 3 + Math.floor(r() * 3), 1.5, C.dusk);
    ground.ellipse(cx - 1, cy - 1, 2, 0.8, C.slate); ground.set(cx - 1, cy - 1, C.ice);
  }
  const FL = [C.orchid, C.white, C.coral, C.yellow];
  for (let k = 0; k < 60; k++) {
    const cx = r() * W, cy = r() * H;
    if (!isLand(Math.round(cx), Math.round(cy))) continue;
    const col = FL[Math.floor(r() * FL.length)];
    for (let j = 0; j < 4; j++) { const x = Math.round(cx + (r() - 0.5) * 12), y = Math.round(cy + (r() - 0.5) * 7); if (isLand(x, y)) { ground.set(x, y + 1, C.pine); ground.set(x, y, col); } }
  }

  // 3) Dinge, Schatten
  const props: PlacedArt[] = placed(MARSH_PROPS, marshArt);
  shadowPass(ground, props);

  // 4) Licht
  const lights: MapLight[] = [];
  const smoke: MapArt['smoke'] = [];
  for (const { prop, art } of props) {
    if (prop.kind === 'lantern') lights.push({ x: prop.x + (art.hook?.x ?? -4), y: prop.y + (art.hook?.y ?? -20), r: 26, warm: true, flicker: 'flame' });
    else if (prop.kind === 'hut') { lights.push({ x: prop.x - 12, y: prop.y - 28, r: 20, warm: true, flicker: 'flame' }); smoke.push({ x: prop.x + (art.hook?.x ?? 12), y: prop.y + (art.hook?.y ?? -60) + 2 }); }
    else if (prop.kind === 'boat') lights.push({ x: prop.x, y: prop.y - 12, r: 16, warm: true, flicker: 'flame' });
    else if (prop.kind === 'mushroom') lights.push({ x: prop.x, y: prop.y - 7, r: 16, warm: false, col: prop.v === 1 ? 'ice' : prop.v === 2 ? 'magenta' : 'violet', flicker: 'pulse' });
    else if (prop.kind === 'totem') lights.push({ x: prop.x, y: prop.y - 16, r: 18, warm: false, col: 'ice', flicker: 'pulse' });
  }
  // Irrlichter ueber dem Wasser (kalt, pulsierend)
  for (const [x, y] of [[300, 36], [90, 232], [420, 330], [560, 40], [248, 288]] as const) if (waterAt(x, y) < -3) lights.push({ x, y, r: 12, warm: false, col: 'ice', flicker: 'pulse' });
  for (const L of lights.filter((l) => l.warm && l.r >= 24)) {
    lightPool(ground, L.x, L.y + 16, 20, 13, (c) => c === C.wood ? C.tan : c === C.tan ? C.peach : c === C.bark ? C.wood : c === C.pine ? C.grass : c === C.grass ? C.leaf : c === C.deep ? C.pine : c === C.dusk ? C.slate : c === C.pine ? C.grass : c, 0.85);
  }
  vignette(ground, 16, 0.8);
  // kuehle Daemmerung an den Raendern: dunkle Tiefen werden violett
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (e < 26 && bayer(x + 2, y + 1) < (26 - e) / 26 * 0.4) { const c = ground.get(x, y); if (c === C.deep) ground.set(x, y, C.night); else if (c === C.pine) ground.set(x, y, C.deep); }
  }

  const deco = new Buf(W, H);
  paintPosts(deco, water);
  const anim = Array.from({ length: ANIM_FRAMES }, (_, f) => paintAnim(f, water, props));
  return { id: 'marsh', name: 'Mistwood Marsh', ground, anim, animMs: 160, deco, props, lights, smoke };
}

/** Pfosten und Seil am Steg: alle 24 px beidseits ein Pfahl, dazwischen ein durchhaengendes Seil. */
function paintPosts(d: Buf, water: Field): void {
  for (const br of MA_BRANCHES.slice(0, 1)) {
    const pts = walk(br, 24, 6);
    for (const side of [-1, 1]) {
      let prev: [number, number] | null = null;
      for (const p of pts) {
        const x = Math.round(p.x - p.dy * side * (MA_HW + 0.6)), y = Math.round(p.y + p.dx * side * (MA_HW + 0.6));
        d.rect(x - 1, y - 5, 3, 7, C.bark); d.rect(x - 1, y - 5, 1, 7, C.wood); d.set(x, y - 6, C.tan); d.set(x + 1, y + 2, C.plum);
        if (water.at(x, y + 3) < 0) { d.set(x - 2, y + 3, C.deep); d.set(x + 2, y + 3, C.deep); }
        if (prev) {
          const n = Math.round(Math.hypot(x - prev[0], y - prev[1]));
          for (let t = 1; t < n; t++) { const f = t / n; d.set(Math.round(prev[0] + (x - prev[0]) * f), Math.round(prev[1] + (y - prev[1]) * f) - 4 + Math.round(Math.sin(f * Math.PI) * 2), C.tan); }
        }
        prev = [x, y];
      }
    }
  }
}

// ---------- Bewegte Ebene ----------
function paintAnim(f: number, water: Field, props: PlacedArt[]): Buf {
  const b = waterFrame(f, ANIM_FRAMES, water, BOG, { flow: [1, 0], sparkle: 0.9972, minDep: 1.5 });
  const r = rng(909);
  // Seerosenblaetter, die leicht wippen
  for (let i = 0; i < 60; i++) {
    const lx = Math.floor(r() * (MAP_W - 20)) + 10, ly = Math.floor(r() * (MAP_H - 20)) + 10, ph = Math.floor(r() * ANIM_FRAMES);
    if (water.at(lx, ly) > -6 || at(pcm.dist, lx, ly) < MA_HW + 8) continue;
    const bob = Math.round(Math.sin(((f + ph) / ANIM_FRAMES) * Math.PI * 2) * 0.6);
    const y = ly + bob;
    b.ellipse(lx, y, 4, 2.2, C.pine); b.ellipse(lx - 1, y - 1, 3, 1.3, C.grass); b.set(lx + 1, y - 1, C.leaf);
    b.set(lx + 2, y, C.deep); b.set(lx + 3, y, C.deep); // Kerbe
    if (i % 3 === 0) { b.set(lx - 1, y - 1, C.orchid); b.set(lx, y - 2, C.white); b.set(lx - 2, y - 1, C.coral); }
  }
  // Blasen, die aufsteigen und platzen
  for (let i = 0; i < 26; i++) {
    const bx = Math.floor(r() * (MAP_W - 12)) + 6, by = Math.floor(r() * (MAP_H - 12)) + 6, ph = Math.floor(r() * ANIM_FRAMES);
    if (water.at(bx, by) > -5 || at(pcm.dist, bx, by) < MA_HW + 4) continue;
    const k = (f - ph + ANIM_FRAMES) % ANIM_FRAMES;
    if (k === 0) b.set(bx, by, C.silver);
    else if (k === 1) { b.set(bx, by, C.ice); b.set(bx - 1, by, C.silver); b.set(bx + 1, by, C.silver); }
    else if (k === 2) { b.set(bx - 2, by, C.silver); b.set(bx + 2, by, C.silver); b.set(bx, by - 1, C.white); }
  }
  // Wellenringe um Pfosten-/Dinge im Wasser (Stumpf, Stein, Schilf)
  for (const { prop } of props) {
    if (!(prop.kind === 'rock' || prop.kind === 'stump' || prop.kind === 'reeds' || prop.kind === 'mosslog' || prop.kind === 'heron')) continue;
    if (water.at(prop.x, prop.y) > -2) continue;
    const rr = 5 + ((f + prop.x) % ANIM_FRAMES) * 0.6;
    for (let a = 0; a < 14; a++) { const an = (a / 14) * Math.PI * 2 + 0.3; if (((a + f) & 1) === 0) b.set(Math.round(prop.x + Math.cos(an) * rr * 1.6), Math.round(prop.y + 1 + Math.sin(an) * rr * 0.55), C.stone); }
  }
  return b;
}
