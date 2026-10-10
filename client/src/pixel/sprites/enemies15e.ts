/**
 * Gegner Runde 15e: Gloom Cruiser (ZOMG-Klasse), Duskrunner (DDT, schnell, immer Camo) und Dusk Dreadnought (BAD, riesig).
 * Vorbild fuer Aufbau und Palette: Gloomship (enemies15.ts). Alle schweben: Anker = Bodenpunkt unter dem Schiff,
 * der Schatten kommt aus fx.shipShadow. Ganze Pixel, nur Palette.
 */
import { flame, spark } from './parts';
import { type Ramp, Surface } from './surface';
import type { PalName } from '../palette';

const bobOf = (f: number): number => [0, -1, -2, -1][f & 3];

/** Laterne an einer Kette: Glas mit Glut, Kappe, Funke im Wechsel. */
function lantern(s: Surface, x: number, y: number, f: number, k: number, big = false): void {
  const ly = y + ((f + k) & 1);
  s.line(x, y - (big ? 5 : 3), x, ly - 2, 'stone');
  s.ball(x, ly + 1, big ? 2.8 : 2.4, big ? 3.4 : 3, ['amber', 'yellow', 'white']);
  s.rect(x - 1, ly - 3, 3, 1, 'rust');
  s.px(x, ly + 4, 'rust');
  if ((f + k) & 1) spark(s, x + 3, ly - 1, 'yellow');
}

/** Propeller (Seitenansicht): zwei Blaetter, Laenge wechselt je Frame, Nabe. */
function prop(s: Surface, x: number, y: number, f: number, len = 6): void {
  const l = [len, len * 0.55, len, len * 0.55][f & 3];
  s.line(x, y - l, x, y + l, 'silver');
  s.px(x, y - l, 'white');
  s.px(x - 1, y - l * 0.4, 'stone'); s.px(x + 1, y + l * 0.4, 'stone');
  s.ball(x, y, 1.6, 1.6, ['slate', 'stone', 'white']);
}

// ------------------------------------------------------------------ Gloom Cruiser

const HULL: Ramp = ['night', 'violet', 'orchid'];
export const CRUISER_W = 96, CRUISER_H = 74, CRUISER_AX = 48, CRUISER_AY = 71;

/**
 * Gloom Cruiser 96 x 74: das Gloomship eine Nummer groesser — Panzerplatten auf dem Ruecken, Rueckenstacheln,
 * drei Gondeln, zwei Heckmotoren. stage 0..2 = Schaeden (Risse und Glimmen / Plattenverlust und Brand).
 */
export function drawCruiser(f: number, stage: number, s: Surface): void {
  const cx = 48;
  const cy = 28 + bobOf(f);
  const rx = 39, ry = 16;
  // Heckflossen (hinter dem Rumpf): oben gross, unten, Seitenleitwerk
  s.poly([[cx - 28, cy - 5], [cx - 43, cy - 24], [cx - 36, cy - 22], [cx - 20, cy - 12]], (x, y) => (y < cy - 16 ? 'orchid' : 'violet'));
  s.poly([[cx - 28, cy + 6], [cx - 42, cy + 20], [cx - 35, cy + 20], [cx - 20, cy + 12]], (x, y) => (y < cy + 13 ? 'violet' : 'night'));
  s.poly([[cx - 30, cy - 2], [cx - 46, cy - 3], [cx - 46, cy + 3], [cx - 30, cy + 4]], (x, y) => (y < cy ? 'violet' : 'night'));
  s.line(cx - 28, cy - 5, cx - 43, cy - 24, 'white'); s.line(cx - 28, cy + 5, cx - 41, cy + 19, 'orchid');
  s.px(cx - 43, cy - 25, 'white');
  // Huelle
  s.ellipseFn(cx, cy, rx, ry, (x, y, nx, ny) => {
    const l = -nx * 0.35 - ny * 0.85;
    return l > 0.58 ? 'orchid' : l > -0.15 ? 'violet' : l > -0.62 ? HULL[0] : 'ink';
  });
  // Spanten
  for (const dx of [-30, -20, -10, 0, 10, 20, 29]) {
    const k = Math.sqrt(Math.max(0, 1 - (dx / rx) ** 2)) * ry;
    s.line(cx + dx, cy - k + 2, cx + dx - 2, cy + k - 1, 'night');
  }
  s.line(cx - 34, cy + 2, cx + 34, cy + 2, 'night');
  // Panzerplatten auf dem Ruecken (4 Stueck, Nieten, Rueckenstacheln an den Fugen)
  const plates: [number, number][] = [[-30, -19], [-18, -7], [-6, 5], [8, 19], [21, 32]];
  plates.forEach(([a, b], i) => {
    const gone = stage >= 1 && (i === 2 || (stage >= 2 && i === 0));
    s.ellipseFn(cx, cy, rx - 0.5, ry - 0.5, (x, y, nx, ny) => {
      if (x < cx + a || x > cx + b || ny > 0.12 || ny < -0.97) return null;
      if (gone) return (x * 7 + y * 5 + f * 3) % 17 === 0 ? 'magenta' : ny < -0.7 ? 'orchid' : (x + y) % 6 === 0 ? 'violet' : 'plum';
      if (x === cx + a || x === cx + b) return 'night';
      if (ny > 0.0) return 'night';
      return ny < -0.62 ? (x < cx + a + 3 ? 'silver' : 'stone') : ny < -0.3 ? 'slate' : 'dusk';
    });
    if (!gone) {
      const mx = cx + (a + b) / 2;
      const k = Math.sqrt(Math.max(0, 1 - (((a + b) / 2) / rx) ** 2)) * ry;
      s.px(mx - 3, cy - k * 0.55, 'white'); s.px(mx + 3, cy - k * 0.55, 'slate'); s.px(mx - 3, cy - k * 0.1, 'white'); s.px(mx + 3, cy - k * 0.1, 'slate');
      s.px(mx, cy - k * 0.35, 'orchid'); // Siegel
    }
  });
  // Rueckenstacheln an den Fugen
  for (const dx of [-18, -6, 8, 21]) {
    const k = Math.sqrt(Math.max(0, 1 - (dx / rx) ** 2)) * ry;
    s.poly([[cx + dx - 2, cy - k + 1], [cx + dx, cy - k - 5], [cx + dx + 2, cy - k + 1]], (x) => (x <= cx + dx ? 'silver' : 'stone'));
    s.px(cx + dx, cy - k - 5, 'white');
  }
  // Flicken (zusammengenaeht aus Daemmerstoff) unten
  s.rect(cx - 24, cy + 5, 7, 5, 'dusk'); s.rect(cx - 24, cy + 5, 7, 1, 'slate'); s.px(cx - 23, cy + 8, 'stone'); s.px(cx - 19, cy + 8, 'stone');
  s.rect(cx + 6, cy + 6, 6, 4, 'dusk'); s.rect(cx + 6, cy + 6, 6, 1, 'slate'); s.px(cx + 7, cy + 8, 'stone'); s.px(cx + 10, cy + 8, 'stone');
  // Gesicht vorn: grosse Augen mit Brauenplatte, Zackenmaul
  const ex = cx + 25, ey = cy - 1;
  const eyeCol: PalName = stage >= 2 ? 'magenta' : stage >= 1 ? 'orange' : 'yellow';
  for (const dx of [-7, 3]) {
    s.rect(ex + dx - 1, ey - 1, 7, 6, 'ink');
    s.rect(ex + dx, ey, 5, 4, eyeCol); s.px(ex + dx, ey, 'white'); s.px(ex + dx + 1, ey, 'white');
    if (f === 3) s.rect(ex + dx, ey, 5, 3, 'ink');
    s.rect(ex + dx - 1, ey - 3, 7, 2, 'night'); s.px(ex + dx - 1, ey - 3, 'slate');
  }
  s.rect(ex - 7, ey + 7, 15, 2, 'ink');
  for (let i = 0; i < 7; i++) s.px(ex - 6 + i * 2, ey + 7, 'white');
  // Ramme vorn (Eisen)
  s.poly([[cx + 37, cy - 5], [cx + 45, cy], [cx + 37, cy + 5]], 'stone');
  s.line(cx + 37, cy - 5, cx + 45, cy, 'white'); s.line(cx + 37, cy + 5, cx + 45, cy, 'slate'); s.px(cx + 41, cy, 'silver');
  // Gondeln (3) mit Seilen und Laternen
  const gy = cy + ry + 6;
  const gondolas: [number, number][] = [[-24, 14], [0, 20], [24, 14]];
  gondolas.forEach(([dx, gw], gi) => {
    const dropped = stage >= 2 && gi === 0;
    const gx = cx + dx - gw / 2, yy = dropped ? gy + 3 : gy;
    for (const q of [-0.4, 0.4]) {
      const sx = cx + dx + q * gw * 1.1, sy = cy + ry * Math.sqrt(Math.max(0, 1 - ((dx + q * gw) / rx) ** 2)) - 1;
      if (dropped && q < 0) s.line(sx, sy, sx - 2, sy + 4, 'stone'); else s.line(sx, sy, cx + dx + q * gw, yy, 'stone');
    }
    s.box(gx, yy, gw, 8, RAMP_WOOD);
    s.rect(gx, yy + 3, gw, 1, 'bark');
    for (let i = 0; i < Math.floor(gw / 5); i++) s.rect(gx + 2 + i * 5, yy + 1, 3, 2, 'night');
    s.rect(gx - 1, yy + 8, gw + 2, 1, 'plum');
    if (gi === 1) { // Mittelgondel: Kanonenrohr nach vorn
      s.rect(cx + 10, yy + 4, 8, 3, 'slate'); s.rect(cx + 10, yy + 4, 8, 1, 'stone'); s.px(cx + 18, yy + 5, 'ink');
    }
    if (!(dropped)) { lantern(s, gx - 2, yy + 7, f, gi); lantern(s, gx + gw + 2, yy + 7, f, gi + 1); }
  });
  // Heckmotoren (Gondeln mit Propeller) an den Flossen
  for (const [mxx, myy, k] of [[-40, cy - 10, 0], [-39, cy + 12, 1]] as [number, number, number][]) {
    s.box(cx + mxx - 2, myy - 2, 10, 5, ['night', 'slate', 'stone']);
    s.px(cx + mxx - 1, myy - 2, 'white');
    prop(s, cx + mxx - 3, myy, f + k, 5);
  }
  // Schaeden
  if (stage >= 1) {
    s.line(cx - 4, cy - 4, cx + 1, cy + 3, 'ink'); s.line(cx + 1, cy + 3, cx - 1, cy + 8, 'ink');
    s.px(cx - 3, cy - 2, f & 1 ? 'magenta' : 'orchid'); s.px(cx, cy + 5, 'magenta');
    s.line(cx + 12, cy - 3, cx + 17, cy + 5, 'ink'); s.px(cx + 14, cy, 'orchid');
    for (let i = 0; i < 2; i++) s.px(cx - 6 + i * 4, cy - ry - 3 - ((f + i * 2) % 3), i ? 'orchid' : 'violet');
  }
  if (stage >= 2) {
    // aufgerissene Flanke mit Glut, Brand oben
    s.poly([[cx - 30, cy], [cx - 22, cy - 1], [cx - 20, cy + 9], [cx - 29, cy + 8]], (x, y) => ((x * 3 + y + f) % 5 === 0 ? 'yellow' : (x + y) % 3 === 0 ? 'orange' : 'plum'));
    s.line(cx - 30, cy, cx - 29, cy + 8, 'ink'); s.line(cx - 22, cy - 1, cx - 20, cy + 9, 'ink');
    flame(s, cx - 4, cy - ry + 4, 9, f, 'red', 'orange', 'yellow');
    flame(s, cx + 6, cy - ry + 5, 6, f + 2, 'orange', 'amber', 'yellow');
    flame(s, cx - 24, cy - ry + 8, 5, f + 1, 'red', 'orange', 'amber');
    for (let i = 0; i < 4; i++) s.px(cx - 14 - i * 3 - (f & 1), cy - ry - 7 - i * 2, i % 2 ? 'dusk' : 'slate');
    s.line(cx + 6, cy + 12, cx + 12, cy + 16, 'ink');
  }
}
const RAMP_WOOD: Ramp = ['bark', 'wood', 'tan'];

// ------------------------------------------------------------------ Duskrunner

export const RUNNER_W = 66, RUNNER_H = 34, RUNNER_AX = 38, RUNNER_AY = 31;

/**
 * Duskrunner 66 x 34: schwarzer Pfeil. Spitze rechts, Tempo-Streifen links, rote Augenschlitze, cyanfarbene Zierlinien
 * und Duesenflamme. Immer Camo (das Flimmern kommt aus der Sprite-Schicht). stage 0..2 = Schaeden.
 */
export function drawDuskrunner(f: number, stage: number, s: Surface): void {
  const cx = 40;
  const cy = 14 + [0, -1, 0, 1][f & 3];
  // Tempo-Streifen hinter dem Schiff, wandern je Frame (laenger = schneller)
  const sx = [0, 3, 6, 2][f];
  const streaks: [number, number, number, PalName][] = [[-6, 10, 0, 'sky'], [-3, 14, 5, 'ice'], [0, 9, 2, 'stone'], [3, 13, 7, 'ice'], [6, 8, 3, 'sky'], [9, 11, 1, 'stone']];
  for (const [dy, len, off, col] of streaks) {
    const x0 = 1 + ((sx + off) % 6);
    s.rect(x0, cy + dy, len, 1, col);
    if (len > 10) s.px(x0 + len, cy + dy, 'white');
  }
  // Hecktrieb: Duesenflamme (cyan -> weiss)
  const fl = [7, 10, 8, 11][f];
  for (let i = 0; i < fl; i++) {
    const w = i < fl * 0.35 ? 1 : 0;
    s.rect(cx - 21 - i, cy - w, 1, w * 2 + 1, i < fl * 0.3 ? 'white' : i < fl * 0.65 ? 'ice' : 'sky');
  }
  // Fluegel (hinten, weit nach hinten gepfeilt): oberer Deltaflügel und unterer
  s.poly([[cx - 4, cy - 4], [cx - 24, cy - 17], [cx - 19, cy - 3]], (x, y) => (y < cy - 10 ? 'dusk' : 'night'));
  s.line(cx - 4, cy - 4, cx - 24, cy - 17, 'slate'); s.line(cx - 24, cy - 17, cx - 21, cy - 12, 'red');
  s.poly([[cx - 4, cy + 4], [cx - 22, cy + 14], [cx - 18, cy + 3]], (x, y) => (y > cy + 9 ? 'ink' : 'night'));
  s.line(cx - 22, cy + 14, cx - 19, cy + 10, 'red');
  // Rumpf: schlanke Nadel
  s.poly([[cx + 26, cy + 1], [cx + 12, cy - 5], [cx - 8, cy - 6], [cx - 22, cy - 3], [cx - 22, cy + 3], [cx - 10, cy + 6], [cx + 10, cy + 5]], (x, y) => {
    const t = (y - (cy - 6)) / 12;
    return t < 0.18 ? 'slate' : t < 0.42 ? 'dusk' : t < 0.78 ? 'night' : 'ink';
  });
  // Obere Kante heller, Nase
  s.line(cx + 25, cy, cx + 12, cy - 5, 'stone'); s.line(cx + 12, cy - 5, cx - 6, cy - 6, 'slate');
  s.px(cx + 24, cy, 'white'); s.px(cx + 22, cy - 1, 'silver');
  // Cyan-Zierlinien laengs
  s.line(cx - 18, cy + 1, cx + 14, cy + 1, 'sky'); s.line(cx - 14, cy + 1, cx + 8, cy + 1, 'ice');
  s.line(cx - 16, cy + 4, cx + 6, cy + 4, 'navy');
  // Cockpit-/Augenschlitz: rotes Auge
  const eyeCol: PalName = stage >= 2 ? (f & 1 ? 'white' : 'magenta') : 'red';
  s.poly([[cx + 18, cy - 2], [cx + 9, cy - 4], [cx + 9, cy - 1], [cx + 17, cy]], 'ink');
  s.poly([[cx + 17, cy - 2], [cx + 10, cy - 3], [cx + 10, cy - 2], [cx + 16, cy - 1]], eyeCol);
  s.px(cx + 16, cy - 2, 'white');
  // Rueckenflosse (scharf nach hinten)
  s.poly([[cx - 6, cy - 6], [cx - 17, cy - 15], [cx - 13, cy - 6]], (x) => (x < cx - 12 ? 'dusk' : 'night'));
  s.line(cx - 6, cy - 6, cx - 17, cy - 15, 'stone'); s.px(cx - 17, cy - 15, 'red');
  // Seitliche Duesen-Ringe
  s.rect(cx - 23, cy - 3, 3, 7, 'slate'); s.rect(cx - 23, cy - 3, 3, 1, 'stone'); s.rect(cx - 23, cy + 3, 3, 1, 'night');
  s.rect(cx - 22, cy - 1, 1, 3, 'white');
  // Rote Warnstreifen am Rumpf
  s.rect(cx + 2, cy - 5, 2, 3, 'red'); s.rect(cx - 3, cy - 5, 1, 3, 'crimson');
  // Unterseite: kleiner Kiel mit Funken
  s.poly([[cx + 6, cy + 5], [cx - 4, cy + 10], [cx - 8, cy + 6]], 'night'); s.px(cx - 4, cy + 10, 'red');
  // Schaeden
  if (stage >= 1) {
    s.line(cx + 2, cy - 5, cx - 1, cy + 3, 'ink'); s.px(cx, cy - 1, 'red'); s.px(cx - 1, cy + 2, f & 1 ? 'orange' : 'red');
    s.poly([[cx - 13, cy - 11], [cx - 17, cy - 15], [cx - 14, cy - 8]], null); // Flossenspitze weg
    s.px(cx - 15, cy - 11 - (f & 1), 'orange');
    s.px(cx - 4 + (f & 1) * 6, cy - 8 - (f % 3), 'orange');
  }
  if (stage >= 2) {
    s.poly([[cx - 12, cy - 5], [cx - 4, cy - 5], [cx - 5, cy + 3], [cx - 11, cy + 2]], (x, y) => ((x * 3 + y + f) % 4 === 0 ? 'yellow' : (x + y) % 2 === 0 ? 'orange' : 'crimson'));
    s.line(cx - 12, cy - 5, cx - 11, cy + 2, 'ink'); s.line(cx - 4, cy - 5, cx - 5, cy + 3, 'ink');
    flame(s, cx - 8, cy - 5, 6, f, 'red', 'orange', 'yellow');
    flame(s, cx + 4, cy - 5, 4, f + 2, 'orange', 'amber', 'yellow');
    for (let i = 0; i < 4; i++) s.px(cx - 10 - i * 3 - (f & 1), cy - 12 - i * 2, i % 2 ? 'dusk' : 'slate');
  }
}

// ------------------------------------------------------------------ Dusk Dreadnought

export const DREAD_W = 112, DREAD_H = 76, DREAD_AX = 56, DREAD_AY = 73;

/**
 * Dusk Dreadnought 112 x 76: schwarzes Flaggschiff. Panzer-Hallenhuelle, darunter Kanonendeck mit Rohren und Bullaugen,
 * drei Schornsteine mit Qualm, Bugfahne, Laternen. stage 0..3 = Schaeden (Risse / Plattenverlust / Brand / Wrack).
 */
export function drawDreadnought(f: number, stage: number, s: Surface): void {
  const cx = 56;
  const cy = 30 + bobOf(f);
  const rx = 50, ry = 16;
  const ENV: Ramp = ['ink', 'night', 'dusk'];
  // Heckleitwerk
  s.poly([[cx - 36, cy - 4], [cx - 52, cy - 20], [cx - 44, cy - 20], [cx - 28, cy - 11]], (x, y) => (y < cy - 14 ? 'dusk' : 'night'));
  s.poly([[cx - 36, cy + 5], [cx - 51, cy + 18], [cx - 43, cy + 18], [cx - 28, cy + 11]], (x, y) => (y < cy + 11 ? 'night' : 'ink'));
  s.line(cx - 36, cy - 4, cx - 52, cy - 20, 'slate'); s.line(cx - 52, cy - 20, cx - 44, cy - 20, 'crimson');
  // Schornsteine (hinter der Huelle gezeichnet, ragen oben heraus) + Qualm
  const stacks = [-24, -12, 0];
  stacks.forEach((dx, i) => {
    const k = Math.sqrt(1 - (dx / rx) ** 2) * ry;
    const top = cy - k - 9 - (i === 1 ? 2 : 0);
    const broken = stage >= 1 && i === 1;
    s.box(cx + dx - 3, top, 7, 12, ['night', 'slate', 'stone']);
    s.rect(cx + dx - 4, top - 1, 9, 2, 'dusk'); s.rect(cx + dx - 4, top - 1, 9, 1, 'stone');
    s.rect(cx + dx - 3, top + 5, 7, 1, 'crimson');
    s.px(cx + dx - 2, top + 2, 'white');
    if (broken) { s.rect(cx + dx - 4, top - 1, 9, 3, null); s.poly([[cx + dx - 4, top + 2], [cx + dx - 1, top - 1], [cx + dx + 1, top + 2], [cx + dx + 4, top]], 'slate'); }
    // Qualm: nach hinten (links) weggeweht
    const n = stage >= 2 ? 5 : 4;
    for (let q = 0; q < n; q++) {
      const t = (q * 3 + f * 2 + i * 5) % (n * 3);
      const px = cx + dx - 1 - t * 1.6, py = top - 3 - t * 0.9;
      if (px > 2 && py > 1) { const r = 1.2 + t * 0.18; s.ellipse(px, py, r, r * 0.8, t < n ? 'dusk' : t < n * 2 ? 'slate' : 'stone'); }
    }
  });
  // Huelle (Hallenschiff): dunkel, violetter Schimmer
  s.ellipseFn(cx, cy, rx, ry, (x, y, nx, ny) => {
    const l = -nx * 0.35 - ny * 0.85;
    return l > 0.62 ? 'violet' : l > 0.05 ? ENV[2] : l > -0.5 ? ENV[1] : ENV[0];
  });
  // Spanten und Panzerbaender
  for (const dx of [-42, -32, -22, -12, -2, 8, 18, 28, 38]) {
    const k = Math.sqrt(Math.max(0, 1 - (dx / rx) ** 2)) * ry;
    s.line(cx + dx, cy - k + 1, cx + dx - 2, cy + k - 1, 'ink');
    s.line(cx + dx + 1, cy - k + 2, cx + dx - 1, cy - k * 0.2, 'slate');
  }
  // Panzerplatten oben (Streifen), Nieten
  const pl: [number, number][] = [[-40, -26], [-24, -10], [-8, 6], [10, 26], [28, 44]];
  pl.forEach(([a, b], i) => {
    const gone = (stage >= 1 && i === 2) || (stage >= 2 && i === 3) || (stage >= 3 && i === 0);
    s.ellipseFn(cx, cy, rx - 0.5, ry - 0.5, (x, y, nx, ny) => {
      if (x < cx + a || x > cx + b || ny > -0.22 || ny < -0.97) return null;
      if (gone) return (x * 7 + y * 5 + f * 3) % 17 === 0 ? 'magenta' : ny < -0.7 ? 'orchid' : (x + y) % 6 === 0 ? 'violet' : 'plum';
      if (x === cx + a || x === cx + b) return 'ink';
      return ny < -0.66 ? 'stone' : ny < -0.4 ? 'slate' : 'dusk';
    });
    if (!gone) {
      const m = (a + b) / 2, k = Math.sqrt(Math.max(0, 1 - (m / rx) ** 2)) * ry;
      for (const q of [-4, 4]) s.px(cx + m + q, cy - k * 0.6, 'silver');
    }
  });
  // Rote Zierlinie laengs
  s.line(cx - 44, cy + 3, cx + 44, cy + 3, 'crimson');
  // Gesicht vorn: schmale rote Augenschlitze, Fangzaehne (grimmig)
  const ex = cx + 33, ey = cy - 1;
  const eyeCol: PalName = stage >= 2 ? 'yellow' : 'red';
  s.rect(ex - 8, ey - 2, 17, 6, 'ink');
  s.rect(ex - 7, ey - 1, 6, 3, eyeCol); s.rect(ex + 2, ey - 1, 6, 3, eyeCol);
  s.px(ex - 7, ey - 1, 'white'); s.px(ex + 2, ey - 1, 'white');
  if (f === 3) { s.rect(ex - 7, ey - 1, 6, 2, 'ink'); s.rect(ex + 2, ey - 1, 6, 2, 'ink'); }
  s.line(ex - 9, ey - 4, ex - 1, ey - 2, 'ink'); s.line(ex + 9, ey - 4, ex + 1, ey - 2, 'ink');
  s.rect(ex - 8, ey + 5, 17, 2, 'ink');
  for (let i = 0; i < 8; i++) s.px(ex - 7 + i * 2, ey + 5, 'white');
  // Bugspitze: Eisenramme + Mast mit Fahne
  s.poly([[cx + 48, cy - 5], [cx + 57, cy], [cx + 48, cy + 5]], 'stone');
  s.line(cx + 48, cy - 5, cx + 57, cy, 'white'); s.line(cx + 48, cy + 5, cx + 57, cy, 'slate'); s.px(cx + 53, cy, 'silver');
  const mx = cx + 40, mt = cy - ry - 13;
  s.line(mx, cy - ry + 3, mx, mt, 'stone');
  const wv = [0, 1, 0, -1][f & 3];
  s.poly([[mx + 1, mt], [mx + 11, mt + 2 + wv], [mx + 8, mt + 4], [mx + 11, mt + 6 + wv], [mx + 1, mt + 7]], (x, y) => (y < mt + 3 ? 'red' : 'crimson'));
  s.px(mx + 4, mt + 3, 'white'); s.px(mx + 5, mt + 3, 'white'); s.px(mx + 4, mt + 4, 'white'); // Totenkopf-Punkt
  // Kanonendeck (Hallenrumpf unter der Huelle)
  const dy0 = cy + ry - 3;
  const dw = 72, dx0 = cx - dw / 2 + 4;
  // Haengestreben
  for (const q of [-30, -18, -6, 6, 18, 30, 40]) {
    const sx = cx + q, sy = cy + ry * Math.sqrt(Math.max(0, 1 - (q / rx) ** 2)) - 1;
    s.line(sx, sy, sx, dy0, 'stone');
  }
  s.box(dx0, dy0, dw, 14, ['plum', 'bark', 'wood']);
  s.rect(dx0 + 1, dy0 + 1, dw - 2, 2, 'night'); // Eisenband oben
  s.rect(dx0, dy0 + 7, dw, 1, 'plum');
  s.rect(dx0 + 1, dy0 + 12, dw - 2, 1, 'night');
  // Bug des Decks: abgeschraegt
  s.poly([[dx0 + dw, dy0], [dx0 + dw + 6, dy0 + 6], [dx0 + dw, dy0 + 14]], (x, y) => (y < dy0 + 7 ? 'wood' : 'bark'));
  s.line(dx0 + dw, dy0, dx0 + dw + 6, dy0 + 6, 'tan');
  // Bullaugen (leuchtend, wechselnd) und Kanonenluken mit Rohren
  for (let i = 0; i < 9; i++) {
    const x = dx0 + 5 + i * 7;
    const cannon = i % 2 === 0;
    if (cannon) {
      const out = stage >= 2 && i === 4 ? -2 : 0; // ein Rohr haengt
      s.rect(x - 2, dy0 + 8, 6, 4, 'ink');
      s.rect(x - 1, dy0 + 9 + (out < 0 ? 1 : 0), 4, 2, 'slate');
      if (!out) s.rect(x + 3, dy0 + 9, 4, 2, 'stone'); s.px(x + 6, dy0 + 9, 'silver');
      if (f === i % 4 && i !== 4) { s.px(x + 8, dy0 + 9, 'yellow'); s.px(x + 9, dy0 + 10, 'orange'); }
    } else {
      s.ball(x + 1, dy0 + 5, 2, 2, ['amber', 'yellow', 'white']);
      s.ring(x + 1, dy0 + 5, 2.4, 2.4, 'night');
    }
  }
  // Bugkanonen (zwei grosse, nach vorn)
  for (const [oy, k] of [[2, 0], [6, 1]] as [number, number][]) {
    s.rect(dx0 + dw + 3, dy0 + oy, 11, 3, 'slate'); s.rect(dx0 + dw + 3, dy0 + oy, 11, 1, 'stone');
    s.rect(dx0 + dw + 13, dy0 + oy - 1, 2, 5, 'night'); s.px(dx0 + dw + 14, dy0 + oy, 'ink');
    if (f === (k ? 2 : 0)) { s.px(dx0 + dw + 16, dy0 + oy + 1, 'white'); s.px(dx0 + dw + 17, dy0 + oy, 'yellow'); s.px(dx0 + dw + 17, dy0 + oy + 2, 'orange'); }
  }
  // Heckpropeller (zwei grosse) am Deck
  prop(s, dx0 - 5, dy0 + 5, f, 8);
  prop(s, dx0 - 5, dy0 + 11, f + 2, 5);
  s.rect(dx0 - 5, dy0 + 3, 6, 9, 'night'); s.rect(dx0 - 5, dy0 + 3, 6, 1, 'slate');
  prop(s, dx0 - 7, dy0 + 7, f + 1, 8);
  // Laternen: Bugmast, Heck, Deck
  const ly = dy0 + 14;
  [[dx0 + 6, 0], [dx0 + 24, 1], [dx0 + 42, 0], [dx0 + 60, 1]].forEach(([lx, k]) => {
    if (stage >= 3 && k === 1) return;
    s.line(lx, ly - 1, lx, ly + 2, 'stone');
    lantern(s, lx, ly + 3, f, k, true);
  });
  s.rect(dx0 - 1, dy0 + 14, dw + 2, 1, 'plum');
  // Schaeden
  if (stage >= 1) {
    s.line(cx - 8, cy - 8, cx - 3, cy - 1, 'ink'); s.line(cx - 3, cy - 1, cx - 6, cy + 6, 'ink');
    s.px(cx - 7, cy - 6, f & 1 ? 'magenta' : 'orchid'); s.px(cx - 4, cy, 'magenta'); s.px(cx - 5, cy + 4, 'orchid');
    s.line(cx + 14, cy + 4, cx + 20, cy + 9, 'ink'); s.px(cx + 16, cy + 6, 'orchid');
  }
  if (stage >= 2) {
    s.poly([[cx - 40, cy - 1], [cx - 30, cy - 2], [cx - 28, cy + 8], [cx - 39, cy + 7]], (x, y) => ((x * 3 + y + f) % 5 === 0 ? 'yellow' : (x + y) % 3 === 0 ? 'orange' : 'plum'));
    s.line(cx - 40, cy - 1, cx - 39, cy + 7, 'ink'); s.line(cx - 30, cy - 2, cx - 28, cy + 8, 'ink');
    flame(s, cx - 6, cy - ry + 4, 9, f, 'red', 'orange', 'yellow');
    flame(s, cx + 18, cy - ry + 5, 7, f + 2, 'orange', 'amber', 'yellow');
  }
  if (stage >= 3) {
    // Wrack: Huelle aufgerissen, Rippen frei, Deck brennt, Fahne zerfetzt
    s.poly([[cx + 12, cy - ry + 1], [cx + 28, cy - ry + 3], [cx + 25, cy - 2], [cx + 14, cy - 3]], (x, y) => ((x + y + f) % 6 === 0 ? 'magenta' : y < cy - 9 ? 'orchid' : 'plum'));
    for (const q of [14, 19, 24]) s.line(cx + q, cy - ry + 2, cx + q - 1, cy - 3, 'ink');
    flame(s, cx + 20, cy - ry + 3, 9, f + 1, 'red', 'orange', 'yellow');
    flame(s, dx0 + 20, dy0 + 1, 6, f, 'red', 'orange', 'amber');
    flame(s, dx0 + 44, dy0 + 1, 5, f + 2, 'orange', 'amber', 'yellow');
    for (let i = 0; i < 5; i++) s.px(cx - 18 - i * 3 - (f & 1), cy - ry - 12 - i * 2, i % 2 ? 'dusk' : 'slate');
  }
}
