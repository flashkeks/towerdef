/** Sprite-Boegen Runde 15e (nur Entwicklung/Screenshots): Gloom Cruiser, Duskrunner, Dusk Dreadnought. Eingebunden von sheet.ts. */
import * as api from './index';
import type { EnemyType } from './types';

const GRASS = '#3e8948', PANEL = '#262b44';
function mk(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  g.fillStyle = PANEL; g.fillRect(0, 0, w, h);
  return { c, g };
}
function blit(g: CanvasRenderingContext2D, s: api.Sprite, x: number, y: number, k: number): void {
  g.drawImage(s.canvas, x - s.ax * k, y - s.ay * k, s.canvas.width * k, s.canvas.height * k);
}
function label(g: CanvasRenderingContext2D, t: string, x: number, y: number): void {
  g.fillStyle = '#fff'; g.font = '12px monospace'; g.fillText(t, x, y);
}
function tile(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col = GRASS): void {
  g.fillStyle = col; g.fillRect(x, y, w, h);
}
type Ship = 'cruiser' | 'duskrunner' | 'dreadnought';
const STAGES: Record<Ship, number> = { cruiser: 2, duskrunner: 2, dreadnought: 3 };

/** Laufframes, Schadensstufen, Camo, Treffer-Blitz, Merkmale, flip: ein Streifen je Schiff. */
function shipRows(g: CanvasRenderingContext2D, t: Ship, y0: number, k: number, W: number): number {
  const sp = api.enemySprite(t, 0);
  const cw = sp.canvas.width * k + 10, ch = sp.canvas.height * k + 10;
  let y = y0;
  const cell = (i: number, row: number, s: api.Sprite, shadowKind = true): void => {
    const x = 10 + i * cw, yy = y + row * ch;
    tile(g, x, yy, cw - 6, ch - 4);
    const bx = x + sp.ax * k + 2, by = yy + sp.ay * k - 4;
    if (shadowKind) blit(g, api.fx.shipShadow(t, 0), bx, by, k);
    blit(g, s, bx, by, k);
  };
  label(g, `${t}: Lauf-Frames 0-3`, 10, y - 4);
  const per = Math.max(1, Math.floor((W - 20) / cw));
  void per;
  for (let f = 0; f < 4; f++) cell(f, 0, api.enemySprite(t, f));
  y += ch + 18;
  label(g, `${t}: Schadensstufen 0..${STAGES[t]} | Treffer-Blitz | Camo (Stufe 0 / 1) | flip`, 10, y - 4);
  const n = STAGES[t] + 1;
  for (let st = 0; st < n; st++) cell(st, 0, api.enemySprite(t, 1, { damageStage: st }));
  cell(n, 0, api.enemySprite(t, 1, { hitFlash: true }));
  cell(n + 1, 0, api.enemySprite(t, 1, { camo: true }));
  if (n + 2 < Math.floor((W - 20) / cw)) cell(n + 2, 0, api.enemySprite(t, 1, { camo: true, damageStage: 1 }));
  y += ch + 18;
  label(g, `${t}: Stufe max | Camo + max | Regrow | Fortified | beide + Camo | flip`, 10, y - 4);
  cell(0, 0, api.enemySprite(t, 2, { damageStage: STAGES[t] }));
  cell(1, 0, api.enemySprite(t, 2, { damageStage: STAGES[t], camo: true }));
  cell(2, 0, api.enemySprite(t, 1, { regrow: true }));
  cell(3, 0, api.enemySprite(t, 1, { fortified: true }));
  y += ch + 18;
  cell(0, 0, api.enemySprite(t, 1, { regrow: true, fortified: true, camo: true }));
  cell(1, 0, api.enemySprite(t, 1, { flip: true }));
  return y + ch + 24;
}

export function sheetGegnerR15e(): HTMLCanvasElement {
  const { c, g } = mk(1500, 3900);
  tile(g, 0, 0, 1500, 3900, PANEL);
  let y = 30;
  y = shipRows(g, 'cruiser', y, 3, 1500);
  y = shipRows(g, 'duskrunner', y, 4, 1500);
  y = shipRows(g, 'dreadnought', y, 3, 1500);
  const out = mk(1500, y);
  out.g.drawImage(c, 0, 0);
  return out.c;
}

/** Spielmassstab x2: alle Schiffe/Bosse nebeneinander, Boden-Linie, Schatten. */
export function sheetVergleichR15e(): HTMLCanvasElement {
  const { c, g } = mk(1700, 560);
  tile(g, 0, 0, 1700, 560);
  label(g, 'Spielmassstab x2 (Anker = Bodenpunkt): pink, brute, crystal | gloomship, cruiser, duskrunner, dreadnought | wyrm, colossus, leviathan', 10, 16);
  const line: EnemyType[] = ['pink', 'brute', 'crystal', 'gloomship', 'cruiser', 'duskrunner', 'dreadnought', 'wyrm', 'colossus', 'leviathan'];
  let x = 20;
  const gy = 300;
  line.forEach((t) => {
    const s = api.enemySprite(t, 1);
    const wide = s.canvas.width * 2;
    const ax = x + s.ax * 2;
    const ship = t === 'gloomship' || t === 'cruiser' || t === 'duskrunner' || t === 'dreadnought';
    if (ship) blit(g, api.fx.shipShadow(t as api.ShipKind, 1), ax, gy, 2);
    else if (t === 'wyrm' || t === 'colossus') blit(g, api.shadowSprite(40, 10), ax, gy - 4, 2);
    blit(g, s, ax, gy, 2);
    x += wide + 6;
  });
  // Rasterlinie fuer die Hoehen: 360er Feldhoehe zum Vergleich
  label(g, 'Gleiches in x1 (Feld 640 x 360 = 640 x 360 px hier):', 10, 340);
  tile(g, 10, 350, 640, 200);
  x = 20;
  line.forEach((t) => {
    const s = api.enemySprite(t, 1);
    const ship = t === 'gloomship' || t === 'cruiser' || t === 'duskrunner' || t === 'dreadnought';
    if (ship) blit(g, api.fx.shipShadow(t as api.ShipKind, 1), x + s.ax, 520, 1);
    blit(g, s, x + s.ax, 520, 1);
    x += s.canvas.width + 4;
  });
  return c;
}

export function sheetFxR15e(): HTMLCanvasElement {
  const { c, g } = mk(2200, 2200);
  tile(g, 0, 0, 2200, 2200);
  let y = 14;
  label(g, 'Schatten (gloomship, cruiser, duskrunner, dreadnought), Frame 0-3', 10, y);
  (['gloomship', 'cruiser', 'duskrunner', 'dreadnought'] as api.ShipKind[]).forEach((k, i) => {
    for (let f = 0; f < 4; f++) blit(g, api.fx.shipShadow(k, f), 70 + i * 520 + f * 120, y + 40, 1);
  });
  y += 70;
  label(g, 'Cruiser-Absturz (10 Frames)', 10, y);
  for (let f = 0; f < 10; f++) { tile(g, 10 + (f % 5) * 430, y + 10 + Math.floor(f / 5) * 260, 424, 254, '#4a9a55'); blit(g, api.fx.shipCrash('cruiser', f), 220 + (f % 5) * 430, y + 10 + 245 + Math.floor(f / 5) * 260 - 0, 2); }
  y += 10 + 2 * 260 + 20;
  return c.height >= y ? c : c;
}

export function sheetFx2R15e(): HTMLCanvasElement {
  const { c, g } = mk(2200, 1700);
  tile(g, 0, 0, 2200, 1700);
  let y = 14;
  label(g, 'Dreadnought-Absturz (10 Frames, x1.5 = Spielmassstab x1.5)', 10, y);
  for (let f = 0; f < 10; f++) { tile(g, 10 + (f % 5) * 430, y + 10 + Math.floor(f / 5) * 250, 424, 244, '#4a9a55'); blit(g, api.fx.shipCrash('dreadnought', f), 220 + (f % 5) * 430, y + 10 + 235 + Math.floor(f / 5) * 250, 1.5); }
  y += 10 + 2 * 250 + 24;
  label(g, 'Duskrunner-Nachzieher (4 Frames) + Schiff, x3 | flip', 10, y);
  for (let f = 0; f < 4; f++) {
    tile(g, 10 + f * 340, y + 10, 330, 140);
    blit(g, api.fx.shipShadow('duskrunner', f), 200 + f * 340, y + 130, 3);
    blit(g, api.fx.duskTrail(f), 200 + f * 340, y + 130, 3);
    blit(g, api.enemySprite('duskrunner', f, { camo: true }), 200 + f * 340, y + 130, 3);
  }
  for (let f = 0; f < 2; f++) {
    tile(g, 1380 + f * 340, y + 10, 330, 140);
    blit(g, api.fx.duskTrail(f, true), 1540 + f * 340, y + 130, 3);
    blit(g, api.enemySprite('duskrunner', f, { flip: true, camo: true }), 1540 + f * 340, y + 130, 3);
  }
  y += 170;
  label(g, 'Eisblock (fx.status freeze), Platzen (6 Frames): cruiser, duskrunner, dreadnought', 10, y);
  (['cruiser', 'duskrunner', 'dreadnought'] as EnemyType[]).forEach((t, i) => {
    tile(g, 10 + i * 700, y + 10, 330, 200);
    const sp = api.enemySprite(t, 1);
    const k = t === 'duskrunner' ? 3 : 2;
    blit(g, sp, 10 + i * 700 + 165 - 0, y + 190, k);
    const lift = t === 'duskrunner' ? 17 : 43; // Bodenpunkt -> Rumpfmitte
    blit(g, api.fx.status('freeze', 1, t), 10 + i * 700 + 165, y + 190 - lift * k, k);
    for (let f = 0; f < 6; f++) { tile(g, 350 + i * 700 + (f % 3) * 112, y + 10 + Math.floor(f / 2) * 0, 108, 200 / 2 * 2, '#4a9a55'); }
    for (let f = 0; f < 6; f++) blit(g, api.fx.popShards(t, f), 350 + i * 700 + (f % 3) * 112 + 54, y + 60 + Math.floor(f / 3) * 100, 1);
  });
  return c;
}
