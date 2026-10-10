/**
 * Effekte Runde 15 (B2): Regrow-Nachwachsen, Frosthauch (Frost Wyrm), eingefrorener Turm (Eisblock-Ueberlagerung),
 * Lava-Stampfer (Ember Colossus), Gloomship-Absturz und Schatten, Boss-Tod (Wyrm / Colossus).
 * Ganze Pixel, nur Palette. Alle liefern { rows, ax, ay } wie die Effekte aus effects.ts.
 */
import type { PalName } from '../palette';
import { enemyRaster, ENEMY_SIZE } from '../sprites/enemies';
import { flake, flame, spark } from '../sprites/parts';
import { irnd, Surface } from '../sprites/surface';
import type { EnemyType } from '../sprites/types';
import type { FxRaster } from './effects';

const fin = (s: Surface, ax: number, ay: number): FxRaster => ({ rows: s.toRows(), ax, ay });
const clampF = (f: number, n: number): number => Math.max(0, Math.min(n - 1, Math.floor(f)));
const wrap = (f: number, n: number): number => ((Math.floor(f) % n) + n) % n;
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

export const REGROW_FRAMES = 6;
export const FROST_BREATH_FRAMES = 8;
export const FROZEN_TOWER_FRAMES = 4;
export const STOMP_FRAMES = 6;
export const GLOOM_CRASH_FRAMES = 8;
export const BOSS_DEATH_FRAMES = 10;
export const GLOOM_SHADOW_FRAMES = 4;
/** Frosthauch-Radius der Spezifikation (px): Tuerme in diesem Umkreis frieren ein. */
export const FROST_BREATH_RADIUS = 60;
/** Stampfer-Radius der Spezifikation (px): Gegner in diesem Umkreis werden schneller. */
export const STOMP_RADIUS = 80;

// ---------------------------------------------------------------- Regrow

/** Regrow: eine Schicht waechst nach. Blaetter fliegen auf den Gegner zu (0-2), ploppen als Ring (3), Funkeln steigt (4-5). Anker = Fuss des Gegners. */
export function regrowRaster(etype: EnemyType, frame: number): FxRaster {
  const f = clampF(frame, REGROW_FRAMES);
  const z = ENEMY_SIZE[etype];
  const bodyH = Math.min(z.ay - 2, Math.round(z.h * 0.62));
  const pad = 12;
  const w = z.w + pad * 2, h = z.ay + pad + 4;
  const s = new Surface(w, h);
  const cx = z.ax + pad, cy = h - 4 - Math.round(bodyH / 2) - (z.ay - bodyH) * 0 ;
  const Rb = Math.max(5, Math.min(26, z.w * 0.3));
  const rnd = irnd(etype.length * 17 + 5);
  const n = 8;
  if (f <= 2) {
    const rr = Rb * (1.9 - f * 0.55);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4 + f * 0.25;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.8;
      // Blatt, zwei Pixel + Glanz
      s.px(x, y, 'leaf'); s.px(x + 1, y, 'grass'); s.px(x, y - 1, 'leaf');
      if (i % 2 === 0) s.px(x - 1, y + 1, 'pine');
    }
    if (f >= 1) s.ring(cx, cy, rr * 0.8, rr * 0.7, 'grass');
  } else if (f === 3) {
    // Plop: heller Ring + weisse Mitte, Blaetter spritzen auseinander
    s.ring(cx, cy, Rb * 0.95, Rb * 0.8, 'white');
    s.ring(cx, cy, Rb * 0.95 + 1, Rb * 0.8 + 1, 'leaf');
    s.ellipse(cx, cy, 2.5, 2, 'white');
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      s.px(cx + Math.cos(a) * (Rb + 3), cy + Math.sin(a) * (Rb + 3) * 0.8, i % 2 ? 'leaf' : 'yellow');
    }
  } else {
    const t = f - 3;
    s.ellipseFn(cx, cy, Rb * (0.95 + t * 0.4), Rb * (0.8 + t * 0.3), (x, y, nx, ny) => (Math.hypot(nx, ny) > 0.82 && (x + y + f) % 2 === 0 ? 'leaf' : null));
    for (let i = 0; i < 5; i++) {
      const a = rnd() * Math.PI * 2, rr = Rb * (0.4 + rnd() * 0.8);
      spark(s, cx + Math.cos(a) * rr, cy - t * 3 + Math.sin(a) * rr * 0.7, i % 2 ? 'yellow' : 'white', t === 1 && i % 2 === 0);
    }
  }
  return fin(s, cx, h - 4);
}

// ---------------------------------------------------------------- Frosthauch (Frost Wyrm)

/** Frosthauch: Nebelring dehnt sich bis `radius` (60 px = Einfrier-Umkreis), Flocken, Eissplitter. Frame 0..7, Anker = Mitte des Rings (auf dem Wyrm). */
export function frostBreathRaster(frame: number, radius = FROST_BREATH_RADIUS): FxRaster {
  const f = clampF(frame, FROST_BREATH_FRAMES);
  const R = Math.max(10, Math.round(radius));
  const sq = 0.72;
  const w = R * 2 + 14, h = Math.ceil(R * 2 * sq) + 22;
  const s = new Surface(w, h);
  const cx = w / 2, cy = h / 2;
  const t = f / (FROST_BREATH_FRAMES - 1);
  const rr = R * (0.12 + 0.88 * easeOut(t));
  const rnd = irnd(R * 13 + 9);
  // Nebelboden: Schachbrett, loest sich von innen auf
  s.ellipseFn(cx, cy, rr, rr * sq, (x, y, nx, ny) => {
    const d = Math.hypot(nx, ny);
    if (d < t * 0.75 - 0.05) return null;
    return (x + y + f) % 2 === 0 ? (d > 0.82 ? 'ice' : 'sky') : null;
  });
  // Nebelwand (Puffs am Rand)
  const n = Math.round(14 + R / 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.2;
    const pr = Math.max(1.2, (4.5 - t * 3) * (0.8 + rnd() * 0.5));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * sq - (a > Math.PI ? 1 : 0) * t * 2;
    s.ellipseFn(x, y, pr, pr * 0.85, (px, py, nx, ny) => ((-nx * 0.5 - ny * 0.7) > 0.2 ? 'white' : (-nx * 0.5 - ny * 0.7) > -0.4 ? 'ice' : 'sky'));
    if (i % 4 === 0 && t < 0.85) flake(s, x + Math.cos(a) * 3, y + Math.sin(a) * 2 - 2, 'white');
  }
  // Eissplitter, die nach aussen fliegen
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2, d = rr * (0.4 + rnd() * 0.6);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * sq;
    if (f >= 1 && f <= FROST_BREATH_FRAMES - 2) { s.px(x, y, 'white'); s.px(x + Math.cos(a), y + Math.sin(a) * sq, 'ice'); s.px(x - Math.cos(a), y - Math.sin(a) * sq, 'sky'); }
  }
  // Start: heller Kern
  if (f <= 1) { s.ellipse(cx, cy, 7 - f * 2, 5 - f * 1.5, 'white'); s.ring(cx, cy, 9 - f, 6.5 - f, 'ice'); }
  // Ring-Kante
  if (f >= 2 && f < FROST_BREATH_FRAMES - 1) s.ring(cx, cy, rr, rr * sq, 'ice');
  if (f === FROST_BREATH_FRAMES - 1) for (let i = 0; i < 12; i++) { const a = rnd() * 6.28; s.px(cx + Math.cos(a) * R, cy + Math.sin(a) * R * sq - 2, i % 2 ? 'white' : 'ice'); }
  return fin(s, Math.floor(cx), Math.floor(cy));
}

// ---------------------------------------------------------------- Eingefrorener Turm

/** Eisblock ueber einem Turm (Frost Wyrm friert ihn 2 s ein), 4 Frames (Glanz wandert). Durchscheinend: der Turm bleibt zu sehen. Anker = Fuss des Turms. */
export function towerFrozenRaster(frame: number): FxRaster {
  const f = wrap(frame, FROZEN_TOWER_FRAMES);
  const W = 50, H = 70;
  const s = new Surface(W, H);
  const cx = 25, fy = 62; // Fuss
  // Koerper: Quader, Vorderseite (links hell) + rechte Flanke + Deckflaeche
  const top = 14, bw = 17;
  // Fuellung: dichtes Raster -> man sieht den Turm durch das Eis
  const body: [number, number][] = [[cx - bw, top + 4], [cx - bw + 4, top], [cx + bw - 4, top], [cx + bw, top + 4], [cx + bw, fy - 3], [cx + bw - 3, fy + 2], [cx - bw + 3, fy + 2], [cx - bw, fy - 3]];
  s.poly(body, (x, y) => {
    const dither = (x + y + (f >> 1)) % 3 === 0;
    if (x > cx + bw - 6) return (x + y) % 2 === 0 ? 'sky' : null;
    if (y > fy - 6) return (x + y) % 2 === 0 ? 'ice' : null;
    return dither ? 'ice' : null;
  });
  // Deckflaeche (Rhombus) etwas heller
  s.poly([[cx - bw + 1, top + 5], [cx - bw + 5, top + 1], [cx + bw - 5, top + 1], [cx + bw - 1, top + 5], [cx, top + 9]], (x, y) => ((x + y) % 2 === 0 ? 'white' : 'ice'));
  // Kanten
  const edge = (a: number[], b: number[], c: PalName): void => { s.line(a[0], a[1], b[0], b[1], c); };
  for (let i = 0; i < body.length; i++) {
    const a = body[i], b = body[(i + 1) % body.length];
    edge(a, b, i < 3 ? 'white' : i < 5 ? 'sky' : 'navy');
  }
  s.line(cx - bw + 1, top + 5, cx - bw + 1, fy - 3, 'white');
  s.line(cx + bw - 1, top + 5, cx + bw - 1, fy - 3, 'navy');
  // Frostkristalle auf der Oberkante
  const kr: [number, number, number][] = [[-12, 3, 7], [-4, 0, 9], [6, 1, 8], [13, 4, 6]];
  kr.forEach(([dx, dy, h], i) => {
    const x = cx + dx, y = top + dy;
    s.poly([[x, y - h], [x + 2.5, y - h * 0.3], [x + 2, y + 1], [x - 2, y + 1], [x - 2.5, y - h * 0.3]], (px) => (px < x ? 'white' : px > x + 1 ? 'sky' : 'ice'));
    if ((i + f) % 4 === 0) s.px(x, y - h + 1, 'white');
  });
  // Eiszapfen unten
  for (const dx of [-12, -6, 3, 10, 15]) {
    const len = 3 + ((dx * 7 + 100) % 4);
    for (let k = 0; k < len; k++) s.px(cx + dx, fy + 2 + k, k > len - 2 ? 'white' : 'ice');
  }
  // Risse und Einschluesse
  s.line(cx - 6, top + 14, cx - 3, top + 20, 'white'); s.line(cx - 3, top + 20, cx - 5, top + 27, 'white');
  s.line(cx + 6, top + 22, cx + 10, top + 28, 'sky');
  // wandernder Glanz
  const gx = cx - bw + 4 + ((f * 9) % (bw * 2 - 8));
  for (let k = 0; k < 8; k++) s.px(gx + k * 0.5, top + 8 + k * 3, 'white');
  s.px(gx + 3, top + 6, 'white');
  if (f % 2) { s.px(cx + 12, top + 10, 'white'); } else { s.px(cx - 12, top + 22, 'white'); }
  // Kaltluft am Boden
  for (let i = 0; i < 4; i++) s.px(cx - 16 + ((i * 11 + f * 5) % 32), fy + 4 - ((i + f) & 1), i % 2 ? 'white' : 'ice');
  return fin(s, cx, fy);
}

// ---------------------------------------------------------------- Lava-Stampfer (Ember Colossus)

/** Lava-Stampfer: Schockring (flach) mit Lavarissen bis `radius` (80 px), Steine und Glut. Frame 0..5, Anker = Mitte (Auftrittspunkt). */
export function stompRaster(frame: number, radius = STOMP_RADIUS): FxRaster {
  const f = clampF(frame, STOMP_FRAMES);
  const R = Math.max(12, Math.round(radius));
  const sq = 0.62;
  const w = R * 2 + 14, h = Math.ceil(R * 2 * sq) + 44;
  const s = new Surface(w, h);
  const cx = w / 2, cy = h - Math.ceil(R * sq) - 8;
  const t = f / (STOMP_FRAMES - 1);
  const rr = R * (0.18 + 0.82 * easeOut(t));
  const rnd = irnd(R * 7 + 3);
  // Gluehender Boden (loest sich auf)
  if (f < STOMP_FRAMES - 1) s.ellipseFn(cx, cy, rr, rr * sq, (x, y, nx, ny) => {
    const d = Math.hypot(nx, ny);
    if (d < t * 0.6 - 0.1) return null;
    if ((x + y + f) % 2) return null;
    return d > 0.8 ? 'orange' : f < 3 ? 'red' : 'crimson';
  });
  // Lavarisse (strahlen aus)
  const rays = 11;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + 0.3;
    let px = cx + Math.cos(a) * 3, py = cy + Math.sin(a) * 3 * sq;
    const steps = Math.max(2, Math.round(rr / 4));
    for (let k = 1; k <= steps; k++) {
      const d = (k / steps) * rr * (0.75 + 0.25 * ((i * 7) % 3) / 2);
      const jx = (rnd() - 0.5) * 3, jy = (rnd() - 0.5) * 2;
      const nx = cx + Math.cos(a) * d + jx, ny = cy + Math.sin(a) * d * sq + jy;
      s.line(px, py, nx, ny, f < 4 ? 'orange' : 'rust');
      if (f < 4) s.px((px + nx) / 2, (py + ny) / 2, k % 2 ? 'yellow' : 'amber');
      px = nx; py = ny;
    }
  }
  // Schockwelle: dicker Ring
  const th = Math.max(1, 4 - Math.floor(t * 4));
  for (let k = 0; k < th; k++) s.ring(cx, cy, rr - k * 0.8, (rr - k * 0.8) * sq, k === 0 ? (f < 3 ? 'yellow' : 'amber') : k === 1 ? 'orange' : 'red');
  if (f <= 1) { s.ellipse(cx, cy, 10 - f * 3, 6 - f * 2, 'white'); s.ring(cx, cy, 12 - f * 2, 7 - f, 'yellow'); }
  // Steine und Funken fliegen hoch
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * rr * 0.9;
    const x = cx + Math.cos(a) * d, y0 = cy + Math.sin(a) * d * sq;
    const lift = Math.sin(Math.min(1, t * 1.2 + i * 0.03) * Math.PI) * (10 + (i % 3) * 7);
    if (f >= 1 && f < STOMP_FRAMES - 1) {
      if (i % 3 === 0) { s.rect(x, y0 - lift, 2, 2, 'night'); s.px(x, y0 - lift, 'slate'); }
      else s.px(x, y0 - lift, i % 2 ? 'yellow' : 'amber');
    }
  }
  // Glutfunken am Ende
  if (f >= STOMP_FRAMES - 2) for (let i = 0; i < 6; i++) s.px(cx + (rnd() - 0.5) * rr * 1.4, cy - 3 - rnd() * 8, i % 2 ? 'amber' : 'orange');
  return fin(s, Math.floor(cx), Math.floor(cy));
}

// ---------------------------------------------------------------- Gloomship

/** Schatten am Boden unter dem Gloomship (ink; Alpha setzt die Sprite-Schicht), atmet mit der Schwebe. Anker = Mitte. */
export function gloomShadowRaster(frame: number): FxRaster {
  const f = wrap(frame, GLOOM_SHADOW_FRAMES);
  const rx = [27, 26, 24, 26][f], ry = [6, 6, 5, 6][f];
  const s = new Surface(60, 14);
  s.ellipse(30, 7, rx, ry, 'ink');
  return fin(s, 30, 7);
}

/** Gloomship-Absturz: der Rumpf kippt und faellt (0-2), schlaegt ein (3), Feuerball, Qualm und Trummer (4-7). Anker = Aufschlagpunkt am Boden. */
export function gloomCrashRaster(frame: number): FxRaster {
  const f = clampF(frame, GLOOM_CRASH_FRAMES);
  const W = 110, H = 96;
  const s = new Surface(W, H);
  const cx = W / 2, gy = H - 14;
  const rnd = irnd(41 + f);
  const hull = (hx: number, hy: number, slope: number, rx: number, ry: number, burn: boolean): void => {
    for (let y = -ry - 2; y <= ry + 2; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
      const nx = (x + 0.5) / rx, ny = (y + 0.5) / ry;
      if (nx * nx + ny * ny > 1) continue;
      const l = -nx * 0.35 - ny * 0.85;
      const col: PalName = burn && (x * 3 + y * 5 + f) % 7 === 0 ? 'orange' : l > 0.58 ? 'orchid' : l > -0.15 ? 'violet' : l > -0.62 ? 'night' : 'ink';
      s.px(hx + x, hy + y + slope * x, col);
    }
  };
  if (f <= 2) {
    const k = f / 3;
    const hy = gy - 52 + k * 40, slope = -0.18 - k * 0.25;
    hull(cx, hy, slope, 24, 11, true);
    // abgerissene Gondel und Flossen
    s.rect(cx - 8 + f * 3, hy + 14 + f * 4, 14, 7, 'wood'); s.rect(cx - 8 + f * 3, hy + 14 + f * 4, 14, 1, 'tan'); s.rect(cx - 8 + f * 3, hy + 20 + f * 4, 14, 1, 'bark');
    s.poly([[cx - 22, hy + 4], [cx - 33, hy - 6], [cx - 27, hy + 8]], 'violet');
    // Flammen und Rauchfahne
    flame(s, cx - 6, hy - 9 + slope * -6, 8 + f, f, 'red', 'orange', 'yellow');
    flame(s, cx + 6, hy - 10 + slope * 6, 7 + f, f + 2, 'orange', 'amber', 'yellow');
    for (let i = 0; i < 7; i++) { const x = cx - 28 - i * 4 - f * 2; const y = hy - 6 - i * 3 + (i % 2); s.ellipse(x, y, 3 - i * 0.2, 2.6 - i * 0.2, i < 3 ? 'dusk' : 'slate'); }
    for (let i = 0; i < 5; i++) s.px(cx - 12 + rnd() * 26, hy - 8 + rnd() * 24, i % 2 ? 'yellow' : 'amber');
  } else if (f === 3) {
    // Einschlag: Blitz, Staubring, Rumpf zerbricht
    s.ellipse(cx, gy - 4, 26, 9, 'white'); s.ellipse(cx, gy - 5, 20, 7, 'yellow');
    s.ring(cx, gy - 3, 30, 11, 'orange');
    hull(cx, gy - 8, -0.1, 18, 7, false);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI; s.px(cx + Math.cos(a) * 34 * (i % 2 ? 1 : -1), gy - 4 - Math.sin(a) * 16, 'white'); }
  } else {
    const t = f - 4; // 0..3
    // Feuerball steigt, Qualm folgt
    const fr = 22 - t * 4;
    if (t < 3) s.ellipseFn(cx, gy - 8 - t * 6, fr, fr * 0.7, (x, y, nx, ny) => {
      const d = Math.hypot(nx, ny);
      if (d > 0.7 && (x + y + f) % 2) return null;
      return d < 0.35 ? 'yellow' : d < 0.65 ? 'amber' : d < 0.9 ? 'orange' : 'red';
    });
    for (let i = 0; i < 6 + t; i++) {
      const a = (i / (6 + t)) * Math.PI * 2 + 0.5;
      const r = (8 + t * 7) * (0.7 + rnd() * 0.5);
      const x = cx + Math.cos(a) * r * 1.4, y = gy - 14 - t * 7 + Math.sin(a) * r * 0.8;
      s.ellipse(x, y, 4 - t * 0.5, 3.4 - t * 0.5, t < 2 ? 'dusk' : t === 2 ? 'slate' : 'stone');
    }
    // Trummer: Rumpfscherben (violett), Laternenglas (gelb), Holz
    for (let i = 0; i < 12; i++) {
      const a = Math.PI + (i / 11) * Math.PI + (rnd() - 0.5) * 0.3, sp = 10 + rnd() * 18;
      const x = cx + Math.cos(a) * sp * (0.6 + t * 0.4) * 1.5, y = gy - 4 + Math.sin(a) * sp * (0.8 + t * 0.2) + t * t * 2.2;
      const kind = i % 4;
      s.rect(x, y, kind === 0 ? 3 : 2, 2, kind === 0 ? 'violet' : kind === 1 ? 'orchid' : kind === 2 ? 'wood' : 'night');
      if (kind === 3) s.px(x, y, 'amber');
      if (i % 5 === 0) spark(s, x + 2, y - 3, 'yellow');
    }
    // brennende Wrackteile am Boden
    if (t >= 1) { s.ellipse(cx, gy - 1, 14 - t * 2, 3, 'night'); s.ellipse(cx, gy - 2, 10 - t * 2, 2, 'violet'); flame(s, cx - 3, gy - 3, 5 - t, f, 'red', 'orange', 'yellow'); flame(s, cx + 4, gy - 3, 4, f + 1, 'orange', 'amber', 'yellow'); }
    for (let i = 0; i < 4; i++) s.px(cx - 14 + rnd() * 28, gy - 12 - t * 4 - rnd() * 10, 'amber');
  }
  return fin(s, Math.floor(cx), gy);
}

// ---------------------------------------------------------------- Boss-Tod

export type BossKind = 'wyrm' | 'colossus';
/** Boss-Tod: Weiss-Blitz-Silhouette (0), Zerspringen (1-2), dann Eisbruch (wyrm: Scherben, Schnee) bzw. Lava-Eruption (colossus: Feuerball, Steine, Glut). Anker = Fuss. */
export function bossDeathRaster(kind: BossKind, frame: number): FxRaster {
  const f = clampF(frame, BOSS_DEATH_FRAMES);
  const z = ENEMY_SIZE[kind];
  const W = 168, H = 132;
  const s = new Surface(W, H);
  const cx = W / 2, gy = H - 12;
  const rnd = irnd(kind === 'wyrm' ? 77 : 99);
  const cold = kind === 'wyrm';
  // Silhouette des Bosses (kurz): Blitz-weiss, dann zerfallend
  if (f <= 2) {
    const base = enemyRaster(kind, 1, { hitFlash: true });
    const src = Surface.fromRows(base.rows);
    const ox = cx - base.ax, oy = gy - base.ay + 0;
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const c = src.g[y * src.w + x];
      if (!c) continue;
      const jx = f === 0 ? 0 : (rnd() - 0.5) * 3, jy = f === 0 ? 0 : (rnd() - 0.5) * 2;
      if (f === 1 && (x + y) % 3 === 0) { s.px(ox + x + jx, oy + y + jy, cold ? 'ice' : 'yellow'); continue; }
      if (f === 2 && (x + y) % 2 === 0) continue;
      s.px(ox + x + jx, oy + y + jy, c === 'ink' ? (f === 2 ? 'sky' : 'ink') : f === 2 ? (cold ? 'ice' : 'amber') : 'white');
    }
  }
  const body = (z.w / 2) * 0.9, bodyH = z.h * 0.55;
  const cy = gy - bodyH * 0.55;
  if (f >= 2) {
    const t = (f - 2) / (BOSS_DEATH_FRAMES - 3); // 0..1
    const rr = 20 + easeOut(t) * 58;
    if (cold) {
      // Eisbruch: Ring + grosse Scherben, Schnee
      if (f < 7) s.ellipseFn(cx, cy, rr, rr * 0.8, (x, y, nx, ny) => { const d = Math.hypot(nx, ny); return d > 0.72 && (x + y + f) % 2 === 0 ? (d > 0.9 ? 'white' : 'ice') : null; });
      if (f <= 3) { s.ellipse(cx, cy, 16 - (f - 2) * 5, 12 - (f - 2) * 4, 'white'); s.ring(cx, cy, 20 + (f - 2) * 4, 15 + (f - 2) * 3, 'ice'); }
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2 + rnd() * 0.3, sp = (18 + rnd() * 34) * (0.5 + t * 0.8);
        const x = cx + Math.cos(a) * sp * 1.5, y = cy + Math.sin(a) * sp * 0.9 + t * t * 22 * (i % 3 === 0 ? 1.4 : 0.6);
        if (f === BOSS_DEATH_FRAMES - 1 && i % 2) continue;
        const kind2 = i % 4;
        if (kind2 === 0) { // grosse Eisscherbe (Dreieck)
          s.poly([[x, y - 4], [x + 3, y + 3], [x - 3, y + 2]], (px) => (px < x ? 'white' : 'sky'));
          s.px(x - 1, y - 1, 'white');
        } else if (kind2 === 1) { s.rect(x, y, 2, 2, 'ice'); s.px(x, y, 'white'); }
        else if (kind2 === 2) flake(s, x, y, i % 3 ? 'white' : 'silver');
        else s.px(x, y, 'sky');
      }
      // Schneestaub am Boden
      for (let i = 0; i < 16; i++) s.px(cx + (rnd() - 0.5) * (50 + t * 60), gy - rnd() * (4 + t * 10), i % 2 ? 'white' : 'silver');
    } else {
      // Lava-Eruption
      const k = f - 2;
      if (k <= 4) s.ellipseFn(cx, cy - k * 4, 30 - k * 3, 22 - k * 2, (x, y, nx, ny) => {
        const d = Math.hypot(nx, ny);
        if (d > 0.7 && (x + y + f) % 2) return null;
        return d < 0.3 ? 'white' : d < 0.55 ? 'yellow' : d < 0.78 ? 'amber' : d < 0.92 ? 'orange' : 'red';
      });
      if (f >= 3) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + 0.2, r = 12 + k * 7 + rnd() * 8;
          s.ellipse(cx + Math.cos(a) * r * 1.3, cy - 10 - k * 3 + Math.sin(a) * r * 0.6, Math.max(1.5, 5 - k * 0.5), Math.max(1.2, 4 - k * 0.5), k < 2 ? 'dusk' : k < 4 ? 'slate' : 'stone');
        }
      }
      for (let i = 0; i < 20; i++) {
        const a = rnd() * Math.PI + Math.PI, sp = (14 + rnd() * 34) * (0.4 + t * 0.9);
        const x = cx + Math.cos(a) * sp * 1.3, y = cy + Math.sin(a) * sp * 0.9 + t * t * (24 + (i % 3) * 8);
        if (i % 3 === 0) { s.rect(x, y, 3, 3, 'night'); s.rect(x, y, 2, 1, 'slate'); s.px(x + 2, y + 2, 'orange'); }
        else if (i % 3 === 1) { s.rect(x, y, 2, 2, 'amber'); s.px(x, y, 'yellow'); }
        else s.px(x, y, 'orange');
      }
      // Lavapfuetze, die zurueckbleibt
      if (f >= 5) {
        const pr = Math.min(26, 8 + (f - 5) * 5);
        s.ellipse(cx, gy - 2, pr, pr * 0.3, 'rust'); s.ellipse(cx, gy - 3, pr * 0.7, pr * 0.22, f % 2 ? 'orange' : 'red');
        flame(s, cx - 8, gy - 3, 5, f, 'red', 'orange', 'yellow'); flame(s, cx + 9, gy - 3, 4, f + 2, 'orange', 'amber', 'yellow');
      }
    }
    void body;
  }
  return fin(s, Math.floor(cx), gy);
}
