/**
 * Gloomharbor (Runde 16 / K2): Hafenstadt bei Nacht, gemalt wie Meadow/Frostfen. Lage der Dinge steht in `harbor-layout.ts`
 * (Wege, Hafenbecken = Wasser, Mauern, Haeuser, Stege, Schiffe -> `sim/data/maps/harbor.json`). Hier wird gemalt:
 * Kopfsteinpflaster (Strassen heller), Kaimauer mit Anlegekante, Stadtmauer mit Zinnen, Holzstege, Hafenbecken mit
 * Wellen, Mondglanz, Laternenspiegelungen und dem kreisenden Leuchtturmstrahl. Laternen, Fenster und Schiffslaternen warm.
 */
import { bayer, Buf, C, hash2, rng, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { Field, pathField, walk } from './kit';
import { castShadows, lightPools, vignette, type Rect } from './k2kit';
import { HB_BRANCHES, HB_HW, HB_PIERS, HB_PROPS, HB_WALLS, footRect, seaField } from './harbor-layout';
import { harborArt } from './props-harbor';
import type { MapArt, MapLight, PlacedArt } from './types';

export const HB_ANIM_FRAMES = 12;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Leuchtturm: Spitze der Laterne (fuer Strahl und Licht) */
export const HB_BEAM: [number, number] = [596, 196];

// ---------- Pflaster ----------
function cobble(x: number, y: number, street: boolean): number {
  const row = Math.floor(y / 4), off = (row % 2) * 3;
  const col = Math.floor((x + off) / 7), ix = (x + off) % 7, iy = y % 4;
  const k = hash2(col, row, 3);
  if (ix === 6 || iy === 3) return street ? C.dusk : C.night;
  if (street) {
    let c = k < 0.18 ? C.dusk : k < 0.5 ? C.slate : k < 0.85 ? C.stone : C.silver;
    if (iy === 0 && ix < 6) c = c === C.silver ? C.silver : k > 0.5 ? C.silver : C.stone; // Mondlicht auf der Oberkante
    if (hash2(x, y, 11) > 0.95) c = C.slate;
    return c;
  }
  let c = k < 0.3 ? C.night : k < 0.8 ? C.dusk : C.slate;
  if (iy === 0 && ix < 6) c = k < 0.3 ? C.dusk : C.slate;
  if (hash2(x, y, 11) > 0.96) c = C.night;
  return c;
}

function streetColor(x: number, y: number, pd: number, gx: number, gy: number): number | null {
  if (pd > HB_HW + 2.2) return null;
  const lit = -(gx * 0.6 + gy * 0.8);
  if (pd <= HB_HW - 1.6) {
    let c = cobble(x, y, true);
    // abgenutzte Mitte heller, Rinne an den Raendern dunkler
    if (pd < 4 && hash2(x, y, 17) > 0.75) c = c === C.slate ? C.stone : c === C.dusk ? C.slate : c;
    if (pd > HB_HW - 3.4 && hash2(x, y, 18) > 0.4) c = c === C.stone ? C.slate : c === C.slate ? C.dusk : c;
    return c;
  }
  // Bordstein
  if (pd <= HB_HW + 0.9) return lit > 0.2 ? (bayer(x, y) < 0.7 ? C.silver : C.stone) : lit > -0.2 ? C.stone : C.slate;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.slate : C.dusk) : C.night;
}

// ---------- Wasser ----------
/** Nachtwasser: dunkle Grundtoene, Wellenkaemme als kurze Striche (wandern mit f), Mondfunken im Nordwesten des Beckens. */
function seaColor(x: number, y: number, dep: number, f: number): number {
  const ph = (f / HB_ANIM_FRAMES) * Math.PI * 2;
  const n = vnoise(x, y, 26, 4) * 0.55 + vnoise(x, y, 9, 5) * 0.45;
  const d = clamp01((dep - 2) / 45);
  const w = Math.sin(y / 2.3 + 2.6 * Math.sin(x / 14 + ph) + x / 37) + 0.5 * Math.sin(y / 1.3 - x / 9 + ph * 2);
  const crest = w > 1.15 && vnoise(x + f * 2, y, 6, 7) > 0.45;
  const moon = clamp01(1 - Math.hypot(x - 150, (y - 270) * 1.7) / 170);
  if (crest) {
    if (hash2(x + f * 5, y, 3) > 0.985 - moon * 0.05) return C.white;
    return n > 0.45 - moon * 0.2 ? (bayer(x, y) < 0.35 + moon * 0.5 ? C.silver : C.slate) : C.dusk;
  }
  const v = n - d * 0.35 + (bayer(x, y) - 0.5) * 0.25 + (w > 0.4 ? 0.06 : 0);
  if (v > 0.72) return C.navy;
  if (v > 0.5) return bayer(x + 1, y) < 0.4 ? C.navy : C.night;
  if (v > 0.28) return C.night;
  return bayer(x, y) < 0.4 ? C.night : C.ink;
}

function drawWall(deco: Buf, [x0, y0, x1, y1]: Rect): void {
  const horiz = x1 - x0 >= y1 - y0;
  const T = { dark: C.dusk, mid: C.slate, light: C.stone };
  // Oberseite: Quader
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const row = Math.floor((horiz ? y - y0 : x - x0) / 3), off = row % 2 ? 3 : 0;
    const along = horiz ? x - x0 : y - y0;
    const ix = (along + off) % 6, iy = (horiz ? y - y0 : x - x0) % 3;
    let c = iy === 2 || ix === 5 ? C.dusk : T.mid;
    const k = hash2(Math.floor((along + off) / 6), row, 31);
    if (k > 0.75 && iy < 2 && ix < 5) c = T.light;
    if (y === y0 || x === x0) c = C.silver;
    if (y === y1 || x === x1) c = C.dusk;
    deco.set(x, y, c);
  }
  // Zinnen: Zahn/Luecke, die Vorderseite (Sued) bzw. die Ostseite faellt nach unten bzw. rechts ab
  if (horiz) {
    for (let x = x0; x <= x1; x++) {
      const merlon = Math.floor((x - x0) / 4) % 2 === 0;
      const h = merlon ? 6 : 2;
      for (let k = 1; k <= h; k++) deco.set(x, y1 + k, k === 1 ? C.stone : k === h ? C.night : (x - x0) % 4 === 3 ? C.dusk : C.slate);
      if (merlon) deco.set(x, y0 - 1, (x - x0) % 4 === 0 ? C.silver : C.stone); // Zahnkrone
    }
  } else {
    for (let y = y0; y <= y1; y++) {
      const merlon = Math.floor((y - y0) / 4) % 2 === 0;
      const h = merlon ? 5 : 2;
      for (let k = 1; k <= h; k++) deco.set(x1 + k, y, k === h ? C.ink : C.dusk);
      if (merlon) deco.set(x0 - 1, y, C.stone);
    }
  }
}

function drawPier(deco: Buf, [x0, y0, x1, y1]: Rect): void {
  // Schatten rechts im Wasser
  for (let y = y0 + 3; y <= y1 + 3; y++) for (let x = x1 + 1; x <= x1 + 4; x++) if (bayer(x, y) < 0.75 - (x - x1) * 0.12) deco.set(x, y, C.ink);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const plank = Math.floor((y - y0) / 3), sep = (y - y0) % 3 === 2;
    let c = sep ? C.plum : plank % 2 ? C.bark : C.wood;
    if (!sep && (y - y0) % 3 === 0) c = plank % 2 ? C.wood : C.tan;
    if (x === x0) c = C.plum; else if (x === x1) c = C.night;
    if (hash2(plank, x, 8) > 0.9 && !sep) c = C.plum;
    deco.set(x, y, c);
  }
  // Pfosten an den Seiten
  for (let y = y0 + 4; y <= y1; y += 14) for (const px of [x0 - 1, x1 - 1]) { deco.rect(px, y - 3, 3, 6, C.plum); deco.rect(px, y - 3, 1, 6, C.bark); deco.set(px + 1, y - 4, C.slate); }
  deco.rect(x0, y1 + 1, x1 - x0 + 1, 1, C.plum);
}

export function paintHarbor(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const sea = seaField;
  const pf = pathField(HB_BRANCHES);
  const HW = HB_HW;
  const r = rng(20261016);

  // 1) Land: Pflaster, Strassen, Kaikante; Wasser (Grundton)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sd = sea.at(x, y);
    if (sd < 0) {
      // Kaimauer: Ansicht der Mauerflaeche unter dem Rand (Land liegt oberhalb)
      let k = 0;
      for (let t = 1; t <= 6 && !k; t++) if (sea.at(x, y - t) >= 0) k = t;
      if (k) ground.set(x, y, k <= 1 ? C.stone : k === 2 ? C.slate : (k + (x >> 2)) % 3 === 0 ? C.night : k > 4 ? C.ink : C.dusk);
      else ground.set(x, y, seaColor(x, y, -sd, 0));
      continue;
    }
    const pd = pf.at(x, y);
    if (pd <= HW + 2.2) {
      const [gx, gy] = pf.grad(x, y);
      const c = streetColor(x, y, pd, gx, gy);
      if (c !== null) { ground.set(x, y, c); continue; }
    }
    let c = cobble(x, y, false);
    // Kai: breite helle Platten entlang der Kante, dazu Kantenstein
    if (sd < 15) {
      const slab = hash2(Math.floor(x / 11), Math.floor(y / 6), 21);
      c = (x % 11 === 0 || y % 6 === 0) ? C.night : slab > 0.6 ? C.slate : slab > 0.25 ? C.dusk : C.slate;
      if (sd < 1.6) c = bayer(x, y) < 0.7 ? C.silver : C.stone;
      else if (sd < 2.6) c = C.dusk;
    }
    // Pfuetzen und Moos
    const pn = vnoise(x, y, 14, 41);
    if (pn > 0.8 && sd > 15 && pd > HW + 4) c = bayer(x, y) < 0.55 ? C.navy : C.dusk;
    if (vnoise(x, y, 18, 42) > 0.8 && hash2(x, y, 43) > 0.72 && pd > HW + 3) c = hash2(x, y, 44) > 0.5 ? C.pine : C.deep;
    ground.set(x, y, c);
  }
  // Fussspuren/Radspuren auf den Strassen, Leitersprossen im Kai-Stein
  for (const br of HB_BRANCHES) walk(br, 11, 4).forEach((p, i) => {
    const side = i % 2 ? 1 : -1;
    const x = Math.round(p.x - p.dy * side * 4), y = Math.round(p.y + p.dx * side * 4);
    if (pf.at(x, y) > HW - 4 || sea.at(x, y) < 1) return;
    ground.set(x, y, C.dusk); ground.set(x + 1, y, C.night);
  });
  // Streu: Muscheln/Kiesel an der Kaikante, Pflasterluecken
  for (let i = 0; i < 700; i++) {
    const x = Math.floor(r() * (W - 6)) + 3, y = Math.floor(r() * (H - 6)) + 3;
    if (pf.at(x, y) < HW + 3 || sea.at(x, y) < 3) continue;
    const k = r();
    if (k < 0.5) { ground.set(x, y, C.night); ground.set(x + 1, y, C.ink); }
    else if (k < 0.8) { ground.set(x, y, C.slate); ground.set(x + 1, y, C.stone); }
    else { ground.set(x, y, C.stone); }
  }

  // 2) Schatten der Dinge (Haeuser, Schiffe, Kleinkram), Mauerschatten
  const props: PlacedArt[] = HB_PROPS.map((prop) => ({ prop, art: harborArt(prop.kind, prop.v) }));
  castShadows(ground, props, (x, y) => sea.at(x, y) > 0);
  for (const [x0, y0, x1, y1] of HB_WALLS) {
    const horiz = x1 - x0 >= y1 - y0;
    for (let y = y0; y <= y1 + 9; y++) for (let x = x0; x <= x1 + 6; x++) {
      const insideTop = x >= x0 && x <= x1 && y >= y0 && y <= y1;
      if (insideTop) continue;
      const dx = horiz ? 0 : x - x1, dy = horiz ? y - y1 : 0;
      if ((horiz ? dy > 6 && dy < 10 : dx > 4 && dx < 8) && bayer(x, y) < 0.5 && sea.at(x, y) > 0) ground.set(x, y, C.ink);
    }
  }

  // 3) Lichter
  const lights: MapLight[] = [];
  const smoke: MapArt['smoke'] = [];
  for (const { prop, art } of props) {
    const hy = art.hook?.y ?? 0;
    switch (prop.kind) {
      case 'lamp': lights.push({ x: prop.x, y: prop.y + hy, r: 30, warm: true, col: 'yellow', flicker: 'flame' }); break;
      case 'tavern': lights.push({ x: prop.x, y: prop.y - 20, r: 24, warm: true, col: 'orange', flicker: 'flame' }); smoke.push({ x: prop.x + (art.hook?.x ?? 0), y: prop.y + hy }); break;
      case 'cottage': lights.push({ x: prop.x, y: prop.y - 12, r: 14, warm: true, col: 'orange', flicker: 'flame' }); smoke.push({ x: prop.x + (art.hook?.x ?? 0), y: prop.y + hy }); break;
      case 'house': lights.push({ x: prop.x, y: prop.y - 16, r: 14, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'warehouse': lights.push({ x: prop.x - 18, y: prop.y - 12, r: 14, warm: true, col: 'yellow', flicker: 'flame' }); break;
      case 'customs': lights.push({ x: prop.x, y: prop.y - 12, r: 22, warm: true, col: 'yellow', flicker: 'flame' }); break;
      case 'gatetower': lights.push({ x: prop.x + 8, y: prop.y - 20, r: 20, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'ship': lights.push({ x: prop.x + (art.buf.w >> 1) - 6, y: prop.y - 22, r: 18, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'lighthouse': lights.push({ x: prop.x, y: prop.y - 82, r: 44, warm: true, col: 'yellow', flicker: 'pulse' }); break;
      case 'fountain': lights.push({ x: prop.x, y: prop.y - 14, r: 16, warm: false, col: 'ice', flicker: 'pulse' }); break;
      default: break;
    }
  }
  const warm = new Map<number, number>([[C.night, C.plum], [C.dusk, C.bark], [C.slate, C.wood], [C.stone, C.peach], [C.silver, C.sand], [C.ink, C.plum], [C.navy, C.dusk]]);
  lightPools(ground, lights, warm, 14, (x, y) => sea.at(x, y) > 3);
  vignette(ground, (x, y) => sea.at(x, y) > 0);

  // 4) Deko: Stadtmauer, Stege
  const deco = new Buf(W, H);
  for (const w of HB_WALLS) drawWall(deco, w);
  for (const p of HB_PIERS) drawPier(deco, p);
  // Festmacherleinen: Schiffe an Pollern bzw. Stegen
  const anim = Array.from({ length: HB_ANIM_FRAMES }, (_, f) => paintSeaAnim(f, sea, props, lights));
  return { id: 'harbor', name: 'Gloomharbor', ground, anim, animMs: 150, deco, props, lights, smoke };
}

/** Animierte Ebene (nur Wasserpixel belegt): Wellen, Mondglanz, Laternenspiegelungen, Schaum an der Kai und der Leuchtturmstrahl. */
function paintSeaAnim(f: number, sea: Field, props: PlacedArt[], lights: MapLight[]): Buf {
  const b = new Buf(MAP_W, MAP_H);
  const x0 = 0, x1 = 510, y0 = 205;
  for (let y = y0; y < MAP_H; y++) for (let x = x0; x < x1; x++) {
    const sd = sea.at(x, y);
    if (sd >= 0) continue;
    let k = 0;
    for (let t = 1; t <= 6 && !k; t++) if (sea.at(x, y - t) >= 0) k = t;
    if (k) { // Kaimauer: ein heller Wasserrand, der pulsiert
      if (k >= 6 && f % 2 === 0) b.set(x, y, bayer(x, y) < 0.5 ? C.slate : C.dusk);
      if (k >= 5) continue;
      continue;
    }
    b.set(x, y, seaColor(x, y, -sd, f));
    // Schaumsaum an der Kaimauer
    if (-sd > 6 && -sd < 8.2 && (x + f * 2) % 7 < 2 && hash2(x, y, 5) > 0.5) b.set(x, y, C.silver);
  }
  // Spiegelungen: Laternen und Schiffslichter als senkrechte, wabernde Striche
  const refl: [number, number][] = [];
  for (const L of lights) if (L.col === 'yellow' || L.col === 'orange') { if (L.y > 190 && L.y < 300) refl.push([L.x, L.y]); }
  for (const { prop } of props) if (prop.kind === 'lamp' && prop.y > 195 && prop.y < 215) refl.push([prop.x, prop.y + 14]);
  for (const [lx, ly] of refl) {
    const top = Math.max(ly + 6, 224);
    for (let y = top; y < top + 26; y++) {
      const wob = Math.round(Math.sin(y / 3 + (f / HB_ANIM_FRAMES) * Math.PI * 2 + lx) * (1 + (y - top) / 14));
      const fade = 1 - (y - top) / 26;
      if (sea.at(lx + wob, y) >= -2) continue;
      if (bayer(lx + wob, y) < fade * 0.8 && (y + f) % 3 !== 0) { b.set(lx + wob, y, fade > 0.55 ? C.amber : C.orange); if (fade > 0.7) b.set(lx + wob + 1, y, C.yellow); }
    }
  }
  // Leuchtturmstrahl: wandert langsam hin und her ueber das Wasser (punktierter Streifen)
  const ang = ((200 + 32 * Math.sin((f / HB_ANIM_FRAMES) * Math.PI * 2)) * Math.PI) / 180;
  const [bx, by] = HB_BEAM;
  for (let y = 205; y < MAP_H; y++) for (let x = 0; x < 512; x++) {
    if (sea.at(x, y) > -3) continue;
    const dx = x - bx, dy = y - by, d = Math.hypot(dx, dy);
    if (d < 40 || d > 420) continue;
    let da = Math.atan2(dy, dx) - ang;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    const width = 0.06 + d / 5000;
    if (Math.abs(da) > width) continue;
    const p = (1 - Math.abs(da) / width) * (1 - d / 420) * 0.55;
    if (bayer(x, y) < p) b.set(x, y, bayer(x + 1, y) < 0.3 ? C.yellow : C.silver);
  }
  return b;
}
void footRect;
