/** 16 x 16 Icons: Upgrade-Stufen (3 Tuerme x 3 Pfade x 5 Stufen = 45), Faehigkeiten (4), Gegner-/Turm-Kleinbilder. Alles eigene Raster. */
import type { PalName } from '../palette';
import { flame, flake, crystal, cloud, spark } from './parts';
import { RAMPS, type Ramp, Surface } from './surface';
import type { AbilityId, TowerType } from './types';

export const ICON = 16;
export const PATH_ACCENT: PalName[] = ['amber', 'sky', 'orchid'];

function panel(s: Surface, accent: PalName, tier: number, bg: Ramp = ['ink', 'night', 'dusk']): void {
  s.rect(0, 0, 16, 16, bg[1]);
  s.rect(0, 0, 16, 1, bg[2]); s.rect(0, 0, 1, 16, bg[2]);
  s.rect(0, 15, 16, 1, bg[0]); s.rect(15, 0, 1, 16, bg[0]);
  for (const [x, y] of [[0, 0], [15, 0], [0, 15], [15, 15]]) s.px(x, y, null);
  for (let i = 0; i < 5; i++) {
    const x = 1 + i * 3;
    s.rect(x, 13, 2, 1, i < tier ? accent : 'slate');
    if (i < tier) s.px(x, 13, 'white');
  }
}

// ---- Piktogramm-Bausteine (absolute Koordinaten in 16 x 16) ----
const arrowI = (s: Surface, x0: number, y0: number, x1: number, y1: number, o: { tip?: PalName; fl?: PalName; shaft?: PalName } = {}) => {
  s.line(x0, y0, x1, y1, o.shaft ?? 'sand');
  s.px(x1, y1, o.tip ?? 'silver');
  s.px(x1 + Math.sign(x1 - x0), y1 + Math.sign(y1 - y0), o.tip ?? 'silver');
  const fx = x0, fy = y0;
  if (o.fl !== undefined) { s.px(fx, fy - 1, o.fl); s.px(fx - 1, fy, o.fl); s.px(fx + 1, fy + 1, o.fl); s.px(fx, fy + 1, o.fl); }
};
const bowI = (s: Surface, cx: number, cy: number, r: number, ramp: Ramp = RAMPS.wood, th = 1) => {
  s.line(cx, cy - r, cx, cy + r, 'silver');
  s.curve(cx, cy - r, cx + r * 1.2, cy, cx, cy + r, ramp[1], th);
  s.px(cx + 1, cy - r + 1, ramp[2]);
};
const bombI = (s: Surface, cx: number, cy: number, r: number, fuse = true, ph = 0) => {
  s.ball(cx, cy, r, r, ['ink', 'night', 'dusk']);
  s.px(cx - r * 0.5, cy - r * 0.5, 'stone');
  if (fuse) { s.px(cx + r * 0.6, cy - r - 0.5, 'tan'); s.px(cx + r * 0.6 + 1, cy - r - 1.5, ph ? 'white' : 'yellow'); s.px(cx + r * 0.6 + 2, cy - r - 1.5, 'orange'); }
};
const boltI = (s: Surface, x: number, y: number, h: number, c: PalName = 'yellow') => {
  s.poly([[x, y], [x + 4, y], [x + 2, y + h * 0.45], [x + 4, y + h * 0.45], [x - 1, y + h], [x + 1, y + h * 0.55], [x - 1, y + h * 0.55]], (px) => (px < x + 1 ? 'white' : c));
};
const eyeI = (s: Surface, cx: number, cy: number, iris: PalName = 'amber') => {
  s.rect(cx - 4, cy, 9, 1, 'white'); s.rect(cx - 3, cy - 1, 7, 1, 'white'); s.rect(cx - 3, cy + 1, 7, 1, 'white'); s.rect(cx - 2, cy - 2, 5, 1, 'silver'); s.rect(cx - 2, cy + 2, 5, 1, 'silver');
  s.rect(cx - 1, cy - 1, 3, 3, iris); s.px(cx, cy, 'ink'); s.px(cx - 1, cy - 1, 'white');
};
const snowI = (s: Surface, cx: number, cy: number, r = 4, c: PalName = 'ice') => {
  s.line(cx - r, cy, cx + r, cy, c); s.line(cx, cy - r, cx, cy + r, c);
  s.line(cx - r + 1, cy - r + 1, cx + r - 1, cy + r - 1, c); s.line(cx + r - 1, cy - r + 1, cx - r + 1, cy + r - 1, c);
  s.px(cx, cy, 'white');
  for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) s.px(cx + dx, cy + dy, 'white');
};
const cannonI = (s: Surface, x: number, y: number, len: number, w: number, ramp: Ramp = RAMPS.brass) => {
  s.rect(x, y, len, w, ramp[1]); s.rect(x, y, len, 1, ramp[2]); s.rect(x, y + w - 1, len, 1, ramp[0]);
  s.rect(x + len - 2, y - 1, 2, w + 2, ramp[2]); s.px(x + len - 2, y - 1, 'white');
  s.ball(x - 1, y + w / 2, w * 0.7, w * 0.7, ramp);
};
const stars = (s: Surface, pts: [number, number][], c: PalName = 'yellow') => pts.forEach(([x, y]) => spark(s, x, y, c));

type Draw = (s: Surface) => void;
const SKULL = (s: Surface, x: number, y: number) => { s.rect(x, y, 5, 4, 'white'); s.rect(x + 1, y + 4, 3, 1, 'white'); s.px(x + 1, y + 1, 'ink'); s.px(x + 3, y + 1, 'ink'); s.px(x + 2, y + 3, 'ink'); };

/** Platzhalter Runde 13: Longshot/Market zeichnen bis zu den eigenen Icons (Agent B) die Ranger-Icons. */
const DRAW: Record<'ranger' | 'bombardier' | 'frostcaller', Draw[][]> = {
  ranger: [
    // A Volley
    [
      (s) => { arrowI(s, 2, 10, 11, 3, { tip: 'white' }); stars(s, [[12, 2], [10, 1], [13, 5]], 'white'); },
      (s) => { arrowI(s, 2, 10, 11, 3, { tip: 'white', fl: 'red' }); s.line(3, 4, 7, 8, 'red'); s.line(3, 5, 6, 8, 'crimson'); s.px(2, 3, 'red'); },
      (s) => { arrowI(s, 2, 8, 12, 3, { tip: 'white', fl: 'red' }); arrowI(s, 2, 8, 13, 8, { tip: 'white', fl: 'red' }); arrowI(s, 2, 8, 12, 13, { tip: 'white', fl: 'red' }); s.px(2, 8, 'yellow'); },
      (s) => { bowI(s, 4, 6, 5, RAMPS.wood, 1); for (const dy of [-4, -2, 0, 2, 4]) arrowI(s, 2, 6, 13, 6 + dy, { tip: 'white' }); s.px(4, 1, 'amber'); s.px(4, 11, 'amber'); },
      (s) => { bowI(s, 5, 6, 6, RAMPS.gold, 2); arrowI(s, 1, 6, 14, 6, { tip: 'yellow', shaft: 'amber', fl: 'white' }); stars(s, [[12, 2], [13, 10], [2, 1]], 'white'); },
    ],
    // B Rapid
    [
      (s) => { arrowI(s, 6, 6, 13, 6, { tip: 'white', fl: 'red' }); s.line(1, 4, 5, 4, 'stone'); s.line(2, 6, 5, 6, 'stone'); s.line(1, 8, 5, 8, 'stone'); },
      (s) => { s.rect(2, 5, 12, 2, 'crimson'); s.rect(2, 5, 12, 1, 'red'); s.rect(1, 7, 2, 4, 'crimson'); s.px(0, 10, 'red'); s.ball(8, 3, 3, 3, RAMPS.leaf); s.rect(5, 8, 7, 2, 'skin'); },
      (s) => { bowI(s, 8, 6, 5, RAMPS.wood, 1); s.box(3, 5, 5, 4, RAMPS.iron); s.rect(4, 2, 2, 3, 'wood'); s.px(4, 1, 'sand'); s.px(5, 1, 'sand'); s.px(5, 7, 'amber'); arrowI(s, 3, 6, 13, 6, { tip: 'white' }); },
      (s) => { s.ellipse(8, 8, 6, 2, 'plum'); s.ball(8, 6, 4, 3, RAMPS.crimson); s.rect(4, 7, 9, 1, 'yellow'); s.curve(10, 4, 14, 1, 14, 6, 'white'); s.line(2, 10, 14, 10, 'bark'); s.rect(1, 9, 4, 3, 'red'); },
      (s) => { bowI(s, 4, 6, 5, RAMPS.gold, 1); bowI(s, 9, 6, 5, RAMPS.gold, 1); for (let i = 0; i < 4; i++) arrowI(s, 2, 2 + i * 3, 6, 2 + i * 3, { tip: 'yellow' }); stars(s, [[13, 3], [13, 9], [12, 6]], 'white'); },
    ],
    // C Eagle Eye
    [
      (s) => { bowI(s, 5, 6, 6, RAMPS.wood, 1); arrowI(s, 3, 6, 13, 6, { tip: 'white' }); s.px(2, 11, 'wood'); s.px(2, 1, 'wood'); },
      (s) => { eyeI(s, 8, 6, 'amber'); for (let i = 0; i < 4; i++) { s.px(5 + i * 1, 2, 'amber'); } s.rect(3, 3, 1, 1, 'amber'); s.rect(12, 3, 1, 1, 'amber'); s.line(12, 9, 14, 11, 'yellow'); },
      (s) => { s.rect(2, 9, 12, 2, 'wood'); s.rect(2, 9, 12, 1, 'tan'); s.line(8, 2, 8, 10, 'wood', 2); s.curve(4, 2, 8, 6, 4, 10, 'bark', 1); arrowI(s, 3, 6, 13, 6, { tip: 'stone', shaft: 'wood', fl: 'red' }); },
      (s) => { s.rect(1, 9, 13, 2, 'stone'); s.rect(1, 9, 13, 1, 'silver'); s.line(8, 1, 8, 10, 'stone', 3); s.curve(3, 1, 9, 6, 3, 11, 'iron'[0] === 'i' ? 'slate' : 'slate', 2); arrowI(s, 2, 6, 14, 6, { tip: 'white', shaft: 'wood', fl: 'red' }); s.px(8, 4, 'silver'); s.px(8, 8, 'silver'); },
      (s) => { s.rect(1, 9, 13, 2, 'amber'); s.line(8, 1, 8, 10, 'amber', 3); s.curve(3, 1, 10, 6, 3, 11, 'yellow', 2); crystal(s, 8, 5, 3, ['sky', 'ice', 'white'], 1); arrowI(s, 2, 6, 14, 6, { tip: 'white', shaft: 'yellow' }); stars(s, [[13, 2], [3, 3], [13, 10]], 'white'); },
    ],
  ],
  bombardier: [
    // A Bigger Blasts
    [
      (s) => { bombI(s, 8, 7, 4); s.ring(8, 7, 6, 6, 'orange'); },
      (s) => { bombI(s, 8, 7, 4.6); s.rect(4, 6, 9, 1, 'amber'); s.rect(4, 9, 9, 1, 'amber'); s.px(6, 3, 'white'); },
      (s) => { bombI(s, 6, 8, 3.4, false); s.poly([[9, 4], [14, 7], [9, 11]], (x, y) => ((x + y) % 3 === 0 ? 'white' : 'silver')); s.px(14, 7, 'white'); },
      (s) => { s.box(5, 7, 6, 4, RAMPS.iron); s.line(7, 7, 11, 1, 'slate', 3); s.rect(9, 0, 4, 2, 'stone'); s.ball(4, 10, 2.5, 2.5, RAMPS.darkWood); s.ball(11, 10, 2.5, 2.5, RAMPS.darkWood); s.ball(14, 1, 1.5, 1.5, RAMPS.stone); },
      (s) => { s.ellipse(7, 7, 5, 4.5, 'bark'); s.rect(3, 5, 9, 1, 'stone'); s.rect(3, 9, 9, 1, 'stone'); s.ball(7, 7, 1, 1, RAMPS.wood); s.rect(12, 6, 3, 3, 'slate'); SKULL(s, 5, 6); s.line(7, 2, 7, 0, 'bark'); s.rect(8, 0, 4, 2, 'ink'); s.px(9, 0, 'white'); },
    ],
    // B Clusters
    [
      (s) => { bombI(s, 8, 8, 4, true, 1); flame(s, 11, 4, 3, 1, 'orange', 'amber', 'yellow'); },
      (s) => { cannonI(s, 2, 5, 11, 4); s.rect(11, 4, 3, 6, 'amber'); s.px(13, 4, 'yellow'); },
      (s) => { bombI(s, 8, 7, 3.4, false); for (const [dx, dy] of [[-5, -3], [5, -3], [-5, 3], [5, 3], [0, -5], [0, 5]]) s.rect(8 + dx - 0.5, 7 + dy - 0.5, 2, 2, 'amber'); },
      (s) => { s.ball(8, 6, 5, 5, RAMPS.steel); for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.28 + 0.5; s.rect(8 + Math.cos(a) * 3 - 1, 6 + Math.sin(a) * 3 - 1, 2, 2, 'ink'); } s.px(8, 6, 'amber'); s.px(6, 3, 'white'); },
      (s) => { for (const x of [5, 8]) { s.rect(x, 3, 2, 8, 'stone'); s.rect(x, 3, 1, 8, 'silver'); s.rect(x, 1, 2, 2, 'red'); flame(s, x, 14, 3, x, 'orange', 'amber', 'yellow'); } s.rect(10, 5, 4, 2, 'stone'); s.px(13, 5, 'red'); },
    ],
    // C Concussion
    [
      (s) => { s.rect(2, 4, 4, 7, 'night'); s.rect(9, 4, 4, 7, 'night'); s.rect(2, 4, 4, 1, 'stone'); s.rect(9, 4, 4, 1, 'stone'); s.rect(5, 6, 5, 2, 'slate'); s.rect(3, 10, 2, 1, 'ice'); s.rect(10, 10, 2, 1, 'ice'); },
      (s) => { s.poly([[5, 3], [10, 3], [12, 10], [3, 10]], (x) => (x < 8 ? 'yellow' : 'amber')); s.px(8, 11, 'rust'); s.px(8, 2, 'rust'); s.px(6, 5, 'white'); s.line(2, 5, 1, 7, 'sky'); s.line(13, 5, 14, 7, 'sky'); },
      (s) => { for (const x of [3, 7, 11]) { s.rect(x, 3, 3, 7, 'silver'); s.rect(x, 5, 3, 1, 'sky'); s.rect(x, 7, 3, 1, 'sky'); s.rect(x, 3, 1, 7, 'white'); s.px(x + 1, 2, 'stone'); } s.rect(2, 10, 12, 1, 'bark'); },
      (s) => { cannonI(s, 2, 5, 10, 4, RAMPS.brass); for (const x of [4, 6, 8]) s.rect(x, 4, 1, 6, 'clay'); boltI(s, 12, 1, 8, 'ice'); s.px(1, 3, 'yellow'); },
      (s) => { s.rect(5, 2, 7, 5, 'stone'); s.rect(5, 2, 7, 1, 'white'); s.rect(7, 7, 2, 5, 'bark'); s.line(2, 12, 5, 10, 'ink'); s.line(5, 10, 3, 9, 'ink'); s.line(14, 12, 11, 10, 'ink'); s.px(3, 12, 'orange'); s.px(13, 11, 'orange'); s.px(9, 12, 'amber'); },
    ],
  ],
  frostcaller: [
    // A Permafrost
    [
      (s) => { s.rect(3, 5, 10, 3, 'ice'); s.rect(3, 5, 10, 1, 'white'); s.rect(2, 8, 3, 4, 'sky'); s.px(2, 11, 'ice'); snowI(s, 10, 3, 2, 'white'); },
      (s) => { snowI(s, 8, 6, 4, 'ice'); s.ring(8, 6, 6, 5, 'sky'); stars(s, [[2, 6], [14, 6]], 'white'); },
      (s) => { for (const [x, h] of [[3, 5], [6, 7], [9, 8], [12, 5]] as [number, number][]) crystal(s, x, 11 - h / 2, h / 2 + 1, RAMPS.frost, 1); s.rect(3, 11, 10, 1, 'white'); },
      (s) => { s.ball(8, 7, 5, 4.5, ['navy', 'sky', 'ice']); s.rect(5, 5, 2, 2, 'white'); s.rect(9, 5, 2, 2, 'white'); s.rect(6, 7, 4, 2, 'ice'); s.px(8, 10, 'ice'); s.px(5, 5, 'white'); },
      (s) => { snowI(s, 8, 6, 5, 'white'); s.ring(8, 6, 6, 5.5, 'ice'); crystal(s, 3, 3, 2, RAMPS.frost, 1); crystal(s, 13, 3, 2, RAMPS.frost, 1); crystal(s, 8, 11, 2, RAMPS.frost, 1); },
    ],
    // B Shatter
    [
      (s) => { for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; s.line(8 - Math.cos(a) * 5, 6 - Math.sin(a) * 5, 8 + Math.cos(a) * 5, 6 + Math.sin(a) * 5, 'ice'); } s.ball(8, 6, 2.2, 2.2, RAMPS.frost); s.px(8, 6, 'white'); },
      (s) => { crystal(s, 8, 6, 5, RAMPS.ice); s.line(5, 5, 8, 7, 'white'); s.line(8, 7, 7, 10, 'white'); s.line(10, 4, 9, 7, 'ice'); },
      (s) => { for (const [x, h] of [[3, 8], [6, 10], [9, 9], [12, 7]] as [number, number][]) { s.poly([[x - 1, 1], [x + 2, 1], [x + 0.5, h]], (px) => (px < x + 0.5 ? 'white' : 'ice')); } s.rect(2, 1, 12, 1, 'sky'); },
      (s) => { s.line(2, 11, 13, 2, 'wood', 1); s.poly([[10, 5], [14, 1], [12, 6], [13, 7]], (x) => (x < 12 ? 'ice' : 'sky')); s.poly([[10, 1], [15, 1], [14, 5]], 'ice'); s.px(14, 1, 'white'); s.line(8, 6, 11, 3, 'silver', 2); crystal(s, 13, 3, 4, RAMPS.frost, 1); },
      (s) => { s.ball(8, 6, 4.5, 5, ['navy', 'sky', 'ice']); s.rect(5, 4, 2, 2, 'yellow'); s.rect(9, 4, 2, 2, 'yellow'); s.rect(4, 8, 8, 1, 'white'); for (const sg of [-1, 1]) { s.line(8 + sg * 5, 4, 8 + sg * 7, 1, 'white'); s.line(8 + sg * 5, 6, 8 + sg * 7, 3, 'ice'); } },
    ],
    // C Storm
    [
      (s) => { boltI(s, 6, 1, 9, 'yellow'); stars(s, [[3, 3], [12, 8], [11, 2]], 'white'); },
      (s) => { eyeI(s, 8, 7, 'yellow'); boltI(s, 10, 0, 5, 'amber'); },
      (s) => { for (const [x, y] of [[2, 3], [7, 6], [12, 2], [13, 9]] as [number, number][]) s.ball(x, y, 1.6, 1.6, ['amber', 'yellow', 'white']); s.line(2, 3, 7, 6, 'white'); s.line(7, 6, 12, 2, 'white'); s.line(7, 6, 13, 9, 'yellow'); },
      (s) => { cloud(s, 8, 6, 12, true, 0); boltI(s, 6, 6, 6, 'yellow'); s.px(11, 3, 'white'); },
      (s) => { cloud(s, 8, 9, 13, true, 2); for (let i = -2; i <= 2; i++) { const h = i % 2 === 0 ? 4 : 2; s.rect(8 + i * 2, 4 - h, 1, h, i % 2 ? 'amber' : 'yellow'); } boltI(s, 6, 8, 4, 'white'); },
    ],
  ],
};

export function iconUpgradeRaster(type: TowerType, path: 0 | 1 | 2, tier: number): { rows: string[]; ax: number; ay: number } {
  const t = Math.max(1, Math.min(5, tier));
  const s = new Surface(ICON, ICON);
  panel(s, PATH_ACCENT[path], t);
  const d = new Surface(ICON, ICON);
  DRAW[type === 'longshot' || type === 'market' ? 'ranger' : type][path][t - 1](d);
  // Piktogramm nur in der oberen Flaeche (ueber den Pips)
  d.mask((x, y) => y < 13 && x >= 0 && x < 16);
  s.blit(d);
  return { rows: s.toRows(), ax: 0, ay: 0 };
}

const ABIL: Record<AbilityId, Draw> = {
  arrowRain: (s) => { for (const [x, y] of [[3, 3], [7, 1], [11, 4], [5, 7], [9, 8], [13, 9]]) { s.line(x, y, x, y + 4, 'yellow'); s.px(x, y + 5, 'white'); s.px(x - 1, y, 'red'); s.px(x + 1, y, 'red'); } s.rect(1, 12, 14, 1, 'amber'); },
  absoluteZero: (s) => { snowI(s, 8, 8, 6, 'ice'); s.ring(8, 8, 7, 7, 'white'); s.px(8, 8, 'white'); },
  flare: (s) => { s.ball(8, 8, 4, 4, ['yellow', 'white', 'white']); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; s.line(8 + Math.cos(a) * 5.5, 8 + Math.sin(a) * 5.5, 8 + Math.cos(a) * 7.5, 8 + Math.sin(a) * 7.5, i % 2 ? 'amber' : 'yellow'); } },
  // Platzhalter Runde 13 (Agent B liefert die echten Icons)
  focus: (s) => ABIL.arrowRain(s),
  supplyDrop: (s) => ABIL.dawnbreak(s),
  grant: (s) => ABIL.flare(s),
  dawnbreak: (s) => { s.rect(0, 5, 16, 6, 'amber'); s.rect(0, 6, 16, 4, 'yellow'); s.rect(0, 7, 16, 2, 'white'); for (const x of [2, 7, 12]) { s.px(x, 3, 'yellow'); s.px(x + 2, 12, 'amber'); } s.ellipse(14, 8, 2, 4, 'white'); },
};

export function iconAbilityRaster(id: AbilityId): { rows: string[]; ax: number; ay: number } {
  const s = new Surface(ICON, ICON);
  const col: PalName = { arrowRain: 'amber', absoluteZero: 'sky', flare: 'yellow', dawnbreak: 'orange', focus: 'amber', supplyDrop: 'orange', grant: 'yellow' }[id] as PalName;
  s.rect(0, 0, 16, 16, 'night'); s.rect(0, 0, 16, 1, col); s.rect(0, 0, 1, 16, col); s.rect(0, 15, 16, 1, 'ink'); s.rect(15, 0, 1, 16, 'ink');
  for (const [x, y] of [[0, 0], [15, 0], [0, 15], [15, 15]]) s.px(x, y, null);
  const d = new Surface(16, 16);
  ABIL[id](d);
  s.blit(d);
  return { rows: s.toRows(), ax: 0, ay: 0 };
}
void flake;
