/** Effekte Runde 13: Lantern Market (Muenzflug, Bank-Truhe, Aura-Ring, Grant) und Longshot (Ricochet, Supply Drop, Focus, Boss-Markierung). Ganze Pixel, nur Palette. */
import type { PalName } from '../palette';
import { spark } from '../sprites/parts';
import { crosshair } from '../sprites/longshot';
import { irnd, RAMPS, Surface } from '../sprites/surface';
import type { FxRaster } from './effects';

const fin = (s: Surface, ax: number, ay: number): FxRaster => ({ rows: s.toRows(), ax, ay });

export const COIN_RISE_FRAMES = 8;
export const CHEST_FRAMES = 6;
export const AURA_FRAMES = 4;
export const GRANT_FRAMES = 8;
export const DROP_FRAMES = 12;
export const FOCUS_FRAMES = 4;
export const MARK_FRAMES = 4;

/** Muenze von vorn (w = Breite 1..5, dreht sich). */
export function coin(s: Surface, x: number, y: number, w: number): void {
  const hw = Math.max(0.7, w / 2);
  s.ellipseFn(x, y, hw, 3, (_x, _y, nx, ny) => (-nx * 0.5 - ny * 0.7 > 0.25 ? 'yellow' : 'amber'));
  s.ellipse(x, y, Math.max(0.5, hw - 1), 1.9, 'orange');
  if (w >= 3) s.px(x - hw * 0.4, y - 1, 'white');
}

/** Muenzflug: Muenzen steigen vom Market auf (Rundenende), 8 Frames. Anker = Fuss des Stands (unten Mitte). */
export function coinRiseRaster(frame: number): FxRaster {
  const f = Math.max(0, Math.min(COIN_RISE_FRAMES - 1, Math.floor(frame)));
  const W = 40, H = 72, ax = 20, ay = 66;
  const s = new Surface(W, H);
  const rnd = irnd(41);
  for (let i = 0; i < 8; i++) {
    const t0 = i * 0.07, x0 = ax + (rnd() - 0.5) * 16;
    const t = (f / (COIN_RISE_FRAMES - 1)) - t0;
    if (t < 0) continue;
    const y = ay - 18 - t * 52, x = x0 + Math.sin(t * 5 + i) * 3;
    const w = [6, 4, 1, 4][(f + i) % 4];
    if (t < 0.85) coin(s, x, y, w); else spark(s, x, y, 'white', true);
    if (t > 0.1 && t < 0.8) { s.px(x, y + 5, 'amber'); s.px(x, y + 8, 'orange'); }
  }
  if (f < 3) { s.ellipse(ax, ay - 14, 8 - f, 2, 'yellow'); spark(s, ax - 8, ay - 17, 'white'); spark(s, ax + 9, ay - 15, 'white'); }
  return fin(s, ax, ay);
}

/** Bank-Truhe: 0 zu, 1 Deckel spaltbreit, 2 offen mit Licht, 3 Muenzen springen, 4 Muenzen oben, 5 Deckel faellt. Anker = Fuss unten Mitte. */
export function bankChestRaster(frame: number): FxRaster {
  const f = Math.max(0, Math.min(CHEST_FRAMES - 1, Math.floor(frame)));
  const W = 32, H = 40, ax = 16, ay = 36;
  const s = new Surface(W, H);
  const x0 = ax - 9, w = 18;
  // Unterteil
  s.box(x0, ay - 9, w, 9, RAMPS.wood);
  s.rect(x0, ay - 6, w, 1, 'bark'); s.rect(x0 + 3, ay - 9, 2, 9, 'slate'); s.rect(x0 + w - 5, ay - 9, 2, 9, 'slate');
  const open = f === 0 || f === 5 ? (f === 5 ? 0.12 : 0) : f === 1 ? 0.3 : 1;
  if (open > 0.2) {
    // Inneres mit Gold
    s.rect(x0 + 1, ay - 10, w - 2, 2, 'night');
    for (let x = x0 + 2; x < x0 + w - 2; x++) s.px(x, ay - 10 - ((x * 3) % 3 === 0 ? 1 : 0), ((x * 5) & 3) ? 'yellow' : 'amber');
  }
  // Deckel
  const lift = Math.round(open * 9);
  if (open < 0.5) {
    const gap = Math.round(open * 6);
    s.rect(x0, ay - 13 - gap, w, 4, 'bark'); s.rect(x0, ay - 13 - gap, w, 1, 'wood'); s.rect(x0 + 3, ay - 13 - gap, 2, 4, 'slate'); s.rect(x0 + w - 5, ay - 13 - gap, 2, 4, 'slate');
    s.rect(ax - 1, ay - 10 - gap, 3, 3, 'silver'); s.px(ax, ay - 9 - gap, 'ink');
    if (gap > 0) { s.rect(x0 + 2, ay - 9 - gap + 3, w - 4, 1, 'yellow'); }
  } else {
    // Deckel steht hinten offen
    s.poly([[x0, ay - 11], [x0 + w, ay - 11], [x0 + w - 2, ay - 11 - lift], [x0 + 2, ay - 11 - lift]], (x, y) => (y < ay - 11 - lift + 1 ? 'tan' : 'bark'));
    s.rect(x0 + 3, ay - 11 - lift, 2, lift, 'slate');
  }
  if (f >= 2 && f <= 4) {
    // Lichtschein
    for (let i = 0; i < 5; i++) s.px(ax - 6 + i * 3, ay - 13 - (f === 2 ? 2 + (i % 2) : 0), i % 2 ? 'white' : 'yellow');
    spark(s, ax, ay - 16, 'white', true);
  }
  if (f === 3 || f === 4) {
    const k = f === 3 ? 1 : 2;
    for (let i = 0; i < 5; i++) coin(s, ax - 8 + i * 4 + (i % 2), ay - 12 - k * 5 - (i % 3) * 3, [4, 3, 2, 3, 4][i]);
  }
  return fin(s, ax, ay);
}

/** Aura-Ring flach um den Market, gestrichelt und rotierend, Radius `radius` px (Wirkradius). `path` 0..2 = Pfadfarbe (Standard C = Orchidee). */
export function auraRingRaster(radius: number, frame: number, path = 2): FxRaster {
  const f = ((Math.floor(frame) % AURA_FRAMES) + AURA_FRAMES) % AURA_FRAMES;
  const R = Math.max(8, Math.round(radius));
  const size = R * 2 + 10, c = size / 2;
  const s = new Surface(size, size);
  const col: PalName = (['amber', 'sky', 'orchid'] as PalName[])[path] ?? 'orchid';
  const hi: PalName = (['yellow', 'ice', 'coral'] as PalName[])[path] ?? 'coral';
  const n = Math.max(32, Math.round(R * 2.4));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + f * 0.05;
    if ((i + f) % 4 === 3) continue;
    s.px(c + Math.cos(a) * R, c + Math.sin(a) * R, i % 8 < 2 ? hi : col);
    s.px(c + Math.cos(a) * (R - 1), c + Math.sin(a) * (R - 1), i % 8 < 2 ? col : 'violet' === col ? col : col);
  }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + f * 0.2; spark(s, c + Math.cos(a) * R, c + Math.sin(a) * R, 'white'); }
  // innerer, gepunkteter Ring
  for (let i = 0; i < n; i += 2) { const a = (i / n) * Math.PI * 2 - f * 0.08; s.px(c + Math.cos(a) * (R - 3), c + Math.sin(a) * (R - 3), col); }
  return fin(s, Math.floor(c), Math.floor(c));
}

/** Grant: Siegel-Blitz und Muenzfontaene um den Market, 8 Frames, 56 x 56, Anker Mitte. */
export function grantRaster(frame: number): FxRaster {
  const f = Math.max(0, Math.min(GRANT_FRAMES - 1, Math.floor(frame)));
  const S = 56, c = 28;
  const s = new Surface(S, S);
  const rnd = irnd(77);
  const r = 3 + f * 3;
  if (f < 6) { s.ring(c, c, r, r, f < 3 ? 'white' : 'yellow'); s.ring(c, c, r - 1, r - 1, 'amber'); }
  if (f < 3) s.ellipse(c, c, 6 - f * 2, 6 - f * 2, f === 0 ? 'white' : 'yellow');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.3, sp = 8 + rnd() * 14;
    const t = (f + 1) / GRANT_FRAMES;
    const x = c + Math.cos(a) * sp * t * 1.7, y = c + Math.sin(a) * sp * t * 1.7 - 8 * Math.sin(t * Math.PI) + t * t * 14;
    if (f === GRANT_FRAMES - 1 && i % 2) continue;
    coin(s, x, y, [6, 4, 1, 4][(f + i) % 4]);
  }
  for (let i = 0; i < 6; i++) spark(s, c + (rnd() - 0.5) * 40, c + (rnd() - 0.5) * 40, i % 2 ? 'white' : 'yellow', i % 3 === 0 && f < 5);
  return fin(s, c, c);
}

/** Ricochet-Spur: Bolzen springt durch die Punkte (Weltkoordinaten), Funken an jedem Abprall. Anker = Weltursprung. */
export function ricochetRaster(points: [number, number][], frame = 0): FxRaster {
  const pad = 8;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of points) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  x0 = Math.floor(x0) - pad; y0 = Math.floor(y0) - pad;
  const s = new Surface(Math.max(1, Math.ceil(x1 - x0) + pad), Math.max(1, Math.ceil(y1 - y0) + pad));
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i], b = points[i + 1];
    s.line(a[0] - x0, a[1] - y0, b[0] - x0, b[1] - y0, 'orange', 3);
    s.line(a[0] - x0, a[1] - y0, b[0] - x0, b[1] - y0, i % 2 ? 'yellow' : 'white', 1);
  }
  for (let i = 0; i < points.length; i++) {
    const px = points[i][0] - x0, py = points[i][1] - y0;
    s.ball(px, py, 3, 3, ['orange', 'yellow', 'white']);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + frame * 0.7 + i; s.px(px + Math.cos(a) * 4, py + Math.sin(a) * 4, k % 2 ? 'white' : 'amber'); }
  }
  return fin(s, -x0, -y0);
}

/** Supply-Drop: 0-5 Kiste faellt am Fallschirm (schwingt), 6-8 Fallschirm sackt zusammen, 9-11 Kiste springt auf, Gold spritzt. Anker = Kistenfuss. */
export function supplyDropRaster(frame: number): FxRaster {
  const f = Math.max(0, Math.min(DROP_FRAMES - 1, Math.floor(frame)));
  const W = 48, H = 60, ax = 24, ay = 56;
  const s = new Surface(W, H);
  const crate = (cx: number, by: number, lid: number): void => {
    s.box(cx - 5, by - 9, 11, 9, RAMPS.wood);
    s.rect(cx - 5, by - 5, 11, 1, 'bark'); s.rect(cx - 1, by - 9, 3, 9, 'amber'); s.px(cx, by - 5, 'yellow');
    if (lid > 0) { s.rect(cx - 5, by - 9 - lid, 11, 2, 'tan'); s.rect(cx - 5, by - 9 - lid, 11, 1, 'wood'); }
  };
  if (f <= 5) {
    const sw = [0, 1, 2, 2, 1, 0][f];
    const cx = ax + sw;
    // Leinen + Kuppel
    s.ellipseFn(cx, ay - 34, 16, 9, (x, y, nx, ny) => (y > ay - 30 ? null : Math.floor((x - cx + 40) / 4) % 2 ? 'white' : (-nx * 0.5 - ny * 0.7 > 0.1 ? 'red' : 'crimson')));
    for (let x = cx - 16; x <= cx + 16; x += 4) s.px(x, ay - 30, 'crimson');
    for (const dx of [-14, -7, 7, 14]) s.line(cx + dx * 0.9, ay - 30, cx + dx * 0.3, ay - 10, 'silver');
    s.line(cx, ay - 34, cx, ay - 10, 'silver');
    crate(cx, ay, 0);
    s.px(ax + 15 - (f % 3) * 2, ay - 44 + f * 6, 'white'); // Flugstaub neben der Kiste
  } else if (f <= 8) {
    const k = f - 6;
    const cx = ax;
    // Fallschirm sackt neben der Kiste zu einem Haufen zusammen
    const rx = [13, 15, 17][k], ry = [8, 5, 3][k], mx = cx - 14 - k, my = ay - [14, 5, 0][k];
    s.ellipseFn(mx, my + ry, rx, ry, (x, y, nx, ny) => (y > my + ry ? null : Math.floor((x + 40) / 4) % 2 ? 'white' : (-nx * 0.5 - ny * 0.7 > 0.2 ? 'red' : 'crimson')));
    for (let i = 0; i < 3; i++) s.line(cx - 4, ay - 9, mx - 6 + i * 6, my + ry - 2, 'silver');
    crate(cx + 2, ay, 0);
  } else {
    const k = f - 9; // 0..2
    const cx = ax;
    s.ellipseFn(cx - 17, ay, 17, 3, (x, y, nx, ny) => (y > ay ? null : Math.floor((x + 40) / 4) % 2 ? 'white' : 'red'));
    crate(cx + 2, ay, 3 + k * 2);
    const rnd = irnd(5);
    for (let i = 0; i < 7; i++) coin(s, cx + 2 + (rnd() - 0.5) * 18 * (k + 1) * 0.6, ay - 14 - k * 6 - rnd() * 8, [6, 4, 1, 4][(i + f) % 4]);
    spark(s, cx - 4, ay - 18 - k * 3, 'white', true);
  }
  return fin(s, ax, ay);
}

/** Focus: goldener Doppelring und Tempo-Striche um einen Longshot, 4 Frames, 44 x 44, Anker Mitte. */
export function focusRaster(frame: number): FxRaster {
  const f = ((Math.floor(frame) % FOCUS_FRAMES) + FOCUS_FRAMES) % FOCUS_FRAMES;
  const S = 44, c = 22;
  const s = new Surface(S, S);
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2 + f * 0.15; if ((i + f) % 3 !== 2) s.px(c + Math.cos(a) * 18, c + Math.sin(a) * 18, i % 6 < 2 ? 'white' : 'yellow'); }
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 - f * 0.2; if (i % 2) s.px(c + Math.cos(a) * 14, c + Math.sin(a) * 14, 'amber'); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + f * 0.4; const x = c + Math.cos(a) * 18, y = c + Math.sin(a) * 18; s.line(x, y, x - Math.sin(a) * 4, y + Math.cos(a) * 4, 'white'); }
  crosshair(s, c, c - 15 - (f & 1), 3, 'yellow', 'white');
  return fin(s, c, c);
}

/** Boss-Markierung: rotes Fadenkreuz ueber dem Ziel (Crippling Shot, +20 % Schaden), pulsiert. 4 Frames, 28 x 28, Anker Mitte. */
export function bossMarkRaster(frame: number): FxRaster {
  const f = ((Math.floor(frame) % MARK_FRAMES) + MARK_FRAMES) % MARK_FRAMES;
  const S = 28, c = 14;
  const s = new Surface(S, S);
  const r = [8, 9, 8, 7][f];
  crosshair(s, c, c, r, f % 2 ? 'red' : 'crimson', 'white');
  s.ring(c, c, r - 3, r - 3, 'crimson');
  // Zacken an den Enden drehen mit
  const a = f * 0.2;
  for (let i = 0; i < 4; i++) { const t = (i / 4) * Math.PI * 2 + a; s.px(c + Math.cos(t) * (r + 3), c + Math.sin(t) * (r + 3), 'coral'); }
  s.rect(c - 1, c - 1, 3, 3, 'red'); s.px(c, c, 'white');
  return fin(s, c, c);
}
