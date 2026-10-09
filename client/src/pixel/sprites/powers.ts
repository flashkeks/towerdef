/**
 * Powers (Runde 12): 16 x 16-Icons fuer alle Verbrauchs-Items, das Embers-Symbol (Glutstueck), die Haendler-Figur,
 * Fallen auf dem Weg (Krahenfuesse, Eiskristall) und die Effekt-Bausteine (Muenzregen, Herz, Zeitblase).
 * Nur Palette (ENDESGA 32), Zeichenbefehle der `Surface` wie bei den Upgrade-Icons, Licht von oben links.
 * Reine Funktionen auf Rastern (in Node testbar); die Leinwand baut `index.ts`.
 */
import type { PalName } from '../palette';
import { crystal, flame, spark } from './parts';
import { RAMPS, Surface, outlineSurface, type Ramp } from './surface';

export const POWER_ICON = 16;
export type PowerIconId = 'goldDrop' | 'lanternBomb' | 'caltrops' | 'frostTrap' | 'timeWarp' | 'lanternOil' | 'extraLives' | 'heroBoost' | 'instaWarden';
export const POWER_ICON_IDS: readonly PowerIconId[] = ['goldDrop', 'lanternBomb', 'caltrops', 'frostTrap', 'timeWarp', 'lanternOil', 'extraLives', 'heroBoost', 'instaWarden'];
/** Rahmenfarbe je Power */
export const POWER_COLOR: Record<PowerIconId, PalName> = {
  goldDrop: 'amber', lanternBomb: 'orange', caltrops: 'stone', frostTrap: 'ice', timeWarp: 'orchid', lanternOil: 'yellow', extraLives: 'red', heroBoost: 'leaf', instaWarden: 'sky',
};

type Draw = (s: Surface) => void;

const DRAW: Record<PowerIconId, Draw> = {
  goldDrop: (s) => {
    // drei fallende Muenzen mit Fallstrichen und Glanz
    s.line(4, 0, 4, 1, 'amber'); s.line(12, 0, 12, 2, 'amber'); s.line(7, 5, 7, 6, 'yellow');
    s.ball(4, 4, 2.4, 2.4, RAMPS.gold, true); s.px(4, 4, 'orange');
    s.ball(12, 5, 2.4, 2.4, RAMPS.gold, true); s.px(12, 5, 'orange');
    s.ball(8, 11, 3.4, 3.4, RAMPS.gold, true); s.rect(7, 10, 2, 3, 'amber'); s.px(7, 10, 'orange');
    s.rect(1, 14, 14, 1, 'rust'); s.px(2, 13, 'yellow'); s.px(14, 13, 'amber');
  },
  lanternBomb: (s) => {
    s.ring(8, 2.5, 2, 1.6, 'stone');
    s.rect(5, 3, 6, 2, 'rust'); s.rect(5, 3, 6, 1, 'clay');
    s.box(4, 5, 8, 7, RAMPS.brass);
    s.rect(5, 6, 6, 5, 'orange'); s.rect(6, 7, 4, 3, 'yellow'); s.rect(7, 8, 2, 1, 'white');
    s.rect(5, 12, 6, 2, 'rust'); s.rect(5, 12, 6, 1, 'clay');
    // Lunte mit Funke
    s.line(12, 4, 14, 2, 'tan'); spark(s, 14, 1, 'yellow'); s.px(15, 2, 'orange');
  },
  caltrops: (s) => {
    const jack = (cx: number, cy: number, r: number): void => {
      s.line(cx - r, cy + r, cx + r, cy - r, 'silver', 2); s.line(cx - r, cy - r, cx + r, cy + r, 'stone', 2);
      s.line(cx, cy - r - 1, cx, cy + r, 'white');
      s.px(cx - r, cy - r, 'white'); s.px(cx + r, cy - r, 'white'); s.px(cx, cy - r - 1, 'white');
      s.rect(cx - 1, cy - 1, 2, 2, 'slate');
    };
    jack(4, 10, 3); jack(11, 11, 3); jack(8, 5, 3);
    s.rect(1, 14, 14, 1, 'wood');
  },
  frostTrap: (s) => {
    s.ellipse(8, 12.5, 7, 2.5, 'sky'); s.ellipse(8, 12, 6, 2, 'ice'); s.ellipse(7, 11.5, 3, 1, 'white');
    crystal(s, 8, 6, 9, RAMPS.frost, 2);
    crystal(s, 3.5, 9, 5, RAMPS.ice, 1); crystal(s, 12.5, 9, 5, RAMPS.ice, 1);
    spark(s, 13, 2, 'white'); spark(s, 3, 3, 'ice');
  },
  timeWarp: (s) => {
    // Sanduhr in einer Zeitblase
    s.ring(8, 7.5, 7, 6.8, 'orchid'); s.ring(8, 7.5, 6.2, 6, 'violet');
    s.rect(4, 2, 8, 1, 'wood'); s.rect(4, 13, 8, 1, 'wood'); s.rect(4, 2, 8, 1, 'tan'); s.rect(4, 13, 8, 1, 'bark');
    s.poly([[5, 3], [11, 3], [8.5, 7.5]], 'ice'); s.poly([[8.5, 7.5], [5, 13], [11, 13]], 'ice');
    s.poly([[6, 10.5], [11, 10.5], [11, 13], [5, 13]], 'yellow'); s.rect(8, 6, 1, 3, 'amber');
    s.px(6, 4, 'white'); s.px(6, 5, 'white');
  },
  lanternOil: (s) => {
    s.rect(7, 2, 2, 1, 'wood'); s.rect(6, 1, 4, 1, 'tan');
    s.rect(7, 3, 2, 3, 'silver'); s.px(7, 3, 'white');
    s.ball(8, 10.5, 5, 4.5, RAMPS.gold, false);
    s.rect(5, 9, 6, 3, 'orange'); s.rect(5, 9, 6, 1, 'yellow');
    s.px(5, 8, 'white'); s.px(6, 7, 'white');
    flame(s, 8, 4, 3, 0, 'orange', 'amber', 'yellow');
    s.rect(1, 14, 14, 1, 'rust');
  },
  extraLives: (s) => {
    s.ball(5.2, 5.5, 3.6, 3.6, RAMPS.red); s.ball(10.8, 5.5, 3.6, 3.6, RAMPS.red);
    s.poly([[1.6, 6.5], [14.4, 6.5], [8, 14.5]], (x, y) => (x < 6 - (y - 6.5) * 0.15 ? 'red' : x > 10 ? 'crimson' : 'red'));
    s.px(4, 4, 'white'); s.px(5, 4, 'coral'); s.px(3, 5, 'coral');
    s.rect(11, 9, 4, 1, 'white'); s.rect(12, 8, 2, 3, 'white'); // Plus
    s.rect(12, 9, 2, 1, 'yellow');
  },
  heroBoost: (s) => {
    // dicker Aufstiegspfeil mit Stern: Wren steigt auf
    s.poly([[8, 2.5], [14, 8.5], [10.5, 8.5], [10.5, 14], [5.5, 14], [5.5, 8.5], [2, 8.5]], (x, y) => (x < 7 ? 'leaf' : x > 10 ? 'pine' : y < 6 ? 'leaf' : 'grass'));
    s.line(8, 3, 3, 8, 'white'); s.rect(6, 9, 1, 4, 'leaf'); s.px(6, 9, 'white');
    spark(s, 13, 2, 'yellow'); spark(s, 3, 3, 'yellow'); s.px(13, 2, 'white');
  },
  instaWarden: (s) => {
    // Turm mit Zinnen, Fahne und Tor
    s.box(4, 6, 8, 9, RAMPS.stone);
    for (const x of [3, 6, 9, 12]) s.box(x - 0, 4, 2, 3, RAMPS.stone);
    s.rect(3, 6, 10, 1, 'stone');
    s.rect(7, 11, 2, 4, 'bark'); s.rect(7, 10, 2, 1, 'wood'); s.px(8, 10, 'bark');
    s.rect(7, 8, 2, 1, 'ink');
    s.line(8, 4, 8, 0, 'wood'); s.poly([[9, 0], [14, 1.5], [9, 3]], 'yellow'); s.px(9, 1, 'white');
    s.px(5, 8, 'silver'); s.px(5, 9, 'silver');
  },
};

/** Icon-Raster (16 x 16): Tafel in Pfad-/Power-Farbe, Zeichnung darauf. */
export function powerIconRaster(id: PowerIconId): { rows: string[]; ax: number; ay: number } {
  const s = new Surface(POWER_ICON, POWER_ICON);
  const col = POWER_COLOR[id];
  s.rect(0, 0, 16, 16, 'night'); s.rect(0, 0, 16, 1, col); s.rect(0, 0, 1, 16, col); s.rect(0, 15, 16, 1, 'ink'); s.rect(15, 0, 1, 16, 'ink');
  for (const [x, y] of [[0, 0], [15, 0], [0, 15], [15, 15]]) s.px(x, y, null);
  const d = new Surface(16, 16);
  DRAW[id](d);
  s.blit(d);
  return { rows: s.toRows(), ax: 0, ay: 0 };
}

// ---------------------------------------------------------------- Embers (Glutstueck)

/** Glutstueck (Embers): glimmender Kohlebrocken, oben gelb-orange gluehend, unten dunkel mit Rissen, Funken ringsum. 16 x 16, ohne Tafel. */
export function emberRaster(frame = 0): { rows: string[]; ax: number; ay: number } {
  const s = new Surface(16, 16);
  const body: [number, number][] = [[2, 9], [4, 5], [8, 3], [12, 5], [14, 9], [12, 13], [7, 14], [3, 13]];
  s.poly(body, (x, y) => (y < 7 ? 'yellow' : y < 9 ? 'amber' : y < 11 ? 'orange' : y < 13 ? 'red' : 'crimson'));
  // dunkle Kruste mit Rissen (Glut scheint durch)
  for (const [x, y] of [[3, 8], [4, 7], [5, 6], [9, 6], [10, 7], [11, 9], [12, 8], [6, 9], [7, 10], [9, 10], [5, 11], [8, 12], [10, 12], [11, 11], [7, 7], [8, 8], [4, 10], [3, 11], [12, 11]] as [number, number][]) s.px(x, y, y < 8 ? 'bark' : 'plum');
  s.line(5, 6, 6, 8, 'plum'); s.line(10, 6, 9, 8, 'bark');
  s.px(7, 5, 'white'); s.px(8, 4, 'white'); s.px(6, 5, 'yellow');
  // Funken
  const sp: [number, number][] = frame % 2 ? [[2, 3], [13, 2], [14, 6]] : [[3, 2], [12, 3], [1, 6]];
  for (const [x, y] of sp) s.px(x, y, 'yellow');
  s.px(frame % 2 ? 8 : 9, 1, 'orange');
  const o = outlineSurface(s);
  return { rows: o.toRows(), ax: 0, ay: 0 };
}

// ---------------------------------------------------------------- Haendler

/** Haendler-Figur: Kapuzenumhang, leuchtende Augen, Laterne in der Hand, Rucksack. 40 x 44, Anker Fuss unten Mitte. */
export function merchantRaster(frame = 0): { rows: string[]; ax: number; ay: number } {
  const W = 40, H = 44;
  const s = new Surface(W, H);
  const bob = frame % 2;
  // Rucksack hinter der Figur
  s.box(4, 17 + bob, 11, 18, RAMPS.wood);
  s.rect(5, 19 + bob, 9, 2, 'rust'); s.rect(6, 23 + bob, 7, 5, 'bark'); s.rect(6, 23 + bob, 7, 1, 'tan');
  s.ellipse(9.5, 15 + bob, 5, 3, 'sand'); s.ellipse(9.5, 15 + bob, 5, 1.2, 'white'); // Schlafrolle
  s.ball(6, 33 + bob, 2.5, 2.5, RAMPS.iron); // Topf
  s.line(12, 20 + bob, 17, 22 + bob, 'tan');
  // Umhang
  s.poly([[15, 14 + bob], [27, 14 + bob], [32, 42], [10, 42]], (x, y) => (x < 17 + (y - 14) * -0.3 ? 'violet' : x > 25 + (y - 14) * 0.15 ? 'night' : 'plum'));
  s.rect(10, 41, 22, 2, 'night');
  s.line(13, 18 + bob, 11, 40, 'violet'); // Licht links
  // Guertel und Beutel
  s.rect(14, 29, 15, 2, 'bark'); s.rect(20, 29, 3, 2, 'amber');
  s.ball(27, 33, 2.4, 3, RAMPS.wood); s.px(27, 30, 'tan');
  // Kapuze
  s.ball(21, 11 + bob, 7.5, 8.5, RAMPS.plum);
  s.ellipse(21.5, 13 + bob, 4.6, 4.6, 'ink');
  s.px(19, 13 + bob, 'amber'); s.px(24, 13 + bob, 'amber'); s.px(19, 12 + bob, 'yellow'); s.px(24, 12 + bob, 'yellow');
  s.rect(20, 17 + bob, 3, 1, 'sand'); // Bart-Andeutung
  s.line(15, 5 + bob, 18, 2 + bob, 'orchid');
  // Arm mit Laterne
  s.line(27, 19 + bob, 31, 25, 'plum', 2);
  s.ball(31, 26, 2, 2, RAMPS.skin);
  s.line(31, 22, 31, 24, 'stone');
  s.box(29, 27, 5, 7, RAMPS.brass); s.rect(30, 28, 3, 5, 'yellow'); s.px(31, 30, 'white');
  s.rect(29, 26, 5, 1, 'rust');
  // Fuesse
  s.rect(14, 42, 5, 2, 'bark'); s.rect(22, 42, 5, 2, 'bark');
  const o = outlineSurface(s);
  return { rows: o.toRows(), ax: 20, ay: H - 1 };
}

// ---------------------------------------------------------------- Fallen auf dem Weg

export const TRAP_W = 26, TRAP_H = 14;
const CAL_SLOTS: [number, number][] = [[6, 9], [13, 6], [20, 9], [9, 4], [17, 11], [13, 11]];
const FROST_SLOTS: [number, number, number][] = [[13, 9, 6], [7, 9, 4], [19, 9, 4], [4, 11, 3], [22, 11, 3]];

/** Falle in Weltgroesse. `pieces` = sichtbare Zacken/Kristalle (nimmt mit den Ladungen ab), `frame` 0/1 laesst Eis blinken. Anker = Mitte. */
export function trapRaster(kind: 'caltrops' | 'frostTrap', pieces: number, frame = 0): { rows: string[]; ax: number; ay: number } {
  const s = new Surface(TRAP_W, TRAP_H);
  if (kind === 'caltrops') {
    // Staub unter dem Haufen
    s.ellipse(13, 10, 11, 3, 'tan'); s.ellipse(12, 9.5, 9, 2, 'clay');
    CAL_SLOTS.slice(0, Math.max(0, Math.min(CAL_SLOTS.length, pieces))).forEach(([cx, cy], i) => {
      const r = 2;
      s.line(cx - r, cy + r - 1, cx + r, cy - r, 'stone'); s.line(cx - r, cy - r, cx + r, cy + r - 1, 'silver');
      s.line(cx, cy - r - 1, cx, cy + r - 1, 'slate');
      s.px(cx - r, cy - r, 'white'); s.px(cx + r, cy - r, 'white'); s.px(cx, cy - r - 1, i % 2 ? 'white' : 'silver');
    });
  } else {
    s.ellipse(13, 10, 11, 3, 'sky'); s.ellipse(13, 9.5, 10, 2.3, 'ice');
    for (let x = 4; x < 23; x += 3) s.px(x + (frame ? 1 : 0), 9, 'white');
    FROST_SLOTS.slice(0, Math.max(0, Math.min(FROST_SLOTS.length, pieces))).forEach(([cx, cy, h]) => {
      crystal(s, cx, cy - h / 2, h, RAMPS.frost, h > 4 ? 2 : 1);
    });
    if (pieces > 0) { s.px(13, 2, frame ? 'white' : 'ice'); }
  }
  const o = outlineSurface(s);
  return { rows: o.toRows(), ax: Math.floor(TRAP_W / 2), ay: 9 };
}

// ---------------------------------------------------------------- Effekt-Bausteine

/** Muenze beim Goldregen: 4 Drehbilder, 5 x 6. Anker Mitte. */
export function coinRaster(frame: number): { rows: string[]; ax: number; ay: number } {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  const s = new Surface(7, 8);
  const rx = [2.5, 1.7, 0.8, 1.7][f];
  s.ellipse(3.5, 4, rx + 0.4, 3, 'ink');
  s.ball(3.5, 4, rx, 2.5, RAMPS.gold);
  if (f === 0) s.px(3, 3, 'white');
  return { rows: s.toRows(), ax: 3, ay: 4 };
}

/** Grosses Herz (9 x 8) fuer +25 Leben. */
export function bigHeartRaster(): { rows: string[]; ax: number; ay: number } {
  const s = new Surface(11, 10);
  s.ball(3.6, 3.6, 3, 3, RAMPS.red); s.ball(7.4, 3.6, 3, 3, RAMPS.red);
  s.poly([[0.8, 4.2], [10.2, 4.2], [5.5, 9.4]], 'red'); s.px(3, 2, 'white'); s.px(3, 3, 'coral'); s.px(8, 6, 'crimson'); s.px(7, 7, 'crimson');
  const o = outlineSurface(s);
  return { rows: o.toRows(), ax: 5, ay: 5 };
}

/** Zeitblase: gepunkteter Ring (Bayer-artig) mit zwei wandernden Glanzpunkten, Radius r, 4 Bilder. Anker Mitte. */
export function bubbleRaster(frame: number, r: number): { rows: string[]; ax: number; ay: number } {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  const n = r * 2 + 5;
  const s = new Surface(n, n);
  const c = n / 2;
  const steps = Math.max(24, Math.ceil(r * 7));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
    if ((i + f) % 3 !== 0) s.px(x, y, i % 4 === 0 ? 'orchid' : 'violet');
  }
  for (let i = 0; i < steps; i += 2) {
    const a = (i / steps) * Math.PI * 2;
    if ((i + f * 2) % 8 === 0) s.px(c + Math.cos(a) * (r - 1), c + Math.sin(a) * (r - 1), 'ice');
  }
  const a1 = -Math.PI * 0.75 + f * 0.12;
  s.px(c + Math.cos(a1) * (r - 1), c + Math.sin(a1) * (r - 1), 'white');
  s.px(c + Math.cos(a1 + Math.PI) * (r - 1), c + Math.sin(a1 + Math.PI) * (r - 1), 'silver');
  return { rows: s.toRows(), ax: Math.floor(c), ay: Math.floor(c) };
}

/** Lantern Bomb im Flug (7 x 8). */
export function bombLanternRaster(frame = 0): { rows: string[]; ax: number; ay: number } {
  const s = new Surface(9, 10);
  s.rect(3, 1, 3, 1, 'rust');
  s.box(2, 2, 5, 6, RAMPS.brass);
  s.rect(3, 3, 3, 4, 'orange'); s.rect(4, 4, 1, 2, 'yellow');
  s.rect(3, 8, 3, 1, 'rust');
  s.line(6, 1, 7, 0, 'tan'); s.px(frame % 2 ? 8 : 7, frame % 2 ? 0 : -1, 'yellow');
  const o = outlineSurface(s);
  return { rows: o.toRows(), ax: 4, ay: 5 };
}

export type { Ramp };
