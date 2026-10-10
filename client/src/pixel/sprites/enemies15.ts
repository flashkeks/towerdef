/**
 * Gegner Runde 15 (docs/design/karten-gegner-r15.md, Abschnitt 2): Pink Glim, Frostling, Crystal Brute (Risse 0-3),
 * Gloomship (Blimp, Schadensstufen 0-2), Frost Wyrm (Phasen 0-2) und Ember Colossus (Platten 0-4) sowie die Merkmale
 * Regrow (Blaetterkranz) und Fortified (Eisenbaender) als Ueberlagerung fuer jeden Typ. Ganze Pixel, nur Palette.
 */
import { crystal, flake, flame, spark } from './parts';
import { irnd, RAMPS, type Ramp, Surface } from './surface';
import type { EnemyType } from './types';

// ------------------------------------------------------------------ kleine Glims: Pink, Frostling

const PINK: Ramp = ['orchid', 'coral', 'peach'];

export function drawPink(f: number, s: Surface): void {
  const cx = 13, base = 19;
  const up = f & 1; // Schritt: zusammen + hoch
  const rx = 5.4 + (up ? 0 : 0.8), ry = 5.2 - (up ? 0 : 0.4);
  const cy = base - ry - (up ? 2 : 0) + 0.3;
  const topy = Math.round(cy - ry);
  // Tempo-Striche hinter dem Koerper (Blick nach rechts), je Frame verschoben
  const sp = [0, 2, 1, 3][f];
  for (const [dy, len, col] of [[-1, 4, 'peach'], [2, 6, 'coral'], [5, 3, 'peach']] as [number, number, 'peach' | 'coral'][]) {
    const x0 = 1 + ((sp + len) % 3);
    s.rect(x0, Math.round(cy) + dy, len, 1, col);
  }
  // zwei kleine Blattspitzen, nach hinten gelegt
  s.rect(cx - 3, topy - 2, 2, 3, 'coral'); s.px(cx - 4, topy - 3, 'peach'); s.px(cx - 3, topy - 3, 'coral'); s.px(cx - 3, topy - 2, 'peach');
  s.rect(cx, topy - 3, 2, 4, 'coral'); s.px(cx - 1, topy - 4, 'peach'); s.px(cx, topy - 4, 'coral'); s.px(cx, topy - 3, 'peach');
  s.ball(cx, cy, rx, ry, PINK);
  for (let i = 0; i < 3; i++) s.px(cx - rx * 0.5 + i, cy - ry * 0.55 + i * 0.4, 'white');
  // Gesichtsfenster, nach vorn gerueckt
  const fy = Math.round(cy - 0.5);
  s.rect(cx - 2, fy, 7, 3, 'night');
  s.px(cx - 2, fy, 'orchid'); s.px(cx + 4, fy, 'orchid');
  s.rect(cx - 1, fy + 1, 1, 2, 'white'); s.rect(cx + 2, fy + 1, 1, 2, 'white');
  // Beine: Laufschritt
  if (up) { s.rect(cx - 3, base - 1, 2, 1, 'orchid'); s.rect(cx + 2, base - 1, 2, 1, 'orchid'); }
  else { s.rect(cx - 6, base, 3, 1, 'orchid'); s.rect(cx + 4, base - 1, 3, 1, 'orchid'); s.px(cx - 4, base - 1, 'orchid'); }
  if (!up) { s.px(cx - 9 - (f >> 1), base, 'peach'); s.px(cx - 10, base - 1, 'coral'); }
}

export function drawFrostling(f: number, s: Surface): void {
  const cx = 12, base = 20;
  const bob = [0, -1, 0, -1][f & 3];
  const top = 3 + bob, bot = base - 3 + bob;
  // Eisspitzen (hinter dem Koerper)
  const sway = [0, 1, 0, -1][f & 3];
  crystal(s, cx - 7, top + 9 + sway, 4, ['night', 'violet', 'ice'], 1);
  crystal(s, cx + 7, top + 8 - sway, 4, ['night', 'violet', 'ice'], 1);
  crystal(s, cx, top - 1, 3, ['violet', 'ice', 'white'], 1);
  // Koerper: dunkler Frostkristall, sechs Facetten
  const P: [number, number][] = [[cx, top], [cx + 6.5, top + 5], [cx + 6, bot - 3], [cx + 2.5, bot + 1.5], [cx - 2.5, bot + 1.5], [cx - 6, bot - 3], [cx - 6.5, top + 5]];
  s.poly(P, (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - (top + 8);
    if (dx < -2.2 && dy < 1) return 'violet'; // helle Facette oben links
    if (dx > 2.5) return 'plum'; // dunkle rechts
    if (dy > 3) return 'plum';
    return 'night';
  });
  // Kantenlicht: Frost an den Kanten oben links
  s.line(cx, top + 1, cx - 5.5, top + 5, 'ice');
  s.line(cx - 6, top + 6, cx - 5.5, bot - 3, 'sky');
  s.px(cx - 1, top + 2, 'white'); s.px(cx - 4, top + 5, 'white');
  s.line(cx + 1, top + 1, cx + 5, top + 5, 'violet');
  // Facettenlinien
  s.line(cx, top + 2, cx, top + 6, 'violet');
  s.line(cx - 2, top + 9, cx - 5, bot - 2, 'violet');
  s.line(cx + 2, top + 9, cx + 5, bot - 2, 'violet');
  // Gesicht: Eisaugen im schwarzen Kristall
  const fy = top + 7;
  s.rect(cx - 4, fy, 8, 4, 'ink');
  const blink = f === 3;
  for (const sg of [-1, 1]) {
    const x = cx + sg * 2 - (sg < 0 ? 1 : 0);
    s.rect(x - (sg < 0 ? 1 : 0), fy + 1, 2, blink ? 1 : 2, 'ice');
    if (!blink) s.px(x - (sg < 0 ? 1 : 0), fy + 1, 'white');
  }
  // Kristallfuesse
  s.rect(cx - 4, base - 1, 2, 2, 'violet'); s.rect(cx + 2, base - 1, 2, 2, 'violet');
  s.px(cx - 4, base - 1, 'ice'); s.px(cx + 2, base - 1, 'ice');
  if (f & 1) { s.px(cx - 4, base + 1, 'plum'); } else { s.px(cx + 3, base + 1, 'plum'); }
  // Frostflimmern
  const k = f & 3;
  s.px(cx + 8, top + 3 - (k >> 1), 'white'); s.px(cx - 9, top + 5 + k % 2, 'ice'); s.px(cx + 6 - k, top - 2, 'sky');
  if (f === 0) flake(s, cx + 9, top + 12, 'ice'); if (f === 2) flake(s, cx - 9, top + 14, 'sky');
}

// ------------------------------------------------------------------ Crystal Brute

const CRY: Ramp = ['navy', 'sky', 'ice'];

/** Crystal Brute 42 x 40: Felskoerper mit Kristallpanzer. stage 0..3 = Risse (3: Brustplatte zerbrochen, Kern liegt frei). */
export function drawCrystalBrute(f: number, stage: number, s: Surface): void {
  const cx = 21, base = 35;
  const step = f & 1;
  const sway = [0, 1, 0, -1][f & 3];
  const bob = step ? 0 : -1;
  const cy = base - 13 + bob;
  const R = RAMPS.cloth;
  // Beine
  s.rect(cx - 8, base - 4, 5, 4, 'night'); s.rect(cx + 3, base - 4, 5, 4, 'night');
  s.rect(cx - 8 + (step ? 1 : 0), base - 1, 6, 2, 'dusk'); s.rect(cx + 3 - (step ? 1 : 0), base - 1, 6, 2, 'dusk');
  s.px(cx - 8, base - 4, 'slate'); s.px(cx + 3, base - 4, 'slate');
  // Arme mit Kristallfaeusten
  for (const sg of [-1, 1]) {
    const ay = cy + 4 + (sg < 0 ? (step ? 1 : 0) : (step ? 0 : 1));
    s.ball(cx + sg * 13, ay, 4, 5, R);
    crystal(s, cx + sg * 15, ay + 3, 3, CRY, 1);
  }
  // Rumpf
  s.ellipseFn(cx, cy, 11.5, 10.5, (x, y, nx, ny) => {
    const l = -nx * 0.55 - ny * 0.7;
    const bumpy = ((x * 7 + y * 13) % 5 === 0) ? 0.12 : 0;
    const v = l + bumpy;
    return v > 0.5 ? R[2] : v > -0.2 ? R[1] : R[0];
  });
  // Kristallrueckenkamm hinter dem Kopf (links hinten, hoeher mit weniger Rissen)
  const crest = stage >= 3 ? 1 : 0;
  const cl: [number, number, number][] = [[-8, -9, 4], [-3, -11, 6], [3, -11, 5], [8, -9, 4]];
  cl.forEach(([dx, dy, h], i) => {
    const hh = h - (stage >= 2 && i % 2 ? 2 : 0) - crest * (i === 1 ? 2 : 0);
    crystal(s, cx + dx, cy + dy - 1, hh, CRY, 1);
  });
  // Schulterpanzer aus Kristall
  for (const sg of [-1, 1]) {
    const broken = stage >= 2 && sg > 0;
    s.poly([[cx + sg * 6, cy - 9], [cx + sg * 13, cy - 5], [cx + sg * 13, cy + 1], [cx + sg * 9, cy + 1]], (x, y) => (y < cy - 5 ? 'ice' : x * sg > (cx + sg * 10) * sg ? 'navy' : 'sky'));
    s.line(cx + sg * 6, cy - 9, cx + sg * 13, cy - 5, 'white');
    if (!broken) crystal(s, cx + sg * 11, cy - 8, 6, CRY, 2);
    else { crystal(s, cx + sg * 11, cy - 6, 3, CRY, 1); s.px(cx + sg * 12, cy - 12 - (f % 2), 'ice'); }
  }
  // Brustplatte: Kristalle
  const chest = stage >= 3 ? 0 : 1;
  if (chest) {
    s.poly([[cx - 6, cy + 1], [cx + 6, cy + 1], [cx + 8, cy + 6], [cx, cy + 10], [cx - 8, cy + 6]], (x, y) => (x < cx - 2 ? (y < cy + 5 ? 'ice' : 'sky') : x > cx + 3 ? 'navy' : 'sky'));
    s.line(cx - 6, cy + 1, cx + 6, cy + 1, 'white'); s.line(cx, cy + 1, cx, cy + 9, 'navy');
    s.px(cx - 4, cy + 3, 'white'); s.px(cx - 3, cy + 4, 'white');
  } else {
    // zerbrochen: freiliegender Eiskern + Scherben
    s.ellipseFn(cx, cy + 5, 5, 4, (x, y, nx, ny) => (nx * nx + ny * ny < 0.35 ? 'white' : f % 2 ? 'ice' : 'sky'));
    for (const [dx, dy] of [[-7, 2], [7, 3], [-5, 9], [6, 8]]) s.px(cx + dx, cy + dy + ((f + dx) & 1), 'ice');
  }
  // Risse (Eislicht)
  const glow = f % 2 ? 'ice' : 'sky';
  if (stage >= 1) {
    s.line(cx - 10, cy - 3, cx - 6, cy + 2, 'night'); s.line(cx - 6, cy + 2, cx - 8, cy + 7, 'night');
    s.px(cx - 8, cy - 1, glow); s.px(cx - 6, cy + 3, glow); s.px(cx - 8, cy + 6, 'white');
  }
  if (stage >= 2) {
    s.line(cx + 9, cy - 3, cx + 6, cy + 1, 'night'); s.line(cx + 6, cy + 1, cx + 9, cy + 6, 'night');
    s.px(cx + 8, cy - 2, glow); s.px(cx + 7, cy + 2, 'white');
    s.line(cx - 2, cy - 10, cx + 1, cy - 6, 'night'); s.px(cx, cy - 8, glow);
    for (let i = 0; i < 3; i++) s.px(cx - 11 + i * 11 + sway, cy - 14 - ((f + i) % 3), 'ice');
  }
  if (stage >= 3) {
    s.line(cx - 4, cy - 4, cx - 1, cy + 1, 'night'); s.px(cx - 3, cy - 2, 'white');
    s.rect(cx + 6, cy - 9, 3, 2, 'ice'); s.px(cx + 7, cy - 9, 'white');
    for (let i = 0; i < 4; i++) s.px(cx - 12 + i * 8 + sway, cy - 16 - ((f * 2 + i) % 4), i % 2 ? 'white' : 'ice');
  }
  // Gesicht: Eisaugen
  const fy = cy - 3;
  s.rect(cx - 7, fy, 5, 4, 'ink'); s.rect(cx + 2, fy, 5, 4, 'ink');
  const eye = stage >= 2 ? 'white' : 'ice';
  s.rect(cx - 6, fy + 1, 3, 3, eye); s.rect(cx + 3, fy + 1, 3, 3, eye);
  s.rect(cx - 5, fy + 2, 1, 1, 'navy'); s.rect(cx + 4, fy + 2, 1, 1, 'navy');
  s.rect(cx - 7, fy - 2, 6, 1, 'night'); s.rect(cx + 1, fy - 2, 6, 1, 'night');
  s.rect(cx - 4, fy + 6, 8, 1, 'ink');
  for (const x of [-3, -1, 1, 3]) s.px(cx + x, fy + 6, 'silver');
  s.px(cx - 10 + sway, cy + 9, 'ice'); s.px(cx + 10 - sway, cy + 8, 'sky');
}

// ------------------------------------------------------------------ Gloomship

const HULL: Ramp = ['night', 'violet', 'orchid'];

/** Gloomship 66 x 58: schwebendes Luftschiff. Anker = Bodenpunkt unter dem Schiff (die Luecke darueber ist der Schwebeabstand). stage 0..2 = Schaeden. */
export function drawGloomship(f: number, stage: number, s: Surface): void {
  const cx = 33;
  const bob = [0, -1, -2, -1][f & 3];
  const cy = 24 + bob;
  const rx = 27, ry = 12.5;
  // Heckflossen (hinter dem Rumpf)
  s.poly([[cx - 22, cy - 4], [cx - 33, cy - 17], [cx - 28, cy - 1]], (x, y) => (y < cy - 8 ? 'orchid' : 'violet'));
  s.poly([[cx - 22, cy + 5], [cx - 32, cy + 15], [cx - 27, cy + 3]], (x, y) => (y < cy + 9 ? 'violet' : 'night'));
  s.poly([[cx - 24, cy - 1], [cx - 35, cy - 2], [cx - 24, cy + 3]], 'violet');
  s.line(cx - 22, cy - 4, cx - 33, cy - 17, 'white');
  // Huelle
  s.ellipseFn(cx, cy, rx, ry, (x, y, nx, ny) => {
    const l = -nx * 0.35 - ny * 0.85;
    return l > 0.58 ? 'orchid' : l > -0.15 ? 'violet' : l > -0.62 ? HULL[0] : 'ink';
  });
  // Segmentbaender (Spanten)
  for (const dx of [-17, -8, 1, 10, 18]) {
    const k = Math.sqrt(Math.max(0, 1 - (dx / rx) ** 2)) * ry;
    s.line(cx + dx, cy - k + 1, cx + dx - 2, cy + k - 1, 'night');
    s.line(cx + dx + 1, cy - k + 2, cx + dx - 1, cy - k * 0.2, 'orchid');
  }
  // Laengsnaht
  s.line(cx - 24, cy + 1, cx + 24, cy + 1, 'night');
  // Flicken (zusammengenaeht aus Daemmerstoff)
  s.rect(cx - 15, cy - 8, 5, 4, 'dusk'); s.rect(cx - 15, cy - 8, 5, 1, 'slate');
  s.px(cx - 14, cy - 6, 'stone'); s.px(cx - 11, cy - 6, 'stone');
  s.rect(cx + 4, cy + 3, 6, 4, 'dusk'); s.rect(cx + 4, cy + 3, 6, 1, 'slate'); s.px(cx + 5, cy + 5, 'stone'); s.px(cx + 8, cy + 5, 'stone');
  // Gesicht vorn: leuchtende Augen und Zackenmaul
  const ex = cx + 15, ey = cy - 3;
  const eyeCol = stage >= 2 ? 'magenta' : 'yellow';
  for (const dx of [-5, 3]) {
    s.rect(ex + dx - 1, ey - 1, 5, 5, 'ink');
    s.rect(ex + dx, ey, 3, 3, eyeCol); s.px(ex + dx, ey, 'white');
    if (f === 3) s.rect(ex + dx, ey, 3, 2, 'ink');
  }
  s.rect(ex - 5, ey + 6, 11, 2, 'ink');
  for (let i = 0; i < 5; i++) s.px(ex - 4 + i * 2, ey + 6, 'white');
  // Bug-Spitze: Eisen
  s.poly([[cx + 26, cy - 3], [cx + 31, cy], [cx + 26, cy + 3]], 'stone'); s.px(cx + 27, cy - 1, 'white'); s.px(cx + 29, cy, 'silver');
  // Gondel + Taue
  const gy = cy + ry + 7;
  for (const dx of [-8, -3, 3, 8]) s.line(cx + dx * 1.3, cy + ry - 2 - Math.abs(dx) * 0.2, cx + dx, gy, 'stone');
  s.box(cx - 10, gy, 20, 8, RAMPS.wood);
  s.rect(cx - 10, gy + 3, 20, 1, 'bark');
  for (let i = 0; i < 4; i++) s.rect(cx - 8 + i * 5, gy + 1, 3, 2, 'night');
  s.rect(cx - 11, gy + 8, 22, 1, 'plum');
  // Laternen an der Gondel
  for (const [dx, k] of [[-13, 0], [13, 1]]) {
    const lx = cx + dx, ly = gy + 6 + ((f + k) & 1);
    s.line(lx, gy + 1, lx, ly - 3, 'stone');
    s.ball(lx, ly, 2.4, 3, ['amber', 'yellow', 'white']);
    s.rect(lx - 1, ly - 4, 3, 1, 'rust');
    if (f & 1) spark(s, lx + 3, ly - 2, 'yellow');
  }
  // Heckpropeller
  const px = cx - 33, py = gy + 3;
  s.rect(cx - 12, gy + 3, 3, 2, 'stone');
  const ph = f & 3;
  const arms: [number, number][] = [[0, -5], [4, -2], [5, 0], [4, 2]];
  void arms;
  const ang = (ph / 4) * Math.PI;
  for (const sg of [-1, 1]) s.line(cx - 11 + 0, py + 1, cx - 11 + Math.cos(ang + Math.PI / 2) * 2, py + 1 + sg * Math.sin(ang + Math.PI / 2) * 6, 'silver', 1);
  s.ball(cx - 11, py + 1, 1.5, 1.5, ['slate', 'stone', 'white']);
  void px;
  // Schaeden
  if (stage >= 1) {
    // aufgerissene Huelle oben, Glimmen darunter
    s.poly([[cx - 6, cy - ry + 1], [cx + 3, cy - ry + 1], [cx + 1, cy - 4], [cx - 4, cy - 5]], (x, y) => ((x + y + f) % 7 === 0 ? 'magenta' : y < cy - 8 ? 'orchid' : 'plum'));
    s.line(cx - 6, cy - ry + 1, cx - 4, cy - 5, 'ink'); s.line(cx + 3, cy - ry + 1, cx + 1, cy - 4, 'ink');
    s.px(cx - 5, cy - ry - 1, 'orchid'); s.px(cx + 3, cy - ry - 2 - (f & 1), 'violet');
    s.line(cx + 10, cy + 4, cx + 14, cy + 8, 'ink'); s.px(cx + 12, cy + 6, 'orchid');
  }
  if (stage >= 2) {
    s.poly([[cx - 22, cy - 2], [cx - 14, cy - 2], [cx - 13, cy + 7], [cx - 21, cy + 6]], (x, y) => ((x * 3 + y + f) % 5 === 0 ? 'yellow' : (x + y) % 3 === 0 ? 'orange' : 'plum'));
    s.line(cx - 22, cy - 2, cx - 21, cy + 6, 'ink'); s.line(cx - 14, cy - 2, cx - 13, cy + 7, 'ink');
    // Brand oben und Rauch
    flame(s, cx - 3, cy - ry + 2, 7, f, 'red', 'orange', 'yellow');
    flame(s, cx + 6, cy - ry + 3, 5, f + 2, 'orange', 'amber', 'yellow');
    for (let i = 0; i < 3; i++) s.px(cx - 12 - i * 3 - (f & 1), cy - ry - 4 - i * 2, i % 2 ? 'dusk' : 'slate');
    s.line(cx - 2, gy - 2, cx - 6, gy + 4, 'ink');
  }
}

// ------------------------------------------------------------------ Frost Wyrm

/** Frost Wyrm 80 x 64 (Boss). stage 0..2 = Phase (>66 %, 66-33 %, <33 %). Kopf rechts, Koerper schlaengelt in Hoeckern am Boden nach links. */
export function drawWyrm(f: number, stage: number, s: Surface): void {
  const base = 60;
  const N = 17;
  type Seg = { x: number; y: number; r: number };
  const segs: Seg[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1); // 0 Schwanz, 1 Hals
    const r = t < 0.55 ? 1.8 + Math.sin((t / 0.55) * Math.PI * 0.5) * 5.8 : 7.6 - (t - 0.55) * 5;
    const lift = t > 0.66 ? Math.pow((t - 0.66) / 0.34, 1.45) * 21 : 0;
    const wave = Math.sin(t * Math.PI * 3.1 - (f / 4) * Math.PI * 2);
    const hump = Math.max(0, wave) * 5.2 * (1 - Math.min(1, lift / 8));
    segs.push({ x: 12 + t * 36, y: base - r - 1 - hump - lift, r });
  }
  const hd = segs[N - 1];
  // Schwanzspitze: zwei Eiskristalle nach hinten
  const tl = segs[0];
  s.poly([[tl.x + 1, tl.y - 1.5], [tl.x - 8, tl.y - 3 - (f & 1)], [tl.x, tl.y + 1]], (x) => (x < tl.x - 4 ? 'white' : 'ice'));
  s.poly([[tl.x + 1, tl.y + 0.5], [tl.x - 6, tl.y + 3 + (f & 1)], [tl.x + 1, tl.y + 3]], (x) => (x < tl.x - 3 ? 'ice' : 'sky'));
  // Fluegel (hinter dem Rumpf, gefaltet, flattert leicht)
  const fl = [0, -1, -2, -1][f & 3];
  const w0 = segs[12];
  const S: [number, number] = [w0.x + 1, w0.y - w0.r + 2], Wr: [number, number] = [w0.x - 5, w0.y - 22 + fl];
  const tips: [number, number][] = [[w0.x - 20, w0.y - 13 + fl], [w0.x - 15, w0.y - 4 + fl], [w0.x - 7, w0.y - 1]];
  s.poly([S, Wr, tips[0], [w0.x - 14, w0.y - 11 + fl], tips[1], [w0.x - 9, w0.y - 4], tips[2]], (x, y) => (y < w0.y - 12 + fl ? 'sky' : (x + y) % 5 === 0 ? 'ice' : 'navy'));
  for (const t of tips) s.line(Wr[0], Wr[1], t[0], t[1], 'white');
  s.line(S[0], S[1], Wr[0], Wr[1], 'ice');
  s.px(Wr[0], Wr[1] - 1, 'white');
  if (stage >= 2) { s.line(tips[0][0] + 1, tips[0][1], tips[0][0] + 5, tips[0][1] + 5, 'ink'); }
  // Koerper: Segmentkugeln, vom Schwanz zum Hals
  segs.forEach((g, i) => {
    s.ellipseFn(g.x, g.y, g.r, g.r, (x, y, nx, ny) => {
      const l = -nx * 0.5 - ny * 0.75;
      if (ny > 0.38) return l > -0.3 ? 'silver' : 'stone'; // heller Bauch
      return l > 0.45 ? 'ice' : l > -0.25 ? 'sky' : l > -0.7 ? 'navy' : 'night';
    });
    if (g.r > 4.5 && i % 2 === 0) s.line(g.x + 1, g.y - g.r + 1, g.x + 1, g.y + g.r * 0.35, 'navy');
    if (i % 2 === 1 && i >= 3 && i <= 15) s.line(g.x - 1, g.y + g.r * 0.45, g.x + 2, g.y + g.r * 0.45, 'white'); // Bauchplatten
  });
  // Rueckenkamm: kleine Eiskristalle
  segs.forEach((g, i) => {
    if (i < 3 || i > 14 || i % 2) return;
    crystal(s, g.x, g.y - g.r - 0.5, 2.6 + g.r * 0.2, ['sky', 'ice', 'white'], 1);
  });
  // Eisrisse je Phase
  if (stage >= 1) for (const i of [5, 7, 9]) { const g = segs[i]; s.line(g.x - 2, g.y - g.r + 2, g.x + 1, g.y - 1, 'night'); s.px(g.x - 1, g.y - g.r + 4, f % 2 ? 'white' : 'ice'); }
  if (stage >= 2) for (const i of [4, 6, 8, 10]) { const g = segs[i]; s.line(g.x + 2, g.y - g.r + 1, g.x - 1, g.y + 2, 'night'); s.px(g.x, g.y - 1, 'magenta'); s.px(g.x - 1, g.y + 1, 'orchid'); }
  // Vorderpranken am Halsansatz (Schritt wechselt)
  const lg = segs[11];
  for (const [dx, k] of [[-3, 0], [3, 1]]) {
    const up = (f + k) & 1 ? 2 : 0;
    const top = Math.round(lg.y + lg.r - 2);
    s.rect(lg.x + dx - 1, top, 3, Math.max(2, base - top - up), 'stone');
    s.rect(lg.x + dx - 1, top, 1, Math.max(2, base - top - up), 'silver');
    s.rect(lg.x + dx - 2, base - 1 - up, 6, 2, 'silver'); s.px(lg.x + dx + 4, base - up, 'white'); s.px(lg.x + dx + 3, base - up, 'white');
  }
  // Hals-Kamm
  for (let i = 0; i < 3; i++) crystal(s, hd.x - 5 + i * 3, hd.y - hd.r - 1 - (i === 1 ? 1 : 0), 3 + (i === 1 ? 2 : 0), ['sky', 'ice', 'white'], 1);
  // Hoerner (nach hinten geschwungen), Phase 2: ein Horn abgebrochen
  const hx = hd.x + 7, hy = hd.y - 3;
  s.poly([[hx - 1, hy - 5], [hx - 13, hy - 13 - (f & 1)], [hx - 3, hy - 2]], (x, y) => (x < hx - 8 ? 'white' : y < hy - 8 ? 'ice' : 'sky'));
  if (stage < 2) s.poly([[hx + 4, hy - 6], [hx - 6, hy - 16 - (f & 1)], [hx + 1, hy - 3]], (x, y) => (x < hx - 3 ? 'white' : y < hy - 10 ? 'ice' : 'sky'));
  else { s.rect(hx + 2, hy - 8, 3, 2, 'ice'); s.px(hx + 3, hy - 11 - (f & 1), 'white'); s.px(hx + 4, hy - 9, 'ice'); }
  // Kopf: Schaedel
  s.ellipseFn(hx, hy, 9.5, 7.5, (x, y, nx, ny) => {
    const l = -nx * 0.45 - ny * 0.8;
    return l > 0.5 ? 'white' : l > 0 ? 'ice' : l > -0.5 ? 'sky' : 'navy';
  });
  // Schnauze
  s.poly([[hx + 4, hy - 5], [hx + 17, hy - 2], [hx + 17, hy + 2], [hx + 4, hy + 4]], (x, y) => (y < hy - 2 ? 'ice' : 'sky'));
  s.line(hx + 4, hy - 5, hx + 17, hy - 2, 'white');
  s.px(hx + 15, hy - 2, 'night'); s.px(hx + 13, hy - 2, 'navy');
  // Kiefer, offen (Frosthauch), je Frame weiter
  const open = [2, 3, 4, 3][f & 3] + (stage >= 1 ? 1 : 0);
  s.poly([[hx + 3, hy + 3], [hx + 15, hy + 3 + open * 0.6], [hx + 16, hy + 5 + open * 0.6], [hx + 4, hy + 7]], (x, y) => (y > hy + 5 ? 'navy' : 'night'));
  s.rect(hx + 4, hy + 2, 12, 2 + Math.floor(open / 2), 'ink');
  for (let i = 0; i < 5; i++) { s.px(hx + 5 + i * 2, hy + 2, 'white'); s.px(hx + 6 + i * 2, hy + 3 + Math.floor(open / 2), 'white'); }
  // Frostatem (Nebel vor dem Maul)
  for (let i = 0; i < 4 + stage; i++) {
    const k = (f * 2 + i * 3) % 8;
    s.px(hx + 18 + (k % 5), hy + 3 + ((i * 5 + f) % 5) - 2, i % 2 ? 'white' : 'ice');
    if (i % 3 === 0) s.px(hx + 20 + (k % 3), hy + 4 + ((i + f) % 3), 'sky');
  }
  // Auge
  const ex = hx + 3, ey = hy - 3;
  s.rect(ex - 1, ey - 1, 5, 4, 'ink');
  s.rect(ex, ey, 3, 2, stage >= 2 ? 'magenta' : stage >= 1 ? 'orange' : 'ice');
  s.px(ex, ey, 'white');
  s.line(ex - 2, ey - 3, ex + 4, ey - 1, 'night');
  if (stage >= 1) { s.line(hx - 5, hy - 5, hx - 2, hy + 1, 'night'); s.px(hx - 4, hy - 2, 'white'); }
  // Schneestaub am Boden
  for (let i = 0; i < 4; i++) s.px(4 + ((i * 17 + f * 5) % 50), base + 2 - ((i + f) & 1), i % 2 ? 'white' : 'ice');
}

// ------------------------------------------------------------------ Ember Colossus

/** Ember Colossus 80 x 64 (Boss): Magma-Golem. fallen = abgefallene Panzerplatten 0..4. Anker = Fuesse. */
export function drawColossus(f: number, fallen: number, s: Surface): void {
  const cx = 40, base = 62;
  const rnd = irnd(f * 7 + 3);
  const stomp = [0, -1, 0, -1][f & 3]; // Rumpf hebt sich beim Schritt
  const lift = [0, 5, 0, 0][f & 3], liftR = [0, 0, 0, 5][f & 3];
  const cy = base - 33 + stomp;
  const lava = (x: number, y: number): 'orange' | 'amber' | 'yellow' => (((x * 5 + y * 3 + f * 2) % 11) === 0 ? 'yellow' : ((x + y) & 1) ? 'amber' : 'orange');
  // Beine (Basalt, Lava in den Fugen)
  const leg = (sx: number, up: number): void => {
    const lx = cx + sx;
    s.box(lx - 7, base - 20 - up * 0.5, 14, 14, ['night', 'dusk', 'slate']);
    s.rect(lx - 7, base - 8 - up, 14, 3, 'night');
    s.box(lx - 9, base - 7 - up, 18, 7, ['ink', 'night', 'dusk']);
    s.rect(lx - 6, base - 12, 12, 1, 'orange'); s.px(lx - 3, base - 12, 'yellow'); s.px(lx + 3, base - 12, 'yellow');
    s.px(lx - 5, base - 17, 'slate'); s.px(lx - 3, base - 16, 'stone');
    if (up === 0 && (f & 1)) { s.px(lx - 11, base, 'amber'); s.px(lx + 11, base - 1, 'orange'); }
  };
  leg(-14, lift); leg(14, liftR);
  // Arme (hinten: rechts), grosse Faeuste mit Lava
  const swing = [0, 1, 0, -1][f & 3];
  for (const sg of [-1, 1]) {
    const ax = cx + sg * 30, ay = cy + 8 + sg * swing;
    s.line(cx + sg * 20, cy - 6, ax, ay, 'dusk', 8);
    s.ball(ax, ay + 12, 8, 9, ['night', 'dusk', 'slate']);
    s.rect(ax - 4, ay + 8, 8, 1, 'orange'); s.px(ax - 2, ay + 12, 'amber'); s.px(ax + 2, ay + 14, 'yellow');
    s.rect(ax - 3, ay + 20, 2, 2 + ((f + (sg > 0 ? 1 : 0)) & 1), 'amber'); // Lavatropfen
  }
  // Rumpf
  s.ellipseFn(cx, cy, 25, 20, (x, y, nx, ny) => {
    const l = -nx * 0.5 - ny * 0.75;
    const bumpy = ((x * 7 + y * 13) % 6 === 0) ? 0.1 : 0;
    const v = l + bumpy;
    return v > 0.5 ? 'slate' : v > -0.1 ? 'dusk' : v > -0.6 ? 'night' : 'ink';
  });
  // Lava-Adern
  const veins: [number, number, number, number][] = [[-20, -4, -12, 2], [-12, 2, -14, 10], [-14, 10, -8, 16], [20, -2, 12, 4], [12, 4, 16, 12], [-2, -14, 2, -8], [2, -8, -1, -2], [10, 12, 6, 18]];
  for (const [a, b, c, d] of veins) { s.line(cx + a, cy + b, cx + c, cy + d, 'orange'); }
  for (const [a, b, c, d] of veins) { s.px(cx + (a + c) / 2, cy + (b + d) / 2, lava(a, b)); }
  // Kern in der Brust
  s.ball(cx, cy + 6, 8, 7, ['orange', 'amber', 'yellow']);
  s.ellipse(cx, cy + 6, 4, 3.5, f % 2 ? 'yellow' : 'white');
  s.ring(cx, cy + 6, 8.5, 7.5, 'rust');
  // Platten: (0) Schulter links, (1) Schulter rechts, (2) Brustplatte, (3) Kopfhelm
  type Plate = { pts: [number, number][]; rivets: [number, number][] };
  const plates: Plate[] = [
    { pts: [[cx - 26, cy - 12], [cx - 14, cy - 20], [cx - 9, cy - 12], [cx - 18, cy - 2], [cx - 27, cy - 3]], rivets: [[cx - 22, cy - 10], [cx - 14, cy - 15], [cx - 18, cy - 5]] },
    { pts: [[cx + 26, cy - 12], [cx + 14, cy - 20], [cx + 9, cy - 12], [cx + 18, cy - 2], [cx + 27, cy - 3]], rivets: [[cx + 22, cy - 10], [cx + 14, cy - 15], [cx + 18, cy - 5]] },
    { pts: [[cx - 14, cy + 4], [cx - 9, cy - 2], [cx + 9, cy - 2], [cx + 14, cy + 4], [cx + 9, cy + 16], [cx - 9, cy + 16]], rivets: [[cx - 10, cy + 2], [cx + 10, cy + 2], [cx - 7, cy + 14], [cx + 7, cy + 14]] },
    { pts: [[cx - 8, cy - 25], [cx + 8, cy - 25], [cx + 10, cy - 20], [cx - 10, cy - 20]], rivets: [[cx - 6, cy - 23], [cx + 6, cy - 23]] },
  ];
  // Kopf (unter dem Helm), Kern-Brustplatte liegt ueber dem Kern -> Reihenfolge: Kopf, Platten
  const hy = cy - 16;
  s.ball(cx, hy, 11, 8, ['night', 'dusk', 'slate']);
  // Hoerner
  s.poly([[cx - 9, hy - 5], [cx - 14, hy - 10 - (f & 1)], [cx - 5, hy - 8]], (x, y) => (y < hy - 10 ? 'amber' : 'orange'));
  s.poly([[cx + 9, hy - 5], [cx + 14, hy - 10 - (f & 1)], [cx + 5, hy - 8]], (x, y) => (y < hy - 10 ? 'amber' : 'orange'));
  // Gesicht
  s.rect(cx - 8, hy - 2, 6, 4, 'ink'); s.rect(cx + 2, hy - 2, 6, 4, 'ink');
  s.rect(cx - 7, hy - 1, 4, 3, fallen >= 3 ? 'white' : 'yellow'); s.rect(cx + 3, hy - 1, 4, 3, fallen >= 3 ? 'white' : 'yellow');
  s.rect(cx - 6, hy, 2, 2, 'red'); s.rect(cx + 4, hy, 2, 2, 'red');
  s.px(cx - 7, hy - 1, 'white'); s.px(cx + 3, hy - 1, 'white');
  s.rect(cx - 6, hy - 4, 5, 1, 'ink'); s.rect(cx + 1, hy - 4, 5, 1, 'ink');
  s.rect(cx - 5, hy + 4, 10, 2, 'ink'); for (const x of [-4, -2, 0, 2, 4]) s.px(cx + x, hy + 4, (x + f) & 1 ? 'orange' : 'yellow');
  plates.forEach((pl, i) => {
    const gone = i < fallen;
    const p0 = pl.pts;
    if (gone) {
      s.poly(p0, (x, y) => (rnd() > 0.82 ? 'yellow' : (x * 3 + y * 5 + f) % 9 === 0 ? 'amber' : y < p0[0][1] + 6 ? 'red' : 'orange'));
      s.line(p0[0][0], p0[0][1], p0[2][0], p0[2][1], 'rust');
      for (const r of pl.rivets) s.px(r[0], r[1], 'crimson');
    } else {
      s.poly(p0, (x, y) => (x < p0[0][0] + 6 && y < p0[0][1] + 8 ? 'silver' : 'stone'));
      const n = p0.length;
      for (let k = 0; k < n; k++) { const a = p0[k], b = p0[(k + 1) % n]; s.line(a[0], a[1], b[0], b[1], k < 2 ? 'white' : 'slate'); }
      for (const r of pl.rivets) { s.px(r[0], r[1], 'white'); s.px(r[0] + 1, r[1] + 1, 'slate'); }
      // eingebrannte Rune
      const mx = p0.reduce((a, q) => a + q[0], 0) / n, my = p0.reduce((a, q) => a + q[1], 0) / n;
      s.px(mx, my - 1, 'orange'); s.px(mx - 1, my, 'orange'); s.px(mx + 1, my, 'orange'); s.px(mx, my + 1, 'orange');
    }
  });
  // Glutpartikel (steigen auf)
  for (let i = 0; i < 9; i++) {
    const t = ((f * 3 + i * 5) % 14) / 14;
    const x = cx - 30 + ((i * 53) % 61), y = cy - 12 - t * 28 + (i % 3) * 4;
    s.px(x, y, t < 0.35 ? 'yellow' : t < 0.7 ? 'amber' : 'orange');
    if (i % 4 === 0 && t < 0.6) s.px(x + 1, y, 'orange');
  }
  if (fallen >= 1) for (let i = 0; i < fallen * 2; i++) s.px(cx - 24 + ((i * 29 + f * 7) % 49), cy - 22 + ((i * 7 + f) % 9), i % 2 ? 'yellow' : 'orange');
}

// ------------------------------------------------------------------ Merkmale (Ueberlagerung)

/** x-Bereich (Kranzmitte, halbe Breite) je Typ, in dem Blaetter auf der Oberkante sitzen. */
const WREATH: Record<EnemyType, { x: number; hw: number }> = {
  red: { x: 12, hw: 5 }, blue: { x: 12, hw: 5 }, green: { x: 12, hw: 5 }, gold: { x: 12, hw: 5 }, pink: { x: 12, hw: 5 }, frostling: { x: 12, hw: 5 },
  ironshell: { x: 13, hw: 6 }, ember: { x: 12, hw: 5 }, brute: { x: 17, hw: 9 }, crystal: { x: 21, hw: 11 }, leviathan: { x: 40, hw: 20 },
  gloomship: { x: 33, hw: 20 }, wyrm: { x: 56, hw: 10 }, colossus: { x: 40, hw: 22 },
};

/** Regrow: Blaetterkranz auf der Oberkante der Figur, kleine Knospen, pulsiert ueber die Lauf-Frames. */
export function drawRegrow(s: Surface, type: EnemyType, f: number): void {
  const { x: cx, hw } = WREATH[type];
  const pulse = [0, 1, 1, 0][f & 3];
  const big = hw >= 10;
  const top = (x: number): number => { for (let y = 0; y < s.h; y++) if (s.get(x, y)) return y; return -1; };
  const cols: number[] = [];
  const step = big ? 4 : 3;
  for (let x = cx - hw; x <= cx + hw; x += step) cols.push(x);
  cols.forEach((x, i) => {
    const y = top(x);
    if (y < 0) return;
    const lh = (big ? 3 : 2) + (i % 2 === 0 ? pulse : 1 - pulse);
    const lean = i < cols.length / 2 ? -1 : 1;
    // Blatt: zwei Pixel breit, spitz, nach aussen geneigt
    for (let k = 0; k < lh; k++) s.px(x + (k >= lh - 1 ? lean : 0), y - 1 - k, k === lh - 1 ? 'leaf' : k % 2 ? 'grass' : 'leaf');
    s.px(x + 1, y - 1, 'grass'); s.px(x, y, 'pine');
    s.px(x + lean * 1, y - lh, 'leaf');
    // Knospe an jedem dritten
    if (i % 3 === 1) { s.px(x - 1, y - lh - 1, pulse ? 'yellow' : 'amber'); s.px(x, y - lh - 1, 'leaf'); if (big) s.px(x - 1, y - lh - 2, 'white'); }
  });
  if (big) {
    // Ranke seitlich herabhaengend
    const x0 = cx - hw - 1, y0 = top(cx - hw + 1);
    if (y0 >= 0) { s.px(x0, y0 + 1, 'grass'); s.px(x0, y0 + 2, 'leaf'); s.px(x0 - 1, y0 + 3 + pulse, 'grass'); }
  }
}

interface Band { h?: [number, number, number, number]; v?: [number, number, number, number] }
/** Eisenbaender je Typ: h = [x0, x1, y, dicke] waagerecht, v = [x, y0, y1, dicke] senkrecht; nur auf vorhandenen Pixeln. */
const BANDS: Record<EnemyType, Band[]> = {
  red: [{ h: [4, 20, 16, 2] }], blue: [{ h: [4, 20, 16, 2] }], green: [{ h: [4, 20, 16, 2] }], gold: [{ h: [4, 20, 16, 2] }], pink: [{ h: [4, 20, 16, 2] }],
  frostling: [{ h: [4, 20, 16, 2] }],
  ironshell: [{ h: [5, 21, 18, 2] }], ember: [{ h: [5, 19, 18, 2] }],
  brute: [{ h: [6, 28, 20, 2] }, { v: [17, 8, 24, 2] }],
  crystal: [{ h: [8, 34, 21, 3] }, { v: [21, 10, 30, 2] }],
  leviathan: [{ v: [24, 20, 54, 3] }, { v: [42, 14, 58, 3] }, { v: [56, 18, 52, 3] }],
  gloomship: [{ v: [19, 14, 36, 3] }, { v: [31, 11, 36, 3] }, { v: [43, 13, 36, 3] }],
  wyrm: [{ v: [22, 24, 58, 3] }, { v: [32, 20, 58, 3] }, { v: [43, 18, 58, 3] }],
  colossus: [{ h: [14, 66, 31, 4] }, { v: [26, 18, 50, 3] }, { v: [54, 18, 50, 3] }],
};

/** Fortified: Eisenbaender mit Nieten (nur auf der Figur). */
export function drawFortified(s: Surface, type: EnemyType, f: number): void {
  const inside = (x: number, y: number): boolean => s.get(x, y) !== null;
  for (const b of BANDS[type]) {
    if (b.h) {
      const [x0, x1, y, t] = b.h;
      for (let x = x0; x <= x1; x++) for (let k = 0; k < t; k++) {
        if (!inside(x, y + k)) continue;
        s.px(x, y + k, k === 0 ? 'stone' : k === t - 1 ? 'night' : 'slate');
      }
      for (let x = x0 + 2; x <= x1 - 1; x += 5) if (inside(x, y)) s.px(x, y + (t > 2 ? 1 : 0), 'white');
    }
    if (b.v) {
      const [x, y0, y1, t] = b.v;
      for (let y = y0; y <= y1; y++) for (let k = 0; k < t; k++) {
        if (!inside(x + k, y)) continue;
        s.px(x + k, y, k === 0 ? 'stone' : k === t - 1 ? 'night' : 'slate');
      }
      for (let y = y0 + 3; y <= y1 - 2; y += 6) if (inside(x, y)) s.px(x + (t > 2 ? 1 : 0), y, 'white');
    }
  }
  // Funkeln auf dem Eisen, wandert mit dem Frame
  const bnd = BANDS[type][0];
  if (bnd.h) { const sx = bnd.h[0] + 2 + ((f * 5) % Math.max(3, bnd.h[1] - bnd.h[0] - 3)); if (inside(sx, bnd.h[2])) s.px(sx, bnd.h[2], 'white'); }
  if (bnd.v) { const sy = bnd.v[1] + 2 + ((f * 7) % Math.max(3, bnd.v[2] - bnd.v[1] - 3)); if (inside(bnd.v[0], sy)) s.px(bnd.v[0], sy, 'white'); }
}
