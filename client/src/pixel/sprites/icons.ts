/** 16 x 16 Icons: Upgrade-Stufen (3 Tuerme x 3 Pfade x 5 Stufen = 45), Faehigkeiten (4), Gegner-/Turm-Kleinbilder. Alles eigene Raster. */
import type { PalName } from '../palette';
import { flame, flake, crystal, cloud, spark } from './parts';
import { RAMPS, type Ramp, Surface } from './surface';
import { flask } from './alchemist';
import { antler, leafAt } from './thornweaver';
import { ABILITY_LOOK, baseLook, type AbilityId, type BaseAbilityId, type BaseTowerType, type TowerType } from './types';

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
const ACID: Ramp = ['grass', 'leaf', 'yellow'];
const HULK_: Ramp = ['pine', 'grass', 'leaf'];
const coin = (s: Surface, x: number, y: number): void => { s.ball(x, y, 2.2, 2.2, ['rust', 'amber', 'yellow']); s.px(x - 1, y - 1, 'white'); };
const SKULL = (s: Surface, x: number, y: number) => { s.rect(x, y, 5, 4, 'white'); s.rect(x + 1, y + 4, 3, 1, 'white'); s.px(x + 1, y + 1, 'ink'); s.px(x + 3, y + 1, 'ink'); s.px(x + 2, y + 3, 'ink'); };

const DRAW: Record<BaseTowerType, Draw[][]> = {
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

  market: [
    // A Harvest
    [
      (s) => { for (const [x, y, c] of [[1, 3, 'amber'], [8, 5, 'orange']] as [number, number, PalName][]) { for (let i = 0; i < 7; i++) s.rect(x + i, y, 1, 3, i % 2 ? 'sand' : c); s.rect(x, y + 3, 7, 1, 'white'); s.rect(x + 1, y + 4, 5, 4, 'wood'); s.rect(x + 1, y + 4, 5, 1, 'tan'); } s.px(3, 8, 'red'); s.px(11, 10, 'leaf'); },
      (s) => { s.curve(0, 1, 8, 6, 15, 1, 'tan'); for (const [x, y] of [[3, 3], [8, 4], [13, 3]]) { s.rect(x - 1, y, 3, 5, 'yellow'); s.rect(x - 1, y, 3, 1, 'rust'); s.rect(x - 1, y + 4, 3, 1, 'rust'); s.px(x, y + 2, 'white'); s.px(x - 1, y + 2, 'amber'); s.px(x + 1, y + 2, 'amber'); } stars(s, [[1, 8], [6, 10], [11, 9]], 'white'); },
      (s) => { s.rect(2, 6, 12, 6, 'sand'); s.rect(2, 6, 12, 1, 'white'); s.rect(2, 9, 12, 1, 'bark'); s.rect(2, 6, 1, 6, 'bark'); s.rect(13, 6, 1, 6, 'bark'); s.rect(7, 6, 1, 6, 'bark'); s.poly([[0, 6], [3, 1], [12, 1], [15, 6]], (x, y) => (y % 2 ? 'crimson' : 'red')); s.rect(0, 6, 16, 1, 'plum'); s.rect(5, 8, 5, 4, 'plum'); s.px(9, 10, 'yellow'); },
      (s) => { s.rect(2, 5, 12, 7, 'stone'); s.rect(2, 5, 12, 1, 'silver'); s.poly([[1, 5], [4, 1], [11, 1], [14, 5]], (x, y) => (y % 2 ? 'crimson' : 'red')); s.rect(6, 6, 5, 6, 'plum'); s.poly([[5, 3], [10, 3], [10, 6], [7.5, 8], [5, 6]], (x) => (x < 8 ? 'amber' : 'orange')); s.px(7, 4, 'white'); s.rect(1, 12, 14, 1, 'amber'); },
      (s) => { s.ellipseFn(8, 7, 6, 6, (x, y, nx, ny) => (y > 7 ? null : (-nx * 0.5 - ny * 0.7) > 0.3 ? 'yellow' : 'amber')); s.rect(2, 7, 12, 1, 'rust'); for (const x of [3, 6, 9, 12]) s.rect(x, 8, 1, 4, 'white'); s.rect(2, 12, 12, 1, 'amber'); s.rect(7, 0, 2, 2, 'yellow'); stars(s, [[2, 3], [13, 4]], 'white'); s.px(5, 3, 'white'); },
    ],
    // B Bank
    [
      (s) => { s.ball(8, 8, 5, 4.5, ['rust', 'tan', 'sand']); s.rect(6, 3, 5, 2, 'bark'); s.rect(7, 2, 3, 1, 'yellow'); s.px(8, 8, 'yellow'); s.px(9, 9, 'yellow'); s.ball(13, 10, 1.5, 1.5, ['rust', 'amber', 'yellow']); },
      (s) => { s.box(2, 6, 12, 6, RAMPS.wood); s.rect(2, 3, 12, 4, 'bark'); s.rect(2, 3, 12, 1, 'wood'); s.rect(2, 8, 12, 1, 'slate'); s.rect(7, 6, 3, 4, 'silver'); s.px(8, 8, 'ink'); s.rect(4, 3, 1, 9, 'slate'); s.rect(11, 3, 1, 9, 'slate'); },
      (s) => { s.poly([[1, 5], [8, 1], [15, 5]], (x) => (x < 8 ? 'white' : 'silver')); s.rect(2, 5, 12, 7, 'silver'); for (const x of [3, 5, 10, 12]) s.rect(x, 6, 1, 5, 'white'); s.ball(8, 9, 3, 3, RAMPS.steel); s.px(8, 9, 'amber'); s.rect(1, 12, 14, 1, 'slate'); },
      (s) => { s.rect(3, 2, 9, 10, 'sand'); s.rect(3, 2, 9, 1, 'white'); s.rect(3, 11, 9, 1, 'tan'); for (const y of [4, 6, 8]) s.rect(5, y, 5, 1, 'stone'); s.ball(11, 10, 3, 3, RAMPS.red); s.px(11, 10, 'yellow'); s.px(10, 9, 'white'); s.line(2, 12, 6, 6, 'wood'); s.px(1, 12, 'ink'); },
      (s) => { for (let y = 0; y < 7; y++) { const w = Math.round(6 * (1 - y / 7)) + 1; for (let x = -w; x <= w; x++) s.px(8 + x, 11 - y, ((x + y * 2) & 3) === 0 ? 'amber' : ((x * 3 + y) & 3) === 1 ? 'orange' : 'yellow'); } s.rect(1, 12, 14, 1, 'rust'); s.rect(2, 7, 2, 5, 'yellow'); s.rect(12, 7, 2, 5, 'yellow'); stars(s, [[8, 2], [3, 5], [13, 4]], 'white'); },
    ],
    // C Town Square
    [
      (s) => { s.rect(5, 4, 6, 8, 'bark'); s.rect(5, 4, 1, 8, 'wood'); s.rect(4, 3, 8, 2, 'wood'); s.poly([[3, 3], [8, 0], [13, 3]], (x) => (x < 8 ? 'orchid' : 'violet')); s.rect(7, 6, 2, 2, 'yellow'); s.line(8, 0, 8, -1, 'bark'); s.rect(11, 1, 3, 2, 'orchid'); },
      (s) => { s.poly([[5, 3], [11, 3], [13, 10], [3, 10]], (x) => (x < 8 ? 'yellow' : 'amber')); s.rect(3, 10, 10, 1, 'rust'); s.rect(7, 1, 2, 2, 'bark'); s.px(8, 11, 'rust'); s.px(8, 12, 'rust'); s.px(6, 5, 'white'); s.line(1, 5, 0, 8, 'orchid'); s.line(14, 5, 15, 8, 'orchid'); },
      (s) => { for (const [x, y, r] of [[5, 7, 3.6], [11, 6, 3]] as [number, number, number][]) { s.ball(x, y, r, r, RAMPS.rust); s.ellipse(x, y - r + 0.5, r - 0.5, 1.4, 'sand'); s.px(x - 1, y - r, 'white'); } s.line(1, 2, 4, 5, 'tan'); s.line(14, 1, 11, 4, 'tan'); s.rect(4, 11, 8, 1, 'bark'); },
      (s) => { s.line(2, 11, 12, 1, 'silver', 1); s.px(13, 0, 'white'); s.line(13, 11, 3, 1, 'wood', 1); s.poly([[1, 0], [4, 0], [3, 3]], 'stone'); s.rect(5, 5, 6, 5, 'orchid'); s.rect(5, 5, 6, 1, 'coral'); s.px(8, 7, 'yellow'); },
      (s) => { s.rect(5, 4, 6, 8, 'stone'); s.rect(5, 4, 6, 1, 'white'); s.poly([[4, 4], [8, 0], [12, 4]], (x) => (x < 8 ? 'orchid' : 'violet')); s.ball(8, 7, 2.4, 2.4, ['silver', 'white', 'white']); s.px(8, 6, 'ink'); s.px(9, 7, 'ink'); s.rect(1, 8, 4, 4, 'stone'); s.rect(11, 8, 4, 4, 'stone'); s.rect(2, 9, 2, 2, 'yellow'); s.rect(12, 9, 2, 2, 'yellow'); },
    ],
  ],
  longshot: [
    // A Heavy Rounds
    [
      (s) => { s.line(1, 11, 11, 3, 'sand'); s.poly([[10, 1], [14, 2], [12, 5]], (x) => (x < 12 ? 'silver' : 'stone')); s.px(13, 2, 'white'); s.px(1, 11, 'red'); s.px(2, 12, 'red'); s.px(1, 10, 'red'); s.px(7, 5, 'amber'); },
      (s) => { s.line(0, 9, 15, 3, 'sand'); s.rect(5, 2, 1, 9, 'stone'); s.rect(10, 1, 1, 9, 'stone'); s.px(15, 3, 'white'); s.px(14, 3, 'silver'); s.px(13, 4, 'silver'); s.px(0, 10, 'red'); s.px(1, 11, 'red'); },
      (s) => { s.ring(8, 6, 5, 5, 'silver'); s.ring(8, 6, 4, 4, 'stone'); s.line(2, 6, 14, 6, 'white'); s.line(8, 0, 8, 12, 'white'); s.rect(7, 5, 3, 3, 'red'); s.px(8, 6, 'white'); s.rect(3, 2, 3, 2, 'ink'); },
      (s) => { s.line(4, 5, 14, 5, 'stone', 3); s.curve(10, 0, 14, 5, 10, 11, 'steel'[0] ? 'slate' : 'slate', 2); s.line(10, 0, 10, 11, 'silver'); s.line(1, 10, 6, 6, 'bark', 2); s.line(7, 7, 10, 11, 'bark', 2); s.px(14, 5, 'white'); s.px(1, 5, 'red'); s.px(2, 5, 'red'); },
      (s) => { s.rect(1, 5, 9, 4, 'amber'); s.rect(1, 5, 9, 1, 'yellow'); s.rect(1, 8, 9, 1, 'rust'); s.rect(9, 4, 3, 6, 'yellow'); s.rect(3, 4, 1, 6, 'orange'); s.rect(6, 4, 1, 6, 'orange'); for (let i = 0; i < 4; i++) { s.rect(12 + i, 6, 1, 1, 'white'); } s.rect(12, 5, 3, 1, 'yellow'); s.rect(12, 7, 3, 1, 'yellow'); stars(s, [[12, 1], [3, 1]], 'white'); },
    ],
    // B Rapid Reload
    [
      (s) => { s.rect(1, 5, 11, 3, 'night'); s.rect(1, 5, 11, 1, 'dusk'); s.rect(11, 3, 3, 7, 'dusk'); s.ball(12, 6.5, 2.2, 2.2, ['pine', 'leaf', 'white']); s.px(13, 5, 'white'); s.line(2, 11, 6, 8, 'bark'); },
      (s) => { for (let i = 0; i < 4; i++) { s.rect(2 + i * 3, 4, 2, 6, 'amber'); s.rect(2 + i * 3, 4, 2, 2, 'orange'); s.px(2 + i * 3, 6, 'yellow'); } s.rect(1, 10, 14, 1, 'bark'); s.rect(1, 3, 14, 1, 'bark'); stars(s, [[13, 1]], 'white'); },
      (s) => { s.rect(0, 5, 11, 2, 'slate'); s.rect(0, 5, 11, 1, 'stone'); s.rect(10, 4, 4, 4, 'iron'[0] ? 'night' : 'night'); s.px(14, 5, 'ink'); s.rect(4, 7, 3, 5, 'night'); s.rect(4, 7, 3, 1, 'amber'); s.px(2, 3, 'amber'); s.px(3, 1, 'yellow'); s.px(0, 2, 'amber'); s.px(1, 0, 'yellow'); },
      (s) => { for (const x of [3, 9]) { s.ball(x + 1, 4, 2.4, 2.4, ['pine', 'grass', 'leaf']); s.rect(x - 1, 6, 5, 5, 'grass'); s.rect(x, 7, 3, 1, 'skin'); s.line(x + 3, 8, x + 5, 8, 'night'); } s.line(1, 12, 14, 12, 'bark'); },
      (s) => { for (const x of [2, 7, 12]) { s.ball(x + 0.5, 6, 2.2, 2.2, ['navy', 'sky', 'ice']); s.rect(x - 2, 8, 5, 4, 'sky'); } s.rect(7, 0, 1, 5, 'bark'); s.rect(8, 0, 4, 2, 'yellow'); s.px(8, 0, 'white'); },
    ],
    // C Field Kit
    [
      (s) => { s.ball(5, 7, 3, 3, ['rust', 'amber', 'yellow']); for (const [x, y] of [[10, 2], [13, 7], [10, 11]]) { s.rect(x, y, 2, 2, 'silver'); s.px(x, y, 'white'); } s.line(8, 6, 10, 3, 'orange'); s.line(8, 8, 12, 8, 'orange'); s.line(8, 9, 10, 11, 'orange'); },
      (s) => { s.rect(1, 9, 3, 3, 'stone'); s.rect(12, 9, 3, 3, 'stone'); s.rect(6, 2, 4, 3, 'stone'); s.line(2, 9, 7, 4, 'white'); s.line(7, 4, 13, 9, 'ice'); s.px(7, 3, 'yellow'); s.px(2, 8, 'yellow'); s.px(13, 8, 'yellow'); },
      (s) => { s.ball(8, 3, 6, 3, ['violet', 'orchid', 'coral']); s.rect(2, 3, 12, 1, 'violet'); s.line(3, 4, 6, 8, 'white'); s.line(13, 4, 10, 8, 'white'); s.line(8, 4, 8, 8, 'white'); s.box(5, 8, 6, 4, RAMPS.wood); s.rect(5, 9, 6, 1, 'amber'); },
      (s) => { for (let y = 1; y < 11; y++) for (let x = 1; x < 15; x++) if (((x + y) & 1) === 0) s.px(x, y, ((x * 3 + y) & 2) ? 'deep' : 'grass'); s.poly([[8, 2], [9.5, 5.5], [13, 6], [10.5, 8.5], [11, 12], [8, 10], [5, 12], [5.5, 8.5], [3, 6], [6.5, 5.5]], (x) => (x < 8 ? 'yellow' : 'amber')); s.px(7, 5, 'white'); },
      (s) => { s.ring(8, 6, 5, 5, 'red'); s.ring(8, 6, 3, 3, 'crimson'); for (const sg of [-1, 1]) { s.line(8 + sg * 7, 6, 8 + sg * 3, 6, 'red'); s.line(8, 6 + sg * 5, 8, 6 + sg * 3, 'red'); } s.px(8, 6, 'white'); s.px(8, 5, 'white'); s.line(2, 1, 5, 4, 'coral'); s.px(1, 0, 'white'); },
    ],
  ],
  thornweaver: [
    // A Storm
    [
      (s) => { for (const [x, h] of [[3, 9], [8, 12], [13, 8]] as [number, number][]) { s.poly([[x - 2.5, 12.5], [x + 2.5, 12.5], [x + 0.5, 12 - h]], (px) => (px < x ? 'tan' : 'wood')); s.line(x + 1, 11, x + 1, 12 - h + 2, 'bark'); s.px(x, 12 - h, 'white'); s.px(x, 12 - h + 1, 'silver'); } s.rect(1, 12, 14, 1, 'leaf'); s.px(5, 11, 'leaf'); s.px(11, 11, 'grass'); },
      (s) => { s.poly([[8, 12], [1, 5], [3, 1], [8, 3], [13, 1], [15, 5]], (x) => (x < 8 ? 'red' : 'crimson')); s.rect(3, 2, 3, 2, 'coral'); boltI(s, 6, 2, 10, 'yellow'); stars(s, [[2, 11], [14, 11]], 'yellow'); },
      (s) => { cloud(s, 8, 8, 12, true, 0); for (let i = 0; i < 3; i++) { s.line(1, 9 + i, 6 - i, 9 + i, 'white'); s.px(7 - i, 9 + i, 'silver'); s.line(10 + i, 11 - i * 1, 15, 11 - i, 'silver'); } boltI(s, 9, 6, 6, 'yellow'); },
      (s) => { cloud(s, 8, 6, 15, true, 2); for (const [x, h] of [[3, 6], [7, 7], [11, 6]] as [number, number][]) boltI(s, x, 6, h, x === 7 ? 'white' : 'yellow'); stars(s, [[1, 11], [15, 10]], 'yellow'); },
      (s) => { s.ball(8, 7, 5.4, 5.4, ['dusk', 'slate', 'stone']); s.rect(4, 6, 3, 2, 'yellow'); s.rect(9, 6, 3, 2, 'yellow'); s.px(4, 6, 'white'); s.px(9, 6, 'white'); s.line(5, 10, 11, 10, 'night'); for (const x of [3, 6, 9, 12]) { s.line(x, 2, x, 0, x % 2 ? 'yellow' : 'white'); } s.line(1, 4, 2, 7, 'yellow'); s.line(15, 4, 14, 7, 'yellow'); s.rect(2, 11, 12, 1, 'sky'); },
    ],
    // B Wild
    [
      (s) => { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s.line(8 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, 8 + Math.cos(a) * 7, 6 + Math.sin(a) * 6, 'tan'); s.px(8 + Math.cos(a) * 7.8, 6 + Math.sin(a) * 6.8, 'white'); } s.ball(8, 6, 3, 3, ['rust', 'red', 'coral']); s.px(7, 5, 'white'); },
      (s) => { for (let i = 0; i <= 11; i++) { const y = 1 + i, x = 8 + Math.sin(i * 0.9) * 4; s.rect(x - 1, y, 3, 1, i % 3 ? 'leaf' : 'grass'); s.px(x - 1, y, 'yellow'); } for (let i = 0; i <= 11; i++) { const y = 1 + i, x = 8 - Math.sin(i * 0.9) * 4; s.px(x, y, 'grass'); } s.px(12, 3, 'white'); s.px(4, 7, 'white'); s.px(11, 9, 'white'); leafAt(s, 12, 7, 0.2, 3, ['pine', 'grass', 'leaf']); s.rect(4, 12, 8, 1, 'pine'); },
      (s) => { for (const [x, h] of [[3, 7], [8, 9], [13, 7]] as [number, number][]) { s.rect(x - 1, 12 - h + 3, 2, h - 3, 'bark'); s.ball(x, 12 - h + 2, 3.2, 3, ['pine', 'grass', 'leaf']); } s.rect(1, 12, 14, 1, 'deep'); s.px(5, 11, 'leaf'); s.px(11, 11, 'leaf'); },
      (s) => { s.ball(8, 7, 4, 5, ['grass', 'leaf', 'white']); s.px(6, 6, 'ink'); s.px(9, 6, 'ink'); s.px(6, 5, 'white'); s.rect(7, 9, 2, 1, 'deep'); antler(s, 6, 3, -1, 1.5, RAMPS.wood, 'yellow', 1); antler(s, 10, 3, 1, 1.5, RAMPS.wood, 'yellow', 1); for (let i = 0; i < 3; i++) s.px(5 + i * 3, 12 - (i & 1), ['sky', 'ice', 'white'][i] as PalName); },
      (s) => { s.ball(8, 4, 7, 4.4, ['pine', 'grass', 'leaf']); for (const [x, y] of [[4, 3], [8, 2], [12, 4], [6, 5], [10, 5]]) { s.px(x, y, 'yellow'); s.px(x + 1, y, 'amber'); } s.rect(7, 7, 3, 5, 'bark'); s.rect(7, 7, 1, 5, 'wood'); s.line(7, 11, 3, 12, 'bark'); s.line(10, 11, 14, 12, 'bark'); stars(s, [[1, 1], [15, 1]], 'yellow'); },
    ],
    // C Grove
    [
      (s) => { s.line(4, 12, 11, 1, 'wood', 2); s.line(3, 12, 10, 1, 'tan', 1); s.ball(12, 1, 2, 2, ['orchid', 'coral', 'white']); for (const dy of [-1, 1]) { s.line(5, 6 + dy * 4, 1, 6 + dy * 4, 'leaf'); s.px(1, 6 + dy * 4, 'white'); s.line(11, 8 + dy * 4, 15, 8 + dy * 4, 'leaf'); } s.ring(8, 7, 6, 5, 'grass'); },
      (s) => { eyeI(s, 8, 7, 'leaf'); leafAt(s, 8, 3, -Math.PI / 2, 4, ['pine', 'grass', 'leaf']); leafAt(s, 3, 3, -2.2, 4, ['pine', 'grass', 'leaf']); leafAt(s, 13, 3, -0.9, 4, ['pine', 'grass', 'leaf']); s.px(8, 12, 'coral'); },
      (s) => { s.box(2, 8, 12, 5, RAMPS.wood); s.rect(2, 10, 12, 1, 'bark'); for (const [x, y, r] of [[4, 6, ['crimson', 'red', 'coral']], [7, 5, ['rust', 'orange', 'amber']], [10, 6, ['pine', 'leaf', 'white']]] as [number, number, string[]][]) { s.ball(x, y, 2.4, 2.4, r as unknown as Ramp); s.px(x - 1, y - 1, 'white'); } s.ball(13, 4, 2, 2, ['rust', 'amber', 'yellow']); s.px(12, 3, 'white'); },
      (s) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; s.ball(8 + Math.cos(a) * 4, 6 + Math.sin(a) * 4, 2.6, 2.6, ['orchid', 'coral', 'white']); } s.ball(8, 6, 2.2, 2.2, ['rust', 'amber', 'yellow']); stars(s, [[1, 1], [14, 2], [2, 11], [14, 11]], 'white'); },
      (s) => { s.ball(8, 7, 5.2, 5.4, ['plum', 'bark', 'wood']); s.rect(4, 7, 3, 2, 'amber'); s.rect(9, 7, 3, 2, 'amber'); s.px(4, 7, 'white'); s.px(9, 7, 'white'); s.line(5, 11, 11, 11, 'plum'); s.px(6, 4, 'leaf'); s.px(10, 5, 'leaf'); s.px(8, 10, 'grass'); antler(s, 5, 3, -1, 1.5, ['clay', 'amber', 'yellow'], 'white', 1); antler(s, 11, 3, 1, 1.5, ['clay', 'amber', 'yellow'], 'white', 1); s.ball(8, 2, 1.6, 1.6, ['orchid', 'coral', 'white']); },
    ],
  ],
  alchemist: [
    // A Brews
    [
      (s) => { flask(s, 8, 8, 5, ACID, 1); s.px(3, 3, 'white'); stars(s, [[13, 3]], 'white'); },
      (s) => { flask(s, 8, 7, 4, ACID, 0); s.poly([[8, 12], [6, 13]], 'leaf'); s.px(8, 12, 'yellow'); s.px(6, 12, 'leaf'); s.px(11, 3, 'leaf'); s.px(12, 2, 'yellow'); s.px(4, 3, 'leaf'); s.px(3, 2, 'yellow'); s.line(13, 10, 13, 12, 'leaf'); s.px(13, 12, 'white'); },
      (s) => { flask(s, 8, 8, 4, ['crimson', 'red', 'coral'], 1); s.line(8, 0, 8, 2, 'white'); s.px(7, 1, 'white'); s.px(9, 1, 'white'); s.line(2, 5, 4, 3, 'white'); s.line(14, 5, 12, 3, 'white'); },
      (s) => { s.ball(8, 8, 5, 4.4, RAMPS.iron); s.ellipse(8, 5, 5, 1.6, 'orange'); s.px(5, 5, 'yellow'); s.px(10, 4, 'coral'); flame(s, 8, 12, 3, 1, 'orange', 'amber', 'yellow'); s.rect(3, 4, 10, 1, 'stone'); stars(s, [[3, 1], [13, 1], [8, 0]], 'yellow'); },
      (s) => { s.ball(8, 7, 4.6, 4.6, ['stone', 'silver', 'white']); s.ball(8, 7.5, 3.6, 3.6, ['rust', 'amber', 'yellow']); s.rect(7, 0, 3, 3, 'silver'); s.rect(7, 0, 3, 1, 'yellow'); s.line(3, 11, 4, 9, 'white'); s.line(4, 9, 5, 11, 'white'); s.line(5, 11, 6, 9, 'white'); s.line(11, 11, 12, 9, 'yellow'); s.px(1, 6, 'yellow'); s.px(14, 4, 'white'); s.ring(8, 7, 7, 6, 'yellow'); },
    ],
    // B Unstable
    [
      (s) => { s.poly([[8, 1], [12, 7], [8, 12], [4, 7]], (x) => (x < 8 ? 'yellow' : 'leaf')); s.px(6, 7, 'white'); s.px(7, 8, 'white'); s.ring(13, 2, 1.4, 1.4, 'yellow'); s.px(2, 3, 'leaf'); s.px(14, 11, 'leaf'); s.px(3, 10, 'yellow'); },
      (s) => { flask(s, 8, 8, 5, ['plum', 'violet', 'orchid'], 0, { skull: true }); stars(s, [[13, 2], [2, 3]], 'orchid'); },
      (s) => { flask(s, 8, 8, 4, ['crimson', 'red', 'coral'], 1, { fuse: true }); s.poly([[1, 3], [4, 3], [2.5, 0]], 'yellow'); s.px(2, 2, 'ink'); stars(s, [[13, 6], [3, 11], [13, 11]], 'orange'); },
      (s) => { s.ball(5, 9, 4, 3.4, HULK_); s.rect(2, 6, 7, 2, 'leaf'); for (const x of [3, 5, 7]) s.px(x, 6, 'pine'); flask(s, 12, 7, 3, ['violet', 'orchid', 'coral'], 0); s.px(4, 8, 'white'); },
      (s) => { s.ball(8, 7, 5.4, 5, HULK_); s.rect(4, 5, 3, 2, 'red'); s.rect(9, 5, 3, 2, 'red'); s.px(4, 5, 'white'); s.px(9, 5, 'white'); s.rect(4, 9, 8, 2, 'ink'); for (const x of [5, 8, 10]) s.px(x, 9, 'white'); s.rect(3, 0, 10, 2, 'bark'); s.ball(5, 1, 1.6, 1.6, ['dusk', 'stone', 'silver']); s.ball(11, 1, 1.6, 1.6, ['dusk', 'stone', 'silver']); },
    ],
    // C Gold
    [
      (s) => { s.line(2, 11, 8, 5, 'skin', 2); s.rect(8, 3, 3, 3, 'skin'); flask(s, 12, 4, 2, ACID, 0); for (const y of [7, 9, 11]) s.line(0, y, 3, y, 'white'); s.rect(5, 8, 3, 3, 'amber'); s.px(5, 8, 'yellow'); },
      (s) => { s.ellipse(8, 10, 7, 2.4, 'pine'); s.ellipse(8, 10, 6, 1.6, 'leaf'); s.px(5, 10, 'yellow'); s.px(10, 9, 'white'); s.ring(11, 10, 1.2, 1, 'yellow'); s.box(2, 1, 5, 6, ['pine', 'grass', 'leaf']); s.px(4, 3, 'ink'); s.px(5, 4, 'ink'); s.px(4, 4, 'white'); s.line(6, 7, 7, 9, 'silver'); },
      (s) => { s.box(1, 6, 6, 5, RAMPS.steel); s.rect(1, 6, 6, 1, 'white'); s.rect(9, 6, 6, 5, 'yellow'); s.box(9, 6, 6, 5, RAMPS.gold); s.rect(9, 6, 6, 1, 'white'); s.line(7, 8, 8, 8, 'white'); s.px(8, 7, 'white'); s.px(8, 9, 'white'); stars(s, [[12, 3], [14, 11]], 'yellow'); },
      (s) => { s.ball(8, 8, 4.4, 4.4, RAMPS.gold); s.rect(5, 4, 6, 1, 'white'); s.rect(4, 9, 8, 1, 'yellow'); s.rect(2, 3, 3, 4, 'yellow'); s.rect(2, 3, 3, 1, 'white'); for (let i = 0; i < 3; i++) s.px(3, 4 + i, 'amber'); coin(s, 13, 3); coin(s, 13, 9); stars(s, [[8, 1], [1, 10]], 'white'); },
      (s) => { flask(s, 8, 8, 4, ['violet', 'orchid', 'ice'], 0); for (const [x, y, dx, dy] of [[1, 2, 2, 2], [15, 2, -2, 2], [1, 12, 2, -2], [15, 12, -2, -2]] as [number, number, number, number][]) { s.line(x, y, x + dx, y + dy, 'coral'); s.px(x + dx, y + dy, 'white'); } s.ball(8, 1, 1.4, 1.4, ['crimson', 'red', 'coral']); },
    ],
  ],
};

export function iconUpgradeRaster(type: TowerType, path: 0 | 1 | 2, tier: number): { rows: string[]; ax: number; ay: number } {
  const t = Math.max(1, Math.min(5, tier));
  const s = new Surface(ICON, ICON);
  panel(s, PATH_ACCENT[path], t);
  const d = new Surface(ICON, ICON);
  DRAW[baseLook(type)][path][t - 1](d);
  // Piktogramm nur in der oberen Flaeche (ueber den Pips)
  d.mask((x, y) => y < 13 && x >= 0 && x < 16);
  s.blit(d);
  return { rows: s.toRows(), ax: 0, ay: 0 };
}

const ABIL: Record<BaseAbilityId, Draw> = {
  arrowRain: (s) => { for (const [x, y] of [[3, 3], [7, 1], [11, 4], [5, 7], [9, 8], [13, 9]]) { s.line(x, y, x, y + 4, 'yellow'); s.px(x, y + 5, 'white'); s.px(x - 1, y, 'red'); s.px(x + 1, y, 'red'); } s.rect(1, 12, 14, 1, 'amber'); },
  absoluteZero: (s) => { snowI(s, 8, 8, 6, 'ice'); s.ring(8, 8, 7, 7, 'white'); s.px(8, 8, 'white'); },
  flare: (s) => { s.ball(8, 8, 4, 4, ['yellow', 'white', 'white']); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; s.line(8 + Math.cos(a) * 5.5, 8 + Math.sin(a) * 5.5, 8 + Math.cos(a) * 7.5, 8 + Math.sin(a) * 7.5, i % 2 ? 'amber' : 'yellow'); } },
  grant: (s) => { s.rect(2, 2, 9, 11, 'sand'); s.rect(2, 2, 9, 1, 'white'); for (const y of [4, 6, 8]) s.rect(4, y, 5, 1, 'stone'); s.ball(11, 10, 3, 3, RAMPS.red); s.px(11, 10, 'yellow'); s.px(10, 9, 'white'); s.ball(12, 3, 2, 2, ['rust', 'amber', 'yellow']); s.px(11, 2, 'white'); },
  focus: (s) => { s.ring(8, 8, 5, 5, 'yellow'); for (const sg of [-1, 1]) { s.line(8 + sg * 7, 8, 8 + sg * 3, 8, 'amber'); s.line(8, 8 + sg * 7, 8, 8 + sg * 3, 'amber'); } s.px(8, 8, 'white'); s.rect(7, 7, 3, 3, 'red'); s.px(8, 8, 'white'); for (const y of [3, 13]) s.line(0, y, 3, y, 'white'); },
  supplyDrop: (s) => { s.ball(8, 4, 6, 3.4, ['sky', 'ice', 'white']); s.rect(2, 4, 12, 1, 'navy'); s.line(3, 5, 6, 10, 'white'); s.line(13, 5, 10, 10, 'white'); s.line(8, 5, 8, 10, 'white'); s.box(5, 10, 6, 5, RAMPS.wood); s.rect(5, 12, 6, 1, 'amber'); s.px(8, 11, 'yellow'); },
  wallOfTrees: (s) => { for (const [x, h] of [[3, 8], [8, 11], [13, 8]] as [number, number][]) { s.rect(x - 1, 14 - h + 3, 2, h - 3, 'bark'); s.px(x - 1, 14 - h + 3, 'wood'); s.ball(x, 14 - h + 2, 3.4, 3.2, ['pine', 'grass', 'leaf']); s.px(x - 1, 14 - h + 1, 'white'); } s.rect(0, 14, 16, 1, 'deep'); for (const x of [2, 6, 10, 14]) s.px(x, 13, 'white'); },
  transformingTonic: (s) => { flask(s, 4, 9, 3, ['violet', 'orchid', 'coral'], 0); s.ball(11, 7, 4.4, 4.2, HULK_); s.rect(8, 4, 7, 2, 'leaf'); for (const x of [9, 11, 13]) s.px(x, 4, 'pine'); s.px(9, 7, 'white'); s.rect(9, 11, 5, 3, 'pine'); stars(s, [[2, 2], [8, 1]], 'white'); },
  dawnbreak: (s) => { s.rect(0, 5, 16, 6, 'amber'); s.rect(0, 6, 16, 4, 'yellow'); s.rect(0, 7, 16, 2, 'white'); for (const x of [2, 7, 12]) { s.px(x, 3, 'yellow'); s.px(x + 2, 12, 'amber'); } s.ellipse(14, 8, 2, 4, 'white'); },
};

export function iconAbilityRaster(idIn: AbilityId): { rows: string[]; ax: number; ay: number } {
  const id = ABILITY_LOOK[idIn];
  const s = new Surface(ICON, ICON);
  const col: PalName = { arrowRain: 'amber', absoluteZero: 'sky', flare: 'yellow', dawnbreak: 'orange', grant: 'yellow', focus: 'red', supplyDrop: 'sky', wallOfTrees: 'leaf', transformingTonic: 'orchid' }[id] as PalName;
  s.rect(0, 0, 16, 16, 'night'); s.rect(0, 0, 16, 1, col); s.rect(0, 0, 1, 16, col); s.rect(0, 15, 16, 1, 'ink'); s.rect(15, 0, 1, 16, 'ink');
  for (const [x, y] of [[0, 0], [15, 0], [0, 15], [15, 15]]) s.px(x, y, null);
  const d = new Surface(16, 16);
  ABIL[id](d);
  s.blit(d);
  return { rows: s.toRows(), ax: 0, ay: 0 };
}
void flake;
