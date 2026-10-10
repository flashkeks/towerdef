/**
 * Ashra Dunes (Runde 16 / K2): Wuestenkarte, gemalt wie Meadow/Frostfen. Lage der Dinge steht in `dunes-layout.ts`
 * (Wege, Oase, Blocker -> `sim/data/maps/dunes.json`), hier wird nur gemalt: Sandduenen mit steiler Leeseite, Wind-
 * rippel, Karawanenpfad mit Spuren, Oase mit Ufergruen und bewegtem Wasser, Tempelplatten, Fackel- und Feuerschein.
 * Licht von oben links (Nachmittag), Duenenkaemme laufen fast senkrecht, die Leeseite (rechts) liegt im Schatten.
 */
import { bayer, Buf, C, fbm, hash2, rng, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { closedSpline, Field, pathField, polySdf, walk } from './kit';
import { castShadows, lightPools, vignette } from './k2kit';
import { DU_BRANCHES, DU_HW, DU_PROPS, OASIS } from './dunes-layout';
import { dunesArt } from './props-dunes';
import type { MapArt, MapLight, PlacedArt } from './types';

export const DU_ANIM_FRAMES = 8;
/** Tempelplatten im Osten (Pflaster, halb im Sand) */
const TEMPLE: [number, number, number, number] = [428, 200, 572, 246];

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
// Sandtoene von dunkel nach hell
const TONES = [C.wood, C.tan, C.skin, C.peach, C.sand];

/** Helligkeit 0..1 des Sandes: Duenen mit sanfter Luvseite, scharfem Kamm und steiler, dunkler Leeseite + Windrippel. */
function sandValue(x: number, y: number): number {
  const warp = (vnoise(x, y, 70, 3) - 0.5) * 38 + (vnoise(x, y, 28, 4) - 0.5) * 14;
  const s1 = (x * 0.96 + y * 0.28 + warp) / 46;
  const t = s1 - Math.floor(s1);
  const m1 = clamp01((vnoise(x, y, 110, 5) - 0.22) * 3.2);
  let v: number;
  if (t < 0.8) v = 0.5 + 0.34 * (t / 0.8);
  else v = 0.06 + 0.3 * ((t - 0.8) / 0.2);
  if (t > 0.76 && t < 0.8) v = 1; // Kamm: heller Saum
  v = 0.62 + (v - 0.62) * m1;
  // zweite, kleinere Duenen quer dazu
  const s2 = (x * 0.8 - y * 0.6 + (vnoise(x, y, 40, 8) - 0.5) * 20) / 22;
  const t2 = s2 - Math.floor(s2);
  const m2 = clamp01((vnoise(x, y, 60, 9) - 0.45) * 3);
  v += m2 * (t2 < 0.78 ? (t2 / 0.78 - 0.5) * 0.14 : -0.18);
  // Windrippel
  const rp = (y * 0.96 - x * 0.28 + 5 * vnoise(x, y, 14, 6)) / 3.4;
  const rf = rp - Math.floor(rp);
  if (t < 0.78 && rf < 0.24 && hash2(x >> 1, y >> 1, 7) > 0.28) v -= 0.13;
  else if (t < 0.78 && rf < 0.4) v += 0.04;
  return v + (hash2(x, y, 12) - 0.5) * 0.05;
}
function sandColor(x: number, y: number): number {
  const v = sandValue(x, y) + (bayer(x, y) - 0.5) * 0.14;
  return v < 0.16 ? TONES[0] : v < 0.4 ? TONES[1] : v < 0.58 ? TONES[2] : v < 0.82 ? TONES[3] : TONES[4];
}

/** Karawanenpfad: festgetretener, heller Sand, an den Raendern aufgeworfen. */
function pathColor(x: number, y: number, pd: number, gx: number, gy: number): number | null {
  if (pd > DU_HW + 2.2) return null;
  const n = vnoise(x, y, 3.5, 21) * 0.7 + hash2(x, y, 22) * 0.3;
  const lit = -(gx * 0.6 + gy * 0.8);
  if (pd <= DU_HW - 0.6) {
    const edge = pd / DU_HW;
    let c = C.sand;
    if (edge < 0.78 && n > 0.66) c = C.peach;
    if (edge > 0.5 && n < 0.3) c = C.peach;
    if (n < 0.14 && edge < 0.5) c = C.skin;
    // Fahrspuren
    if (pd > 3.6 && pd < 5.0 && n < 0.7) c = ((x + y) & 1) === 0 ? C.skin : C.peach;
    if (edge > 0.7) c = hash2(x, y, 55) < (edge - 0.7) * 2.4 ? C.skin : c;
    if (edge > 0.88) c = lit > 0 ? (bayer(x, y) < 0.6 ? C.sand : C.peach) : bayer(x + 1, y) < 0.7 ? C.tan : C.skin;
    const hs = hash2(x, y, 5);
    if (hs > 0.985) c = C.white; else if (hs < 0.01) c = C.tan;
    return c;
  }
  if (pd <= DU_HW + 0.9) return lit > 0.25 ? C.sand : lit > -0.25 ? C.peach : C.tan;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.peach : sandColor(x, y)) : bayer(x, y) < 0.6 ? C.tan : sandColor(x, y);
}

/** Wasser (Bild f): Sinusfelder, Glitzer, Ringwellen; am Rand heller Uferschaum. */
function waterColor(x: number, y: number, dep: number, lit: number, f: number): number {
  const ph = (f / DU_ANIM_FRAMES) * Math.PI * 2;
  if (dep < 1.2) return lit < 0 ? (bayer(x, y) < 0.5 ? C.white : C.ice) : C.ice;
  if (dep < 2.6) return bayer(x, y) < 0.55 ? C.ice : C.sky;
  const a = Math.sin(x / 5 + Math.sin(y / 3.5 + ph)) + Math.sin((x - y) / 6 - ph) + Math.sin(y / 2.6 + ph * 2 + x / 11);
  const n = vnoise(x, y, 6, 4);
  const d = clamp01((dep - 2.6) / 9); // tiefer = dunkler
  let t = a / 3 * 0.5 + n * 0.5 + (bayer(x, y) - 0.5) * 0.25 - d * 0.35;
  if (a > 2.15 && dep > 3.5) return bayer(x + f, y) < 0.5 ? C.ice : C.white; // Glanzlichter
  if (lit > 0.3 && dep < 5.5 && bayer(x, y + 1) < 0.35) return C.ice;
  t = t + 0.15;
  if (t > 0.62) return C.ice;
  if (t > 0.38) return C.sky;
  if (t > 0.16) return bayer(x + 1, y) < 0.5 ? C.sky : C.navy;
  return C.navy;
}

export function paintDunes(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const oasis = new Field(polySdf([closedSpline(OASIS.map(([x, y]) => [x, y] as [number, number]), 3)]));
  const pf = pathField(DU_BRANCHES);
  const HW = DU_HW;
  const onTemple = (x: number, y: number): number => {
    // weiche Maske 0..1 um die Tempelplatten, unregelmaessiger Rand
    const [x0, y0, x1, y1] = TEMPLE;
    const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
    const d = Math.hypot(dx, dy) - (vnoise(x, y, 9, 33) - 0.5) * 8;
    return d < 0 ? 1 : d < 6 ? 1 - d / 6 : 0;
  };

  // 1) Sand, Pfad, Oase mit Ufer
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const pd = pf.at(x, y);
    const od = oasis.at(x, y);
    if (pd <= HW + 2.2 && od > 4) {
      const [gx, gy] = pf.grad(x, y);
      const c = pathColor(x, y, pd, gx, gy);
      if (c !== null) { ground.set(x, y, c); continue; }
    }
    if (od < 0) {
      const [gx, gy] = oasis.grad(x, y);
      ground.set(x, y, waterColor(x, y, -od, -(gx * 0.6 + gy * 0.8), 0));
      continue;
    }
    let c = sandColor(x, y);
    // Oasenufer: nasser Sand, dann Gras, das nach aussen im Sand ausfranst
    if (od < 3) c = od < 1.2 ? (bayer(x, y) < 0.7 ? C.wood : C.bark) : bayer(x, y) < 0.6 ? C.tan : C.wood;
    else if (od < 22) {
      const p = clamp01(1 - (od - 3) / 19);
      const k = vnoise(x, y, 5, 14) * 0.6 + hash2(x, y, 15) * 0.4;
      if (k < p * 0.95) {
        const lit = vnoise(x, y, 4, 16) + (bayer(x, y) - 0.5) * 0.3;
        c = lit > 0.62 ? C.leaf : lit > 0.3 ? C.grass : C.pine;
        if (od > 9 && hash2(x, y, 18) > 0.55) c = sandColor(x, y);
      } else if (od < 12 && k < p * 1.2) c = C.tan;
    }
    // Tempelplatten: Pflaster, vom Sand teilweise verweht
    const tm = onTemple(x, y);
    if (tm > 0.01 && pd > HW + 3) {
      const sx = Math.floor(x / 14), sy = Math.floor(y / 9);
      const off = sy % 2 ? 7 : 0;
      const gx2 = (x + off) % 14, gy2 = y % 9;
      const slab = hash2(Math.floor((x + off) / 14), sy, 71);
      let pc = gx2 === 0 || gy2 === 0 ? C.tan : slab > 0.7 ? C.sand : slab > 0.3 ? C.peach : C.skin;
      if (gx2 === 1 && gy2 > 0) pc = slab > 0.5 ? C.white : C.sand;
      if (hash2(x, y, 73) > 0.96) pc = C.tan;
      void sx;
      if (bayer(x, y) < tm * 1.1 - (vnoise(x, y, 7, 74) > 0.62 ? 0.5 : 0)) c = pc;
    }
    ground.set(x, y, c);
  }

  // 2) Streu: Steinchen, Gras- und Distelbuescheln, Spuren
  const r = rng(20261016);
  for (let i = 0; i < 1100; i++) {
    const x = Math.floor(r() * (W - 6)) + 3, y = Math.floor(r() * (H - 6)) + 3;
    if (pf.at(x, y) < HW + 4 || oasis.at(x, y) < 6) continue;
    const k = r();
    if (k < 0.45) { ground.set(x, y, C.stone); ground.set(x + 1, y, C.silver); ground.set(x, y + 1, C.slate); }
    else if (k < 0.7) { ground.set(x, y, C.wood); ground.set(x + 1, y - 1, C.tan); ground.set(x - 1, y - 1, C.tan); ground.set(x, y - 2, C.sand); }
    else if (k < 0.85) { ground.set(x, y, C.tan); ground.set(x + 1, y, C.wood); ground.set(x + 2, y, C.tan); }
    else { ground.set(x, y, C.white); ground.set(x + 1, y, C.silver); }
  }
  // Fussspuren und Hufspuren auf dem Pfad
  for (const br of DU_BRANCHES) walk(br, 9, 3).forEach((p, i) => {
    const side = i % 2 ? 1 : -1;
    const x = Math.round(p.x - p.dy * side * 3 + (hash2(i, 1, 2) - 0.5) * 3), y = Math.round(p.y + p.dx * side * 3 + (hash2(i, 2, 2) - 0.5) * 3);
    if (pf.at(x, y) > HW - 3 || oasis.at(x, y) < 4) return;
    ground.set(x, y, C.skin); ground.set(x + 1, y, C.tan);
  });
  // Randsteine am Pfad: weisse Kiesel
  for (let i = 0; i < 380; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    const pd = pf.at(x, y);
    if (pd < HW + 0.8 || pd > HW + 2.6 || oasis.at(x, y) < 3) continue;
    if (hash2(x >> 2, y >> 2, 31) > 0.4) continue;
    ground.set(x, y, C.silver); ground.set(x + 1, y, C.white); ground.set(x, y + 1, C.stone);
  }

  // 3) Schatten der Dinge
  const props: PlacedArt[] = DU_PROPS.map((prop) => ({ prop, art: dunesArt(prop.kind, prop.v) }));
  castShadows(ground, props, (x, y) => oasis.at(x, y) > 0);

  // 4) Lichter: Fackeln, Feuerschalen, Zeltlampen; warmer Schein auf dem Sand
  const lights: MapLight[] = [];
  const smoke: MapArt['smoke'] = [];
  for (const { prop, art } of props) {
    if (prop.kind === 'torch') lights.push({ x: prop.x, y: prop.y + (art.hook?.y ?? -26), r: 22, warm: true, col: 'orange', flicker: 'flame' });
    else if (prop.kind === 'brazier') { lights.push({ x: prop.x, y: prop.y - 16, r: 28, warm: true, col: 'orange', flicker: 'flame' }); smoke.push({ x: prop.x, y: prop.y - 22 }); }
    else if (prop.kind === 'tent') lights.push({ x: prop.x, y: prop.y - 8, r: 16, warm: true, col: 'yellow', flicker: 'flame' });
    else if (prop.kind === 'obelisk') lights.push({ x: prop.x, y: prop.y - 56, r: 14, warm: true, col: 'yellow', flicker: 'pulse' });
  }
  const warm = new Map<number, number>([[C.sand, C.yellow], [C.peach, C.sand], [C.skin, C.peach], [C.tan, C.skin], [C.wood, C.tan]]);
  lightPools(ground, lights, warm, 14, (x, y) => oasis.at(x, y) > 0);
  vignette(ground, (x, y) => oasis.at(x, y) > 0);

  const deco = new Buf(W, H);
  const anim = Array.from({ length: DU_ANIM_FRAMES }, (_, f) => paintWaterAnim(f, oasis));
  return { id: 'dunes', name: 'Ashra Dunes', ground, anim, animMs: 140, deco, props, lights, smoke };
}

/** Animierte Ebene: das Oasenwasser (nur dort belegt), Bild f von 8, schliesst nahtlos. */
function paintWaterAnim(f: number, oasis: Field): Buf {
  const b = new Buf(MAP_W, MAP_H);
  for (let y = 150; y < 230; y++) for (let x = 10; x < 140; x++) {
    const od = oasis.at(x, y);
    if (od >= 0) continue;
    const [gx, gy] = oasis.grad(x, y);
    let c = waterColor(x, y, -od, -(gx * 0.6 + gy * 0.8), f);
    // Funkeln und Ringwellen vom Fisch
    if (hash2(x + f * 13, y + f * 7, 33) > 0.993 && -od > 3) c = C.white;
    const ring = Math.hypot((x - 70) / 1.8, y - 190);
    const k = ((ring - f * 1.4) % 7 + 7) % 7;
    if (k < 0.6 && ring < 14 && -od > 4 && bayer(x, y) < 0.6) c = C.ice;
    b.set(x, y, c);
  }
  return b;
}
void fbm;
