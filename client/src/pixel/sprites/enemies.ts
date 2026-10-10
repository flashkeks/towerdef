/** Gegner-Sprites: Glims in vier Schichten, Ironshell, Emberling, Gloom Brute (Risse 0-2), Dusk Leviathan (Platten 0-3). */
import type { PalName } from '../palette';
import { flame, spark } from './parts';
import { outlineSurface, RAMPS, type Ramp, silhouette, Surface } from './surface';
import { drawCruiser, drawDreadnought, drawDuskrunner, CRUISER_AX, CRUISER_AY, CRUISER_H, CRUISER_W, DREAD_AX, DREAD_AY, DREAD_H, DREAD_W, RUNNER_AX, RUNNER_AY, RUNNER_H, RUNNER_W } from './enemies15e';
import { drawColossus, drawCrystalBrute, drawFortified, drawFrostling, drawGloomship, drawPink, drawRegrow, drawWyrm } from './enemies15';
import type { EnemyType } from './types';

export interface EnemyRaster { rows: string[]; ax: number; ay: number }
/** damageStage: brute 0-2, leviathan 0-3, crystal 0-3, gloomship 0-2, wyrm 0-2 (Phase), colossus 0-4 (Platten), cruiser 0-2, duskrunner 0-2, dreadnought 0-3. regrow/fortified: Merkmale als Ueberlagerung (Runde 15). */
export interface EnemyOpts { damageStage?: number; hitFlash?: boolean; flip?: boolean; regrow?: boolean; fortified?: boolean }

export const SHELL: Record<'red' | 'blue' | 'green' | 'gold', Ramp> = {
  red: ['crimson', 'red', 'coral'],
  blue: ['navy', 'sky', 'ice'],
  green: ['pine', 'grass', 'leaf'],
  gold: ['rust', 'amber', 'yellow'],
};

/** Hauptfarbe der Schicht (fuer Scherben, Zahlen, Icons). */
export function shellRamp(t: EnemyType): Ramp {
  switch (t) {
    case 'red': case 'blue': case 'green': case 'gold': return SHELL[t];
    case 'ironshell': return RAMPS.iron;
    case 'ember': return ['red', 'orange', 'yellow'];
    case 'brute': return RAMPS.cloth;
    case 'leviathan': return RAMPS.steel;
    case 'pink': return ['orchid', 'coral', 'peach'];
    case 'frostling': return ['plum', 'violet', 'ice'];
    case 'crystal': return ['navy', 'sky', 'ice'];
    case 'gloomship': return ['night', 'violet', 'orchid'];
    case 'wyrm': return RAMPS.frost;
    case 'colossus': return ['red', 'orange', 'yellow'];
    case 'cruiser': return ['night', 'violet', 'orchid'];
    case 'duskrunner': return ['ink', 'dusk', 'red'];
    case 'dreadnought': return ['ink', 'dusk', 'crimson'];
  }
}

export const ENEMY_SIZE: Record<EnemyType, { w: number; h: number; ax: number; ay: number }> = {
  red: { w: 24, h: 24, ax: 12, ay: 19 },
  blue: { w: 24, h: 24, ax: 12, ay: 19 },
  green: { w: 24, h: 24, ax: 12, ay: 19 },
  gold: { w: 24, h: 24, ax: 12, ay: 19 },
  ironshell: { w: 26, h: 26, ax: 13, ay: 21 },
  ember: { w: 24, h: 28, ax: 12, ay: 21 },
  brute: { w: 34, h: 34, ax: 17, ay: 28 },
  leviathan: { w: 90, h: 70, ax: 45, ay: 58 },
  pink: { w: 24, h: 24, ax: 12, ay: 19 },
  frostling: { w: 24, h: 24, ax: 12, ay: 20 },
  crystal: { w: 42, h: 40, ax: 21, ay: 35 },
  /** Gloomship schwebt: ay liegt ~8 px unter den Laternen (Bodenpunkt fuer den Schatten). */
  gloomship: { w: 66, h: 64, ax: 33, ay: 62 },
  wyrm: { w: 80, h: 64, ax: 40, ay: 60 },
  colossus: { w: 80, h: 64, ax: 40, ay: 62 },
  /** Runde 15e: alle drei schweben, ay = Bodenpunkt unter dem Schiff (Schatten via fx.shipShadow). */
  cruiser: { w: CRUISER_W, h: CRUISER_H, ax: CRUISER_AX, ay: CRUISER_AY },
  duskrunner: { w: RUNNER_W, h: RUNNER_H, ax: RUNNER_AX, ay: RUNNER_AY },
  dreadnought: { w: DREAD_W, h: DREAD_H, ax: DREAD_AX, ay: DREAD_AY },
};

const WOBBLE = [
  { rx: 0, ry: 0, dy: 0 },
  { rx: -0.6, ry: 0.8, dy: -1 },
  { rx: 0, ry: 0.2, dy: -1 },
  { rx: 0.7, ry: -0.8, dy: 0 },
];

function eyes(s: Surface, cx: number, cy: number, spacing: number, col: PalName = 'ink', hi = true): void {
  for (const sg of [-1, 1]) {
    const x = cx + sg * spacing / 2 - (sg < 0 ? 0.5 : -0.5);
    s.rect(Math.round(x - 0.5), cy, 1, 2, col);
    if (hi) s.px(Math.round(x - 0.5), cy, 'white');
  }
}

function drawGlim(kind: 'red' | 'blue' | 'green' | 'gold', f: number, s: Surface): void {
  const w = WOBBLE[f & 3];
  const R = { red: 5, blue: 5.5, green: 6, gold: 6 }[kind];
  const ramp = SHELL[kind];
  const cx = 12, base = 19;
  const rx = R + w.rx, ry = R - 0.5 + w.ry;
  const cy = base - ry + w.dy;
  // Schlagschatten gehoert nicht ins Sprite
  s.ball(cx, cy, rx, ry, ramp);
  // Kristall-Facetten: helle Flaeche oben links, dunkle unten rechts als schraege Bahnen
  for (let i = 0; i < 3; i++) s.px(cx - rx * 0.5 + i, cy - ry * 0.55 + i * 0.4, ramp[2]);
  if (kind === 'gold') {
    s.line(cx + rx * 0.2, cy - ry * 0.9, cx + rx * 0.9, cy - ry * 0.1, ramp[2]);
  }
  // Kristallspitzen oben
  const spikes = { red: 0, blue: 1, green: 2, gold: 3 }[kind];
  const topy = Math.round(cy - ry);
  if (spikes === 1) { s.rect(cx - 1, topy - 2, 2, 2, ramp[2]); s.px(cx - 1, topy - 3, ramp[2]); s.px(cx, topy - 2, ramp[1]); }
  if (spikes === 2) {
    for (const dx of [-2, 2]) { s.rect(cx + dx - 1, topy - 2, 2, 2, ramp[1]); s.px(cx + dx - 1, topy - 3, ramp[2]); s.px(cx + dx - 1, topy - 2, ramp[2]); }
  }
  if (spikes === 3) {
    for (const [dx, h] of [[-3, 2], [0, 3], [3, 2]]) { s.rect(cx + dx - 1, topy - h, 2, h + 1, ramp[1]); s.px(cx + dx - 1, topy - h, 'white'); s.px(cx + dx, topy - h + 1, ramp[2]); }
    s.rect(cx - 4, topy + 1, 8, 1, ramp[0]);
  }
  // Gesichtsfenster: Daemmerwesen im Kristall
  const fy = Math.round(cy + ry * 0.05);
  const fw = Math.round(rx * 1.1);
  s.rect(cx - Math.floor(fw / 2), fy, fw, Math.max(3, Math.round(ry * 0.55)), 'night');
  s.px(cx - Math.floor(fw / 2), fy, ramp[0]); s.px(cx + Math.ceil(fw / 2) - 1, fy, ramp[0]);
  eyes(s, cx, fy + 1, 3, 'white', false);
  if (kind === 'gold' && f % 2 === 0) { s.px(cx + rx - 0.5, cy - ry + 1, 'white'); }
  // Kleine Fuesse
  const step = f & 1;
  s.rect(cx - 3, base, 2, 1, ramp[0]); s.rect(cx + 2, base, 2, 1, ramp[0]);
  if (step) s.px(cx - 3, base - 1, ramp[0]);
}

function drawIronshell(f: number, s: Surface): void {
  const w = WOBBLE[f & 3];
  const cx = 13, base = 21;
  const rx = 6.8 + w.rx * 0.5, ry = 5.6 + w.ry * 0.5;
  const cy = base - ry + w.dy * 0.5;
  s.ball(cx, cy, rx, ry, RAMPS.iron);
  // Panzerplatten: drei Baender
  s.ellipseFn(cx, cy, rx, ry, (x, y, nx, ny) => {
    if (ny > -0.55 && ny < -0.35) return 'slate';
    if (ny > 0.05 && ny < 0.25) return 'dusk';
    return null;
  });
  s.line(cx, cy - ry, cx, cy - ry * 0.4, 'night');
  s.rect(cx - 3, Math.round(cy - ry * 0.75), 3, 1, 'silver');
  for (const [dx, dy] of [[-4, -3], [3, -3], [-5, 1], [4, 1], [-2, 3], [2, 3]]) s.px(cx + dx, cy + dy, 'silver');
  // Gesicht
  const fy = Math.round(cy + 1);
  s.rect(cx - 3, fy, 7, 3, 'ink');
  eyes(s, cx, fy, 3, 'yellow', false);
  s.px(cx - 2, fy, 'amber'); s.px(cx + 1, fy, 'amber');
  // Kaeferbeine
  const step = f & 1;
  for (const dx of [-5, -2, 2, 5]) s.px(cx + dx, base + ((dx > 0) === !!step ? 0 : 0), 'night');
  s.rect(cx - 5, base, 2, 1, 'night'); s.rect(cx + 4, base, 2, 1, 'night');
  if (step) { s.px(cx - 2, base, 'night'); s.px(cx + 2, base, 'night'); }
}

function drawEmber(f: number, s: Surface): void {
  const cx = 12, base = 21;
  const bob = [0, -1, 0, -1][f & 3];
  const cy = base - 6 + bob;
  // Zungen oben
  const tongues = [[-3, 6, 0], [0, 9, 1], [3, 6, 2]];
  for (const [dx, h, k] of tongues) {
    const sway = [[0, 1, 0, -1], [1, 0, -1, 0], [0, -1, 0, 1]][k][f & 3];
    for (let i = 0; i < h; i++) {
      const wd = i < h * 0.5 ? 2 : 1;
      s.rect(cx + dx - wd + Math.round(sway * (i / h)), cy - 2 - i, wd * 2 + 1 - (i > h * 0.7 ? 1 : 0), 1, i < h * 0.4 ? 'orange' : i < h * 0.8 ? 'orange' : 'amber');
    }
  }
  // Koerper
  s.ellipseFn(cx, cy + 1, 6, 5.5, (x, y, nx, ny) => (nx * nx + ny * ny > 0.62 ? 'red' : (-nx * 0.5 - ny * 0.6) > 0.25 ? 'yellow' : 'amber'));
  s.ellipseFn(cx, cy + 2, 4.2, 3.6, (x, y, nx, ny) => ((-nx * 0.5 - ny * 0.6) > 0.1 ? 'yellow' : 'amber'));
  // Gesicht
  eyes(s, cx, cy, 5, 'ink', false);
  s.px(cx - 3, cy, 'white'); s.px(cx + 2, cy, 'white');
  s.rect(cx - 1, cy + 3, 2, 1, 'rust');
  // Funken
  const k = f & 3;
  s.px(cx + 7, cy - 4 - k, 'amber'); s.px(cx - 7, cy - 6 + (k >> 1), 'orange'); s.px(cx + 5 - k, cy - 9 - k, 'yellow');
  // Fuesschen aus Glut
  s.px(cx - 3, base, 'red'); s.px(cx + 3, base, 'red'); s.px(cx - 2, base - 1, 'orange'); s.px(cx + 2, base - 1, 'orange');
}

function drawBrute(f: number, stage: number, s: Surface): void {
  const cx = 17, base = 28;
  const step = f & 1;
  const sway = [0, 1, 0, -1][f & 3];
  const bob = step ? 0 : -1;
  const cy = base - 10 + bob;
  const R = RAMPS.cloth; // dusk/slate/stone
  // Beine
  s.rect(cx - 6, base - 3, 4, 3, 'night'); s.rect(cx + 2, base - 3, 4, 3, 'night');
  s.rect(cx - 6 + (step ? 1 : 0), base - 1, 5, 2, 'dusk'); s.rect(cx + 2 - (step ? 1 : 0), base - 1, 5, 2, 'dusk');
  s.px(cx - 6, base - 3, 'slate'); s.px(cx + 2, base - 3, 'slate');
  // Arme (Faeuste)
  s.ball(cx - 10, cy + 3 + (step ? 1 : 0), 3, 4, R);
  s.ball(cx + 10, cy + 3 + (step ? 0 : 1), 3, 4, R);
  // Rumpf: Felsbrocken (unregelmaessig)
  s.ellipseFn(cx, cy, 9.2, 8.4, (x, y, nx, ny) => {
    const l = -nx * 0.55 - ny * 0.7;
    const bumpy = ((x * 7 + y * 13) % 5 === 0) ? 0.12 : 0;
    const v = l + bumpy;
    return v > 0.5 ? R[2] : v > -0.2 ? R[1] : R[0];
  });
  // Felsplatten-Kanten
  s.line(cx - 5, cy - 7, cx - 1, cy - 4, 'dusk'); s.line(cx + 3, cy - 6, cx + 7, cy - 3, 'dusk');
  s.px(cx - 4, cy - 6, 'silver'); s.px(cx + 4, cy - 5, 'stone');
  // Daemmerlicht in den Rissen
  const glow: PalName = f % 2 ? 'orchid' : 'violet';
  if (stage === 0) {
    s.px(cx - 6, cy + 2, 'violet'); s.px(cx + 6, cy - 1, 'violet'); s.px(cx - 5, cy + 3, 'night');
  }
  if (stage >= 1) {
    s.line(cx - 7, cy - 3, cx - 4, cy + 1, 'night'); s.line(cx - 4, cy + 1, cx - 5, cy + 5, 'night');
    s.px(cx - 6, cy - 1, glow); s.px(cx - 4, cy + 2, glow); s.px(cx - 5, cy + 4, 'orchid');
    s.line(cx + 6, cy - 5, cx + 4, cy - 1, 'night'); s.px(cx + 5, cy - 3, glow);
  }
  if (stage >= 2) {
    s.line(cx - 1, cy - 8, cx + 1, cy - 4, 'night'); s.line(cx + 1, cy - 4, cx - 1, cy, 'night'); s.line(cx - 1, cy, cx + 2, cy + 3, 'night');
    s.px(cx, cy - 6, 'magenta'); s.px(cx, cy - 2, glow); s.px(cx + 1, cy + 2, 'magenta');
    s.line(cx + 4, cy + 4, cx + 8, cy + 2, 'night'); s.px(cx + 6, cy + 3, glow);
    // abgebrochene Ecke mit Leuchten
    s.rect(cx + 5, cy - 7, 3, 2, 'violet'); s.px(cx + 6, cy - 7, 'orchid');
    for (let i = 0; i < 3; i++) s.px(cx - 8 + i * 8 + sway, cy - 10 - ((f + i) % 3), 'orchid');
  }
  // Gesicht: tiefe Augenhoehlen mit Daemmerlicht
  const fy = cy - 1;
  s.rect(cx - 5, fy, 4, 3, 'ink'); s.rect(cx + 1, fy, 4, 3, 'ink');
  s.rect(cx - 4, fy + 1, 2, 2, stage >= 1 ? 'magenta' : 'orchid'); s.rect(cx + 2, fy + 1, 2, 2, stage >= 1 ? 'magenta' : 'orchid');
  s.px(cx - 4, fy + 1, 'white'); s.px(cx + 2, fy + 1, 'white');
  s.rect(cx - 3, fy + 5, 6, 1, 'ink'); s.px(cx - 2, fy + 5, 'stone'); s.px(cx, fy + 5, 'stone'); s.px(cx + 2, fy + 5, 'stone');
  // Staub/Daemmerlicht-Flimmern je Frame, Fäuste schwingen
  s.px(cx - 8 + sway, cy + 7, 'violet'); s.px(cx + 8 - sway, cy + 6, 'orchid');
  if (f === 0) s.px(cx - 3, cy + 4, 'dusk'); if (f === 2) s.px(cx + 4, cy + 3, 'slate');
  s.rect(cx - 6, fy - 2, 5, 1, 'night'); s.rect(cx + 1, fy - 2, 5, 1, 'night');
}

/** Dusk Leviathan: schwebender, gepanzerter Kugelfisch. `fallen` = abgefallene Platten 0..3. */
function drawLeviathan(f: number, fallen: number, s: Surface): void {
  const cx = 45, base = 58;
  const bob = [0, -1, -2, -1][f & 3];
  const cy = base - 26 + bob;
  const fin = [0, 1, 2, 1][f & 3];
  // Schwanzflosse
  s.poly([[cx - 22, cy + 2], [cx - 38, cy - 8 + fin * 2], [cx - 33, cy + 4], [cx - 38, cy + 14 - fin * 2]], (x, y) => (y < cy + 3 ? 'violet' : 'plum'));
  s.line(cx - 22, cy + 3, cx - 36, cy - 6 + fin * 2, 'orchid'); s.line(cx - 22, cy + 5, cx - 36, cy + 12 - fin * 2, 'violet');
  // Koerper
  s.ellipseFn(cx, cy, 27, 18, (x, y, nx, ny) => {
    const l = -nx * 0.5 - ny * 0.75;
    return l > 0.52 ? 'slate' : l > -0.2 ? 'dusk' : l > -0.62 ? 'night' : 'ink';
  });
  // Bauch (helle Seite unten)
  s.ellipseFn(cx + 3, cy + 9, 19, 7, (x, y, nx, ny) => (ny > -0.2 ? (nx < -0.3 ? 'orchid' : 'violet') : null));
  // Stacheln
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + 0.25 + (i / 6) * (Math.PI * 1.1) - 0.2;
    const x0 = cx + Math.cos(a) * 25, y0 = cy + Math.sin(a) * 16;
    s.line(x0, y0, cx + Math.cos(a) * 31, cy + Math.sin(a) * 21, 'stone', 2);
    s.px(cx + Math.cos(a) * 32, cy + Math.sin(a) * 22, 'silver');
  }
  // Seitenflosse
  s.poly([[cx - 3, cy + 6], [cx - 14, cy + 12 + fin], [cx - 8, cy + 16 + fin], [cx + 2, cy + 11]], (x) => (x < cx - 8 ? 'orchid' : 'violet'));
  // Platten (3): oben hinten, oben vorn, Flanke
  const plates: { pts: [number, number][]; rivets: [number, number][] }[] = [
    { pts: [[cx - 19, cy - 8], [cx - 6, cy - 17], [cx + 2, cy - 11], [cx - 9, cy - 1], [cx - 18, cy + 1]], rivets: [[cx - 15, cy - 6], [cx - 8, cy - 12], [cx - 10, cy - 4]] },
    { pts: [[cx + 3, cy - 17], [cx + 17, cy - 12], [cx + 20, cy - 3], [cx + 9, cy - 3], [cx + 3, cy - 10]], rivets: [[cx + 8, cy - 12], [cx + 15, cy - 8], [cx + 11, cy - 5]] },
    { pts: [[cx - 17, cy + 2], [cx - 7, cy + 1], [cx - 1, cy + 10], [cx - 11, cy + 14], [cx - 19, cy + 9]], rivets: [[cx - 14, cy + 5], [cx - 8, cy + 6], [cx - 11, cy + 10]] },
  ];
  // freiliegende Stellen (Platte gefallen): glimmendes Dämmerfleisch
  plates.forEach((pl, i) => {
    const gone = i < fallen;
    if (gone) {
      s.poly(pl.pts, (x, y) => ((x * 3 + y * 5 + f) % 13 === 0 ? 'magenta' : y < pl.pts[0][1] + 5 ? 'orchid' : 'violet'));
      s.line(pl.pts[0][0], pl.pts[0][1], pl.pts[2][0], pl.pts[2][1], 'plum');
      for (const r of pl.rivets) s.px(r[0], r[1], 'ink');
    } else {
      s.poly(pl.pts, (x, y) => ((x < cx - 6 + (i === 1 ? 12 : 0) && y < cy - 4) ? 'silver' : (x + y) % 9 === 0 ? 'stone' : 'stone'));
      // Kantenlicht + Schatten
      const n = pl.pts.length;
      for (let k = 0; k < n; k++) {
        const a = pl.pts[k], b = pl.pts[(k + 1) % n];
        s.line(a[0], a[1], b[0], b[1], k < 2 ? 'white' : 'slate');
      }
      s.poly([pl.pts[1], pl.pts[2], [pl.pts[2][0] - 3, pl.pts[2][1] + 3]], 'slate');
      for (const r of pl.rivets) { s.px(r[0], r[1], 'white'); s.px(r[0] + 1, r[1] + 1, 'slate'); }
    }
  });
  // Maul mit Zaehnen
  const mx = cx + 20, my = cy + 6;
  s.rect(mx - 4, my - 1, 11, 4, 'ink');
  for (let i = 0; i < 5; i++) { s.px(mx - 3 + i * 2, my - 1, 'white'); s.px(mx - 2 + i * 2, my + 2, 'white'); }
  // Auge
  const ex = cx + 15, ey = cy - 4;
  s.ball(ex, ey, 5, 5, ['silver', 'white', 'white']);
  s.rect(ex - 1, ey - 1, 4, 4, fallen >= 2 ? 'magenta' : 'yellow');
  s.rect(ex, ey, 2, 2, 'ink');
  s.px(ex - 1, ey - 1, 'white');
  s.line(ex - 5, ey - 5, ex + 4, ey - 3, 'ink', 1);
  // Laternen-Koeder an der Stirn
  const lw = [0, 1, 2, 1][f & 3] - 1;
  s.curve(cx + 14, cy - 15, cx + 20, cy - 28, cx + 30 + lw * 2, cy - 18, 'stone');
  s.curve(cx + 14, cy - 16, cx + 20, cy - 29, cx + 30 + lw * 2, cy - 19, 'silver');
  const lx = cx + 31 + lw * 2, ly = cy - 15;
  s.ball(lx, ly, 3.4, 3.4, ['amber', 'yellow', 'white']);
  s.px(lx, ly, 'white');
  s.rect(lx - 2, ly - 4, 5, 1, 'rust'); s.rect(lx - 2, ly + 3, 5, 1, 'rust');
  spark(s, lx + 5, ly - 4 + (f & 1), 'yellow'); spark(s, lx - 5, ly - 2 - (f & 1), 'amber');
  // Daemmer-Schweif hinter dem Schwanz
  for (let i = 0; i < 3; i++) s.px(cx - 36 - ((f * 3 + i * 4) % 10), cy + 6 + i * 3 - (f % 2), i % 2 ? 'orchid' : 'violet');
  // Platten-Aufgaenge als Funken auf freiem Fleisch
  if (fallen >= 1) { s.px(cx - 12, cy - 12 - (f & 1), 'magenta'); s.px(cx + 2, cy - 18 + (f & 1), 'orchid'); }
}

export function enemyRaster(type: EnemyType, frame: number, o: EnemyOpts = {}): EnemyRaster {
  const sz = ENEMY_SIZE[type];
  const s = new Surface(sz.w, sz.h);
  const f = ((frame % 4) + 4) % 4;
  switch (type) {
    case 'red': case 'blue': case 'green': case 'gold': drawGlim(type, f, s); break;
    case 'ironshell': drawIronshell(f, s); break;
    case 'ember': drawEmber(f, s); break;
    case 'brute': drawBrute(f, Math.min(2, Math.max(0, o.damageStage ?? 0)), s); break;
    case 'leviathan': drawLeviathan(f, Math.min(3, Math.max(0, o.damageStage ?? 0)), s); break;
    case 'pink': drawPink(f, s); break;
    case 'frostling': drawFrostling(f, s); break;
    case 'crystal': drawCrystalBrute(f, Math.min(3, Math.max(0, o.damageStage ?? 0)), s); break;
    case 'gloomship': drawGloomship(f, Math.min(2, Math.max(0, o.damageStage ?? 0)), s); break;
    case 'wyrm': drawWyrm(f, Math.min(2, Math.max(0, o.damageStage ?? 0)), s); break;
    case 'colossus': drawColossus(f, Math.min(4, Math.max(0, o.damageStage ?? 0)), s); break;
    case 'cruiser': drawCruiser(f, Math.min(2, Math.max(0, o.damageStage ?? 0)), s); break;
    case 'duskrunner': drawDuskrunner(f, Math.min(2, Math.max(0, o.damageStage ?? 0)), s); break;
    case 'dreadnought': drawDreadnought(f, Math.min(3, Math.max(0, o.damageStage ?? 0)), s); break;
  }
  if (o.fortified) drawFortified(s, type, f);
  if (o.regrow) drawRegrow(s, type, f);
  const diag = type === 'leviathan' || type === 'gloomship' || type === 'wyrm' || type === 'colossus' || type === 'cruiser' || type === 'duskrunner' || type === 'dreadnought';
  let out = outlineSurface(s, 'ink', diag);
  if (o.hitFlash) out = silhouette(out, 'white');
  if (o.flip) out = out.flipX();
  return { rows: out.toRows(), ax: o.flip ? sz.w - 1 - sz.ax : sz.ax, ay: sz.ay };
}
void flame;
