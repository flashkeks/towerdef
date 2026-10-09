/**
 * Effekte Runde 14: Thornweaver (Blitzbogen, Wirbelwind, Ranken-Fessel, Baumwand, Dornenranken-Zone, Weltenbaum-Zone) und
 * Alchemist (Saeurespritzer, Saeure-Markierung, Pfuetze, Buff-Glanz, Todesexplosion, Monster-Verwandlung, Schrumpf, Goldmuenzen).
 * Ganze Pixel, nur Palette. Alle liefern { rows, ax, ay } wie die Effekte aus effects.ts / r13.ts.
 */
import type { PalName } from '../palette';
import { enemyRaster } from '../sprites/enemies';
import { leafAt } from '../sprites/thornweaver';
import { bolt, cloud, flame, spark } from '../sprites/parts';
import { monsterRaster } from '../sprites/towers';
import type { EnemyType } from '../sprites/types';
import { irnd, RAMPS, type Ramp, Surface } from '../sprites/surface';
import { coin } from './r13';
import type { FxRaster } from './effects';

const fin = (s: Surface, ax: number, ay: number): FxRaster => ({ rows: s.toRows(), ax, ay });
const wrap = (f: number, n: number): number => ((Math.floor(f) % n) + n) % n;
const clampF = (f: number, n: number): number => Math.max(0, Math.min(n - 1, Math.floor(f)));

export const ARC_FRAMES = 4;
export const WIND_FRAMES = 6;
export const SNARE_FRAMES = 4;
export const WALL_FRAMES = 4;
export const WALL_GROW_FRAMES = 6;
export const WALL_WEAR_STAGES = 4;
export const ZONE_FRAMES = 4;
export const SPLASH_FRAMES = 5;
export const MARK_ACID_FRAMES = 4;
export const POOL_FRAMES = 4;
export const BUFF_FRAMES = 6;
export const DEATH_BLAST_FRAMES = 5;
export const TRANSFORM_FRAMES = 8;
export const SHRINK_FRAMES = 6;
export const GOLD_BURST_FRAMES = 6;

// ---------------------------------------------------------------- Thornweaver

/** Blitzbogen aus der Gewitterwolke: Linie durch Weltpunkte (Wolke, Ziel 1, Ziel 2 ...), dicker Glanz, Abzweigungen, Einschlag-Sterne. Anker = Weltursprung. */
export function stormArcRaster(points: [number, number][], frame = 0, big = false): FxRaster {
  const f = wrap(frame, ARC_FRAMES);
  const pad = 10;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of points) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  x0 = Math.floor(x0) - pad; y0 = Math.floor(y0) - pad;
  const s = new Surface(Math.max(1, Math.ceil(x1 - x0) + pad), Math.max(1, Math.ceil(y1 - y0) + pad));
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i], b = points[i + 1];
    const ax = a[0] - x0, ay = a[1] - y0, bx = b[0] - x0, by = b[1] - y0;
    // aeusserer Glanz
    const n = Math.max(3, Math.round(Math.hypot(bx - ax, by - ay) / 4)), rnd = irnd(7 + i * 13 + f * 29);
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const pts: [number, number][] = [[ax, ay]];
    for (let k = 1; k < n; k++) { const j = (rnd() - 0.5) * (big ? 9 : 6); pts.push([ax + dx * (k / n) + nx * j, ay + dy * (k / n) + ny * j]); }
    pts.push([bx, by]);
    for (let k = 0; k + 1 < pts.length; k++) {
      s.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 'sky', big ? 5 : 3);
    }
    for (let k = 0; k + 1 < pts.length; k++) s.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 'ice', big ? 3 : 2);
    for (let k = 0; k + 1 < pts.length; k++) s.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], f % 2 ? 'white' : 'yellow', 1);
    // Abzweige
    for (let k = 1; k < pts.length - 1; k += 2) { const sg = rnd() < 0.5 ? -1 : 1; s.line(pts[k][0], pts[k][1], pts[k][0] + nx * sg * 6 + dx / len * 3, pts[k][1] + ny * sg * 6 + dy / len * 3, 'ice'); }
  }
  points.forEach((p, i) => {
    const px = p[0] - x0, py = p[1] - y0;
    if (i === 0) { s.ball(px, py, 3, 2.4, ['yellow', 'white', 'white']); return; }
    s.ball(px, py, big ? 4 : 3, big ? 4 : 3, ['sky', 'ice', 'white']);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + f * 0.5 + i; s.px(px + Math.cos(a) * 6, py + Math.sin(a) * 6, k % 2 ? 'yellow' : 'white'); }
    spark(s, px, py - 4, 'white', true);
  });
  return fin(s, -x0, -y0);
}

/** Wirbelwind (Tempest): Trichter aus wandernden Streifen, Staub und Blaetter. 6 Frames, 48 x 56, Anker = Fuss. */
export function whirlwindRaster(frame: number, scale = 1): FxRaster {
  const f = clampF(frame, WIND_FRAMES);
  const W = 48, H = 56, ax = 24, ay = 50;
  const s = new Surface(W, H);
  const rise = f < 2 ? 0.5 + f * 0.25 : f > 4 ? 0.9 - (f - 4) * 0.25 : 1;
  const hgt = Math.round(40 * rise * scale);
  s.ellipse(ax, ay, 12 * scale, 2.8 * scale, 'night'); s.ellipse(ax, ay - 1, 9 * scale, 1.8, 'dusk');
  for (let r = 0; r < hgt; r++) {
    const t = r / Math.max(1, hgt - 1), y = ay - 2 - r;
    const w = (3 + t * 14) * scale, off = Math.sin(f * 1.1 + t * 5) * 2.5 * t;
    for (let x = -Math.floor(w); x <= Math.floor(w); x++) {
      const edge = Math.abs(x) >= Math.floor(w) - 0;
      const k = (x + Math.round(f * 4) + r * 2) % 9;
      const band = ((r + Math.round(f * 3)) % 6) < 3;
      let col: PalName = band ? (k < 3 ? 'white' : 'silver') : (k < 4 ? 'stone' : 'slate');
      if (edge) col = 'slate'; else if (x < -w * 0.5) col = band ? 'ice' : 'silver';
      s.px(ax + off + x, y, col);
    }
  }
  const rnd = irnd(3 + f);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + f * 1.1, t = (i * 0.15 + f * 0.13) % 1;
    const x = ax + Math.cos(a) * (6 + t * 14), y = ay - 4 - t * 38 + Math.sin(a) * 2;
    leafAt(s, x, y, a + f, 3, ['pine', 'grass', 'leaf']);
    if (rnd() < 0.5) s.px(x + 3, y + 1, 'tan');
  }
  return fin(s, ax, ay);
}

/** Ranken-Fessel um einen Gegner (Vine Snare): zwei Ranken winden sich hoch, Dornen, Blaetter, 4 Frames, 28 x 34, Anker = Fuss des Gegners. */
export function vineSnareRaster(frame: number, size = 1): FxRaster {
  const f = wrap(frame, SNARE_FRAMES);
  const W = 32, H = 40, ax = 16, ay = 36;
  const s = new Surface(W, H);
  const h = Math.round(24 * size);
  // Erdwurzeln
  s.ellipse(ax, ay, 11, 2.4, 'deep'); s.ellipse(ax, ay - 1, 9, 1.6, 'pine');
  for (let v = 0; v < 2; v++) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= h; i++) {
      const t = i / h;
      pts.push([ax + Math.sin(t * 9 + v * Math.PI + f * 0.8) * (7 - t * 2), ay - 1 - i]);
    }
    for (let i = 0; i + 1 < pts.length; i++) {
      const back = Math.cos((i / h) * 9 + v * Math.PI + f * 0.8) < 0;
      s.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], back ? 'pine' : (i % 4 < 2 ? 'leaf' : 'grass'), back ? 1 : 2);
    }
    for (let i = 3; i < h; i += 5) { const p = pts[i]; s.px(p[0] + 2, p[1] - 1, 'white'); s.px(p[0] - 2, p[1] + 1, 'white'); if (i % 10 === 3) leafAt(s, p[0], p[1], (v ? 0.4 : Math.PI - 0.4) + f * 0.1, 4, ['pine', 'grass', 'leaf']); }
  }
  // Zugkreuz oben
  s.px(ax, ay - h - 2, 'leaf'); spark(s, ax + (f % 2 ? 5 : -5), ay - h * 0.6, 'white');
  return fin(s, ax, ay);
}

function tree(s: Surface, x: number, by: number, h: number, wear: number, f: number, seed: number): void {
  const rnd = irnd(seed);
  // Wurzeln und Stamm
  s.line(x - 1, by, x - 5, by + 2, 'bark', 2); s.line(x + 2, by, x + 6, by + 2, 'bark', 2);
  s.rect(x - 2, by - h, 5, h, 'bark'); s.rect(x - 2, by - h, 1, h, 'wood'); s.rect(x + 2, by - h, 1, h, 'plum');
  for (let i = 0; i < 3; i++) s.px(x, by - 3 - i * 4, 'plum');
  if (wear >= 1) { s.line(x - 1, by - h * 0.6, x + 1, by - h * 0.3, 'ink'); s.px(x, by - h * 0.45, 'wood'); }
  if (wear >= 2) { s.line(x - 2, by - h * 0.9, x + 1, by - h * 0.7, 'ink'); }
  // Krone
  const cy = by - h - 3;
  const keep = wear >= 3 ? 0.35 : wear >= 2 ? 0.6 : wear >= 1 ? 0.85 : 1;
  const blobs: [number, number, number][] = [[0, 0, 7], [-6, 3, 5], [6, 3, 5], [-2, -5, 5], [4, -4, 5]];
  blobs.forEach(([dx, dy, r], i) => {
    if (i / blobs.length > keep) return;
    s.ball(x + dx + (f % 2 && i % 2 ? 1 : 0), cy + dy, r, r * 0.85, wear >= 2 ? ['deep', 'pine', 'grass'] : ['pine', 'grass', 'leaf']);
  });
  for (let i = 0; i < 6 * keep; i++) s.px(x - 7 + Math.floor(rnd() * 14), cy - 5 + Math.floor(rnd() * 10), rnd() < 0.5 ? 'leaf' : 'deep');
  if (wear >= 1) for (let i = 0; i < wear * 2; i++) s.px(x - 6 + Math.floor(rnd() * 12), cy + 5 + Math.floor(rnd() * 8) + (f & 1), 'grass');
}

/** Baumwand auf dem Weg (Wall of Trees): drei Baeume nebeneinander, `wear` 0..3 = Abnutzung (Risse, Laub weg, Baum gebrochen). 4 Wiegen-Frames, 64 x 56, Anker = Fuss Mitte. */
export function treeWallRaster(wear: number, frame: number): FxRaster {
  const w = clampF(wear, WALL_WEAR_STAGES), f = wrap(frame, WALL_FRAMES);
  const W = 64, H = 56, ax = 32, ay = 50;
  const s = new Surface(W, H);
  s.ellipse(ax, ay + 1, 30, 4, 'ink');
  const xs = [ax - 18, ax, ax + 18];
  xs.forEach((x, i) => {
    if (w >= 3 && i === 1) { s.rect(x - 2, ay - 6, 5, 6, 'bark'); s.rect(x - 2, ay - 6, 5, 1, 'tan'); s.px(x, ay - 7, 'wood'); s.px(x + 2, ay - 8, 'wood'); for (let k = 0; k < 4; k++) s.px(x - 4 + k * 3, ay - 9 - (k & 1), 'leaf'); return; }
    tree(s, x, ay - (i === 1 ? 0 : 1), 17 + (i === 1 ? 4 : 0) - (w >= 2 && i === 2 ? 5 : 0), Math.min(3, w + (i === 2 ? 1 : 0)), f, 11 + i * 5);
  });
  // Dornenhecke dazwischen
  for (let i = 0; i < 7; i++) { const x = ax - 24 + i * 8; s.px(x, ay - 1 - (i & 1), w >= 2 ? 'pine' : 'leaf'); s.px(x + 1, ay - 3, 'white'); }
  return fin(s, ax, ay);
}
/** Baumwand waechst aus dem Boden (6 Frames). Gleiche Masse wie `treeWallRaster`. */
export function treeWallGrowRaster(frame: number): FxRaster {
  const f = clampF(frame, WALL_GROW_FRAMES);
  const W = 64, H = 56, ax = 32, ay = 50;
  const full = treeWallRaster(0, 0);
  const t = (f + 1) / WALL_GROW_FRAMES;
  const src = Surface.fromRows(full.rows), s = new Surface(W, H);
  const cutY = Math.round(ay - (ay - 2) * t * t);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (y < cutY) continue; const c = src.get(x, y + (cutY > ay - 40 ? 0 : 0)); s.px(x, y - 0, c); }
  // zusaetzlich: von unten hochgeschoben statt abgeschnitten
  const out = new Surface(W, H);
  const shift = Math.round((1 - t) * 44);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = src.get(x, y - shift); if (c && y <= ay + 3) out.px(x, y, c); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI; out.px(ax + Math.cos(a) * (14 + f * 3) * (i % 2 ? 1 : -1), ay - 1 - ((i * 3 + f * 2) % 6), i % 2 ? 'tan' : 'sand'); }
  if (f < 4) for (let i = 0; i < 5; i++) spark(out, ax - 24 + i * 12, ay - 4 - ((i * 7 + f * 5) % 10), i % 2 ? 'leaf' : 'yellow');
  return fin(out, ax, ay);
}

/** Dornenranken-Zone auf dem Weg (Spirit of the Forest): Scheibe mit Ranken, Dornen und Beeren. Radius `radius` px, 4 Frames, Anker Mitte. */
export function thornZoneRaster(radius: number, frame: number): FxRaster {
  const f = wrap(frame, ZONE_FRAMES), R = Math.max(10, Math.round(radius));
  const size = R * 2 + 10, c = size / 2;
  const s = new Surface(size, size);
  const rnd = irnd(R * 7 + 3);
  // Bodenstreu (gepunktet)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const dx = x - c, dy = y - c; if (dx * dx + dy * dy < R * R && (x + y) % 2 === 0) s.px(x, y, 'deep'); }
  const vines = Math.max(8, Math.round(R / 2.2));
  for (let v = 0; v < vines; v++) {
    const a0 = rnd() * Math.PI * 2, len = R * (0.55 + rnd() * 0.45), curl = (rnd() - 0.5) * 1.6, r0 = rnd() * R * 0.35;
    let px = c + Math.cos(a0) * r0, py = c + Math.sin(a0) * r0;
    for (let i = 1; i <= 14; i++) {
      const t = i / 14, a = a0 + curl * t + Math.sin(t * 6 + f * 0.9 + v) * 0.12, r = r0 + (len - r0) * t;
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      s.line(px, py, x, y, i % 3 ? 'grass' : 'leaf', t < 0.6 ? 3 : 2); s.px(x - 1, y - 1, 'leaf');
      if (i % 3 === 0) { s.px(x + Math.sin(a) * 2, y - Math.cos(a) * 2, 'white'); s.px(x - Math.sin(a) * 2, y + Math.cos(a) * 2, 'silver'); }
      if (i === 8 && v % 3 === 0) leafAt(s, x, y, a + 1.2, 4, ['pine', 'grass', 'leaf']);
      px = x; py = y;
    }
    if (v % 2 === 0) { s.ball(px, py, 1.6, 1.6, (f + v) % 4 < 2 ? ['crimson', 'red', 'coral'] : ['plum', 'crimson', 'red']); }
  }
  // Rand: Dornenspitzen
  const n = Math.round(R * 1.7);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; if ((i + f) % 5 === 0) continue; s.px(c + Math.cos(a) * R, c + Math.sin(a) * R, i % 3 === 0 ? 'white' : 'grass'); if (i % 3 === 0) s.px(c + Math.cos(a) * (R + 1), c + Math.sin(a) * (R + 1), 'silver'); }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Weltenbaum-Zone (World Tree): Wurzelnetz mit goldenem Leuchten, Glueh-Motes, kleiner Baum in der Mitte. 4 Frames, Anker Mitte. */
export function worldTreeZoneRaster(radius: number, frame: number): FxRaster {
  const f = wrap(frame, ZONE_FRAMES), R = Math.max(14, Math.round(radius));
  const size = R * 2 + 10, c = size / 2;
  const s = new Surface(size, size);
  const rnd = irnd(R * 5 + 9);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const dx = x - c, dy = y - c; if (dx * dx + dy * dy < R * R) { if ((x + y) % 2 === 0) s.px(x, y, 'pine'); else if ((x * 3 + y * 5 + f) % 11 === 0) s.px(x, y, 'amber'); } }
  const roots = 10;
  for (let v = 0; v < roots; v++) {
    const a0 = (v / roots) * Math.PI * 2 + 0.3, sw = (rnd() - 0.5) * 1.3;
    let px = c, py = c;
    for (let i = 1; i <= 16; i++) {
      const t = i / 16, a = a0 + sw * t + Math.sin(t * 5 + v) * 0.1, r = R * 0.95 * t;
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      s.line(px, py, x, y, 'plum', t < 0.5 ? 5 : 3); s.line(px, py, x, y, 'bark', t < 0.5 ? 3 : 2); s.line(px, py, x, y, 'wood', 1);
      // goldener Puls laeuft nach aussen
      if ((i + f * 4) % 8 === 0) s.line(px, py, x, y, 'yellow', 1);
      if (i % 5 === 0) { const nx = Math.cos(a + 1.2) * 6, ny = Math.sin(a + 1.2) * 6; s.line(x, y, x + nx, y + ny, 'wood', 1); }
      px = x; py = y;
    }
  }
  // Ringe
  for (let k = 0; k < 2; k++) { const rr = R - k * 4; const n = Math.round(rr * 3); for (let i = 0; i < n; i++) { if ((i + f * 2 + k) % 3 === 0) continue; const a = (i / n) * Math.PI * 2 + (k ? -1 : 1) * f * 0.05; s.px(c + Math.cos(a) * rr, c + Math.sin(a) * rr, k ? 'amber' : (i % 5 === 0 ? 'white' : 'yellow')); } }
  // Mitte: kleiner Baum
  s.ellipse(c, c + 5, 6, 2, 'ink');
  s.rect(c - 1, c - 3, 3, 8, 'bark'); s.px(c - 1, c - 3, 'wood');
  for (const [dx, dy, r] of [[0, -6, 5], [-4, -4, 3.4], [4, -4, 3.4], [0, -9, 3.4]] as [number, number, number][]) s.ball(c + dx, c + dy, r, r * 0.9, ['pine', 'grass', 'leaf']);
  for (let i = 0; i < 4; i++) s.px(c - 4 + i * 3, c - 6 + (i % 2) * 3, (f + i) % 2 ? 'yellow' : 'amber');
  // Motes
  for (let i = 0; i < Math.max(6, R / 4); i++) { const a = rnd() * Math.PI * 2, r = rnd() * R * 0.9; const rise = (f * 2 + i * 3) % 7; spark(s, c + Math.cos(a) * r, c + Math.sin(a) * r - rise, i % 2 ? 'yellow' : 'white'); }
  return fin(s, Math.floor(c), Math.floor(c));
}

// ---------------------------------------------------------------- Alchemist

/** Saeurespritzer: 5 Frames (Aufprall -> Ring -> Tropfen -> Pfuetze -> verdunstet). Radius in px, Anker Mitte. */
export function acidSplashRaster(radius: number, frame: number): FxRaster {
  const f = clampF(frame, SPLASH_FRAMES), R = Math.max(8, Math.round(radius));
  const size = R * 2 + 14, c = size / 2;
  const s = new Surface(size, size);
  const t = f / (SPLASH_FRAMES - 1);
  const rnd = irnd(R + 5);
  const rr = R * (0.3 + t * 0.7);
  const sq = 0.8;
  if (f <= 3) {
    s.ellipse(c, c, rr, rr * sq, f === 0 ? 'white' : 'leaf');
    s.ellipse(c, c, Math.max(1, rr - 2), Math.max(1, rr * sq - 2), f === 0 ? 'yellow' : f < 3 ? 'grass' : 'pine');
    if (f >= 1 && f <= 2) s.ellipse(c, c, rr * 0.55, rr * 0.55 * sq, 'yellow');
    s.ring(c, c, rr + 1, rr * sq + 1, f < 2 ? 'yellow' : 'leaf');
  }
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.4, sp = R * (0.5 + rnd() * 0.7);
    const tt = Math.min(1, t * 1.3), x = c + Math.cos(a) * sp * tt, y = c + Math.sin(a) * sp * tt * sq - Math.sin(tt * Math.PI) * 9 * (0.6 + rnd());
    if (f >= 4 && i % 2) continue;
    s.ball(x, y, f < 2 ? 1.6 : 1.1, f < 2 ? 1.6 : 1.1, ['grass', 'leaf', 'yellow']);
    if (f < 3) s.px(x - Math.cos(a), y - Math.sin(a), 'white');
  }
  if (f >= 3) for (let i = 0; i < 6; i++) { const a = rnd() * Math.PI * 2, r = rnd() * rr * 0.8; s.px(c + Math.cos(a) * r, c + Math.sin(a) * r * sq - (f === 4 ? (i % 3) + 1 : 0), 'white'); }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Saeure-Markierung am Gegner: tropfende Blasen und Tropfen-Symbol darueber. 4 Frames, 24 x 28, Anker = Mitte des Gegners. */
export function acidMarkRaster(frame: number): FxRaster {
  const f = wrap(frame, MARK_ACID_FRAMES);
  const S = 28, ax = 14, ay = 16;
  const s = new Surface(S, S);
  // Tropfen-Symbol
  const dy = -11 + (f & 1);
  s.poly([[ax, ay + dy - 4], [ax + 3, ay + dy + 1], [ax, ay + dy + 3], [ax - 3, ay + dy + 1]], (x) => (x < ax ? 'yellow' : 'leaf'));
  s.px(ax - 1, ay + dy, 'white'); s.px(ax + 1, ay + dy + 1, 'grass');
  // Blasen auf dem Koerper
  for (let i = 0; i < 4; i++) { const a = i * 1.7 + f * 0.4, x = ax + Math.cos(a) * 7, y = ay + Math.sin(a) * 6; s.ring(x, y, 1.6, 1.6, 'leaf'); s.px(x - 1, y - 1, 'white'); }
  // Tropfen fallen
  for (let i = 0; i < 3; i++) { const x = ax - 6 + i * 6, y = ay + 4 + ((f * 3 + i * 4) % 10); s.px(x, y, i % 2 ? 'leaf' : 'yellow'); s.px(x, y - 1, 'grass'); }
  s.px(ax + 8, ay - 5 + f, 'grass');
  return fin(s, ax, ay);
}

/** Saeure-Pfuetze auf dem Weg: flache Ellipse, blubbernd. 4 Frames, Anker Mitte. */
export function acidPoolRaster(radius: number, frame: number): FxRaster {
  const f = wrap(frame, POOL_FRAMES), R = Math.max(6, Math.round(radius));
  const W = R * 2 + 6, H = Math.round(R * 1.2) + 8, cx = W / 2, cy = H / 2;
  const s = new Surface(W, H);
  s.ellipse(cx, cy, R, R * 0.5, 'pine'); s.ellipse(cx, cy, R - 1, R * 0.5 - 1, 'grass');
  s.ellipseFn(cx - 1, cy - 1, R - 3, R * 0.5 - 2, (_x, _y, nx, ny) => (-nx * 0.4 - ny * 0.8 > 0.2 ? 'leaf' : null));
  const rnd = irnd(R + 31);
  for (let i = 0; i < Math.max(4, R / 2.5); i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (R - 3);
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.5;
    const ph = (f + i) % 4;
    if (ph === 0) s.px(x, y, 'yellow'); else if (ph === 1) { s.ring(x, y, 1.4, 1, 'yellow'); } else if (ph === 2) { s.px(x, y - 1, 'white'); s.px(x - 1, y, 'yellow'); s.px(x + 1, y, 'yellow'); }
  }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; if ((i + f) % 3 === 0) s.px(cx + Math.cos(a) * (R + 1), cy + Math.sin(a) * (R * 0.5 + 1), 'deep'); }
  if (f % 2) { s.px(cx + R * 0.3, cy - R * 0.45 - 2, 'ice'); } else { s.px(cx - R * 0.35, cy - R * 0.4 - 3, 'white'); }
  return fin(s, Math.floor(cx), Math.floor(cy));
}

/** Buff-Glanz am Turm (Trank getrunken): 6 Frames, 56 x 64, Anker = Fuss. kind 'permanent' = goldener Dauer-Glanz (Frames laufen im Kreis). */
export function buffGlowRaster(frame: number, kind: 'brew' | 'stimulant' | 'permanent' = 'brew'): FxRaster {
  const f = kind === 'permanent' ? wrap(frame, BUFF_FRAMES) : clampF(frame, BUFF_FRAMES);
  const W = 60, H = 68, ax = 30, ay = 62;
  const s = new Surface(W, H);
  const col: [PalName, PalName, PalName] = kind === 'permanent' ? ['yellow', 'amber', 'white'] : kind === 'stimulant' ? ['coral', 'orange', 'yellow'] : ['orchid', 'coral', 'white'];
  const t = kind === 'permanent' ? (f % 3) / 2 : f / (BUFF_FRAMES - 1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const nx = (x - ax) / 15, ny = (y - (ay - 22)) / 26; if (nx * nx + ny * ny < 1 && (x + y + f) % 2 === 0 && (nx * nx + ny * ny > 0.35 || (x + y) % 4 === 0)) s.px(x, y, col[1]); }
  // aufsteigender Ring um den Koerper
  const ry = ay - 6 - t * 38;
  const rx = 13 + Math.sin(t * Math.PI) * 4;
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; if (Math.sin(a) < -0.4 && kind !== 'permanent') { } s.px(ax + Math.cos(a) * rx, ry + Math.sin(a) * 3, i % 4 === 0 ? col[2] : col[0]); s.px(ax + Math.cos(a) * rx, ry + Math.sin(a) * 3 + 1, col[1]); }
  if (kind === 'permanent') { const ry2 = ay - 6 - (((f + 1) % 3) / 2) * 38; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; s.px(ax + Math.cos(a) * 12, ry2 + Math.sin(a) * 3, i % 3 === 0 ? 'white' : 'amber'); } }
  // Glanz-Saeulen
  for (let i = 0; i < 5; i++) { const x = ax - 10 + i * 5, h = 8 + ((i * 7 + f * 3) % 9); for (let y = 0; y < h; y++) s.px(x, ay - 4 - y - (f % 2) * 2 - ((i * 3) % 5) * 2, y > h - 3 ? col[2] : y > h / 2 ? col[0] : col[1]); }
  // Pfeile nach oben (Verstaerkung)
  for (const dx of [-14, 14]) { const y = ay - 14 - ((f * 5) % 20); s.line(ax + dx, y, ax + dx, y + 5, col[2]); s.px(ax + dx - 1, y + 1, col[2]); s.px(ax + dx + 1, y + 1, col[2]); }
  for (let i = 0; i < 7; i++) spark(s, ax - 15 + ((i * 11 + f * 4) % 30), ay - 8 - ((i * 13 + f * 6) % 44), i % 2 ? col[2] : col[0]);
  // Flasche, die kurz aufploppt (nur die ersten Frames)
  if (kind !== 'permanent' && f < 3) { s.ball(ax, ay - 46 + f * 2, 3, 3, ['stone', 'silver', 'white']); s.rect(ax - 1, ay - 51 + f * 2, 3, 2, 'silver'); s.ball(ax, ay - 46 + f * 2, 2, 2, [col[1], col[0], col[2]]); }
  return fin(s, ax, ay);
}

/** Todesexplosion (Unstable Concoction): gruenlich, 5 Frames. Radius in px, Anker Mitte. */
export function deathBlastRaster(frame: number, radius = 24): FxRaster {
  const f = clampF(frame, DEATH_BLAST_FRAMES), R = Math.max(8, Math.round(radius));
  const size = R * 2 + 12, c = size / 2;
  const s = new Surface(size, size);
  const rnd = irnd(R + 77);
  const t = f / (DEATH_BLAST_FRAMES - 1);
  const rr = R * (0.35 + 0.65 * Math.min(1, t * 1.25));
  if (f <= 1) { s.ellipse(c, c, rr, rr, f === 0 ? 'white' : 'yellow'); s.ellipse(c, c, rr * 0.7, rr * 0.7, f === 0 ? 'white' : 'white'); }
  else if (f <= 3) { s.ellipse(c, c, rr, rr * 0.9, 'grass'); s.ellipse(c, c, rr * 0.8, rr * 0.72, 'leaf'); s.ellipse(c, c, rr * 0.5, rr * 0.45, f === 2 ? 'yellow' : 'leaf'); if (f === 2) s.ellipse(c, c, rr * 0.25, rr * 0.22, 'white'); }
  else for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, r = rnd() * R * 0.8; s.ball(c + Math.cos(a) * r, c + Math.sin(a) * r * 0.8 - 2, 2.4, 2.2, ['deep', 'pine', 'grass']); }
  // Spritzer und Funken
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.3, d = rr + 2 + rnd() * R * 0.45 * Math.min(1, t * 1.5);
    const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d * 0.9;
    if (f === 4 && i % 2) continue;
    s.px(x, y, i % 3 === 0 ? 'white' : i % 3 === 1 ? 'yellow' : 'leaf'); if (f < 3) s.px(x - Math.cos(a), y - Math.sin(a), 'grass');
  }
  for (let i = 0; i < 5; i++) { const a = rnd() * Math.PI * 2; s.ring(c + Math.cos(a) * rr * 0.6, c + Math.sin(a) * rr * 0.5, 1.5, 1.5, 'yellow'); }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Monster-Verwandlung (Transforming Tonic): Rauchwolke, darin waechst das Monster, Rauch zieht ab. 8 Frames, 96 x 84, Anker = Fuss. */
export function monsterTransformRaster(frame: number): FxRaster {
  const f = clampF(frame, TRANSFORM_FRAMES);
  const W = 96, H = 88, ax = 48, ay = 80;
  const s = new Surface(W, H);
  const rnd = irnd(5);
  const mon = Surface.fromRows(monsterRaster(0, 'idle0').rows);
  const sc = f < 2 ? 0 : f === 2 ? 0.35 : f === 3 ? 0.55 : f === 4 ? 0.8 : 1;
  if (sc > 0) {
    const mw = mon.w, mh = mon.h;
    const maxx = Math.round(mw * sc), maxy = Math.round(mh * sc);
    for (let y = 0; y < maxy; y++) for (let x = 0; x < maxx; x++) {
      const c = mon.get(Math.floor(x / sc), Math.floor(y / sc));
      if (c) s.px(ax - Math.round(42 * sc) + x, ay - Math.round(70 * sc) + y, f <= 3 && (x + y) % 3 === 0 ? 'dusk' : c);
    }
  }
  // Rauch: viele graue Baelle, wachsen bis f=3, dann ab
  const grow = f <= 3 ? (f + 1) / 4 : 1 - (f - 3) / 5;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.5, rr = (14 + rnd() * 16) * (0.4 + grow * 0.8);
    const x = ax + Math.cos(a) * rr * 1.3, y = ay - 24 - 8 * grow + Math.sin(a) * rr * 0.9 - (f > 3 ? (f - 3) * 4 : 0);
    const r = (5 + rnd() * 4) * (0.5 + grow * 0.7);
    if (f >= 6 && i % 3 === 0) continue;
    s.ball(x, y, r, r * 0.85, i % 3 === 0 ? ['night', 'dusk', 'slate'] : i % 3 === 1 ? ['slate', 'stone', 'silver'] : ['stone', 'silver', 'white']);
  }
  // gruene Funken / Blitze im Rauch
  for (let i = 0; i < 6; i++) { const a = rnd() * Math.PI * 2, r = rnd() * 22; if (f >= 1 && f <= 5) spark(s, ax + Math.cos(a) * r, ay - 30 + Math.sin(a) * r * 0.8, i % 2 ? 'leaf' : 'yellow', i % 3 === 0); }
  if (f >= 1 && f <= 4) { for (let k = 0; k < 2; k++) bolt(s, ax - 14 + k * 28, ay - 50, ax - 18 + k * 36, ay - 20, 90 + k + f * 7, 'white', 'leaf'); }
  // Bodenstaub
  s.ellipse(ax, ay, 18 + f * 1.5, 3, 'night'); for (let i = 0; i < 8; i++) s.px(ax - 20 + ((i * 7 + f * 5) % 40), ay - 1 - (i % 2), 'tan');
  return fin(s, ax, ay);
}

/** Schrumpf-Effekt: Gegner schrumpft (Frame 0..4 = 100 / 84 / 66 / 50 / 36 %), Frame 5 = Red Glim, dazu Strudel und Pfeile nach innen. Rahmen 40 x 44, Anker = Fuss. */
export const SHRINK_SCALE = [1, 0.84, 0.66, 0.5, 0.36, 0.5];
export function shrinkRaster(etype: EnemyType, frame: number): FxRaster {
  const f = clampF(frame, SHRINK_FRAMES);
  const W = 44, H = 48, ax = 22, ay = 42;
  const s = new Surface(W, H);
  const src = enemyRaster(f === 5 ? 'red' : etype, 0);
  const e = Surface.fromRows(src.rows);
  const big = etype === 'brute' || etype === 'leviathan';
  const sc = (f === 5 ? 0.9 : SHRINK_SCALE[f]) * (big && f < 5 ? 0.55 : 1) * (etype === 'leviathan' && f < 5 ? 0.6 : 1);
  const mw = Math.round(e.w * sc), mh = Math.round(e.h * sc);
  const sx = ax - Math.round(src.ax * sc), sy = ay - Math.round(src.ay * sc);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    const c = e.get(Math.floor(x / sc), Math.floor(y / sc));
    if (c) s.px(sx + x, sy + y, f > 0 && f < 5 && (x + y + f) % 4 === 0 ? 'orchid' : c);
  }
  // Strudel (violett/rosa)
  if (f < 5) for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 * 1.5 + f * 1.2, r = 17 - f * 2.2 - (i / 16) * 4;
    s.px(ax + Math.cos(a) * r, ay - 12 + Math.sin(a) * r * 0.9, i % 3 === 0 ? 'white' : i % 2 ? 'orchid' : 'coral');
  }
  for (const [dx, dy] of [[-16, -12], [16, -12], [0, -28], [0, 3]] as [number, number][]) { // Pfeile nach innen
    const k = f < 5 ? Math.min(5, f * 1.5) : 0; const x = ax + dx * (1 - k * 0.12), y = ay + dy * (1 - k * 0.12) - 0;
    const ux = -Math.sign(dx), uy = -Math.sign(dy);
    if (f < 5) { s.line(x, y, x + ux * 4, y + uy * 4, 'coral'); s.px(x + ux * 5, y + uy * 5, 'white'); }
  }
  if (f === 5) { spark(s, ax - 8, ay - 20, 'white', true); spark(s, ax + 8, ay - 14, 'orchid', true); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; s.px(ax + Math.cos(a) * 12, ay - 10 + Math.sin(a) * 9, i % 2 ? 'coral' : 'white'); } }
  s.ellipse(ax, ay + 1, 8 * (f === 5 ? 0.9 : SHRINK_SCALE[f]) + 3, 2, 'ink');
  return fin(s, ax, ay);
}

/** Goldmuenzen bei Lead to Gold (kind 'lead': Bruchstueck wird golden, 6 Muenzen, Glanz) und Rubber to Gold ('rubber': +1-Muenzen perlen auf). 6 Frames, 40 x 44, Anker = Mitte des Gegners. */
export function goldBurstRaster(kind: 'lead' | 'rubber', frame: number): FxRaster {
  const f = clampF(frame, GOLD_BURST_FRAMES);
  const W = 44, H = 48, ax = 22, ay = 30;
  const s = new Surface(W, H);
  const t = f / (GOLD_BURST_FRAMES - 1);
  const rnd = irnd(kind === 'lead' ? 21 : 55);
  if (kind === 'lead') {
    // grauer Brocken -> golden
    if (f < 4) { s.ball(ax, ay - 2, 5 - f * 0.6, 4 - f * 0.5, f < 2 ? ['slate', 'stone', 'silver'] : ['rust', 'amber', 'yellow']); s.px(ax - 2, ay - 4, 'white'); }
    if (f >= 1 && f <= 3) { s.ring(ax, ay - 2, 4 + f * 3, 3 + f * 2, f === 1 ? 'white' : 'yellow'); }
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.5 + (rnd() - 0.5) * 0.2, sp = 12 + rnd() * 10, tt = Math.max(0, t - 0.1);
      const x = ax + Math.cos(a) * sp * tt * 1.4, y = ay - 2 + Math.sin(a) * sp * tt * 1.6 + tt * tt * 24;
      if (f >= 1) coin(s, x, y, [5, 3, 1, 3][(f + i) % 4]);
    }
    for (let i = 0; i < 5; i++) spark(s, ax - 14 + rnd() * 28, ay - 22 + rnd() * 20, i % 2 ? 'white' : 'yellow', i % 3 === 0 && f < 4);
  } else {
    // Gummi -> gold: drei Muenzen steigen perlenartig auf
    s.ellipse(ax, ay + 6, 8, 2, 'amber'); if (f < 3) s.ellipse(ax, ay + 6, 5, 1, 'yellow');
    for (let i = 0; i < 4; i++) {
      const ti = t * 1.4 - i * 0.18; if (ti < 0 || ti > 1) continue;
      coin(s, ax - 6 + i * 4 + Math.sin(ti * 6 + i) * 2, ay + 4 - ti * 30, [4, 2, 1, 2][(f + i) % 4]);
      if (ti > 0.7) spark(s, ax - 6 + i * 4, ay - 28, 'white');
    }
    s.px(ax + 8, ay - 10 - f, 'yellow'); s.px(ax - 9, ay - 6 - f, 'white');
  }
  return fin(s, ax, ay);
}

void cloud; void flame; void RAMPS; void (null as unknown as Ramp);
