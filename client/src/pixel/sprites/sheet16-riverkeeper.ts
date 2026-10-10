/** Sprite-Boegen Runde 16 TP: Riverkeeper (nur Entwicklung/Screenshots). Eingebunden von sheet.ts, Bilder macht scripts/shots-r16-tp-riverkeeper.mjs. */
import * as api from './index';
import type { Tiers, TowerFrame } from './index';
import { LEVIATHAN_FRAMES, leviathanStrikeRaster } from './riverkeeper';
import { rowsToCanvas } from './canvas';

const WATER = '#1d6fa8', PANEL = '#262b44';
function mk(w: number, h: number, bg = PANEL): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  return { c, g };
}
function blit(g: CanvasRenderingContext2D, s: api.Sprite, x: number, y: number, k: number): void {
  g.drawImage(s.canvas, x - s.ax * k, y - s.ay * k, s.canvas.width * k, s.canvas.height * k);
}
function label(g: CanvasRenderingContext2D, t: string, x: number, y: number, col = '#fff'): void { g.fillStyle = col; g.font = '12px monospace'; g.fillText(t, x, y); }
function tile(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col = WATER): void { g.fillStyle = col; g.fillRect(x, y, w, h); }

export const RK_NAMES: string[][] = [
  ['Base', 'Barbed Harpoons', 'Harpoon Volley', 'Tidal Steel', 'Whaler', 'Tidal Lance'],
  ['Base', 'Sonar Ping', 'Sonar Array', 'Riptide', 'Deep Current', 'Leviathan Call'],
  ['Base', 'Deck Gun', 'Lantern Ship', 'Broadside', "Man o' War", 'Dusk Armada'],
];
const tiersOf = (p: number, t: number): Tiers => { const r: Tiers = [0, 0, 0]; r[p] = t; return r; };
const K = 3, CW = 96 * K, CH = 80 * K;

function cell(g: CanvasRenderingContext2D, i: number, cols: number, x0: number, y0: number, t: Tiers, facing: number, frame: TowerFrame, text: string): void {
  const x = x0 + (i % cols) * CW, y = y0 + Math.floor(i / cols) * CH;
  tile(g, x, y, CW - 4, CH - 4);
  blit(g, api.towerSprite('riverkeeper', t, facing, frame), x + (CW - 4) / 2 - 0 * K, y + 71 * K, K);
  label(g, text, x + 5, y + 14);
}

/** Alle Stufen je Pfad (T0..T5) und gemischte Crosspaths, Blick nach rechts. */
export function sheetRkPaths(): HTMLCanvasElement {
  const mixes: Tiers[] = [[3, 2, 0], [0, 2, 4], [2, 0, 5], [4, 0, 2], [0, 3, 2], [2, 5, 0]];
  const { c, g } = mk(6 * CW + 20, 4 * CH + 20);
  let i = 0;
  for (let p = 0; p < 3; p++) for (let t = 0; t <= 5; t++) cell(g, i++, 6, 10, 10, tiersOf(p, t), 0, 'idle1', `${'ABC'[p]}${t} ${RK_NAMES[p][t]}`);
  for (const m of mixes) cell(g, i++, 6, 10, 10, m, 0, 'idle1', `mix ${m.join('-')}`);
  return c;
}
/** Acht Richtungen fuer je eine Stufe 3 und Stufe 5 jedes Pfades. */
export function sheetRkDirs(): HTMLCanvasElement {
  const sets: Tiers[] = [[3, 0, 0], [5, 0, 0], [0, 3, 0], [0, 5, 0], [0, 0, 3], [0, 0, 5]];
  const { c, g } = mk(8 * CW + 20, sets.length * CH + 20);
  sets.forEach((t, r) => { for (let d = 0; d < 8; d++) cell(g, r * 8 + d, 8, 10, 10, t, d, 'idle1', `${t.join('-')} facing ${d}`); });
  return c;
}
/** Idle- und Angriffsframes. */
export function sheetRkFrames(): HTMLCanvasElement {
  const sets: Tiers[] = [[0, 0, 0], [3, 0, 0], [5, 0, 0], [0, 3, 0], [0, 5, 0], [0, 0, 1], [0, 0, 3], [0, 0, 5]];
  const frames: TowerFrame[] = ['idle0', 'idle1', 'idle2', 'idle3', 'atk0', 'atk1', 'atk2', 'atk3'];
  const { c, g } = mk(8 * CW + 20, sets.length * CH + 20);
  sets.forEach((t, r) => frames.forEach((f, i) => cell(g, r * 8 + i, 8, 10, 10, t, 0, f, `${t.join('-')} ${f}`)));
  return c;
}
/** Upgrade-Icons, Portraet, Geschosse, Leviathan-Schlag. */
export function sheetRkIcons(): HTMLCanvasElement {
  const IK = 5, S = 16 * IK + 24;
  const { c, g } = mk(5 * S + 40, 3 * S + 780);
  label(g, 'riverkeeper icons', 10, 14, '#fee761');
  for (let p = 0; p < 3; p++) for (let n = 1; n <= 5; n++) {
    blit(g, api.iconUpgrade('riverkeeper', p as 0, n), 10 + (n - 1) * S, 24 + p * S, IK);
    label(g, RK_NAMES[p][n].slice(0, 13), 10 + (n - 1) * S, 24 + p * S + 16 * IK + 12, '#c0cbdc');
  }
  let y = 3 * S + 40;
  label(g, 'Portrait x4, Geschosse harpoon / cannonball (16 Richtungen)', 10, y);
  tile(g, 10, y + 8, 150, 130); blit(g, api.towerPortrait('riverkeeper'), 85, y + 128, 3);
  (['harpoon', 'cannonball'] as const).forEach((k, r) => { for (let d = 0; d < 16; d++) blit(g, api.projectileSprite(k, d), 200 + d * 24, y + 40 + r * 60, 1.5); label(g, k, 190, y + 14 + r * 60); });
  y += 160;
  label(g, 'Leviathan-Schlag (9 Bilder)', 10, y);
  for (let f = 0; f < LEVIATHAN_FRAMES; f++) { tile(g, 10 + (f % 5) * S, y + 8 + Math.floor(f / 5) * 260, S - 4, 250); const r = leviathanStrikeRaster(f); blit(g, rowsToCanvas(r.rows, r.ax, r.ay), 10 + (f % 5) * S + (S - 4) / 2, y + 8 + Math.floor(f / 5) * 260 + 235, 3); }
  return c;
}
