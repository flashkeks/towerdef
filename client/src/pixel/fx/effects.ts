/** Effekte: Platzen, Explosion, Nova, Blitz, Status, Puffs, Faehigkeiten, Boss-Platte. Alles ganze Pixel, nur Palette. */
import type { PalName } from '../palette';
import { bolt, cloud, crystal, flake, flame, spark } from '../sprites/parts';
import { irnd, RAMPS, type Ramp, Surface } from '../sprites/surface';
import { shellRamp, ENEMY_SIZE } from '../sprites/enemies';
import type { EnemyType } from '../sprites/types';

export interface FxRaster { rows: string[]; ax: number; ay: number }
const fin = (s: Surface, ax: number, ay: number): FxRaster => ({ rows: s.toRows(), ax, ay });

export type ExplosionKind = 'bomb' | 'mini' | 'star' | 'quake';
export const EXPLOSION_FRAMES = 5;
export const NOVA_FRAMES = 4;
export const POP_FRAMES = 6;
export const PUFF_FRAMES = 6;
export const PLATE_FRAMES = 8;
export const FLARE_FRAMES = 6;
export const ZERO_FRAMES = 8;
export const BEAM_FRAMES = 4;

/** Default-Radien (px) je Art; die Bombe zeichnet sich auf `radius` hoch. */
export const EXPLOSION_RADIUS: Record<ExplosionKind, number> = { bomb: 24, mini: 12, star: 32, quake: 48 };

function disc(s: Surface, cx: number, cy: number, r: number, c: PalName | null, sq = 1): void { s.ellipse(cx, cy, Math.max(0.5, r), Math.max(0.5, r * sq), c); }

export function explosionRaster(kind: ExplosionKind, frame: number, radius = EXPLOSION_RADIUS[kind]): FxRaster {
  const f = Math.max(0, Math.min(EXPLOSION_FRAMES - 1, Math.floor(frame)));
  const R = Math.max(5, Math.round(radius));
  const size = Math.ceil(R * 2 + 10);
  const s = new Surface(size, size);
  const c = size / 2;
  const t = f / (EXPLOSION_FRAMES - 1);
  const rnd = irnd(R * 31 + (kind === 'star' ? 7 : 1));
  if (kind === 'quake') {
    // Boden-Beben: flacher Ring, Staub, Risse
    const sq = 0.62;
    const rr = R * (0.3 + t * 0.7);
    const th = Math.max(3, R * 0.12);
    if (f < 4) {
      s.ellipse(c, c, rr, rr * sq, 'orange');
      s.ellipse(c, c, rr - 1, (rr - 1) * sq, 'amber');
      s.ellipse(c, c, rr - 2, (rr - 2) * sq, 'tan');
      s.erase(c, c, rr - th, (rr - th) * sq);
      s.ellipseFn(c, c, rr - th, (rr - th) * sq, (x, y) => ((x + y + f) % 4 === 0 ? 'sand' : null));
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      const r0 = rr * 0.15, r1 = rr * (0.55 + 0.4 * (((i * 37) % 10) / 10));
      s.line(c + Math.cos(a) * r0, c + Math.sin(a) * r0 * sq, c + Math.cos(a) * r1, c + Math.sin(a) * r1 * sq, 'ink');
      if (f < 4) s.px(c + Math.cos(a) * r1 * 0.6, c + Math.sin(a) * r1 * 0.6 * sq, 'orange');
    }
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, r = rr * (0.5 + rnd() * 0.6);
      const lift = f * 2 + rnd() * 3;
      s.px(c + Math.cos(a) * r, c + Math.sin(a) * r * sq - lift, f < 3 ? 'sand' : 'tan');
      s.px(c + Math.cos(a) * r + 1, c + Math.sin(a) * r * sq - lift, f < 3 ? 'tan' : 'stone');
    }
    return fin(s, Math.floor(c), Math.floor(c));
  }
  if (kind === 'star') {
    // Stern-Explosion: gelber Kern, Strahlen, Ring
    const rr = R * (0.25 + t * 0.75);
    if (f < 4) {
      disc(s, c, c, rr * 0.8, f === 0 ? 'white' : 'yellow');
      disc(s, c, c, rr * 0.55, f === 0 ? 'white' : 'white');
    }
    const rays = 8, len = R * (0.4 + t * 0.7);
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + (f % 2) * 0.2;
      const l = i % 2 ? len * 0.65 : len;
      if (f < 4) s.line(c + Math.cos(a) * rr * 0.5, c + Math.sin(a) * rr * 0.5, c + Math.cos(a) * l, c + Math.sin(a) * l, i % 2 ? 'amber' : 'yellow', i % 2 ? 1 : 2);
    }
    s.ring(c, c, rr, rr, 'orange');
    s.ring(c, c, rr - 1, rr - 1, 'amber');
    if (f >= 2) s.ring(c, c, rr * 0.7, rr * 0.7, 'yellow');
    for (let i = 0; i < 12; i++) {
      const a = rnd() * Math.PI * 2, r = R * (0.5 + rnd() * 0.6) * (0.5 + t * 0.5);
      spark(s, c + Math.cos(a) * r, c + Math.sin(a) * r, i % 2 ? 'yellow' : 'white', i % 3 === 0 && f < 3);
    }
    if (f >= 3) for (let i = 0; i < 5; i++) { const a = rnd() * Math.PI * 2; s.px(c + Math.cos(a) * R * 0.6, c + Math.sin(a) * R * 0.6 - f, 'stone'); }
    return fin(s, Math.floor(c), Math.floor(c));
  }
  // bomb / mini: Kreis gelb -> bernstein -> orange -> Rauch
  const grow = [0.38, 0.72, 1, 0.95, 0.88][f];
  const r = R * grow;
  if (f <= 2) {
    disc(s, c, c, r, 'orange');
    disc(s, c, c, r * 0.86, f === 2 ? 'amber' : 'amber');
    disc(s, c, c, r * 0.62, 'yellow');
    if (f <= 1) disc(s, c, c, r * 0.38, 'white');
    // Zacken am Rand
    const n = kind === 'mini' ? 6 : 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + f * 0.4;
      const rr = r * (i % 2 ? 1.08 : 1.2);
      s.ellipse(c + Math.cos(a) * rr * 0.92, c + Math.sin(a) * rr * 0.92, 1.4 + r / 12, 1.4 + r / 12, i % 2 ? 'orange' : 'amber');
    }
    // innen: Licht links oben
    s.ellipseFn(c - r * 0.2, c - r * 0.25, r * 0.4, r * 0.35, () => (f === 2 ? 'yellow' : null));
  } else {
    // Glutring + Rauch
    const k = f - 2;
    disc(s, c, c, r, k === 1 ? 'rust' : 'orange');
    s.erase(c, c, r - 2.2 - k * 0.8, r - 2.2 - k * 0.8);
    s.ring(c, c, r, r, 'crimson');
    const n = kind === 'mini' ? 5 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const rr = r * 0.7;
      const col: Ramp = k === 1 ? RAMPS.stone : ['slate', 'dusk', 'stone'];
      s.ball(c + Math.cos(a) * rr, c + Math.sin(a) * rr - k * 2, Math.max(1.5, R / 7), Math.max(1.5, R / 7), col);
    }
    for (let i = 0; i < 6; i++) {
      const a = rnd() * Math.PI * 2, rr = r * (0.9 + rnd() * 0.4);
      s.px(c + Math.cos(a) * rr, c + Math.sin(a) * rr - k * 2, k === 1 ? 'amber' : 'slate');
    }
  }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Frost-Nova: Ring aus Eis dehnt sich bis `radius`, Kristalle und Flocken am Rand. */
export function novaRaster(frame: number, radius = 16): FxRaster {
  const f = Math.max(0, Math.min(NOVA_FRAMES - 1, Math.floor(frame)));
  const R = Math.max(6, Math.round(radius));
  const size = Math.ceil(R * 2 + 12);
  const s = new Surface(size, size);
  const c = size / 2;
  const grow = [0.45, 0.78, 1, 1][f];
  const r = R * grow;
  const rnd = irnd(R + 5);
  const th = Math.max(3, R * 0.16);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      if (d > r) continue;
      if (d > r - th) s.g[y * size + x] = d > r - 1 ? 'white' : d > r - th + 1 ? 'ice' : 'sky';
      else if (f === 0) s.g[y * size + x] = d < r * 0.5 ? 'white' : 'ice';
      else if (f === 1) { if ((x + y) % 2 === 0) s.g[y * size + x] = d < r * 0.4 ? 'white' : 'ice'; }
      else if (f === 2) { if ((x + y) % 3 === 0 || (x * 5 + y * 3) % 11 === 0) s.g[y * size + x] = 'ice'; }
      else if ((x * 7 + y * 5) % 13 === 0) s.g[y * size + x] = 'ice';
    }
  const n = Math.max(6, Math.round(R / 2.5));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    const rr = r + (f >= 2 ? 1 : 0);
    const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
    if (f < 3) crystal(s, x, y - 1, 2 + (i % 2), RAMPS.frost, 1);
    else s.px(x, y, 'white');
  }
  const m = Math.round(R / 2);
  for (let i = 0; i < m; i++) {
    const a = rnd() * Math.PI * 2, rr = r * rnd();
    if (f >= 2) flake(s, c + Math.cos(a) * rr, c + Math.sin(a) * rr - (f === 3 ? 2 : 0), 'white');
  }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Platzen einer Schicht: Scherben in Schichtfarbe, kleiner Puff. frame 0..5. */
export function popRaster(etype: EnemyType, frame: number): FxRaster {
  const f = Math.max(0, Math.min(POP_FRAMES - 1, Math.floor(frame)));
  const big = etype === 'brute' ? 1.6 : etype === 'leviathan' ? 3.2 : etype === 'ironshell' ? 1.2 : 1;
  const size = Math.ceil(30 * big);
  const s = new Surface(size, size);
  const c = size / 2;
  const ramp = shellRamp(etype);
  const rnd = irnd(etype.length * 101 + etype.charCodeAt(0));
  const n = Math.round(9 * big);
  // Puff
  if (f <= 2) {
    const pr = (3 + f * 2.2) * big;
    s.ellipseFn(c, c, pr, pr, (x, y, nx, ny) => ((x + y + f) % 2 === 0 || Math.hypot(nx, ny) > 0.7 ? 'white' : null));
    s.ring(c, c, pr, pr, 'white');
    if (f === 0) disc(s, c, c, 3 * big, 'white');
  }
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, sp = (4 + rnd() * 5) * big;
    const t = f + 0.5;
    const x = c + Math.cos(a) * sp * t * 0.55, y = c + Math.sin(a) * sp * t * 0.55 + t * t * 0.55 * big - t * 0.8;
    const sz = rnd() > 0.55 ? 2 : 1;
    const col = i % 3 === 0 ? ramp[2] : i % 3 === 1 ? ramp[1] : ramp[0];
    if (f >= POP_FRAMES - 1 && i % 2) continue;
    if (sz === 2) { s.rect(x - 1, y - 1, 2, 2, col); s.px(x - 1, y - 1, ramp[2]); } else s.px(x, y, col);
  }
  if (etype === 'ember') for (let i = 0; i < 6; i++) { const a = rnd() * 6.28; s.px(c + Math.cos(a) * (4 + f * 2), c + Math.sin(a) * (4 + f * 2) - f, i % 2 ? 'amber' : 'yellow'); }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Blitzlinie durch alle Punkte (Weltkoordinaten in px). Gezeichnet wird bei (0,0): der Anker liegt auf dem Weltursprung. */
export function boltLineRaster(points: [number, number][], frame = 0): FxRaster {
  const pad = 6;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of points) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  x0 = Math.floor(x0) - pad; y0 = Math.floor(y0) - pad;
  const w = Math.ceil(x1 - x0) + pad, h = Math.ceil(y1 - y0) + pad;
  const s = new Surface(Math.max(1, w), Math.max(1, h));
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i], b = points[i + 1];
    bolt(s, a[0] - x0, a[1] - y0, b[0] - x0, b[1] - y0, 17 + i * 5 + frame * 31, 'white', 'yellow');
  }
  for (const p of points) { s.ball(p[0] - x0, p[1] - y0, 1.8, 1.8, ['yellow', 'white', 'white']); spark(s, p[0] - x0 + 2, p[1] - y0 - 2, 'yellow'); }
  return fin(s, -x0, -y0);
}

export type StatusKind = 'slow' | 'stun' | 'burn' | 'reveal' | 'freeze' | 'mark';
export const STATUS_FRAMES = 4;
/** Markierungen ueber dem Gegner (12 x 12, Anker = Mitte) bzw. Eisblock um den Gegner (`freeze`, Groesse nach Typ). */
export function statusRaster(kind: StatusKind, frame: number, etype: EnemyType = 'red'): FxRaster {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  if (kind === 'freeze') {
    const z = ENEMY_SIZE[etype];
    const bw = etype === 'leviathan' ? 66 : etype === 'brute' ? 24 : etype === 'ember' || etype === 'ironshell' ? 16 : 14;
    const bh = etype === 'leviathan' ? 50 : etype === 'brute' ? 24 : 16;
    const s = new Surface(bw + 8, bh + 8);
    const x0 = 4, y0 = 4;
    // Eisblock: durchscheinend wirkend durch Schachbrett-Fuellung, Kanten hell
    s.rect(x0, y0, bw, bh, null);
    s.ellipseFn(x0 + bw / 2, y0 + bh / 2, bw / 2, bh / 2, (x, y, nx, ny) => ((x + y) % 2 === 0 ? 'ice' : null));
    s.ring(x0 + bw / 2, y0 + bh / 2, bw / 2, bh / 2, 'ice');
    s.ring(x0 + bw / 2, y0 + bh / 2, bw / 2 - 1, bh / 2 - 1, 'sky');
    s.line(x0 + 2, y0 + 3, x0 + 5, y0 + 1, 'white'); s.line(x0 + 2, y0 + 5, x0 + 2, y0 + 8, 'white');
    for (const [dx, dy] of [[0, 0.1], [1, 0.2], [0.05, 0.9], [0.95, 0.85]]) crystal(s, x0 + bw * dx, y0 + bh * dy, 2, RAMPS.frost, 1);
    if (f % 2 === 0) s.px(x0 + bw - 4, y0 + 3, 'white');
    return fin(s, (bw + 8) >> 1, Math.round(bh / 2 + 4 + (z.ay - z.h / 2) * 0));
  }
  const s = new Surface(14, 14);
  const c = 7;
  switch (kind) {
    case 'slow': {
      flake(s, c, c + 1, 'ice', true);
      s.px(c, c + 1, 'white');
      const k = [0, 1, 2, 1][f];
      s.px(c + 4, c - 3 + k, 'sky'); s.px(c + 4, c - 2 + k, 'ice'); s.px(c - 4, c - 4 + ((k + 1) % 3), 'sky');
      break;
    }
    case 'stun': {
      for (let i = 0; i < 3; i++) {
        const a = ((i + f / 4) / 3) * Math.PI * 2;
        const x = c + Math.cos(a) * 5, y = c + 1 + Math.sin(a) * 2;
        spark(s, x, y, i === 0 ? 'white' : 'yellow', true);
      }
      break;
    }
    case 'burn': {
      flame(s, c - 2, c + 4, 6, f, 'red', 'orange', 'amber');
      flame(s, c + 2, c + 4, 5, f + 2, 'orange', 'amber', 'yellow');
      break;
    }
    case 'reveal': {
      // Auge mit wachsendem Ring
      s.rect(c - 3, c, 7, 1, 'white'); s.rect(c - 2, c - 1, 5, 1, 'white'); s.rect(c - 2, c + 1, 5, 1, 'white');
      s.rect(c - 1, c - 1, 3, 3, 'amber'); s.px(c, c, 'ink');
      s.ring(c, c, 3 + f, 3 + f, f < 3 ? 'yellow' : 'amber');
      break;
    }
  }
  return fin(s, c, c);
}

export const PATH_COLORS: PalName[] = ['amber', 'sky', 'orchid'];
/** Kauf-/Upgrade-Puff: 6 Frames, Staubwolke + Funken in der Pfadfarbe (`path` 0..2, `null` = Kauf: weiss/gelb). */
export function puffRaster(frame: number, path: number | null = null): FxRaster {
  const f = Math.max(0, Math.min(PUFF_FRAMES - 1, Math.floor(frame)));
  const s = new Surface(48, 40);
  const cx = 24, cy = 30;
  const col: PalName = path === null ? 'yellow' : PATH_COLORS[path];
  const hi: PalName = 'white';
  const rnd = irnd(9 + f * 0);
  // Staub: Wolken ruecken nach aussen, werden kleiner/heller
  const nP = 6;
  for (let i = 0; i < nP; i++) {
    const side = i < nP / 2 ? -1 : 1;
    const k = (i % (nP / 2)) / (nP / 2);
    const x = cx + side * (6 + f * 2.6 + k * 4), y = cy - 2 - f * 0.5 - k * 3;
    const r = Math.max(1, 4.2 - f * 0.55 - k);
    if (f < 5) s.ball(x, y, r, r * 0.8, f < 3 ? RAMPS.snow : ['silver', 'silver', 'white']);
  }
  // aufsteigende Funken
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 2.4;
    const sp = 6 + rnd() * 10;
    const t = (f + 1) / PUFF_FRAMES;
    const x = cx + Math.cos(a) * sp * t * 1.3, y = cy - 6 + Math.sin(a) * sp * t * 1.5 + t * t * 5;
    if (f === PUFF_FRAMES - 1 && i % 2) continue;
    spark(s, x, y, i % 3 === 0 ? hi : col, i % 4 === 0 && f < 3);
  }
  // "plop": Ring
  if (f <= 2) s.ring(cx, cy - 8, 6 + f * 4, 3 + f * 1.5, col);
  if (f === 0) s.ellipse(cx, cy - 2, 5, 2, 'white');
  return fin(s, cx, cy);
}

/** Leck: roter Ring + Herzsplitter am Tor. 6 Frames. */
export function leakRaster(frame: number): FxRaster {
  const f = Math.max(0, Math.min(5, Math.floor(frame)));
  const s = new Surface(40, 40);
  const c = 20;
  const r = 4 + f * 2.8;
  if (f < 5) { s.ring(c, c, r, r, 'red'); s.ring(c, c, r - 1, r - 1, f < 3 ? 'coral' : 'crimson'); }
  if (f < 3) s.ellipse(c, c, 5 - f, 5 - f, f === 0 ? 'white' : 'coral');
  const heart = (x: number, y: number, col: PalName) => { s.px(x - 1, y, col); s.px(x + 1, y, col); s.rect(x - 2, y + 1, 5, 1, col); s.rect(x - 1, y + 2, 3, 1, col); s.px(x, y + 3, col); s.px(x - 1, y + 1, 'white'); };
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.6;
    heart(c + Math.cos(a) * (3 + f * 3.4), c + Math.sin(a) * (2 + f * 2.4) - f * 1.2, i % 2 ? 'red' : 'crimson');
  }
  return fin(s, c, c);
}

export type AbilityFx = 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak';

/** Pfeilregen um einen Ranger: goldene Pfeile fallen auf einen Kreis (Radius px), 6 Frames. */
export function arrowRainRaster(frame: number, radius = 68): FxRaster {
  const f = Math.max(0, Math.min(5, Math.floor(frame)));
  const R = Math.round(radius);
  const size = R * 2 + 24;
  const s = new Surface(size, size);
  const c = size / 2;
  const rnd = irnd(R);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * R * 0.95;
    const ph = (f + Math.floor(rnd() * 6)) % 6;
    const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r * 0.9 - 14 + ph * 2.8;
    s.line(x, y - 4, x, y, 'yellow'); s.px(x, y + 1, 'white'); s.px(x - 1, y - 4, 'red'); s.px(x + 1, y - 4, 'red');
    if (ph >= 4) { s.px(x - 1, y + 2, 'amber'); s.px(x + 1, y + 2, 'amber'); s.px(x, y + 2, 'yellow'); }
  }
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; if ((i + f) % 2 === 0) s.px(c + Math.cos(a) * R, c + Math.sin(a) * R * 0.9, 'amber'); }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Absolute Zero: Frost kriecht von den Raendern ueber das ganze Feld (640 x 360), 8 Frames. */
export function absoluteZeroRaster(frame: number, w = 640, h = 360): FxRaster {
  const f = Math.max(0, Math.min(ZERO_FRAMES - 1, Math.floor(frame)));
  const s = new Surface(w, h);
  const k = f <= 3 ? (f + 1) / 4 : 1 - (f - 3) / 5; // 0..1..0
  const rnd = irnd(1234);
  const reach = k * 150;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.min(x, w - 1 - x, (y < h / 2 ? y : h - 1 - y) * 1.4);
      const n = ((x * 7 + y * 13) % 5) * 6;
      const e = d + n - (reach - 30);
      if (e < 0) {
        if (e < -40) { if ((x + y) % 4 === 0) s.g[y * w + x] = 'ice'; }
        else if (e < -20) { if ((x + y) % 2 === 0) s.g[y * w + x] = 'ice'; }
        else s.g[y * w + x] = (x + y) % 2 === 0 ? 'white' : 'ice';
      }
    }
  const n = Math.round(60 * k);
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = ((rnd() * h + f * 30) % h);
    flake(s, x, y, i % 3 === 0 ? 'white' : 'ice', i % 9 === 0);
  }
  // Kristalle an den Raendern
  for (let i = 0; i < 18; i++) {
    const side = i % 4, t = rnd();
    const x = side === 0 ? 4 : side === 1 ? w - 5 : t * w, y = side === 2 ? 4 : side === 3 ? h - 8 : t * h;
    if (k > 0.3) crystal(s, x, y, Math.round(4 + k * 6), RAMPS.frost);
  }
  return fin(s, 0, 0);
}

/** Flare: Leuchtkugel, Radius px, 6 Frames. */
export function flareRaster(frame: number, radius = 40): FxRaster {
  const f = Math.max(0, Math.min(FLARE_FRAMES - 1, Math.floor(frame)));
  const R = Math.round(radius);
  const size = R * 2 + 16;
  const s = new Surface(size, size);
  const c = size / 2;
  const rnd = irnd(R + 3);
  const grow = [0.25, 0.55, 0.85, 1, 1, 1][f];
  const r = R * grow;
  if (f < 5) {
    disc(s, c, c, r, 'yellow');
    disc(s, c, c, r * 0.8, 'white');
    // Halo: gestrichelter Rand
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; if ((i + f) % 2 === 0) s.px(c + Math.cos(a) * (r + 2), c + Math.sin(a) * (r + 2), 'amber'); }
    s.ring(c, c, r, r, 'amber');
  } else {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const d = Math.hypot(x - c, y - c); if (d < R && (x + y) % 3 === 0 && d > R * 0.4) s.g[y * size + x] = 'yellow'; }
    s.ring(c, c, R, R, 'amber');
  }
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + f * 0.15;
    const l = r * (i % 2 ? 1.1 : 1.3);
    if (f < 5) s.line(c + Math.cos(a) * r * 0.7, c + Math.sin(a) * r * 0.7, c + Math.cos(a) * l, c + Math.sin(a) * l, 'white');
  }
  for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, rr = rnd() * R; spark(s, c + Math.cos(a) * rr, c + Math.sin(a) * rr, i % 2 ? 'yellow' : 'white', i % 5 === 0); }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Dawnbreak: Lichtbalken (len px lang, 16 px dick), waagerecht oder senkrecht, 4 Frames. Anker = Mitte des Anfangs. */
export function dawnBeamRaster(len: number, frame: number, vertical = false): FxRaster {
  const f = Math.max(0, Math.min(BEAM_FRAMES - 1, Math.floor(frame)));
  const L = Math.max(8, Math.round(len)), T = 20;
  const s = new Surface(L, T);
  const m = T / 2;
  const pulse = [0, 1, 2, 1][f];
  for (let x = 0; x < L; x++) {
    const edge = Math.min(x, L - 1 - x);
    const th = Math.min(1, edge / 8);
    const half = (7 + pulse * 0.6) * th + 1;
    const ys = Math.round(m - half), ye = Math.round(m + half);
    for (let y = ys; y < ye; y++) {
      const d = Math.abs(y + 0.5 - m) / half;
      s.px(x, y, d < 0.34 ? 'white' : d < 0.62 ? 'yellow' : (x + y + f) % 2 === 0 ? 'amber' : 'orange');
    }
  }
  for (let i = 0; i < Math.round(L / 6); i++) {
    const x = (i * 6 + f * 5) % L, y = m + (((i * 7) % 5) - 2) * 4 + (f % 2 ? 5 : -5);
    spark(s, x, y, i % 2 ? 'yellow' : 'white', i % 4 === 0);
  }
  if (vertical) {
    const o = new Surface(T, L);
    for (let y = 0; y < L; y++) for (let x = 0; x < T; x++) o.g[y * T + x] = s.g[x * L + y];
    return fin(o, T >> 1, 0);
  }
  return fin(s, 0, T >> 1);
}

/** Boss-Platte fliegt im Bogen weg (Anker = Position der Platte am Boss), 8 Frames; `side` -1 links / +1 rechts. */
export function bossPlateRaster(frame: number, side: 1 | -1 = 1): FxRaster {
  const f = Math.max(0, Math.min(PLATE_FRAMES - 1, Math.floor(frame)));
  const s = new Surface(72, 56);
  const ox = 20, oy = 40;
  const t = (f + 1) / PLATE_FRAMES;
  const x = ox + t * 40, y = oy - Math.sin(t * Math.PI * 0.9) * 26 + t * t * 12;
  const rot = f % 4;
  const pts: [number, number][][] = [
    [[-6, -4], [3, -6], [7, 1], [1, 5], [-6, 3]],
    [[-4, -6], [5, -3], [6, 4], [-2, 6], [-7, 0]],
    [[-7, -1], [-1, -6], [6, -3], [7, 3], [-3, 5]],
    [[-5, -5], [4, -5], [7, 2], [-1, 6], [-6, 2]],
  ];
  const p = pts[rot].map(([a, b]) => [x + a, y + b] as [number, number]);
  s.poly(p, (px, py) => (px + py < x + y ? 'silver' : 'stone'));
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s.line(a[0], a[1], b[0], b[1], i < 2 ? 'white' : 'slate'); }
  s.px(x - 2, y - 1, 'white'); s.px(x + 2, y + 2, 'slate');
  // Funken-Schweif
  const rnd = irnd(5 + f);
  for (let i = 0; i < 6; i++) {
    const tt = t - (i + 1) * 0.07;
    if (tt <= 0) continue;
    const sx = ox + tt * 40, sy = oy - Math.sin(tt * Math.PI * 0.9) * 26 + tt * tt * 12;
    spark(s, sx + (rnd() - 0.5) * 4, sy + (rnd() - 0.5) * 4 + i, i % 2 ? 'yellow' : 'orange');
  }
  // Funkenwolke am Platz
  if (f < 4) for (let i = 0; i < 7; i++) { const a = rnd() * 6.28, r = (f + 1) * 3 * rnd(); spark(s, ox + Math.cos(a) * r, oy + Math.sin(a) * r, i % 2 ? 'white' : 'amber'); }
  const out = side === 1 ? s : s.flipX();
  return fin(out, side === 1 ? ox : 72 - 1 - ox, oy);
}
void cloud;
