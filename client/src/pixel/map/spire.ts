/**
 * Duskspire Keep (Runde 16 / K2): finstere Festung, gemalt wie Quarry/Frostfen. Lage der Dinge steht in `spire-layout.ts`
 * (Wege, Lavagraeben, Zisterne = Wasser, Mauern, Bauten -> `sim/data/maps/spire.json`). Hier wird gemalt: zerklueftetes
 * Vorland, Flurplatten im Innenhof, Prunkstrasse mit rotem Laeufer, Lava mit Kruste und Glut, Steinbruecken und Zugbruecke,
 * Zinnenmauern mit Fackeln und Bannern, Zisterne mit Steinrand. Licht von oben links (kalt), Lava und Fackeln waermen.
 */
import { bayer, Buf, C, fbm, hash2, rng, shadeIdx, vnoise } from './buf';
import { MAP_H, MAP_W } from './layout';
import { closedSpline, Field, pathField, polySdf, walk, type Pt } from './kit';
import { castShadows, lightPools, polyField, type Rect } from './k2kit';
import { CISTERN, SP_BRANCHES, SP_BRIDGES, SP_HW, SP_LAVA, SP_PROPS, SP_WALLS } from './spire-layout';
import { spireArt } from './props-spire';
import type { MapArt, MapLight, PlacedArt } from './types';

export const SP_ANIM_FRAMES = 8;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// ---------- Boden ----------
function rockTone(x: number, y: number): number {
  const L = Math.floor(fbm(x * 0.9, y * 1.05, 29) * 4.4);
  const n = vnoise(x, y, 5, 3) * 0.5 + hash2(x, y, 4) * 0.5;
  let c = L <= 0 ? (n > 0.66 ? C.night : C.ink) : L === 1 ? (n > 0.62 ? C.dusk : C.night) : L === 2 ? (n > 0.6 ? C.slate : C.dusk) : n > 0.6 ? C.stone : C.slate;
  const below = Math.floor(fbm(x * 0.9, (y + 2) * 1.05, 29) * 4.4), above = Math.floor(fbm(x * 0.9, (y - 3) * 1.05, 29) * 4.4);
  if (below < L) c = bayer(x, y) < 0.7 ? C.slate : C.dusk; // Klippenkante: oben hell
  else if (above > L) c = bayer(x + 1, y) < 0.7 ? C.ink : C.night;
  const hs = hash2(x, y, 6);
  if (hs > 0.992) c = C.slate; else if (hs < 0.008) c = C.ink;
  return c;
}

/** Flurplatten im Innenhof: 14 x 9, versetzt, jede mit eigener Toenung, Risse, Licht auf der Oberkante. */
function flagTone(x: number, y: number): number {
  const row = Math.floor(y / 9), off = row % 2 ? 7 : 0;
  const col = Math.floor((x + off) / 14), ix = (x + off) % 14, iy = y % 9;
  const k = hash2(col, row, 61);
  if (ix === 13 || iy === 8) return C.ink;
  let c = k < 0.3 ? C.night : k < 0.78 ? C.dusk : C.slate;
  if (iy === 0 || ix === 0) c = k < 0.3 ? C.dusk : C.slate;
  if (iy === 7 || ix === 12) c = k > 0.78 ? C.dusk : C.night;
  if (hash2(x, y, 62) > 0.965) c = C.night;
  // Risse
  if (hash2(col, row, 63) > 0.86 && (ix + iy * 2) % 13 === 0) c = C.ink;
  return c;
}

const BRANCH_TAIL = SP_BRANCHES[0].slice(SP_BRANCHES[0].findIndex(([x, y]) => x === 350 && y === 180));

/** Pfad: helle Steinplatten, im gemeinsamen Teil mit rotem Laeufer; am Rand Randstein. */
function roadColor(x: number, y: number, pd: number, tailD: number, gx: number, gy: number): number | null {
  if (pd > SP_HW + 2.2) return null;
  const lit = -(gx * 0.6 + gy * 0.8);
  if (pd <= SP_HW - 0.6) {
    const row = Math.floor(y / 8), off = row % 2 ? 6 : 0;
    const col = Math.floor((x + off) / 12), ix = (x + off) % 12, iy = y % 8;
    const k = hash2(col, row, 81);
    let c: number;
    if (ix === 11 || iy === 7) c = C.dusk;
    else {
      c = k < 0.25 ? C.slate : k < 0.8 ? C.stone : C.silver;
      if (iy === 0 || ix === 0) c = k < 0.25 ? C.stone : C.silver;
      if (hash2(x, y, 82) > 0.96) c = C.slate;
    }
    // roter Laeufer mit goldener Borte im gemeinsamen Teil
    if (tailD < 5.6) {
      const edge = tailD > 4.2;
      c = edge ? ((x + y) % 4 < 2 ? C.amber : C.yellow) : ((x >> 1) + (y >> 1)) % 7 === 0 ? C.crimson : bayer(x, y) < 0.18 ? C.plum : C.red;
      if (!edge && tailD < 1.4 && (x + y) % 8 === 0) c = C.amber;
    }
    return c;
  }
  if (pd <= SP_HW + 0.9) return lit > 0.2 ? C.silver : lit > -0.2 ? C.stone : C.slate;
  return lit > 0.1 ? (bayer(x, y) < 0.5 ? C.slate : C.dusk) : C.night;
}

// ---------- Lava ----------
function lavaColor(x: number, y: number, dep: number, f: number): number {
  const ph = (f / SP_ANIM_FRAMES) * Math.PI * 2;
  if (dep < 1.4) return bayer(x, y) < 0.35 + 0.2 * Math.sin(ph + x * 0.4) ? C.crimson : C.plum;
  const a = (Math.sin(x / 7 + Math.sin(y / 5 + ph)) + Math.sin(y / 5 + Math.sin(x / 9 - ph)) + Math.sin((x + y) / 10 + ph)) / 3;
  const b = Math.sin(x / 4.5 - ph + Math.sin(y / 6)) + Math.sin((x - y) / 5 + Math.sin(x / 7 + ph)) + Math.sin(y / 3.5 + ph);
  const n = vnoise(x, y, 7, 8) - 0.5;
  if (b > 2.15 && dep > 3.5) return b > 2.45 ? (bayer(x, y) < 0.6 ? C.plum : C.night) : bayer(x + 1, y) < 0.6 ? C.crimson : C.rust;
  if (Math.abs(a - 0.1 + n * 0.3) < 0.055 && dep > 2) return bayer(x, y) < 0.55 ? C.yellow : C.amber;
  const deep = vnoise(x, y, 38, 17);
  const t = a * 0.7 + n * 0.6 + (bayer(x, y) - 0.5) * 0.3 - (dep < 3.5 ? (3.5 - dep) * 0.12 : 0) - (deep - 0.45) * 0.9;
  if (t > 0.75) return C.amber;
  if (t > 0.32) return bayer(x, y + 1) < 0.35 ? C.amber : C.orange;
  if (t > -0.08) return C.orange;
  if (t > -0.32) return bayer(x + 1, y + 1) < 0.5 ? C.orange : C.red;
  return t > -0.55 ? C.red : bayer(x, y) < 0.5 ? C.crimson : C.red;
}

function waterColor(x: number, y: number, dep: number, f: number): number {
  const ph = (f / SP_ANIM_FRAMES) * Math.PI * 2;
  if (dep < 1.4) return bayer(x, y) < 0.5 ? C.ice : C.sky;
  const a = Math.sin(x / 4 + Math.sin(y / 3 + ph)) + Math.sin((x - y) / 5 - ph) + Math.sin(y / 2.4 + ph * 2);
  const n = vnoise(x, y, 5, 4);
  if (a > 2.1) return bayer(x + f, y) < 0.45 ? C.ice : C.white;
  const t = a / 3 * 0.5 + n * 0.5 + (bayer(x, y) - 0.5) * 0.25 - clamp01((dep - 1.4) / 10) * 0.3;
  return t > 0.6 ? C.sky : t > 0.3 ? C.navy : bayer(x + 1, y) < 0.5 ? C.navy : C.night;
}

// ---------- Mauern ----------
function drawWall(deco: Buf, [x0, y0, x1, y1]: Rect, lava: Field): void {
  const horiz = x1 - x0 >= y1 - y0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const row = Math.floor((horiz ? y - y0 : x - x0) / 3), off = row % 2 ? 3 : 0;
    const along = horiz ? x - x0 : y - y0;
    const ix = (along + off) % 6, iy = (horiz ? y - y0 : x - x0) % 3;
    let c = iy === 2 || ix === 5 ? C.night : C.dusk;
    const k = hash2(Math.floor((along + off) / 6), row, 33);
    if (k > 0.72 && iy < 2 && ix < 5) c = C.slate;
    if (y === y0 || x === x0) c = C.stone;
    if (y === y1 || x === x1) c = C.night;
    deco.set(x, y, c);
  }
  if (horiz) {
    for (let x = x0; x <= x1; x++) {
      const merlon = Math.floor((x - x0) / 5) % 2 === 0;
      const h = merlon ? 7 : 2;
      for (let k = 1; k <= h; k++) deco.set(x, y1 + k, k === 1 ? C.slate : k === h ? C.ink : (x - x0) % 5 === 4 ? C.night : (k + (x >> 3)) % 3 === 0 ? C.night : C.dusk);
      if (merlon) deco.set(x, y0 - 1, (x - x0) % 5 === 0 ? C.stone : C.slate);
    }
    // Banner an der Vorderseite: alle 48 px ein Tuch
    for (let x = x0 + 22; x < x1 - 8; x += 56) {
      for (let j = 0; j < 12; j++) for (let i = 0; i < 6; i++) {
        if (j > 9 && (i % 3 === 1)) continue;
        deco.set(x + i, y1 + 2 + j, i < 2 ? C.red : i < 4 ? C.crimson : C.plum);
      }
      deco.rect(x + 1, y1 + 5, 4, 1, C.amber); deco.set(x + 2, y1 + 6, C.yellow); deco.set(x + 3, y1 + 7, C.amber);
    }
  } else {
    for (let y = y0; y <= y1; y++) {
      const merlon = Math.floor((y - y0) / 5) % 2 === 0;
      const h = merlon ? 5 : 2;
      for (let k = 1; k <= h; k++) deco.set(x1 + k, y, k === h ? C.ink : C.night);
      if (merlon) deco.set(x0 - 1, y, C.slate);
    }
  }
  void lava;
}

function drawBridge(d: Buf, [a, b]: [Pt, Pt], lava: Field, drawbridge: boolean): void {
  const horiz = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
  const hw = SP_HW + 1;
  const bx0 = horiz ? x0 : x0 - hw, bx1 = horiz ? x1 : x1 + hw, by0 = horiz ? y0 - hw : y0, by1 = horiz ? y1 + hw : y1;
  // Schatten und Glut unter der Bruecke
  for (let y = by0 + 3; y <= by1 + 4; y++) for (let x = bx0 + 1; x <= bx1 + 3; x++) if (lava.at(x, y) < 0 && (x > bx1 - 1 || y > by1 - 1 || bayer(x, y) < 0.75)) d.set(x, y, bayer(x, y) < 0.6 ? C.plum : C.crimson);
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
    const along = horiz ? x - bx0 : y - by0, across = horiz ? y - by0 : x - bx0;
    if (drawbridge) {
      const plank = Math.floor(along / 3), sep = along % 3 === 2;
      let c = sep ? C.plum : plank % 2 ? C.bark : C.wood;
      if (!sep && along % 3 === 0) c = plank % 2 ? C.wood : C.tan;
      if (hash2(plank, across >> 2, 8) > 0.88 && !sep) c = C.plum;
      d.set(x, y, c);
    } else {
      const slab = Math.floor(along / 6), sep = along % 6 === 5 || across % 8 === 7;
      let c = sep ? C.night : hash2(slab, across >> 3, 9) > 0.6 ? C.stone : C.slate;
      if (!sep && (along % 6 === 0 || across % 8 === 0)) c = C.silver;
      d.set(x, y, c);
    }
  }
  // Bruestung: Quader links/rechts der Bahn, bei der Zugbruecke Eisenketten
  const para = (x: number, y: number, w: number, h: number): void => {
    d.rect(x, y, w, h, C.dusk); d.rect(x, y, w, 1, C.stone); d.rect(x, y + h - 1, w, 1, C.night);
    for (let k = 0; k < (horiz ? w : h); k += 6) if (horiz) d.set(x + k, y + 1, C.night); else d.set(x + 1, y + k, C.night);
  };
  if (horiz) { para(bx0 - 4, by0 - 3, bx1 - bx0 + 9, 4); para(bx0 - 4, by1 - 1, bx1 - bx0 + 9, 4); }
  else { para(bx0 - 3, by0 - 4, 4, by1 - by0 + 9); para(bx1 - 1, by0 - 4, 4, by1 - by0 + 9); }
  if (drawbridge) {
    // Ketten: gestrichelte Linien von den Pfosten zum Torhaus
    for (let x = bx0; x < bx1; x += 2) { d.set(x, by0 - 5 + ((x >> 1) % 2), C.stone); d.set(x, by1 + 5 - ((x >> 1) % 2), C.stone); }
  }
}

export function paintSpire(): MapArt {
  const W = MAP_W, H = MAP_H;
  const ground = new Buf(W, H);
  const lavaDrawn = polyField(SP_LAVA.map((p) => closedSpline(p, 3)));
  const lava = lavaDrawn;
  const cist = polyField([closedSpline(CISTERN.map(([x, y]) => [x, y] as Pt), 3)]);
  const pf = pathField(SP_BRANCHES);
  const tailF = pathField([BRANCH_TAIL]);
  const HW = SP_HW;
  const onBridge = (x: number, y: number): boolean => SP_BRIDGES.some(([a, b]) => x >= Math.min(a[0], b[0]) - 3 && x <= Math.max(a[0], b[0]) + 3 && y >= Math.min(a[1], b[1]) - 16 && y <= Math.max(a[1], b[1]) + 16);

  // 1) Fels/Flur, Strasse, Lava (Grundton + Krustenrand), Zisterne
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ld = lava.at(x, y);
    const pd = pf.at(x, y);
    if (pd <= HW + 2.2 && (ld > 0 || onBridge(x, y))) {
      const [gx, gy] = pf.grad(x, y);
      const c = roadColor(x, y, pd, tailF.at(x, y), gx, gy);
      if (c !== null && ld > -1) { ground.set(x, y, c); continue; }
    }
    if (ld < 0) { ground.set(x, y, C.red); continue; }
    const cd = cist.at(x, y);
    if (cd < 0) { ground.set(x, y, waterColor(x, y, -cd, 0)); continue; }
    const inner = x > 296 || (x > 540);
    let c = inner ? flagTone(x, y) : rockTone(x, y);
    if (ld < 7) {
      const k = bayer(x, y);
      if (ld < 1.6) c = k < 0.7 ? C.ink : C.plum;
      else if (ld < 3.2) c = k < 0.55 ? C.plum : C.night;
      else if (k < (1 - (ld - 3.2) / 3.8) * 0.75) c = c === C.stone || c === C.silver ? C.wood : c === C.slate ? C.bark : c === C.dusk ? C.plum : c === C.night ? C.plum : c;
    }
    ground.set(x, y, c);
  }
  // Risse im Fels, Truemmer, Asche
  const r = rng(20261016);
  for (let i = 0; i < 60; i++) {
    let x = Math.floor(r() * 280), y = Math.floor(r() * H);
    if (lava.at(x, y) < 12 || pf.at(x, y) < HW + 6) continue;
    const len = 6 + Math.floor(r() * 12);
    let dx = r() < 0.5 ? 1 : -1, dy = r() < 0.5 ? 1 : 0;
    for (let k = 0; k < len; k++) {
      if (lava.at(x, y) < 6 || pf.at(x, y) < HW + 3) break;
      ground.set(x, y, C.ink); ground.set(x + 1, y - 1, C.dusk);
      if (r() < 0.4) dy = dy ? 0 : 1; if (r() < 0.2) dx = -dx;
      x += dx; y += dy;
    }
  }
  for (const br of SP_BRANCHES) walk(br, 11, 5).forEach((p, i) => {
    const side = i % 2 ? 1 : -1;
    const x = Math.round(p.x - p.dy * side * 4), y = Math.round(p.y + p.dx * side * 4);
    if (pf.at(x, y) > HW - 3 || lava.at(x, y) < 1 || tailF.at(x, y) < 6) return;
    ground.set(x, y, C.dusk); ground.set(x + 1, y, C.night);
  });

  // 2) Schatten
  const props: PlacedArt[] = SP_PROPS.map((prop) => ({ prop, art: spireArt(prop.kind, prop.v) }));
  castShadows(ground, props, (x, y) => lava.at(x, y) > 0 && cist.at(x, y) > 0);

  // 3) Lichter: Feuerschalen, Fackeln, Fenster, Lava (pulsierend)
  const lights: MapLight[] = [];
  for (const { prop, art } of props) {
    const hy = art.hook?.y ?? 0;
    switch (prop.kind) {
      case 'brazier': lights.push({ x: prop.x, y: prop.y + hy, r: 30, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'gatetower': lights.push({ x: prop.x + 8, y: prop.y + hy, r: 18, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'roundtower': lights.push({ x: prop.x, y: prop.y - 40, r: 16, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'hall': lights.push({ x: prop.x - 30, y: prop.y - 18, r: 18, warm: true, col: 'orange', flicker: 'flame' }, { x: prop.x + 30, y: prop.y - 18, r: 18, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'keep': lights.push({ x: prop.x - 24, y: prop.y - 60, r: 22, warm: true, col: 'orange', flicker: 'flame' }, { x: prop.x + 14, y: prop.y - 100, r: 26, warm: true, col: 'yellow', flicker: 'pulse' }, { x: prop.x - 38, y: prop.y - 12, r: 20, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'tent': lights.push({ x: prop.x, y: prop.y - 8, r: 14, warm: true, col: 'orange', flicker: 'flame' }); break;
      case 'cisternarch': lights.push({ x: prop.x, y: prop.y - 4, r: 18, warm: false, col: 'ice', flicker: 'pulse' }); break;
      default: break;
    }
  }
  // Mauerfackeln: je ~64 px eine
  for (const [x0, y0, x1, y1] of SP_WALLS) {
    if (x1 - x0 < y1 - y0) continue;
    for (let x = x0 + 30; x < x1 - 10; x += 64) lights.push({ x, y: y1 + 8, r: 20, warm: true, col: 'orange', flicker: 'flame' });
  }
  for (let gy = 8; gy < H; gy += 40) for (let gx = 8; gx < W; gx += 40) {
    let best: [number, number] | null = null, bd = -7;
    for (let y = gy; y < gy + 40; y += 3) for (let x = gx; x < gx + 40; x += 3) { const d = lava.at(x, y); if (d < bd) { bd = d; best = [x, y]; } }
    if (best) lights.push({ x: best[0], y: best[1], r: 34, warm: true, col: 'orange', flicker: 'pulse' });
  }
  const warm = new Map<number, number>([[C.ink, C.plum], [C.night, C.plum], [C.dusk, C.bark], [C.slate, C.wood], [C.stone, C.tan], [C.silver, C.peach]]);
  lightPools(ground, lights.filter((l) => l.flicker === 'flame'), warm, 18, (x, y) => lava.at(x, y) > 2 && cist.at(x, y) > 0);
  // Vignette
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const e = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (e < 12 && lava.at(x, y) > 0 && bayer(x, y) < (12 - e) / 12 * 0.7) ground.set(x, y, shadeIdx(ground.get(x, y)));
  }

  // 4) Deko: Mauern, Zisternenrand, Bruecken
  const deco = new Buf(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const cd = cist.at(x, y);
    if (cd >= 0 && cd < 3.4) { // Steinrand der Zisterne mit Quadern
      const k = hash2(Math.floor((x + y) / 3), Math.floor((x - y) / 3), 5);
      deco.set(x, y, cd < 0.9 ? C.stone : k > 0.6 ? C.slate : C.dusk);
      if ((x + y * 2) % 7 === 0) deco.set(x, y, C.night);
    }
  }
  for (const w of SP_WALLS) drawWall(deco, w, lava);
  SP_BRIDGES.forEach((br, i) => drawBridge(deco, br, lava, i === SP_BRIDGES.length - 1));
  const anim = Array.from({ length: SP_ANIM_FRAMES }, (_, f) => paintAnim(f, lava, cist));
  return { id: 'spire', name: 'Duskspire Keep', ground, anim, animMs: 150, deco, props, lights, smoke: [{ x: 448, y: 52 }, { x: 428, y: 306 }] };
}

function paintAnim(f: number, lava: Field, cist: Field): Buf {
  const b = new Buf(MAP_W, MAP_H);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const ld = lava.at(x, y);
    if (ld < 0) {
      let c = lavaColor(x, y, -ld, f);
      const bh = hash2(x >> 3, y >> 3, 14);
      if (bh > 0.985 && -ld > 5) {
        const cx = (x >> 3) * 8 + 4, cy = (y >> 3) * 8 + 4, k = (f + Math.floor(bh * 997)) % SP_ANIM_FRAMES;
        const d = Math.hypot(x - cx, y - cy);
        if (k < 3 && Math.abs(d - (k + 1)) < 0.6) c = k === 0 ? C.yellow : C.amber;
      }
      b.set(x, y, c);
      continue;
    }
    if (x > 400 && x < 500 && y > 225 && y < 290) {
      const cd = cist.at(x, y);
      if (cd < 0) {
        let c = waterColor(x, y, -cd, f);
        if (hash2(x + f * 13, y + f * 7, 33) > 0.992 && -cd > 3) c = C.white;
        b.set(x, y, c);
      }
    }
  }
  return b;
}
void fbm;
